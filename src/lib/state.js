// lib/state.js — Mock data, keyframed tracking, and a tiny store hook.
// In production, replace MOCK_TRACKS with whatever Roboflow returns.
// useStore() is a useState-on-localStorage hook so demos survive refresh.

window.SAMPLE_VIDEO_URL =
  'https://tmpfiles.org/dl/36207473/2026-05-0301-18-05.mp4';
// Public fallback if the primary host blocks us.
window.SAMPLE_VIDEO_FALLBACK =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

// ─── Players (jerseys, role, side) ──────────────────────────────────────────
window.MOCK_PLAYERS = [
  { id: 7,  role: 'Right wing',     side: 'home' },
  { id: 9,  role: 'Scrum-half',     side: 'home' },
  { id: 10, role: 'Fly-half',       side: 'home' },
  { id: 12, role: 'Inside centre',  side: 'home' },
  { id: 13, role: 'Outside centre', side: 'home' },
  { id: 14, role: 'Left wing',      side: 'home' },
  { id: 15, role: 'Fullback',       side: 'home' },
  { id: 4,  role: 'Lock',           side: 'home' },
  { id: 22, role: 'Wing',           side: 'away' },
  { id: 23, role: 'Wing',           side: 'away' },
  { id: 24, role: 'Centre',         side: 'away' },
  { id: 25, role: 'Fly-half',       side: 'away' },
];

// Keyframed (t in seconds → {x,y in 0..1}). Linear interp between frames.
// Modeled to roughly look like a scrum-released phase: the line drifts
// slightly forward, wings drift inward, ball moves 9 → 10 → out wide.
window.MOCK_TRACKS = {
  7:  [[0, 0.82, 0.36], [3, 0.82, 0.34], [9.4, 0.84, 0.32]],
  9:  [[0, 0.46, 0.60], [2, 0.46, 0.58], [4, 0.42, 0.56], [9.4, 0.36, 0.54]],
  10: [[0, 0.40, 0.48], [3, 0.40, 0.46], [5, 0.38, 0.44], [9.4, 0.34, 0.42]],
  12: [[0, 0.55, 0.44], [4, 0.55, 0.42], [9.4, 0.52, 0.40]],
  13: [[0, 0.66, 0.40], [4, 0.66, 0.38], [9.4, 0.64, 0.36]],
  14: [[0, 0.20, 0.32], [4, 0.20, 0.30], [9.4, 0.22, 0.28]],
  15: [[0, 0.50, 0.78], [9.4, 0.52, 0.76]],
  4:  [[0, 0.62, 0.68], [4, 0.62, 0.66], [9.4, 0.60, 0.64]],
  22: [[0, 0.71, 0.23], [4, 0.71, 0.21], [9.4, 0.69, 0.19]],
  23: [[0, 0.34, 0.22], [4, 0.34, 0.20], [9.4, 0.32, 0.18]],
  24: [[0, 0.50, 0.16], [9.4, 0.48, 0.14]],
  25: [[0, 0.40, 0.18], [9.4, 0.38, 0.16]],
};

window.trackAt = function trackAt(playerId, t) {
  const kfs = window.MOCK_TRACKS[playerId];
  if (!kfs) return null;
  if (t <= kfs[0][0]) return { x: kfs[0][1], y: kfs[0][2] };
  if (t >= kfs[kfs.length - 1][0]) return { x: kfs.at(-1)[1], y: kfs.at(-1)[2] };
  for (let i = 0; i < kfs.length - 1; i++) {
    const [t0, x0, y0] = kfs[i], [t1, x1, y1] = kfs[i + 1];
    if (t >= t0 && t <= t1) {
      const r = (t - t0) / (t1 - t0);
      return { x: x0 + (x1 - x0) * r, y: y0 + (y1 - y0) * r };
    }
  }
  return null;
};

// ─── Persistent store ───────────────────────────────────────────────────────
const STORAGE_KEY = 'replay_demo_state_v1';

const DEFAULT_STATE = {
  video: null,                  // { video_id, filename, duration, ... }
  focusPrompt: '',
  analysis: null,               // result from /analyse
  corrections: [],              // [{ id, playerId, frameTime, fromX, fromY, toX, toY, note }]
  globalPrompt: 'Everyone should rush the defensive line faster once the scrum is complete.',
  generation: null,             // result from /generate
  annotations: [],              // [{ id, type, t, x, y, text?, path? }]
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}
function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

// Tiny pub-sub so screens stay in sync without a router-level provider.
const listeners = new Set();
let _state = loadState();
function setState(patch) {
  _state = typeof patch === 'function' ? patch(_state) : { ..._state, ...patch };
  saveState(_state);
  listeners.forEach((fn) => fn(_state));
}
function getState() { return _state; }

window.store = {
  get: getState,
  set: setState,
  reset() { setState({ ...DEFAULT_STATE }); },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

// React hook
window.useStore = function useStore() {
  const [s, set] = React.useState(getState());
  React.useEffect(() => window.store.subscribe(set), []);
  return [s, setState];
};

// ─── Hash router ────────────────────────────────────────────────────────────
window.useRoute = function useRoute() {
  const parse = () => {
    const h = (location.hash || '#/upload').replace(/^#/, '');
    const parts = h.split('/').filter(Boolean);
    return { name: parts[0] || 'upload', param: parts[1] || null, raw: h };
  };
  const [route, setRoute] = React.useState(parse());
  React.useEffect(() => {
    const onHash = () => setRoute(parse());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
};
window.navigate = function (path) {
  location.hash = path.startsWith('#') ? path : '#' + path;
};

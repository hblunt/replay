import { useEffect, useState } from 'react';

// Pre-hosted demo clip — Stage 1 uses this URL directly with Seedance.
// Update before demo if the host expires the file.
export const SAMPLE_VIDEO_URL =
  'https://tmpfiles.org/dl/36213011/lineoutexample.mp4';
export const SAMPLE_VIDEO_FALLBACK =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

const STORAGE_KEY = 'replay_demo_state_v2';

const DEFAULT_STATE = {
  video: null,                  // { video_id, filename, duration, url, ... }
  focusPrompt: '',
  analysis: null,               // mocked summary text in Stage 1
  globalPrompt: 'Everyone should rush the defensive line faster once the lineout is complete.',
  generation: null,             // { regenerated_url, refined_prompt, duration_s }
  annotations: [],              // [{ id, side: 'orig'|'new'|'input', type, t, x, y, text?, path? }]
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
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {
    /* ignore */
  }
}

const listeners = new Set();
let _state = loadState();

export function getState() { return _state; }
export function setState(patch) {
  _state = typeof patch === 'function' ? patch(_state) : { ..._state, ...patch };
  saveState(_state);
  listeners.forEach((fn) => fn(_state));
}
export function resetState() { setState({ ...DEFAULT_STATE }); }
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function useStore() {
  const [s, set] = useState(getState());
  useEffect(() => subscribe(set), []);
  return [s, setState];
}

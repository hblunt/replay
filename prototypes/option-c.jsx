// Option C — Soft mono
// Warm paper background, near-black ink, single sage accent. Calm, Linear/Things-like.

function OptionC() {
  const [selectedPlayer, setSelectedPlayer] = React.useState(7);
  const players = [
    { id: 7,  x: 0.82, y: 0.34, role: "Right wing",  color: "home" },
    { id: 9,  x: 0.46, y: 0.58, role: "Scrum-half",  color: "home" },
    { id: 10, x: 0.40, y: 0.46, role: "Fly-half",    color: "home" },
    { id: 12, x: 0.55, y: 0.42, role: "Inside centre", color: "home" },
    { id: 14, x: 0.20, y: 0.30, role: "Left wing",   color: "home" },
    { id: 4,  x: 0.62, y: 0.66, role: "Lock",        color: "home" },
    { id: 22, x: 0.71, y: 0.21, role: "Opp wing",    color: "away" },
    { id: 23, x: 0.34, y: 0.20, role: "Opp wing",    color: "away" },
  ];
  const sel = players.find(p => p.id === selectedPlayer);

  const corrections = [
    { id: 7,  note: "Rush the line as #10 receives.", trig: "#10 receives" },
    { id: 14, note: "Hold depth, then jam in.",       trig: "#10 receives" },
  ];

  return (
    <div style={c.root}>
      {/* Slim chrome */}
      <header style={c.chrome}>
        <div style={c.chromeL}>
          <div style={c.logo}>
            <div style={c.logoMark}/>
            <span>Replay</span>
          </div>
          <nav style={c.nav}>
            <span style={c.navItem}>1 · Upload</span>
            <span style={{...c.navItem, ...c.navActive}}>2 · Analyse</span>
            <span style={c.navItem}>3 · Generate</span>
          </nav>
        </div>
        <div style={c.chromeR}>
          <span style={c.fileChip}>
            <span style={c.fileDot}/>
            saints_v_brumbies_03.mp4
          </span>
          <button style={c.regen}>
            <span>Regenerate</span>
            <span style={c.regenArrow}>↗</span>
          </button>
        </div>
      </header>

      <div style={c.body}>
        {/* Left column — analysis */}
        <aside style={c.left}>
          <div style={c.kicker}>Summary</div>
          <h2 style={c.h2}>What's happening</h2>
          <p style={c.p}>
            The scrum is complete and #9 has the ball. Eight defenders form a
            line at +5m. Both wings — #7 and #14 — sit roughly 4m behind that
            line and don't push up when the fly-half receives.
          </p>

          <div style={c.statRow}>
            <Stat label="Players" value="12" />
            <Stat label="Frames"  value="142" />
            <Stat label="Speed"   value="2.1 m/s" sub="line" />
            <Stat label="Issues"  value="2" sub="flagged" />
          </div>

          <div style={c.kicker}>Corrections</div>
          {corrections.map(co => (
            <button
              key={co.id}
              onClick={() => setSelectedPlayer(co.id)}
              style={{
                ...c.corrCard,
                background: selectedPlayer === co.id ? '#fff' : 'transparent',
                boxShadow: selectedPlayer === co.id
                  ? '0 1px 0 rgba(40,38,34,0.04), 0 4px 14px -8px rgba(40,38,34,0.18)'
                  : 'none',
                borderColor: selectedPlayer === co.id ? 'rgba(40,38,34,0.10)' : 'transparent',
              }}
            >
              <div style={c.corrTop}>
                <span style={c.corrPl}>#{co.id}</span>
                <span style={c.corrTrig}>{co.trig}</span>
              </div>
              <div style={c.corrNote}>{co.note}</div>
            </button>
          ))}

          <button style={c.addCorr}>
            <span>+</span> Add correction
          </button>
        </aside>

        {/* Center — pitch + scrubber */}
        <main style={c.center}>
          <div style={c.pitchCard}>
            <svg width="100%" height="100%" viewBox="0 0 100 56" preserveAspectRatio="none" style={c.pitchSvg}>
              <defs>
                <pattern id="stripeC" width="6" height="56" patternUnits="userSpaceOnUse">
                  <rect width="3" height="56" fill="#282622" opacity="0.025" />
                </pattern>
              </defs>
              <rect width="100" height="56" fill="#f4f1ea"/>
              <rect width="100" height="56" fill="url(#stripeC)"/>
              <line x1="50" y1="0" x2="50" y2="56" stroke="#282622" strokeOpacity="0.10" strokeWidth="0.15"/>
              <line x1="22" y1="0" x2="22" y2="56" stroke="#282622" strokeOpacity="0.07" strokeDasharray="0.6 0.6" strokeWidth="0.12"/>
              <line x1="78" y1="0" x2="78" y2="56" stroke="#282622" strokeOpacity="0.07" strokeDasharray="0.6 0.6" strokeWidth="0.12"/>
            </svg>

            <div style={c.tagTL}>FOOTAGE PLACEHOLDER</div>

            {players.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPlayer(p.id)}
                style={{
                  ...c.handle,
                  left: `${p.x*100}%`, top: `${p.y*100}%`,
                  background: p.color === 'home' ? '#282622' : 'rgba(40,38,34,0.35)',
                  outline: selectedPlayer === p.id ? '3px solid #c8202c' : 'none',
                  outlineOffset: '3px',
                }}
              >{p.id}</button>
            ))}

            <svg style={c.arrowOverlay} viewBox="0 0 100 56" preserveAspectRatio="none">
              <defs>
                <marker id="arrC" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3" markerHeight="3" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill="#c8202c"/>
                </marker>
              </defs>
              <path d="M 82 34 L 82 17" stroke="#c8202c" strokeWidth="0.45" fill="none" strokeDasharray="1 0.6" markerEnd="url(#arrC)"/>
              <path d="M 20 30 L 20 19" stroke="#c8202c" strokeWidth="0.45" fill="none" strokeDasharray="1 0.6" markerEnd="url(#arrC)"/>
            </svg>
          </div>

          <div style={c.scrubber}>
            <button style={c.play}>▶</button>
            <div style={c.tcWrap}>
              <span style={c.tc}>00:04.2</span>
              <span style={c.tcSep}>/</span>
              <span style={c.tcDim}>00:09.4</span>
            </div>
            <div style={c.scrubTrack}>
              <div style={c.scrubFill}/>
              <div style={c.scrubHandle}/>
              <div style={{...c.scrubMark, left: '46%'}}/>
              <div style={{...c.scrubMark, left: '22%'}}/>
            </div>
          </div>

          {/* Global prompt as a soft card */}
          <div style={c.globalCard}>
            <div style={c.globalLabel}>For the whole clip</div>
            <textarea
              style={c.globalInp}
              defaultValue="Everyone should rush the defensive line faster once the scrum is complete."
              rows={2}
            />
          </div>
        </main>

        {/* Right — selected player */}
        <aside style={c.right}>
          <div style={c.playerHead}>
            <div style={c.playerJersey}>#{sel?.id}</div>
            <div>
              <div style={c.playerRole}>{sel?.role}</div>
              <div style={c.playerMeta}>Frame 21 · 00:04.2</div>
            </div>
          </div>

          <div style={c.fieldGroup}>
            <div style={c.fieldGroupHead}>Position</div>
            <CRow k="From" v="0.82, 0.34" />
            <CRow k="To"   v="0.82, 0.15" accent />
          </div>

          <div style={c.fieldGroup}>
            <div style={c.fieldGroupHead}>Trigger</div>
            <CRow k="When" v="#10 receives the ball" />
          </div>

          <div style={c.fieldGroup}>
            <div style={c.fieldGroupHead}>Note</div>
            <textarea
              style={c.note}
              defaultValue="Should rush the defensive line the moment the flyhalf receives the ball. Hold body angle, don't drift in."
              rows={5}
            />
          </div>

          <div style={c.actionRow}>
            <button style={c.btnGhost}>Reset</button>
            <button style={c.btnSolid}>Save</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div style={c.stat}>
      <div style={c.statValue}>{value}</div>
      <div style={c.statLabel}>{label}{sub && <span style={c.statSub}> · {sub}</span>}</div>
    </div>
  );
}

function CRow({ k, v, accent }) {
  return (
    <div style={c.cRow}>
      <span style={c.cK}>{k}</span>
      <span style={accent ? c.cVAcc : c.cV}>{v}</span>
    </div>
  );
}

const c = {
  root: {
    width: '100%', height: '100%',
    background: '#f4f1ea', color: '#282622',
    fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    fontSize: 13,
  },
  chrome: {
    height: 56, padding: '0 24px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexShrink: 0,
  },
  chromeL: { display: 'flex', alignItems: 'center', gap: 32 },
  logo: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', fontFamily: '"Fraunces", "Times New Roman", serif', fontStyle: 'italic' },
  logoMark: { width: 18, height: 18, borderRadius: 6, background: '#282622', boxShadow: 'inset -3px -3px 0 0 #c8202c' },
  nav: { display: 'flex', alignItems: 'center', gap: 4 },
  navItem: {
    fontSize: 12, color: 'rgba(40,38,34,0.5)',
    padding: '6px 10px', borderRadius: 6,
  },
  navActive: { background: '#fff', color: '#282622', boxShadow: '0 1px 0 rgba(40,38,34,0.04), 0 1px 3px rgba(40,38,34,0.06)' },
  chromeR: { display: 'flex', alignItems: 'center', gap: 12 },
  fileChip: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 12px', borderRadius: 999,
    background: '#fff', boxShadow: '0 1px 0 rgba(40,38,34,0.04), 0 1px 3px rgba(40,38,34,0.06)',
    fontSize: 12,
  },
  fileDot: { width: 6, height: 6, borderRadius: '50%', background: '#c8202c' },
  regen: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: '#282622', color: '#f4f1ea',
    border: 'none', padding: '8px 14px', borderRadius: 8,
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'inherit',
  },
  regenArrow: { fontSize: 14 },

  body: {
    flex: 1, display: 'grid',
    gridTemplateColumns: '300px 1fr 300px',
    gap: 16, padding: '0 16px 16px',
    overflow: 'hidden',
  },

  // LEFT
  left: {
    background: 'transparent',
    padding: '4px 8px',
    overflow: 'auto',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  kicker: {
    fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
    color: 'rgba(40,38,34,0.45)', marginTop: 8,
  },
  h2: { fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' },
  p: { margin: 0, fontSize: 13, lineHeight: 1.55, color: 'rgba(40,38,34,0.7)', textWrap: 'pretty' },
  statRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  stat: {
    background: '#fff', borderRadius: 10, padding: '10px 12px',
    boxShadow: '0 1px 0 rgba(40,38,34,0.04)',
  },
  statValue: { fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' },
  statLabel: { fontSize: 11, color: 'rgba(40,38,34,0.55)' },
  statSub: { color: 'rgba(40,38,34,0.4)' },
  corrCard: {
    textAlign: 'left',
    border: '1px solid transparent',
    borderRadius: 10, padding: '10px 12px',
    cursor: 'pointer', fontFamily: 'inherit', color: 'inherit',
    transition: 'all 0.15s',
  },
  corrTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  corrPl: { fontWeight: 600, fontSize: 13 },
  corrTrig: { fontSize: 10, color: 'rgba(40,38,34,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' },
  corrNote: { fontSize: 12, color: 'rgba(40,38,34,0.7)', marginTop: 4, lineHeight: 1.4 },
  addCorr: {
    background: 'transparent', border: '1px dashed rgba(40,38,34,0.20)',
    borderRadius: 10, padding: '10px 12px', textAlign: 'left',
    fontFamily: 'inherit', fontSize: 12, color: 'rgba(40,38,34,0.55)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
  },

  // CENTER
  center: {
    display: 'flex', flexDirection: 'column', gap: 12,
    overflow: 'hidden',
  },
  pitchCard: {
    flex: 1, position: 'relative', minHeight: 0,
    background: '#fff', borderRadius: 14, overflow: 'hidden',
    boxShadow: '0 1px 0 rgba(40,38,34,0.04), 0 12px 24px -16px rgba(40,38,34,0.20)',
  },
  pitchSvg: { position: 'absolute', inset: 0 },
  arrowOverlay: { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' },
  tagTL: {
    position: 'absolute', top: 12, left: 14,
    fontSize: 10, fontFamily: '"JetBrains Mono", monospace',
    color: 'rgba(40,38,34,0.4)', letterSpacing: '0.06em',
  },
  handle: {
    position: 'absolute', transform: 'translate(-50%,-50%)',
    width: 28, height: 28, borderRadius: '50%',
    color: '#fff', fontSize: 11, fontWeight: 600,
    border: '2px solid #fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(40,38,34,0.20)',
  },

  scrubber: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: '#fff', borderRadius: 12, padding: '8px 14px',
    boxShadow: '0 1px 0 rgba(40,38,34,0.04)',
  },
  play: {
    width: 30, height: 30, borderRadius: '50%',
    background: '#282622', color: '#fff', border: 'none',
    cursor: 'pointer', fontSize: 10, paddingLeft: 2,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  tcWrap: { display: 'flex', alignItems: 'baseline', gap: 6, fontFamily: '"JetBrains Mono", monospace' },
  tc: { fontSize: 13, fontWeight: 600 },
  tcSep: { color: 'rgba(40,38,34,0.3)' },
  tcDim: { fontSize: 12, color: 'rgba(40,38,34,0.5)' },
  scrubTrack: { flex: 1, height: 4, background: 'rgba(40,38,34,0.08)', borderRadius: 2, position: 'relative' },
  scrubFill: { position: 'absolute', top: 0, left: 0, height: '100%', width: '46%', background: '#282622', borderRadius: 2 },
  scrubHandle: { position: 'absolute', top: '50%', left: '46%', transform: 'translate(-50%,-50%)', width: 14, height: 14, background: '#fff', border: '2px solid #282622', borderRadius: '50%', boxShadow: '0 1px 4px rgba(40,38,34,0.20)' },
  scrubMark: { position: 'absolute', top: -3, width: 2, height: 10, background: '#c8202c', borderRadius: 1, transform: 'translateX(-50%)' },

  globalCard: {
    background: '#fff', borderRadius: 12, padding: '12px 14px',
    boxShadow: '0 1px 0 rgba(40,38,34,0.04)',
  },
  globalLabel: { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(40,38,34,0.45)', marginBottom: 6 },
  globalInp: {
    width: '100%', resize: 'none', border: 'none', outline: 'none',
    background: 'transparent', fontFamily: 'inherit',
    fontSize: 13, lineHeight: 1.5, color: '#282622', padding: 0,
  },

  // RIGHT
  right: {
    background: '#fff', borderRadius: 14,
    padding: 18, display: 'flex', flexDirection: 'column', gap: 16,
    boxShadow: '0 1px 0 rgba(40,38,34,0.04), 0 12px 24px -16px rgba(40,38,34,0.10)',
    overflow: 'auto',
  },
  playerHead: { display: 'flex', alignItems: 'center', gap: 12 },
  playerJersey: {
    width: 44, height: 44, borderRadius: 12,
    background: '#282622', color: '#f4f1ea',
    fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  playerRole: { fontSize: 14, fontWeight: 600 },
  playerMeta: { fontSize: 11, color: 'rgba(40,38,34,0.5)', marginTop: 2 },

  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldGroupHead: {
    fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
    color: 'rgba(40,38,34,0.45)',
  },
  cRow: {
    display: 'flex', justifyContent: 'space-between',
    padding: '8px 0', borderBottom: '1px solid rgba(40,38,34,0.06)',
    fontSize: 12,
  },
  cK: { color: 'rgba(40,38,34,0.55)' },
  cV: { fontFamily: '"JetBrains Mono", monospace' },
  cVAcc: { fontFamily: '"JetBrains Mono", monospace', color: '#c8202c', fontWeight: 600 },
  note: {
    border: '1px solid rgba(40,38,34,0.10)', borderRadius: 8,
    padding: 10, resize: 'none', outline: 'none',
    fontFamily: 'inherit', fontSize: 12, lineHeight: 1.5,
    background: '#f9f7f1',
  },
  actionRow: { display: 'flex', gap: 8, marginTop: 'auto' },
  btnGhost: {
    flex: 1, background: 'transparent', border: '1px solid rgba(40,38,34,0.15)',
    fontFamily: 'inherit', fontSize: 12,
    color: '#282622', padding: '9px 0', borderRadius: 8, cursor: 'pointer',
  },
  btnSolid: {
    flex: 2, background: '#c8202c', border: 'none', color: '#fff',
    fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
    padding: '9px 0', borderRadius: 8, cursor: 'pointer',
  },
};

window.OptionC = OptionC;

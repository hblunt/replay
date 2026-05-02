// Option B — Technical Red
// Monospace-forward, dense, instrument-like. Bloomberg / coaching telemetry feel.

function OptionB() {
  const [selectedPlayer, setSelectedPlayer] = React.useState(7);
  const players = [
    { id: 7,  x: 0.82, y: 0.34, role: "RW",  color: "home" },
    { id: 9,  x: 0.46, y: 0.58, role: "SH",  color: "home" },
    { id: 10, x: 0.40, y: 0.46, role: "FH",  color: "home" },
    { id: 12, x: 0.55, y: 0.42, role: "IC",  color: "home" },
    { id: 14, x: 0.20, y: 0.30, role: "LW",  color: "home" },
    { id: 4,  x: 0.62, y: 0.66, role: "LK",  color: "home" },
    { id: 22, x: 0.71, y: 0.21, role: "RW",  color: "away" },
    { id: 23, x: 0.34, y: 0.20, role: "LW",  color: "away" },
  ];

  const corrections = [
    { id: 7,  fr: 21, from: '0.82,0.34', to: '0.82,0.15', trig: 'FH receives' },
    { id: 14, fr: 18, from: '0.20,0.30', to: '0.20,0.18', trig: 'FH receives' },
  ];

  const sel = players.find(p => p.id === selectedPlayer);

  return (
    <div style={b.root}>
      {/* Top status bar */}
      <header style={b.top}>
        <div style={b.topL}>
          <span style={b.dot} />
          <span style={b.brand}>REPLAY</span>
          <span style={b.sep}>/</span>
          <span style={b.tabActive}>02 ANALYSIS</span>
          <span style={b.sep}>·</span>
          <span style={b.tab}>03 GENERATE</span>
        </div>
        <div style={b.topR}>
          <span style={b.kvSm}><span style={b.k}>CLIP</span><span>saints_brumbies_03.mp4</span></span>
          <span style={b.kvSm}><span style={b.k}>DUR</span><span>00:09.421</span></span>
          <span style={b.kvSm}><span style={b.k}>FPS</span><span>5</span></span>
          <span style={b.kvSm}><span style={b.k}>TRACKED</span><span>12 PL · 1 BALL</span></span>
          <button style={b.regen}>REGENERATE ▸</button>
        </div>
      </header>

      {/* Body grid: left rail / center / right rail */}
      <div style={b.body}>
        {/* LEFT — analysis log */}
        <aside style={b.left}>
          <div style={b.colHead}>
            <span>ANALYSIS_LOG</span>
            <span style={b.colHeadDim}>auto · grounded</span>
          </div>
          <ol style={b.log}>
            <LogLine n="01" t="00:00.0" txt="Scrum complete. 8 fwd engaged. Defensive line forms at +5m." />
            <LogLine n="02" t="00:01.4" txt="#9 picks ball. Distance to FH = 1.8m." />
            <LogLine n="03" t="00:02.6" txt="Ball passed 9 → 10. Velocity 11.2 m/s." />
            <LogLine n="04" t="00:03.1" txt="#10 receives. Hands set. Pre-pass." active />
            <LogLine n="05" t="00:04.2" txt="#7 (RW) at 0.82, 0.34 — 4.2m behind line. Δ = +1.6m vs ideal." flag />
            <LogLine n="06" t="00:04.2" txt="#14 (LW) at 0.20, 0.30 — 3.8m behind. Δ = +1.2m." flag />
            <LogLine n="07" t="00:05.0" txt="Line speed measured 2.1 m/s. League avg 3.4 m/s." />
            <LogLine n="08" t="00:06.8" txt="Break in defensive line at 0.66, 0.28." />
          </ol>

          <div style={b.colHead}>
            <span>CORRECTIONS</span>
            <span style={b.colHeadDim}>{corrections.length}</span>
          </div>
          <table style={b.tbl}>
            <thead>
              <tr><th>PL</th><th>FR</th><th>FROM</th><th>TO</th><th>TRIG</th></tr>
            </thead>
            <tbody>
              {corrections.map(c => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedPlayer(c.id)}
                  style={{
                    ...b.trClick,
                    background: selectedPlayer === c.id ? 'rgba(200,32,44,0.06)' : 'transparent',
                  }}
                >
                  <td style={b.tdPl}>#{c.id}</td>
                  <td>{c.fr}</td>
                  <td>{c.from}</td>
                  <td style={b.tdAcc}>{c.to}</td>
                  <td style={b.tdDim}>{c.trig}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>

        {/* CENTER — pitch */}
        <main style={b.center}>
          <div style={b.colHead}>
            <span>FOOTAGE · TRACKING_OVERLAY</span>
            <span style={b.colHeadDim}>roboflow · realtime</span>
          </div>

          <div style={b.pitch}>
            <svg width="100%" height="100%" viewBox="0 0 100 56" preserveAspectRatio="none" style={b.pitchSvg}>
              <defs>
                <pattern id="gridB" width="2" height="2" patternUnits="userSpaceOnUse">
                  <path d="M 2 0 L 0 0 0 2" fill="none" stroke="#fff" strokeOpacity="0.06" strokeWidth="0.1"/>
                </pattern>
                <pattern id="stripeB" width="6" height="56" patternUnits="userSpaceOnUse">
                  <rect width="3" height="56" fill="#fff" opacity="0.025"/>
                </pattern>
              </defs>
              <rect width="100" height="56" fill="#0d0a09"/>
              <rect width="100" height="56" fill="url(#stripeB)"/>
              <rect width="100" height="56" fill="url(#gridB)"/>
              <line x1="50" y1="0" x2="50" y2="56" stroke="#fff" strokeOpacity="0.2" strokeWidth="0.15"/>
              <line x1="22" y1="0" x2="22" y2="56" stroke="#fff" strokeOpacity="0.12" strokeDasharray="0.6 0.6" strokeWidth="0.1"/>
              <line x1="78" y1="0" x2="78" y2="56" stroke="#fff" strokeOpacity="0.12" strokeDasharray="0.6 0.6" strokeWidth="0.1"/>
            </svg>

            <div style={b.placeholderTag}>FOOTAGE PLACEHOLDER</div>
            <div style={b.coordHud}>
              <div>X 0.821</div><div>Y 0.342</div><div>F 21</div><div>T 00:04.2</div>
            </div>

            {players.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPlayer(p.id)}
                style={{
                  ...b.handle,
                  left: `${p.x*100}%`, top: `${p.y*100}%`,
                  background: p.color === 'home' ? '#c8202c' : '#fafaf7',
                  color: p.color === 'home' ? '#fff' : '#0d0a09',
                  outline: selectedPlayer === p.id ? '2px solid #fff' : 'none',
                  outlineOffset: '2px',
                }}
              >{p.id}</button>
            ))}

            {/* arrows */}
            <svg style={b.arrowOverlay} viewBox="0 0 100 56" preserveAspectRatio="none">
              <defs>
                <marker id="arrB" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3" markerHeight="3" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill="#c8202c"/>
                </marker>
              </defs>
              <path d="M 82 34 L 82 17" stroke="#c8202c" strokeWidth="0.4" fill="none" strokeDasharray="0.8 0.6" markerEnd="url(#arrB)"/>
              <path d="M 20 30 L 20 19" stroke="#c8202c" strokeWidth="0.4" fill="none" strokeDasharray="0.8 0.6" markerEnd="url(#arrB)"/>
            </svg>
          </div>

          {/* Timeline / scrubber row */}
          <div style={b.timeline}>
            <div style={b.tlLabel}>00:00</div>
            <div style={b.tlTrack}>
              <div style={b.tlFill}/>
              <div style={{...b.tlMarker, left: '46%'}} title="#7 correction">
                <span style={b.tlMarkerLbl}>#7</span>
              </div>
              <div style={{...b.tlMarker, left: '22%'}} title="#14 correction">
                <span style={b.tlMarkerLbl}>#14</span>
              </div>
              <div style={{...b.tlPlayhead, left: '46%'}}/>
            </div>
            <div style={b.tlLabel}>00:09</div>
          </div>

          {/* Frame strip */}
          <div style={b.framestrip}>
            {Array.from({length: 18}).map((_, i) => (
              <div key={i} style={{
                ...b.frameCell,
                background: i === 8 ? '#c8202c' : 'rgba(250,250,247,0.04)',
                borderColor: i === 8 ? '#c8202c' : 'rgba(250,250,247,0.08)',
              }}/>
            ))}
          </div>

          {/* Global prompt */}
          <div style={b.globalRow}>
            <span style={b.k}>$ GLOBAL_PROMPT</span>
            <input
              style={b.globalInp}
              defaultValue="everyone should rush the defensive line faster once the scrum is complete"
            />
          </div>
        </main>

        {/* RIGHT — selected player */}
        <aside style={b.right}>
          <div style={b.colHead}>
            <span>PLAYER · #{sel?.id}</span>
            <span style={b.colHeadDim}>{sel?.role}</span>
          </div>

          <div style={b.rightFields}>
            <Kv k="STATUS" v="ON_LINE" acc />
            <Kv k="POS_NOW" v="0.82, 0.34" />
            <Kv k="POS_END" v="0.82, 0.15" acc />
            <Kv k="VEL"     v="2.1 m/s" />
            <Kv k="DELTA"   v="+1.6m" warn />
            <Kv k="TRIGGER" v="#10 receives ball" />
            <Kv k="FRAME"   v="21 / 142" />
          </div>

          <div style={b.colHead}><span>NOTE</span></div>
          <textarea
            style={b.noteB}
            defaultValue="// rush defensive line the moment FH receives ball.&#10;// hold body angle, do not drift in.&#10;// communicate with #14."
            rows={6}
          />

          <div style={b.colHead}><span>ACTIONS</span></div>
          <div style={b.actions}>
            <button style={b.btnGhost}>SET FROM</button>
            <button style={b.btnGhost}>SET TO</button>
            <button style={b.btnSolid}>SAVE CORRECTION</button>
          </div>
        </aside>
      </div>

      {/* Bottom status bar */}
      <footer style={b.statusbar}>
        <span><span style={b.k}>ENV</span> hackathon</span>
        <span><span style={b.k}>PIPELINE</span> prefect/3.4</span>
        <span><span style={b.k}>TRACKER</span> roboflow_v8 · 5fps</span>
        <span><span style={b.k}>VIDEO</span> seedance/2.0 · ready</span>
        <span style={b.statusOk}>● READY TO REGENERATE · 2 corrections queued</span>
      </footer>
    </div>
  );
}

function LogLine({ n, t, txt, active, flag }) {
  return (
    <li style={{
      ...b.logLine,
      background: active ? 'rgba(200,32,44,0.06)' : 'transparent',
      color: flag ? '#0d0a09' : 'rgba(13,10,9,0.78)',
    }}>
      <span style={b.logN}>{n}</span>
      <span style={b.logT}>{t}</span>
      <span style={b.logTxt}>
        {flag && <span style={b.flag}>● </span>}
        {txt}
      </span>
    </li>
  );
}

function Kv({ k, v, acc, warn }) {
  return (
    <div style={b.kvRow}>
      <span style={b.k}>{k}</span>
      <span style={{
        fontFamily: 'inherit',
        color: acc ? '#c8202c' : warn ? '#0d0a09' : 'rgba(13,10,9,0.85)',
        fontWeight: acc || warn ? 600 : 400,
      }}>
        {warn && <span style={{color:'#c8202c'}}>⚠ </span>}
        {v}
      </span>
    </div>
  );
}

const mono = '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace';

const b = {
  root: {
    width: '100%', height: '100%',
    background: '#fafaf7', color: '#0d0a09',
    fontFamily: mono, fontSize: 12, lineHeight: 1.4,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },

  top: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0 16px', height: 38,
    borderBottom: '1px solid #0d0a09', background: '#0d0a09', color: '#fafaf7',
    flexShrink: 0,
  },
  topL: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, letterSpacing: '0.06em' },
  topR: { display: 'flex', alignItems: 'center', gap: 16, fontSize: 10, letterSpacing: '0.04em' },
  dot: { width: 8, height: 8, background: '#c8202c', borderRadius: '50%' },
  brand: { fontWeight: 700, letterSpacing: '0.18em' },
  sep: { color: 'rgba(250,250,247,0.3)' },
  tabActive: { color: '#fff' },
  tab: { color: 'rgba(250,250,247,0.45)' },
  kvSm: { display: 'flex', gap: 6 },
  k: { color: 'rgba(13,10,9,0.4)', letterSpacing: '0.08em' },
  regen: {
    background: '#c8202c', border: 'none', color: '#fff',
    fontFamily: mono, fontSize: 11, letterSpacing: '0.1em', fontWeight: 600,
    padding: '6px 12px', cursor: 'pointer', borderRadius: 0,
  },

  body: {
    flex: 1, display: 'grid',
    gridTemplateColumns: '300px 1fr 280px',
    overflow: 'hidden',
    borderBottom: '1px solid rgba(13,10,9,0.12)',
  },

  colHead: {
    display: 'flex', justifyContent: 'space-between',
    padding: '10px 14px', fontSize: 10, letterSpacing: '0.12em',
    color: 'rgba(13,10,9,0.55)',
    borderBottom: '1px dashed rgba(13,10,9,0.12)',
    borderTop: '1px solid rgba(13,10,9,0.04)',
  },
  colHeadDim: { color: 'rgba(13,10,9,0.35)' },

  left: {
    borderRight: '1px solid rgba(13,10,9,0.12)',
    overflow: 'auto',
    display: 'flex', flexDirection: 'column',
  },
  log: { listStyle: 'none', margin: 0, padding: '4px 0' },
  logLine: {
    display: 'grid', gridTemplateColumns: '30px 56px 1fr',
    padding: '5px 14px', gap: 8,
    fontSize: 11, lineHeight: 1.45,
  },
  logN: { color: 'rgba(13,10,9,0.3)' },
  logT: { color: 'rgba(13,10,9,0.45)' },
  logTxt: {},
  flag: { color: '#c8202c' },

  tbl: {
    width: '100%', borderCollapse: 'collapse',
    fontSize: 10.5, fontFamily: mono,
  },
  trClick: { cursor: 'pointer' },
  tdPl: { color: '#c8202c', fontWeight: 600, padding: '6px 14px' },
  tdAcc: { color: '#c8202c', padding: '6px 4px' },
  tdDim: { color: 'rgba(13,10,9,0.45)', padding: '6px 14px 6px 4px' },

  center: {
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    borderRight: '1px solid rgba(13,10,9,0.12)',
  },
  pitch: {
    flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden',
    margin: 14, border: '1px solid rgba(13,10,9,0.12)',
  },
  pitchSvg: { position: 'absolute', inset: 0 },
  arrowOverlay: { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' },
  placeholderTag: {
    position: 'absolute', top: 10, left: 12, fontSize: 9,
    color: 'rgba(250,250,247,0.4)', letterSpacing: '0.1em',
  },
  coordHud: {
    position: 'absolute', top: 10, right: 12,
    display: 'flex', gap: 12, fontSize: 10,
    color: 'rgba(250,250,247,0.7)', letterSpacing: '0.06em',
  },
  handle: {
    position: 'absolute', transform: 'translate(-50%,-50%)',
    width: 24, height: 24, fontSize: 10, fontWeight: 700,
    fontFamily: mono, border: '1.5px solid rgba(255,255,255,0.4)',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 2,
  },

  timeline: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '4px 14px 0',
  },
  tlLabel: { fontSize: 10, color: 'rgba(13,10,9,0.45)' },
  tlTrack: {
    flex: 1, height: 24, position: 'relative',
    background: 'rgba(13,10,9,0.04)',
    border: '1px solid rgba(13,10,9,0.10)',
  },
  tlFill: {
    position: 'absolute', top: 0, left: 0, height: '100%', width: '46%',
    background: 'rgba(200,32,44,0.10)', borderRight: '1px solid #c8202c',
  },
  tlMarker: {
    position: 'absolute', top: 0, height: '100%', width: 2,
    background: '#c8202c', transform: 'translateX(-50%)',
  },
  tlMarkerLbl: {
    position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
    fontSize: 9, color: '#c8202c', whiteSpace: 'nowrap',
  },
  tlPlayhead: {
    position: 'absolute', top: -3, height: 'calc(100% + 6px)', width: 2,
    background: '#0d0a09', transform: 'translateX(-50%)',
  },

  framestrip: {
    display: 'grid', gridTemplateColumns: 'repeat(18, 1fr)', gap: 2,
    padding: '8px 14px',
  },
  frameCell: { height: 26, border: '1px solid', },

  globalRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '8px 14px 12px',
    borderTop: '1px solid rgba(13,10,9,0.08)',
  },
  globalInp: {
    flex: 1, border: 'none', outline: 'none', background: 'transparent',
    fontFamily: mono, fontSize: 12, color: '#0d0a09',
  },

  right: {
    overflow: 'auto', display: 'flex', flexDirection: 'column',
  },
  rightFields: { display: 'flex', flexDirection: 'column' },
  kvRow: {
    display: 'flex', justifyContent: 'space-between',
    padding: '7px 14px', fontSize: 11,
    borderBottom: '1px dashed rgba(13,10,9,0.06)',
  },
  noteB: {
    border: 'none', outline: 'none', resize: 'none', background: '#0d0a09', color: '#fafaf7',
    fontFamily: mono, fontSize: 11, lineHeight: 1.5,
    padding: '12px 14px', margin: '8px 14px',
  },
  actions: { display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 14px 14px' },
  btnGhost: {
    background: 'transparent', border: '1px solid rgba(13,10,9,0.2)',
    fontFamily: mono, fontSize: 10, letterSpacing: '0.1em', fontWeight: 600,
    color: '#0d0a09', padding: '8px 0', cursor: 'pointer',
  },
  btnSolid: {
    background: '#0d0a09', border: 'none', color: '#fafaf7',
    fontFamily: mono, fontSize: 10, letterSpacing: '0.1em', fontWeight: 600,
    padding: '9px 0', cursor: 'pointer',
  },

  statusbar: {
    height: 26, padding: '0 16px',
    background: '#0d0a09', color: 'rgba(250,250,247,0.65)',
    fontSize: 10, letterSpacing: '0.06em',
    display: 'flex', alignItems: 'center', gap: 24,
    flexShrink: 0,
  },
  statusOk: { color: '#c8202c', marginLeft: 'auto', fontWeight: 600 },
};

window.OptionB = OptionB;

// Option A — Editorial Red
// Serif display + grotesk body. Magazine-like hierarchy, generous whitespace.

function OptionA() {
  const [selectedPlayer, setSelectedPlayer] = React.useState(7);
  const [time, setTime] = React.useState(4.2);
  const [globalNote, setGlobalNote] = React.useState(
    "Everyone should rush the defensive line faster once the scrum is complete."
  );

  const players = [
    { id: 7,  x: 0.82, y: 0.34, role: "Right Wing",  color: "home" },
    { id: 9,  x: 0.46, y: 0.58, role: "Scrum-half",  color: "home" },
    { id: 10, x: 0.40, y: 0.46, role: "Fly-half",    color: "home" },
    { id: 12, x: 0.55, y: 0.42, role: "Inside C.",   color: "home" },
    { id: 14, x: 0.20, y: 0.30, role: "Left Wing",   color: "home" },
    { id: 4,  x: 0.62, y: 0.66, role: "Lock",        color: "home" },
    { id: 22, x: 0.71, y: 0.21, role: "Opp Wing",    color: "away" },
    { id: 23, x: 0.34, y: 0.20, role: "Opp Wing",    color: "away" },
  ];

  const corrections = [
    { id: 7,  note: "Should rush the defensive line the moment the flyhalf receives the ball." },
    { id: 14, note: "Hold depth until #10 commits, then jam in." },
  ];

  const selected = players.find(p => p.id === selectedPlayer);

  return (
    <div style={a.root}>
      {/* Masthead */}
      <header style={a.masthead}>
        <div style={a.mastLeft}>
          <div style={a.wordmark}>Replay</div>
          <div style={a.crumbs}>
            <span style={a.crumbDim}>Sessions</span>
            <span style={a.crumbDot}>·</span>
            <span style={a.crumbDim}>Round 8 · Saints v Brumbies</span>
            <span style={a.crumbDot}>·</span>
            <span>Clip 03 — Defensive line speed</span>
          </div>
        </div>
        <div style={a.mastRight}>
          <span style={a.metaSmall}>00:04 / 00:09 · 5 fps · 142 frames</span>
          <button style={a.ghostBtn}>Discard</button>
          <button style={a.primaryBtn}>Regenerate clip →</button>
        </div>
      </header>

      <div style={a.body}>
        {/* Editorial summary (top) */}
        <section style={a.summary}>
          <div style={a.kicker}>Phase II — Analysis</div>
          <h1 style={a.headline}>
            The line is set, but the <em style={a.em}>winger drifts.</em>
          </h1>
          <p style={a.standfirst}>
            Eight players form the defensive line. The scrum is complete and the ball
            has been picked up by the #9. The right wing (#7) sits four metres behind
            the line and does not push up when the fly-half receives. Replay tracked
            12 players across 142 frames.
          </p>
        </section>

        {/* Two-column: pitch + side panel */}
        <section style={a.workspace}>
          <div style={a.pitchCol}>
            <Pitch
              players={players}
              selectedId={selectedPlayer}
              onSelect={setSelectedPlayer}
            />

            {/* Scrubber */}
            <div style={a.scrubRow}>
              <button style={a.transport}>▶</button>
              <div style={a.timecode}>00:0{Math.floor(time)}<span style={a.timecodeFade}>.{Math.floor((time%1)*10)}</span></div>
              <div style={a.scrubTrack}>
                <div style={{...a.scrubFill, width: `${(time/9)*100}%`}} />
                <div style={{...a.scrubHandle, left: `${(time/9)*100}%`}} />
                <div style={{...a.scrubMark, left: '46%'}} title="Correction at #7" />
                <div style={{...a.scrubMark, left: '22%'}} title="Correction at #14" />
              </div>
              <div style={a.timecodeMuted}>00:09</div>
            </div>

            {/* Global prompt — editorial blockquote */}
            <div style={a.globalBlock}>
              <div style={a.globalLabel}>A note for the whole clip</div>
              <textarea
                style={a.globalInput}
                value={globalNote}
                onChange={e => setGlobalNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Side panel */}
          <aside style={a.side}>
            <div style={a.sideHeader}>
              <div style={a.jersey}>#{selectedPlayer}</div>
              <div>
                <div style={a.sideRole}>{selected?.role}</div>
                <div style={a.sideMeta}>Frame 21 · 00:0{Math.floor(time)}.{Math.floor((time%1)*10)}</div>
              </div>
            </div>

            <div style={a.fieldGrid}>
              <div style={a.fieldRow}>
                <span style={a.fieldKey}>From</span>
                <span style={a.fieldVal}>0.82, 0.34</span>
              </div>
              <div style={a.fieldRow}>
                <span style={a.fieldKey}>To</span>
                <span style={a.fieldValAccent}>0.82, 0.15</span>
              </div>
              <div style={a.fieldRow}>
                <span style={a.fieldKey}>Trigger</span>
                <span style={a.fieldVal}>#10 receives ball</span>
              </div>
            </div>

            <label style={a.noteLabel}>Note for #{selectedPlayer}</label>
            <textarea
              style={a.note}
              defaultValue="Should rush the defensive line the moment the flyhalf receives the ball."
              rows={4}
            />

            <div style={a.correctionsTitle}>Corrections in this clip</div>
            <ol style={a.correctionsList}>
              {corrections.map(c => (
                <li key={c.id} style={a.correctionItem}>
                  <span style={a.corrNum}>#{c.id}</span>
                  <span style={a.corrNote}>{c.note}</span>
                </li>
              ))}
            </ol>
          </aside>
        </section>
      </div>
    </div>
  );
}

function Pitch({ players, selectedId, onSelect }) {
  return (
    <div style={a.pitchWrap}>
      <div style={a.pitchTopBar}>
        <span style={a.pitchTopLabel}>Original footage · tracking overlay</span>
        <span style={a.pitchTopMeta}>Roboflow · 5fps</span>
      </div>
      <div style={a.pitch}>
        {/* Striped placeholder field */}
        <svg width="100%" height="100%" style={a.pitchSvg} preserveAspectRatio="none" viewBox="0 0 100 56">
          <defs>
            <pattern id="stripeA" width="6" height="56" patternUnits="userSpaceOnUse">
              <rect width="3" height="56" fill="#1a1413" opacity="0.04" />
            </pattern>
          </defs>
          <rect width="100" height="56" fill="#fbf8f4" />
          <rect width="100" height="56" fill="url(#stripeA)" />
          <line x1="50" y1="0" x2="50" y2="56" stroke="#1a1413" strokeOpacity="0.18" strokeWidth="0.2" />
          <line x1="22" y1="0" x2="22" y2="56" stroke="#1a1413" strokeOpacity="0.12" strokeWidth="0.15" strokeDasharray="0.6 0.6" />
          <line x1="78" y1="0" x2="78" y2="56" stroke="#1a1413" strokeOpacity="0.12" strokeWidth="0.15" strokeDasharray="0.6 0.6" />
        </svg>

        <div style={a.placeholderTag}>FOOTAGE PLACEHOLDER · saints_v_brumbies_clip03.mp4</div>

        {players.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            style={{
              ...a.handle,
              left: `${p.x * 100}%`,
              top: `${p.y * 100}%`,
              background: p.color === 'home' ? '#c8202c' : '#1a1413',
              outline: selectedId === p.id ? '3px solid #1a1413' : 'none',
              outlineOffset: '3px',
            }}
          >
            {p.id}
          </button>
        ))}

        {/* Vector arrow for #7 correction */}
        <svg style={a.arrowOverlay} viewBox="0 0 100 56" preserveAspectRatio="none">
          <defs>
            <marker id="arrA" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3" markerHeight="3" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="#c8202c" />
            </marker>
          </defs>
          <path
            d="M 82 34 Q 82 24 82 16"
            stroke="#c8202c"
            strokeWidth="0.5"
            fill="none"
            strokeDasharray="1.2 0.8"
            markerEnd="url(#arrA)"
          />
        </svg>
      </div>
    </div>
  );
}

const a = {
  root: {
    width: '100%', height: '100%',
    background: '#fbf8f4',
    color: '#1a1413',
    fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  masthead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '18px 32px',
    borderBottom: '1px solid rgba(26,20,19,0.10)',
    flexShrink: 0,
  },
  mastLeft: { display: 'flex', alignItems: 'baseline', gap: 24 },
  wordmark: {
    fontFamily: '"Fraunces", "Times New Roman", serif',
    fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em',
    fontStyle: 'italic',
  },
  crumbs: { fontSize: 12, color: '#1a1413', display: 'flex', gap: 8, alignItems: 'center' },
  crumbDim: { color: 'rgba(26,20,19,0.45)' },
  crumbDot: { color: 'rgba(26,20,19,0.3)' },
  mastRight: { display: 'flex', alignItems: 'center', gap: 14 },
  metaSmall: { fontSize: 11, fontFamily: '"JetBrains Mono", ui-monospace, monospace', color: 'rgba(26,20,19,0.5)', letterSpacing: '0.04em' },
  ghostBtn: {
    background: 'transparent', border: '1px solid rgba(26,20,19,0.15)',
    padding: '7px 14px', fontSize: 12, color: '#1a1413',
    fontFamily: 'inherit', cursor: 'pointer', borderRadius: 0,
  },
  primaryBtn: {
    background: '#c8202c', border: 'none', color: '#fff',
    padding: '8px 16px', fontSize: 12, fontWeight: 500, letterSpacing: '0.02em',
    cursor: 'pointer', borderRadius: 0,
  },

  body: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },

  summary: {
    padding: '32px 56px 24px',
    borderBottom: '1px solid rgba(26,20,19,0.08)',
    maxWidth: 920,
  },
  kicker: {
    fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
    color: '#c8202c', marginBottom: 14, fontWeight: 600,
  },
  headline: {
    fontFamily: '"Fraunces", "Times New Roman", serif',
    fontSize: 44, fontWeight: 400, lineHeight: 1.05,
    letterSpacing: '-0.02em', margin: 0, marginBottom: 14,
  },
  em: { fontStyle: 'italic', color: '#c8202c', fontWeight: 400 },
  standfirst: {
    fontSize: 15, lineHeight: 1.55, color: 'rgba(26,20,19,0.72)',
    margin: 0, maxWidth: 720,
  },

  workspace: {
    flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px',
    overflow: 'hidden',
  },
  pitchCol: {
    padding: '24px 28px 24px 56px',
    display: 'flex', flexDirection: 'column', gap: 16,
    overflow: 'hidden',
  },

  pitchWrap: {
    display: 'flex', flexDirection: 'column',
    border: '1px solid rgba(26,20,19,0.12)',
    flex: 1, minHeight: 0,
  },
  pitchTopBar: {
    display: 'flex', justifyContent: 'space-between',
    padding: '8px 14px', borderBottom: '1px solid rgba(26,20,19,0.08)',
    fontSize: 10, fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    letterSpacing: '0.06em', textTransform: 'uppercase',
  },
  pitchTopLabel: { color: 'rgba(26,20,19,0.7)' },
  pitchTopMeta: { color: 'rgba(26,20,19,0.4)' },
  pitch: {
    position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden',
    background: '#fbf8f4',
  },
  pitchSvg: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
  arrowOverlay: { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' },
  placeholderTag: {
    position: 'absolute', top: 12, left: 12,
    fontSize: 10, fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    color: 'rgba(26,20,19,0.5)', letterSpacing: '0.06em',
  },
  handle: {
    position: 'absolute', transform: 'translate(-50%, -50%)',
    width: 28, height: 28, borderRadius: '50%',
    color: '#fff', fontSize: 11, fontWeight: 600,
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    border: '2px solid #fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  },

  scrubRow: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '4px 0',
  },
  transport: {
    width: 30, height: 30, borderRadius: '50%',
    background: '#1a1413', color: '#fff', border: 'none',
    cursor: 'pointer', fontSize: 11,
    display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 2,
  },
  timecode: {
    fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 13,
    minWidth: 56,
  },
  timecodeFade: { color: 'rgba(26,20,19,0.4)' },
  timecodeMuted: {
    fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 12,
    color: 'rgba(26,20,19,0.4)',
  },
  scrubTrack: {
    flex: 1, height: 2, background: 'rgba(26,20,19,0.12)',
    position: 'relative',
  },
  scrubFill: { position: 'absolute', top: 0, left: 0, height: '100%', background: '#1a1413' },
  scrubHandle: {
    position: 'absolute', top: '50%', transform: 'translate(-50%,-50%)',
    width: 12, height: 12, background: '#c8202c', borderRadius: '50%',
  },
  scrubMark: {
    position: 'absolute', top: -4, width: 2, height: 10, background: '#c8202c',
    transform: 'translateX(-50%)',
  },

  globalBlock: {
    borderTop: '1px solid rgba(26,20,19,0.08)',
    paddingTop: 14,
  },
  globalLabel: {
    fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
    color: 'rgba(26,20,19,0.5)', marginBottom: 8,
  },
  globalInput: {
    width: '100%', resize: 'none', border: 'none', outline: 'none',
    background: 'transparent',
    fontFamily: '"Fraunces", "Times New Roman", serif',
    fontStyle: 'italic',
    fontSize: 17, lineHeight: 1.4, color: '#1a1413',
    padding: 0,
  },

  side: {
    borderLeft: '1px solid rgba(26,20,19,0.10)',
    padding: '24px 28px',
    display: 'flex', flexDirection: 'column', gap: 18,
    overflow: 'auto',
  },
  sideHeader: { display: 'flex', alignItems: 'center', gap: 14 },
  jersey: {
    width: 52, height: 52, borderRadius: '50%',
    background: '#c8202c', color: '#fff',
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    fontSize: 16, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  sideRole: {
    fontFamily: '"Fraunces", serif', fontSize: 20, fontWeight: 400,
  },
  sideMeta: {
    fontSize: 11, fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    color: 'rgba(26,20,19,0.5)', marginTop: 2,
  },
  fieldGrid: { display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 },
  fieldRow: { display: 'flex', justifyContent: 'space-between', fontSize: 12 },
  fieldKey: {
    color: 'rgba(26,20,19,0.5)',
    letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 10,
  },
  fieldVal: { fontFamily: '"JetBrains Mono", ui-monospace, monospace' },
  fieldValAccent: {
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    color: '#c8202c', fontWeight: 600,
  },
  noteLabel: {
    fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
    color: 'rgba(26,20,19,0.5)', marginTop: 4,
  },
  note: {
    border: 'none', borderTop: '1px solid rgba(26,20,19,0.15)',
    padding: '10px 0 0', resize: 'none', outline: 'none', background: 'transparent',
    fontFamily: 'inherit', fontSize: 13, lineHeight: 1.5, color: '#1a1413',
  },
  correctionsTitle: {
    fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
    color: 'rgba(26,20,19,0.5)', marginTop: 4,
  },
  correctionsList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 },
  correctionItem: {
    display: 'grid', gridTemplateColumns: '32px 1fr', gap: 8,
    fontSize: 12, lineHeight: 1.45,
    paddingTop: 10, borderTop: '1px solid rgba(26,20,19,0.08)',
  },
  corrNum: {
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    color: '#c8202c', fontWeight: 600,
  },
  corrNote: { color: 'rgba(26,20,19,0.75)' },
};

window.OptionA = OptionA;

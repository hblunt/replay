// components/Chrome.jsx — Top app bar shared across screens.

function Chrome({ stage, file, onRegenerate, regenerateDisabled, rightExtra }) {
  const t = window.theme;
  const stages = [
    { key: 'upload',   label: '1 · Upload' },
    { key: 'analyse',  label: '2 · Analyse' },
    { key: 'generate', label: '3 · Generate' },
  ];
  return (
    <header style={{
      height: 56, padding: '0 24px', flexShrink: 0,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <button
          onClick={() => window.navigate('/upload')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em',
            fontFamily: t.fontDisp, fontStyle: 'italic', color: t.ink,
          }}
        >
          <span style={{
            width: 18, height: 18, borderRadius: 6,
            background: t.ink, boxShadow: 'inset -3px -3px 0 0 ' + t.red,
          }} />
          <span>Replay</span>
        </button>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {stages.map((s) => {
            const active = s.key === stage;
            return (
              <span key={s.key} style={{
                fontSize: 12, padding: '6px 10px', borderRadius: 6,
                color: active ? t.ink : t.ink55,
                background: active ? t.bgRaised : 'transparent',
                boxShadow: active ? t.shadowSm : 'none',
              }}>{s.label}</span>
            );
          })}
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {file && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 999,
            background: t.bgRaised, boxShadow: t.shadowSm, fontSize: 12, color: t.ink,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.red }} />
            {file}
          </span>
        )}
        {rightExtra}
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={regenerateDisabled}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: regenerateDisabled ? t.ink25 : t.ink,
              color: t.bg, border: 'none',
              padding: '8px 14px', borderRadius: 8,
              fontSize: 12, fontWeight: 500, fontFamily: t.fontUI,
              cursor: regenerateDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            <span>Regenerate</span><span style={{ fontSize: 14 }}>↗</span>
          </button>
        )}
      </div>
    </header>
  );
}

window.Chrome = Chrome;

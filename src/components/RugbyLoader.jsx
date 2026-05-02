// components/RugbyLoader.jsx — bouncing rugby ball + stepped progress bar.

function RugbyLoader({ steps, progress }) {
  const t = window.theme;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
      padding: 32,
    }}>
      <div style={{ width: 240, height: 90, position: 'relative' }}>
        <div style={{
          position: 'absolute', bottom: 6, left: 0, right: 0, height: 2,
          background: t.ink10, borderRadius: 1,
        }} />
        <div className="rugby-ball-bounce" style={{
          position: 'absolute', bottom: 8, left: 'calc(50% - 18px)',
          width: 36, height: 22,
          background: t.ink, borderRadius: '50%',
          boxShadow: 'inset -3px -2px 0 rgba(255,255,255,0.08), 0 4px 8px rgba(40,38,34,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 18, height: 1, background: '#fff', opacity: 0.5 }} />
        </div>
      </div>

      <div style={{ width: 360, maxWidth: '100%' }}>
        <div style={{
          height: 4, background: t.ink10, borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.round(progress * 100)}%`,
            height: '100%', background: t.red,
            transition: 'width 0.4s ease-out',
          }} />
        </div>
        <div style={{
          marginTop: 8, fontSize: 11, color: t.ink55, fontFamily: t.fontMono,
          letterSpacing: '0.04em', textAlign: 'center',
        }}>
          {Math.round(progress * 100)}%
        </div>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, width: 360, maxWidth: '100%' }}>
        {steps.map((s) => (
          <li key={s.name} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 0',
            borderBottom: `1px solid ${t.ink06}`,
            fontSize: 12,
            color: s.status === 'pending' ? t.ink45 : t.ink,
          }}>
            <StepIcon status={s.status} />
            <span style={{ flex: 1 }}>{s.label}</span>
            <span style={{
              fontFamily: t.fontMono, fontSize: 10,
              color: s.status === 'completed' ? t.ink45 : s.status === 'running' ? t.red : t.ink25,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              {s.status === 'completed' ? 'done' : s.status === 'running' ? 'running' : 'pending'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepIcon({ status }) {
  const t = window.theme;
  if (status === 'completed') {
    return (
      <span style={{
        width: 16, height: 16, borderRadius: '50%', background: t.ink,
        color: '#fff', fontSize: 9, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>✓</span>
    );
  }
  if (status === 'running') {
    return (
      <span className="step-spin" style={{
        width: 16, height: 16, borderRadius: '50%',
        border: `2px solid ${t.red}`, borderTopColor: 'transparent',
      }} />
    );
  }
  return <span style={{
    width: 16, height: 16, borderRadius: '50%',
    border: `1.5px solid ${t.ink25}`,
  }} />;
}

window.RugbyLoader = RugbyLoader;

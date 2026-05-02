// components/Scrubber.jsx — Play/pause + transport, with correction markers.

function Scrubber({ time, duration, playing, onPlayToggle, onSeek, markers = [] }) {
  const t = window.theme;
  const trackRef = React.useRef(null);
  const seekFromEvent = (e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, x)) * duration);
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: t.bgRaised, borderRadius: 12, padding: '8px 14px',
      boxShadow: t.shadowFlat,
    }}>
      <button
        onClick={onPlayToggle}
        style={{
          width: 30, height: 30, borderRadius: '50%',
          background: t.ink, color: '#fff', border: 'none',
          cursor: 'pointer', fontSize: 10, paddingLeft: playing ? 0 : 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >{playing ? '❚❚' : '▶'}</button>

      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 6,
        fontFamily: t.fontMono, minWidth: 110,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{window.formatTime(time)}</span>
        <span style={{ color: t.ink25 }}>/</span>
        <span style={{ fontSize: 12, color: t.ink55 }}>{window.formatTime(duration)}</span>
      </div>

      <div
        ref={trackRef}
        onMouseDown={seekFromEvent}
        style={{
          flex: 1, height: 4, background: t.ink06, borderRadius: 2,
          position: 'relative', cursor: 'pointer',
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, height: '100%',
          width: `${(time / duration) * 100}%`,
          background: t.ink, borderRadius: 2,
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: `${(time / duration) * 100}%`,
          transform: 'translate(-50%,-50%)',
          width: 14, height: 14, background: '#fff',
          border: `2px solid ${t.ink}`, borderRadius: '50%',
          boxShadow: '0 1px 4px rgba(40,38,34,0.20)',
        }} />
        {markers.map((m, i) => (
          <div
            key={i}
            title={m.label}
            style={{
              position: 'absolute', top: -3, left: `${(m.t / duration) * 100}%`,
              width: 2, height: 10, background: t.red, borderRadius: 1,
              transform: 'translateX(-50%)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

window.Scrubber = Scrubber;

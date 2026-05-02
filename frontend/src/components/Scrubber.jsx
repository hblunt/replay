import { useRef } from 'react';
import { theme, formatTime } from '../lib/theme';

export default function Scrubber({ time, duration, playing, onPlayToggle, onSeek, markers = [] }) {
  const t = theme;
  const trackRef = useRef(null);
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
        aria-label={playing ? 'Pause' : 'Play'}
        style={{
          width: 30, height: 30, borderRadius: '50%',
          background: t.ink, color: '#fff', border: 'none',
          cursor: 'pointer', flexShrink: 0,
          padding: 0, lineHeight: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {playing ? (
          // Pause icon — two centred bars
          <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden>
            <rect x="0" y="0" width="3" height="12" rx="0.5" fill="#fff" />
            <rect x="7" y="0" width="3" height="12" rx="0.5" fill="#fff" />
          </svg>
        ) : (
          // Play icon — geometrically centred triangle (tip at x=10, base at x=0)
          // Inscribed in a 10×12 box, the centroid sits at x=10/3 ≈ 3.33,
          // so we shift right by ~1.5px so the *visual* mass lands centre.
          <svg width="11" height="12" viewBox="0 0 11 12" fill="none" aria-hidden
               style={{ marginLeft: 1 }}>
            <path d="M1 0.5 L10 6 L1 11.5 Z" fill="#fff" />
          </svg>
        )}
      </button>

      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 6,
        fontFamily: t.fontMono, minWidth: 110,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{formatTime(time)}</span>
        <span style={{ color: t.ink25 }}>/</span>
        <span style={{ fontSize: 12, color: t.ink55 }}>{formatTime(duration)}</span>
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

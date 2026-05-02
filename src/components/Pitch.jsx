// components/Pitch.jsx — Field placeholder + tracked player handles.
// Renders the underlying video (if present) full-bleed, with a striped
// SVG placeholder behind it. Player handles overlay in field coordinates.

function Pitch({
  videoRef,                   // optional ref<HTMLVideoElement>
  videoUrl,                   // optional video src
  time,                       // current playhead (sec)
  duration,                   // clip length (sec)
  selectedPlayerId,
  onSelectPlayer,
  corrections,                // for drawing arrows + From/To dots
  showOverlay = true,
  watermark,                  // e.g. "REGENERATED"
  childrenOverlay,            // additional canvas overlay (annotations)
}) {
  const t = window.theme;
  const players = window.MOCK_PLAYERS;

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      background: t.bgRaised, borderRadius: t.radiusLg, overflow: 'hidden',
      boxShadow: t.shadow,
    }}>
      {/* Striped placeholder field (always behind) */}
      <svg
        width="100%" height="100%" viewBox="0 0 100 56"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <pattern id="pitchStripe" width="6" height="56" patternUnits="userSpaceOnUse">
            <rect width="3" height="56" fill="#282622" opacity="0.025" />
          </pattern>
        </defs>
        <rect width="100" height="56" fill="#f4f1ea" />
        <rect width="100" height="56" fill="url(#pitchStripe)" />
        <line x1="50" y1="0" x2="50" y2="56" stroke="#282622" strokeOpacity="0.10" strokeWidth="0.15" />
        <line x1="22" y1="0" x2="22" y2="56" stroke="#282622" strokeOpacity="0.07" strokeDasharray="0.6 0.6" strokeWidth="0.12" />
        <line x1="78" y1="0" x2="78" y2="56" stroke="#282622" strokeOpacity="0.07" strokeDasharray="0.6 0.6" strokeWidth="0.12" />
      </svg>

      {/* Real video (if URL provided) */}
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline muted
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: 0.92,
          }}
        />
      )}

      {/* Top-left placeholder tag (only when no video) */}
      {!videoUrl && (
        <div style={{
          position: 'absolute', top: 12, left: 14,
          fontSize: 10, fontFamily: t.fontMono,
          color: t.ink45, letterSpacing: '0.06em',
        }}>
          FOOTAGE PLACEHOLDER
        </div>
      )}

      {/* Watermark */}
      {watermark && (
        <div style={{
          position: 'absolute', top: 12, right: 14,
          fontSize: 10, fontFamily: t.fontMono, fontWeight: 600,
          color: t.red, letterSpacing: '0.16em',
          padding: '4px 8px', background: 'rgba(255,255,255,0.92)',
          borderRadius: 4,
        }}>
          ● {watermark}
        </div>
      )}

      {/* Tracking overlay */}
      {showOverlay && (
        <>
          {/* Correction arrows */}
          <svg
            viewBox="0 0 100 56" preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          >
            <defs>
              <marker id="corrArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3" markerHeight="3" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill={t.red} />
              </marker>
            </defs>
            {corrections.map((c) => (
              <g key={c.id}>
                <circle cx={c.fromX * 100} cy={c.fromY * 56} r="0.8" fill={t.ink} fillOpacity="0.35" />
                <path
                  d={`M ${c.fromX * 100} ${c.fromY * 56} L ${c.toX * 100} ${c.toY * 56}`}
                  stroke={t.red} strokeWidth="0.45" fill="none"
                  strokeDasharray="1 0.6" markerEnd="url(#corrArrow)"
                />
              </g>
            ))}
          </svg>

          {/* Player handles (positions interpolated by time) */}
          {players.map((p) => {
            const pos = window.trackAt(p.id, time);
            if (!pos) return null;
            const isSelected = selectedPlayerId === p.id;
            const isHome = p.side === 'home';
            return (
              <button
                key={p.id}
                onClick={() => onSelectPlayer && onSelectPlayer(p.id)}
                style={{
                  position: 'absolute',
                  left: `${pos.x * 100}%`, top: `${pos.y * 100}%`,
                  transform: 'translate(-50%,-50%)',
                  width: 28, height: 28, borderRadius: '50%',
                  background: isHome ? t.ink : t.away,
                  color: '#fff', fontSize: 11, fontWeight: 600,
                  fontFamily: t.fontMono,
                  border: '2px solid #fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(40,38,34,0.20)',
                  outline: isSelected ? `3px solid ${t.red}` : 'none',
                  outlineOffset: '3px',
                  zIndex: 2,
                  padding: 0,
                }}
              >{p.id}</button>
            );
          })}
        </>
      )}

      {/* Annotation overlay slot (Phase 3 draw/text/timestamp) */}
      {childrenOverlay}

      {/* Time HUD (small, monospace) */}
      <div style={{
        position: 'absolute', bottom: 12, left: 14,
        fontSize: 10, fontFamily: t.fontMono, color: 'rgba(255,255,255,0.85)',
        background: 'rgba(40,38,34,0.6)', padding: '3px 7px', borderRadius: 4,
        letterSpacing: '0.04em',
      }}>
        {formatTime(time)} / {formatTime(duration)}
      </div>
    </div>
  );
}

function formatTime(t) {
  if (!isFinite(t)) t = 0;
  const m = Math.floor(t / 60).toString().padStart(2, '0');
  const s = (t % 60).toFixed(1).padStart(4, '0');
  return `${m}:${s}`;
}

window.Pitch = Pitch;
window.formatTime = formatTime;

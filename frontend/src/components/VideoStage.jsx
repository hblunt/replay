// Stage 1 video stage — straight HTML5 <video> with annotation overlay slot.
// Roboflow player handles + correction arrows are intentionally absent.

import { theme, formatTime } from '../lib/theme';

export default function VideoStage({
  videoRef,
  videoUrl,
  time,
  duration,
  watermark,
  label,
  childrenOverlay,
}) {
  const t = theme;
  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      background: t.ink, borderRadius: t.radiusLg, overflow: 'hidden',
      boxShadow: t.shadow,
    }}>
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          muted
          preload="metadata"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'contain',
            background: t.ink,
          }}
        />
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.55)', fontSize: 13, fontFamily: t.fontMono,
        }}>NO CLIP LOADED</div>
      )}

      {label && (
        <div style={{
          position: 'absolute', top: 12, left: 14, zIndex: 3,
          background: '#fff', color: t.ink, fontSize: 10, fontWeight: 600,
          fontFamily: t.fontMono, letterSpacing: '0.16em',
          padding: '4px 8px', borderRadius: 4, boxShadow: t.shadowSm,
        }}>{label}</div>
      )}

      {watermark && (
        <div style={{
          position: 'absolute', top: 12, right: 14, zIndex: 3,
          fontSize: 10, fontFamily: t.fontMono, fontWeight: 600,
          color: t.red, letterSpacing: '0.16em',
          padding: '4px 8px', background: 'rgba(255,255,255,0.92)',
          borderRadius: 4,
        }}>● {watermark}</div>
      )}

      {childrenOverlay}

      <div style={{
        position: 'absolute', bottom: 12, left: 14, zIndex: 3,
        fontSize: 10, fontFamily: t.fontMono, color: 'rgba(255,255,255,0.85)',
        background: 'rgba(40,38,34,0.6)', padding: '3px 7px', borderRadius: 4,
        letterSpacing: '0.04em',
      }}>
        {formatTime(time)} / {formatTime(duration)}
      </div>
    </div>
  );
}

import { theme } from '../lib/theme';

export default function AnnotationLayer({ annotations, drafting }) {
  const t = theme;
  return (
    <>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
           viewBox="0 0 100 56" preserveAspectRatio="none">
        {annotations.filter((a) => a.type === 'draw').map((a) => (
          <polyline key={a.id}
            points={a.path.map(([x, y]) => `${x*100},${y*56}`).join(' ')}
            fill="none" stroke={t.red} strokeWidth="0.5"
            strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {drafting && (
          <polyline
            points={drafting.path.map(([x, y]) => `${x*100},${y*56}`).join(' ')}
            fill="none" stroke={t.red} strokeWidth="0.5"
            strokeLinecap="round" strokeLinejoin="round"
            opacity="0.7" />
        )}
      </svg>
      {annotations.filter((a) => a.type === 'pin').map((a) => (
        <div key={a.id} style={{
          position: 'absolute', left: `${a.x*100}%`, top: `${a.y*100}%`,
          transform: 'translate(-50%,-50%)',
          width: 18, height: 18, borderRadius: '50%',
          background: t.red, border: '2px solid #fff',
          boxShadow: '0 2px 6px rgba(40,38,34,0.30)', zIndex: 5,
        }} />
      ))}
      {annotations.filter((a) => a.type === 'note').map((a) => (
        <div key={a.id} style={{
          position: 'absolute', left: `${a.x*100}%`, top: `${a.y*100}%`,
          transform: 'translate(8px, -50%)', maxWidth: 200,
          background: '#fff', border: `1px solid ${t.ink10}`,
          padding: '6px 10px', borderRadius: 8, fontSize: 11,
          color: t.ink, boxShadow: t.shadowSm, zIndex: 5,
        }}>
          {a.text}
        </div>
      ))}
    </>
  );
}

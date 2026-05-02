import { theme, kicker, btnGhost } from '../lib/theme';

export default function AnnotationToolbar({ tool, setTool, count, helpAction }) {
  const t = theme;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: t.bgRaised, padding: '8px 14px', borderRadius: 12,
      boxShadow: t.shadowFlat,
    }}>
      <span style={{ ...kicker(t), marginRight: 4 }}>Tools</span>
      <ToolButton active={tool === 'draw'} onClick={() => setTool(tool === 'draw' ? null : 'draw')}>✎ Draw</ToolButton>
      <ToolButton active={tool === 'pin'}  onClick={() => setTool(tool === 'pin'  ? null : 'pin') }>◉ Pin</ToolButton>
      <ToolButton active={tool === 'note'} onClick={() => setTool(tool === 'note' ? null : 'note')}>✦ Note</ToolButton>
      <span style={{ fontSize: 11, color: t.ink55, marginLeft: 4 }}>
        {tool ? 'Click the clip to place' : 'Pick a tool, then click on the clip'}
      </span>
      <span style={{ flex: 1 }} />
      <span style={{ fontSize: 11, fontFamily: t.fontMono, color: t.ink45 }}>
        {count} annotation{count === 1 ? '' : 's'}
      </span>
      {helpAction && (
        <button onClick={helpAction} style={{ ...btnGhost(t), padding: '6px 10px', fontSize: 11 }}>
          How it works
        </button>
      )}
    </div>
  );
}

function ToolButton({ active, children, onClick }) {
  const t = theme;
  return (
    <button onClick={onClick} style={{
      padding: '6px 10px', borderRadius: 6, fontSize: 12, fontFamily: t.fontUI,
      background: active ? t.ink : 'transparent',
      color: active ? t.bg : t.ink,
      border: `1px solid ${active ? t.ink : t.ink10}`,
      cursor: 'pointer',
    }}>{children}</button>
  );
}

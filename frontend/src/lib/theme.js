export const theme = {
  bg:        '#f4f1ea',
  bgRaised:  '#ffffff',
  bgInset:   '#f9f7f1',
  ink:       '#282622',
  ink70:     'rgba(40,38,34,0.70)',
  ink55:     'rgba(40,38,34,0.55)',
  ink45:     'rgba(40,38,34,0.45)',
  ink25:     'rgba(40,38,34,0.25)',
  ink10:     'rgba(40,38,34,0.10)',
  ink06:     'rgba(40,38,34,0.06)',
  ink04:     'rgba(40,38,34,0.04)',
  red:       '#c8202c',
  redSoft:   'rgba(200,32,44,0.10)',
  redDeep:   '#a4151f',
  away:      'rgba(40,38,34,0.45)',

  fontUI:    '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
  fontMono:  '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
  fontDisp:  '"Fraunces", "Times New Roman", serif',

  radius:    10,
  radiusLg:  14,
  radiusSm:  8,
  shadow:    '0 1px 0 rgba(40,38,34,0.04), 0 12px 24px -16px rgba(40,38,34,0.20)',
  shadowSm:  '0 1px 0 rgba(40,38,34,0.04), 0 1px 3px rgba(40,38,34,0.06)',
  shadowFlat:'0 1px 0 rgba(40,38,34,0.04)',
};

export const kicker = (t = theme) => ({
  fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
  color: t.ink45, fontWeight: 500,
});
export const btnSolid = (t = theme) => ({
  background: t.ink, color: t.bg, border: 'none',
  padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
  fontFamily: t.fontUI, cursor: 'pointer',
});
export const btnGhost = (t = theme) => ({
  background: 'transparent', border: `1px solid ${t.ink10}`,
  padding: '8px 14px', borderRadius: 8, fontSize: 12, color: t.ink,
  fontFamily: t.fontUI, cursor: 'pointer',
});

export function formatTime(t) {
  if (!isFinite(t)) t = 0;
  const m = Math.floor(t / 60).toString().padStart(2, '0');
  const s = (t % 60).toFixed(1).padStart(4, '0');
  return `${m}:${s}`;
}

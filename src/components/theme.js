// components/theme.js — Design tokens (Option C, with red accents).
// Keep this file small; it's the source of truth ported to your real CSS.
window.theme = {
  // ─── Color ──────────────────────────────────────────────────────────────
  bg:        '#f4f1ea',          // warm paper
  bgRaised:  '#ffffff',          // cards
  bgInset:   '#f9f7f1',          // inputs / inset surfaces
  ink:       '#282622',          // near-black
  ink70:     'rgba(40,38,34,0.70)',
  ink55:     'rgba(40,38,34,0.55)',
  ink45:     'rgba(40,38,34,0.45)',
  ink25:     'rgba(40,38,34,0.25)',
  ink10:     'rgba(40,38,34,0.10)',
  ink06:     'rgba(40,38,34,0.06)',
  ink04:     'rgba(40,38,34,0.04)',
  red:       '#c8202c',          // accent
  redSoft:   'rgba(200,32,44,0.10)',
  redDeep:   '#a4151f',
  away:      'rgba(40,38,34,0.45)',

  // ─── Type ───────────────────────────────────────────────────────────────
  fontUI:    '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
  fontMono:  '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
  fontDisp:  '"Fraunces", "Times New Roman", serif',

  // ─── Geometry ───────────────────────────────────────────────────────────
  radius:    10,
  radiusLg:  14,
  radiusSm:  8,
  shadow:    '0 1px 0 rgba(40,38,34,0.04), 0 12px 24px -16px rgba(40,38,34,0.20)',
  shadowSm:  '0 1px 0 rgba(40,38,34,0.04), 0 1px 3px rgba(40,38,34,0.06)',
  shadowFlat:'0 1px 0 rgba(40,38,34,0.04)',
};

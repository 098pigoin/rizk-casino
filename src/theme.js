// theme.js
export const T = {
  bg:    '#080e1a',
  bg2:   '#0d1628',
  bg3:   '#111f36',
  bg4:   '#172540',
  bg5:   '#1c2d4f',
  bd:    '#1e3358',
  bdHi:  '#2a4a7a',
  teal:  '#00d4ff',
  tealD: '#00a8cc',
  green: '#00e87a',
  greenD:'#00bf64',
  red:   '#ff2d55',
  redD:  '#cc0033',
  gold:  '#ffd426',
  goldD: '#e6bb00',
  purple:'#bf5af2',
  orange:'#ff9f0a',
  pink:  '#ff375f',
  white: '#e8f0fa',
  text:  '#7a9ab8',
  muted: '#3a5575',
  dim:   '#090f1c',
};

export const FONT  = "'Space Grotesk', system-ui, sans-serif";
export const MONO  = "'JetBrains Mono', monospace";
export const PNL   = { background: T.bg2, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 18 };
export const INP   = {
  background: T.bg3, border: `1px solid ${T.bd}`, color: T.white,
  padding: '11px 50px 11px 14px', fontSize: 14, fontFamily: FONT,
  borderRadius: 8, outline: 'none', width: '100%', boxSizing: 'border-box',
  transition: 'border-color .2s, box-shadow .2s',
};

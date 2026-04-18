import { useEffect } from 'react';
import { T, FONT, MONO, PNL, INP } from './theme.js';

export { T, FONT, MONO, PNL, INP };

// ── RNG & MATH ────────────────────────────────────────────────────────────────
export const rng   = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
export const f4    = n => parseFloat(n || 0).toFixed(4);
export const f2    = n => parseFloat(n || 0).toFixed(2);
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const genCrash = () => {
  const r = Math.random();
  return r < 0.01 ? 1 : Math.max(1, parseFloat((0.99 / (1 - r * 0.99)).toFixed(2)));
};
export const multAt = ms => parseFloat(Math.pow(Math.E, 0.000066 * ms).toFixed(2));
export const minesMult = (k, N, m) => {
  if (!k) return 1;
  let p = 1, s = N - m;
  for (let i = 0; i < k; i++) p *= (s - i) / (N - i);
  return Math.max(1.01, parseFloat((0.97 / p).toFixed(2)));
};

// ── CARDS ─────────────────────────────────────────────────────────────────────
export const SUITS = ['♠','♥','♦','♣'];
export const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
export const RED_S = new Set(['♥','♦']);
export const RNUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

export const mkDeck = () => {
  const d = SUITS.flatMap(s => RANKS.map((r, i) => ({
    s, r, ri: i, v: 'JQK'.includes(r) ? 10 : r === 'A' ? 11 : +r
  })));
  for (let i = d.length - 1; i > 0; i--) {
    const j = rng(0, i); [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
};
export const handVal = h => {
  let t = h.reduce((s, c) => s + c.v, 0), a = h.filter(c => c.r === 'A').length;
  while (t > 21 && a--) t -= 10;
  return t;
};

// ── CRASH CANVAS ──────────────────────────────────────────────────────────────
export function drawCrashGraph(canvas, pts, crashed, cashed) {
  if (!canvas || pts.length < 2) return;
  const W = canvas.width, H = canvas.height, ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const maxM = Math.max(...pts.map(p => p.m), 2.5);
  const pad = { l: 32, r: 12, t: 12, b: 8 };
  const tx = i => (i / (pts.length - 1)) * (W - pad.l - pad.r) + pad.l;
  const ty = m => H - pad.b - ((m - 1) / (maxM - 1)) * (H - pad.t - pad.b);
  const col = crashed ? T.red : cashed ? T.green : T.teal;
  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(pad.l, H * i / 4); ctx.lineTo(W, H * i / 4); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.font = `9px ${MONO}`; ctx.textAlign = 'right';
  for (let i = 1; i <= 4; i++) { const m = 1 + (maxM - 1) * ((4 - i) / 4); ctx.fillText(`${m.toFixed(1)}×`, pad.l - 3, H * i / 4 + 3); }
  ctx.textAlign = 'left';
  // Fill
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, col + '55'); g.addColorStop(1, col + '00');
  ctx.beginPath(); ctx.moveTo(tx(0), H);
  pts.forEach((p, i) => ctx.lineTo(tx(i), ty(p.m)));
  ctx.lineTo(tx(pts.length - 1), H); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
  // Line
  ctx.beginPath(); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.shadowColor = col; ctx.shadowBlur = 10;
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(tx(i), ty(p.m)) : ctx.lineTo(tx(i), ty(p.m)));
  ctx.stroke(); ctx.shadowBlur = 0;
  // Tip dot
  if (!crashed) {
    const lx = tx(pts.length - 1), ly = ty(pts[pts.length - 1].m);
    ctx.beginPath(); ctx.arc(lx, ly, 5, 0, Math.PI * 2); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 16; ctx.fill(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(lx, ly, 10, 0, Math.PI * 2); ctx.strokeStyle = col + '44'; ctx.lineWidth = 1.5; ctx.stroke();
  }
}

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
export function Btn({ label, onClick, disabled, col, outline, sm, pulse, full = true, icon }) {
  col = col || T.teal;
  const darkText = col === T.teal || col === T.gold || col === T.goldD || col === T.green || col === T.greenD;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? T.dim : outline ? col + '1a' : `linear-gradient(135deg, ${col}, ${col}cc)`,
      color: disabled ? T.muted : outline ? col : darkText ? '#080e1a' : '#fff',
      border: `1px solid ${disabled ? T.bd : col}`,
      borderRadius: 9, padding: sm ? '8px 0' : '13px 0',
      width: full ? '100%' : 'auto',
      fontSize: sm ? 12 : 14, fontWeight: 700, letterSpacing: 0.3,
      cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: FONT,
      boxShadow: disabled || outline ? 'none' : `0 4px ${pulse ? 32 : 12}px ${col}${pulse ? '55' : '22'}, 0 2px 4px rgba(0,0,0,.3)`,
      animation: pulse && !disabled ? 'glow .8s infinite' : 'none',
      transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    }}>
      {icon && <span>{icon}</span>}{label}
    </button>
  );
}

export function BetRow({ val, set, disabled, bal }) {
  const a = parseFloat(val) || 0;
  return (
    <div>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 7, fontFamily: FONT, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 10 }}>Bet Amount</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['½×', () => set(f4(a / 2))], ['2×', () => set(f4(a * 2))], ['5×', () => set(f4(a * 5))], ['Max', () => set(f4(bal || 0))]].map(([l, fn]) => (
            <button key={l} onClick={fn} disabled={disabled} style={{ fontSize: 10, background: 'transparent', border: `1px solid ${T.bdHi}`, color: T.teal, padding: '2px 8px', borderRadius: 5, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: MONO, fontWeight: 700, transition: 'all .12s' }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <input type="number" value={val} min=".001" step=".01" onChange={e => set(e.target.value)} disabled={disabled} style={INP} />
        <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: T.teal, fontWeight: 700, pointerEvents: 'none', fontFamily: MONO }}>ETH</span>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0.01, 0.05, 0.10, 0.25, 0.50].map(v => (
          <button key={v} disabled={disabled} onClick={() => set(String(v))} style={{ flex: 1, background: T.bg3, border: `1px solid ${T.bd}`, color: T.teal, fontSize: 10, padding: '7px 0', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: MONO, borderRadius: 6, fontWeight: 700, transition: 'all .12s' }}>{v}</button>
        ))}
      </div>
    </div>
  );
}

export function PlayCard({ card, hidden, sm }) {
  const w = sm ? 44 : 58, h = sm ? 62 : 84;
  if (hidden) return <div style={{ width: w, height: h, borderRadius: 9, background: `linear-gradient(135deg, ${T.bg3}, ${T.bg5})`, border: `1px solid ${T.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: sm ? 22 : 30, flexShrink: 0, boxShadow: '0 6px 20px rgba(0,0,0,.6)' }}>🂠</div>;
  const red = RED_S.has(card.s);
  return (
    <div style={{ width: w, height: h, borderRadius: 9, background: 'linear-gradient(160deg,#fff,#f0e4ec)', border: '1px solid #bbb', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '5px 7px', fontSize: sm ? 11 : 13, fontWeight: 900, color: red ? '#e53935' : '#1a1a2e', flexShrink: 0, userSelect: 'none', boxShadow: '0 6px 20px rgba(0,0,0,.6)' }}>
      <div style={{ lineHeight: 1.2 }}>{card.r}<br />{card.s}</div>
      <div style={{ lineHeight: 1.2, transform: 'rotate(180deg)' }}>{card.r}<br />{card.s}</div>
    </div>
  );
}

export function WinToast({ win, text, big, onClose }) {
  const col = win ? T.green : T.red;
  useEffect(() => { if (!big) { const t = setTimeout(() => onClose?.(), 3500); return () => clearTimeout(t); } }, [big, onClose]);
  return (
    <div onClick={onClose} style={{ background: col + '14', border: `1px solid ${col}35`, borderRadius: 10, padding: big ? '14px 18px' : '10px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', boxShadow: big ? `0 0 32px ${col}30, 0 4px 16px rgba(0,0,0,.4)` : '0 2px 8px rgba(0,0,0,.3)', animation: big ? 'bigwin .4s ease-out' : 'fadein .2s ease-out' }}>
      <span style={{ fontSize: big ? 32 : 18, flexShrink: 0 }}>{win ? (big ? '🎊' : '✓') : '✗'}</span>
      <div style={{ flex: 1 }}>
        {big && <div style={{ fontSize: 10, color: col, fontFamily: FONT, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>BIG WIN!</div>}
        <div style={{ color: col, fontSize: big ? 15 : 13, fontWeight: 700, fontFamily: FONT }}>{text}</div>
      </div>
      {big && <span style={{ fontSize: 24 }}>🎉</span>}
    </div>
  );
}

export function HPill({ v }) {
  const col = v < 1.5 ? T.red : v < 3 ? T.gold : v < 10 ? T.green : T.teal;
  return <span style={{ background: col + '1a', color: col, border: `1px solid ${col}22`, borderRadius: 7, padding: '3px 10px', fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: MONO, cursor: 'default' }}>{(+v).toFixed(2)}×</span>;
}

export function StatBox({ label, val, col, sub }) {
  return (
    <div style={{ textAlign: 'center', background: T.bg3, borderRadius: 9, padding: '9px 6px', border: `1px solid ${T.bd}` }}>
      <div style={{ fontSize: 9, color: T.muted, fontFamily: FONT, marginBottom: 3, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: col || T.white, fontFamily: MONO, fontVariantNumeric: 'tabular-nums' }}>{val}</div>
      {sub && <div style={{ fontSize: 9, color: T.muted, fontFamily: FONT, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

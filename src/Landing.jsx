import { useState, useEffect } from 'react';
import { T, FONT, MONO } from './shared.jsx';

const STATS = [
  { label: 'Total Wagered', value: '14,820 ETH', icon: '⚡' },
  { label: 'Players Online', value: '1,247',      icon: '🟢' },
  { label: 'Biggest Win',   value: '50× · 2.1Ξ', icon: '🏆' },
  { label: 'Games',         value: '11',          icon: '🎮' },
];

const FEATURES = [
  { icon: '⚡', title: 'Instant Payouts',     desc: 'On-chain payouts via smart contract. Your funds, always.' },
  { icon: '🔒', title: 'Provably Fair',        desc: 'Every result verified with HMAC-SHA256. Fully transparent.' },
  { icon: '💸', title: '5% Rakeback',          desc: 'Earn 5% back on every wager, claimable anytime.' },
  { icon: '🎮', title: '11 Games',             desc: 'Crash, Mines, Plinko, Keno, Towers, Slots, and more.' },
  { icon: '📊', title: 'Live Activity Feed',   desc: 'Watch real bets happen in real time. Full transparency.' },
  { icon: '🏆', title: 'VIP Levels',           desc: 'Bronze to Platinum. More you play, more you earn back.' },
];

const GAMES_PREVIEW = [
  { icon: '🚀', name: 'Crash',     desc: 'Watch the multiplier climb — cash out before it crashes',  hot: true  },
  { icon: '💣', name: 'Mines',     desc: 'Reveal diamonds, avoid mines. Cash out anytime',            hot: true  },
  { icon: '🗼', name: 'Towers',    desc: 'Climb 8 levels — 1 hidden mine per row, ×1.45 per level',  isNew: true },
  { icon: '🎱', name: 'Keno',      desc: 'Pick up to 5 numbers from 80. 20 drawn live',               isNew: true },
  { icon: '🎯', name: 'Plinko',    desc: 'Drop a ball through pegs. Up to 10× on high risk',         hot: false },
  { icon: '🎡', name: 'Wheel',     desc: 'Spin for up to 50×. 24 segments, jackpot every 24 spins', hot: false },
];

function AnimatedNumber({ target, prefix = '', suffix = '' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const iv = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(iv); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(iv);
  }, [target]);
  return <span>{prefix}{val.toLocaleString()}{suffix}</span>;
}

export default function Landing({ onPlay }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: FONT, color: T.text, overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: T.bg + 'ee', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${T.bd}`, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${T.teal}, ${T.tealD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#080e1a', boxShadow: `0 0 24px ${T.teal}55` }}>R</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.white, letterSpacing: 3, lineHeight: 1 }}>RIZK</div>
            <div style={{ fontSize: 9, color: T.muted, letterSpacing: 2 }}>CRYPTO CASINO</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.green, fontFamily: FONT, fontWeight: 600 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.green, boxShadow: `0 0 7px ${T.green}`, animation: 'pulse 1.5s infinite' }} />
            1,247 online
          </div>
          <button onClick={onPlay} style={{ background: `linear-gradient(135deg, ${T.teal}, ${T.tealD})`, border: 'none', color: '#080e1a', padding: '11px 28px', fontSize: 14, fontWeight: 800, cursor: 'pointer', borderRadius: 10, fontFamily: FONT, boxShadow: `0 0 24px ${T.teal}44`, letterSpacing: 0.5 }}>
            Play Now →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '80px 32px 60px', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 300, background: `radial-gradient(ellipse, ${T.teal}18, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '60%', left: '30%', width: 300, height: 200, background: `radial-gradient(ellipse, ${T.purple}14, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{ display: 'inline-block', background: T.green + '18', border: `1px solid ${T.green}33`, borderRadius: 20, padding: '5px 16px', fontSize: 12, color: T.green, fontFamily: FONT, fontWeight: 700, letterSpacing: 1, marginBottom: 24, textTransform: 'uppercase' }}>
          🔥 11 Games · Provably Fair · 5% Rakeback
        </div>

        <h1 style={{ fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: 900, lineHeight: 1.05, marginBottom: 24, letterSpacing: -2, color: T.white }}>
          The Most Addictive<br />
          <span style={{ background: `linear-gradient(135deg, ${T.teal}, ${T.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Crypto Casino
          </span>
        </h1>

        <p style={{ fontSize: 18, color: T.text, maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.6, fontWeight: 400 }}>
          Crash, Mines, Towers, Keno, Plinko and 6 more. Instant payouts, provably fair, 5% rakeback on every bet.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 60 }}>
          <button onClick={onPlay} style={{ background: `linear-gradient(135deg, ${T.teal}, ${T.tealD})`, border: 'none', color: '#080e1a', padding: '16px 40px', fontSize: 16, fontWeight: 800, cursor: 'pointer', borderRadius: 12, fontFamily: FONT, boxShadow: `0 0 40px ${T.teal}55, 0 8px 24px rgba(0,0,0,.4)`, letterSpacing: 0.5 }}>
            🚀 Start Playing Free
          </button>
          <button onClick={onPlay} style={{ background: 'transparent', border: `1px solid ${T.bd}`, color: T.text, padding: '16px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer', borderRadius: 12, fontFamily: FONT }}>
            View Games ↓
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, maxWidth: 720, margin: '0 auto' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ background: T.bg2, border: `1px solid ${T.bd}`, borderRadius: 12, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.white, fontFamily: MONO, marginBottom: 3 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.muted, fontFamily: FONT }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Games grid */}
      <section style={{ padding: '60px 32px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: T.white, marginBottom: 10 }}>11 Games. All Provably Fair.</h2>
          <p style={{ fontSize: 15, color: T.muted }}>Every result on-chain verifiable. No house tricks.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {GAMES_PREVIEW.map((g, i) => (
            <div key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} onClick={onPlay}
              style={{ background: T.bg2, border: `1px solid ${hovered === i ? T.teal + '55' : T.bd}`, borderRadius: 14, padding: '20px', cursor: 'pointer', transition: 'all .2s', transform: hovered === i ? 'translateY(-3px)' : 'none', boxShadow: hovered === i ? `0 12px 36px rgba(0,0,0,.4), 0 0 24px ${T.teal}18` : '0 4px 16px rgba(0,0,0,.3)', position: 'relative', overflow: 'hidden' }}>
              {g.hot && <div style={{ position: 'absolute', top: 12, right: 12, background: T.red, borderRadius: 4, padding: '2px 7px', fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: FONT, letterSpacing: 0.5 }}>HOT</div>}
              {g.isNew && <div style={{ position: 'absolute', top: 12, right: 12, background: T.green, borderRadius: 4, padding: '2px 7px', fontSize: 9, fontWeight: 700, color: '#080e1a', fontFamily: FONT, letterSpacing: 0.5 }}>NEW</div>}
              <div style={{ fontSize: 40, marginBottom: 12 }}>{g.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.white, fontFamily: FONT, marginBottom: 6 }}>{g.name}</div>
              <div style={{ fontSize: 13, color: T.muted, fontFamily: FONT, lineHeight: 1.5 }}>{g.desc}</div>
            </div>
          ))}
          {/* +5 more */}
          <div onClick={onPlay} style={{ background: T.bg2, border: `1px solid ${T.bd}`, borderRadius: 14, padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, minHeight: 140 }}>
            <div style={{ fontSize: 32 }}>+5</div>
            <div style={{ fontSize: 14, color: T.muted, fontFamily: FONT }}>More games inside</div>
            <div style={{ fontSize: 12, color: T.teal, fontFamily: FONT, fontWeight: 600 }}>Blackjack · Roulette · Dice · Slots · Hi-Lo</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 32px', background: T.bg2, borderTop: `1px solid ${T.bd}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: T.white, marginBottom: 10 }}>Built Different</h2>
            <p style={{ fontSize: 15, color: T.muted }}>Not your average casino.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background: T.bg + '88', border: `1px solid ${T.bd}`, borderRadius: 12, padding: '20px' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.white, fontFamily: FONT, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: T.muted, fontFamily: FONT, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, ${T.teal}0e, transparent 70%)`, pointerEvents: 'none' }} />
        <h2 style={{ fontSize: 42, fontWeight: 900, color: T.white, marginBottom: 16 }}>Ready to play?</h2>
        <p style={{ fontSize: 16, color: T.muted, marginBottom: 36, maxWidth: 440, margin: '0 auto 36px' }}>No signup required. Demo mode — 1 ETH free. Connect wallet to play for real.</p>
        <button onClick={onPlay} style={{ background: `linear-gradient(135deg, ${T.teal}, ${T.tealD})`, border: 'none', color: '#080e1a', padding: '18px 52px', fontSize: 18, fontWeight: 800, cursor: 'pointer', borderRadius: 14, fontFamily: FONT, boxShadow: `0 0 50px ${T.teal}55, 0 8px 24px rgba(0,0,0,.4)`, letterSpacing: 0.5 }}>
          Enter RIZK →
        </button>
      </section>

      <footer style={{ textAlign: 'center', padding: '24px 32px', borderTop: `1px solid ${T.bd}`, fontSize: 11, color: T.muted, fontFamily: FONT }}>
        RIZK Casino · Demo Mode · Provably Fair · 18+ · Gamble Responsibly
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:.4;} }
        @keyframes fadein { from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:translateY(0);} }
      `}</style>
    </div>
  );
}

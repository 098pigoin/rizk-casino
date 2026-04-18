import { useEffect, useRef, useState } from 'react';
import { T } from './theme.js';

// ── INJECT GLOBAL KEYFRAMES ───────────────────────────────────────────────────
export function GameStyles() {
  useEffect(() => {
    if (document.getElementById('rizk-game-styles')) return;
    const s = document.createElement('style');
    s.id = 'rizk-game-styles';
    s.textContent = `
      @keyframes crashPulse { 0%,100%{transform:scale(1);filter:brightness(1)} 50%{transform:scale(1.06);filter:brightness(1.3)} }
      @keyframes crashShake { 0%,100%{transform:translateX(0)} 10%,50%,90%{transform:translateX(-8px) rotate(-1deg)} 30%,70%{transform:translateX(8px) rotate(1deg)} }
      @keyframes crashBust { 0%{transform:scale(1);filter:brightness(1)} 20%{transform:scale(1.15);filter:brightness(2)} 100%{transform:scale(1);filter:brightness(1)} }
      @keyframes gemPop { 0%{transform:scale(0) rotate(-20deg);opacity:0} 60%{transform:scale(1.25) rotate(5deg);opacity:1} 100%{transform:scale(1) rotate(0deg);opacity:1} }
      @keyframes bombPop { 0%{transform:scale(0);filter:blur(4px)} 50%{transform:scale(1.3);filter:blur(0)} 100%{transform:scale(1);filter:blur(0)} }
      @keyframes tileFlip { 0%{transform:perspective(400px) rotateY(90deg);opacity:0} 100%{transform:perspective(400px) rotateY(0);opacity:1} }
      @keyframes sparkle { 0%{opacity:1;transform:scale(0) translate(0,0)} 100%{opacity:0;transform:scale(1) translate(var(--tx),var(--ty))} }
      @keyframes diceRoll { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(8deg) scale(1.05)} 75%{transform:rotate(-8deg) scale(1.05)} }
      @keyframes diceLand { 0%{transform:scale(1.3)} 60%{transform:scale(0.95)} 100%{transform:scale(1)} }
      @keyframes numFlash { 0%{opacity:.3} 50%{opacity:1} 100%{opacity:.3} }
      @keyframes confettiFall { 0%{transform:translateY(-10px) rotate(0deg);opacity:1} 100%{transform:translateY(180px) rotate(720deg);opacity:0} }
      @keyframes winPulse { 0%,100%{box-shadow:0 0 20px var(--wc)} 50%{box-shadow:0 0 50px var(--wc),0 0 80px var(--wc)} }
      @keyframes slotSpin { 0%{transform:translateY(0)} 100%{transform:translateY(-62px)} }
      @keyframes roulettePop { 0%{transform:translate(-50%,-50%) scale(0)} 60%{transform:translate(-50%,-50%) scale(1.25)} 100%{transform:translate(-50%,-50%) scale(1)} }
      @keyframes plinkoTrail { 0%{opacity:.7;transform:scale(1)} 100%{opacity:0;transform:scale(.3)} }
      @keyframes pegHit { 0%,100%{background:var(--pc)} 30%{background:#fff;box-shadow:0 0 12px #fff} }
      @keyframes bigWinEntry { 0%{transform:scale(0) rotate(-10deg);opacity:0} 70%{transform:scale(1.1) rotate(2deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
      @keyframes floatUp { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(-60px);opacity:0} }
      @keyframes hilo-flip { 0%{transform:perspective(600px) rotateY(0)} 50%{transform:perspective(600px) rotateY(90deg)} 100%{transform:perspective(600px) rotateY(0)} }
      @keyframes wheelGlow { 0%,100%{filter:drop-shadow(0 0 8px rgba(255,200,0,.4))} 50%{filter:drop-shadow(0 0 24px rgba(255,200,0,.9))} }
    `;
    document.head.appendChild(s);
  }, []);
  return null;
}

// ── CONFETTI BURST ─────────────────────────────────────────────────────────────
export function Confetti({ trigger, big }) {
  const [particles, setParts] = useState([]);
  useEffect(() => {
    if (!trigger) return;
    const colors = [T.gold, T.green, T.teal, T.purple, T.orange, '#ff6b6b', '#fff'];
    const count = big ? 48 : 24;
    setParts(Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      color: colors[Math.floor(Math.random() * colors.length)],
      left: Math.random() * 100,
      size: 5 + Math.random() * 8,
      delay: Math.random() * 0.4,
      dur: 0.8 + Math.random() * 0.6,
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    })));
    const t = setTimeout(() => setParts([]), 2000);
    return () => clearTimeout(t);
  }, [trigger, big]);

  if (!particles.length) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 99, overflow: 'hidden' }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: 0, left: `${p.left}%`,
          width: p.size, height: p.size,
          borderRadius: p.shape === 'circle' ? '50%' : '2px',
          background: p.color,
          animation: `confettiFall ${p.dur}s ease-in ${p.delay}s forwards`,
          transform: 'translateY(-10px)',
        }} />
      ))}
    </div>
  );
}

// ── FLOATING WIN TEXT ──────────────────────────────────────────────────────────
export function FloatText({ text, color, trigger }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (!trigger) return;
    setVis(true);
    const t = setTimeout(() => setVis(false), 900);
    return () => clearTimeout(t);
  }, [trigger]);
  if (!vis) return null;
  return (
    <div style={{
      position: 'absolute', top: '40%', left: '50%',
      transform: 'translateX(-50%)',
      color, fontSize: 22, fontWeight: 900,
      fontFamily: "'Space Grotesk', sans-serif",
      textShadow: `0 0 20px ${color}`,
      animation: 'floatUp .9s ease-out forwards',
      pointerEvents: 'none', zIndex: 50, whiteSpace: 'nowrap',
    }}>{text}</div>
  );
}

// ── SPARKLE PARTICLES AROUND A POINT ─────────────────────────────────────────
export function Sparkles({ active, color = T.gold, count = 8 }) {
  if (!active) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 360;
        const dist = 24 + Math.random() * 16;
        const tx = `${Math.cos(angle * Math.PI / 180) * dist}px`;
        const ty = `${Math.sin(angle * Math.PI / 180) * dist}px`;
        return (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 4, height: 4, borderRadius: '50%',
            background: color,
            '--tx': tx, '--ty': ty,
            animation: `sparkle .6s ease-out ${i * 0.05}s forwards`,
            marginLeft: -2, marginTop: -2,
          }} />
        );
      })}
    </div>
  );
}

import { useState } from 'react';
import { T, FONT, MONO, PNL } from './shared.jsx';

export default function Rakeback({ wagered, onClaim }) {
  const RATE     = 0.05; // 5% rakeback
  const available = parseFloat((wagered * RATE).toFixed(4));
  const [claimed, setClaimed] = useState(0);
  const claimable = Math.max(0, parseFloat((available - claimed).toFixed(4)));
  const pct = Math.min(100, (claimable / 0.5) * 100); // fills bar toward 0.5 ETH

  const doClaim = () => {
    if (claimable <= 0) return;
    onClaim(claimable);
    setClaimed(c => parseFloat((c + claimable).toFixed(4)));
  };

  return (
    <div style={{ ...PNL, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>💸</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.white, fontFamily: FONT }}>Rakeback</div>
            <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT }}>5% back on all wagers</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: claimable > 0 ? T.green : T.muted, fontFamily: MONO }}>{claimable.toFixed(4)}Ξ</div>
          <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT }}>available</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: T.bg3, borderRadius: 50, overflow: 'hidden', marginBottom: 10, border: `1px solid ${T.bd}` }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${T.green}, ${T.teal})`, borderRadius: 50, transition: 'width .4s ease-out', boxShadow: `0 0 8px ${T.green}55` }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: T.muted, fontFamily: FONT }}>Total wagered: <b style={{ color: T.teal }}>{wagered.toFixed(4)}Ξ</b></span>
        <button onClick={doClaim} disabled={claimable <= 0} style={{ background: claimable > 0 ? `linear-gradient(135deg, ${T.green}, ${T.greenD})` : T.bg3, border: `1px solid ${claimable > 0 ? T.green : T.bd}`, color: claimable > 0 ? '#080e1a' : T.muted, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: claimable > 0 ? 'pointer' : 'not-allowed', borderRadius: 8, fontFamily: FONT, boxShadow: claimable > 0 ? `0 0 14px ${T.green}44` : 'none', transition: 'all .15s' }}>
          {claimable > 0 ? 'Claim' : 'No rakeback yet'}
        </button>
      </div>
    </div>
  );
}

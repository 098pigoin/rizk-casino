import { useState, useEffect } from 'react';
import { T, FONT, MONO, PNL } from './shared.jsx';

const NAMES = ['shadow_x','apeKing','n0tguru','rizk_pro','d3gen_az','cryptoRam','wagmi99','Kingman_G','degen42','AzRipper','gr1nder','NightOwl','LuckyAce','volcanoBet','DegenRam','Moon_B'];
const GAMES = ['Crash','Mines','Wheel','Plinko','Slots','Keno','Towers'];
const MEDALS = ['🥇','🥈','🥉'];

function genEntry(rank) {
  const profit = rank === 1
    ? +(Math.random() * 8 + 4).toFixed(2)
    : rank <= 3
    ? +(Math.random() * 4 + 1).toFixed(2)
    : +(Math.random() * 2).toFixed(2);
  return {
    rank,
    name: NAMES[Math.floor(Math.random() * NAMES.length)],
    game: GAMES[Math.floor(Math.random() * GAMES.length)],
    profit,
    mult: +(1.5 + Math.random() * 20).toFixed(2),
    wager: +(Math.random() * 5 + 0.5).toFixed(2),
  };
}

export default function Leaderboard({ myWins, myWag, myPnl }) {
  const [tab, setTab]   = useState('today');
  const [board, setBoard] = useState(() => Array.from({ length: 10 }, (_, i) => genEntry(i + 1)));

  useEffect(() => {
    const iv = setInterval(() => {
      setBoard(prev => {
        const next = [...prev];
        // Occasionally shuffle top entries
        if (Math.random() > 0.6) {
          const i = Math.floor(Math.random() * 5) + 1;
          next[i] = genEntry(i + 1);
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ ...PNL, padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🏆</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.white, fontFamily: FONT }}>Leaderboard</span>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {[['today', 'Today'], ['week', 'Week'], ['alltime', 'All Time']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === k ? T.gold : 'transparent'}`, color: tab === k ? T.gold : T.muted, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, transition: 'all .15s' }}>{l}</button>
          ))}
        </div>
      </div>

      {/* My stats */}
      {myPnl !== 0 && (
        <div style={{ background: T.teal + '0e', borderBottom: `1px solid ${T.teal}22`, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: T.teal, fontFamily: FONT, fontWeight: 600 }}>👤 You</span>
          <span style={{ fontSize: 11, color: T.text, fontFamily: FONT }}>Wagered {myWag.toFixed(3)}Ξ</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: myPnl > 0 ? T.green : T.red, fontFamily: MONO }}>{myPnl > 0 ? '+' : ''}{myPnl.toFixed(4)}Ξ</span>
        </div>
      )}

      {/* Board */}
      <div>
        {board.map((e, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 60px 70px', gap: 6, padding: '9px 16px', borderBottom: `1px solid ${T.bd}12`, alignItems: 'center', background: i === 0 ? T.gold + '08' : 'transparent', animation: 'fadein .3s ease-out' }}>
            <span style={{ fontSize: i < 3 ? 16 : 12, textAlign: 'center', color: i < 3 ? T.gold : T.muted, fontFamily: MONO, fontWeight: 700 }}>{i < 3 ? MEDALS[i] : `${i + 1}`}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.white, fontFamily: FONT }}>{e.name}</div>
              <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT }}>{e.game} · ×{e.mult}</div>
            </div>
            <span style={{ fontSize: 10, color: T.muted, fontFamily: MONO, textAlign: 'right' }}>{e.wager}Ξ</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.green, fontFamily: MONO, textAlign: 'right' }}>+{e.profit}Ξ</span>
          </div>
        ))}
      </div>
    </div>
  );
}

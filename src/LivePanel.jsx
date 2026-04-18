import { useState, useEffect } from 'react';
import { T, FONT, MONO, INP } from './shared.jsx';

const NAMES = ['shadow_x','apeKing','n0tguru','rizk_pro','d3gen_az','cryptoRam','wagmi99','Kingman_G','degen42','AzRipper','gr1nder','NightOwl','LuckyAce','volcanoBet','DegenRam','Moon_B','CryptoKid'];
const GAMES = ['Crash','Mines','Plinko','Slots','Hi-Lo','Wheel','Blackjack','Roulette','Dice','Keno','Towers'];
const CHATS = ['nice!','lets gooo 🚀','gg wp','on a heater','sick run','lfg!!!','who else up?','this game goes hard','rizk is goated','running it up 💎','degen hours','first deposit already up','this crash gonna fly','wp everyone'];

let _id = 0;
const mkBet = () => {
  const won = Math.random() > 0.46;
  const bet = +(Math.floor(Math.random() * 250 + 1) / 100).toFixed(2);
  const mult = won ? parseFloat((1 + Math.random() * 18).toFixed(2)) : 0;
  const pnl = won ? parseFloat((bet * (mult - 1)).toFixed(2)) : -bet;
  return { id: ++_id, n: NAMES[Math.floor(Math.random() * NAMES.length)], g: GAMES[Math.floor(Math.random() * GAMES.length)], bet, pnl, won, mult };
};
const mkChat = () => ({ id: ++_id, n: NAMES[Math.floor(Math.random() * NAMES.length)], m: CHATS[Math.floor(Math.random() * CHATS.length)], ts: Date.now() });

export default function LivePanel() {
  const [tab, setTab] = useState('bets');
  const [bets, setBets] = useState(() => Array.from({ length: 16 }, mkBet));
  const [chat, setChat] = useState(() => Array.from({ length: 8 }, mkChat));
  const [msg, setMsg] = useState('');
  const [online] = useState(() => Math.floor(Math.random() * 800 + 300));

  useEffect(() => {
    const iv = setInterval(() => {
      setBets(b => [mkBet(), ...b.slice(0, 49)]);
      if (Math.random() > 0.55) setChat(c => [mkChat(), ...c.slice(0, 49)]);
    }, Math.floor(Math.random() * 1200 + 400));
    return () => clearInterval(iv);
  }, []);

  const send = () => {
    if (!msg.trim()) return;
    setChat(c => [{ id: ++_id, n: 'You', m: msg.trim() }, ...c.slice(0, 49)]);
    setMsg('');
  };

  return (
    <div style={{ background: T.bg2, border: `1px solid ${T.bd}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 480 }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {[['bets', '🎲 Bets'], ['chat', '💬 Chat']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === k ? T.teal : 'transparent'}`, color: tab === k ? T.teal : T.muted, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, transition: 'all .15s' }}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: T.green, fontFamily: FONT, fontWeight: 600 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, boxShadow: `0 0 6px ${T.green}`, animation: 'pulse 1.5s infinite' }} />
          {online.toLocaleString()} online
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'bets' && bets.map(e => (
          <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '86px 56px 1fr 64px', gap: 4, padding: '6px 14px', borderBottom: `1px solid ${T.bd}14`, alignItems: 'center', animation: 'fadein .2s ease-out' }}>
            <span style={{ fontSize: 11, color: T.teal, fontFamily: FONT, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.n}</span>
            <span style={{ fontSize: 10, color: T.muted, fontFamily: FONT }}>{e.g}</span>
            <span style={{ fontSize: 11, color: T.text, fontFamily: MONO }}>{e.bet}Ξ</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: e.won ? T.green : T.red, textAlign: 'right', fontFamily: MONO }}>{e.won ? '+' : ''}{e.pnl.toFixed(2)}</span>
          </div>
        ))}
        {tab === 'chat' && chat.map(e => (
          <div key={e.id} style={{ padding: '7px 14px', borderBottom: `1px solid ${T.bd}14`, animation: 'fadein .2s ease-out' }}>
            <span style={{ fontSize: 11, color: e.n === 'You' ? T.gold : T.teal, fontWeight: 700, fontFamily: FONT, marginRight: 7 }}>{e.n}</span>
            <span style={{ fontSize: 12, color: T.text, fontFamily: FONT }}>{e.m}</span>
          </div>
        ))}
      </div>

      {/* Chat input */}
      {tab === 'chat' && (
        <div style={{ borderTop: `1px solid ${T.bd}`, padding: '8px 10px', display: 'flex', gap: 6 }}>
          <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Say something…" style={{ ...INP, flex: 1, padding: '8px 12px', fontSize: 12, minWidth: 0 }} />
          <button onClick={send} style={{ background: T.teal, border: 'none', color: '#080e1a', padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', borderRadius: 8, fontFamily: FONT, flexShrink: 0 }}>Send</button>
        </div>
      )}
    </div>
  );
}

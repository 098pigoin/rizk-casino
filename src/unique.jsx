import { useState, useEffect, useRef, useCallback } from 'react';
import { T, FONT, MONO, PNL, INP, rng, f4, Btn, BetRow } from './shared.jsx';
import { GameStyles, Confetti } from './effects.jsx';

// ══════════════════════════════════════════════════════════════════════════════
//  CASE OPENINGS — CS:GO style unboxing with crypto multipliers
//  NO OTHER CASINO HAS THIS BUILT IN
// ══════════════════════════════════════════════════════════════════════════════

const CASES = {
  bronze: {
    name: 'Bronze Case',
    price: 0.01,
    color: '#cd7f32',
    icon: '📦',
    items: [
      { name: 'Bust',    mult: 0,    color: '#ff2d55', chance: 35, rarity: 'common'     },
      { name: 'Bust',    mult: 0,    color: '#ff2d55', chance: 25, rarity: 'common'     },
      { name: '×1.2',   mult: 1.2,  color: '#7a9ab8', chance: 15, rarity: 'common'     },
      { name: '×1.5',   mult: 1.5,  color: '#00d4ff', chance: 10, rarity: 'uncommon'   },
      { name: '×2',     mult: 2,    color: '#00e87a', chance: 7,  rarity: 'uncommon'   },
      { name: '×3',     mult: 3,    color: '#bf5af2', chance: 4,  rarity: 'rare'       },
      { name: '×5',     mult: 5,    color: '#FFD426', chance: 3,  rarity: 'epic'       },
      { name: '×10',    mult: 10,   color: '#ff9f0a', chance: 1,  rarity: 'legendary'  },
    ]
  },
  gold: {
    name: 'Gold Case',
    price: 0.05,
    color: '#FFD426',
    icon: '🏆',
    items: [
      { name: 'Bust',    mult: 0,    color: '#ff2d55', chance: 25, rarity: 'common'    },
      { name: '×1.5',   mult: 1.5,  color: '#7a9ab8', chance: 20, rarity: 'common'    },
      { name: '×2',     mult: 2,    color: '#00d4ff', chance: 18, rarity: 'uncommon'  },
      { name: '×3',     mult: 3,    color: '#00e87a', chance: 15, rarity: 'uncommon'  },
      { name: '×5',     mult: 5,    color: '#bf5af2', chance: 10, rarity: 'rare'      },
      { name: '×10',    mult: 10,   color: '#FFD426', chance: 7,  rarity: 'epic'      },
      { name: '×25',    mult: 25,   color: '#ff9f0a', chance: 4,  rarity: 'legendary' },
      { name: '×50',    mult: 50,   color: '#ff2d55', chance: 1,  rarity: 'mythic'    },
    ]
  },
  diamond: {
    name: 'Diamond Case',
    price: 0.25,
    color: '#00d4ff',
    icon: '💎',
    items: [
      { name: '×2',     mult: 2,    color: '#00d4ff', chance: 30, rarity: 'uncommon'  },
      { name: '×3',     mult: 3,    color: '#00e87a', chance: 25, rarity: 'uncommon'  },
      { name: '×5',     mult: 5,    color: '#bf5af2', chance: 20, rarity: 'rare'      },
      { name: '×10',    mult: 10,   color: '#FFD426', chance: 12, rarity: 'epic'      },
      { name: '×25',    mult: 25,   color: '#ff9f0a', chance: 7,  rarity: 'legendary' },
      { name: '×100',   mult: 100,  color: '#ff2d55', chance: 4,  rarity: 'mythic'    },
      { name: '×500',   mult: 500,  color: '#00d4ff', chance: 2,  rarity: 'ancient'   },
    ]
  }
};

const RARITY_COLORS = {
  common: '#7a9ab8', uncommon: '#00e87a', rare: '#bf5af2',
  epic: '#FFD426', legendary: '#ff9f0a', mythic: '#ff2d55', ancient: '#00d4ff'
};

function CaseItem({ item, size = 80 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, flexShrink: 0,
      background: `linear-gradient(145deg, ${item.color}22, ${T.bg3})`,
      border: `2px solid ${item.color}66`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 0 12px ${item.color}33`,
    }}>
      <div style={{ fontSize: size > 60 ? 22 : 16, fontWeight: 900, color: item.color, fontFamily: MONO }}>{item.name}</div>
      <div style={{ fontSize: 9, color: RARITY_COLORS[item.rarity], fontFamily: FONT, textTransform: 'uppercase', letterSpacing: 1, marginTop: 3 }}>{item.rarity}</div>
    </div>
  );
}

export function CaseOpenings({ bal, onWin, onLose }) {
  const [selectedCase, setCase] = useState('bronze');
  const [phase, setPhase] = useState('select'); // select | rolling | result
  const [scrollX, setScrollX] = useState(0);
  const [items, setItems] = useState([]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [confetti, setConf] = useState(0);
  const [multiOpen, setMultiOpen] = useState(false);
  const [multiResults, setMultiResults] = useState([]);
  const scrollRef = useRef(null);
  const animRef = useRef(null);

  const cs = CASES[selectedCase];

  function weightedPick(items) {
    const total = items.reduce((s, i) => s + i.chance, 0);
    let r = Math.random() * total;
    for (const item of items) { r -= item.chance; if (r <= 0) return item; }
    return items[items.length - 1];
  }

  const openCase = useCallback(() => {
    const price = cs.price;
    if (bal < price) return;
    onLose(price);
    setPhase('rolling');
    setResult(null);
    setMultiResults([]);

    // Build reel: 40 random items + forced result at position 33
    const winner = weightedPick(cs.items);
    const reel = Array.from({ length: 50 }, (_, i) =>
      i === 33 ? winner : cs.items[Math.floor(Math.random() * cs.items.length)]
    );
    setItems(reel);

    const ITEM_W = 90, REEL_W = reel.length * ITEM_W;
    const targetIdx = 33;
    const targetX = -(targetIdx * ITEM_W - 320 + ITEM_W / 2);

    let start = null, duration = 4200;
    const from = 0, to = targetX;

    const easeOut = t => 1 - Math.pow(1 - t, 4);

    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = easeOut(progress);
      setScrollX(from + (to - from) * eased);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setScrollX(targetX);
        setResult(winner);
        setPhase('result');
        setHistory(h => [winner, ...h.slice(0, 19)]);
        if (winner.mult > 0) {
          const profit = parseFloat((price * winner.mult - price).toFixed(4));
          onWin(profit);
          if (winner.mult >= 5) setConf(c => c + 1);
        }
      }
    };
    animRef.current = requestAnimationFrame(animate);
  }, [cs, bal, onWin, onLose]);

  const openMulti = useCallback(async () => {
    const price = cs.price * 3;
    if (bal < price) return;
    onLose(price);
    setPhase('rolling');
    const results = [weightedPick(cs.items), weightedPick(cs.items), weightedPick(cs.items)];

    await new Promise(r => setTimeout(r, 800));
    setMultiResults([results[0]]);
    await new Promise(r => setTimeout(r, 600));
    setMultiResults([results[0], results[1]]);
    await new Promise(r => setTimeout(r, 600));
    setMultiResults(results);

    let totalProfit = 0;
    results.forEach(r => { if (r.mult > 0) totalProfit += parseFloat((cs.price * r.mult - cs.price).toFixed(4)); });
    if (totalProfit > 0) { onWin(totalProfit); if (results.some(r => r.mult >= 5)) setConf(c => c + 1); }
    setPhase('result');
    setHistory(h => [...results, ...h.slice(0, 17)]);
  }, [cs, bal, onWin, onLose]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  return (
    <div>
      <GameStyles />
      {/* Recent drops ticker */}
      {history.length > 0 && (
        <div style={{ display: 'flex', gap: 5, overflowX: 'auto', marginBottom: 10, paddingBottom: 2 }}>
          {history.map((h, i) => (
            <div key={i} style={{ flexShrink: 0, background: h.color + '1a', border: `1px solid ${h.color}44`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: h.color, fontFamily: MONO }}>
              {h.name}
            </div>
          ))}
        </div>
      )}

      {/* Case selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
        {Object.entries(CASES).map(([key, c]) => (
          <button key={key} onClick={() => { setCase(key); setPhase('select'); setResult(null); }} style={{
            background: selectedCase === key ? c.color + '22' : T.bg3,
            border: `2px solid ${selectedCase === key ? c.color : T.bd}`,
            borderRadius: 12, padding: '12px 8px', cursor: 'pointer',
            transition: 'all .2s', boxShadow: selectedCase === key ? `0 0 20px ${c.color}44` : 'none',
          }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{c.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: selectedCase === key ? c.color : T.muted, fontFamily: FONT }}>{c.name}</div>
            <div style={{ fontSize: 11, color: T.teal, fontFamily: MONO, fontWeight: 700 }}>{c.price} ETH</div>
          </button>
        ))}
      </div>

      {/* Main case opening area */}
      <div style={{ ...PNL, marginBottom: 12, padding: '0', overflow: 'hidden', position: 'relative' }}>
        <Confetti trigger={confetti} big />

        {phase === 'select' && (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>{cs.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: cs.color, fontFamily: FONT, marginBottom: 8 }}>{cs.name}</div>
            <div style={{ fontSize: 12, color: T.muted, fontFamily: FONT, marginBottom: 20 }}>Contains {cs.items.length} possible items</div>
            {/* Odds table */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {cs.items.map((item, i) => (
                <div key={i} style={{ background: item.color + '1a', border: `1px solid ${item.color}44`, borderRadius: 6, padding: '4px 10px', fontSize: 10, color: item.color, fontFamily: MONO, fontWeight: 700 }}>
                  {item.name} <span style={{ color: T.muted, fontWeight: 400 }}>({item.chance}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === 'rolling' && !multiOpen && (
          <div style={{ padding: '20px 0', position: 'relative' }}>
            {/* Pointer */}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 10, fontSize: 20, color: T.gold, filter: `drop-shadow(0 0 10px ${T.gold})` }}>▼</div>
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 10, fontSize: 20, color: T.gold, filter: `drop-shadow(0 0 10px ${T.gold})` }}>▲</div>
            {/* Center highlight */}
            <div style={{ position: 'absolute', left: 'calc(50% - 47px)', top: 20, width: 94, height: 'calc(100% - 40px)', background: cs.color + '11', border: `2px solid ${cs.color}66`, borderRadius: 10, zIndex: 1 }} />
            {/* Reel */}
            <div style={{ overflow: 'hidden', height: 100, position: 'relative' }}>
              <div style={{ display: 'flex', gap: 8, position: 'absolute', transform: `translateX(${scrollX}px)`, willChange: 'transform', padding: '10px 0' }}>
                {items.map((item, i) => <CaseItem key={i} item={item} size={84} />)}
              </div>
            </div>
          </div>
        )}

        {/* Multi-open result */}
        {phase === 'rolling' && multiOpen && (
          <div style={{ padding: '24px 20px', display: 'flex', justifyContent: 'center', gap: 16 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ opacity: multiResults[i] ? 1 : 0.2, transition: 'opacity .3s' }}>
                {multiResults[i] ? <CaseItem item={multiResults[i]} size={90} /> :
                  <div style={{ width: 90, height: 90, borderRadius: 10, background: T.bg3, border: `2px solid ${T.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>{cs.icon}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Result reveal */}
        {phase === 'result' && result && !multiOpen && (
          <div style={{ padding: '28px 20px', textAlign: 'center', background: result.color + '0a' }}>
            <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>You got</div>
            <div style={{ fontSize: 56, fontWeight: 900, color: result.color, fontFamily: MONO, textShadow: `0 0 40px ${result.color}`, animation: 'bigWinEntry .5s cubic-bezier(.17,.67,.41,1.3)', marginBottom: 8 }}>{result.name}</div>
            <div style={{ fontSize: 12, color: RARITY_COLORS[result.rarity], fontFamily: FONT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>{result.rarity}</div>
            {result.mult > 0 && <div style={{ fontSize: 14, color: T.green, fontFamily: FONT, marginTop: 8 }}>+{f4(cs.price * result.mult - cs.price)} ETH profit</div>}
          </div>
        )}

        {phase === 'result' && multiResults.length > 0 && multiOpen && (
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', gap: 12 }}>
            {multiResults.map((r, i) => <div key={i} style={{ animation: `gemPop .3s ease-out ${i * 0.15}s both` }}><CaseItem item={r} size={90} /></div>)}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={PNL}>
        {(phase === 'select' || phase === 'result') && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <Btn label={`📦 Open (${cs.price} ETH)`} onClick={() => { setMultiOpen(false); openCase(); }} disabled={bal < cs.price} col={cs.color} pulse />
              <Btn label={`📦📦📦 Open 3 (${f4(cs.price * 3)} ETH)`} onClick={() => { setMultiOpen(true); openMulti(); }} disabled={bal < cs.price * 3} col={T.purple} outline />
            </div>
            {phase === 'result' && <Btn label="Open Another" onClick={() => setPhase('select')} col={T.muted} outline />}
          </>
        )}
        {phase === 'rolling' && <div style={{ textAlign: 'center', color: T.gold, fontFamily: FONT, fontWeight: 700, animation: 'numFlash .6s ease-in-out infinite' }}>✨ Opening…</div>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  PvP DUELS — 1v1 betting battles
//  GENUINELY UNIQUE — no mainstream casino has built-in PvP like this
// ══════════════════════════════════════════════════════════════════════════════

const DUEL_GAMES = [
  { id: 'dice',  name: 'Dice Duel',   desc: 'Both roll 0-100. Highest wins.',    icon: '🎲' },
  { id: 'coin',  name: 'Coin Flip',   desc: 'Call heads or tails.',              icon: '🪙' },
  { id: 'rps',   name: 'Rock Paper Scissors', desc: 'Classic 3-round battle.',  icon: '✊' },
  { id: 'race',  name: 'Crash Race',  desc: 'Whoever crashes higher wins.',      icon: '🚌' },
];

// Simulated opponent names for when no real player joins
const BOT_NAMES = ['CryptoKing', 'DiamondHands', 'HODLR', 'MoonBoy', 'WagmiChad', 'Degen_98', 'SatoshiJr'];

function DuelCard({ duel, onAccept, isOwn }) {
  return (
    <div style={{ ...PNL, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: `1px solid ${T.gold}44`, background: T.gold + '08', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 28 }}>{DUEL_GAMES.find(g => g.id === duel.game)?.icon}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.white, fontFamily: FONT }}>{duel.creator} challenges you</div>
          <div style={{ fontSize: 11, color: T.muted, fontFamily: FONT }}>{DUEL_GAMES.find(g => g.id === duel.game)?.name}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: T.gold, fontFamily: MONO }}>{duel.amount} ETH</div>
        {!isOwn && <button onClick={() => onAccept(duel)} style={{ marginTop: 6, background: T.green, border: 'none', color: T.bg, padding: '5px 14px', borderRadius: 7, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>ACCEPT</button>}
        {isOwn && <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT, marginTop: 4 }}>Waiting…</div>}
      </div>
    </div>
  );
}

function playDuel(gameId) {
  // Returns [myScore, opponentScore, myWins]
  if (gameId === 'dice') {
    const my = rng(0, 100), opp = rng(0, 100);
    return { my, opp, win: my > opp, draw: my === opp, desc: `You rolled ${my}, opponent rolled ${opp}` };
  }
  if (gameId === 'coin') {
    const my = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
    const opp = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
    const call = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
    const win = call === my;
    return { my: call, opp: my, win, draw: false, desc: `You called ${call}, coin landed ${my}` };
  }
  if (gameId === 'rps') {
    const moves = ['✊ Rock', '✋ Paper', '✌️ Scissors'];
    let myWins = 0;
    const rounds = Array.from({ length: 3 }, () => {
      const m = Math.floor(Math.random() * 3), o = Math.floor(Math.random() * 3);
      const w = (m === 0 && o === 2) || (m === 1 && o === 0) || (m === 2 && o === 1);
      if (w) myWins++;
      return { my: moves[m], opp: moves[o], win: w };
    });
    return { my: myWins, opp: 3 - myWins, win: myWins >= 2, draw: myWins === 1.5, desc: `You won ${myWins}/3 rounds`, rounds };
  }
  if (gameId === 'race') {
    const myMult = parseFloat((1 + Math.random() * 8).toFixed(2));
    const oppMult = parseFloat((1 + Math.random() * 8).toFixed(2));
    return { my: myMult, opp: oppMult, win: myMult > oppMult, draw: false, desc: `Your crash: ${myMult}×, theirs: ${oppMult}×` };
  }
  return { win: Math.random() > 0.5, draw: false, desc: 'Game over' };
}

export function PvPDuels({ bal, user, onWin, onLose }) {
  const [tab, setTab] = useState('lobby'); // lobby | create | result
  const [betAmount, setBet] = useState('0.05');
  const [gameType, setGame] = useState('dice');
  const [duels, setDuels] = useState([
    { id: 1, creator: 'CryptoKing', game: 'dice', amount: '0.05' },
    { id: 2, creator: 'DiamondHands', game: 'coin', amount: '0.10' },
    { id: 3, creator: 'MoonBoy', game: 'race', amount: '0.02' },
  ]);
  const [myDuels, setMyDuels] = useState([]);
  const [battle, setBattle] = useState(null);
  const [result, setResult] = useState(null);
  const [fighting, setFighting] = useState(false);
  const [confetti, setConf] = useState(0);
  const [roundAnim, setRoundAnim] = useState([]);

  const createDuel = () => {
    const amt = parseFloat(betAmount);
    if (!amt || amt > bal) return;
    const duel = { id: Date.now(), creator: user?.username || 'You', game: gameType, amount: betAmount };
    setMyDuels(d => [duel, ...d]);
    setTab('lobby');
    // Simulate someone accepting after 8-15 seconds
    setTimeout(() => {
      const opponent = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      setMyDuels(d => d.filter(x => x.id !== duel.id));
      startBattle(duel, opponent);
    }, 5000 + Math.random() * 8000);
  };

  const acceptDuel = (duel) => {
    const amt = parseFloat(duel.amount);
    if (amt > bal) return;
    setDuels(d => d.filter(x => x.id !== duel.id));
    startBattle(duel, duel.creator);
  };

  const startBattle = async (duel, opponentName) => {
    setFighting(true); setResult(null); setRoundAnim([]);
    setBattle({ duel, opponent: opponentName });
    setTab('result');
    onLose(parseFloat(duel.amount));

    await new Promise(r => setTimeout(r, 1000));
    const outcome = playDuel(duel.game);

    // Animate rounds for RPS
    if (duel.game === 'rps' && outcome.rounds) {
      for (const round of outcome.rounds) {
        await new Promise(r => setTimeout(r, 700));
        setRoundAnim(a => [...a, round]);
      }
    }

    await new Promise(r => setTimeout(r, 800));
    setResult(outcome);
    setFighting(false);

    if (!outcome.draw) {
      if (outcome.win) {
        const prize = parseFloat(duel.amount) * 1.9; // 5% house cut
        onWin(prize);
        setConf(c => c + 1);
      }
      // Re-add a random duel to lobby
      setTimeout(() => {
        const newDuel = { id: Date.now(), creator: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)], game: DUEL_GAMES[Math.floor(Math.random() * DUEL_GAMES.length)].id, amount: (Math.random() * 0.09 + 0.01).toFixed(3) };
        setDuels(d => [newDuel, ...d.slice(0, 4)]);
      }, 3000);
    }
  };

  return (
    <div>
      <GameStyles />
      {/* Tab bar */}
      <div style={{ display: 'flex', background: T.bg2, borderRadius: 10, padding: 4, marginBottom: 12, gap: 4 }}>
        {['lobby', 'create'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '9px 0', borderRadius: 7, border: 'none', background: tab === t ? T.bg4 : 'transparent', color: tab === t ? T.white : T.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, textTransform: 'capitalize', transition: 'all .15s' }}>{t === 'lobby' ? '🥊 Lobby' : '⚔️ Create Duel'}</button>
        ))}
      </div>

      {/* LOBBY */}
      {tab === 'lobby' && (
        <div>
          {myDuels.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: T.teal, fontFamily: FONT, fontWeight: 700, marginBottom: 8, letterSpacing: 2, textTransform: 'uppercase' }}>Your Active Duels</div>
              {myDuels.map(d => <DuelCard key={d.id} duel={d} onAccept={() => {}} isOwn />)}
            </div>
          )}
          <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT, fontWeight: 700, marginBottom: 8, letterSpacing: 2, textTransform: 'uppercase' }}>Open Challenges</div>
          {duels.map(d => <DuelCard key={d.id} duel={d} onAccept={acceptDuel} />)}
          {duels.length === 0 && <div style={{ textAlign: 'center', color: T.muted, fontFamily: FONT, padding: '20px 0', fontSize: 13 }}>No open duels. Create one!</div>}
        </div>
      )}

      {/* CREATE */}
      {tab === 'create' && (
        <div>
          <div style={{ ...PNL, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: T.muted, fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>Choose Game</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {DUEL_GAMES.map(g => (
                <button key={g.id} onClick={() => setGame(g.id)} style={{ background: gameType === g.id ? T.teal + '22' : T.bg3, border: `1px solid ${gameType === g.id ? T.teal : T.bd}`, borderRadius: 10, padding: '12px 10px', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', boxShadow: gameType === g.id ? `0 0 14px ${T.teal}33` : 'none' }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{g.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: gameType === g.id ? T.teal : T.white, fontFamily: FONT }}>{g.name}</div>
                  <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT, marginTop: 2 }}>{g.desc}</div>
                </button>
              ))}
            </div>
            <BetRow val={betAmount} set={setBet} bal={bal} />
          </div>
          <Btn label="⚔️ Create Duel Challenge" onClick={createDuel} disabled={!parseFloat(betAmount) || parseFloat(betAmount) > bal} pulse />
          <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT, textAlign: 'center', marginTop: 8 }}>Challenge goes live — anyone can accept. Bot fills in if no one joins in 15s.</div>
        </div>
      )}

      {/* BATTLE / RESULT */}
      {tab === 'result' && (
        <div style={{ ...PNL, textAlign: 'center', position: 'relative', padding: '28px 20px' }}>
          <Confetti trigger={confetti} big />
          {fighting && (
            <div>
              <div style={{ fontSize: 48, marginBottom: 12, animation: 'diceRoll .5s ease-in-out infinite' }}>⚔️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.teal, fontFamily: FONT }}>Battle in progress…</div>
              {battle && <div style={{ fontSize: 13, color: T.muted, fontFamily: FONT, marginTop: 8 }}>vs {battle.opponent}</div>}
              {/* RPS rounds */}
              {roundAnim.length > 0 && <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {roundAnim.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: T.bg3, borderRadius: 8, padding: '8px 16px', animation: 'bigWinEntry .3s ease-out' }}>
                    <span style={{ color: r.win ? T.green : T.red, fontFamily: MONO, fontWeight: 700 }}>{r.my}</span>
                    <span style={{ color: T.muted, fontSize: 11 }}>Round {i + 1}</span>
                    <span style={{ color: T.muted, fontFamily: MONO, fontWeight: 700 }}>{r.opp}</span>
                  </div>
                ))}
              </div>}
            </div>
          )}
          {result && !fighting && (
            <div>
              <div style={{ fontSize: 52, marginBottom: 12, animation: 'bigWinEntry .4s ease-out' }}>{result.win ? '🏆' : result.draw ? '🤝' : '💀'}</div>
              <div style={{ fontSize: 28, fontWeight: 900, fontFamily: FONT, color: result.win ? T.green : result.draw ? T.teal : T.red, marginBottom: 8, animation: 'bigWinEntry .4s cubic-bezier(.17,.67,.41,1.3)' }}>
                {result.win ? 'YOU WIN!' : result.draw ? 'DRAW' : 'YOU LOSE'}
              </div>
              <div style={{ fontSize: 13, color: T.muted, fontFamily: FONT, marginBottom: 8 }}>{result.desc}</div>
              {battle && <div style={{ fontSize: 12, color: T.muted, fontFamily: FONT }}>vs {battle.opponent}</div>}
              {result.win && <div style={{ fontSize: 15, color: T.green, fontFamily: MONO, marginTop: 12, fontWeight: 700 }}>+{f4(parseFloat(battle?.duel?.amount || 0) * 0.9)} ETH</div>}
              <div style={{ marginTop: 20 }}>
                <Btn label="Back to Lobby" onClick={() => setTab('lobby')} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  COMMUNITY JACKPOT — Live ticker, every bet contributes, random winner
//  Shows up in sidebar — creates FOMO and community feeling
// ══════════════════════════════════════════════════════════════════════════════
export function JackpotTicker({ jackpot, onContribute }) {
  const [anim, setAnim] = useState(false);
  const prevRef = useRef(jackpot);

  useEffect(() => {
    if (jackpot !== prevRef.current) {
      setAnim(true);
      setTimeout(() => setAnim(false), 400);
      prevRef.current = jackpot;
    }
  }, [jackpot]);

  return (
    <div style={{ background: `linear-gradient(135deg, ${T.gold}15, ${T.bg3})`, border: `1px solid ${T.gold}44`, borderRadius: 12, padding: '12px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, color: T.gold, fontFamily: FONT, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>💰 Community Jackpot</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: T.gold, fontFamily: MONO, animation: anim ? 'diceLand .3s ease-out' : 'none', textShadow: `0 0 20px ${T.gold}66` }}>
            {f4(jackpot)} ETH
          </div>
          <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT, marginTop: 2 }}>1% of every bet contributes · Random winner hourly</div>
        </div>
        <div style={{ fontSize: 36, animation: anim ? 'crashPulse .4s ease-out' : 'none' }}>🎰</div>
      </div>
    </div>
  );
}

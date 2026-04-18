import { useState, useEffect, useRef, useCallback } from 'react';
import { T, FONT, MONO, PNL, INP, rng, f4, f2, genCrash, multAt, minesMult, mkDeck, handVal, drawCrashGraph, Btn, BetRow, PlayCard, WinToast, HPill, RED_S, RNUMS } from './shared.jsx';
import { GameStyles, Confetti, FloatText, Sparkles } from './effects.jsx';

// ══════════════════════════════════════════════════════════════════════════════
//  CRASH  — starfield canvas, glowing mult, screen shake on bust
// ══════════════════════════════════════════════════════════════════════════════
export function Crash({ bal, onWin, onLose }) {
  const [st, setSt]     = useState('cd');
  const [cd, setCd]     = useState(5);
  const [mult, setM]    = useState(1);
  const [bet, setBet]   = useState('0.05');
  const [auto, setAuto] = useState('');
  const [on, setOn]     = useState(false);
  const [cashed, setC]  = useState(false);
  const [coM, setCoM]   = useState(null);
  const [hist, setH]    = useState([8.41, 1.23, 24, 1.55, 4.02, 2.77, 1.01, 11.5, 3.3, 56.2, 2.1]);
  const [toast, setTt]  = useState(null);
  const [shake, setShake]= useState(false);
  const [confetti, setConf] = useState(0);
  const cvRef = useRef(null), pts = useRef([]);
  const stR = useRef('cd'), onR = useRef(false), cR = useRef(false);
  const bR = useRef(0.05), aR = useRef(''), cpR = useRef(null);
  const t0 = useRef(null), tv = useRef(null), ctv = useRef(null);
  const starsRef = useRef([]);

  // Starfield
  useEffect(() => {
    starsRef.current = Array.from({ length: 60 }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.5 + 0.3, spd: Math.random() * 0.2 + 0.05
    }));
  }, []);

  const drawStars = useCallback((ctx, W, H, t) => {
    starsRef.current.forEach(s => {
      const x = s.x * W, y = ((s.y + s.spd * t / 6000) % 1) * H;
      ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.1 + s.r * 0.15})`; ctx.fill();
    });
  }, []);

  useEffect(() => { stR.current = st; }, [st]);
  useEffect(() => { onR.current = on; }, [on]);
  useEffect(() => { cR.current = cashed; }, [cashed]);
  useEffect(() => { bR.current = parseFloat(bet) || 0; }, [bet]);
  useEffect(() => { aR.current = auto; }, [auto]);

  const doCash = useCallback((m) => {
    if (!onR.current || cR.current) return;
    cR.current = true; setC(true); setCoM(m);
    const profit = parseFloat((bR.current * m - bR.current).toFixed(4));
    onWin(profit);
    setTt({ w: true, t: `Cashed out ×${m.toFixed(2)} · +${f4(profit)} ETH`, big: profit > 0.1 });
    if (profit > 0.1) setConf(c => c + 1);
  }, [onWin]);

  const runRound = useCallback(() => {
    const cp = genCrash(); cpR.current = cp; t0.current = Date.now();
    pts.current = []; setSt('fly'); stR.current = 'fly'; setM(1); setShake(false);
    tv.current = setInterval(() => {
      const ms = Date.now() - t0.current, m = multAt(ms);
      pts.current.push({ m });
      const ac = parseFloat(aR.current);
      if (onR.current && !cR.current && ac >= 1.01 && m >= ac) {
        const sm = parseFloat(m.toFixed(2));
        cR.current = true; setC(true); setCoM(sm);
        const p = parseFloat((bR.current * sm - bR.current).toFixed(4));
        onWin(p); setTt({ w: true, t: `Auto ×${sm.toFixed(2)} · +${f4(p)} ETH`, big: p > 0.1 });
        if (p > 0.1) setConf(c => c + 1);
      }
      if (m >= cpR.current) {
        clearInterval(tv.current); setM(cpR.current); setSt('bust'); stR.current = 'bust';
        pts.current.push({ m: cpR.current });
        const cv = cvRef.current;
        if (cv) { const ctx = cv.getContext('2d'); ctx.clearRect(0, 0, cv.width, cv.height); drawStars(ctx, cv.width, cv.height, ms); }
        drawCrashGraph(cvRef.current, pts.current, true, cR.current);
        if (onR.current && !cR.current) { onLose(bR.current); setTt({ w: false, t: `Crashed ×${cpR.current.toFixed(2)} · -${f4(bR.current)} ETH` }); }
        setShake(true); setTimeout(() => setShake(false), 600);
        setOn(false); setH(h => [cpR.current, ...h.slice(0, 19)]);
        setTimeout(startCD, 3000);
      } else {
        setM(parseFloat(m.toFixed(2)));
        const cv = cvRef.current;
        if (cv) {
          const ctx = cv.getContext('2d'); ctx.clearRect(0, 0, cv.width, cv.height);
          drawStars(ctx, cv.width, cv.height, ms);
          drawCrashGraph(cv, pts.current, false, cR.current);
        }
      }
    }, 50);
  }, [onWin, onLose, drawStars]);

  const startCD = useCallback(() => {
    setSt('cd'); stR.current = 'cd'; setOn(false); setC(false); cR.current = false; onR.current = false;
    setCoM(null); setTt(null); pts.current = []; setShake(false);
    const c = cvRef.current; if (c) { const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height); drawStars(ctx, c.width, c.height, 0); }
    let n = 5; setCd(n); clearInterval(ctv.current);
    ctv.current = setInterval(() => { n--; setCd(n); if (n <= 0) { clearInterval(ctv.current); runRound(); } }, 1000);
  }, [runRound, drawStars]);

  useEffect(() => { startCD(); return () => { clearInterval(tv.current); clearInterval(ctv.current); }; }, []);
  useEffect(() => {
    const fn = e => { if (e.code === 'Space' && stR.current === 'fly') { e.preventDefault(); doCash(parseFloat((pts.current[pts.current.length - 1] || { m: 1 }).m.toFixed(2))); } };
    window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn);
  }, [doCash]);

  const dc = st === 'bust' ? T.red : cashed ? T.green : st === 'fly' ? T.teal : T.muted;
  const pnl = on && !cashed && st === 'fly' ? parseFloat((parseFloat(bet) * mult - parseFloat(bet)).toFixed(4)) : null;
  const multAnim = st === 'fly' && !cashed ? 'crashPulse .6s ease-in-out infinite' : st === 'bust' ? 'crashBust .4s ease-out forwards' : 'none';

  return (
    <div>
      <GameStyles />
      <div style={{ position: 'relative', display: 'flex', gap: 5, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }}>
        {hist.map((h, i) => <HPill key={i} v={h} />)}
      </div>
      <div style={{
        ...PNL, marginBottom: 12, padding: 0, overflow: 'hidden', position: 'relative',
        animation: shake ? 'crashShake .5s ease-out' : 'none',
        boxShadow: st === 'fly' ? `0 0 30px ${T.teal}22` : st === 'bust' ? `0 0 40px ${T.red}33` : 'none',
        transition: 'box-shadow .3s',
      }}>
        <Confetti trigger={confetti} big />
        <canvas ref={cvRef} width={400} height={200} style={{ width: '100%', height: 200, display: 'block', background: `linear-gradient(180deg, ${T.bg} 0%, ${T.bg2} 100%)` }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {st === 'cd' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: T.muted, fontFamily: FONT, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Next round in</div>
              <div style={{ fontSize: 68, fontWeight: 900, color: T.teal, fontFamily: MONO, lineHeight: 1, textShadow: `0 0 40px ${T.teal}` }}>{cd}</div>
            </div>
          )}
          {(st === 'fly' || st === 'bust') && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64, fontWeight: 900, color: dc, fontFamily: MONO, lineHeight: 1, animation: multAnim, textShadow: `0 0 ${st === 'fly' ? 40 : 60}px ${dc}, 0 0 80px ${dc}55`, transition: 'color .1s, text-shadow .1s', fontVariantNumeric: 'tabular-nums' }}>{mult.toFixed(2)}×</div>
              {pnl !== null && <div style={{ fontSize: 14, color: T.green, fontFamily: MONO, marginTop: 4, fontWeight: 700, textShadow: `0 0 12px ${T.green}` }}>+{f4(pnl)} ETH</div>}
              {cashed && coM && <div style={{ fontSize: 13, color: T.green, fontFamily: FONT, marginTop: 4 }}>✓ Cashed ×{coM.toFixed(2)}</div>}
              {st === 'bust' && !cashed && on && <div style={{ fontSize: 16, color: T.red, fontFamily: FONT, fontWeight: 700, marginTop: 6, animation: 'crashBust .4s ease-out' }}>💥 BUST</div>}
            </div>
          )}
        </div>
      </div>
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={PNL}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <BetRow val={bet} set={setBet} disabled={on} bal={bal} />
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 7, fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>Auto Cash-Out</div>
            <div style={{ position: 'relative' }}>
              <input type="number" placeholder="e.g. 2.00" value={auto} onChange={e => setAuto(e.target.value)} disabled={on} min="1.01" step=".1" style={{ ...INP, paddingRight: 40 }} />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: T.teal, fontWeight: 700, pointerEvents: 'none', fontFamily: MONO }}>×</span>
            </div>
            {auto && parseFloat(auto) >= 1.01 && <div style={{ fontSize: 10, color: T.teal, marginTop: 5, fontFamily: FONT }}>Auto cash at {parseFloat(auto).toFixed(2)}×</div>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: on ? '1fr 1fr' : '1fr', gap: 8 }}>
          {!on && st !== 'fly' && <Btn label={st === 'cd' ? `Bet (round in ${cd}s)` : 'Waiting…'} onClick={() => { if (st === 'cd' && !on) { onLose(parseFloat(bet) || 0); setOn(true); onR.current = true; } }} disabled={!parseFloat(bet) || parseFloat(bet) > bal || on || st === 'bust'} pulse={st === 'cd'} />}
          {!on && st === 'fly' && <Btn label="Place Bet (next round)" onClick={() => {}} disabled col={T.muted} />}
          {on && st === 'fly' && !cashed && <Btn label={`Cash Out ×${mult.toFixed(2)}`} onClick={() => doCash(parseFloat(mult.toFixed(2)))} col={T.green} pulse />}
          {on && <Btn label={cashed ? `Cashed ×${coM?.toFixed(2)}` : 'Cancel'} onClick={() => { if (!cashed) { setOn(false); onR.current = false; } }} col={cashed ? T.green : T.red} outline sm />}
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: T.muted, fontFamily: FONT, textAlign: 'center' }}>Press <kbd style={{ background: T.bg3, border: `1px solid ${T.bd}`, borderRadius: 3, padding: '0 5px', color: T.text }}>SPACE</kbd> to cash out instantly</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  MINES — 3D tile flip, sparkles on gems, explosion on bombs
// ══════════════════════════════════════════════════════════════════════════════
const N = 25;
export function Mines({ bal, onWin, onLose }) {
  const [mc, setMc]   = useState(5);
  const [bet, setBet] = useState('0.05');
  const [phase, setP] = useState('bet');
  const [tiles, setT] = useState(Array(N).fill('h'));
  const [mines, setMines] = useState([]);
  const [rev, setRev] = useState(0);
  const [cur, setCur] = useState(1);
  const [toast, setTt] = useState(null);
  const [confetti, setConf] = useState(0);
  const [justRevealed, setJR] = useState(-1);

  const start = () => {
    const a = parseFloat(bet); if (!a || a > bal) return;
    onLose(a);
    const ms = new Set();
    while (ms.size < mc) ms.add(rng(0, N - 1));
    setMines([...ms]); setT(Array(N).fill('h')); setRev(0); setCur(1); setP('p'); setTt(null); setJR(-1);
  };

  const reveal = (i) => {
    if (phase !== 'p' || tiles[i] !== 'h') return;
    const isMine = mines.includes(i);
    setJR(i);
    setT(prev => { const n = [...prev]; n[i] = isMine ? 'b' : 's'; return n; });
    if (isMine) {
      const final = tiles.map((t, j) => t !== 'h' ? t : mines.includes(j) ? 'b' : t);
      setTimeout(() => setT(final), 300);
      setP('d'); onWin(0);
      setTt({ w: false, t: `Hit a mine! Lost ${f4(parseFloat(bet))} ETH` });
    } else {
      const nr = rev + 1, nm = minesMult(nr, N, mc);
      setRev(nr); setCur(nm);
      if (nr === N - mc) { cashout(nm, nr); }
    }
  };

  const cashout = (overM, overR) => {
    const m = overM ?? cur, r = overR ?? rev;
    if (r === 0) return;
    const profit = parseFloat((parseFloat(bet) * m - parseFloat(bet)).toFixed(4));
    onWin(profit);
    setTt({ w: true, t: `Cashed out ×${m.toFixed(2)} · +${f4(profit)} ETH`, big: m >= 5 });
    if (m >= 3) setConf(c => c + 1);
    setP('d');
    const final = tiles.map((t, j) => t !== 'h' ? t : mines.includes(j) ? 'b' : t);
    setTimeout(() => setT(final), 200);
  };

  const reset = () => { setP('bet'); setT(Array(N).fill('h')); setMines([]); setRev(0); setCur(1); setTt(null); setJR(-1); };

  const bombCount = tiles.filter(t => t === 'b').length;

  return (
    <div>
      <GameStyles />
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      {phase === 'p' && <div style={{ ...PNL, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: `linear-gradient(90deg, ${T.bg2}, ${T.bg3})` }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: .5 }}>Revealed</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.white, fontFamily: MONO }}>{rev}/{N - mc}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: .5 }}>Multiplier</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: T.green, fontFamily: MONO, textShadow: `0 0 20px ${T.green}` }}>{cur.toFixed(2)}×</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: .5 }}>Profit</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.green, fontFamily: MONO }}>{f4(parseFloat(bet) * cur - parseFloat(bet))}</div>
        </div>
      </div>}
      <div style={{ ...PNL, marginBottom: 12, position: 'relative' }}>
        <Confetti trigger={confetti} big />
        {phase === 'bet' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
          {Array(N).fill(0).map((_, i) => (
            <div key={i} style={{ aspectRatio: '1', borderRadius: 8, background: `linear-gradient(135deg, ${T.bg3}, ${T.bg4})`, border: `1px solid ${T.bd}`, animation: `pulse ${1.5 + (i % 5) * 0.1}s ease-in-out infinite` }} />
          ))}
        </div>}
        {phase !== 'bet' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
          {tiles.map((t, i) => {
            const isBomb = t === 'b', isSafe = t === 's', isHidden = t === 'h';
            const isJustRevealed = i === justRevealed;
            const isActiveMine = isBomb && bombCount === 1;
            return (
              <div key={i} style={{ position: 'relative', aspectRatio: '1' }}>
                <button onClick={() => reveal(i)} disabled={phase !== 'p' || !isHidden}
                  style={{
                    width: '100%', height: '100%',
                    borderRadius: 8, fontSize: 22, cursor: phase === 'p' && isHidden ? 'pointer' : 'default',
                    border: `1px solid ${isBomb ? T.red + '88' : isSafe ? T.green + '66' : T.bd}`,
                    background: isBomb
                      ? `radial-gradient(circle at 40% 35%, ${T.red}33, ${T.bg})`
                      : isSafe
                        ? `radial-gradient(circle at 40% 35%, ${T.green}22, ${T.bg2})`
                        : `linear-gradient(135deg, ${T.bg3}, ${T.bg4})`,
                    boxShadow: isBomb ? `0 0 20px ${T.red}66` : isSafe ? `0 0 16px ${T.green}44` : isHidden && phase === 'p' ? `inset 0 0 0 1px ${T.bdHi}` : 'none',
                    animation: isSafe && isJustRevealed ? 'gemPop .35s cubic-bezier(.17,.67,.41,1.3) forwards' : isBomb && isActiveMine ? 'bombPop .3s ease-out forwards' : isHidden && phase === 'p' ? 'none' : 'tileFlip .25s ease-out forwards',
                    transition: 'border-color .2s, box-shadow .2s',
                    outline: 'none',
                  }}>
                  {isBomb ? '💥' : isSafe ? '💎' : ''}
                </button>
                {isSafe && isJustRevealed && <Sparkles active color={T.green} count={6} />}
              </div>
            );
          })}
        </div>}
      </div>
      <div style={PNL}>
        {phase === 'bet' && <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginBottom: 10, fontFamily: FONT, fontWeight: 600 }}>
              <span>Mines: <b style={{ color: T.red }}>{mc}</b></span>
              <span>Safe tiles: <b style={{ color: T.green }}>{N - mc}</b></span>
              <span>1st pick: <b style={{ color: T.teal }}>×{minesMult(1, N, mc).toFixed(2)}</b></span>
            </div>
            <input type="range" min="1" max="20" value={mc} onChange={e => setMc(+e.target.value)} style={{ width: '100%', accentColor: T.red, cursor: 'pointer', height: 4 }} />
          </div>
          <BetRow val={bet} set={setBet} bal={bal} />
          <div style={{ marginTop: 14 }}><Btn label="Place Bet" onClick={start} disabled={!parseFloat(bet) || parseFloat(bet) > bal} pulse /></div>
        </>}
        {phase === 'p' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Btn label={rev > 0 ? `Cash Out ×${cur.toFixed(2)}` : 'Reveal a tile first'} onClick={() => cashout()} disabled={rev === 0} col={T.green} pulse={rev > 0} />
          <Btn label="Give Up" onClick={reset} col={T.red} outline sm />
        </div>}
        {phase === 'd' && <Btn label="Play Again" onClick={reset} />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  PLINKO — glowing ball with trail, pegs light up on hit
// ══════════════════════════════════════════════════════════════════════════════
const PB = { low: [0.5,1,1.5,2,3,2,1.5,1,0.5], medium: [0.3,0.5,1,2,5,2,1,0.5,0.3], high: [0.2,0.3,0.5,1,10,1,0.5,0.3,0.2] };

export function Plinko({ bal, onWin, onLose }) {
  const [bet, setBet]   = useState('0.05');
  const [risk, setRisk] = useState('medium');
  const [drop, setDrop] = useState(false);
  const [path, setPath] = useState([]);
  const [step, setStep] = useState(-1);
  const [land, setLand] = useState(null);
  const [hist, setHist] = useState([]);
  const [toast, setTt]  = useState(null);
  const [confetti, setConf] = useState(0);
  const [hitPeg, setHitPeg] = useState(null);
  const bkts = PB[risk], COLS = bkts.length, CW = 36, CH = 34, ROWS = 8;

  const go = useCallback(async () => {
    const a = parseFloat(bet); if (!a || a > bal || drop) return;
    setDrop(true); setLand(null); setTt(null); setPath([]); setStep(-1); setHitPeg(null);
    let col = Math.floor(COLS / 2);
    const pts = [];
    for (let r = 0; r < ROWS; r++) { col = Math.max(0, Math.min(COLS - 1, col + (Math.random() < 0.5 ? -1 : 1))); pts.push({ row: r, col }); }
    setPath(pts);
    for (let i = 0; i < pts.length; i++) {
      setStep(i); setHitPeg(`${pts[i].row}-${pts[i].col}`);
      await new Promise(res => setTimeout(res, 165));
      setHitPeg(null);
    }
    const bkt = pts[pts.length - 1].col, m = bkts[bkt], profit = parseFloat((a * m - a).toFixed(4));
    setLand(bkt); setHist(h => [{ m, w: m > 1 }, ...h.slice(0, 19)]);
    setTt({ w: m > 1, t: m > 1 ? `×${m} Win! +${f4(profit)} ETH` : `×${m} · -${f4(a)} ETH`, big: m >= 5 });
    if (profit > 0) onWin(profit); else if (profit < 0) onLose(a * (1 - m));
    if (m >= 3) setConf(c => c + 1);
    setDrop(false);
  }, [bet, bal, drop, bkts, onWin, onLose]);

  const bp = step >= 0 && step < path.length ? path[step] : null;
  return (
    <div>
      <GameStyles />
      {hist.length > 0 && <div style={{ display: 'flex', gap: 5, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }}>{hist.map((h, i) => { const c = h.m < 1 ? T.red : h.m < 2 ? T.gold : T.green; return <span key={i} style={{ background: c + '1a', color: c, border: `1px solid ${c}22`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: MONO }}>×{h.m}</span>; })}</div>}
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={{ ...PNL, marginBottom: 12, padding: '18px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', background: `radial-gradient(ellipse at top, ${T.bg3} 0%, ${T.bg} 70%)` }}>
        <Confetti trigger={confetti} big />
        <div style={{ position: 'relative', width: COLS * CW, height: (ROWS + 2) * CH, flexShrink: 0 }}>
          {Array.from({ length: ROWS }, (_, row) => {
            const cnt = row % 2 === 0 ? COLS - 1 : COLS, off = row % 2 === 0 ? CW / 2 : 0;
            return Array.from({ length: cnt }, (_, col) => {
              const key = `${row}-${col}`, isHit = hitPeg === key;
              return (
                <div key={key} style={{
                  position: 'absolute', left: col * CW + off + CW / 2 - 6, top: row * CH + CH / 2 - 6,
                  width: 12, height: 12, borderRadius: '50%',
                  background: isHit ? T.teal : T.bg4,
                  border: `1px solid ${isHit ? T.teal : T.bdHi}`,
                  boxShadow: isHit ? `0 0 16px ${T.teal}, 0 0 6px ${T.teal}` : '0 0 4px rgba(0,0,0,.4)',
                  transition: 'all .08s',
                  '--pc': T.bg4,
                  animation: isHit ? 'pegHit .25s ease-out' : 'none',
                }} />
              );
            });
          })}
          {/* Ball */}
          {bp && (
            <div style={{
              position: 'absolute',
              left: bp.col * CW + CW / 2 - 11, top: bp.row * CH + CH / 2 - 11,
              width: 22, height: 22, borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, #fff, ${T.teal})`,
              boxShadow: `0 0 24px ${T.teal}, 0 0 48px ${T.teal}66, 0 3px 8px rgba(0,0,0,.5)`,
              transition: 'all .16s cubic-bezier(.4,0,.2,1)', zIndex: 10,
            }} />
          )}
          {/* Trail */}
          {path.slice(Math.max(0, step - 3), step).map((p, i) => (
            <div key={`trail-${i}`} style={{
              position: 'absolute',
              left: p.col * CW + CW / 2 - 5, top: p.row * CH + CH / 2 - 5,
              width: 10, height: 10, borderRadius: '50%',
              background: T.teal,
              opacity: (i + 1) * 0.12,
              pointerEvents: 'none',
            }} />
          ))}
          {/* Buckets */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', display: 'flex', gap: 3 }}>
            {bkts.map((m, i) => {
              const il = land === i, bc = m < 1 ? T.red : m < 2 ? T.gold : m < 5 ? T.green : T.teal;
              return (
                <div key={i} style={{
                  flex: 1, padding: '6px 2px', textAlign: 'center', borderRadius: 6,
                  background: il ? bc + '2a' : T.bg3, border: `1px solid ${il ? bc : T.bd}`,
                  transition: 'all .25s', boxShadow: il ? `0 0 20px ${bc}88, inset 0 0 12px ${bc}22` : 'none',
                  animation: il ? 'bigWinEntry .3s ease-out' : 'none',
                }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: il ? bc : T.muted, fontFamily: MONO, textShadow: il ? `0 0 8px ${bc}` : 'none' }}>{m}×</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={PNL}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <BetRow val={bet} set={setBet} disabled={drop} bal={bal} />
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 7, fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Risk Level</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {['low', 'medium', 'high'].map(r => {
                const rc = r === 'low' ? T.green : r === 'medium' ? T.gold : T.red;
                return <button key={r} onClick={() => setRisk(r)} disabled={drop} style={{ flex: 1, background: risk === r ? rc + '22' : T.bg3, border: `1px solid ${risk === r ? rc : T.bd}`, color: risk === r ? rc : T.muted, borderRadius: 7, padding: '10px 4px', fontSize: 11, fontWeight: 600, cursor: drop ? 'not-allowed' : 'pointer', fontFamily: FONT, transition: 'all .15s', textTransform: 'capitalize', boxShadow: risk === r ? `0 0 12px ${rc}44` : 'none' }}>{r}</button>;
              })}
            </div>
          </div>
        </div>
        <Btn label={drop ? '🎱 Ball dropping…' : '🎱 Drop Ball'} onClick={go} disabled={drop || !parseFloat(bet) || parseFloat(bet) > bal} pulse={!drop} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  DICE — rolling blur animation, 3D die visual
// ══════════════════════════════════════════════════════════════════════════════
export function Dice({ bal, onWin, onLose }) {
  const [bet, setBet] = useState('0.05');
  const [tgt, setTgt] = useState(50);
  const [mode, setMode] = useState('under');
  const [rolling, setR] = useState(false);
  const [disp, setD]   = useState(null);
  const [res, setRes]  = useState(null);
  const [hist, setH]   = useState([]);
  const [auto, setAuto] = useState(false);
  const [toast, setTt] = useState(null);
  const [confetti, setConf] = useState(0);
  const autoRef = useRef(false);
  const wc = mode === 'under' ? tgt / 100 : (100 - tgt) / 100;
  const pay = parseFloat((0.97 / wc).toFixed(2));

  const go = useCallback(async () => {
    const a = parseFloat(bet); if (!a || a > bal) return;
    setR(true); setRes(null); setTt(null);
    // Rolling animation — flash random numbers
    let frames = 0;
    const ri = setInterval(() => {
      setD(Math.floor(Math.random() * 100));
      if (++frames >= 8) clearInterval(ri);
    }, 60);
    await new Promise(res => setTimeout(res, 520));
    const roll = Math.floor(Math.random() * 100);
    clearInterval(ri); setD(roll);
    const win = mode === 'under' ? roll < tgt : roll > tgt;
    const profit = win ? parseFloat((a * (pay - 1)).toFixed(4)) : -a;
    setRes({ r: roll, win }); setH(h => [{ r: roll, win }, ...h.slice(0, 13)]);
    setTt({ w: win, t: win ? `Rolled ${roll} · Win +${f4(profit)} ETH` : `Rolled ${roll} · -${f4(a)} ETH`, big: pay >= 10 && win });
    if (win) { onWin(profit); if (pay >= 5) setConf(c => c + 1); } else onLose(a);
    setR(false);
    if (autoRef.current) setTimeout(go, 700);
  }, [bet, bal, tgt, mode, pay, onWin, onLose]);

  useEffect(() => {
    autoRef.current = auto;
    if (auto) go();
    return () => { autoRef.current = false; };
  }, [auto]);

  const rc = res ? (res.win ? T.green : T.red) : T.muted;
  const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
  const faceIdx = disp != null ? Math.min(5, Math.floor(disp / 100 * 6)) : -1;

  return (
    <div>
      <GameStyles />
      <div style={{ ...PNL, marginBottom: 12, textAlign: 'center', padding: '28px 20px', background: `radial-gradient(ellipse at 50% 0%, ${T.bg3} 0%, ${T.bg} 80%)`, position: 'relative' }}>
        <Confetti trigger={confetti} big />
        {/* Big Die Display */}
        <div style={{
          fontSize: 88, lineHeight: 1, marginBottom: 8,
          animation: rolling ? 'diceRoll .4s ease-in-out infinite' : res ? 'diceLand .3s ease-out' : 'none',
          filter: rolling ? 'blur(1px)' : 'none',
          transition: 'filter .1s',
          textShadow: res ? `0 0 30px ${rc}` : 'none',
        }}>
          {faceIdx >= 0 ? faces[faceIdx] : '🎲'}
        </div>
        <div style={{ fontSize: 64, fontWeight: 900, color: rc, fontFamily: MONO, lineHeight: 1, textShadow: `0 0 ${rolling ? 0 : 30}px ${rc}`, transition: 'color .1s, text-shadow .2s', fontVariantNumeric: 'tabular-nums', filter: rolling ? 'blur(3px)' : 'none' }}>
          {disp ?? '—'}
        </div>
        {res && <div style={{ fontSize: 16, fontWeight: 700, color: rc, marginTop: 10, fontFamily: FONT, animation: 'bigWinEntry .3s ease-out' }}>{res.win ? `WIN ×${pay}` : 'LOSE'}</div>}
        {/* Probability bar */}
        <div style={{ margin: '20px auto 0', maxWidth: 380, height: 10, borderRadius: 50, background: T.bg3, overflow: 'hidden', position: 'relative', border: `1px solid ${T.bd}` }}>
          <div style={{ position: 'absolute', left: 0, height: '100%', width: `${mode === 'under' ? tgt : 100 - tgt}%`, background: `linear-gradient(90deg, ${T.green}, ${T.green}88)`, borderRadius: 50 }} />
          <div style={{ position: 'absolute', left: mode === 'under' ? `${tgt}%` : 0, height: '100%', width: `${mode === 'under' ? 100 - tgt : tgt}%`, background: `linear-gradient(90deg, ${T.red}88, ${T.red})`, borderRadius: 50 }} />
          {res && <div style={{ position: 'absolute', top: '50%', left: `${res.r}%`, transform: 'translate(-50%,-50%)', width: 16, height: 16, borderRadius: '50%', background: res.win ? T.green : T.red, border: '2px solid #fff', zIndex: 2, boxShadow: `0 0 12px ${res.win ? T.green : T.red}`, animation: 'diceLand .3s ease-out' }} />}
        </div>
        {hist.length > 0 && <div style={{ display: 'flex', gap: 4, marginTop: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          {hist.slice(0, 14).map((h, i) => <span key={i} style={{ fontSize: 11, color: h.win ? T.green : T.red, background: h.win ? T.green + '16' : T.red + '16', padding: '2px 8px', borderRadius: 5, fontFamily: MONO, fontWeight: 700, border: `1px solid ${h.win ? T.green + '33' : T.red + '33'}` }}>{h.r}</span>)}
        </div>}
      </div>
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={PNL}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <Btn label={`Under ${tgt}`} onClick={() => { setMode('under'); setAuto(false); }} col={mode === 'under' ? T.teal : undefined} outline={mode !== 'under'} sm />
          <Btn label={`Over ${tgt}`} onClick={() => { setMode('over'); setAuto(false); }} col={mode === 'over' ? T.teal : undefined} outline={mode !== 'over'} sm />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginBottom: 9, fontFamily: FONT, fontWeight: 600 }}>
            <span>Target: <b style={{ color: T.white }}>{tgt}</b></span>
            <span>Win Chance: <b style={{ color: T.teal }}>{(wc * 100).toFixed(0)}%</b></span>
            <span>Payout: <b style={{ color: T.green, fontSize: 13 }}>×{pay}</b></span>
          </div>
          <input type="range" min="5" max="95" value={tgt} onChange={e => { setTgt(+e.target.value); setAuto(false); }} style={{ width: '100%', accentColor: T.teal, cursor: 'pointer' }} />
        </div>
        <BetRow val={bet} set={v => { setBet(v); setAuto(false); }} disabled={auto} bal={bal} />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginTop: 14 }}>
          <Btn label={rolling ? '🎲 Rolling…' : '🎲 Roll'} onClick={go} disabled={rolling || auto || !parseFloat(bet) || parseFloat(bet) > bal} pulse={!rolling && !auto} />
          <Btn label={auto ? '⏹ Stop' : '⚡ Auto'} onClick={() => setAuto(v => !v)} col={auto ? T.red : T.purple} sm />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  BLACKJACK — card deal animation, better win banner
// ══════════════════════════════════════════════════════════════════════════════
export function Blackjack({ bal, onWin, onLose }) {
  const [phase, setP] = useState('bet');
  const [bet, setBet] = useState('0.05');
  const [pH, setPH]   = useState([]);
  const [dH, setDH]   = useState([]);
  const [dk, setDk]   = useState([]);
  const [res, setRes] = useState(null);
  const [toast, setTt]= useState(null);
  const [confetti, setConf] = useState(0);

  const reset = () => { setPH([]); setDH([]); setRes(null); setTt(null); setP('bet'); };
  const deal = () => {
    const a = parseFloat(bet); if (!a || a > bal) return;
    const d = mkDeck(), p = [d[0], d[2]], de = [d[1], d[3]], rest = d.slice(4);
    setDk(rest); setPH(p); setDH(de); setRes(null); setTt(null);
    if (handVal(p) === 21) fin(p, de, rest, true); else setP('play');
  };
  const fin = (p, de, dkk, bj = false) => {
    let d = [...de], rem = [...(dkk || dk)];
    while (handVal(d) < 17) d.push(rem.shift());
    setDH(d); setDk(rem);
    const ps = handVal(p), ds = handVal(d), a = parseFloat(bet);
    const r = ps > 21 ? 'bust' : bj && p.length === 2 ? 'bj' : ds > 21 || ps > ds ? 'win' : ps === ds ? 'push' : 'lose';
    const pf = { win: a, bj: a * 1.5, push: 0, lose: -a, bust: -a }[r];
    setRes(r); setP('done');
    if (pf > 0) { onWin(pf); if (r === 'bj') setConf(c => c + 1); } else if (pf < 0) onLose(Math.abs(pf));
    setTt({ w: pf >= 0, t: `${{ win: 'You Win', bj: 'Blackjack! 🎉', push: 'Push', lose: 'Dealer Wins', bust: 'Bust!' }[r]} · ${pf >= 0 ? '+' : ''}${f4(pf)} ETH`, big: r === 'bj' });
  };
  const hit   = () => { const np = [...pH, dk[0]], nd = dk.slice(1); setPH(np); setDk(nd); if (handVal(np) >= 21) fin(np, dH, nd); };
  const stand = () => fin(pH, dH);
  const dbl   = () => { if (pH.length !== 2 || parseFloat(bet) * 2 > bal) return; setBet(b => String(parseFloat((parseFloat(b) * 2).toFixed(4)))); const np = [...pH, dk[0]], nd = dk.slice(1); setPH(np); setDk(nd); fin(np, dH, nd); };

  const RC = { win: T.green, bj: T.gold, push: T.teal, lose: T.red, bust: T.red };
  const RL = { win: '🏆 YOU WIN', bj: '🃏 BLACKJACK!', push: '🤝 PUSH', lose: '❌ DEALER WINS', bust: '💥 BUST' };
  const pv = handVal(pH), dv = handVal(dH);

  return (
    <div>
      <GameStyles />
      <div style={{ ...PNL, marginBottom: 12, background: `linear-gradient(160deg, ${T.bg2} 0%, ${T.bg} 100%)`, position: 'relative' }}>
        <Confetti trigger={confetti} big />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: T.muted, fontFamily: FONT, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>🤖 Dealer</span>
          {phase === 'done' && <span style={{ fontSize: 12, fontWeight: 700, color: dv > 21 ? T.red : T.text, fontFamily: MONO }}>{dv} pts{dv > 21 ? ' · Bust!' : ''}</span>}
        </div>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', minHeight: 88 }}>
          {dH.map((c, i) => <div key={i} style={{ animation: `tileFlip .2s ease-out ${i * 0.08}s both` }}><PlayCard card={c} hidden={phase === 'play' && i === 1} /></div>)}
          {!dH.length && <div style={{ color: T.muted, fontSize: 13, fontFamily: FONT, alignSelf: 'center' }}>Waiting for bet…</div>}
        </div>
      </div>
      <div style={{ ...PNL, marginBottom: 12, background: `linear-gradient(160deg, ${T.bg} 0%, ${T.bg2} 100%)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: T.muted, fontFamily: FONT, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>👤 You</span>
          {phase !== 'bet' && <span style={{ fontSize: 12, fontWeight: 700, fontFamily: MONO, color: pv > 21 ? T.red : pv === 21 ? T.gold : T.text }}>{pv} pts{pv === 21 ? ' 🔥' : ''}{pv > 21 ? ' · Bust!' : ''}</span>}
        </div>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', minHeight: 88 }}>
          {pH.map((c, i) => <div key={i} style={{ animation: `tileFlip .2s ease-out ${i * 0.1}s both` }}><PlayCard card={c} /></div>)}
          {!pH.length && <div style={{ color: T.muted, fontSize: 13, fontFamily: FONT, alignSelf: 'center' }}>Place your bet</div>}
        </div>
      </div>
      {res && <div style={{ background: RC[res] + '1a', border: `1px solid ${RC[res]}44`, borderRadius: 12, padding: '16px', textAlign: 'center', marginBottom: 12, color: RC[res], fontSize: 26, fontWeight: 900, fontFamily: FONT, letterSpacing: 1, boxShadow: `0 0 32px ${RC[res]}33`, animation: 'bigWinEntry .4s cubic-bezier(.17,.67,.41,1.3)' }}>{RL[res]}</div>}
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={PNL}>
        {phase === 'bet' && <><BetRow val={bet} set={setBet} disabled={false} bal={bal} /><div style={{ marginTop: 14 }}><Btn label="🃏 Deal Cards" onClick={deal} disabled={!parseFloat(bet) || parseFloat(bet) > bal} pulse /></div></>}
        {phase === 'play' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          <Btn label="Hit" onClick={hit} col={T.teal} />
          <Btn label="Stand" onClick={stand} col={T.green} />
          <Btn label="Double" onClick={dbl} col={T.purple} disabled={pH.length !== 2 || parseFloat(bet) * 2 > bal} />
        </div>}
        {phase === 'done' && <Btn label="New Hand" onClick={reset} />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  ROULETTE — glowing wheel, animated result reveal
// ══════════════════════════════════════════════════════════════════════════════
export function Roulette({ bal, onWin, onLose }) {
  const [bet, setBet]   = useState('0.05');
  const [bt, setBt]     = useState('red');
  const [np, setNp]     = useState('');
  const [sp, setSp]     = useState(false);
  const [res, setRes]   = useState(null);
  const [hist, setHist] = useState([]);
  const [deg, setDeg]   = useState(0);
  const [toast, setTt]  = useState(null);
  const [confetti, setConf] = useState(0);
  const BTS = [{ k: 'red', l: 'Red', c: '#e53935', o: '2×' }, { k: 'black', l: 'Black', c: '#546e7a', o: '2×' }, { k: 'green', l: 'Zero', c: T.green, o: '14×' }, { k: 'odd', l: 'Odd', c: T.teal, o: '2×' }, { k: 'even', l: 'Even', c: T.teal, o: '2×' }, { k: '1-18', l: '1–18', c: '#2979ff', o: '2×' }, { k: '19-36', l: '19–36', c: '#2979ff', o: '2×' }, { k: 'number', l: 'Exact #', c: T.purple, o: '36×' }];

  const go = () => {
    const a = parseFloat(bet); if (!a || a > bal || sp) return;
    setSp(true); setRes(null); setTt(null);
    setDeg(d => d + 360 * 10 + rng(0, 359));
    setTimeout(() => {
      const n = rng(0, 36), isR = RNUMS.has(n), isG = n === 0, isB = !isR && !isG, isO = n % 2 !== 0 && n !== 0, isE = n % 2 === 0 && n !== 0;
      const pm = { red: isR ? 2 : 0, black: isB ? 2 : 0, green: isG ? 14 : 0, odd: isO ? 2 : 0, even: isE ? 2 : 0, '1-18': (n >= 1 && n <= 18) ? 2 : 0, '19-36': (n >= 19 && n <= 36) ? 2 : 0, number: String(n) === np ? 36 : 0 };
      const m = pm[bt] || 0, win = m > 0, profit = win ? a * (m - 1) : -a;
      setRes({ n, isR, isG }); setHist(h => [{ n, isR, isG }, ...h.slice(0, 11)]);
      setTt({ w: win, t: win ? `Win ×${m} · +${f4(profit)} ETH` : `No win — ${n}`, big: m >= 14 });
      if (win) { onWin(a * (m - 1)); if (m >= 5) setConf(c => c + 1); } else onLose(a);
      setSp(false);
    }, 4000);
  };

  const nc = n => n === 0 ? T.green : RNUMS.has(n) ? '#e53935' : '#e0e0e0';
  return (
    <div>
      <GameStyles />
      <div style={{ ...PNL, marginBottom: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px', position: 'relative', background: `radial-gradient(circle at 50% 30%, ${T.bg3} 0%, ${T.bg} 70%)` }}>
        <Confetti trigger={confetti} big />
        <div style={{ position: 'relative', width: 200, height: 200, marginBottom: 16 }}>
          {/* Outer glow ring */}
          <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', background: sp ? `conic-gradient(${T.gold}44, transparent, ${T.gold}44)` : 'transparent', animation: sp ? 'wheelGlow 1s ease-in-out infinite' : 'none', transition: 'all .5s' }} />
          {/* Wheel */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: `4px solid ${T.bd}`,
            background: 'conic-gradient(#e53935 0 10deg,#1c2d4f 10deg 20deg,#e53935 20deg 30deg,#1c2d4f 30deg 40deg,#e53935 40deg 50deg,#1c2d4f 50deg 60deg,#e53935 60deg 70deg,#1c2d4f 70deg 80deg,#e53935 80deg 90deg,#1c2d4f 90deg 100deg,#e53935 100deg 110deg,#1c2d4f 110deg 120deg,#e53935 120deg 130deg,#1c2d4f 130deg 140deg,#e53935 140deg 150deg,#1c2d4f 150deg 160deg,#e53935 160deg 170deg,#1c2d4f 170deg 175deg,#00e87a 175deg 185deg,#1c2d4f 185deg 360deg)',
            transform: `rotate(${deg}deg)`,
            transition: sp ? 'transform 4s cubic-bezier(0.08,0.6,0.06,1)' : 'none',
            boxShadow: sp ? `0 0 40px ${T.gold}55, 0 0 80px rgba(0,0,0,.7)` : '0 0 60px rgba(0,0,0,.7)',
          }} />
          {/* Center hub */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 88, height: 88, borderRadius: '50%', background: `radial-gradient(circle at 40% 35%, ${T.bg3}, ${T.bg})`, border: `3px solid ${T.bdHi}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, boxShadow: 'inset 0 2px 16px rgba(0,0,0,.6)' }}>
            <span style={{ fontSize: 32, fontWeight: 900, fontFamily: MONO, color: res ? nc(res.n) : T.muted, transition: 'color .4s', animation: res && !sp ? 'roulettePop .4s cubic-bezier(.17,.67,.41,1.3)' : 'none', textShadow: res ? `0 0 20px ${nc(res?.n)}` : 'none' }}>{res ? res.n : '?'}</span>
          </div>
          {/* Pointer */}
          <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 26, zIndex: 3, color: T.gold, filter: `drop-shadow(0 0 12px ${T.gold})` }}>▼</div>
        </div>
        {hist.length > 0 && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
          {hist.map((h, i) => <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: h.isG ? T.green + '22' : h.isR ? '#e5393522' : '#546e7a22', color: h.isG ? T.green : h.isR ? '#e53935' : '#90a4ae', border: `1px solid ${h.isG ? T.green + '55' : h.isR ? '#e5393555' : '#546e7a55'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, fontFamily: MONO, boxShadow: i === 0 ? `0 0 8px ${h.isG ? T.green : h.isR ? '#e53935' : '#546e7a'}` : 'none' }}>{h.n}</div>)}
        </div>}
      </div>
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={PNL}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 14 }}>
          {BTS.map(({ k, l, c, o }) => <button key={k} onClick={() => setBt(k)} style={{ background: bt === k ? c + '22' : T.bg3, border: `1px solid ${bt === k ? c : T.bd}`, color: bt === k ? c : T.muted, borderRadius: 8, padding: '9px 4px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, transition: 'all .15s', boxShadow: bt === k ? `0 0 12px ${c}44` : 'none' }}><div>{l}</div><div style={{ fontSize: 9, opacity: .7, marginTop: 2 }}>{o}</div></button>)}
        </div>
        {bt === 'number' && <div style={{ marginBottom: 14 }}><input type="number" min="0" max="36" placeholder="Pick 0–36" value={np} onChange={e => setNp(e.target.value)} style={{ ...INP, padding: '11px 14px' }} /></div>}
        <BetRow val={bet} set={setBet} disabled={sp} bal={bal} />
        <div style={{ marginTop: 14 }}><Btn label={sp ? '🎡 Spinning…' : '🎡 Spin'} onClick={go} disabled={sp || !parseFloat(bet) || parseFloat(bet) > bal} pulse={!sp} /></div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  SLOTS — animated reels with glow win effect
// ══════════════════════════════════════════════════════════════════════════════
const SYM = ['7️⃣', '💎', '👑', '⭐', '🔔', '🍒', '🍋', '🍊'];
const SPAY = { '7️⃣': 100, '💎': 50, '👑': 25, '⭐': 15, '🔔': 8, '🍒': 4, '🍋': 3, '🍊': 2 };

export function Slots({ bal, onWin, onLose }) {
  const [bet, setBet]     = useState('0.05');
  const [spin, setSpin]   = useState(false);
  const [cols, setCols]   = useState([[0,1,2],[3,4,5],[6,7,0]]);
  const [spin2, setSpin2] = useState([false,false,false]);
  const [res, setRes]     = useState(null);
  const [toast, setTt]    = useState(null);
  const [confetti, setConf] = useState(0);

  const go = useCallback(async () => {
    const a = parseFloat(bet); if (!a || a > bal || spin) return;
    setSpin(true); setRes(null); setTt(null);
    const finals = [rng(0,7), rng(0,7), rng(0,7)];
    for (let r = 0; r < 3; r++) {
      setSpin2(p => { const n = [...p]; n[r] = true; return n; });
      await new Promise(resolve => setTimeout(resolve, 600 + r * 300));
      setCols(prev => { const n = prev.map(c=>[...c]); n[r] = [(finals[r]+7)%8, finals[r], (finals[r]+1)%8]; return n; });
      setSpin2(p => { const n = [...p]; n[r] = false; return n; });
      await new Promise(resolve => setTimeout(resolve, 160));
    }
    const s0 = SYM[finals[0]], s1 = SYM[finals[1]], s2 = SYM[finals[2]];
    let mult = 0, label = '';
    if (s0 === s1 && s1 === s2) { mult = SPAY[s0] || 2; label = `3× ${s0} JACKPOT!`; }
    else if (s0 === s1) { mult = parseFloat(((SPAY[s0]||2)*0.18).toFixed(2)); label = `Pair ${s0}`; }
    else if (s1 === s2) { mult = parseFloat(((SPAY[s1]||2)*0.18).toFixed(2)); label = `Pair ${s1}`; }
    const win = mult > 0, profit = win ? parseFloat((a*mult).toFixed(4)) : -a;
    setRes({ win, mult, label, triple: s0===s1&&s1===s2 });
    setTt({ w: win, t: win ? `${label} · +${f4(profit)} ETH` : `No match · -${f4(a)} ETH`, big: mult >= 10 });
    if (win) { onWin(profit); if (mult >= 5) setConf(c => c + 1); } else onLose(a);
    setSpin(false);
  }, [bet, bal, spin, onWin, onLose]);

  const REEL_SYMS = ['7️⃣','💎','👑','⭐','🔔','🍒','🍋','🍊','7️⃣','💎','👑','⭐'];

  return (
    <div>
      <GameStyles />
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={{ ...PNL, marginBottom: 12, padding: '24px 16px', background: `linear-gradient(180deg, ${T.bg3} 0%, ${T.bg} 60%)`, position: 'relative', border: res?.triple ? `1px solid ${T.gold}` : `1px solid ${T.bd}`, boxShadow: res?.triple ? `0 0 40px ${T.gold}44` : 'none', transition: 'all .3s' }}>
        <Confetti trigger={confetti} big />
        {/* Slot machine header */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: T.gold, fontFamily: FONT, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', textShadow: `0 0 12px ${T.gold}` }}>🎰 RIZK SLOTS</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          {cols.map((col, ri) => (
            <div key={ri} style={{ position: 'relative', width: 88, height: 192, background: T.bg, borderRadius: 14, border: `2px solid ${res?.win && !spin ? T.gold : T.bd}`, overflow: 'hidden', boxShadow: res?.win && !spin ? `0 0 30px ${T.gold}66, inset 0 0 20px rgba(0,0,0,.5)` : 'inset 0 0 20px rgba(0,0,0,.5)', transition: 'border-color .3s, box-shadow .4s' }}>
              {/* Spin content */}
              <div style={{ animation: spin2[ri] ? 'slotSpin .08s steps(1) infinite' : 'none', willChange: 'transform' }}>
                {spin2[ri]
                  ? REEL_SYMS.map((s, j) => <div key={j} style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{s}</div>)
                  : col.map((si, row) => <div key={row} style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, background: row === 1 && res && !spin ? res.win ? T.gold + '22' : 'transparent' : 'transparent', transition: 'background .3s' }}>{SYM[si]}</div>)
                }
              </div>
              {/* Win line */}
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 3, background: res?.win && !spin ? T.gold : 'rgba(255,255,255,.05)', transform: 'translateY(-50%)', transition: 'background .3s', boxShadow: res?.win && !spin ? `0 0 12px ${T.gold}` : 'none' }} />
              {/* Reel stop flash */}
              {!spin2[ri] && !spin && res?.win && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 30%, ${T.gold}11 50%, transparent 70%)`, pointerEvents: 'none' }} />}
            </div>
          ))}
        </div>
        {/* Result label */}
        {res && !spin && <div style={{ textAlign: 'center', fontSize: res.triple ? 20 : 14, fontWeight: 800, color: res.win ? T.gold : T.muted, fontFamily: FONT, animation: res.win ? 'bigWinEntry .4s cubic-bezier(.17,.67,.41,1.3)' : 'none', textShadow: res.win ? `0 0 20px ${T.gold}` : 'none' }}>{res.label || 'No match'}</div>}
        {/* Paytable */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
          {Object.entries(SPAY).slice(0, 6).map(([s, m]) => (
            <div key={s} style={{ fontSize: 10, color: T.muted, fontFamily: FONT, background: T.bg3, padding: '3px 8px', borderRadius: 5, border: `1px solid ${T.bd}` }}>
              {s}{s}{s} <span style={{ color: T.gold, fontWeight: 700 }}>×{m}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={PNL}>
        <BetRow val={bet} set={setBet} disabled={spin} bal={bal} />
        <div style={{ marginTop: 14 }}><Btn label={spin ? '🎰 Spinning…' : '🎰 Spin'} onClick={go} disabled={spin || !parseFloat(bet) || parseFloat(bet) > bal} pulse={!spin} /></div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  HI-LO — animated card flip
// ══════════════════════════════════════════════════════════════════════════════
export function HiLo({ bal, onWin, onLose }) {
  const [bet, setBet]     = useState('0.05');
  const [phase, setPhase] = useState('bet');
  const [dk, setDk]       = useState([]);
  const [card, setCard]   = useState(null);
  const [nxt, setNxt]     = useState(null);
  const [steps, setSteps] = useState(0);
  const [mult, setMult]   = useState(1);
  const [toast, setTt]    = useState(null);
  const [confetti, setConf] = useState(0);
  const [flipping, setFlipping] = useState(false);

  const start = () => {
    const a = parseFloat(bet); if (!a || a > bal) return;
    const d = mkDeck(); setDk(d.slice(1)); setCard(d[0]); setNxt(null); setSteps(0); setMult(1); setTt(null); setPhase('play');
  };

  const guess = useCallback((g) => {
    if (phase !== 'play' || !dk.length) return;
    setFlipping(true);
    setTimeout(() => {
      const next = dk[0], rest = dk.slice(1);
      setNxt(next); setDk(rest); setFlipping(false);
      const r = card.ri, nr = next.ri;
      const ok = g === 'hi' ? nr > r : g === 'lo' ? nr < r : nr === r;
      if (ok) {
        const ns = steps + 1;
        const m = parseFloat((mult * (g === 'same' ? 8 : 1.4)).toFixed(2));
        setMult(m); setSteps(ns); setCard(next); setNxt(null);
        setTt({ w: true, t: `Correct! ×${m.toFixed(2)} so far`, big: false });
        if (m >= 5) setConf(c => c + 1);
      } else {
        const loss = parseFloat(bet);
        onLose(loss);
        setTt({ w: false, t: `Wrong! Lost ${f4(loss)} ETH` });
        setPhase('done');
      }
    }, 220);
  }, [phase, dk, card, steps, mult, bet, onLose]);

  const cashout = () => {
    if (steps === 0) return;
    const profit = parseFloat((parseFloat(bet) * mult - parseFloat(bet)).toFixed(4));
    onWin(profit);
    setTt({ w: true, t: `Cashed ×${mult.toFixed(2)} · +${f4(profit)} ETH`, big: mult >= 5 });
    setPhase('done');
  };
  const reset = () => { setPhase('bet'); setCard(null); setNxt(null); setSteps(0); setMult(1); setTt(null); };

  return (
    <div>
      <GameStyles />
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={{ ...PNL, marginBottom: 12, textAlign: 'center', padding: '24px 16px', background: `radial-gradient(ellipse at 50% 0%, ${T.bg3} 0%, ${T.bg} 80%)`, position: 'relative' }}>
        <Confetti trigger={confetti} big />
        {phase !== 'bet' && <>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, marginBottom: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: T.muted, marginBottom: 6, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: .5 }}>Current</div>
              <div style={{ animation: flipping ? 'hilo-flip .22s ease-in-out' : 'none' }}>
                {card && <PlayCard card={card} />}
              </div>
            </div>
            <div style={{ textAlign: 'center', minWidth: 70 }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: T.gold, fontFamily: MONO, textShadow: `0 0 20px ${T.gold}` }}>×{mult.toFixed(2)}</div>
              <div style={{ fontSize: 11, color: T.muted, fontFamily: FONT }}>step {steps}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: T.muted, marginBottom: 6, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: .5 }}>Next</div>
              {nxt ? <div style={{ animation: 'tileFlip .2s ease-out' }}><PlayCard card={nxt} /></div> : <div style={{ width: 58, height: 84, borderRadius: 9, background: T.bg3, border: `2px dashed ${T.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: T.muted, fontFamily: FONT }}>?</div>}
            </div>
          </div>
          <div style={{ fontSize: 12, color: T.muted, fontFamily: FONT }}>
            <b style={{ color: T.white }}>×1.4</b> for Hi/Lo · <b style={{ color: T.gold }}>×8</b> for Same value
          </div>
        </>}
        {phase === 'bet' && <div style={{ padding: '20px 0', color: T.muted, fontSize: 14, fontFamily: FONT }}>🃏 Guess if the next card is Higher, Lower, or Same!</div>}
      </div>
      <div style={PNL}>
        {phase === 'bet' && <><BetRow val={bet} set={setBet} bal={bal} /><div style={{ marginTop: 14 }}><Btn label="Start Game" onClick={start} disabled={!parseFloat(bet) || parseFloat(bet) > bal} pulse /></div></>}
        {phase === 'play' && <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 8 }}>
            <Btn label="⬆ Higher" onClick={() => guess('hi')} col={T.green} />
            <Btn label="= Same" onClick={() => guess('same')} col={T.gold} />
            <Btn label="⬇ Lower" onClick={() => guess('lo')} col={T.red} />
          </div>
          <Btn label={`💰 Cash Out ×${mult.toFixed(2)}`} onClick={cashout} disabled={steps === 0} col={T.teal} outline sm />
        </>}
        {phase === 'done' && <Btn label="Play Again" onClick={reset} />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  WHEEL — colorful animated spin with bigger prizes
// ══════════════════════════════════════════════════════════════════════════════
const WSECS = [
  { m: 1.5, c: T.teal, l: '×1.5' }, { m: 0, c: T.red, l: '×0' },
  { m: 2, c: T.green, l: '×2' }, { m: 0, c: T.red, l: '×0' },
  { m: 3, c: T.purple, l: '×3' }, { m: 0, c: T.red, l: '×0' },
  { m: 5, c: T.gold, l: '×5' }, { m: 0, c: T.red, l: '×0' },
  { m: 1.2, c: T.teal, l: '×1.2' }, { m: 0, c: T.red, l: '×0' },
  { m: 10, c: T.orange, l: '×10' }, { m: 0, c: T.red, l: '×0' },
];
export function Wheel({ bal, onWin, onLose }) {
  const [bet, setBet]   = useState('0.05');
  const [sp, setSp]     = useState(false);
  const [deg, setDeg]   = useState(0);
  const [result, setResult] = useState(null);
  const [toast, setTt]  = useState(null);
  const [confetti, setConf] = useState(0);
  const n = WSECS.length, slice = 360 / n;

  const go = () => {
    const a = parseFloat(bet); if (!a || a > bal || sp) return;
    setSp(true); setResult(null); setTt(null);
    const winIdx = Math.floor(Math.random() * n);
    const targetDeg = 360 * 8 + (360 - winIdx * slice - slice / 2);
    setDeg(d => d + targetDeg + (Math.random() * slice * 0.4));
    setTimeout(() => {
      const sec = WSECS[winIdx], win = sec.m > 0, profit = win ? parseFloat((a * sec.m - a).toFixed(4)) : -a;
      setResult({ sec, idx: winIdx });
      setTt({ w: win, t: win ? `×${sec.m} Win! +${f4(profit)} ETH` : `No win · -${f4(a)} ETH`, big: sec.m >= 5 });
      if (win) { onWin(profit); if (sec.m >= 3) setConf(c => c + 1); } else onLose(a);
      setSp(false);
    }, 5000);
  };

  return (
    <div>
      <GameStyles />
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={{ ...PNL, marginBottom: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', position: 'relative', background: `radial-gradient(circle at 50% 40%, ${T.bg3} 0%, ${T.bg} 70%)` }}>
        <Confetti trigger={confetti} big />
        <div style={{ position: 'relative', width: 220, height: 220, marginBottom: 12 }}>
          <svg width={220} height={220} style={{ transform: `rotate(${deg}deg)`, transition: sp ? 'transform 5s cubic-bezier(0.08,0.6,0.06,1)' : 'none', filter: sp ? `drop-shadow(0 0 20px ${T.gold}66)` : 'none' }}>
            {WSECS.map((sec, i) => {
              const startA = (i * slice - 90) * Math.PI / 180;
              const endA = ((i + 1) * slice - 90) * Math.PI / 180;
              const r = 105, cx = 110, cy = 110;
              const x1 = cx + r * Math.cos(startA), y1 = cy + r * Math.sin(startA);
              const x2 = cx + r * Math.cos(endA), y2 = cy + r * Math.sin(endA);
              const mx = cx + (r * 0.65) * Math.cos((startA + endA) / 2);
              const my = cy + (r * 0.65) * Math.sin((startA + endA) / 2);
              return (
                <g key={i}>
                  <path d={`M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 0,1 ${x2},${y2} Z`} fill={sec.c} stroke={T.bg} strokeWidth={2} opacity={0.9} />
                  <text x={mx} y={my} textAnchor="middle" dominantBaseline="middle" fill={sec.m >= 5 ? T.bg : '#fff'} fontSize={sec.m >= 5 ? 13 : 11} fontWeight="800" fontFamily={MONO} style={{ pointerEvents: 'none' }}>{sec.l}</text>
                </g>
              );
            })}
            <circle cx={110} cy={110} r={18} fill={T.bg} stroke={T.bdHi} strokeWidth={3} />
            <circle cx={110} cy={110} r={8} fill={T.gold} />
          </svg>
          <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', fontSize: 28, zIndex: 10, color: T.gold, filter: `drop-shadow(0 0 12px ${T.gold})` }}>▼</div>
          {result && !sp && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: result.sec.c + 'dd', borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: MONO, animation: 'roulettePop .4s cubic-bezier(.17,.67,.41,1.3)', zIndex: 20, boxShadow: `0 0 30px ${result.sec.c}` }}>
              {result.sec.l}
            </div>
          )}
        </div>
      </div>
      <div style={PNL}>
        <BetRow val={bet} set={setBet} disabled={sp} bal={bal} />
        <div style={{ marginTop: 14 }}><Btn label={sp ? '🎡 Spinning…' : '🎡 Spin the Wheel'} onClick={go} disabled={sp || !parseFloat(bet) || parseFloat(bet) > bal} pulse={!sp} /></div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  KENO — animated ball draw
// ══════════════════════════════════════════════════════════════════════════════
const KPAY = [0, 0, 0.5, 1.5, 4, 10, 30, 80, 200, 500, 1000];
export function Keno({ bal, onWin, onLose }) {
  const [bet, setBet]   = useState('0.05');
  const [picks, setPicks] = useState(new Set());
  const [drawn, setDrawn] = useState([]);
  const [phase, setPhase] = useState('pick');
  const [hits, setHits]  = useState(0);
  const [toast, setTt]   = useState(null);
  const [confetti, setConf] = useState(0);
  const [drawing, setDrawing] = useState(false);

  const toggle = (n) => {
    if (phase !== 'pick') return;
    setPicks(p => { const s = new Set(p); s.has(n) ? s.delete(n) : (s.size < 10 && s.add(n)); return s; });
  };

  const play = async () => {
    const a = parseFloat(bet); if (!a || a > bal || picks.size < 1) return;
    setPhase('draw'); setDrawing(true); setDrawn([]); setTt(null);
    const nums = Array.from({ length: 80 }, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, 20);
    for (let i = 0; i < nums.length; i++) {
      await new Promise(r => setTimeout(r, 110));
      setDrawn(d => [...d, nums[i]]);
    }
    setDrawing(false);
    const h = nums.filter(n => picks.has(n)).length;
    const m = KPAY[Math.min(h, picks.size, KPAY.length - 1)] || 0;
    const win = m > 0, profit = win ? parseFloat((a * m - a).toFixed(4)) : -a;
    setHits(h); setPhase('done');
    setTt({ w: win, t: win ? `${h} hits! ×${m} · +${f4(profit)} ETH` : `${h} hits · -${f4(a)} ETH`, big: m >= 10 });
    if (win) { onWin(profit); if (m >= 5) setConf(c => c + 1); } else onLose(a);
  };

  const reset = () => { setPhase('pick'); setPicks(new Set()); setDrawn([]); setHits(0); setTt(null); };

  return (
    <div>
      <GameStyles />
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={{ ...PNL, marginBottom: 12, position: 'relative' }}>
        <Confetti trigger={confetti} big />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: T.muted, fontFamily: FONT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5 }}>Pick up to 10 numbers</span>
          <span style={{ fontSize: 12, color: T.teal, fontFamily: MONO, fontWeight: 700 }}>{picks.size}/10 picked</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10,1fr)', gap: 4 }}>
          {Array.from({ length: 80 }, (_, i) => {
            const n = i + 1, isPicked = picks.has(n), isDrawn = drawn.includes(n);
            const isHit = isPicked && isDrawn;
            const isMiss = isDrawn && !isPicked;
            return (
              <button key={n} onClick={() => toggle(n)} style={{
                aspectRatio: '1', borderRadius: 6, fontSize: 9, fontWeight: 700, fontFamily: MONO,
                background: isHit ? T.green : isMiss ? T.bg4 : isPicked ? T.teal + '33' : T.bg3,
                border: `1px solid ${isHit ? T.green : isMiss ? T.muted : isPicked ? T.teal : T.bd}`,
                color: isHit ? '#fff' : isMiss ? T.muted : isPicked ? T.teal : T.text,
                cursor: phase === 'pick' ? 'pointer' : 'default',
                boxShadow: isHit ? `0 0 10px ${T.green}66` : isMiss ? 'none' : isPicked ? `0 0 8px ${T.teal}44` : 'none',
                transition: 'all .1s',
                animation: isHit && drawing ? 'gemPop .3s ease-out' : 'none',
              }}>{n}</button>
            );
          })}
        </div>
        {phase !== 'pick' && <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, fontFamily: FONT }}>
          <span>Drawn: {drawn.length}/20</span>
          {phase === 'done' && <span style={{ color: hits > 0 ? T.green : T.muted }}>Hits: <b>{hits}</b></span>}
        </div>}
      </div>
      <div style={PNL}>
        {phase === 'pick' && <>
          <BetRow val={bet} set={setBet} bal={bal} />
          <div style={{ marginTop: 14 }}><Btn label={`Play Keno (${picks.size} picks)`} onClick={play} disabled={picks.size < 1 || !parseFloat(bet) || parseFloat(bet) > bal} pulse={picks.size > 0} /></div>
        </>}
        {phase === 'draw' && <div style={{ textAlign: 'center', color: T.teal, fontFamily: FONT, fontWeight: 700, padding: '12px 0', animation: 'numFlash 0.8s ease-in-out infinite' }}>Drawing numbers… {drawn.length}/20</div>}
        {phase === 'done' && <Btn label="Play Again" onClick={reset} />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  TOWERS — climbing tower with visual levels
// ══════════════════════════════════════════════════════════════════════════════
export function Towers({ bal, onWin, onLose }) {
  const [bet, setBet]   = useState('0.05');
  const [diff, setDiff] = useState('medium');
  const [phase, setPhase] = useState('bet');
  const [level, setLvl] = useState(0);
  const [tiles, setT]   = useState([]);
  const [safe, setSafe] = useState([]);
  const [toast, setTt]  = useState(null);
  const [confetti, setConf] = useState(0);
  const ROWS = 8;
  const COLS = { easy: 4, medium: 3, hard: 2 }[diff];
  const MULT = { easy: 1.2, medium: 1.5, hard: 2.5 }[diff];

  const start = () => {
    const a = parseFloat(bet); if (!a || a > bal) return;
    onLose(a);
    const sg = Array.from({ length: ROWS }, () => rng(0, COLS - 1));
    setSafe(sg); setT(Array(ROWS).fill(null)); setLvl(0); setPhase('play'); setTt(null);
  };

  const pick = (col) => {
    if (phase !== 'play') return;
    const isSafe = col === safe[level];
    setT(prev => { const n = [...prev]; n[level] = col; return n; });
    if (isSafe) {
      const nl = level + 1;
      const m = parseFloat((Math.pow(MULT, nl)).toFixed(2));
      if (nl >= ROWS) {
        const profit = parseFloat((parseFloat(bet) * m - parseFloat(bet)).toFixed(4));
        onWin(profit); setTt({ w: true, t: `Tower complete! ×${m} · +${f4(profit)} ETH`, big: true });
        setConf(c => c + 1); setPhase('done'); setLvl(nl);
      } else { setLvl(nl); }
    } else {
      setPhase('done'); setTt({ w: false, t: `Wrong tile! Lost ${f4(parseFloat(bet))} ETH` });
    }
  };

  const curMult = parseFloat((Math.pow(MULT, Math.max(1, level))).toFixed(2));

  const cashout = () => {
    if (level === 0 || phase !== 'play') return;
    const profit = parseFloat((parseFloat(bet) * curMult - parseFloat(bet)).toFixed(4));
    onWin(profit); setTt({ w: true, t: `Cashed ×${curMult} · +${f4(profit)} ETH`, big: curMult >= 5 });
    if (curMult >= 3) setConf(c => c + 1); setPhase('done');
  };

  const reset = () => { setPhase('bet'); setT([]); setSafe([]); setLvl(0); setTt(null); };

  return (
    <div>
      <GameStyles />
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={{ ...PNL, marginBottom: 12, position: 'relative' }}>
        <Confetti trigger={confetti} big />
        {phase === 'bet' ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: T.muted, fontSize: 14, fontFamily: FONT }}>🏰 Climb the tower — pick safe tiles to multiply your bet!</div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: T.muted, fontFamily: FONT }}>Level: <b style={{ color: T.white }}>{level}/{ROWS}</b></span>
              <span style={{ fontSize: 20, fontWeight: 900, color: T.green, fontFamily: MONO, textShadow: `0 0 16px ${T.green}` }}>×{curMult}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {Array.from({ length: ROWS }, (_, ri) => {
                const row = ROWS - 1 - ri;
                const isActive = phase === 'play' && row === level;
                const isDone = row < level;
                const isFuture = row > level;
                const chosen = tiles[row];
                const isSafeRow = row < level || phase === 'done';
                return (
                  <div key={row} style={{ display: 'flex', gap: 6, padding: '3px 0' }}>
                    <div style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: T.muted, fontFamily: MONO, fontWeight: 700 }}>
                      {isActive ? '▶' : isDone ? `×${parseFloat((Math.pow(MULT, row + 1)).toFixed(1))}` : ''}
                    </div>
                    {Array.from({ length: COLS }, (_, ci) => {
                      const isChosen = chosen === ci;
                      const isSafe_ = safe[row] === ci;
                      const showSafe = isSafeRow && isChosen;
                      const showBomb = isSafeRow && isChosen && !isSafe_;
                      const bc = showBomb ? T.red : showSafe && isSafe_ ? T.green : isActive ? T.teal : T.bd;
                      return (
                        <button key={ci} onClick={() => isActive && pick(ci)} style={{
                          flex: 1, padding: '14px 0', borderRadius: 9, fontSize: 20,
                          background: showBomb ? T.red + '22' : showSafe && isSafe_ ? T.green + '22' : isActive ? T.bg4 : T.bg3,
                          border: `1px solid ${bc}`,
                          color: isActive ? T.white : T.muted,
                          cursor: isActive ? 'pointer' : 'default',
                          boxShadow: isActive ? `inset 0 0 0 1px ${T.teal}44, 0 0 12px ${T.teal}22` : showBomb ? `0 0 20px ${T.red}66` : showSafe && isSafe_ ? `0 0 16px ${T.green}55` : 'none',
                          transition: 'all .15s',
                          animation: showSafe && isSafe_ ? 'gemPop .3s ease-out' : showBomb ? 'bombPop .3s ease-out' : 'none',
                        }}>
                          {showBomb ? '💥' : showSafe && isSafe_ ? '💎' : isFuture ? '' : isActive ? '?' : ''}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div style={PNL}>
        {phase === 'bet' && <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {['easy','medium','hard'].map(d => {
              const dc = d === 'easy' ? T.green : d === 'medium' ? T.gold : T.red;
              return <button key={d} onClick={() => setDiff(d)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${diff === d ? dc : T.bd}`, background: diff === d ? dc + '1a' : T.bg3, color: diff === d ? dc : T.muted, fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: 'pointer', transition: 'all .15s', boxShadow: diff === d ? `0 0 12px ${dc}33` : 'none', textTransform: 'capitalize' }}>{d}</button>;
            })}
          </div>
          <BetRow val={bet} set={setBet} bal={bal} />
          <div style={{ marginTop: 14 }}><Btn label="Start Climb 🏰" onClick={start} disabled={!parseFloat(bet) || parseFloat(bet) > bal} pulse /></div>
        </>}
        {phase === 'play' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Btn label={level > 0 ? `Cash Out ×${curMult}` : 'Pick a tile first'} onClick={cashout} disabled={level === 0} col={T.green} pulse={level > 0} />
          <Btn label="Give Up" onClick={reset} col={T.red} outline sm />
        </div>}
        {phase === 'done' && <Btn label="Play Again" onClick={reset} />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  LIMBO — clean animated display
// ══════════════════════════════════════════════════════════════════════════════
export function Limbo({ bal, onWin, onLose }) {
  const [bet, setBet]   = useState('0.05');
  const [target, setTgt] = useState('2.00');
  const [rolling, setR] = useState(false);
  const [result, setRes] = useState(null);
  const [hist, setH]    = useState([]);
  const [toast, setTt]  = useState(null);
  const [confetti, setConf] = useState(0);
  const [displayNum, setDN] = useState(null);

  const go = useCallback(async () => {
    const a = parseFloat(bet), t = parseFloat(target);
    if (!a || a > bal || !t || t < 1.01) return;
    setR(true); setRes(null); setTt(null); setDN(null);
    // Animate number counting up
    let frame = 0;
    const ri = setInterval(() => {
      setDN(parseFloat((1 + Math.random() * 8).toFixed(2)));
      if (++frame >= 12) clearInterval(ri);
    }, 55);
    await new Promise(r => setTimeout(r, 700));
    clearInterval(ri);
    const crash = genCrash();
    const win = crash >= t;
    setDN(crash); setRes({ crash, win });
    setH(h => [{ crash, win }, ...h.slice(0, 14)]);
    const mult = t;
    const profit = win ? parseFloat((a * (mult - 1)).toFixed(4)) : -a;
    setTt({ w: win, t: win ? `${crash.toFixed(2)}× — Win! +${f4(profit)} ETH` : `${crash.toFixed(2)}× — Loss`, big: win && mult >= 5 });
    if (win) { onWin(profit); if (mult >= 5) setConf(c => c + 1); } else onLose(a);
    setR(false);
  }, [bet, bal, target, onWin, onLose]);

  const rc = result ? (result.win ? T.green : T.red) : T.muted;

  return (
    <div>
      <GameStyles />
      <div style={{ ...PNL, marginBottom: 12, textAlign: 'center', padding: '32px 20px', position: 'relative', background: `radial-gradient(ellipse at 50% 0%, ${T.bg3} 0%, ${T.bg} 80%)` }}>
        <Confetti trigger={confetti} big />
        <div style={{ fontSize: 11, color: T.muted, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Result</div>
        <div style={{ fontSize: 80, fontWeight: 900, fontFamily: MONO, lineHeight: 1, color: rc, textShadow: `0 0 ${rolling ? 0 : 50}px ${rc}`, transition: 'color .2s, text-shadow .3s', filter: rolling ? 'blur(2px)' : 'none', animation: result && !rolling ? 'diceLand .3s ease-out' : rolling ? 'numFlash .4s ease-in-out infinite' : 'none', fontVariantNumeric: 'tabular-nums' }}>
          {displayNum != null ? displayNum.toFixed(2) : '—'}×
        </div>
        {result && <div style={{ fontSize: 18, fontWeight: 700, color: rc, marginTop: 10, fontFamily: FONT, animation: 'bigWinEntry .3s ease-out' }}>{result.win ? '🏆 WIN' : '💀 BUST'}</div>}
        {hist.length > 0 && <div style={{ display: 'flex', gap: 4, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {hist.map((h, i) => <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, fontFamily: MONO, fontWeight: 700, background: h.win ? T.green + '1a' : T.red + '1a', color: h.win ? T.green : T.red, border: `1px solid ${h.win ? T.green + '33' : T.red + '33'}` }}>{h.crash.toFixed(2)}×</span>)}
        </div>}
      </div>
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={PNL}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: T.muted, marginBottom: 7, fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>Target Multiplier</div>
          <div style={{ position: 'relative' }}>
            <input type="number" min="1.01" step=".1" value={target} onChange={e => setTgt(e.target.value)} disabled={rolling} style={{ ...INP, paddingRight: 40 }} />
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: T.teal, fontWeight: 700, fontFamily: MONO }}>×</span>
          </div>
          {parseFloat(target) >= 1.01 && <div style={{ fontSize: 10, color: T.muted, marginTop: 5, fontFamily: FONT }}>Win chance: <b style={{ color: T.teal }}>{(97 / parseFloat(target)).toFixed(1)}%</b></div>}
        </div>
        <BetRow val={bet} set={setBet} disabled={rolling} bal={bal} />
        <div style={{ marginTop: 14 }}><Btn label={rolling ? '🎯 Rolling…' : '🎯 Place Bet'} onClick={go} disabled={rolling || !parseFloat(bet) || parseFloat(bet) > bal || !parseFloat(target) || parseFloat(target) < 1.01} pulse={!rolling} /></div>
      </div>
    </div>
  );
}

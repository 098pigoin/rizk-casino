import { useState, useEffect, useRef, useCallback } from 'react';
import { T, FONT, MONO, PNL, INP, rng, f4, f2, genCrash, multAt, minesMult, mkDeck, handVal, drawCrashGraph, Btn, BetRow, PlayCard, WinToast, HPill, RED_S, RNUMS } from './shared.jsx';

// ══════════════════════════════════════════════════════════════════════════════
//  CRASH
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
  const cvRef = useRef(null), pts = useRef([]);
  const stR = useRef('cd'), onR = useRef(false), cR = useRef(false);
  const bR = useRef(0.05), aR = useRef(''), cpR = useRef(null);
  const t0 = useRef(null), tv = useRef(null), ctv = useRef(null);

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
  }, [onWin]);

  const runRound = useCallback(() => {
    const cp = genCrash(); cpR.current = cp; t0.current = Date.now();
    pts.current = []; setSt('fly'); stR.current = 'fly'; setM(1);
    tv.current = setInterval(() => {
      const ms = Date.now() - t0.current, m = multAt(ms);
      pts.current.push({ m });
      const ac = parseFloat(aR.current);
      if (onR.current && !cR.current && ac >= 1.01 && m >= ac) {
        const sm = parseFloat(m.toFixed(2));
        cR.current = true; setC(true); setCoM(sm);
        const p = parseFloat((bR.current * sm - bR.current).toFixed(4));
        onWin(p); setTt({ w: true, t: `Auto ×${sm.toFixed(2)} · +${f4(p)} ETH`, big: p > 0.1 });
      }
      if (m >= cpR.current) {
        clearInterval(tv.current); setM(cpR.current); setSt('bust'); stR.current = 'bust';
        pts.current.push({ m: cpR.current });
        drawCrashGraph(cvRef.current, pts.current, true, cR.current);
        if (onR.current && !cR.current) { onLose(bR.current); setTt({ w: false, t: `Crashed ×${cpR.current.toFixed(2)} · -${f4(bR.current)} ETH` }); }
        setOn(false); setH(h => [cpR.current, ...h.slice(0, 19)]);
        setTimeout(startCD, 3000);
      } else { setM(parseFloat(m.toFixed(2))); drawCrashGraph(cvRef.current, pts.current, false, cR.current); }
    }, 50);
  }, [onWin, onLose]);

  const startCD = useCallback(() => {
    setSt('cd'); stR.current = 'cd'; setOn(false); setC(false); cR.current = false; onR.current = false;
    setCoM(null); setTt(null); pts.current = [];
    const c = cvRef.current; if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
    let n = 5; setCd(n); clearInterval(ctv.current);
    ctv.current = setInterval(() => { n--; setCd(n); if (n <= 0) { clearInterval(ctv.current); runRound(); } }, 1000);
  }, [runRound]);

  useEffect(() => { startCD(); return () => { clearInterval(tv.current); clearInterval(ctv.current); }; }, []);
  useEffect(() => {
    const fn = e => { if (e.code === 'Space' && stR.current === 'fly') { e.preventDefault(); doCash(parseFloat((pts.current[pts.current.length - 1] || { m: 1 }).m.toFixed(2))); } };
    window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn);
  }, [doCash]);

  const dc = st === 'bust' ? T.red : cashed ? T.green : st === 'fly' ? T.teal : T.muted;
  const pnl = on && !cashed && st === 'fly' ? parseFloat((parseFloat(bet) * mult - parseFloat(bet)).toFixed(4)) : null;

  return (
    <div>
      <div style={{ display: 'flex', gap: 5, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }}>
        {hist.map((v, i) => <HPill key={i} v={v} />)}
      </div>
      <div style={{ ...PNL, padding: 0, overflow: 'hidden', marginBottom: 12, position: 'relative', minHeight: 230, borderRadius: 12 }}>
        <canvas ref={cvRef} width={600} height={230} style={{ width: '100%', height: 230, display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {st === 'cd' ? (
            <>
              <div style={{ fontSize: 11, color: T.muted, letterSpacing: 2, marginBottom: 8, fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase' }}>Starting in</div>
              <div style={{ fontSize: 96, fontWeight: 800, color: T.teal, lineHeight: 1, fontFamily: MONO, textShadow: `0 0 60px ${T.teal}77` }}>{cd}</div>
              {on && <div style={{ marginTop: 14, fontSize: 13, color: T.green, fontFamily: FONT, fontWeight: 600, background: T.green + '14', padding: '6px 20px', borderRadius: 20, border: `1px solid ${T.green}28` }}>Bet placed ✓</div>}
            </>
          ) : (
            <>
              <div style={{ fontSize: 11, color: dc + 'bb', letterSpacing: 2, marginBottom: 6, fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase' }}>
                {st === 'bust' ? 'Crashed' : cashed ? 'Cashed Out ✓' : 'Multiplier'}
              </div>
              <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, color: dc, fontFamily: MONO, textShadow: `0 0 50px ${dc}55`, transition: 'color .1s', fontVariantNumeric: 'tabular-nums' }}>
                {mult.toFixed(2)}×
              </div>
              {pnl !== null && <div style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: T.green, fontFamily: MONO, background: T.green + '14', padding: '4px 18px', borderRadius: 20 }}>+{f4(pnl)} ETH</div>}
            </>
          )}
        </div>
        {st === 'fly' && on && !cashed && <div style={{ position: 'absolute', bottom: 10, right: 12, fontSize: 10, color: T.muted, fontFamily: FONT, background: T.bg + 'ee', padding: '3px 9px', borderRadius: 5 }}>Space to cashout</div>}
      </div>
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={PNL}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <BetRow val={bet} set={setBet} disabled={on} bal={bal} />
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 7, fontFamily: FONT, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Auto Cashout ×</div>
            <input type="number" placeholder="e.g. 2.00" value={auto} onChange={e => setAuto(e.target.value)} style={{ ...INP, padding: '11px 14px' }} />
            <div style={{ fontSize: 10, color: T.muted, marginTop: 5, fontFamily: FONT }}>Leave blank for manual</div>
          </div>
        </div>
        {st === 'fly' && on && !cashed
          ? <button onClick={() => doCash(mult)} style={{ width: '100%', padding: '16px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${T.green}, ${T.greenD})`, color: '#080e1a', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, boxShadow: `0 0 36px ${T.green}55, 0 4px 16px rgba(0,0,0,.4)`, animation: 'glow .8s infinite', letterSpacing: 0.3 }}>
            Cash Out · {f4(parseFloat(bet) * mult)} ETH
          </button>
          : !on
            ? <Btn label={st === 'fly' || st === 'bust' ? 'Waiting for next round…' : st === 'cd' ? `Bet ${f4(parseFloat(bet) || 0)} ETH` : '…'} onClick={() => { const a = parseFloat(bet); if (!a || a > bal || st !== 'cd') return; onR.current = true; setOn(true); setTt(null); }} disabled={st !== 'cd' || !parseFloat(bet) || parseFloat(bet) > bal} />
            : <div style={{ ...PNL, padding: '14px', textAlign: 'center', color: cashed ? T.green : T.muted, fontSize: 13, fontFamily: FONT, fontWeight: 600 }}>{cashed ? `Cashed out at ${coM?.toFixed(2)}× ✓` : 'Bet active — good luck!'}</div>
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  MINES
// ══════════════════════════════════════════════════════════════════════════════
export function Mines({ bal, onWin, onLose }) {
  const N = 25;
  const [mc, setMc]       = useState(5);
  const [bet, setBet]     = useState('0.05');
  const [phase, setPhase] = useState('bet');
  const [tiles, setTiles] = useState([]);
  const [mineSet, setMS]  = useState(new Set());
  const [rev, setRev]     = useState(0);
  const [toast, setTt]    = useState(null);
  const cur  = minesMult(rev, N, mc);
  const next = minesMult(rev + 1, N, mc);

  const start = () => {
    const a = parseFloat(bet); if (!a || a > bal) return;
    const ms = new Set(); while (ms.size < mc) ms.add(rng(0, N - 1));
    setMS(ms); setTiles(Array(N).fill('h')); setRev(0); setTt(null); setPhase('p');
  };

  const click = useCallback((i) => {
    if (phase !== 'p' || tiles[i] !== 'h') return;
    if (mineSet.has(i)) {
      setTiles(t => { const n = [...t]; n[i] = 'bomb'; mineSet.forEach(m => { if (n[m] === 'h') n[m] = 'mine'; }); return n; });
      setPhase('d'); onLose(parseFloat(bet));
      setTt({ w: false, t: `Mine hit · -${f4(parseFloat(bet))} ETH` });
    } else {
      const r = rev + 1;
      setTiles(t => { const n = [...t]; n[i] = 'safe'; return n; });
      setRev(r);
      if (r === N - mc) {
        const m = minesMult(r, N, mc);
        setTiles(t => { const n = [...t]; mineSet.forEach(mi => { if (n[mi] === 'h') n[mi] = 'mine'; }); return n; });
        setPhase('d');
        const p = parseFloat((parseFloat(bet) * (m - 1)).toFixed(4));
        onWin(p); setTt({ w: true, t: `Board cleared! ×${m.toFixed(2)} · +${f4(p)} ETH`, big: true });
      }
    }
  }, [phase, tiles, mineSet, rev, bet, onWin, onLose, mc]);

  const cashout = () => {
    if (phase !== 'p' || rev === 0) return;
    setTiles(t => { const n = [...t]; mineSet.forEach(mi => { if (n[mi] === 'h') n[mi] = 'mine'; }); return n; });
    setPhase('d');
    const p = parseFloat((parseFloat(bet) * (cur - 1)).toFixed(4));
    onWin(p); setTt({ w: true, t: `Cashed out ×${cur.toFixed(2)} · +${f4(p)} ETH`, big: cur >= 3 });
  };

  const reset = () => { setPhase('bet'); setTiles([]); setRev(0); setTt(null); setMS(new Set()); };

  return (
    <div>
      {phase === 'p' && rev > 0 && (
        <div style={{ ...PNL, marginBottom: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '12px 18px' }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: T.muted, fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Safe</div><div style={{ fontSize: 20, fontWeight: 800, color: T.green, fontFamily: MONO }}>💎 {rev}</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: T.muted, fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Multiplier</div><div style={{ fontSize: 24, fontWeight: 800, color: T.teal, fontFamily: MONO, fontVariantNumeric: 'tabular-nums' }}>×{cur.toFixed(2)}</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: T.muted, fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Next Tile</div><div style={{ fontSize: 20, fontWeight: 800, color: T.gold, fontFamily: MONO, fontVariantNumeric: 'tabular-nums' }}>×{next.toFixed(2)}</div></div>
        </div>
      )}
      <div style={{ ...PNL, marginBottom: 12 }}>
        {phase === 'bet'
          ? <div style={{ textAlign: 'center', padding: '48px 0', color: T.muted, fontSize: 13, fontFamily: FONT }}>Set mines count and place your bet below</div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
            {tiles.map((t, i) => {
              const isSafe = t === 'safe', isBomb = t === 'bomb', isMine = t === 'mine';
              return (
                <button key={i} onClick={() => click(i)} style={{
                  aspectRatio: '1', borderRadius: 10,
                  background: isBomb ? T.red + '22' : isSafe ? T.green + '18' : isMine ? T.red + '0e' : phase === 'p' ? T.bg4 : T.dim,
                  border: `1px solid ${isBomb ? T.red : isSafe ? T.green + '66' : isMine ? T.red + '25' : T.bd}`,
                  fontSize: 20, cursor: phase === 'p' && t === 'h' ? 'pointer' : 'default',
                  transition: 'all .15s', outline: 'none',
                  transform: isSafe ? 'scale(1.06)' : 'scale(1)',
                  boxShadow: isBomb ? `0 0 18px ${T.red}66` : isSafe ? `0 0 14px ${T.green}35` : 'none',
                }}>
                  {isBomb ? '💥' : isSafe ? '💎' : isMine ? '💣' : ''}
                </button>
              );
            })}
          </div>
        }
      </div>
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
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
          <Btn label={rev > 0 ? `Cash Out ×${cur.toFixed(2)}` : 'Reveal a tile first'} onClick={cashout} disabled={rev === 0} col={T.green} pulse={rev > 0} />
          <Btn label="Give Up" onClick={reset} col={T.red} outline sm />
        </div>}
        {phase === 'd' && <Btn label="Play Again" onClick={reset} />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  PLINKO
// ══════════════════════════════════════════════════════════════════════════════
const PB = {
  low:    [0.5, 1, 1.5, 2, 3, 2, 1.5, 1, 0.5],
  medium: [0.3, 0.5, 1, 2, 5, 2, 1, 0.5, 0.3],
  high:   [0.2, 0.3, 0.5, 1, 10, 1, 0.5, 0.3, 0.2],
};
export function Plinko({ bal, onWin, onLose }) {
  const [bet, setBet]     = useState('0.05');
  const [risk, setRisk]   = useState('medium');
  const [drop, setDrop]   = useState(false);
  const [path, setPath]   = useState([]);
  const [step, setStep]   = useState(-1);
  const [land, setLand]   = useState(null);
  const [hist, setHist]   = useState([]);
  const [toast, setTt]    = useState(null);
  const bkts = PB[risk], COLS = bkts.length, CW = 36, CH = 34, ROWS = 8;

  const go = useCallback(async () => {
    const a = parseFloat(bet); if (!a || a > bal || drop) return;
    setDrop(true); setLand(null); setTt(null); setPath([]); setStep(-1);
    let col = Math.floor(COLS / 2);
    const pts = [];
    for (let r = 0; r < ROWS; r++) { col = Math.max(0, Math.min(COLS - 1, col + (Math.random() < 0.5 ? -1 : 1))); pts.push({ row: r, col }); }
    setPath(pts);
    for (let i = 0; i < pts.length; i++) { setStep(i); await new Promise(res => setTimeout(res, 165)); }
    const bkt = pts[pts.length - 1].col, m = bkts[bkt], profit = parseFloat((a * m - a).toFixed(4));
    setLand(bkt); setHist(h => [{ m, w: m > 1 }, ...h.slice(0, 19)]);
    setTt({ w: m > 1, t: m > 1 ? `×${m} Win! +${f4(profit)} ETH` : `×${m} · -${f4(a)} ETH`, big: m >= 5 });
    if (profit > 0) onWin(profit); else if (profit < 0) onLose(a * (1 - m));
    setDrop(false);
  }, [bet, bal, drop, bkts, onWin, onLose]);

  const bp = step >= 0 && step < path.length ? path[step] : null;
  return (
    <div>
      {hist.length > 0 && <div style={{ display: 'flex', gap: 5, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }}>{hist.map((h, i) => { const c = h.m < 1 ? T.red : h.m < 2 ? T.gold : T.green; return <span key={i} style={{ background: c + '1a', color: c, border: `1px solid ${c}22`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: MONO }}>×{h.m}</span>; })}</div>}
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={{ ...PNL, marginBottom: 12, padding: '18px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: COLS * CW, height: (ROWS + 2) * CH, flexShrink: 0 }}>
          {Array.from({ length: ROWS }, (_, row) => {
            const cnt = row % 2 === 0 ? COLS - 1 : COLS, off = row % 2 === 0 ? CW / 2 : 0;
            return Array.from({ length: cnt }, (_, col) => (
              <div key={`${row}-${col}`} style={{ position: 'absolute', left: col * CW + off + CW / 2 - 5, top: row * CH + CH / 2 - 5, width: 10, height: 10, borderRadius: '50%', background: T.bg5, border: `1px solid ${T.bdHi}`, boxShadow: `0 0 4px rgba(0,0,0,.4)` }} />
            ));
          })}
          {bp && <div style={{ position: 'absolute', left: bp.col * CW + CW / 2 - 9, top: bp.row * CH + CH / 2 - 9, width: 18, height: 18, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${T.teal}, ${T.tealD})`, boxShadow: `0 0 20px ${T.teal}bb, 0 2px 6px rgba(0,0,0,.4)`, transition: 'all .16s cubic-bezier(.4,0,.2,1)', zIndex: 10 }} />}
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', display: 'flex', gap: 3 }}>
            {bkts.map((m, i) => { const il = land === i, bc = m < 1 ? T.red : m < 2 ? T.gold : m < 5 ? T.green : T.teal; return <div key={i} style={{ flex: 1, padding: '5px 2px', textAlign: 'center', borderRadius: 6, background: il ? bc + '2a' : T.bg3, border: `1px solid ${il ? bc : T.bd}`, transition: 'all .2s', boxShadow: il ? `0 0 16px ${bc}66` : 'none' }}><div style={{ fontSize: 9, fontWeight: 700, color: il ? bc : T.muted, fontFamily: MONO }}>{m}×</div></div>; })}
          </div>
        </div>
      </div>
      <div style={PNL}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <BetRow val={bet} set={setBet} disabled={drop} bal={bal} />
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 7, fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Risk Level</div>
            <div style={{ display: 'flex', gap: 5 }}>{['low', 'medium', 'high'].map(r => <button key={r} onClick={() => setRisk(r)} disabled={drop} style={{ flex: 1, background: risk === r ? T.teal + '22' : T.bg3, border: `1px solid ${risk === r ? T.teal : T.bd}`, color: risk === r ? T.teal : T.muted, borderRadius: 7, padding: '10px 4px', fontSize: 11, fontWeight: 600, cursor: drop ? 'not-allowed' : 'pointer', fontFamily: FONT, transition: 'all .15s', textTransform: 'capitalize' }}>{r}</button>)}</div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 5, fontFamily: FONT }}>{risk === 'high' ? 'Max risk — huge upside, 10×' : risk === 'low' ? 'Safe — smaller but consistent' : 'Balanced risk/reward'}</div>
          </div>
        </div>
        <Btn label={drop ? 'Ball dropping…' : 'Drop Ball'} onClick={go} disabled={drop || !parseFloat(bet) || parseFloat(bet) > bal} pulse={!drop} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  DICE
// ══════════════════════════════════════════════════════════════════════════════
export function Dice({ bal, onWin, onLose }) {
  const [bet, setBet]     = useState('0.05');
  const [tgt, setTgt]     = useState(50);
  const [mode, setMode]   = useState('under');
  const [rolling, setR]   = useState(false);
  const [disp, setDisp]   = useState(null);
  const [res, setRes]     = useState(null);
  const [hist, setHist]   = useState([]);
  const [toast, setTt]    = useState(null);
  const [auto, setAuto]   = useState(false);
  const autoRef = useRef(false);
  useEffect(() => { autoRef.current = auto; }, [auto]);
  const wc  = mode === 'under' ? tgt / 100 : (100 - tgt) / 100;
  const pay = parseFloat(Math.max(1.01, 0.97 / wc).toFixed(2));

  const go = useCallback(() => {
    const a = parseFloat(bet); if (!a || a > bal) return;
    setR(true); setTt(null);
    const r = rng(1, 100), win = mode === 'under' ? r < tgt : r > tgt;
    let t = 0;
    const iv = setInterval(() => {
      setDisp(rng(1, 100));
      if (++t >= 16) {
        clearInterval(iv); setDisp(r); setRes({ r, win }); setHist(h => [{ r, win }, ...h.slice(0, 24)]);
        const profit = win ? parseFloat((a * (pay - 1)).toFixed(4)) : -a;
        setTt({ w: win, t: win ? `Win ×${pay} · +${f4(profit)} ETH` : `Lose · -${f4(a)} ETH`, big: pay >= 5 && win });
        if (win) onWin(a * (pay - 1)); else onLose(a);
        setR(false);
      }
    }, 55);
  }, [bet, mode, tgt, pay, bal, onWin, onLose]);

  useEffect(() => { if (!auto || rolling) return; const t = setTimeout(() => { if (autoRef.current) go(); }, 700); return () => clearTimeout(t); }, [auto, rolling]);

  const rc = res ? (res.win ? T.green : T.red) : T.teal;
  return (
    <div>
      <div style={{ ...PNL, marginBottom: 12, textAlign: 'center', padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 100%, ${rc}0e, transparent 55%)`, pointerEvents: 'none' }} />
        <div style={{ fontSize: 82, fontWeight: 800, color: rc, fontFamily: MONO, lineHeight: 1, transition: 'color .1s', filter: rolling ? 'blur(2px)' : 'none', fontVariantNumeric: 'tabular-nums' }}>{disp ?? '—'}</div>
        {res && <div style={{ fontSize: 16, fontWeight: 700, color: rc, marginTop: 8, fontFamily: FONT }}>{res.win ? `WIN ×${pay}` : 'LOSE'}</div>}
        <div style={{ margin: '20px auto 0', maxWidth: 380, height: 8, borderRadius: 50, background: T.bg3, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, height: '100%', width: `${mode === 'under' ? tgt : 100 - tgt}%`, background: T.green, borderRadius: 50 }} />
          <div style={{ position: 'absolute', left: mode === 'under' ? `${tgt}%` : 0, height: '100%', width: `${mode === 'under' ? 100 - tgt : tgt}%`, background: T.red, borderRadius: 50 }} />
          {res && <div style={{ position: 'absolute', top: '50%', left: `${res.r}%`, transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: res.win ? T.green : T.red, border: '2px solid #fff', zIndex: 2, boxShadow: `0 0 8px ${res.win ? T.green : T.red}` }} />}
        </div>
        {hist.length > 0 && <div style={{ display: 'flex', gap: 4, marginTop: 14, justifyContent: 'center', flexWrap: 'wrap' }}>{hist.slice(0, 14).map((h, i) => <span key={i} style={{ fontSize: 11, color: h.win ? T.green : T.red, background: h.win ? T.green + '16' : T.red + '16', padding: '2px 8px', borderRadius: 5, fontFamily: MONO, fontWeight: 700 }}>{h.r}</span>)}</div>}
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
            <span>Win: <b style={{ color: T.teal }}>{(wc * 100).toFixed(0)}%</b></span>
            <span>Payout: <b style={{ color: T.green }}>×{pay}</b></span>
          </div>
          <input type="range" min="5" max="95" value={tgt} onChange={e => { setTgt(+e.target.value); setAuto(false); }} style={{ width: '100%', accentColor: T.teal, cursor: 'pointer' }} />
        </div>
        <BetRow val={bet} set={v => { setBet(v); setAuto(false); }} disabled={auto} bal={bal} />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginTop: 14 }}>
          <Btn label={rolling ? 'Rolling…' : 'Roll'} onClick={go} disabled={rolling || auto || !parseFloat(bet) || parseFloat(bet) > bal} pulse={!rolling && !auto} />
          <Btn label={auto ? 'Stop' : 'Auto'} onClick={() => setAuto(v => !v)} col={auto ? T.red : T.purple} sm />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  BLACKJACK
// ══════════════════════════════════════════════════════════════════════════════
export function Blackjack({ bal, onWin, onLose }) {
  const [phase, setP] = useState('bet');
  const [bet, setBet] = useState('0.05');
  const [pH, setPH]   = useState([]);
  const [dH, setDH]   = useState([]);
  const [dk, setDk]   = useState([]);
  const [res, setRes] = useState(null);
  const [toast, setTt]= useState(null);

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
    if (pf > 0) onWin(pf); else if (pf < 0) onLose(Math.abs(pf));
    setTt({ w: pf >= 0, t: `${{ win: 'You Win', bj: 'Blackjack! 🎉', push: 'Push', lose: 'Dealer Wins', bust: 'Bust!' }[r]} · ${pf >= 0 ? '+' : ''}${f4(pf)} ETH`, big: r === 'bj' });
  };
  const hit   = () => { const np = [...pH, dk[0]], nd = dk.slice(1); setPH(np); setDk(nd); if (handVal(np) >= 21) fin(np, dH, nd); };
  const stand = () => fin(pH, dH);
  const dbl   = () => { if (pH.length !== 2 || parseFloat(bet) * 2 > bal) return; setBet(b => String(parseFloat((parseFloat(b) * 2).toFixed(4)))); const np = [...pH, dk[0]], nd = dk.slice(1); setPH(np); setDk(nd); fin(np, dH, nd); };

  const RC = { win: T.green, bj: T.gold, push: T.teal, lose: T.red, bust: T.red };
  const RL = { win: 'YOU WIN', bj: 'BLACKJACK!', push: 'PUSH', lose: 'DEALER WINS', bust: 'BUST' };
  const pv = handVal(pH), dv = handVal(dH);

  return (
    <div>
      <div style={{ ...PNL, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: T.muted, fontFamily: FONT, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Dealer</span>
          {phase === 'done' && <span style={{ fontSize: 12, fontWeight: 700, color: dv > 21 ? T.red : T.text, fontFamily: MONO }}>{dv} pts{dv > 21 ? ' · Bust!' : ''}</span>}
        </div>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', minHeight: 88 }}>
          {dH.map((c, i) => <PlayCard key={i} card={c} hidden={phase === 'play' && i === 1} />)}
          {!dH.length && <div style={{ color: T.muted, fontSize: 13, fontFamily: FONT, alignSelf: 'center' }}>Waiting for bet…</div>}
        </div>
      </div>
      <div style={{ ...PNL, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: T.muted, fontFamily: FONT, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>You</span>
          {phase !== 'bet' && <span style={{ fontSize: 12, fontWeight: 700, fontFamily: MONO, color: pv > 21 ? T.red : pv === 21 ? T.gold : T.text }}>{pv} pts{pv === 21 ? ' 🔥' : ''}{pv > 21 ? ' · Bust!' : ''}</span>}
        </div>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', minHeight: 88 }}>
          {pH.map((c, i) => <PlayCard key={i} card={c} />)}
          {!pH.length && <div style={{ color: T.muted, fontSize: 13, fontFamily: FONT, alignSelf: 'center' }}>Place your bet</div>}
        </div>
      </div>
      {res && <div style={{ background: RC[res] + '1a', border: `1px solid ${RC[res]}35`, borderRadius: 10, padding: '14px', textAlign: 'center', marginBottom: 12, color: RC[res], fontSize: 24, fontWeight: 800, fontFamily: FONT, letterSpacing: 1, boxShadow: `0 0 24px ${RC[res]}22` }}>{RL[res]}</div>}
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={PNL}>
        {phase === 'bet' && <><BetRow val={bet} set={setBet} disabled={false} bal={bal} /><div style={{ marginTop: 14 }}><Btn label="Deal Cards" onClick={deal} disabled={!parseFloat(bet) || parseFloat(bet) > bal} pulse /></div></>}
        {phase === 'play' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          <Btn label="Hit" onClick={hit} />
          <Btn label="Stand" onClick={stand} col={T.tealD} />
          <Btn label="Double" onClick={dbl} col={T.purple} disabled={pH.length !== 2 || parseFloat(bet) * 2 > bal} />
        </div>}
        {phase === 'done' && <Btn label="New Hand" onClick={reset} />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  ROULETTE
// ══════════════════════════════════════════════════════════════════════════════
export function Roulette({ bal, onWin, onLose }) {
  const [bet, setBet]     = useState('0.05');
  const [bt, setBt]       = useState('red');
  const [np, setNp]       = useState('');
  const [sp, setSp]       = useState(false);
  const [res, setRes]     = useState(null);
  const [hist, setHist]   = useState([]);
  const [deg, setDeg]     = useState(0);
  const [toast, setTt]    = useState(null);
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
      if (win) onWin(a * (m - 1)); else onLose(a); setSp(false);
    }, 4000);
  };

  const nc = n => n === 0 ? T.green : RNUMS.has(n) ? '#e53935' : '#e0e0e0';
  return (
    <div>
      <div style={{ ...PNL, marginBottom: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px' }}>
        <div style={{ position: 'relative', width: 196, height: 196, marginBottom: 16 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `4px solid ${T.bd}`, background: 'conic-gradient(#e53935 0 10deg,#1c2d4f 10deg 20deg,#e53935 20deg 30deg,#1c2d4f 30deg 40deg,#e53935 40deg 50deg,#1c2d4f 50deg 60deg,#e53935 60deg 70deg,#1c2d4f 70deg 80deg,#e53935 80deg 90deg,#1c2d4f 90deg 100deg,#e53935 100deg 110deg,#1c2d4f 110deg 120deg,#e53935 120deg 130deg,#1c2d4f 130deg 140deg,#e53935 140deg 150deg,#1c2d4f 150deg 160deg,#e53935 160deg 170deg,#1c2d4f 170deg 175deg,#00e87a 175deg 185deg,#1c2d4f 185deg 360deg)', transform: `rotate(${deg}deg)`, transition: sp ? 'transform 4s cubic-bezier(0.08,0.6,0.06,1)' : 'none', boxShadow: '0 0 60px rgba(0,0,0,.7)' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 84, height: 84, borderRadius: '50%', background: T.bg2, border: `3px solid ${T.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, boxShadow: 'inset 0 2px 12px rgba(0,0,0,.6)' }}>
            <span style={{ fontSize: 30, fontWeight: 900, fontFamily: MONO, color: res ? nc(res.n) : T.muted, transition: 'color .3s' }}>{res ? res.n : '?'}</span>
          </div>
          <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontSize: 24, zIndex: 3, color: T.teal, filter: `drop-shadow(0 0 10px ${T.teal})` }}>▼</div>
        </div>
        {hist.length > 0 && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>{hist.map((h, i) => <div key={i} style={{ width: 30, height: 30, borderRadius: '50%', background: h.isG ? T.green + '22' : h.isR ? '#e5393522' : '#546e7a22', color: h.isG ? T.green : h.isR ? '#e53935' : '#90a4ae', border: `1px solid ${h.isG ? T.green + '44' : h.isR ? '#e5393544' : '#546e7a44'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, fontFamily: MONO }}>{h.n}</div>)}</div>}
      </div>
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={PNL}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 14 }}>
          {BTS.map(({ k, l, c, o }) => <button key={k} onClick={() => setBt(k)} style={{ background: bt === k ? c + '22' : T.bg3, border: `1px solid ${bt === k ? c : T.bd}`, color: bt === k ? c : T.muted, borderRadius: 8, padding: '9px 4px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, transition: 'all .15s' }}><div>{l}</div><div style={{ fontSize: 9, opacity: .7, marginTop: 2 }}>{o}</div></button>)}
        </div>
        {bt === 'number' && <div style={{ marginBottom: 14 }}><input type="number" min="0" max="36" placeholder="Pick 0–36" value={np} onChange={e => setNp(e.target.value)} style={{ ...INP, padding: '11px 14px' }} /></div>}
        <BetRow val={bet} set={setBet} disabled={sp} bal={bal} />
        <div style={{ marginTop: 14 }}><Btn label={sp ? 'Spinning…' : 'Spin'} onClick={go} disabled={sp || !parseFloat(bet) || parseFloat(bet) > bal} pulse={!sp} /></div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  SLOTS
// ══════════════════════════════════════════════════════════════════════════════
const SYM = ['7️⃣', '💎', '👑', '⭐', '🔔', '🍒', '🍋', '🍊'];
const SPAY = { '7️⃣': 100, '💎': 50, '👑': 25, '⭐': 15, '🔔': 8, '🍒': 4, '🍋': 3, '🍊': 2 };

export function Slots({ bal, onWin, onLose }) {
  const [bet, setBet]   = useState('0.05');
  const [spin, setSpin] = useState(false);
  const [cols, setCols] = useState([[0, 1, 2], [3, 4, 5], [6, 7, 0]]);
  const [spin2, setSpin2] = useState([false, false, false]);
  const [res, setRes]   = useState(null);
  const [toast, setTt]  = useState(null);

  const go = useCallback(async () => {
    const a = parseFloat(bet); if (!a || a > bal || spin) return;
    setSpin(true); setRes(null); setTt(null);
    const finals = [rng(0, 7), rng(0, 7), rng(0, 7)];
    for (let r = 0; r < 3; r++) {
      setSpin2(p => { const n = [...p]; n[r] = true; return n; });
      await new Promise(resolve => setTimeout(resolve, 500 + r * 260));
      setCols(prev => { const n = prev.map(c => [...c]); n[r] = [(finals[r] + 7) % 8, finals[r], (finals[r] + 1) % 8]; return n; });
      setSpin2(p => { const n = [...p]; n[r] = false; return n; });
      await new Promise(resolve => setTimeout(resolve, 160));
    }
    const s0 = SYM[finals[0]], s1 = SYM[finals[1]], s2 = SYM[finals[2]];
    let mult = 0, label = '';
    if (s0 === s1 && s1 === s2) { mult = SPAY[s0] || 2; label = `3× ${s0} Jackpot!`; }
    else if (s0 === s1) { mult = parseFloat(((SPAY[s0] || 2) * 0.18).toFixed(2)); label = `Pair ${s0}`; }
    else if (s1 === s2) { mult = parseFloat(((SPAY[s1] || 2) * 0.18).toFixed(2)); label = `Pair ${s1}`; }
    const win = mult > 0, profit = win ? parseFloat((a * mult).toFixed(4)) : -a;
    setRes({ win, mult, label });
    setTt({ w: win, t: win ? `${label} · +${f4(profit)} ETH` : `No match · -${f4(a)} ETH`, big: mult >= 10 });
    if (win) onWin(profit); else onLose(a);
    setSpin(false);
  }, [bet, bal, spin, onWin, onLose]);

  return (
    <div>
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={{ ...PNL, marginBottom: 12, padding: '24px 16px', background: `linear-gradient(180deg, ${T.bg2}, ${T.bg3})` }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          {cols.map((col, ri) => (
            <div key={ri} style={{ position: 'relative', width: 84, height: 188, background: T.bg, borderRadius: 12, border: `2px solid ${res?.win && !spin ? T.gold : T.bd}`, overflow: 'hidden', boxShadow: res?.win && !spin ? `0 0 24px ${T.gold}55, inset 0 0 20px rgba(0,0,0,.5)` : 'inset 0 0 20px rgba(0,0,0,.5)', transition: 'border-color .3s, box-shadow .3s' }}>
              <div style={{ animation: spin2[ri] ? 'rspin .09s steps(1) infinite' : 'none' }}>
                {col.map((si, row) => (
                  <div key={row} style={{ height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, background: row === 1 && res && !spin ? res.win ? T.gold + '1a' : T.red + '0a' : 'transparent', transition: 'background .3s' }}>{SYM[si]}</div>
                ))}
              </div>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: res?.win && !spin ? T.gold + '77' : 'transparent', transform: 'translateY(-50%)', transition: 'background .3s' }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
          {Object.entries(SPAY).slice(0, 6).map(([s, m]) => (
            <div key={s} style={{ fontSize: 10, color: T.muted, fontFamily: FONT, background: T.bg3, padding: '3px 9px', borderRadius: 5, border: `1px solid ${T.bd}` }}>
              {s}{s}{s} = <span style={{ color: T.gold, fontWeight: 700 }}>×{m}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={PNL}>
        <BetRow val={bet} set={setBet} disabled={spin} bal={bal} />
        <div style={{ marginTop: 14 }}><Btn label={spin ? 'Spinning…' : '🎰 Spin'} onClick={go} disabled={spin || !parseFloat(bet) || parseFloat(bet) > bal} pulse={!spin} /></div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  HI-LO
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

  const start = () => {
    const a = parseFloat(bet); if (!a || a > bal) return;
    const d = mkDeck(); setDk(d.slice(1)); setCard(d[0]); setNxt(null); setSteps(0); setMult(1); setTt(null); setPhase('play');
  };

  const guess = useCallback((g) => {
    if (phase !== 'play' || !dk.length) return;
    const next = dk[0], rest = dk.slice(1);
    setNxt(next); setDk(rest);
    const r = card.ri, nr = next.ri;
    const ok = g === 'hi' ? nr > r : g === 'lo' ? nr < r : nr === r;
    if (ok) {
      const total = 12;
      const prob = g === 'hi' ? (total - r) / total : g === 'lo' ? r / total : 3 / 52;
      const m = Math.max(1.1, parseFloat((0.97 / Math.max(prob, 0.05)).toFixed(2)));
      const nm = parseFloat((mult * m).toFixed(2));
      setMult(nm); setSteps(s => s + 1); setCard(next); setNxt(null);
      setTt({ w: true, t: `Correct! Running ×${nm.toFixed(2)}` });
    } else {
      setPhase('done');
      onLose(parseFloat(bet));
      setTt({ w: false, t: `Wrong! Lost ${f4(parseFloat(bet))} ETH` });
    }
  }, [phase, dk, card, mult, bet, onLose]);

  const cashout = () => {
    if (phase !== 'play' || steps === 0) return;
    setPhase('done');
    const a = parseFloat(bet), profit = parseFloat((a * mult - a).toFixed(4));
    onWin(profit);
    setTt({ w: true, t: `Cashed out ×${mult.toFixed(2)} · +${f4(profit)} ETH`, big: profit > 0.1 });
  };

  const rname = r => ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'][r] || r;

  return (
    <div>
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={{ ...PNL, marginBottom: 12, padding: '28px 16px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 100%, ${T.teal}0c, transparent 60%)`, pointerEvents: 'none' }} />
        {phase === 'bet'
          ? <div style={{ color: T.muted, fontSize: 13, fontFamily: FONT, padding: '32px 0' }}>Place a bet to start the card ladder</div>
          : <>
            <div style={{ fontSize: 11, color: T.muted, letterSpacing: 2, marginBottom: 12, fontFamily: FONT, fontWeight: 700, textTransform: 'uppercase' }}>Step {steps} · {phase === 'done' ? 'Game Over' : 'Going'}</div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, marginBottom: 16 }}>
              {card && <PlayCard card={card} />}
              {nxt && <><div style={{ fontSize: 24, color: T.teal, fontWeight: 700 }}>→</div><PlayCard card={nxt} /></>}
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: T.teal, fontFamily: MONO, marginBottom: 5, fontVariantNumeric: 'tabular-nums' }}>×{mult.toFixed(2)}</div>
            <div style={{ fontSize: 12, color: T.muted, fontFamily: FONT }}>Payout: {f4(parseFloat(bet) * mult)} ETH</div>
            {card && phase === 'play' && <div style={{ marginTop: 12, fontSize: 12, color: T.text, fontFamily: FONT }}>Current card: <b style={{ color: T.white }}>{rname(card.ri)} of {card.s}</b> — Higher, Lower, or Equal?</div>}
          </>
        }
      </div>
      <div style={PNL}>
        {phase === 'bet' && <><BetRow val={bet} set={setBet} disabled={false} bal={bal} /><div style={{ marginTop: 14 }}><Btn label="Start Game" onClick={start} disabled={!parseFloat(bet) || parseFloat(bet) > bal} pulse /></div></>}
        {phase === 'play' && <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
            <Btn label="⬆ Higher" onClick={() => guess('hi')} col={T.green} />
            <Btn label="= Equal" onClick={() => guess('eq')} col={T.purple} />
            <Btn label="⬇ Lower" onClick={() => guess('lo')} col={T.red} />
          </div>
          <Btn label={steps > 0 ? `Cash Out ×${mult.toFixed(2)}` : 'Reveal a card first'} onClick={cashout} disabled={steps === 0} col={T.gold} pulse={steps > 0} outline />
        </>}
        {phase === 'done' && <Btn label="Play Again" onClick={() => { setPhase('bet'); setCard(null); setNxt(null); setDk([]); }} />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  WHEEL
// ══════════════════════════════════════════════════════════════════════════════
const WS = [{ m: 0, c: '#b71c1c', l: 'BUST' }, { m: 1.5, c: '#1565c0', l: '1.5×' }, { m: 2, c: '#2e7d32', l: '2×' }, { m: 1.5, c: '#1565c0', l: '1.5×' }, { m: 3, c: '#6a1b9a', l: '3×' }, { m: 1.5, c: '#1565c0', l: '1.5×' }, { m: 0, c: '#b71c1c', l: 'BUST' }, { m: 2, c: '#2e7d32', l: '2×' }, { m: 5, c: '#e65100', l: '5×' }, { m: 1.5, c: '#1565c0', l: '1.5×' }, { m: 0, c: '#b71c1c', l: 'BUST' }, { m: 2, c: '#2e7d32', l: '2×' }, { m: 1.5, c: '#1565c0', l: '1.5×' }, { m: 10, c: '#c6a700', l: '10×' }, { m: 1.5, c: '#1565c0', l: '1.5×' }, { m: 0, c: '#b71c1c', l: 'BUST' }, { m: 2, c: '#2e7d32', l: '2×' }, { m: 1.5, c: '#1565c0', l: '1.5×' }, { m: 50, c: '#00bcd4', l: '50×' }, { m: 1.5, c: '#1565c0', l: '1.5×' }, { m: 0, c: '#b71c1c', l: 'BUST' }, { m: 3, c: '#6a1b9a', l: '3×' }, { m: 2, c: '#2e7d32', l: '2×' }, { m: 1.5, c: '#1565c0', l: '1.5×' }];
const NS = WS.length, SD = 360 / NS;

export function Wheel({ bal, onWin, onLose }) {
  const [bet, setBet]   = useState('0.05');
  const [spin, setSpin] = useState(false);
  const [deg, setDeg]   = useState(0);
  const [res, setRes]   = useState(null);
  const [hist, setHist] = useState([]);
  const [toast, setTt]  = useState(null);

  const go = () => {
    const a = parseFloat(bet); if (!a || a > bal || spin) return;
    setSpin(true); setRes(null); setTt(null);
    const idx = rng(0, NS - 1);
    setDeg(d => d + 360 * 12 + idx * SD + SD / 2);
    setTimeout(() => {
      const seg = WS[idx], win = seg.m > 0, profit = win ? parseFloat((a * seg.m - a).toFixed(4)) : -a;
      setRes({ idx, seg }); setHist(h => [{ m: seg.m, win }, ...h.slice(0, 19)]);
      setTt({ w: win, t: win ? `${seg.l} · +${f4(profit)} ETH` : `Bust! -${f4(a)} ETH`, big: seg.m >= 10 });
      if (win) onWin(a * seg.m); else onLose(a);
      setSpin(false);
    }, 4500);
  };

  return (
    <div>
      {hist.length > 0 && <div style={{ display: 'flex', gap: 5, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }}>{hist.map((h, i) => { const c = h.m === 0 ? T.red : h.m < 3 ? T.gold : T.green; return <span key={i} style={{ background: c + '1a', color: c, border: `1px solid ${c}22`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: MONO }}>{h.m === 0 ? 'BUST' : `×${h.m}`}</span>; })}</div>}
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={{ ...PNL, marginBottom: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px' }}>
        <div style={{ position: 'relative', width: 230, height: 230, marginBottom: 14 }}>
          <svg width="230" height="230" style={{ transform: `rotate(${deg}deg)`, transition: spin ? 'transform 4.5s cubic-bezier(0.08,0.7,0.06,1)' : 'none', display: 'block', filter: 'drop-shadow(0 0 20px rgba(0,0,0,.6))' }}>
            {WS.map((seg, i) => {
              const st = (i / NS) * 2 * Math.PI - Math.PI / 2, en = ((i + 1) / NS) * 2 * Math.PI - Math.PI / 2;
              const cx = 115, cy = 115, r = 110;
              const x1 = cx + r * Math.cos(st), y1 = cy + r * Math.sin(st), x2 = cx + r * Math.cos(en), y2 = cy + r * Math.sin(en);
              const lx = cx + r * 0.65 * Math.cos((st + en) / 2), ly = cy + r * 0.65 * Math.sin((st + en) / 2);
              const a2 = ((st + en) / 2 + Math.PI / 2) * 180 / Math.PI;
              return (
                <g key={i}>
                  <path d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`} fill={seg.c} stroke={T.bg} strokeWidth="1.5" />
                  <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={seg.m >= 10 ? 10 : 9} fontWeight="700" fontFamily={FONT} transform={`rotate(${a2},${lx},${ly})`}>{seg.l}</text>
                </g>
              );
            })}
            <circle cx="115" cy="115" r="22" fill={T.bg2} stroke={T.bd} strokeWidth="2" />
            <text x="115" y="115" textAnchor="middle" dominantBaseline="middle" fill={T.teal} fontSize="11" fontWeight="800" fontFamily={FONT}>RIZK</text>
          </svg>
          <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontSize: 26, color: T.teal, filter: `drop-shadow(0 0 10px ${T.teal})` }}>▼</div>
        </div>
        {res && <div style={{ fontSize: 26, fontWeight: 800, color: res.seg.m > 0 ? T.gold : T.red, fontFamily: MONO, textShadow: `0 0 24px ${res.seg.m > 0 ? T.gold : T.red}77` }}>{res.seg.l}</div>}
        <div style={{ marginTop: 10, fontSize: 11, color: T.muted, fontFamily: FONT, textAlign: 'center' }}>Jackpot: <b style={{ color: T.teal }}>50×</b> · 10×: 1 in 24 · Bust: ~25%</div>
      </div>
      <div style={PNL}>
        <BetRow val={bet} set={setBet} disabled={spin} bal={bal} />
        <div style={{ marginTop: 14 }}><Btn label={spin ? 'Spinning…' : '🎡 Spin the Wheel'} onClick={go} disabled={spin || !parseFloat(bet) || parseFloat(bet) > bal} pulse={!spin} /></div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  KENO
// ══════════════════════════════════════════════════════════════════════════════
const KENO_PAY = { 1: [0, 2], 2: [0, 0, 4], 3: [0, 0, 2, 8], 4: [0, 0, 1, 4, 20], 5: [0, 0, 0, 2, 10, 50] };

export function Keno({ bal, onWin, onLose }) {
  const [bet, setBet]     = useState('0.05');
  const [picks, setPicks] = useState(new Set());
  const [drawn, setDrawn] = useState(new Set());
  const [running, setRun] = useState(false);
  const [toast, setTt]    = useState(null);
  const [hist, setHist]   = useState([]);
  const maxPick = 5;

  const togglePick = (n) => {
    if (running) return;
    setPicks(prev => {
      const ns = new Set(prev);
      if (ns.has(n)) ns.delete(n);
      else if (ns.size < maxPick) ns.add(n);
      return ns;
    });
    setDrawn(new Set());
  };

  const play = useCallback(async () => {
    const a = parseFloat(bet);
    if (!a || a > bal || running || picks.size === 0) return;
    setRun(true); setDrawn(new Set()); setTt(null);
    // Draw 20 numbers one by one
    const pool = Array.from({ length: 80 }, (_, i) => i + 1);
    for (let i = pool.length - 1; i > 0; i--) { const j = rng(0, i); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const drawnNums = pool.slice(0, 20);
    const revealSet = new Set();
    for (const n of drawnNums) {
      revealSet.add(n);
      setDrawn(new Set(revealSet));
      await new Promise(res => setTimeout(res, 80));
    }
    const hits = [...picks].filter(n => drawnNums.includes(n)).length;
    const payTable = KENO_PAY[picks.size] || [];
    const mult = payTable[hits] || 0;
    const win = mult > 0;
    const profit = win ? parseFloat((a * mult - a).toFixed(4)) : -a;
    setHist(h => [{ hits, picks: picks.size, win }, ...h.slice(0, 9)]);
    setTt({ w: win, t: win ? `${hits}/${picks.size} hits · ×${mult} · +${f4(profit)} ETH` : `${hits}/${picks.size} hits · No win · -${f4(a)} ETH`, big: mult >= 10 });
    if (win) onWin(profit); else onLose(a);
    setRun(false);
  }, [bet, bal, running, picks, onWin, onLose]);

  return (
    <div>
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      {/* Paytable */}
      <div style={{ ...PNL, marginBottom: 12, padding: '10px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: T.muted, fontFamily: FONT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pick {picks.size || '1–5'} Numbers</span>
          {picks.size > 0 && <span style={{ fontSize: 11, color: T.teal, fontFamily: FONT, fontWeight: 600 }}>{picks.size} selected · {20 - picks.size} to add</span>}
        </div>
        {picks.size > 0 && KENO_PAY[picks.size] && (
          <div style={{ display: 'flex', gap: 5 }}>
            {KENO_PAY[picks.size].map((m, hits) => (
              <div key={hits} style={{ flex: 1, textAlign: 'center', background: T.bg3, borderRadius: 6, padding: '5px 3px', border: `1px solid ${T.bd}` }}>
                <div style={{ fontSize: 9, color: T.muted, fontFamily: FONT, marginBottom: 2 }}>{hits} hits</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: m > 0 ? T.gold : T.muted, fontFamily: MONO }}>{m > 0 ? `×${m}` : '—'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Grid */}
      <div style={{ ...PNL, marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 5 }}>
          {Array.from({ length: 80 }, (_, i) => {
            const n = i + 1;
            const isPick = picks.has(n), isDrawn = drawn.has(n), isHit = isPick && isDrawn;
            return (
              <button key={n} onClick={() => togglePick(n)} style={{
                aspectRatio: '1', borderRadius: 7, fontSize: 11, fontWeight: 700, fontFamily: MONO,
                background: isHit ? T.green + '2a' : isPick ? T.teal + '22' : isDrawn ? T.bg5 : T.bg3,
                color: isHit ? T.green : isPick ? T.teal : isDrawn ? T.text : T.muted,
                border: `1px solid ${isHit ? T.green : isPick ? T.teal : isDrawn ? T.bdHi : T.bd}`,
                cursor: running ? 'default' : 'pointer',
                transition: 'all .1s',
                boxShadow: isHit ? `0 0 10px ${T.green}44` : 'none',
              }}>{n}</button>
            );
          })}
        </div>
        {hist.length > 0 && (
          <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
            {hist.map((h, i) => <span key={i} style={{ fontSize: 10, color: h.win ? T.green : T.muted, fontFamily: FONT, background: h.win ? T.green + '14' : T.bg3, padding: '2px 8px', borderRadius: 4, border: `1px solid ${h.win ? T.green + '33' : T.bd}` }}>{h.hits}/{h.picks}</span>)}
          </div>
        )}
      </div>
      <div style={PNL}>
        <BetRow val={bet} set={setBet} disabled={running} bal={bal} />
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
          <Btn label={running ? 'Drawing…' : picks.size === 0 ? 'Pick numbers first' : `Play ${picks.size} numbers`} onClick={play} disabled={running || !parseFloat(bet) || parseFloat(bet) > bal || picks.size === 0} pulse={!running && picks.size > 0} />
          <Btn label="Clear" onClick={() => { setPicks(new Set()); setDrawn(new Set()); }} disabled={running} col={T.red} outline full={false} sm />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  TOWERS
// ══════════════════════════════════════════════════════════════════════════════
export function Towers({ bal, onWin, onLose }) {
  const COLS = 3, ROWS = 8;
  const [bet, setBet]         = useState('0.05');
  const [phase, setPhase]     = useState('bet');
  const [grid, setGrid]       = useState([]);
  const [mines, setMines]     = useState([]);
  const [level, setLevel]     = useState(0);
  const [toast, setTt]        = useState(null);

  const mult = level === 0 ? 1 : parseFloat((Math.pow(1.45, level)).toFixed(2));

  const start = () => {
    const a = parseFloat(bet); if (!a || a > bal) return;
    // Each row has exactly 1 mine in a random column
    const m = Array.from({ length: ROWS }, () => rng(0, COLS - 1));
    setMines(m);
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill('h')));
    setLevel(0); setTt(null); setPhase('p');
  };

  const clickCell = (row, col) => {
    if (phase !== 'p' || row !== level) return;
    const isMine = mines[row] === col;
    setGrid(g => { const n = g.map(r => [...r]); n[row][col] = isMine ? 'bomb' : 'safe'; if (isMine) { mines.forEach((mc, ri) => { if (ri !== row) n[ri][mc] = 'mine'; }); } return n; });
    if (isMine) {
      setPhase('d'); onLose(parseFloat(bet));
      setTt({ w: false, t: `Mine! Lost ${f4(parseFloat(bet))} ETH` });
    } else {
      const nl = level + 1;
      setLevel(nl);
      if (nl >= ROWS) {
        const m2 = parseFloat((Math.pow(1.45, nl)).toFixed(2));
        const p = parseFloat((parseFloat(bet) * m2 - parseFloat(bet)).toFixed(4));
        setPhase('d'); onWin(p);
        setTt({ w: true, t: `Tower cleared! ×${m2} · +${f4(p)} ETH`, big: true });
      }
    }
  };

  const cashout = () => {
    if (phase !== 'p' || level === 0) return;
    setGrid(g => { const n = g.map(r => [...r]); mines.forEach((mc, ri) => { if (n[ri][mc] === 'h') n[ri][mc] = 'mine'; }); return n; });
    setPhase('d');
    const p = parseFloat((parseFloat(bet) * mult - parseFloat(bet)).toFixed(4));
    onWin(p); setTt({ w: true, t: `Cashed out ×${mult.toFixed(2)} · +${f4(p)} ETH`, big: mult >= 3 });
  };

  const reset = () => { setPhase('bet'); setGrid([]); setLevel(0); setTt(null); setMines([]); };

  const rowIndex = ROWS - 1 - level; // bottom row first

  return (
    <div>
      {phase === 'p' && level > 0 && (
        <div style={{ ...PNL, marginBottom: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '12px 18px' }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: T.muted, fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Level</div><div style={{ fontSize: 20, fontWeight: 800, color: T.green, fontFamily: MONO }}>🏆 {level}/{ROWS}</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: T.muted, fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Multiplier</div><div style={{ fontSize: 24, fontWeight: 800, color: T.teal, fontFamily: MONO }}>×{mult.toFixed(2)}</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: T.muted, fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Next</div><div style={{ fontSize: 20, fontWeight: 800, color: T.gold, fontFamily: MONO }}>×{parseFloat((Math.pow(1.45, level + 1)).toFixed(2)).toFixed(2)}</div></div>
        </div>
      )}
      <div style={{ ...PNL, marginBottom: 12 }}>
        {phase === 'bet'
          ? <div style={{ textAlign: 'center', padding: '48px 0', color: T.muted, fontSize: 13, fontFamily: FONT }}>Climb the tower — one mine per row, hidden!</div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Array.from({ length: ROWS }, (_, rowRev) => {
              const row = ROWS - 1 - rowRev;
              const isActive = row === level && phase === 'p';
              const isPast = row < level;
              return (
                <div key={row} style={{ display: 'flex', gap: 6, opacity: row > level && phase === 'p' ? 0.3 : 1 }}>
                  <div style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: isPast ? T.green : isActive ? T.teal : T.muted, fontFamily: MONO, fontWeight: 700 }}>
                    {isPast ? '✓' : isActive ? '▶' : `${row + 1}`}
                  </div>
                  {Array.from({ length: COLS }, (_, col) => {
                    const t = grid[row]?.[col] || 'h';
                    const isSafe = t === 'safe', isBomb = t === 'bomb', isMine = t === 'mine';
                    return (
                      <button key={col} onClick={() => clickCell(row, col)} style={{
                        flex: 1, height: 52, borderRadius: 9, fontSize: 22,
                        background: isBomb ? T.red + '25' : isSafe ? T.green + '18' : isMine ? T.red + '0e' : isActive ? T.bg5 : T.bg3,
                        border: `1px solid ${isBomb ? T.red : isSafe ? T.green + '66' : isMine ? T.red + '22' : isActive ? T.bdHi : T.bd}`,
                        cursor: isActive ? 'pointer' : 'default',
                        transition: 'all .15s', outline: 'none',
                        boxShadow: isActive ? `0 2px 12px rgba(0,0,0,.3), 0 0 0 1px ${T.bdHi}44` : 'none',
                        transform: isSafe ? 'scale(1.04)' : 'scale(1)',
                      }}>
                        {isBomb ? '💥' : isSafe ? '✓' : isMine ? '💣' : ''}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        }
      </div>
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={PNL}>
        {phase === 'bet' && <><BetRow val={bet} set={setBet} bal={bal} /><div style={{ marginTop: 14 }}><Btn label="Start Climb" onClick={start} disabled={!parseFloat(bet) || parseFloat(bet) > bal} pulse /></div></>}
        {phase === 'p' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Btn label={level > 0 ? `Cash Out ×${mult.toFixed(2)}` : 'Pick a cell first'} onClick={cashout} disabled={level === 0} col={T.green} pulse={level > 0} />
          <Btn label="Give Up" onClick={reset} col={T.red} outline sm />
        </div>}
        {phase === 'd' && <Btn label="Play Again" onClick={reset} />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  LIMBO
// ══════════════════════════════════════════════════════════════════════════════
export function Limbo({ bal, onWin, onLose }) {
  const [bet, setBet]       = useState('0.05');
  const [target, setTarget] = useState('2.00');
  const [rolling, setR]     = useState(false);
  const [result, setResult] = useState(null);
  const [hist, setHist]     = useState([]);
  const [toast, setTt]      = useState(null);
  const [auto, setAuto]     = useState(false);
  const autoRef = useRef(false);
  useEffect(() => { autoRef.current = auto; }, [auto]);

  const tgt = parseFloat(target) || 2;
  const winChance = Math.min(99, 99 / tgt);
  const pay = parseFloat((99 / winChance).toFixed(2));

  const go = useCallback(() => {
    const a = parseFloat(bet), t = parseFloat(target);
    if (!a || a > bal || !t || t < 1.01) return;
    setR(true); setTt(null);
    setTimeout(() => {
      const r = Math.random();
      const roll = parseFloat(Math.max(1.01, (1 / (1 - r * 0.99))).toFixed(2));
      const win = roll >= t;
      const profit = win ? parseFloat((a * (t - 1)).toFixed(4)) : -a;
      setResult({ roll, win, t });
      setHist(h => [{ roll, win }, ...h.slice(0, 24)]);
      setTt({ w: win, t: win ? `${roll.toFixed(2)}× ≥ ${t}× Win! +${f4(profit)} ETH` : `${roll.toFixed(2)}× < ${t}× Lose · -${f4(a)} ETH`, big: win && t >= 10 });
      if (win) onWin(a * (t - 1)); else onLose(a);
      setR(false);
    }, 600);
  }, [bet, target, bal, onWin, onLose]);

  useEffect(() => { if (!auto || rolling) return; const t = setTimeout(() => { if (autoRef.current) go(); }, 750); return () => clearTimeout(t); }, [auto, rolling]);

  const rc = result ? (result.win ? T.green : T.red) : T.teal;

  return (
    <div>
      <div style={{ ...PNL, marginBottom: 12, textAlign: 'center', padding: '36px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 100%, ${rc}0e, transparent 55%)`, pointerEvents: 'none' }} />
        <div style={{ fontSize: 11, color: T.muted, letterSpacing: 2, marginBottom: 8, fontFamily: FONT, fontWeight: 700, textTransform: 'uppercase' }}>Result</div>
        <div style={{ fontSize: 86, fontWeight: 900, color: rc, fontFamily: MONO, lineHeight: 1, transition: 'color .15s, opacity .2s', opacity: rolling ? 0.3 : 1, fontVariantNumeric: 'tabular-nums' }}>
          {result ? `${result.roll.toFixed(2)}×` : '—'}
        </div>
        {result && <div style={{ fontSize: 16, fontWeight: 700, color: rc, marginTop: 10, fontFamily: FONT }}>{result.win ? `WIN — rolled ≥ ${result.t}×` : `LOSE — needed ≥ ${result.t}×`}</div>}

        {/* History dots */}
        {hist.length > 0 && (
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
            {hist.slice(0, 18).map((h, i) => (
              <span key={i} style={{ fontSize: 10, color: h.win ? T.green : T.red, background: h.win ? T.green + '16' : T.red + '16', padding: '2px 7px', borderRadius: 4, fontFamily: MONO, fontWeight: 700 }}>{h.roll.toFixed(2)}×</span>
            ))}
          </div>
        )}
      </div>
      {toast && <WinToast win={toast.w} text={toast.t} big={toast.big} onClose={() => setTt(null)} />}
      <div style={PNL}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <BetRow val={bet} set={setBet} disabled={auto} bal={bal} />
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 7, fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Target Multiplier</div>
            <div style={{ position: 'relative', marginBottom: 7 }}>
              <input type="number" value={target} min="1.01" step="0.1" onChange={e => setTarget(e.target.value)} disabled={auto} style={INP} />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: T.teal, fontWeight: 700, pointerEvents: 'none', fontFamily: MONO }}>×</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1.5, 2, 5, 10, 50].map(v => (
                <button key={v} onClick={() => setTarget(String(v))} disabled={auto} style={{ flex: 1, background: parseFloat(target) === v ? T.teal + '22' : T.bg3, border: `1px solid ${parseFloat(target) === v ? T.teal : T.bd}`, color: parseFloat(target) === v ? T.teal : T.muted, fontSize: 10, padding: '5px 0', cursor: 'pointer', fontFamily: MONO, borderRadius: 5, fontWeight: 700 }}>{v}×</button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.muted, marginTop: 6, fontFamily: FONT }}>
              <span>Win: <b style={{ color: T.teal }}>{winChance.toFixed(1)}%</b></span>
              <span>Payout: <b style={{ color: T.green }}>×{pay}</b></span>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
          <Btn label={rolling ? 'Rolling…' : 'Roll'} onClick={go} disabled={rolling || auto || !parseFloat(bet) || parseFloat(bet) > bal} pulse={!rolling && !auto} />
          <Btn label={auto ? 'Stop' : 'Auto'} onClick={() => setAuto(v => !v)} col={auto ? T.red : T.purple} sm />
        </div>
      </div>
    </div>
  );
}

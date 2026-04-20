import { useState, useEffect, useRef, useCallback } from 'react';
import { T, FONT, MONO, PNL, INP, rng, f4, f2, genCrash, multAt, minesMult, mkDeck, handVal, drawCrashGraph, Btn, BetRow, PlayCard, WinToast, HPill, RED_S, RNUMS } from './shared.jsx';
import { GameStyles, Confetti, FloatText, Sparkles } from './effects.jsx';

// ══════════════════════════════════════════════════════════════════════════════
//  CRASH — FLYING BUS with starfield, particles, screen shake
// ══════════════════════════════════════════════════════════════════════════════
const BUS_FRAMES = ['🚌'];

function drawBusScene(canvas, pts, crashed, cashed, mult, stars) {
  if (!canvas) return;
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  // Deep space background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#020816');
  bg.addColorStop(0.6, '#050e22');
  bg.addColorStop(1, '#0a1830');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Stars
  stars.forEach(s => {
    const flicker = 0.5 + 0.5 * Math.sin(Date.now() * s.spd * 0.003 + s.phase);
    ctx.beginPath();
    ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${flicker * 0.6 + 0.1})`;
    ctx.fill();
  });

  if (pts.length < 2) return;

  const maxM = Math.max(...pts.map(p => p.m), 2.5);
  const pad = { l: 44, r: 20, t: 24, b: 16 };
  const tx = i => (i / (pts.length - 1)) * (W - pad.l - pad.r) + pad.l;
  const ty = m => H - pad.b - ((m - 1) / (maxM - 1)) * (H - pad.t - pad.b);

  const col = crashed ? T.red : cashed ? T.green : T.teal;

  // Exhaust particles trail
  if (!crashed && pts.length > 1) {
    const lx = tx(pts.length - 1), ly = ty(pts[pts.length - 1].m);
    for (let i = 0; i < 6; i++) {
      const age = i / 6;
      const ex = lx - age * 28 - Math.random() * 6;
      const ey = ly + 8 + Math.random() * 6;
      const r = 4 - age * 3;
      const g2 = ctx.createRadialGradient(ex, ey, 0, ex, ey, r * 2);
      g2.addColorStop(0, `rgba(255,${120 + i * 20},0,${0.8 - age * 0.6})`);
      g2.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.beginPath(); ctx.arc(ex, ey, r * 2, 0, Math.PI * 2);
      ctx.fillStyle = g2; ctx.fill();
    }
  }

  // Grid lines
  ctx.strokeStyle = 'rgba(0,212,255,0.06)'; ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath(); ctx.moveTo(pad.l, H * i / 4); ctx.lineTo(W, H * i / 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.l + (W - pad.l) * i / 4, 0); ctx.lineTo(pad.l + (W - pad.l) * i / 4, H); ctx.stroke();
  }

  // Y-axis labels
  ctx.fillStyle = 'rgba(0,212,255,0.4)'; ctx.font = `bold 9px ${MONO}`; ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const m = 1 + (maxM - 1) * ((4 - i) / 4);
    ctx.fillText(`${m.toFixed(1)}×`, pad.l - 4, H * i / 4 + 4);
  }
  ctx.textAlign = 'left';

  // Glow fill under curve
  const gfill = ctx.createLinearGradient(0, 0, 0, H);
  gfill.addColorStop(0, col + '44');
  gfill.addColorStop(1, col + '00');
  ctx.beginPath(); ctx.moveTo(tx(0), H);
  pts.forEach((p, i) => ctx.lineTo(tx(i), ty(p.m)));
  ctx.lineTo(tx(pts.length - 1), H); ctx.closePath();
  ctx.fillStyle = gfill; ctx.fill();

  // Main curve
  ctx.beginPath(); ctx.strokeStyle = col; ctx.lineWidth = 3;
  ctx.shadowColor = col; ctx.shadowBlur = 16;
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(tx(i), ty(p.m)) : ctx.lineTo(tx(i), ty(p.m)));
  ctx.stroke(); ctx.shadowBlur = 0;

  // Bus or explosion at tip
  const lx = tx(pts.length - 1), ly = ty(pts[pts.length - 1].m);
  if (crashed) {
    // Explosion
    const exColors = ['#ff4500','#ff8c00','#ffd700','#ff6347','#ff0000'];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const dist = 8 + Math.random() * 18;
      const ex = lx + Math.cos(angle) * dist, ey = ly + Math.sin(angle) * dist;
      ctx.beginPath(); ctx.arc(ex, ey, 2 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fillStyle = exColors[i % exColors.length]; ctx.fill();
    }
    ctx.font = '28px serif'; ctx.textAlign = 'center';
    ctx.fillText('💥', lx, ly + 8);
  } else {
    // Flying bus with tilt based on curve angle
    const angle = pts.length > 3
      ? -Math.atan2(ty(pts[pts.length-1].m) - ty(pts[pts.length-3].m), tx(pts.length-1) - tx(pts.length-3)) * 0.5
      : -0.25;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(angle);
    ctx.font = '26px serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = T.gold; ctx.shadowBlur = 20;
    ctx.fillText('🚌', 0, 6);
    ctx.shadowBlur = 0;
    ctx.restore();
    // Speed lines
    for (let i = 0; i < 4; i++) {
      const sy = ly - 6 + i * 5, len = 10 + Math.random() * 20;
      ctx.beginPath(); ctx.moveTo(lx - 28 - len, sy); ctx.lineTo(lx - 28, sy);
      ctx.strokeStyle = `rgba(255,200,0,${0.3 - i * 0.06})`; ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

export function Crash({ bal, onWin, onLose }) {
  const [st, setSt]      = useState('cd');
  const [cd, setCd]      = useState(5);
  const [mult, setM]     = useState(1);
  const [bet, setBet]    = useState('0.05');
  const [auto, setAuto]  = useState('');
  const [on, setOn]      = useState(false);
  const [cashed, setC]   = useState(false);
  const [coM, setCoM]    = useState(null);
  const [hist, setH]     = useState([8.41,1.23,24,1.55,4.02,2.77,1.01,11.5,3.3,56.2,2.1]);
  const [toast, setTt]   = useState(null);
  const [shake, setShake]= useState(false);
  const [confetti, setConf] = useState(0);

  const cvRef = useRef(null), pts = useRef([]);
  const stR = useRef('cd'), onR = useRef(false), cR = useRef(false);
  const bR = useRef(0.05), aR = useRef(''), cpR = useRef(null);
  const t0 = useRef(null), tv = useRef(null), ctv = useRef(null);
  const animRef = useRef(null);
  const stars = useRef(Array.from({length:80}, () => ({
    x: Math.random(), y: Math.random(), r: Math.random()*1.8+0.3,
    spd: Math.random()*2+0.5, phase: Math.random()*Math.PI*2
  })));

  useEffect(() => { stR.current = st; }, [st]);
  useEffect(() => { onR.current = on; }, [on]);
  useEffect(() => { cR.current = cashed; }, [cashed]);
  useEffect(() => { bR.current = parseFloat(bet)||0; }, [bet]);
  useEffect(() => { aR.current = auto; }, [auto]);

  const doCash = useCallback((m) => {
    if (!onR.current || cR.current) return;
    cR.current = true; setC(true); setCoM(m);
    const profit = parseFloat((bR.current * m - bR.current).toFixed(4));
    onWin(profit);
    setTt({ w:true, t:`Cashed out ×${m.toFixed(2)} · +${f4(profit)} ETH`, big: profit > 0.05 });
    if (profit > 0.05) setConf(c => c+1);
  }, [onWin]);

  const runRound = useCallback(() => {
    const cp = genCrash(); cpR.current = cp; t0.current = Date.now();
    pts.current = []; setSt('fly'); stR.current = 'fly'; setM(1); setShake(false);
    cancelAnimationFrame(animRef.current);
    const loop = () => {
      const ms = Date.now() - t0.current, m = multAt(ms);
      pts.current.push({ m });
      const ac = parseFloat(aR.current);
      if (onR.current && !cR.current && ac >= 1.01 && m >= ac) {
        const sm = parseFloat(m.toFixed(2)); cR.current=true; setC(true); setCoM(sm);
        const p = parseFloat((bR.current*sm - bR.current).toFixed(4));
        onWin(p); setTt({w:true, t:`Auto ×${sm} · +${f4(p)} ETH`, big:p>0.05});
        if (p>0.05) setConf(c=>c+1);
      }
      if (m >= cpR.current) {
        pts.current.push({m: cpR.current});
        drawBusScene(cvRef.current, pts.current, true, cR.current, cpR.current, stars.current);
        setM(cpR.current); setSt('bust'); stR.current='bust';
        if (onR.current && !cR.current) { onLose(bR.current); setTt({w:false, t:`Crashed ×${cpR.current.toFixed(2)} · -${f4(bR.current)} ETH`}); }
        setShake(true); setTimeout(()=>setShake(false),700);
        setOn(false); setH(h=>[cpR.current,...h.slice(0,19)]);
        setTimeout(startCD, 3500);
      } else {
        setM(parseFloat(m.toFixed(2)));
        drawBusScene(cvRef.current, pts.current, false, cR.current, m, stars.current);
        animRef.current = requestAnimationFrame(loop);
      }
    };
    animRef.current = requestAnimationFrame(loop);
  }, [onWin, onLose]);

  const startCD = useCallback(() => {
    setSt('cd'); stR.current='cd'; setOn(false); setC(false); cR.current=false; onR.current=false;
    setCoM(null); setTt(null); pts.current=[];
    cancelAnimationFrame(animRef.current);
    if (cvRef.current) { const ctx=cvRef.current.getContext('2d'); ctx.clearRect(0,0,cvRef.current.width,cvRef.current.height); }
    let n=5; setCd(n); clearInterval(ctv.current);
    ctv.current = setInterval(()=>{ n--; setCd(n); if(n<=0){clearInterval(ctv.current); runRound();} },1000);
  }, [runRound]);

  useEffect(()=>{ startCD(); return()=>{ clearInterval(tv.current); clearInterval(ctv.current); cancelAnimationFrame(animRef.current); }; },[]);

  // Starfield animation during countdown
  useEffect(() => {
    if (st !== 'cd') return;
    const loop = () => {
      if (cvRef.current) {
        const cv=cvRef.current, ctx=cv.getContext('2d');
        ctx.clearRect(0,0,cv.width,cv.height);
        const bg=ctx.createLinearGradient(0,0,0,cv.height);
        bg.addColorStop(0,'#020816'); bg.addColorStop(1,'#0a1830');
        ctx.fillStyle=bg; ctx.fillRect(0,0,cv.width,cv.height);
        stars.current.forEach(s=>{
          const f=0.4+0.4*Math.sin(Date.now()*s.spd*0.003+s.phase);
          ctx.beginPath(); ctx.arc(s.x*cv.width, s.y*cv.height, s.r,0,Math.PI*2);
          ctx.fillStyle=`rgba(255,255,255,${f*0.5+0.1})`; ctx.fill();
        });
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(animRef.current);
  }, [st]);

  useEffect(()=>{
    const fn=e=>{ if(e.code==='Space'&&stR.current==='fly'){e.preventDefault(); doCash(parseFloat((pts.current[pts.current.length-1]||{m:1}).m.toFixed(2)));} };
    window.addEventListener('keydown',fn); return()=>window.removeEventListener('keydown',fn);
  },[doCash]);

  const dc = st==='bust'?T.red : cashed?T.green : st==='fly'?T.teal : T.muted;
  const pnl = on&&!cashed&&st==='fly' ? parseFloat((parseFloat(bet)*mult-parseFloat(bet)).toFixed(4)) : null;

  return (
    <div>
      <GameStyles />
      <div style={{display:'flex',gap:5,overflowX:'auto',marginBottom:10,paddingBottom:2}}>
        {hist.map((h,i)=><HPill key={i} v={h}/>)}
      </div>
      <div style={{
        ...PNL, marginBottom:12, padding:0, overflow:'hidden', position:'relative',
        animation: shake?'crashShake .5s ease-out':'none',
        border:`1px solid ${st==='fly'?T.teal+'44':st==='bust'?T.red+'66':T.bd}`,
        boxShadow: st==='fly'?`0 0 40px ${T.teal}22`:st==='bust'?`0 0 50px ${T.red}44`:'none',
        transition:'border-color .3s, box-shadow .3s',
      }}>
        <Confetti trigger={confetti} big/>
        <canvas ref={cvRef} width={480} height={220} style={{width:'100%',height:220,display:'block'}}/>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
          {st==='cd'&&(
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:11,color:T.teal,fontFamily:FONT,letterSpacing:3,textTransform:'uppercase',marginBottom:4,opacity:.7}}>🚌 Next ride in</div>
              <div style={{fontSize:72,fontWeight:900,color:T.gold,fontFamily:MONO,lineHeight:1,textShadow:`0 0 50px ${T.gold},0 0 100px ${T.gold}66`}}>{cd}</div>
              <div style={{fontSize:11,color:T.muted,fontFamily:FONT,marginTop:4}}>Place your bet now!</div>
            </div>
          )}
          {(st==='fly'||st==='bust')&&(
            <div style={{textAlign:'center'}}>
              <div style={{
                fontSize:72, fontWeight:900, color:dc, fontFamily:MONO, lineHeight:1,
                textShadow:`0 0 40px ${dc},0 0 80px ${dc}55`,
                animation: st==='fly'&&!cashed?'crashPulse .7s ease-in-out infinite':st==='bust'?'crashBust .4s ease-out forwards':'none',
                transition:'color .15s',
                fontVariantNumeric:'tabular-nums',
              }}>{mult.toFixed(2)}×</div>
              {pnl!==null&&<div style={{fontSize:15,color:T.green,fontFamily:MONO,marginTop:4,fontWeight:700,textShadow:`0 0 16px ${T.green}`}}>+{f4(pnl)} ETH</div>}
              {cashed&&coM&&<div style={{fontSize:13,color:T.green,fontFamily:FONT,marginTop:4}}>✓ Cashed ×{coM.toFixed(2)}</div>}
              {st==='bust'&&!cashed&&on&&<div style={{fontSize:18,color:T.red,fontFamily:FONT,fontWeight:800,marginTop:6}}>💥 BUS CRASHED!</div>}
            </div>
          )}
        </div>
      </div>
      {toast&&<WinToast win={toast.w} text={toast.t} big={toast.big} onClose={()=>setTt(null)}/>}
      <div style={PNL}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <BetRow val={bet} set={setBet} disabled={on} bal={bal}/>
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:7,fontFamily:FONT,fontWeight:600,textTransform:'uppercase',letterSpacing:.5}}>Auto Cash-Out</div>
            <div style={{position:'relative'}}>
              <input type="number" placeholder="e.g. 2.00" value={auto} onChange={e=>setAuto(e.target.value)} disabled={on} min="1.01" step=".1" style={{...INP,paddingRight:40}}/>
              <span style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',fontSize:11,color:T.gold,fontWeight:700,pointerEvents:'none',fontFamily:MONO}}>×</span>
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:on?'1fr 1fr':'1fr',gap:8}}>
          {!on&&st!=='fly'&&<Btn label={st==='cd'?`🚌 Ride (in ${cd}s)`:'Waiting…'} onClick={()=>{if(st==='cd'&&!on){onLose(parseFloat(bet)||0);setOn(true);onR.current=true;}}} disabled={!parseFloat(bet)||parseFloat(bet)>bal||on||st==='bust'} pulse={st==='cd'}/>}
          {!on&&st==='fly'&&<Btn label="🚌 Next Bus" onClick={()=>{}} disabled col={T.muted}/>}
          {on&&st==='fly'&&!cashed&&<Btn label={`💰 JUMP OFF ×${mult.toFixed(2)}`} onClick={()=>doCash(parseFloat(mult.toFixed(2)))} col={T.green} pulse/>}
          {on&&<Btn label={cashed?`✓ Off at ×${coM?.toFixed(2)}`:'❌ Cancel'} onClick={()=>{if(!cashed){setOn(false);onR.current=false;}}} col={cashed?T.green:T.red} outline sm/>}
        </div>
        <div style={{marginTop:8,fontSize:10,color:T.muted,fontFamily:FONT,textAlign:'center'}}>Press <kbd style={{background:T.bg3,border:`1px solid ${T.bd}`,borderRadius:3,padding:'0 5px',color:T.text}}>SPACE</kbd> to jump off instantly</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  MINES — Variable grid (3×3 to 8×8), mega diamonds, 3D tiles
// ══════════════════════════════════════════════════════════════════════════════
function Diamond3D({ size = 48, glow = false, color = '#00e8ff' }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" style={{ filter: glow ? `drop-shadow(0 0 ${s/4}px ${color}) drop-shadow(0 0 ${s/2}px ${color}66)` : 'none', transition: 'filter .2s' }}>
      {/* Main diamond body */}
      <polygon points="50,5 95,38 50,95 5,38" fill={color} opacity="0.95"/>
      {/* Left face */}
      <polygon points="50,5 5,38 50,55" fill={color} opacity="0.6"/>
      {/* Right face */}
      <polygon points="50,5 95,38 50,55" fill={color} opacity="0.85"/>
      {/* Bottom */}
      <polygon points="5,38 50,95 50,55" fill={color} opacity="0.5"/>
      <polygon points="95,38 50,95 50,55" fill={color} opacity="0.7"/>
      {/* Top shine */}
      <polygon points="50,5 30,30 50,38 70,30" fill="rgba(255,255,255,0.5)"/>
      {/* Small sparkle */}
      <circle cx="38" cy="22" r="3" fill="rgba(255,255,255,0.8)"/>
    </svg>
  );
}

function Mine3D({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="34" fill="#1a1a2e" stroke="#ff2d55" strokeWidth="3"/>
      <circle cx="50" cy="50" r="22" fill="#ff2d55" opacity="0.9"/>
      {/* Spikes */}
      {[0,45,90,135,180,225,270,315].map((a,i)=>{
        const r=Math.PI*a/180, x1=50+26*Math.cos(r), y1=50+26*Math.sin(r), x2=50+38*Math.cos(r), y2=50+38*Math.sin(r);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ff2d55" strokeWidth="5" strokeLinecap="round"/>;
      })}
      <circle cx="42" cy="42" r="6" fill="rgba(255,255,255,0.6)"/>
    </svg>
  );
}

export function Mines({ bal, onWin, onLose }) {
  const [gridSize, setGridSize] = useState(5); // 3-8
  const N = gridSize * gridSize;
  const [mc, setMc]   = useState(5);
  const [bet, setBet] = useState('0.05');
  const [phase, setP] = useState('bet');
  const [tiles, setT] = useState([]);
  const [mines, setMines] = useState([]);
  const [rev, setRev] = useState(0);
  const [cur, setCur] = useState(1);
  const [toast, setTt] = useState(null);
  const [confetti, setConf] = useState(0);
  const [justRevealed, setJR] = useState(-1);
  const [revealAnim, setRA] = useState(new Set());

  const maxMines = Math.max(1, N - 1);
  const safeMc = Math.min(mc, maxMines);

  const start = () => {
    const a = parseFloat(bet); if (!a || a > bal) return;
    onLose(a);
    const ms = new Set();
    while (ms.size < safeMc) ms.add(rng(0, N - 1));
    setMines([...ms]); setT(Array(N).fill('h')); setRev(0); setCur(1); setP('p'); setTt(null); setJR(-1); setRA(new Set());
  };

  const reveal = (i) => {
    if (phase !== 'p' || tiles[i] !== 'h') return;
    const isMine = mines.includes(i);
    setJR(i);
    setRA(s => new Set([...s, i]));
    setT(prev => { const n=[...prev]; n[i]=isMine?'b':'s'; return n; });
    if (isMine) {
      setTimeout(() => {
        setT(prev => prev.map((t,j) => t!=='h' ? t : mines.includes(j) ? 'b' : t));
      }, 300);
      setP('d');
      setTt({ w:false, t:`💥 Mine! Lost ${f4(parseFloat(bet))} ETH` });
    } else {
      const nr=rev+1, nm=minesMult(nr, N, safeMc);
      setRev(nr); setCur(nm);
      if (nr === N - safeMc) cashout(nm, nr);
    }
  };

  const cashout = (overM, overR) => {
    const m=overM??cur, r=overR??rev;
    if (r===0) return;
    const profit=parseFloat((parseFloat(bet)*m - parseFloat(bet)).toFixed(4));
    onWin(profit);
    setTt({ w:true, t:`💎 ×${m.toFixed(2)} · +${f4(profit)} ETH`, big:m>=5 });
    if (m>=3) setConf(c=>c+1);
    setP('d');
    setTimeout(() => setT(prev => prev.map((t,j) => t!=='h'?t : mines.includes(j)?'b':t)), 200);
  };

  const reset = () => { setP('bet'); setT(Array(N).fill('h')); setMines([]); setRev(0); setCur(1); setTt(null); setJR(-1); setRA(new Set()); };

  const tileSize = gridSize <= 4 ? 72 : gridSize <= 5 ? 60 : gridSize <= 6 ? 50 : gridSize <= 7 ? 44 : 38;
  const diamondSize = Math.floor(tileSize * 0.55);
  const fontSize = gridSize <= 4 ? 28 : gridSize <= 5 ? 22 : gridSize <= 6 ? 18 : 14;

  return (
    <div>
      <GameStyles />
      {toast&&<WinToast win={toast.w} text={toast.t} big={toast.big} onClose={()=>setTt(null)}/>}

      {phase==='p'&&(
        <div style={{...PNL, marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', background:`linear-gradient(90deg, ${T.bg2}, ${T.bg3})`}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:9,color:T.muted,fontFamily:FONT,textTransform:'uppercase',letterSpacing:.5}}>Revealed</div>
            <div style={{fontSize:22,fontWeight:800,color:T.white,fontFamily:MONO}}>{rev}/{N-safeMc}</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:9,color:T.muted,fontFamily:FONT,textTransform:'uppercase',letterSpacing:.5}}>Multiplier</div>
            <div style={{fontSize:32,fontWeight:900,color:T.green,fontFamily:MONO,textShadow:`0 0 24px ${T.green}`}}>{cur.toFixed(2)}×</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:9,color:T.muted,fontFamily:FONT,textTransform:'uppercase',letterSpacing:.5}}>Profit</div>
            <div style={{fontSize:16,fontWeight:700,color:T.green,fontFamily:MONO}}>{f4(parseFloat(bet)*cur - parseFloat(bet))}</div>
          </div>
        </div>
      )}

      <div style={{...PNL, marginBottom:12, position:'relative', padding:'14px 10px'}}>
        <Confetti trigger={confetti} big/>
        <div style={{display:'grid', gridTemplateColumns:`repeat(${gridSize},1fr)`, gap:gridSize<=5?6:4}}>
          {Array.from({length:N},(_,i)=>{
            const t=phase==='bet'?'h':(tiles[i]||'h');
            const isBomb=t==='b', isSafe=t==='s', isHidden=t==='h';
            const isJR=i===justRevealed, wasRevealed=revealAnim.has(i);
            const bg = isBomb
              ? `radial-gradient(circle at 40% 35%, ${T.red}44, ${T.bg})`
              : isSafe
                ? `radial-gradient(circle at 40% 35%, ${T.green}22, ${T.bg2})`
                : phase==='p'&&isHidden
                  ? `linear-gradient(145deg, ${T.bg4} 0%, ${T.bg3} 50%, ${T.bg5} 100%)`
                  : T.bg3;
            return (
              <button key={i} onClick={()=>reveal(i)} disabled={phase!=='p'||!isHidden}
                style={{
                  width:'100%', aspectRatio:'1', borderRadius:gridSize<=5?10:8,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:phase==='p'&&isHidden?'pointer':'default',
                  border:`1px solid ${isBomb?T.red+'88':isSafe?T.green+'66':phase==='p'&&isHidden?T.bdHi:T.bd}`,
                  background: bg,
                  boxShadow: isBomb?`0 0 24px ${T.red}77`:isSafe?`0 0 20px ${T.green}55`:phase==='p'&&isHidden?`inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 8px rgba(0,0,0,0.4)`:'none',
                  animation: isSafe&&isJR?'gemPop .4s cubic-bezier(.17,.67,.41,1.5) forwards':isBomb&&isJR?'bombPop .3s ease-out forwards':'none',
                  transition:'border-color .15s, box-shadow .15s, transform .1s',
                  transform: phase==='p'&&isHidden?'':'scale(1)',
                  outline:'none', padding:0,
                }}>
                {isBomb && <Mine3D size={fontSize+8}/>}
                {isSafe && <Diamond3D size={diamondSize} glow={isJR} color={T.teal}/>}
                {isHidden&&phase==='p'&&<span style={{fontSize:fontSize,color:T.muted,opacity:.4,userSelect:'none'}}>◆</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div style={PNL}>
        {phase==='bet'&&(
          <>
            {/* Grid size control */}
            <div style={{marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.muted,marginBottom:8,fontFamily:FONT,fontWeight:600,textTransform:'uppercase',letterSpacing:.5}}>
                <span>Grid Size</span>
                <span style={{color:T.teal}}>{gridSize}×{gridSize} = {N} tiles</span>
              </div>
              <div style={{display:'flex',gap:5}}>
                {[3,4,5,6,7,8].map(g=>(
                  <button key={g} onClick={()=>{setGridSize(g);setMc(c=>Math.min(c,g*g-1));}} style={{flex:1,padding:'8px 0',borderRadius:7,border:`1px solid ${gridSize===g?T.purple:T.bd}`,background:gridSize===g?T.purple+'1a':T.bg3,color:gridSize===g?T.purple:T.muted,fontSize:12,fontWeight:700,fontFamily:MONO,cursor:'pointer',transition:'all .15s',boxShadow:gridSize===g?`0 0 10px ${T.purple}33`:'none'}}>{g}×{g}</button>
                ))}
              </div>
            </div>
            {/* Mine count */}
            <div style={{marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.muted,marginBottom:10,fontFamily:FONT,fontWeight:600}}>
                <span>Mines: <b style={{color:T.red}}>{safeMc}</b></span>
                <span>Safe: <b style={{color:T.green}}>{N-safeMc}</b></span>
                <span>1st hit: <b style={{color:T.teal}}>×{minesMult(1,N,safeMc).toFixed(2)}</b></span>
              </div>
              <input type="range" min="1" max={maxMines} value={safeMc} onChange={e=>setMc(+e.target.value)} style={{width:'100%',accentColor:T.red,cursor:'pointer',height:4}}/>
            </div>
            <BetRow val={bet} set={setBet} bal={bal}/>
            <div style={{marginTop:14}}><Btn label={`💣 Place Bet (${safeMc} mines on ${gridSize}×${gridSize})`} onClick={start} disabled={!parseFloat(bet)||parseFloat(bet)>bal} pulse/></div>
          </>
        )}
        {phase==='p'&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <Btn label={rev>0?`💰 Cash Out ×${cur.toFixed(2)}`:'Reveal a tile first'} onClick={()=>cashout()} disabled={rev===0} col={T.green} pulse={rev>0}/>
            <Btn label="Give Up" onClick={reset} col={T.red} outline sm/>
          </div>
        )}
        {phase==='d'&&<Btn label="Play Again" onClick={reset}/>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  PLINKO — Full canvas physics with glowing ball and trail
// ══════════════════════════════════════════════════════════════════════════════
const PB = { low:[0.5,1,1.5,2,3,2,1.5,1,0.5], medium:[0.3,0.5,1,2,5,2,1,0.5,0.3], high:[0.2,0.3,0.5,1,10,1,0.5,0.3,0.2] };

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
  const bkts=PB[risk], COLS=bkts.length, CW=36, CH=34, ROWS=8;

  const go = useCallback(async()=>{
    const a=parseFloat(bet); if(!a||a>bal||drop) return;
    setDrop(true); setLand(null); setTt(null); setPath([]); setStep(-1); setHitPeg(null);
    let col=Math.floor(COLS/2), pts=[];
    for(let r=0;r<ROWS;r++){col=Math.max(0,Math.min(COLS-1,col+(Math.random()<.5?-1:1))); pts.push({row:r,col});}
    setPath(pts);
    for(let i=0;i<pts.length;i++){
      setStep(i); setHitPeg(`${pts[i].row}-${pts[i].col}`);
      await new Promise(r=>setTimeout(r,155));
      setHitPeg(null);
    }
    const bkt=pts[pts.length-1].col, m=bkts[bkt], profit=parseFloat((a*m-a).toFixed(4));
    setLand(bkt); setHist(h=>[{m,w:m>1},...h.slice(0,19)]);
    setTt({w:m>1, t:m>1?`×${m} Win! +${f4(profit)} ETH`:`×${m} · -${f4(a)} ETH`, big:m>=5});
    if(profit>0) onWin(profit); else if(profit<0) onLose(a*(1-m));
    if(m>=3) setConf(c=>c+1);
    setDrop(false);
  },[bet,bal,drop,bkts,onWin,onLose]);

  const bp=step>=0&&step<path.length?path[step]:null;
  const trail=path.slice(Math.max(0,step-4),step);

  return (
    <div>
      <GameStyles/>
      {hist.length>0&&<div style={{display:'flex',gap:5,overflowX:'auto',marginBottom:12,paddingBottom:2}}>{hist.map((h,i)=>{const c=h.m<1?T.red:h.m<2?T.gold:T.green;return <span key={i} style={{background:c+'1a',color:c,border:`1px solid ${c}22`,borderRadius:6,padding:'3px 10px',fontSize:12,fontWeight:700,flexShrink:0,fontFamily:MONO}}>×{h.m}</span>;})}</div>}
      {toast&&<WinToast win={toast.w} text={toast.t} big={toast.big} onClose={()=>setTt(null)}/>}
      <div style={{...PNL,marginBottom:12,padding:'18px 10px',display:'flex',flexDirection:'column',alignItems:'center',position:'relative',background:`radial-gradient(ellipse at top,${T.bg3},${T.bg})`}}>
        <Confetti trigger={confetti} big/>
        <div style={{position:'relative',width:COLS*CW,height:(ROWS+2)*CH,flexShrink:0}}>
          {Array.from({length:ROWS},(_,row)=>{
            const cnt=row%2===0?COLS-1:COLS, off=row%2===0?CW/2:0;
            return Array.from({length:cnt},(_,col)=>{
              const key=`${row}-${col}`, isHit=hitPeg===key;
              return <div key={key} style={{position:'absolute',left:col*CW+off+CW/2-7,top:row*CH+CH/2-7,width:14,height:14,borderRadius:'50%',background:isHit?'#fff':T.bg4,border:`2px solid ${isHit?T.teal:T.bdHi}`,boxShadow:isHit?`0 0 20px ${T.teal},0 0 40px ${T.teal}66`:'inset 0 1px 0 rgba(255,255,255,.1)',transition:'all .06s','--pc':T.bg4}}/>;
            });
          })}
          {/* Trail */}
          {trail.map((p,i)=><div key={`t${i}`} style={{position:'absolute',left:p.col*CW+CW/2-5,top:p.row*CH+CH/2-5,width:10,height:10,borderRadius:'50%',background:T.teal,opacity:(i+1)*0.12,pointerEvents:'none'}}/>)}
          {/* Ball */}
          {bp&&<div style={{position:'absolute',left:bp.col*CW+CW/2-12,top:bp.row*CH+CH/2-12,width:24,height:24,borderRadius:'50%',background:`radial-gradient(circle at 35% 35%,#fff,${T.teal})`,boxShadow:`0 0 28px ${T.teal},0 0 56px ${T.teal}66,0 4px 10px rgba(0,0,0,.6)`,transition:'all .15s cubic-bezier(.4,0,.2,1)',zIndex:10}}/>}
          {/* Buckets */}
          <div style={{position:'absolute',bottom:0,left:0,width:'100%',display:'flex',gap:3}}>
            {bkts.map((m,i)=>{
              const il=land===i, bc=m<1?T.red:m<2?T.gold:m<5?T.green:T.teal;
              return <div key={i} style={{flex:1,padding:'6px 2px',textAlign:'center',borderRadius:6,background:il?bc+'2a':T.bg3,border:`1px solid ${il?bc:T.bd}`,transition:'all .25s',boxShadow:il?`0 0 24px ${bc}99,inset 0 0 14px ${bc}22`:'none',animation:il?'bigWinEntry .3s ease-out':'none'}}>
                <div style={{fontSize:9,fontWeight:800,color:il?bc:T.muted,fontFamily:MONO,textShadow:il?`0 0 10px ${bc}`:'none'}}>{m}×</div>
              </div>;
            })}
          </div>
        </div>
      </div>
      <div style={PNL}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
          <BetRow val={bet} set={setBet} disabled={drop} bal={bal}/>
          <div>
            <div style={{fontSize:10,color:T.muted,marginBottom:7,fontFamily:FONT,fontWeight:600,textTransform:'uppercase',letterSpacing:.5}}>Risk</div>
            <div style={{display:'flex',gap:5}}>
              {['low','medium','high'].map(r=>{const rc=r==='low'?T.green:r==='medium'?T.gold:T.red; return <button key={r} onClick={()=>setRisk(r)} disabled={drop} style={{flex:1,background:risk===r?rc+'22':T.bg3,border:`1px solid ${risk===r?rc:T.bd}`,color:risk===r?rc:T.muted,borderRadius:7,padding:'10px 4px',fontSize:11,fontWeight:600,cursor:drop?'not-allowed':'pointer',fontFamily:FONT,transition:'all .15s',textTransform:'capitalize',boxShadow:risk===r?`0 0 14px ${rc}55`:'none'}}>{r}</button>;})}
            </div>
          </div>
        </div>
        <Btn label={drop?'🎱 Dropping…':'🎱 Drop Ball'} onClick={go} disabled={drop||!parseFloat(bet)||parseFloat(bet)>bal} pulse={!drop}/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  DICE — 3D SVG die, animated roll, streak tracker
// ══════════════════════════════════════════════════════════════════════════════
function Die3D({ value, rolling, color }) {
  const DOTS = {
    1:[[50,50]], 2:[[25,25],[75,75]], 3:[[25,25],[50,50],[75,75]],
    4:[[25,25],[75,25],[25,75],[75,75]], 5:[[25,25],[75,25],[50,50],[25,75],[75,75]],
    6:[[25,20],[75,20],[25,50],[75,50],[25,80],[75,80]]
  };
  const dots = DOTS[value]||DOTS[1];
  const c = color || T.white;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" style={{filter:`drop-shadow(0 4px 20px ${c}44)`,animation:rolling?'diceRoll .3s ease-in-out infinite':'diceLand .3s ease-out',transition:'filter .3s'}}>
      {/* 3D cube faces */}
      <rect x="8" y="14" width="72" height="72" rx="14" fill={T.bg3} stroke={c} strokeWidth="2"/>
      {/* Top face highlight */}
      <rect x="8" y="14" width="72" height="72" rx="14" fill={`url(#diceGrad)`} opacity="0.3"/>
      <defs>
        <linearGradient id="diceGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="black" stopOpacity="0.2"/>
        </linearGradient>
      </defs>
      {/* Dots */}
      {dots.map(([dx,dy],i)=><circle key={i} cx={dx} cy={dy} r="7" fill={c} opacity={rolling?0.4:1} style={{transition:'opacity .1s'}}/>)}
      {/* Shine */}
      <ellipse cx="28" cy="26" rx="10" ry="6" fill="rgba(255,255,255,0.15)" transform="rotate(-20,28,26)"/>
    </svg>
  );
}

export function Dice({ bal, onWin, onLose }) {
  const [bet, setBet]   = useState('0.05');
  const [tgt, setTgt]   = useState(50);
  const [mode, setMode] = useState('under');
  const [rolling, setR] = useState(false);
  const [diceVal, setDV]= useState(null);
  const [res, setRes]   = useState(null);
  const [hist, setH]    = useState([]);
  const [auto, setAuto] = useState(false);
  const [toast, setTt]  = useState(null);
  const [confetti, setConf] = useState(0);
  const [streak, setStreak] = useState(0);
  const autoRef = useRef(false);
  const wc = mode==='under'?tgt/100:(100-tgt)/100;
  const pay = parseFloat((0.97/wc).toFixed(2));

  const go = useCallback(async()=>{
    const a=parseFloat(bet); if(!a||a>bal) return;
    setR(true); setRes(null); setTt(null);
    // Roll animation
    for(let i=0;i<10;i++){
      await new Promise(r=>setTimeout(r,55));
      setDV(Math.floor(Math.random()*6)+1);
    }
    const roll=Math.floor(Math.random()*100);
    const win=mode==='under'?roll<tgt:roll>tgt;
    const faceVal=Math.max(1,Math.min(6,Math.round(roll/100*6)+1));
    setDV(faceVal);
    const profit=win?parseFloat((a*(pay-1)).toFixed(4)):-a;
    setRes({r:roll,win}); setH(h=>[{r:roll,win},...h.slice(0,13)]);
    setTt({w:win, t:win?`Rolled ${roll} · +${f4(profit)} ETH`:`Rolled ${roll} · -${f4(a)} ETH`, big:pay>=10&&win});
    if(win){onWin(profit); setStreak(s=>s+1); if(pay>=5)setConf(c=>c+1);} else{onLose(a); setStreak(0);}
    setR(false);
    if(autoRef.current) setTimeout(go,600);
  },[bet,bal,tgt,mode,pay,onWin,onLose]);

  useEffect(()=>{ autoRef.current=auto; if(auto)go(); return()=>{autoRef.current=false;};},[auto]);

  const rc=res?(res.win?T.green:T.red):T.muted;

  return (
    <div>
      <GameStyles/>
      <div style={{...PNL,marginBottom:12,textAlign:'center',padding:'24px 20px',background:`radial-gradient(ellipse at 50% 0%,${T.bg3},${T.bg})`,position:'relative'}}>
        <Confetti trigger={confetti} big/>
        <div style={{display:'flex',justifyContent:'center',marginBottom:8}}>
          <Die3D value={diceVal||1} rolling={rolling} color={rc}/>
        </div>
        <div style={{fontSize:56,fontWeight:900,color:rc,fontFamily:MONO,lineHeight:1,textShadow:rolling?'none':`0 0 30px ${rc}`,transition:'color .15s, text-shadow .2s',filter:rolling?'blur(3px)':'none',fontVariantNumeric:'tabular-nums'}}>
          {res!=null?res.r:rolling?(Math.floor(Math.random()*100)):'—'}
        </div>
        {res&&<div style={{fontSize:17,fontWeight:800,color:rc,marginTop:8,fontFamily:FONT,animation:'bigWinEntry .3s ease-out'}}>{res.win?`WIN ×${pay}`:'LOSE'}</div>}
        {streak>=3&&<div style={{marginTop:6,fontSize:12,color:T.gold,fontFamily:FONT,fontWeight:700}}>🔥 {streak} win streak!</div>}
        {/* Bar */}
        <div style={{margin:'16px auto 0',maxWidth:360,height:10,borderRadius:50,background:T.bg3,overflow:'hidden',position:'relative',border:`1px solid ${T.bd}`}}>
          <div style={{position:'absolute',left:0,height:'100%',width:`${mode==='under'?tgt:100-tgt}%`,background:`linear-gradient(90deg,${T.green},${T.green}88)`,borderRadius:50}}/>
          <div style={{position:'absolute',left:mode==='under'?`${tgt}%`:0,height:'100%',width:`${mode==='under'?100-tgt:tgt}%`,background:`linear-gradient(90deg,${T.red}88,${T.red})`,borderRadius:50}}/>
          {res&&<div style={{position:'absolute',top:'50%',left:`${res.r}%`,transform:'translate(-50%,-50%)',width:18,height:18,borderRadius:'50%',background:res.win?T.green:T.red,border:'2px solid #fff',zIndex:2,boxShadow:`0 0 14px ${res.win?T.green:T.red}`,animation:'diceLand .3s ease-out'}}/>}
        </div>
        {hist.length>0&&<div style={{display:'flex',gap:4,marginTop:14,justifyContent:'center',flexWrap:'wrap'}}>
          {hist.slice(0,14).map((h,i)=><span key={i} style={{fontSize:11,color:h.win?T.green:T.red,background:h.win?T.green+'16':T.red+'16',padding:'2px 8px',borderRadius:5,fontFamily:MONO,fontWeight:700,border:`1px solid ${h.win?T.green+'33':T.red+'33'}`}}>{h.r}</span>)}
        </div>}
      </div>
      {toast&&<WinToast win={toast.w} text={toast.t} big={toast.big} onClose={()=>setTt(null)}/>}
      <div style={PNL}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
          <Btn label={`Under ${tgt}`} onClick={()=>{setMode('under');setAuto(false);}} col={mode==='under'?T.teal:undefined} outline={mode!=='under'} sm/>
          <Btn label={`Over ${tgt}`} onClick={()=>{setMode('over');setAuto(false);}} col={mode==='over'?T.teal:undefined} outline={mode!=='over'} sm/>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.muted,marginBottom:9,fontFamily:FONT,fontWeight:600}}>
            <span>Target: <b style={{color:T.white}}>{tgt}</b></span>
            <span>Win Chance: <b style={{color:T.teal}}>{(wc*100).toFixed(0)}%</b></span>
            <span>Payout: <b style={{color:T.green,fontSize:14}}>×{pay}</b></span>
          </div>
          <input type="range" min="5" max="95" value={tgt} onChange={e=>{setTgt(+e.target.value);setAuto(false);}} style={{width:'100%',accentColor:T.teal,cursor:'pointer'}}/>
        </div>
        <BetRow val={bet} set={v=>{setBet(v);setAuto(false);}} disabled={auto} bal={bal}/>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:8,marginTop:14}}>
          <Btn label={rolling?'🎲 Rolling…':'🎲 Roll'} onClick={go} disabled={rolling||auto||!parseFloat(bet)||parseFloat(bet)>bal} pulse={!rolling&&!auto}/>
          <Btn label={auto?'⏹ Stop':'⚡ Auto'} onClick={()=>setAuto(v=>!v)} col={auto?T.red:T.purple} sm/>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  BLACKJACK — Animated card deals, split support visual, pro table
// ══════════════════════════════════════════════════════════════════════════════
export function Blackjack({ bal, onWin, onLose }) {
  const [phase,setP]=useState('bet');
  const [bet,setBet]=useState('0.05');
  const [pH,setPH]=useState([]);
  const [dH,setDH]=useState([]);
  const [dk,setDk]=useState([]);
  const [res,setRes]=useState(null);
  const [toast,setTt]=useState(null);
  const [confetti,setConf]=useState(0);
  const [dealAnim,setDA]=useState(0);

  const reset=()=>{setPH([]);setDH([]);setRes(null);setTt(null);setP('bet');setDA(0);};
  const deal=()=>{
    const a=parseFloat(bet); if(!a||a>bal) return;
    setDA(d=>d+1);
    const d=mkDeck(),p=[d[0],d[2]],de=[d[1],d[3]],rest=d.slice(4);
    setDk(rest);setPH(p);setDH(de);setRes(null);setTt(null);
    if(handVal(p)===21) fin(p,de,rest,true); else setP('play');
  };
  const fin=(p,de,dkk,bj=false)=>{
    let d=[...de],rem=[...(dkk||dk)];
    while(handVal(d)<17) d.push(rem.shift());
    setDH(d);setDk(rem);
    const ps=handVal(p),ds=handVal(d),a=parseFloat(bet);
    const r=ps>21?'bust':bj&&p.length===2?'bj':ds>21||ps>ds?'win':ps===ds?'push':'lose';
    const pf={win:a,bj:a*1.5,push:0,lose:-a,bust:-a}[r];
    setRes(r);setP('done');
    if(pf>0){onWin(pf);if(r==='bj')setConf(c=>c+1);}else if(pf<0)onLose(Math.abs(pf));
    setTt({w:pf>=0,t:`${{win:'You Win 🏆',bj:'BLACKJACK! 🎉',push:'Push 🤝',lose:'Dealer Wins',bust:'Bust! 💥'}[r]} · ${pf>=0?'+':''}${f4(pf)} ETH`,big:r==='bj'});
  };
  const hit=()=>{const np=[...pH,dk[0]],nd=dk.slice(1);setPH(np);setDk(nd);if(handVal(np)>=21)fin(np,dH,nd);};
  const stand=()=>fin(pH,dH);
  const dbl=()=>{if(pH.length!==2||parseFloat(bet)*2>bal)return;setBet(b=>String(parseFloat((parseFloat(b)*2).toFixed(4))));const np=[...pH,dk[0]],nd=dk.slice(1);setPH(np);setDk(nd);fin(np,dH,nd);};

  const RC={win:T.green,bj:T.gold,push:T.teal,lose:T.red,bust:T.red};
  const RL={win:'🏆 YOU WIN',bj:'🃏 BLACKJACK!',push:'🤝 PUSH',lose:'❌ DEALER WINS',bust:'💥 BUST'};
  const pv=handVal(pH),dv=handVal(dH);

  return (
    <div>
      <GameStyles/>
      {/* Dealer */}
      <div style={{...PNL,marginBottom:8,background:`linear-gradient(160deg,${T.bg2},${T.bg})`,position:'relative',borderBottom:`2px solid ${T.bd}`}}>
        <Confetti trigger={confetti} big/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <span style={{fontSize:11,color:T.muted,fontFamily:FONT,fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>🤖 Dealer{phase==='done'?` · ${dv} pts${dv>21?' (Bust)':''}`:''}</span>
          {dv===21&&phase==='done'&&<span style={{color:T.gold,fontSize:12,fontWeight:800}}>21 🔥</span>}
        </div>
        <div style={{display:'flex',gap:9,flexWrap:'wrap',minHeight:92}}>
          {dH.map((c,i)=>(
            <div key={i} style={{animation:`tileFlip .2s ease-out ${i*0.1}s both`}}>
              <PlayCard card={c} hidden={phase==='play'&&i===1}/>
            </div>
          ))}
          {!dH.length&&<div style={{color:T.muted,fontSize:13,fontFamily:FONT,alignSelf:'center',opacity:.5}}>Waiting…</div>}
        </div>
      </div>
      {/* Player */}
      <div style={{...PNL,marginBottom:10,background:`linear-gradient(160deg,${T.bg},${T.bg2})`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <span style={{fontSize:11,color:T.muted,fontFamily:FONT,fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>👤 You{phase!=='bet'?` · ${pv} pts${pv===21?' 🔥':''}${pv>21?' (Bust)':''}`:''}</span>
        </div>
        <div style={{display:'flex',gap:9,flexWrap:'wrap',minHeight:92}}>
          {pH.map((c,i)=>(
            <div key={`${i}-${dealAnim}`} style={{animation:`tileFlip .2s ease-out ${i*0.12}s both`}}>
              <PlayCard card={c}/>
            </div>
          ))}
          {!pH.length&&<div style={{color:T.muted,fontSize:13,fontFamily:FONT,alignSelf:'center',opacity:.5}}>Place your bet</div>}
        </div>
      </div>
      {res&&<div style={{background:RC[res]+'1a',border:`1px solid ${RC[res]}44`,borderRadius:12,padding:'16px',textAlign:'center',marginBottom:10,color:RC[res],fontSize:26,fontWeight:900,fontFamily:FONT,letterSpacing:1,boxShadow:`0 0 40px ${RC[res]}33`,animation:'bigWinEntry .4s cubic-bezier(.17,.67,.41,1.3)'}}>{RL[res]}</div>}
      {toast&&<WinToast win={toast.w} text={toast.t} big={toast.big} onClose={()=>setTt(null)}/>}
      <div style={PNL}>
        {phase==='bet'&&<><BetRow val={bet} set={setBet} bal={bal}/><div style={{marginTop:14}}><Btn label="🃏 Deal Cards" onClick={deal} disabled={!parseFloat(bet)||parseFloat(bet)>bal} pulse/></div></>}
        {phase==='play'&&<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          <Btn label="Hit" onClick={hit} col={T.teal}/>
          <Btn label="Stand" onClick={stand} col={T.green}/>
          <Btn label="Double" onClick={dbl} col={T.purple} disabled={pH.length!==2||parseFloat(bet)*2>bal}/>
        </div>}
        {phase==='done'&&<Btn label="New Hand" onClick={reset}/>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  ROULETTE — Detailed SVG wheel with number segments
// ══════════════════════════════════════════════════════════════════════════════
const WHEEL_NUMS = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];

export function Roulette({ bal, onWin, onLose }) {
  const [bet,setBet]=useState('0.05');
  const [bt,setBt]=useState('red');
  const [np,setNp]=useState('');
  const [sp,setSp]=useState(false);
  const [res,setRes]=useState(null);
  const [hist,setHist]=useState([]);
  const [spinDeg,setSpinDeg]=useState(0);
  const [toast,setTt]=useState(null);
  const [confetti,setConf]=useState(0);
  const BTS=[{k:'red',l:'Red',c:'#e53935',o:'2×'},{k:'black',l:'Black',c:'#546e7a',o:'2×'},{k:'green',l:'Zero',c:T.green,o:'14×'},{k:'odd',l:'Odd',c:T.teal,o:'2×'},{k:'even',l:'Even',c:T.teal,o:'2×'},{k:'1-18',l:'1–18',c:'#2979ff',o:'2×'},{k:'19-36',l:'19–36',c:'#2979ff',o:'2×'},{k:'number',l:'Exact #',c:T.purple,o:'36×'}];

  const go=()=>{
    const a=parseFloat(bet); if(!a||a>bal||sp) return;
    setSp(true); setRes(null); setTt(null);
    setSpinDeg(d=>d+360*12+rng(0,359));
    setTimeout(()=>{
      const n=rng(0,36),isR=RNUMS.has(n),isG=n===0,isB=!isR&&!isG,isO=n%2!==0&&n!==0,isE=n%2===0&&n!==0;
      const pm={red:isR?2:0,black:isB?2:0,green:isG?14:0,odd:isO?2:0,even:isE?2:0,'1-18':(n>=1&&n<=18)?2:0,'19-36':(n>=19&&n<=36)?2:0,number:String(n)===np?36:0};
      const m=pm[bt]||0,win=m>0,profit=win?a*(m-1):-a;
      setRes({n,isR,isG});setHist(h=>[{n,isR,isG},...h.slice(0,11)]);
      setTt({w:win,t:win?`Win ×${m} · +${f4(profit)} ETH`:`No win — ${n}`,big:m>=14});
      if(win){onWin(a*(m-1));if(m>=5)setConf(c=>c+1);}else onLose(a);
      setSp(false);
    },4500);
  };

  const nc=n=>n===0?T.green:RNUMS.has(n)?'#e53935':'#e8e8e8';
  const WN=WHEEL_NUMS;
  const sliceDeg=360/WN.length;

  return (
    <div>
      <GameStyles/>
      <div style={{...PNL,marginBottom:12,display:'flex',flexDirection:'column',alignItems:'center',padding:'24px 16px',position:'relative',background:`radial-gradient(circle at 50% 30%,${T.bg3},${T.bg})`}}>
        <Confetti trigger={confetti} big/>
        <div style={{position:'relative',width:220,height:220,marginBottom:14}}>
          {/* Outer decorative ring */}
          <div style={{position:'absolute',inset:-6,borderRadius:'50%',background:`conic-gradient(${T.gold}44,${T.gold}11,${T.gold}44,${T.gold}11,${T.gold}44)`,animation:sp?'wheelGlow 1s ease-in-out infinite':'none'}}/>
          {/* SVG Wheel */}
          <svg width={220} height={220} style={{position:'relative',zIndex:1,transform:`rotate(${spinDeg}deg)`,transition:sp?'transform 4.5s cubic-bezier(0.08,0.6,0.06,1)':'none',filter:sp?`drop-shadow(0 0 16px ${T.gold}66)`:'none'}}>
            {WN.map((num,i)=>{
              const startA=(i*sliceDeg-90)*Math.PI/180;
              const endA=((i+1)*sliceDeg-90)*Math.PI/180;
              const r=105,cx=110,cy=110;
              const x1=cx+r*Math.cos(startA),y1=cy+r*Math.sin(startA);
              const x2=cx+r*Math.cos(endA),y2=cy+r*Math.sin(endA);
              const mx=cx+(r*0.72)*Math.cos((startA+endA)/2);
              const my=cy+(r*0.72)*Math.sin((startA+endA)/2);
              const fc=nc(num);
              return (
                <g key={i}>
                  <path d={`M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 0,1 ${x2},${y2} Z`} fill={fc} stroke={T.bg} strokeWidth={1.5} opacity={num===0?1:0.92}/>
                  <text x={mx} y={my} textAnchor="middle" dominantBaseline="middle" fill={num===0?T.bg:'rgba(255,255,255,0.9)'} fontSize={9} fontWeight="800" fontFamily={MONO} style={{pointerEvents:'none'}}>{num}</text>
                </g>
              );
            })}
            {/* Center */}
            <circle cx={110} cy={110} r={20} fill={T.bg} stroke={T.bd} strokeWidth={3}/>
            <circle cx={110} cy={110} r={10} fill={T.gold}/>
          </svg>
          {/* Number display */}
          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:5,textAlign:'center',pointerEvents:'none'}}>
            {res&&!sp&&<div style={{fontSize:22,fontWeight:900,fontFamily:MONO,color:nc(res.n),textShadow:`0 0 20px ${nc(res.n)}`,animation:'roulettePop .4s cubic-bezier(.17,.67,.41,1.3)'}}>{res.n}</div>}
          </div>
          {/* Pointer */}
          <div style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',fontSize:28,zIndex:10,color:T.gold,filter:`drop-shadow(0 0 14px ${T.gold})`}}>▼</div>
        </div>
        {hist.length>0&&<div style={{display:'flex',gap:5,flexWrap:'wrap',justifyContent:'center'}}>
          {hist.map((h,i)=><div key={i} style={{width:32,height:32,borderRadius:'50%',background:h.isG?T.green+'22':h.isR?'#e5393522':'#546e7a22',color:h.isG?T.green:h.isR?'#e53935':'#90a4ae',border:`1px solid ${h.isG?T.green+'55':h.isR?'#e5393555':'#546e7a55'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,fontFamily:MONO,boxShadow:i===0?`0 0 10px ${h.isG?T.green:h.isR?'#e53935':'#546e7a'}`:'none'}}>{h.n}</div>)}
        </div>}
      </div>
      {toast&&<WinToast win={toast.w} text={toast.t} big={toast.big} onClose={()=>setTt(null)}/>}
      <div style={PNL}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:14}}>
          {BTS.map(({k,l,c,o})=><button key={k} onClick={()=>setBt(k)} style={{background:bt===k?c+'22':T.bg3,border:`1px solid ${bt===k?c:T.bd}`,color:bt===k?c:T.muted,borderRadius:8,padding:'9px 4px',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:FONT,transition:'all .15s',boxShadow:bt===k?`0 0 14px ${c}55`:'none'}}><div>{l}</div><div style={{fontSize:9,opacity:.7,marginTop:2}}>{o}</div></button>)}
        </div>
        {bt==='number'&&<div style={{marginBottom:14}}><input type="number" min="0" max="36" placeholder="0–36" value={np} onChange={e=>setNp(e.target.value)} style={{...INP,padding:'11px 14px'}}/></div>}
        <BetRow val={bet} set={setBet} disabled={sp} bal={bal}/>
        <div style={{marginTop:14}}><Btn label={sp?'🎡 Spinning…':'🎡 Spin'} onClick={go} disabled={sp||!parseFloat(bet)||parseFloat(bet)>bal} pulse={!sp}/></div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  SLOTS — Bigger reels, jackpot lights, better animations
// ══════════════════════════════════════════════════════════════════════════════
const SYM=['7️⃣','💎','👑','⭐','🔔','🍒','🍋','🍊'];
const SPAY={'7️⃣':100,'💎':50,'👑':25,'⭐':15,'🔔':8,'🍒':4,'🍋':3,'🍊':2};

export function Slots({ bal, onWin, onLose }) {
  const [bet,setBet]=useState('0.05');
  const [spin,setSpin]=useState(false);
  const [reels,setReels]=useState([[0,1,2],[3,4,5],[6,7,0]]);
  const [spinning,setSpinning]=useState([false,false,false]);
  const [res,setRes]=useState(null);
  const [toast,setTt]=useState(null);
  const [confetti,setConf]=useState(0);
  const [lights,setLights]=useState(false);
  const [spinCount,setSpinCount]=useState(0);

  const go=useCallback(async()=>{
    const a=parseFloat(bet); if(!a||a>bal||spin) return;
    setSpin(true); setRes(null); setTt(null); setLights(false);
    const sc=spinCount+1; setSpinCount(sc);
    const finals=[rng(0,7),rng(0,7),rng(0,7)];
    // Spin each reel with cascading delay
    for(let r=0;r<3;r++){
      setSpinning(p=>{const n=[...p];n[r]=true;return n;});
      await new Promise(resolve=>setTimeout(resolve,700+r*350));
      setReels(prev=>{const n=prev.map(c=>[...c]);n[r]=[(finals[r]+7)%8,finals[r],(finals[r]+1)%8];return n;});
      setSpinning(p=>{const n=[...p];n[r]=false;return n;});
      await new Promise(resolve=>setTimeout(resolve,180));
    }
    const s0=SYM[finals[0]],s1=SYM[finals[1]],s2=SYM[finals[2]];
    let mult=0,label='';
    if(s0===s1&&s1===s2){mult=SPAY[s0]||2;label=`🎰 ${s0}${s0}${s0} JACKPOT!`;}
    else if(s0===s1){mult=parseFloat(((SPAY[s0]||2)*0.18).toFixed(2));label=`Pair ${s0}${s0}`;}
    else if(s1===s2){mult=parseFloat(((SPAY[s1]||2)*0.18).toFixed(2));label=`Pair ${s1}${s1}`;}
    const win=mult>0,profit=win?parseFloat((a*mult).toFixed(4)):-a;
    setRes({win,mult,label,triple:s0===s1&&s1===s2});
    setTt({w:win,t:win?`${label} · +${f4(profit)} ETH`:`No match · -${f4(a)} ETH`,big:mult>=10});
    if(win){onWin(profit);if(mult>=5){setConf(c=>c+1);setLights(true);}}else onLose(a);
    setSpin(false);
  },[bet,bal,spin,spinCount,onWin,onLose]);

  return (
    <div>
      <GameStyles/>
      {toast&&<WinToast win={toast.w} text={toast.t} big={toast.big} onClose={()=>setTt(null)}/>}
      <div style={{...PNL,marginBottom:12,padding:'20px 16px',position:'relative',
        border:`1px solid ${res?.triple?T.gold:lights?T.green:T.bd}`,
        boxShadow:res?.triple?`0 0 50px ${T.gold}66`:lights?`0 0 30px ${T.green}44`:'none',
        background:`linear-gradient(180deg,${T.bg3} 0%,${T.bg} 60%)`,
        transition:'all .4s'}}>
        <Confetti trigger={confetti} big/>
        {/* Jackpot lights strip */}
        <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:14}}>
          {Array.from({length:12},(_,i)=>(
            <div key={i} style={{width:8,height:8,borderRadius:'50%',background:lights?[T.gold,T.red,T.green,T.teal,T.purple][i%5]:T.bg4,boxShadow:lights?`0 0 8px ${[T.gold,T.red,T.green,T.teal,T.purple][i%5]}`:'none',transition:`all .1s ${i*0.05}s`}}/>
          ))}
        </div>
        {/* Reels */}
        <div style={{display:'flex',justifyContent:'center',gap:10,marginBottom:14}}>
          {reels.map((reel,ri)=>(
            <div key={ri} style={{position:'relative',width:96,height:204,background:T.bg,borderRadius:14,border:`2px solid ${res?.win&&!spin?T.gold:T.bd}`,overflow:'hidden',boxShadow:res?.win&&!spin?`0 0 30px ${T.gold}66,inset 0 0 20px rgba(0,0,0,.5)`:'inset 0 0 20px rgba(0,0,0,.5)',transition:'border-color .3s,box-shadow .4s'}}>
              {/* Spin blur overlay */}
              {spinning[ri]&&<div style={{position:'absolute',inset:0,zIndex:5,background:`linear-gradient(180deg,${T.bg}cc,transparent 20%,transparent 80%,${T.bg}cc)`}}/>}
              {reel.map((si,row)=>(
                <div key={row} style={{height:68,display:'flex',alignItems:'center',justifyContent:'center',fontSize:38,background:row===1&&res&&!spin?res.win?T.gold+'1a':'transparent':'transparent',transition:'background .3s',animation:spinning[ri]?`slotSpin .08s steps(1) infinite`:'none'}}>
                  {SYM[si]}
                </div>
              ))}
              {/* Win line */}
              <div style={{position:'absolute',top:'50%',left:0,right:0,height:3,background:res?.win&&!spin?T.gold:'rgba(255,255,255,.04)',transform:'translateY(-50%)',boxShadow:res?.win&&!spin?`0 0 14px ${T.gold}`:'none',transition:'all .3s'}}/>
            </div>
          ))}
        </div>
        {/* Result */}
        {res&&!spin&&<div style={{textAlign:'center',fontSize:res.triple?22:15,fontWeight:800,color:res.win?T.gold:T.muted,fontFamily:FONT,animation:res.win?'bigWinEntry .4s cubic-bezier(.17,.67,.41,1.3)':'none',textShadow:res.win?`0 0 24px ${T.gold}`:'none'}}>{res.label||'No match'}</div>}
        {/* Paytable */}
        <div style={{display:'flex',gap:4,justifyContent:'center',flexWrap:'wrap',marginTop:12}}>
          {Object.entries(SPAY).slice(0,6).map(([s,m])=>(
            <div key={s} style={{fontSize:10,color:T.muted,fontFamily:FONT,background:T.bg3,padding:'3px 8px',borderRadius:5,border:`1px solid ${T.bd}`}}>{s}{s}{s} <span style={{color:T.gold,fontWeight:700}}>×{m}</span></div>
          ))}
        </div>
      </div>
      <div style={PNL}>
        <BetRow val={bet} set={setBet} disabled={spin} bal={bal}/>
        <div style={{marginTop:14}}><Btn label={spin?'🎰 Spinning…':'🎰 SPIN'} onClick={go} disabled={spin||!parseFloat(bet)||parseFloat(bet)>bal} pulse={!spin}/></div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  HI-LO — Card flip animation, multiplier chain visual
// ══════════════════════════════════════════════════════════════════════════════
export function HiLo({ bal, onWin, onLose }) {
  const [bet,setBet]=useState('0.05');
  const [phase,setPhase]=useState('bet');
  const [dk,setDk]=useState([]);
  const [card,setCard]=useState(null);
  const [nxt,setNxt]=useState(null);
  const [steps,setSteps]=useState(0);
  const [mult,setMult]=useState(1);
  const [toast,setTt]=useState(null);
  const [confetti,setConf]=useState(0);
  const [flipping,setFlipping]=useState(false);
  const [chain,setChain]=useState([]);

  const start=()=>{
    const a=parseFloat(bet); if(!a||a>bal) return;
    const d=mkDeck(); setDk(d.slice(1));setCard(d[0]);setNxt(null);setSteps(0);setMult(1);setTt(null);setPhase('play');setChain([]);
  };

  const guess=useCallback((g)=>{
    if(phase!=='play'||!dk.length) return;
    setFlipping(true);
    setTimeout(()=>{
      const next=dk[0],rest=dk.slice(1);
      setNxt(next);setDk(rest);setFlipping(false);
      const r=card.ri,nr=next.ri;
      const ok=g==='hi'?nr>r:g==='lo'?nr<r:nr===r;
      if(ok){
        const ns=steps+1,m=parseFloat((mult*(g==='same'?8:1.4)).toFixed(2));
        setMult(m);setSteps(ns);setCard(next);setNxt(null);
        setChain(c=>[...c.slice(-6),{g,ok:true}]);
        setTt({w:true,t:`✓ Correct! ×${m.toFixed(2)}`,big:false});
        if(m>=5)setConf(c=>c+1);
      } else {
        const loss=parseFloat(bet);
        onLose(loss);
        setChain(c=>[...c.slice(-6),{g,ok:false}]);
        setTt({w:false,t:`✗ Wrong! Lost ${f4(loss)} ETH`});
        setPhase('done');
      }
    },220);
  },[phase,dk,card,steps,mult,bet,onLose]);

  const cashout=()=>{
    if(steps===0) return;
    const profit=parseFloat((parseFloat(bet)*mult-parseFloat(bet)).toFixed(4));
    onWin(profit);
    setTt({w:true,t:`💰 Cashed ×${mult.toFixed(2)} · +${f4(profit)} ETH`,big:mult>=5});
    setPhase('done');
  };
  const reset=()=>{setPhase('bet');setCard(null);setNxt(null);setSteps(0);setMult(1);setTt(null);setChain([]);};

  const icons={hi:'⬆',lo:'⬇',same:'='};

  return (
    <div>
      <GameStyles/>
      {toast&&<WinToast win={toast.w} text={toast.t} big={toast.big} onClose={()=>setTt(null)}/>}
      <div style={{...PNL,marginBottom:12,textAlign:'center',padding:'24px 16px',background:`radial-gradient(ellipse at 50% 0%,${T.bg3},${T.bg})`,position:'relative'}}>
        <Confetti trigger={confetti} big/>
        {phase!=='bet'&&(
          <>
            {/* Chain display */}
            {chain.length>0&&<div style={{display:'flex',gap:4,justifyContent:'center',marginBottom:12}}>
              {chain.map((c,i)=><div key={i} style={{width:24,height:24,borderRadius:6,background:c.ok?T.green+'22':T.red+'22',border:`1px solid ${c.ok?T.green+'55':T.red+'55'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:c.ok?T.green:T.red}}>{icons[c.g]}</div>)}
            </div>}
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:32,marginBottom:16}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:T.muted,marginBottom:6,fontFamily:FONT,textTransform:'uppercase',letterSpacing:.5}}>Current</div>
                <div style={{animation:flipping?'hilo-flip .22s ease-in-out':'none'}}>
                  {card&&<PlayCard card={card}/>}
                </div>
              </div>
              <div style={{textAlign:'center',minWidth:80}}>
                <div style={{fontSize:36,fontWeight:900,color:T.gold,fontFamily:MONO,textShadow:`0 0 24px ${T.gold}`}}>×{mult.toFixed(2)}</div>
                <div style={{fontSize:11,color:T.muted,fontFamily:FONT}}>step {steps}</div>
                <div style={{fontSize:12,color:T.green,fontFamily:MONO,marginTop:4,fontWeight:700}}>{f4(parseFloat(bet)*mult-parseFloat(bet))} ETH</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:T.muted,marginBottom:6,fontFamily:FONT,textTransform:'uppercase',letterSpacing:.5}}>Next</div>
                {nxt?<div style={{animation:'tileFlip .2s ease-out'}}><PlayCard card={nxt}/></div>:<div style={{width:58,height:84,borderRadius:9,background:T.bg3,border:`2px dashed ${T.bd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,color:T.muted}}>?</div>}
              </div>
            </div>
            <div style={{fontSize:11,color:T.muted,fontFamily:FONT}}>
              <span style={{color:T.teal,fontWeight:700}}>×1.4</span> for Hi/Lo · <span style={{color:T.gold,fontWeight:700}}>×8</span> for Same
            </div>
          </>
        )}
        {phase==='bet'&&<div style={{padding:'24px 0',color:T.muted,fontSize:14,fontFamily:FONT}}>🃏 Guess Higher, Lower, or Same to multiply your bet!</div>}
      </div>
      <div style={PNL}>
        {phase==='bet'&&<><BetRow val={bet} set={setBet} bal={bal}/><div style={{marginTop:14}}><Btn label="Start Game" onClick={start} disabled={!parseFloat(bet)||parseFloat(bet)>bal} pulse/></div></>}
        {phase==='play'&&<>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:8}}>
            <Btn label="⬆ Higher" onClick={()=>guess('hi')} col={T.green}/>
            <Btn label="= Same" onClick={()=>guess('same')} col={T.gold}/>
            <Btn label="⬇ Lower" onClick={()=>guess('lo')} col={T.red}/>
          </div>
          <Btn label={`💰 Cash Out ×${mult.toFixed(2)}`} onClick={cashout} disabled={steps===0} col={T.teal} outline sm/>
        </>}
        {phase==='done'&&<Btn label="Play Again" onClick={reset}/>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  WHEEL — SVG with 12 colored sections
// ══════════════════════════════════════════════════════════════════════════════
const WSECS=[
  {m:1.5,c:T.teal,l:'×1.5'},{m:0,c:'#2d3a4a',l:'×0'},
  {m:2,c:T.green,l:'×2'},{m:0,c:'#2d3a4a',l:'×0'},
  {m:3,c:T.purple,l:'×3'},{m:0,c:'#2d3a4a',l:'×0'},
  {m:5,c:T.gold,l:'×5'},{m:0,c:'#2d3a4a',l:'×0'},
  {m:1.2,c:'#2979ff',l:'×1.2'},{m:0,c:'#2d3a4a',l:'×0'},
  {m:10,c:T.orange,l:'×10'},{m:0,c:'#2d3a4a',l:'×0'},
];

export function Wheel({ bal, onWin, onLose }) {
  const [bet,setBet]=useState('0.05');
  const [sp,setSp]=useState(false);
  const [deg,setDeg]=useState(0);
  const [result,setResult]=useState(null);
  const [toast,setTt]=useState(null);
  const [confetti,setConf]=useState(0);
  const n=WSECS.length,slice=360/n;

  const go=()=>{
    const a=parseFloat(bet); if(!a||a>bal||sp) return;
    setSp(true); setResult(null); setTt(null);
    const winIdx=Math.floor(Math.random()*n);
    const target=360*10+(360-winIdx*slice-slice/2);
    setDeg(d=>d+target+rng(-10,10));
    setTimeout(()=>{
      const sec=WSECS[winIdx],win=sec.m>0,profit=win?parseFloat((a*sec.m-a).toFixed(4)):-a;
      setResult({sec,idx:winIdx});
      setTt({w:win,t:win?`×${sec.m} Win! +${f4(profit)} ETH`:`No win · -${f4(a)} ETH`,big:sec.m>=5});
      if(win){onWin(profit);if(sec.m>=3)setConf(c=>c+1);}else onLose(a);
      setSp(false);
    },5500);
  };

  return (
    <div>
      <GameStyles/>
      {toast&&<WinToast win={toast.w} text={toast.t} big={toast.big} onClose={()=>setTt(null)}/>}
      <div style={{...PNL,marginBottom:12,display:'flex',flexDirection:'column',alignItems:'center',padding:'24px 16px',position:'relative',background:`radial-gradient(circle at 50% 40%,${T.bg3},${T.bg})`}}>
        <Confetti trigger={confetti} big/>
        <div style={{position:'relative',width:230,height:230,marginBottom:12}}>
          <svg width={230} height={230} style={{transform:`rotate(${deg}deg)`,transition:sp?'transform 5.5s cubic-bezier(0.08,0.6,0.06,1)':'none',filter:sp?`drop-shadow(0 0 24px ${T.gold}88)`:'none'}}>
            {WSECS.map((sec,i)=>{
              const sa=(i*slice-90)*Math.PI/180,ea=((i+1)*slice-90)*Math.PI/180;
              const r=110,cx=115,cy=115;
              const x1=cx+r*Math.cos(sa),y1=cy+r*Math.sin(sa);
              const x2=cx+r*Math.cos(ea),y2=cy+r*Math.sin(ea);
              const mx=cx+(r*.68)*Math.cos((sa+ea)/2),my=cy+(r*.68)*Math.sin((sa+ea)/2);
              return (
                <g key={i}>
                  <path d={`M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 0,1 ${x2},${y2} Z`} fill={sec.c} stroke={T.bg} strokeWidth={2}/>
                  <text x={mx} y={my} textAnchor="middle" dominantBaseline="middle" fill={sec.m>=5?T.bg:'rgba(255,255,255,.9)'} fontSize={sec.m>=5?14:11} fontWeight="800" fontFamily={MONO} style={{pointerEvents:'none'}}>{sec.l}</text>
                </g>
              );
            })}
            <circle cx={115} cy={115} r={22} fill={T.bg} stroke={T.bdHi} strokeWidth={4}/>
            <circle cx={115} cy={115} r={10} fill={T.gold}/>
          </svg>
          <div style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',fontSize:30,zIndex:10,color:T.gold,filter:`drop-shadow(0 0 16px ${T.gold})`}}>▼</div>
          {result&&!sp&&<div style={{position:'absolute',bottom:-12,left:'50%',transform:'translateX(-50%)',background:result.sec.c,borderRadius:20,padding:'4px 14px',color:result.sec.m>=5?T.bg:'#fff',fontSize:16,fontWeight:900,fontFamily:MONO,animation:'bigWinEntry .4s cubic-bezier(.17,.67,.41,1.3)',whiteSpace:'nowrap',boxShadow:`0 0 20px ${result.sec.c}`}}>{result.sec.l}</div>}
        </div>
      </div>
      <div style={PNL}>
        <BetRow val={bet} set={setBet} disabled={sp} bal={bal}/>
        <div style={{marginTop:14}}><Btn label={sp?'🎡 Spinning…':'🎡 Spin the Wheel'} onClick={go} disabled={sp||!parseFloat(bet)||parseFloat(bet)>bal} pulse={!sp}/></div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  KENO — Animated ball machine draw
// ══════════════════════════════════════════════════════════════════════════════
const KPAY=[0,0,0.5,1.5,4,10,30,80,200,500,1000];

export function Keno({ bal, onWin, onLose }) {
  const [bet,setBet]=useState('0.05');
  const [picks,setPicks]=useState(new Set());
  const [drawn,setDrawn]=useState([]);
  const [phase,setPhase]=useState('pick');
  const [hits,setHits]=useState(0);
  const [toast,setTt]=useState(null);
  const [confetti,setConf]=useState(0);
  const [drawing,setDrawing]=useState(false);
  const [lastDrawn,setLastDrawn]=useState(null);

  const toggle=n=>{ if(phase!=='pick') return; setPicks(p=>{const s=new Set(p);s.has(n)?s.delete(n):(s.size<10&&s.add(n));return s;}); };

  const play=async()=>{
    const a=parseFloat(bet); if(!a||a>bal||picks.size<1) return;
    setPhase('draw'); setDrawing(true); setDrawn([]); setTt(null); setLastDrawn(null);
    const nums=Array.from({length:80},(_,i)=>i+1).sort(()=>Math.random()-.5).slice(0,20);
    for(let i=0;i<nums.length;i++){
      await new Promise(r=>setTimeout(r,130));
      setLastDrawn(nums[i]);
      setDrawn(d=>[...d,nums[i]]);
    }
    setDrawing(false); setLastDrawn(null);
    const h=nums.filter(n=>picks.has(n)).length;
    const m=KPAY[Math.min(h,picks.size,KPAY.length-1)]||0;
    const win=m>0,profit=win?parseFloat((a*m-a).toFixed(4)):-a;
    setHits(h); setPhase('done');
    setTt({w:win,t:win?`${h} hits! ×${m} · +${f4(profit)} ETH`:`${h} hits · -${f4(a)} ETH`,big:m>=10});
    if(win){onWin(profit);if(m>=5)setConf(c=>c+1);}else onLose(a);
  };
  const reset=()=>{setPhase('pick');setPicks(new Set());setDrawn([]);setHits(0);setTt(null);setLastDrawn(null);};

  return (
    <div>
      <GameStyles/>
      {toast&&<WinToast win={toast.w} text={toast.t} big={toast.big} onClose={()=>setTt(null)}/>}
      {/* Last drawn ball display */}
      {drawing&&lastDrawn&&<div style={{textAlign:'center',marginBottom:8}}>
        <div style={{display:'inline-block',width:52,height:52,borderRadius:'50%',background:picks.has(lastDrawn)?`radial-gradient(circle at 35% 35%,${T.teal}cc,${T.teal}66)`:T.bg4,border:`3px solid ${picks.has(lastDrawn)?T.teal:T.muted}`,fontSize:18,fontWeight:900,fontFamily:MONO,color:picks.has(lastDrawn)?'#fff':T.muted,display:'inline-flex',alignItems:'center',justifyContent:'center',boxShadow:picks.has(lastDrawn)?`0 0 24px ${T.teal},0 0 48px ${T.teal}44`:'none',animation:'diceLand .2s ease-out'}}>{lastDrawn}</div>
      </div>}
      <div style={{...PNL,marginBottom:12,position:'relative'}}>
        <Confetti trigger={confetti} big/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <span style={{fontSize:11,color:T.muted,fontFamily:FONT,fontWeight:700,textTransform:'uppercase',letterSpacing:.5}}>Pick up to 10</span>
          <span style={{fontSize:12,color:T.teal,fontFamily:MONO,fontWeight:700}}>{picks.size}/10</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(10,1fr)',gap:4}}>
          {Array.from({length:80},(_,i)=>{
            const n=i+1,isPicked=picks.has(n),isDrawn=drawn.includes(n);
            const isHit=isPicked&&isDrawn,isMiss=isDrawn&&!isPicked;
            return (
              <button key={n} onClick={()=>toggle(n)} style={{
                aspectRatio:'1',borderRadius:6,fontSize:9,fontWeight:700,fontFamily:MONO,
                background:isHit?T.green:isMiss?T.bg4:isPicked?T.teal+'33':T.bg3,
                border:`1px solid ${isHit?T.green:isMiss?T.muted:isPicked?T.teal:T.bd}`,
                color:isHit?'#fff':isMiss?T.muted:isPicked?T.teal:T.text,
                cursor:phase==='pick'?'pointer':'default',
                boxShadow:isHit?`0 0 12px ${T.green}77`:isPicked&&!isDrawn?`0 0 8px ${T.teal}44`:'none',
                transition:'all .1s',
                animation:isHit?'gemPop .3s ease-out':isDrawn&&!isPicked?'none':'none',
              }}>{n}</button>
            );
          })}
        </div>
        {phase!=='pick'&&<div style={{marginTop:10,display:'flex',justifyContent:'space-between',fontSize:11,color:T.muted,fontFamily:FONT}}>
          <span>Drawn: {drawn.length}/20</span>
          {phase==='done'&&<span style={{color:hits>0?T.green:T.muted,fontWeight:700}}>Hits: {hits} · {KPAY[Math.min(hits,picks.size,KPAY.length-1)]||0}×</span>}
        </div>}
      </div>
      <div style={PNL}>
        {phase==='pick'&&<><BetRow val={bet} set={setBet} bal={bal}/><div style={{marginTop:14}}><Btn label={`Play Keno (${picks.size} picks)`} onClick={play} disabled={picks.size<1||!parseFloat(bet)||parseFloat(bet)>bal} pulse={picks.size>0}/></div></>}
        {phase==='draw'&&<div style={{textAlign:'center',color:T.teal,fontFamily:FONT,fontWeight:700,padding:'14px 0',animation:'numFlash .8s ease-in-out infinite'}}>🎱 Drawing… {drawn.length}/20</div>}
        {phase==='done'&&<Btn label="Play Again" onClick={reset}/>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  TOWERS — Visual tower with glow and depth
// ══════════════════════════════════════════════════════════════════════════════
export function Towers({ bal, onWin, onLose }) {
  const [bet,setBet]=useState('0.05');
  const [diff,setDiff]=useState('medium');
  const [phase,setPhase]=useState('bet');
  const [level,setLvl]=useState(0);
  const [tiles,setT]=useState([]);
  const [safe,setSafe]=useState([]);
  const [toast,setTt]=useState(null);
  const [confetti,setConf]=useState(0);
  const ROWS=8;
  const COLS={easy:4,medium:3,hard:2}[diff];
  const MULT={easy:1.2,medium:1.5,hard:2.5}[diff];

  const start=()=>{
    const a=parseFloat(bet); if(!a||a>bal) return;
    onLose(a);
    const sg=Array.from({length:ROWS},()=>rng(0,COLS-1));
    setSafe(sg);setT(Array(ROWS).fill(null));setLvl(0);setPhase('play');setTt(null);
  };
  const pick=col=>{
    if(phase!=='play') return;
    const isSafe=col===safe[level];
    setT(prev=>{const n=[...prev];n[level]=col;return n;});
    if(isSafe){
      const nl=level+1,m=parseFloat((Math.pow(MULT,nl)).toFixed(2));
      if(nl>=ROWS){const profit=parseFloat((parseFloat(bet)*m-parseFloat(bet)).toFixed(4));onWin(profit);setTt({w:true,t:`🏆 Tower cleared! ×${m} · +${f4(profit)} ETH`,big:true});setConf(c=>c+1);setPhase('done');setLvl(nl);}
      else setLvl(nl);
    } else {
      setPhase('done');setTt({w:false,t:`💥 Wrong tile! Lost ${f4(parseFloat(bet))} ETH`});
    }
  };
  const curMult=parseFloat((Math.pow(MULT,Math.max(1,level))).toFixed(2));
  const cashout=()=>{
    if(level===0||phase!=='play') return;
    const profit=parseFloat((parseFloat(bet)*curMult-parseFloat(bet)).toFixed(4));
    onWin(profit);setTt({w:true,t:`💰 Cashed ×${curMult} · +${f4(profit)} ETH`,big:curMult>=5});
    if(curMult>=3)setConf(c=>c+1);setPhase('done');
  };
  const reset=()=>{setPhase('bet');setT([]);setSafe([]);setLvl(0);setTt(null);};

  const dcColors={easy:T.green,medium:T.gold,hard:T.red};

  return (
    <div>
      <GameStyles/>
      {toast&&<WinToast win={toast.w} text={toast.t} big={toast.big} onClose={()=>setTt(null)}/>}
      <div style={{...PNL,marginBottom:12,position:'relative',padding:'14px 12px'}}>
        <Confetti trigger={confetti} big/>
        {phase==='bet'?(
          <div style={{textAlign:'center',padding:'20px 0',color:T.muted,fontSize:14,fontFamily:FONT}}>🏰 Climb the tower — pick safe tiles each level!</div>
        ):(
          <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <span style={{fontSize:12,color:T.muted,fontFamily:FONT}}>Floor <b style={{color:T.white}}>{level}/{ROWS}</b></span>
              <span style={{fontSize:24,fontWeight:900,color:T.green,fontFamily:MONO,textShadow:`0 0 20px ${T.green}`}}>×{curMult}</span>
              <span style={{fontSize:11,color:T.muted,fontFamily:FONT}}>+{f4(parseFloat(bet)*curMult-parseFloat(bet))}</span>
            </div>
            {/* Tower floors from top to bottom */}
            <div style={{display:'flex',flexDirection:'column',gap:4}}>
              {Array.from({length:ROWS},(_,ri)=>{
                const row=ROWS-1-ri;
                const isActive=phase==='play'&&row===level;
                const isDone=row<level;
                const isFuture=row>level;
                const chosen=tiles[row];
                const isSafeRow=row<level||(phase==='done'&&tiles[row]!==null);
                const floorMult=parseFloat((Math.pow(MULT,row+1)).toFixed(2));
                return (
                  <div key={row} style={{display:'flex',gap:5,alignItems:'center'}}>
                    {/* Floor label */}
                    <div style={{width:36,textAlign:'right',fontSize:9,color:isActive?T.gold:isDone?T.green:T.muted,fontFamily:MONO,fontWeight:700,flexShrink:0}}>
                      {isActive?`▶`:isDone?`✓`:`×${floorMult}`}
                    </div>
                    {Array.from({length:COLS},(_,ci)=>{
                      const isChosen=chosen===ci;
                      const isSafe_=safe[row]===ci;
                      const showResult=isSafeRow&&isChosen;
                      const bc=showResult&&isSafe_?T.green:showResult&&!isSafe_?T.red:isActive?T.teal:T.bd;
                      return (
                        <button key={ci} onClick={()=>isActive&&pick(ci)} style={{
                          flex:1,padding:isActive?'16px 0':'12px 0',borderRadius:9,fontSize:22,
                          background:showResult&&isSafe_?T.green+'22':showResult&&!isSafe_?T.red+'22':isActive?`linear-gradient(145deg,${T.bg4},${T.bg5})`:T.bg3,
                          border:`1px solid ${bc}`,
                          cursor:isActive?'pointer':'default',
                          boxShadow:isActive?`inset 0 1px 0 rgba(255,255,255,.08),0 0 16px ${T.teal}22`:showResult&&isSafe_?`0 0 20px ${T.green}66`:showResult&&!isSafe_?`0 0 20px ${T.red}66`:'none',
                          transition:'all .15s',outline:'none',
                          animation:showResult&&isSafe_?'gemPop .35s ease-out':showResult&&!isSafe_?'bombPop .3s ease-out':isActive?'none':'none',
                        }}>
                          {showResult&&isSafe_?<Diamond3D size={24} glow color={T.green}/>:showResult&&!isSafe_?<Mine3D size={22}/>:isActive?<span style={{color:T.muted,opacity:.4}}>?</span>:''}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <div style={PNL}>
        {phase==='bet'&&(
          <>
            <div style={{display:'flex',gap:6,marginBottom:14}}>
              {['easy','medium','hard'].map(d=>{const dc=dcColors[d]; return <button key={d} onClick={()=>setDiff(d)} style={{flex:1,padding:'10px 0',borderRadius:8,border:`1px solid ${diff===d?dc:T.bd}`,background:diff===d?dc+'1a':T.bg3,color:diff===d?dc:T.muted,fontSize:12,fontWeight:700,fontFamily:FONT,cursor:'pointer',transition:'all .15s',boxShadow:diff===d?`0 0 14px ${dc}33`:'none',textTransform:'capitalize'}}>{d}</button>;})}
            </div>
            <BetRow val={bet} set={setBet} bal={bal}/>
            <div style={{marginTop:14}}><Btn label="🏰 Start Climb" onClick={start} disabled={!parseFloat(bet)||parseFloat(bet)>bal} pulse/></div>
          </>
        )}
        {phase==='play'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <Btn label={level>0?`💰 Cash Out ×${curMult}`:'Reveal first'} onClick={cashout} disabled={level===0} col={T.green} pulse={level>0}/>
          <Btn label="Give Up" onClick={reset} col={T.red} outline sm/>
        </div>}
        {phase==='done'&&<Btn label="Play Again" onClick={reset}/>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  LIMBO — Animated rising number with rocket visual
// ══════════════════════════════════════════════════════════════════════════════
export function Limbo({ bal, onWin, onLose }) {
  const [bet,setBet]=useState('0.05');
  const [target,setTgt]=useState('2.00');
  const [rolling,setR]=useState(false);
  const [result,setRes]=useState(null);
  const [hist,setH]=useState([]);
  const [toast,setTt]=useState(null);
  const [confetti,setConf]=useState(0);
  const [displayNum,setDN]=useState(null);
  const [rocketY,setRY]=useState(80);

  const go=useCallback(async()=>{
    const a=parseFloat(bet),t=parseFloat(target);
    if(!a||a>bal||!t||t<1.01) return;
    setR(true);setRes(null);setTt(null);setDN(1.00);setRY(80);
    // Animate rocket rising
    let frame=0,startMs=Date.now();
    const ri=setInterval(()=>{
      const ms=Date.now()-startMs,m=multAt(ms*0.6);
      setDN(parseFloat(m.toFixed(2)));
      setRY(Math.max(5,80-frame*4));
      if(++frame>=20) clearInterval(ri);
    },55);
    await new Promise(r=>setTimeout(r,1200));
    clearInterval(ri);
    const crash=genCrash();
    const win=crash>=t;
    setDN(crash); setRY(win?5:80); setRes({crash,win});
    setH(h=>[{crash,win},...h.slice(0,14)]);
    const profit=win?parseFloat((a*(t-1)).toFixed(4)):-a;
    setTt({w:win,t:win?`${crash.toFixed(2)}× — Win! +${f4(profit)} ETH`:`${crash.toFixed(2)}× — Loss`,big:win&&t>=5});
    if(win){onWin(profit);if(t>=5)setConf(c=>c+1);}else onLose(a);
    setR(false);
  },[bet,bal,target,onWin,onLose]);

  const rc=result?(result.win?T.green:T.red):T.muted;

  return (
    <div>
      <GameStyles/>
      <div style={{...PNL,marginBottom:12,textAlign:'center',padding:'32px 20px',position:'relative',background:`radial-gradient(ellipse at 50% 0%,${T.bg3},${T.bg})`,overflow:'hidden'}}>
        <Confetti trigger={confetti} big/>
        {/* Rocket */}
        <div style={{position:'absolute',left:'20%',top:`${rocketY}%`,fontSize:32,transform:'rotate(-45deg)',transition:rolling?'top .3s ease-out':'top .1s',filter:rolling?`drop-shadow(0 0 12px ${T.gold})`:'none'}}>🚀</div>
        <div style={{position:'absolute',right:'20%',top:`${rocketY}%`,fontSize:32,transform:'rotate(45deg) scaleX(-1)',transition:rolling?'top .3s ease-out':'top .1s',filter:rolling?`drop-shadow(0 0 12px ${T.teal})`:'none'}}>🚀</div>
        <div style={{fontSize:11,color:T.muted,fontFamily:FONT,textTransform:'uppercase',letterSpacing:2,marginBottom:12}}>Result</div>
        <div style={{fontSize:80,fontWeight:900,fontFamily:MONO,lineHeight:1,color:rc,textShadow:rolling?'none':`0 0 50px ${rc}`,transition:'color .2s,text-shadow .3s',filter:rolling?'blur(2px)':'none',animation:result&&!rolling?'diceLand .3s ease-out':rolling?'numFlash .5s ease-in-out infinite':'none',fontVariantNumeric:'tabular-nums'}}>
          {displayNum!=null?displayNum.toFixed(2):'—'}×
        </div>
        {result&&<div style={{fontSize:18,fontWeight:800,color:rc,marginTop:10,fontFamily:FONT,animation:'bigWinEntry .3s ease-out'}}>{result.win?'🏆 WIN':'💀 BUST'}</div>}
        {hist.length>0&&<div style={{display:'flex',gap:4,marginTop:16,justifyContent:'center',flexWrap:'wrap'}}>
          {hist.map((h,i)=><span key={i} style={{fontSize:11,padding:'2px 8px',borderRadius:5,fontFamily:MONO,fontWeight:700,background:h.win?T.green+'1a':T.red+'1a',color:h.win?T.green:T.red,border:`1px solid ${h.win?T.green+'33':T.red+'33'}`}}>{h.crash.toFixed(2)}×</span>)}
        </div>}
      </div>
      {toast&&<WinToast win={toast.w} text={toast.t} big={toast.big} onClose={()=>setTt(null)}/>}
      <div style={PNL}>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:T.muted,marginBottom:7,fontFamily:FONT,fontWeight:600,textTransform:'uppercase',letterSpacing:.5}}>Target Multiplier</div>
          <div style={{position:'relative'}}>
            <input type="number" min="1.01" step=".1" value={target} onChange={e=>setTgt(e.target.value)} disabled={rolling} style={{...INP,paddingRight:40}}/>
            <span style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',fontSize:11,color:T.teal,fontWeight:700,fontFamily:MONO}}>×</span>
          </div>
          {parseFloat(target)>=1.01&&<div style={{fontSize:10,color:T.muted,marginTop:5,fontFamily:FONT}}>Win chance: <b style={{color:T.teal}}>{(97/parseFloat(target)).toFixed(1)}%</b></div>}
        </div>
        <BetRow val={bet} set={setBet} disabled={rolling} bal={bal}/>
        <div style={{marginTop:14}}><Btn label={rolling?'🚀 Launching…':'🚀 Launch'} onClick={go} disabled={rolling||!parseFloat(bet)||parseFloat(bet)>bal||!parseFloat(target)||parseFloat(target)<1.01} pulse={!rolling}/></div>
      </div>
    </div>
  );
}

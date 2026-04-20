import { useState, useEffect, useCallback } from 'react';
import { T, FONT, MONO, PNL, INP, f4, f2, Btn } from './shared.jsx';
import { GameStyles, Confetti } from './effects.jsx';

// ── AVATARS ───────────────────────────────────────────────────────────────────
const AVATARS = [
  '🎰','💎','🚀','🔥','👑','💀','🦊','🐺','🦁','🐉',
  '⚡','🌊','💫','🎭','🤖','👾','🦂','🎯','🃏','🏆',
];
const VIP_TIERS = [
  { name:'Bronze',   min:0,     icon:'🥉', c:'#cd7f32', rake:0,    rb:0 },
  { name:'Silver',   min:0.5,   icon:'🥈', c:'#c0c0c0', rake:0.5,  rb:1 },
  { name:'Gold',     min:2,     icon:'🥇', c:'#FFD426', rake:1,    rb:2 },
  { name:'Platinum', min:5,     icon:'💠', c:'#00d4ff', rake:2,    rb:5 },
  { name:'Diamond',  min:10,    icon:'💎', c:'#bf5af2', rake:3,    rb:10 },
  { name:'Elite',    min:25,    icon:'👑', c:'#FF9F0A', rake:5,    rb:15 },
  { name:'Legend',   min:50,    icon:'🔥', c:'#ff2d55', rake:8,    rb:20 },
];
export function getVip(wagered) {
  return [...VIP_TIERS].reverse().find(v => wagered >= v.min) || VIP_TIERS[0];
}

// ── DAILY BONUS WHEEL ─────────────────────────────────────────────────────────
const WHEEL_PRIZES = [
  { l:'0.001',  v:0.001,  c:'#00e87a', w:25 },
  { l:'0.005',  v:0.005,  c:'#00d4ff', w:20 },
  { l:'MISS',   v:0,      c:'#2d3a4a', w:20 },
  { l:'0.01',   v:0.01,   c:'#FFD426', w:15 },
  { l:'MISS',   v:0,      c:'#2d3a4a', w:10 },
  { l:'0.05',   v:0.05,   c:'#bf5af2', w:6  },
  { l:'MISS',   v:0,      c:'#2d3a4a', w:3  },
  { l:'0.25',   v:0.25,   c:'#ff9f0a', w:1  },
];

function getNextSpin() {
  const last = localStorage.getItem('rizk_last_spin');
  if (!last) return true;
  return Date.now() - parseInt(last) > 86400000;
}
function timeUntilSpin() {
  const last = localStorage.getItem('rizk_last_spin');
  if (!last) return null;
  const ms = 86400000 - (Date.now() - parseInt(last));
  if (ms <= 0) return null;
  const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000), s = Math.floor((ms%60000)/1000);
  return `${h}h ${m}m ${s}s`;
}

export function DailyWheel({ onWin, bal }) {
  const [canSpin, setCanSpin] = useState(getNextSpin());
  const [spinning, setSpin] = useState(false);
  const [deg, setDeg] = useState(0);
  const [result, setResult] = useState(null);
  const [countdown, setCountdown] = useState(timeUntilSpin());
  const [confetti, setConf] = useState(0);
  const n = WHEEL_PRIZES.length, slice = 360/n;

  useEffect(() => {
    const t = setInterval(() => {
      setCanSpin(getNextSpin());
      setCountdown(timeUntilSpin());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const spin = () => {
    if (!canSpin || spinning) return;
    setSpin(true); setResult(null);
    // Weighted random
    const total = WHEEL_PRIZES.reduce((s,p) => s+p.w, 0);
    let rand = Math.random() * total, idx = 0;
    for (let i = 0; i < WHEEL_PRIZES.length; i++) { rand -= WHEEL_PRIZES[i].w; if (rand <= 0) { idx = i; break; } }
    const target = 360*8 + (360 - idx*slice - slice/2);
    setDeg(d => d + target + (Math.random()*slice*0.4));
    setTimeout(() => {
      const prize = WHEEL_PRIZES[idx];
      setResult(prize); setSpin(false);
      localStorage.setItem('rizk_last_spin', Date.now().toString());
      setCanSpin(false);
      if (prize.v > 0) { onWin(prize.v); setConf(c=>c+1); }
    }, 5000);
  };

  return (
    <div style={{...PNL, textAlign:'center', padding:'24px 16px', position:'relative'}}>
      <GameStyles/>
      <Confetti trigger={confetti} big/>
      <div style={{fontSize:13,color:T.gold,fontWeight:800,fontFamily:FONT,letterSpacing:3,textTransform:'uppercase',marginBottom:16}}>🎡 Daily Free Spin</div>
      <div style={{position:'relative',width:200,height:200,margin:'0 auto 16px'}}>
        <svg width={200} height={200} style={{transform:`rotate(${deg}deg)`,transition:spinning?'transform 5s cubic-bezier(0.08,0.6,0.06,1)':'none'}}>
          {WHEEL_PRIZES.map((p,i)=>{
            const sa=(i*slice-90)*Math.PI/180, ea=((i+1)*slice-90)*Math.PI/180;
            const r=95,cx=100,cy=100;
            const x1=cx+r*Math.cos(sa),y1=cy+r*Math.sin(sa);
            const x2=cx+r*Math.cos(ea),y2=cy+r*Math.sin(ea);
            const mx=cx+(r*.68)*Math.cos((sa+ea)/2),my=cy+(r*.68)*Math.sin((sa+ea)/2);
            return <g key={i}>
              <path d={`M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 0,1 ${x2},${y2} Z`} fill={p.c} stroke={T.bg} strokeWidth={2}/>
              <text x={mx} y={my} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={p.v>=0.1?13:11} fontWeight="800" fontFamily={MONO} style={{pointerEvents:'none'}}>{p.l}</text>
            </g>;
          })}
          <circle cx={100} cy={100} r={18} fill={T.bg} stroke={T.bdHi} strokeWidth={3}/>
          <circle cx={100} cy={100} r={8} fill={T.gold}/>
        </svg>
        <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',fontSize:24,color:T.gold,filter:`drop-shadow(0 0 12px ${T.gold})`}}>▼</div>
        {result&&!spinning&&<div style={{position:'absolute',bottom:-10,left:'50%',transform:'translateX(-50%)',background:result.c,borderRadius:20,padding:'4px 14px',color:'#fff',fontSize:14,fontWeight:900,fontFamily:MONO,whiteSpace:'nowrap',boxShadow:`0 0 16px ${result.c}`}}>
          {result.v>0?`+${result.v} ETH`:'No win'}
        </div>}
      </div>
      {canSpin
        ? <Btn label={spinning?'Spinning…':'🎡 Spin Now (FREE)'} onClick={spin} disabled={spinning} col={T.gold} pulse={!spinning}/>
        : <div style={{color:T.muted,fontFamily:FONT,fontSize:12}}>Next spin in: <b style={{color:T.teal}}>{countdown}</b></div>
      }
    </div>
  );
}

// ── DAILY QUESTS ─────────────────────────────────────────────────────────────
const QUEST_DEFS = [
  { id:'bet5',   label:'Place 5 bets',         reward:0.002, target:5,  stat:'total_bets',  icon:'🎲' },
  { id:'win3',   label:'Win 3 times',           reward:0.003, target:3,  stat:'wins',        icon:'🏆' },
  { id:'crash2', label:'Cash out on Crash 2×',  reward:0.005, target:1,  stat:'crash_2x',    icon:'🚌' },
  { id:'mines3', label:'Reveal 3 gems',         reward:0.004, target:3,  stat:'gems',        icon:'💎' },
  { id:'slots',  label:'Spin slots 3 times',    reward:0.003, target:3,  stat:'slots_spins', icon:'🎰' },
];

export function DailyQuests({ stats, onClaim }) {
  const today = new Date().toDateString();
  const [progress, setProgress] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('rizk_quests')||'{}'); return s.date===today?s.data:{}; } catch { return {}; }
  });
  const [claimed, setClaimed] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('rizk_claimed')||'{}'); return s.date===today?s.data:{}; } catch { return {}; }
  });

  // Sync stats to quest progress using user data
  useEffect(() => {
    const p = { ...progress };
    QUEST_DEFS.forEach(q => {
      if (q.stat === 'total_bets') p[q.id] = Math.min(stats.total_bets||0, q.target);
    });
    setProgress(p);
    localStorage.setItem('rizk_quests', JSON.stringify({ date: today, data: p }));
  }, [stats.total_bets]);

  const claim = (q) => {
    if (claimed[q.id] || (progress[q.id]||0) < q.target) return;
    onClaim(q.reward);
    const nc = {...claimed, [q.id]: true};
    setClaimed(nc);
    localStorage.setItem('rizk_claimed', JSON.stringify({ date: today, data: nc }));
  };

  return (
    <div style={{...PNL, padding:'16px'}}>
      <div style={{fontSize:12,color:T.gold,fontWeight:800,fontFamily:FONT,letterSpacing:2,textTransform:'uppercase',marginBottom:14}}>⚡ Daily Quests</div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {QUEST_DEFS.slice(0,3).map(q => {
          const prog = progress[q.id]||0;
          const done = prog >= q.target;
          const isClaimed = claimed[q.id];
          const pct = Math.min(100, (prog/q.target)*100);
          return (
            <div key={q.id} style={{background:T.bg3,borderRadius:10,padding:'10px 14px',border:`1px solid ${isClaimed?T.green+'44':done?T.gold+'44':T.bd}`,transition:'all .2s'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <span style={{fontSize:13,color:isClaimed?T.muted:T.white,fontFamily:FONT,fontWeight:600,textDecoration:isClaimed?'line-through':'none'}}>
                  {q.icon} {q.label}
                </span>
                <span style={{fontSize:11,color:T.gold,fontFamily:MONO,fontWeight:700}}>+{q.reward} ETH</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1,height:5,background:T.bg4,borderRadius:50,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,background:isClaimed?T.muted:done?T.gold:T.teal,borderRadius:50,transition:'width .3s'}}/>
                </div>
                <span style={{fontSize:10,color:T.muted,fontFamily:MONO,minWidth:32}}>{prog}/{q.target}</span>
                {done&&!isClaimed&&<button onClick={()=>claim(q)} style={{background:T.gold,border:'none',color:T.bg,padding:'3px 10px',borderRadius:6,fontSize:10,fontWeight:800,cursor:'pointer',fontFamily:FONT}}>CLAIM</button>}
                {isClaimed&&<span style={{fontSize:12,color:T.green}}>✓</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{fontSize:10,color:T.muted,fontFamily:FONT,textAlign:'center',marginTop:10}}>Resets daily at midnight</div>
    </div>
  );
}

// ── RAIN EVENT ────────────────────────────────────────────────────────────────
export function RainEvent({ onReceive }) {
  const [active, setActive] = useState(false);
  const [drops, setDrops] = useState([]);

  useEffect(() => {
    // Random rain event every 10-30 minutes
    const schedule = () => {
      const wait = 1000 * 60 * (10 + Math.random() * 20);
      setTimeout(() => {
        setActive(true);
        setDrops(Array.from({length:20}, (_,i) => ({
          id:i, left:`${Math.random()*100}%`, delay:`${Math.random()*2}s`,
          size: 4 + Math.random()*6,
        })));
        setTimeout(() => {
          setActive(false); setDrops([]);
          onReceive(0.001);
          schedule();
        }, 4000);
      }, wait);
    };
    // Also fire one after 30 seconds so user sees it quickly
    const firstRain = setTimeout(() => {
      setActive(true);
      setDrops(Array.from({length:20}, (_,i) => ({
        id:i, left:`${Math.random()*100}%`, delay:`${Math.random()*2}s`, size:4+Math.random()*6,
      })));
      setTimeout(() => { setActive(false); setDrops([]); onReceive(0.001); schedule(); }, 4000);
    }, 30000);
    return () => clearTimeout(firstRain);
  }, []);

  if (!active) return null;
  return (
    <div style={{position:'fixed',top:60,left:0,right:0,zIndex:200,pointerEvents:'none'}}>
      <div style={{position:'relative',height:200,overflow:'hidden'}}>
        {drops.map(d=>(
          <div key={d.id} style={{position:'absolute',left:d.left,top:-20,width:d.size,height:d.size,borderRadius:'50%',background:T.teal,boxShadow:`0 0 8px ${T.teal}`,animation:`confettiFall 2s ease-in ${d.delay} forwards`}}/>
        ))}
      </div>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:T.bg2,border:`2px solid ${T.teal}`,borderRadius:16,padding:'20px 32px',textAlign:'center',boxShadow:`0 0 40px ${T.teal}44`,animation:'bigWinEntry .4s ease-out',zIndex:201}}>
        <div style={{fontSize:32,marginBottom:8}}>🌧️</div>
        <div style={{fontSize:18,fontWeight:900,color:T.teal,fontFamily:FONT}}>IT'S RAINING!</div>
        <div style={{fontSize:14,color:T.white,fontFamily:FONT,marginTop:4}}>+0.001 ETH added to your balance!</div>
      </div>
    </div>
  );
}

// ── REFERRAL SYSTEM ───────────────────────────────────────────────────────────
export function ReferralPanel({ user }) {
  const [copied, setCopied] = useState(false);
  const code = user?.username ? `RIZK-${user.username.toUpperCase()}` : '';
  const link = `https://rizk-casino.netlify.app/?ref=${code}`;

  const copy = () => {
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(()=>setCopied(false), 2000); });
  };

  return (
    <div style={{...PNL, padding:'16px'}}>
      <div style={{fontSize:12,color:T.purple,fontWeight:800,fontFamily:FONT,letterSpacing:2,textTransform:'uppercase',marginBottom:14}}>🔗 Referral Program</div>
      <div style={{background:T.bg3,borderRadius:10,padding:'12px',marginBottom:12,border:`1px solid ${T.bd}`}}>
        <div style={{fontSize:10,color:T.muted,fontFamily:FONT,marginBottom:6}}>Your referral code</div>
        <div style={{fontSize:18,fontWeight:900,color:T.gold,fontFamily:MONO,letterSpacing:2}}>{code}</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12}}>
        {[['10%','Of referee losses back to you'],['5 ETH','Bonus when they hit Gold VIP'],['Lifetime','Earnings never expire']].map(([v,l],i)=>(
          <div key={i} style={{textAlign:'center',background:T.bg3,borderRadius:8,padding:'10px 6px',border:`1px solid ${T.bd}`}}>
            <div style={{fontSize:16,fontWeight:900,color:T.teal,fontFamily:MONO}}>{v}</div>
            <div style={{fontSize:9,color:T.muted,fontFamily:FONT,marginTop:3}}>{l}</div>
          </div>
        ))}
      </div>
      <Btn label={copied?'✓ Copied!':'Copy Referral Link'} onClick={copy} col={copied?T.green:T.purple}/>
    </div>
  );
}

// ── RAKEBACK PANEL ────────────────────────────────────────────────────────────
export function RakebackPanel({ user, onClaim }) {
  const vip = getVip(user?.total_wagered||0);
  const pending = parseFloat(((user?.total_wagered||0) * (vip.rake/100)).toFixed(4));
  const [claimed, setClaimed] = useState(false);

  const claim = () => {
    if (claimed || pending <= 0) return;
    onClaim(pending * 0.01); // Pay out 1% of estimated rakeback as demo
    setClaimed(true);
    setTimeout(()=>setClaimed(false), 60000);
  };

  return (
    <div style={{...PNL, padding:'16px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div style={{fontSize:12,color:T.orange,fontWeight:800,fontFamily:FONT,letterSpacing:2,textTransform:'uppercase'}}>💰 Rakeback</div>
        <div style={{fontSize:11,color:vip.c,fontFamily:FONT,fontWeight:700}}>{vip.icon} {vip.name} · {vip.rake}% rate</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
        <div style={{background:T.bg3,borderRadius:10,padding:'12px',textAlign:'center',border:`1px solid ${T.bd}`}}>
          <div style={{fontSize:10,color:T.muted,fontFamily:FONT,marginBottom:4}}>Total Wagered</div>
          <div style={{fontSize:18,fontWeight:800,color:T.white,fontFamily:MONO}}>{f4(user?.total_wagered||0)}</div>
          <div style={{fontSize:10,color:T.muted,fontFamily:FONT}}>ETH</div>
        </div>
        <div style={{background:T.bg3,borderRadius:10,padding:'12px',textAlign:'center',border:`1px solid ${T.orange}44`}}>
          <div style={{fontSize:10,color:T.muted,fontFamily:FONT,marginBottom:4}}>Rakeback Earned</div>
          <div style={{fontSize:18,fontWeight:800,color:T.orange,fontFamily:MONO}}>{f4(pending*0.01)}</div>
          <div style={{fontSize:10,color:T.muted,fontFamily:FONT}}>ETH</div>
        </div>
      </div>
      <Btn label={claimed?'✓ Claimed!':'Claim Rakeback'} onClick={claim} disabled={claimed||pending<=0} col={T.orange}/>
      <div style={{fontSize:10,color:T.muted,fontFamily:FONT,textAlign:'center',marginTop:8}}>Next tier: <b style={{color:T.white}}>{VIP_TIERS[Math.min(VIP_TIERS.indexOf(vip)+1,VIP_TIERS.length-1)].name}</b> at {VIP_TIERS[Math.min(VIP_TIERS.indexOf(vip)+1,VIP_TIERS.length-1)].min} ETH wagered</div>
    </div>
  );
}

// ── AVATAR PICKER ─────────────────────────────────────────────────────────────
export function AvatarPicker({ current, onSelect, onClose }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300}}>
      <div style={{background:T.bg2,border:`1px solid ${T.bd}`,borderRadius:16,padding:24,maxWidth:360,width:'90%'}}>
        <div style={{fontSize:14,fontWeight:700,color:T.white,fontFamily:FONT,marginBottom:16}}>Choose Avatar</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:16}}>
          {AVATARS.map((a,i)=>(
            <button key={i} onClick={()=>{onSelect(a);onClose();}} style={{aspectRatio:'1',fontSize:28,background:current===a?T.teal+'22':T.bg3,border:`2px solid ${current===a?T.teal:T.bd}`,borderRadius:10,cursor:'pointer',transition:'all .15s',boxShadow:current===a?`0 0 12px ${T.teal}44`:'none'}}>{a}</button>
          ))}
        </div>
        <Btn label="Close" onClick={onClose} col={T.muted} outline/>
      </div>
    </div>
  );
}

// ── FULL PROFILE PAGE ─────────────────────────────────────────────────────────
export function ProfilePage({ user, token, onUpdate, onClose }) {
  const [avatar, setAvatar] = useState(() => localStorage.getItem('rizk_avatar')||'🎰');
  const [showAvatar, setShowAvatar] = useState(false);
  const [tab, setTab] = useState('overview');
  const vip = getVip(user?.total_wagered||0);
  const nextVip = VIP_TIERS[Math.min(VIP_TIERS.indexOf(vip)+1, VIP_TIERS.length-1)];
  const vipProgress = nextVip===vip?100:((user?.total_wagered||0)-vip.min)/(nextVip.min-vip.min)*100;
  const winRate = user?.total_bets ? ((user.total_wins||0)/(user.total_wagered||1)*100).toFixed(1) : '0.0';
  const netPnl = ((user?.total_wins||0) - (user?.total_wagered||0));

  const saveAvatar = (a) => { setAvatar(a); localStorage.setItem('rizk_avatar', a); };

  const TABS = ['overview','vip','achievements'];

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',display:'flex',alignItems:'flex-start',justifyContent:'center',zIndex:200,overflowY:'auto',padding:'20px 16px'}}>
      {showAvatar&&<AvatarPicker current={avatar} onSelect={saveAvatar} onClose={()=>setShowAvatar(false)}/>}
      <div style={{background:T.bg2,border:`1px solid ${T.bd}`,borderRadius:20,width:'100%',maxWidth:480,overflow:'hidden'}}>
        <GameStyles/>
        {/* Header banner */}
        <div style={{background:`linear-gradient(135deg, ${vip.c}22, ${T.bg3})`,padding:'24px 20px 16px',borderBottom:`1px solid ${T.bd}`,position:'relative'}}>
          <button onClick={onClose} style={{position:'absolute',top:16,right:16,background:'transparent',border:'none',color:T.muted,fontSize:20,cursor:'pointer'}}>✕</button>
          <div style={{display:'flex',gap:16,alignItems:'center'}}>
            {/* Avatar */}
            <div onClick={()=>setShowAvatar(true)} style={{width:72,height:72,borderRadius:18,background:T.bg3,border:`3px solid ${vip.c}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,cursor:'pointer',boxShadow:`0 0 20px ${vip.c}44`,transition:'transform .15s',flexShrink:0}}>
              {avatar}
            </div>
            <div>
              <div style={{fontSize:22,fontWeight:900,color:T.white,fontFamily:FONT}}>{user?.username}</div>
              <div style={{display:'flex',alignItems:'center',gap:6,marginTop:4}}>
                <span style={{fontSize:12,color:vip.c,fontFamily:FONT,fontWeight:700}}>{vip.icon} {vip.name}</span>
                <span style={{fontSize:10,color:T.muted,fontFamily:FONT}}>· {vip.rake}% rakeback</span>
              </div>
              <div style={{fontSize:10,color:T.muted,fontFamily:FONT,marginTop:4}}>Member since {new Date(user?.created_at*1000||Date.now()).toLocaleDateString()}</div>
            </div>
          </div>
          {/* VIP progress bar */}
          {nextVip!==vip&&<div style={{marginTop:14}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.muted,marginBottom:5,fontFamily:FONT}}>
              <span>{vip.name}</span><span style={{color:nextVip.c}}>{nextVip.name} at {nextVip.min} ETH</span>
            </div>
            <div style={{height:6,background:T.bg4,borderRadius:50,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${Math.min(100,vipProgress)}%`,background:`linear-gradient(90deg,${vip.c},${nextVip.c})`,borderRadius:50,transition:'width .5s'}}/>
            </div>
          </div>}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:`1px solid ${T.bd}`}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'12px 0',background:'transparent',border:'none',color:tab===t?T.white:T.muted,fontSize:12,fontWeight:tab===t?700:400,cursor:'pointer',fontFamily:FONT,borderBottom:`2px solid ${tab===t?T.teal:'transparent'}`,transition:'all .15s',textTransform:'capitalize'}}>{t}</button>
          ))}
        </div>

        <div style={{padding:'16px'}}>
          {/* OVERVIEW TAB */}
          {tab==='overview'&&<>
            {/* Stats grid */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16}}>
              {[
                ['Total Bets',user?.total_bets||0,T.teal,''],
                ['Total Wagered',f4(user?.total_wagered||0),T.white,'ETH'],
                ['Net P&L',`${netPnl>=0?'+':''}${f4(netPnl)}`,netPnl>=0?T.green:T.red,'ETH'],
                ['Total Wins',f4(user?.total_wins||0),T.green,'ETH'],
                ['Win Rate',`${winRate}%`,parseFloat(winRate)>50?T.green:T.muted,''],
                ['Balance',f4(user?.balance_eth||0),T.gold,'ETH'],
              ].map(([l,v,c,u],i)=>(
                <div key={i} style={{background:T.bg3,borderRadius:10,padding:'10px 8px',textAlign:'center',border:`1px solid ${T.bd}`}}>
                  <div style={{fontSize:9,color:T.muted,fontFamily:FONT,textTransform:'uppercase',letterSpacing:.5,marginBottom:4}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:800,color:c,fontFamily:MONO,fontVariantNumeric:'tabular-nums'}}>{v}</div>
                  {u&&<div style={{fontSize:9,color:T.muted,fontFamily:FONT}}>{u}</div>}
                </div>
              ))}
            </div>
          </>}

          {/* VIP TAB */}
          {tab==='vip'&&<>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {VIP_TIERS.map((tier,i)=>{
                const isActive = tier.name===vip.name;
                const isUnlocked = (user?.total_wagered||0) >= tier.min;
                return (
                  <div key={i} style={{background:isActive?tier.c+'1a':T.bg3,border:`1px solid ${isActive?tier.c:T.bd}`,borderRadius:10,padding:'12px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',transition:'all .2s',boxShadow:isActive?`0 0 16px ${tier.c}22`:'none'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontSize:22,opacity:isUnlocked?1:.3}}>{tier.icon}</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:isUnlocked?tier.c:T.muted,fontFamily:FONT}}>{tier.name}</div>
                        <div style={{fontSize:10,color:T.muted,fontFamily:FONT}}>≥ {tier.min} ETH wagered</div>
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:11,color:isUnlocked?T.white:T.muted,fontFamily:MONO,fontWeight:700}}>{tier.rake}% rake</div>
                      <div style={{fontSize:10,color:T.muted,fontFamily:FONT}}>{tier.rb}% cashback</div>
                      {isActive&&<div style={{fontSize:9,color:tier.c,fontFamily:FONT,marginTop:2,fontWeight:700}}>CURRENT</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>}

          {/* ACHIEVEMENTS TAB */}
          {tab==='achievements'&&<>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[
                {i:'🎰',l:'First Bet',d:'Place your first bet',done:!!(user?.total_bets)},
                {i:'💎',l:'Diamond Hands',d:'Wager 1 ETH total',done:(user?.total_wagered||0)>=1},
                {i:'🏆',l:'Winner',d:'Win 10 times',done:(user?.total_bets||0)>=10},
                {i:'🚌',l:'Bus Rider',d:'Cash out at 2× on Crash',done:false},
                {i:'🔥',l:'On Fire',d:'Win 5 in a row',done:false},
                {i:'👑',l:'High Roller',d:'Place a 0.1 ETH bet',done:false},
                {i:'🌙',l:'Night Owl',d:'Play after midnight',done:false},
                {i:'💫',l:'Lucky Star',d:'Hit a 10× on any game',done:false},
              ].map((a,i)=>(
                <div key={i} style={{background:a.done?T.bg3:T.bg2,border:`1px solid ${a.done?T.gold+'44':T.bd}`,borderRadius:10,padding:'12px',textAlign:'center',opacity:a.done?1:.5,transition:'all .2s',boxShadow:a.done?`0 0 10px ${T.gold}22`:'none'}}>
                  <div style={{fontSize:28,marginBottom:6,filter:a.done?'none':'grayscale(1)'}}>{a.i}</div>
                  <div style={{fontSize:11,fontWeight:700,color:a.done?T.white:T.muted,fontFamily:FONT}}>{a.l}</div>
                  <div style={{fontSize:9,color:T.muted,fontFamily:FONT,marginTop:2}}>{a.d}</div>
                  {a.done&&<div style={{fontSize:9,color:T.gold,fontFamily:FONT,marginTop:4,fontWeight:700}}>UNLOCKED ✓</div>}
                </div>
              ))}
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

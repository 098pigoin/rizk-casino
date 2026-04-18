import { useState, useEffect, useRef, useCallback } from 'react';
import { T, FONT, MONO, PNL } from './shared.jsx';
import { Crash, Mines, Plinko, Dice, Blackjack, Roulette, Slots, HiLo, Wheel, Keno, Towers, Limbo } from './games.jsx';
import LivePanel from './LivePanel.jsx';
import Leaderboard from './Leaderboard.jsx';
import Rakeback from './Rakeback.jsx';
import Landing from './Landing.jsx';
import AuthModal from './AuthModal.jsx';
import WalletModal from './WalletModal.jsx';
import { SFX } from './sfx.js';
import { API } from './api.js';

const ACH = {
  first_win:   {i:'🏆',t:'First Win',    d:'Won your first bet'},
  big_win:     {i:'💰',t:'Big Winner',   d:'Won 5x or more'},
  win_streak3: {i:'🔥',t:'On Fire',      d:'3 wins in a row'},
  high_roller: {i:'💎',t:'High Roller',  d:'Bet 0.5 ETH or more'},
  jackpot:     {i:'🎡',t:'Jackpot!',     d:'Hit 50x on the Wheel'},
};

function AchPopup({ach,onClose}){
  useEffect(()=>{const t=setTimeout(onClose,4000);return()=>clearTimeout(t);},[onClose]);
  return(
    <div onClick={onClose} style={{position:'fixed',top:72,right:16,zIndex:400,background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,border:`1px solid ${T.gold}55`,borderRadius:14,padding:'14px 18px',display:'flex',alignItems:'center',gap:14,boxShadow:`0 12px 40px rgba(0,0,0,.6),0 0 32px ${T.gold}28`,animation:'achslide .4s cubic-bezier(.175,.885,.32,1.275)',minWidth:240,cursor:'pointer'}}>
      <div style={{fontSize:34}}>{ach.i}</div>
      <div>
        <div style={{fontSize:10,color:T.gold,fontFamily:FONT,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',marginBottom:3}}>Achievement!</div>
        <div style={{fontSize:15,fontWeight:700,color:T.white,fontFamily:FONT}}>{ach.t}</div>
        <div style={{fontSize:11,color:T.muted,fontFamily:FONT}}>{ach.d}</div>
      </div>
    </div>
  );
}

function DailyBonus({onClaim}){
  const [claimed,set]=useState(false);
  if(claimed)return null;
  return(
    <div style={{...PNL,marginBottom:14,border:`1px solid ${T.gold}44`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',boxShadow:`0 0 24px ${T.gold}18`}}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <span style={{fontSize:28}}>🎁</span>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:T.gold,fontFamily:FONT}}>Daily Bonus!</div>
          <div style={{fontSize:11,color:T.muted,fontFamily:FONT,marginTop:2}}>Claim 0.1 ETH free demo balance</div>
        </div>
      </div>
      <button onClick={()=>{set(true);onClaim(0.1);SFX.ach();}} style={{background:`linear-gradient(135deg,${T.gold},${T.goldD})`,border:'none',color:'#080e1a',padding:'10px 20px',fontSize:13,fontWeight:800,cursor:'pointer',borderRadius:9,fontFamily:FONT,flexShrink:0}}>Claim</button>
    </div>
  );
}

const VIP=[{n:'Bronze',min:0,c:'#cd7f32',i:'🥉'},{n:'Silver',min:.5,c:'#c0c0c0',i:'🥈'},{n:'Gold',min:2,c:'#ffd740',i:'🥇'},{n:'Diamond',min:5,c:'#00e5ff',i:'💎'},{n:'Platinum',min:10,c:'#bf5af2',i:'👑'}];
const getVip=w=>VIP.reduce((v,l)=>w>=l.min?l:v,VIP[0]);

const PROMOS=[
  {text:'🚀 Crash is live — cash out before it crashes!',col:T.teal},
  {text:'🗼 Towers — climb 8 levels, ×1.45 per floor',col:'#bf5af2'},
  {text:'🌙 Limbo — set any multiplier, instant result',col:'#00e87a'},
  {text:'💸 5% Rakeback on every bet — claim anytime',col:T.gold},
  {text:'🔐 Create an account to track real ETH balance',col:T.teal},
];
function PromoBanner(){
  const [idx,setIdx]=useState(0);
  useEffect(()=>{const iv=setInterval(()=>setIdx(i=>(i+1)%PROMOS.length),4000);return()=>clearInterval(iv);},[]);
  const p=PROMOS[idx];
  return <div style={{background:p.col+'14',borderBottom:`1px solid ${p.col}22`,padding:'8px 16px',textAlign:'center',fontSize:12,color:p.col,fontFamily:FONT,fontWeight:600,letterSpacing:.3,transition:'color .3s'}}>{p.text}</div>;
}

const GAMES=[
  {id:'crash',    label:'Crash',    icon:'🚀',hot:true,  G:Crash},
  {id:'mines',    label:'Mines',    icon:'💣',hot:true,  G:Mines},
  {id:'limbo',    label:'Limbo',    icon:'🌙',isNew:true,G:Limbo},
  {id:'plinko',   label:'Plinko',   icon:'🎯',           G:Plinko},
  {id:'dice',     label:'Dice',     icon:'🎲',           G:Dice},
  {id:'towers',   label:'Towers',   icon:'🗼',isNew:true,G:Towers},
  {id:'keno',     label:'Keno',     icon:'🎱',isNew:true,G:Keno},
  {id:'slots',    label:'Slots',    icon:'🎰',           G:Slots},
  {id:'hilo',     label:'Hi-Lo',    icon:'🃏',           G:HiLo},
  {id:'wheel',    label:'Wheel',    icon:'🎡',           G:Wheel},
  {id:'blackjack',label:'Blackjack',icon:'♠️',           G:Blackjack},
  {id:'roulette', label:'Roulette', icon:'⚫',           G:Roulette},
];

export default function App(){
  const [view,setView]       = useState('landing');
  const [game,setGame]       = useState('crash');
  // Auth
  const [user,setUser]       = useState(null);
  const [token,setToken]     = useState(()=>localStorage.getItem('rizk_token'));
  const [showAuth,setShowAuth] = useState(false);
  const [showWallet,setShowWallet] = useState(false);
  const [mode,setMode]       = useState('demo'); // demo | real
  // Balance display
  const [demoBal,setDemoBal] = useState(1.0);
  // UI
  const [flash,setFlash]     = useState(null);
  const [showDep,setShowDep] = useState(false);
  const [showSide,setShowSide]= useState(false);
  const [sideTab,setSideTab] = useState('feed');
  const [soundOn,setSoundOn] = useState(true);
  const [achQ,setAchQ]       = useState([]);
  const [unlocked,setUnl]    = useState(new Set());
  // Session stats
  const [wag,setWag]=useState(0),  [pnl,setPnl]=useState(0);
  const [wins,setWins]=useState(0),[total,setTot]=useState(0);
  const [streak,setStr]=useState(0);
  const flashRef=useRef(null);

  useEffect(()=>{SFX.setEnabled(soundOn);},[soundOn]);

  // Try to restore session
  useEffect(()=>{
    if(!token)return;
    API.me(token).then(d=>{setUser(d.user);setDemoBal(d.user.demo_bal);}).catch(()=>{localStorage.removeItem('rizk_token');setToken(null);});
  },[]);

  const bal = mode==='real' ? (user?.balance_eth||0) : demoBal;

  const logout=()=>{localStorage.removeItem('rizk_token');setToken(null);setUser(null);setMode('demo');};

  const handleAuth=(u,t)=>{setUser(u);setToken(t);setDemoBal(u.demo_bal);setShowAuth(false);setView('game');};

  const trigAch=useCallback((id)=>{
    if(!ACH[id])return;
    setUnl(prev=>{if(prev.has(id))return prev;const ns=new Set(prev);ns.add(id);setTimeout(()=>{setAchQ(q=>[...q,id]);SFX.ach();},100);return ns;});
  },[]);

  const onWin=useCallback(async(amt)=>{
    if(mode==='demo') setDemoBal(b=>parseFloat((b+amt).toFixed(4)));
    else if(user&&token) { API.resolveBet(game,amt,0,amt,mode,token).then(d=>{setUser(u=>({...u,balance_eth:d.new_balance}));}).catch(()=>{}); }
    setWag(w=>parseFloat((w+amt/2).toFixed(4)));
    setPnl(p=>parseFloat((p+amt).toFixed(4)));
    setWins(w=>w+1);setTot(t=>t+1);
    setStr(s=>{const ns=s+1;if(ns>=3)trigAch('win_streak3');return ns;});
    clearTimeout(flashRef.current);setFlash('win');flashRef.current=setTimeout(()=>setFlash(null),900);
    trigAch('first_win');
    if(amt>=.5){SFX.bigWin();trigAch('big_win');}else SFX.win();
  },[mode,user,token,game,trigAch]);

  const onLose=useCallback(async(amt)=>{
    if(mode==='demo') setDemoBal(b=>parseFloat(Math.max(0,b-Math.abs(amt)).toFixed(4)));
    else if(user&&token) { API.resolveBet(game,amt,0,-amt,mode,token).then(d=>{setUser(u=>({...u,balance_eth:d.new_balance}));}).catch(()=>{}); }
    setWag(w=>parseFloat((w+Math.abs(amt)).toFixed(4)));
    setPnl(p=>parseFloat((p-Math.abs(amt)).toFixed(4)));
    setTot(t=>t+1);setStr(0);
    clearTimeout(flashRef.current);setFlash('lose');flashRef.current=setTimeout(()=>setFlash(null),900);
    SFX.lose();
  },[mode,user,token,game]);

  const addDemoFunds=amt=>{setDemoBal(b=>parseFloat((b+amt).toFixed(4)));if(amt>=.5)trigAch('high_roller');};

  if(view==='landing')return <Landing onPlay={()=>setView('game')}/>;

  const bc   =flash==='win'?T.green:flash==='lose'?T.red:T.white;
  const vip  =getVip(user?.total_wagered||wag);
  const wr   =total>0?Math.round(wins/total*100):0;
  const pnlC =pnl>0?T.green:pnl<0?T.red:T.muted;
  const AG   =GAMES.find(g=>g.id===game);

  return(
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:FONT,color:T.text}}>

      {/* Modals */}
      {showAuth  &&<AuthModal onAuth={handleAuth} onClose={()=>setShowAuth(false)}/>}
      {showWallet&&user&&<WalletModal token={token} user={user} onUpdate={u=>{setUser(u);}} onClose={()=>setShowWallet(false)}/>}
      {achQ[0]&&ACH[achQ[0]]&&<AchPopup ach={ACH[achQ[0]]} onClose={()=>setAchQ(q=>q.slice(1))}/>}

      {/* HEADER */}
      <header style={{background:T.bg2,borderBottom:`1px solid ${T.bd}`,height:60,padding:'0 16px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:50,boxShadow:'0 2px 30px rgba(0,0,0,.6)',gap:10}}>

        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <div onClick={()=>setView('landing')} style={{width:38,height:38,borderRadius:11,background:`linear-gradient(135deg,${T.teal},${T.tealD})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:900,color:'#080e1a',boxShadow:`0 0 22px ${T.teal}55`,cursor:'pointer'}}>R</div>
          <div style={{display:'flex',flexDirection:'column',lineHeight:1}}>
            <span style={{fontSize:19,fontWeight:800,color:T.white,letterSpacing:2.5}}>RIZK</span>
            <span style={{fontSize:8,color:T.muted,letterSpacing:1.5}}>CRYPTO CASINO</span>
          </div>
          <div style={{background:vip.c+'22',border:`1px solid ${vip.c}44`,borderRadius:6,padding:'2px 8px',fontSize:10,fontWeight:700,color:vip.c}}>{vip.i} {vip.n}</div>
        </div>

        {/* Balance chip */}
        <div style={{display:'flex',alignItems:'center',gap:8,background:T.bg3,border:`1px solid ${T.bd}`,borderRadius:10,padding:'7px 12px'}}>
          {/* Mode toggle */}
          {user&&<div style={{display:'flex',background:T.bg,borderRadius:6,overflow:'hidden',border:`1px solid ${T.bd}`,marginRight:4}}>
            {[['demo','Demo'],['real','Real']].map(([m,l])=>(
              <button key={m} onClick={()=>setMode(m)} style={{background:mode===m?(m==='demo'?T.green:T.teal)+'22':'transparent',border:'none',color:mode===m?(m==='demo'?T.green:T.teal):T.muted,padding:'5px 10px',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:FONT,transition:'all .15s'}}>{l}</button>
            ))}
          </div>}
          <div style={{width:8,height:8,borderRadius:'50%',background:bc,boxShadow:`0 0 10px ${bc}`,transition:'background .15s'}}/>
          <span style={{fontSize:16,fontWeight:800,color:bc,transition:'color .15s',minWidth:76,fontFamily:MONO,fontVariantNumeric:'tabular-nums'}}>{bal.toFixed(4)}</span>
          <span style={{fontSize:11,color:T.muted}}>ETH</span>
          {mode==='demo'&&<button onClick={()=>setShowDep(v=>!v)} style={{background:T.teal,border:'none',color:'#080e1a',width:24,height:24,borderRadius:6,fontSize:16,cursor:'pointer',fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center',marginLeft:4}}>+</button>}
          {mode==='real'&&user&&<button onClick={()=>setShowWallet(true)} style={{background:T.green+'22',border:`1px solid ${T.green}44`,color:T.green,padding:'4px 10px',fontSize:10,fontWeight:700,cursor:'pointer',borderRadius:6,fontFamily:FONT,marginLeft:4}}>Deposit</button>}
        </div>

        {/* Right */}
        <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
          <button onClick={()=>setSoundOn(v=>!v)} style={{background:'transparent',border:`1px solid ${T.bd}`,color:soundOn?T.teal:T.muted,width:32,height:32,borderRadius:7,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>{soundOn?'🔊':'🔇'}</button>
          <button onClick={()=>setShowSide(v=>!v)} style={{background:showSide?T.teal+'1a':'transparent',border:`1px solid ${showSide?T.teal:T.bd}`,color:showSide?T.teal:T.muted,padding:'7px 12px',fontSize:11,cursor:'pointer',borderRadius:8,fontFamily:FONT,fontWeight:600,transition:'all .15s'}}>{showSide?'✕':'📊 Stats'}</button>
          {user
            ?<div style={{display:'flex',alignItems:'center',gap:6}}>
              <div onClick={()=>setShowWallet(true)} style={{display:'flex',alignItems:'center',gap:7,background:T.bg3,border:`1px solid ${T.green}28`,borderRadius:9,padding:'6px 12px',cursor:'pointer'}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:T.green,boxShadow:`0 0 6px ${T.green}`}}/>
                <span style={{fontSize:11,color:T.green,fontWeight:700,fontFamily:FONT}}>{user.username}</span>
              </div>
              <button onClick={logout} style={{background:'transparent',border:`1px solid ${T.bd}`,color:T.muted,padding:'6px 10px',fontSize:11,cursor:'pointer',borderRadius:7,fontFamily:FONT}}>Log out</button>
            </div>
            :<button onClick={()=>setShowAuth(true)} style={{background:`linear-gradient(135deg,${T.teal},${T.tealD})`,border:'none',color:'#080e1a',padding:'9px 18px',fontSize:12,fontWeight:800,cursor:'pointer',borderRadius:9,boxShadow:`0 0 20px ${T.teal}33`,fontFamily:FONT}}>Log In / Sign Up</button>
          }
        </div>
      </header>

      <PromoBanner/>

      {/* Demo deposit bar */}
      {showDep&&mode==='demo'&&(
        <div style={{background:T.bg2,borderBottom:`1px solid ${T.bd}`,padding:'10px 16px',display:'flex',gap:8,alignItems:'center',justifyContent:'center',flexWrap:'wrap'}}>
          <span style={{fontSize:13,color:T.muted,fontFamily:FONT}}>Add demo funds:</span>
          {[0.1,0.5,1,2,5].map(v=><button key={v} onClick={()=>{addDemoFunds(v);setShowDep(false);}} style={{background:T.bg3,border:`1px solid ${T.bd}`,color:T.teal,padding:'8px 14px',fontSize:12,fontWeight:700,cursor:'pointer',borderRadius:8,fontFamily:MONO}}>{v}Ξ</button>)}
          <button onClick={()=>setShowDep(false)} style={{background:'transparent',border:`1px solid ${T.bd}`,color:T.muted,padding:'8px 12px',fontSize:12,cursor:'pointer',borderRadius:8}}>✕</button>
        </div>
      )}

      {/* Game nav */}
      <nav style={{background:T.bg2,borderBottom:`1px solid ${T.bd}`,display:'flex',overflowX:'auto',padding:'0 8px'}}>
        {GAMES.map(g=>(
          <button key={g.id} onClick={()=>{setGame(g.id);SFX.click();}} style={{background:'transparent',border:'none',borderBottom:`2px solid ${game===g.id?T.teal:'transparent'}`,color:game===g.id?T.teal:T.muted,padding:'12px 14px',fontSize:13,fontWeight:game===g.id?700:400,cursor:'pointer',flexShrink:0,fontFamily:FONT,transition:'all .15s',whiteSpace:'nowrap',position:'relative'}}>
            {g.icon} {g.label}
            {g.hot&&game!==g.id&&<span style={{position:'absolute',top:7,right:3,width:5,height:5,borderRadius:'50%',background:T.red,boxShadow:`0 0 5px ${T.red}`}}/>}
            {g.isNew&&<span style={{marginLeft:4,fontSize:7,background:T.green+'22',color:T.green,border:`1px solid ${T.green}33`,borderRadius:3,padding:'1px 4px',fontWeight:700,verticalAlign:'middle'}}>NEW</span>}
          </button>
        ))}
      </nav>

      {/* MAIN */}
      <main style={{maxWidth:1200,margin:'0 auto',padding:'16px 16px 60px',display:'grid',gridTemplateColumns:showSide?'1fr 300px':'1fr',gap:18,alignItems:'start'}}>
        <div>
          {mode==='demo'&&<DailyBonus onClaim={addDemoFunds}/>}

          {/* Real money CTA if not logged in */}
          {!user&&mode==='demo'&&(
            <div style={{...PNL,marginBottom:14,background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,border:`1px solid ${T.teal}33`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',gap:12}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.white,fontFamily:FONT,marginBottom:4}}>🔐 Play with Real ETH</div>
                <div style={{fontSize:11,color:T.muted,fontFamily:FONT}}>Create a free account to deposit ETH and track your balance</div>
              </div>
              <button onClick={()=>setShowAuth(true)} style={{background:`linear-gradient(135deg,${T.teal},${T.tealD})`,border:'none',color:'#080e1a',padding:'10px 18px',fontSize:12,fontWeight:800,cursor:'pointer',borderRadius:9,fontFamily:FONT,flexShrink:0}}>Sign Up Free</button>
            </div>
          )}

          {/* Session stats */}
          <div style={{...PNL,marginBottom:14,padding:'12px 16px'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
              {[
                {l:'Wagered',  v:`${parseFloat(wag).toFixed(4)}Ξ`, c:T.teal},
                {l:'P&L',      v:`${pnl>=0?'+':''}${parseFloat(pnl).toFixed(4)}Ξ`, c:pnlC},
                {l:'Win Rate', v:`${wr}%`,    c:wr>50?T.green:T.red},
                {l:'Rounds',   v:total,        c:T.text},
                {l:'Streak 🔥',v:streak||'—', c:streak>=3?T.orange:T.muted},
              ].map(s=>(
                <div key={s.l} style={{textAlign:'center',background:T.bg3,borderRadius:9,padding:'9px 5px',border:`1px solid ${T.bd}`}}>
                  <div style={{fontSize:8,color:T.muted,fontFamily:FONT,marginBottom:3,letterSpacing:.8,textTransform:'uppercase',fontWeight:600}}>{s.l}</div>
                  <div style={{fontSize:13,fontWeight:700,color:s.c,fontFamily:MONO,fontVariantNumeric:'tabular-nums'}}>{s.v}</div>
                </div>
              ))}
            </div>
            {unlocked.size>0&&<div style={{marginTop:10,display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
              {[...unlocked].map(id=>ACH[id]&&<span key={id} title={ACH[id].t} style={{fontSize:16,cursor:'default'}}>{ACH[id].i}</span>)}
              <span style={{fontSize:10,color:T.muted,fontFamily:FONT,marginLeft:2}}>{unlocked.size} achievement{unlocked.size>1?'s':''}</span>
            </div>}
            {/* Mode badge */}
            <div style={{marginTop:10,display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:10,color:T.muted,fontFamily:FONT}}>Playing in:</span>
              <span style={{fontSize:10,fontWeight:700,color:mode==='demo'?T.green:T.teal,background:(mode==='demo'?T.green:T.teal)+'18',border:`1px solid ${(mode==='demo'?T.green:T.teal)}33`,padding:'2px 9px',borderRadius:10,fontFamily:FONT}}>{mode==='demo'?'Demo Mode':'Real Money Mode'}</span>
              {!user&&<span style={{fontSize:10,color:T.muted,fontFamily:FONT}}>— <span onClick={()=>setShowAuth(true)} style={{color:T.teal,cursor:'pointer',fontWeight:600}}>Sign up</span> to play for real</span>}
            </div>
          </div>

          {AG&&<AG.G bal={bal} onWin={onWin} onLose={onLose}/>}
        </div>

        {showSide&&(
          <div style={{position:'sticky',top:76,display:'flex',flexDirection:'column',gap:14}}>
            <div style={{background:T.bg2,border:`1px solid ${T.bd}`,borderRadius:12,overflow:'hidden'}}>
              <div style={{display:'flex',borderBottom:`1px solid ${T.bd}`}}>
                {[['feed','📊 Feed'],['leaderboard','🏆 Leaders'],['rakeback','💸 Rakeback']].map(([k,l])=>(
                  <button key={k} onClick={()=>setSideTab(k)} style={{flex:1,background:'transparent',border:'none',borderBottom:`2px solid ${sideTab===k?T.teal:'transparent'}`,color:sideTab===k?T.teal:T.muted,padding:'10px 0',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:FONT,transition:'all .15s'}}>{l}</button>
                ))}
              </div>
              {sideTab==='feed'        &&<LivePanel/>}
              {sideTab==='leaderboard' &&<Leaderboard myWins={wins} myWag={wag} myPnl={pnl}/>}
              {sideTab==='rakeback'    &&<div style={{padding:14}}><Rakeback wagered={wag} onClaim={addDemoFunds}/></div>}
            </div>
          </div>
        )}
      </main>

      <footer style={{textAlign:'center',paddingBottom:32,fontSize:11,color:T.muted,fontFamily:FONT,lineHeight:1.8}}>
        RIZK Casino · {GAMES.length} games · <span style={{cursor:'pointer',color:T.teal}} onClick={()=>setView('landing')}>Landing Page</span><br/>
        <span style={{fontSize:10}}>Space = Crash cashout · Real ETH requires account · Provably fair</span>
      </footer>

      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        input[type=number]{-moz-appearance:textfield;}
        input:focus{border-color:${T.teal}!important;box-shadow:0 0 0 2px ${T.teal}1a;}
        ::-webkit-scrollbar{height:4px;width:4px;}
        ::-webkit-scrollbar-track{background:${T.bg};}
        ::-webkit-scrollbar-thumb{background:${T.bd};border-radius:2px;}
        @keyframes glow{0%,100%{box-shadow:0 4px 24px ${T.green}44;}50%{box-shadow:0 4px 44px ${T.green}99;}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
        @keyframes fadein{from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:translateY(0);}}
        @keyframes bigwin{0%{transform:scale(.88);opacity:.5;}60%{transform:scale(1.05);}100%{transform:scale(1);opacity:1;}}
        @keyframes achslide{0%{transform:translateX(130%);opacity:0;}100%{transform:translateX(0);opacity:1;}}
        @keyframes rspin{0%{transform:translateY(0);}50%{transform:translateY(-62px);}100%{transform:translateY(0);}}
        @keyframes fadeup{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
      `}</style>
    </div>
  );
}

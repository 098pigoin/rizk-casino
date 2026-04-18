import { useState, useEffect } from 'react';
import { T, FONT, MONO, INP } from './shared.jsx';
import { API, ApiError } from './api.js';

export default function WalletModal({ token, user, onUpdate, onClose }) {
  const [tab, setTab]           = useState('deposit');
  const [depAddr, setDepAddr]   = useState('');
  const [txHash, setTxHash]     = useState('');
  const [toAddr, setToAddr]     = useState('');
  const [wdAmt, setWdAmt]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState(null); // {type:'ok'|'err', text}
  const [deposits, setDeposits] = useState([]);
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    // Load deposit address
    API.depositAddress(token).then(d => setDepAddr(d.address)).catch(() => {});
    // Load deposit history
    API.depositHistory(token).then(d => setDeposits(d.deposits || [])).catch(() => {});
  }, [token]);

  const copyAddr = () => {
    navigator.clipboard.writeText(depAddr);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const sendMetaMask = async () => {
    if (!window.ethereum) return setMsg({ type: 'err', text: 'MetaMask not found. Install MetaMask to deposit.' });
    if (!depAddr) return setMsg({ type: 'err', text: 'No deposit address. Try again.' });
    try {
      setLoading(true); setMsg(null);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts[0];
      // Ask user how much to deposit
      const amtInput = prompt('How much ETH do you want to deposit? (min 0.001)');
      if (!amtInput) { setLoading(false); return; }
      const amt = parseFloat(amtInput);
      if (isNaN(amt) || amt < 0.001) { setMsg({ type: 'err', text: 'Minimum deposit is 0.001 ETH' }); setLoading(false); return; }
      const weiHex = '0x' + BigInt(Math.floor(amt * 1e18)).toString(16);
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from, to: depAddr, value: weiHex }],
      });
      setTxHash(txHash);
      setMsg({ type: 'ok', text: `Transaction sent! Hash: ${txHash.slice(0,18)}…\nClick "Verify Deposit" once it confirms (~30 seconds).` });
    } catch (e) {
      if (e.code === 4001) setMsg({ type: 'err', text: 'Transaction cancelled.' });
      else setMsg({ type: 'err', text: e.message });
    } finally { setLoading(false); }
  };

  const verifyDeposit = async () => {
    if (!txHash.trim()) return setMsg({ type: 'err', text: 'Paste your transaction hash first.' });
    setLoading(true); setMsg(null);
    try {
      const data = await API.verifyDeposit(txHash.trim(), token);
      setMsg({ type: 'ok', text: `✅ Deposit confirmed! +${data.amount} ETH credited to your account.` });
      onUpdate(data.user);
      setTxHash('');
      const d = await API.depositHistory(token);
      setDeposits(d.deposits || []);
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally { setLoading(false); }
  };

  const doWithdraw = async () => {
    const amt = parseFloat(wdAmt);
    if (!toAddr || !amt) return setMsg({ type: 'err', text: 'Enter address and amount.' });
    if (amt > user.balance_eth) return setMsg({ type: 'err', text: 'Insufficient real balance.' });
    setLoading(true); setMsg(null);
    try {
      const data = await API.withdraw(toAddr, amt, token);
      setMsg({ type: 'ok', text: `✅ Withdrawal submitted! ${amt} ETH will arrive within 24h.` });
      onUpdate({ ...user, balance_eth: data.new_balance });
      setWdAmt(''); setToAddr('');
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: T.bg2, border: `1px solid ${T.bd}`, borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,.6)', animation: 'fadeup .25s ease-out' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.white, fontFamily: FONT }}>💰 Wallet</div>
            <div style={{ fontSize: 12, color: T.muted, fontFamily: FONT, marginTop: 2 }}>
              Real: <b style={{ color: T.teal, fontFamily: MONO }}>{user.balance_eth?.toFixed(4)} ETH</b>
              {' '}· Demo: <b style={{ color: T.green, fontFamily: MONO }}>{user.demo_bal?.toFixed(4)} ETH</b>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: T.muted, fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.bd}` }}>
          {[['deposit','⬇ Deposit'],['withdraw','⬆ Withdraw'],['history','📋 History']].map(([k,l]) => (
            <button key={k} onClick={() => { setTab(k); setMsg(null); }} style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: `2px solid ${tab===k?T.teal:'transparent'}`, color: tab===k?T.teal:T.muted, padding: '12px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, transition: 'all .15s' }}>{l}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* DEPOSIT */}
          {tab === 'deposit' && <>
            <div style={{ background: T.teal + '10', border: `1px solid ${T.teal}22`, borderRadius: 10, padding: '14px', marginBottom: 18, fontSize: 13, color: T.text, fontFamily: FONT, lineHeight: 1.6 }}>
              💡 Send ETH to your personal deposit address below. It will be credited to your RIZK balance automatically after 1 confirmation.
            </div>

            {depAddr ? (<>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Your Deposit Address (Ethereum Mainnet)</div>
                <div style={{ background: T.bg3, border: `1px solid ${T.bd}`, borderRadius: 9, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 12, color: T.white, fontFamily: MONO, wordBreak: 'break-all', letterSpacing: 0.5 }}>{depAddr}</span>
                  <button onClick={copyAddr} style={{ background: copied ? T.green + '22' : T.bg4, border: `1px solid ${copied ? T.green : T.bd}`, color: copied ? T.green : T.muted, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', borderRadius: 7, fontFamily: FONT, flexShrink: 0, transition: 'all .2s' }}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <button onClick={sendMetaMask} disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 9, border: 'none', background: loading ? T.bg3 : `linear-gradient(135deg,${T.teal},${T.tealD})`, color: loading ? T.muted : '#080e1a', fontSize: 14, fontWeight: 800, cursor: loading ? 'wait' : 'pointer', fontFamily: FONT, marginBottom: 14, boxShadow: loading ? 'none' : `0 0 20px ${T.teal}44` }}>
                {loading ? 'Waiting...' : '🦊 Send via MetaMask'}
              </button>

              <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT, textAlign: 'center', marginBottom: 14 }}>— or paste transaction hash manually —</div>

              <div style={{ marginBottom: 10 }}>
                <input placeholder="Paste tx hash: 0x..." value={txHash} onChange={e => setTxHash(e.target.value)} style={{ ...INP, padding: '11px 14px', fontSize: 13 }} />
              </div>
              <button onClick={verifyDeposit} disabled={loading || !txHash.trim()} style={{ width: '100%', padding: '12px', borderRadius: 9, border: `1px solid ${txHash.trim() ? T.teal : T.bd}`, background: txHash.trim() ? T.teal + '1a' : T.bg3, color: txHash.trim() ? T.teal : T.muted, fontSize: 13, fontWeight: 700, cursor: txHash.trim() ? 'pointer' : 'not-allowed', fontFamily: FONT }}>
                Verify Deposit
              </button>
            </>) : <div style={{ color: T.muted, fontFamily: FONT, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Generating deposit address...</div>}
          </>}

          {/* WITHDRAW */}
          {tab === 'withdraw' && <>
            <div style={{ background: T.red + '10', border: `1px solid ${T.red}22`, borderRadius: 10, padding: '14px', marginBottom: 18, fontSize: 13, color: T.text, fontFamily: FONT, lineHeight: 1.6 }}>
              ⚠️ Withdrawals are processed within 24 hours. Minimum: 0.005 ETH. Make sure your address is correct.
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 }}>Your Ethereum Address</div>
              <input placeholder="0x..." value={toAddr} onChange={e => setToAddr(e.target.value)} style={{ ...INP, padding: '12px 14px' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7, display: 'flex', justifyContent: 'space-between' }}>
                <span>Amount</span>
                <span>Balance: <b style={{ color: T.teal }}>{user.balance_eth?.toFixed(4)} ETH</b></span>
              </div>
              <div style={{ position: 'relative' }}>
                <input type="number" placeholder="0.01" min="0.005" step="0.001" value={wdAmt} onChange={e => setWdAmt(e.target.value)} style={{ ...INP, padding: '12px 50px 12px 14px' }} />
                <button onClick={() => setWdAmt(String(user.balance_eth?.toFixed(4)))} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: T.bd, border: 'none', color: T.teal, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: MONO }}>MAX</button>
              </div>
            </div>
            <button onClick={doWithdraw} disabled={loading || !toAddr || !wdAmt} style={{ width: '100%', padding: '13px', borderRadius: 9, border: 'none', background: !toAddr||!wdAmt ? T.bg3 : `linear-gradient(135deg,${T.green},${T.greenD})`, color: !toAddr||!wdAmt ? T.muted : '#080e1a', fontSize: 14, fontWeight: 800, cursor: !toAddr||!wdAmt ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
              {loading ? 'Processing...' : 'Withdraw ETH'}
            </button>
          </>}

          {/* HISTORY */}
          {tab === 'history' && <>
            {deposits.length === 0
              ? <div style={{ textAlign: 'center', padding: '32px 0', color: T.muted, fontSize: 13, fontFamily: FONT }}>No deposits yet</div>
              : deposits.map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.bd}18` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.white, fontFamily: FONT }}>+{d.amount_eth?.toFixed(4)} ETH</div>
                    <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT }}>{new Date(d.created_at * 1000).toLocaleDateString()}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: d.status === 'confirmed' ? T.green : T.gold, background: (d.status === 'confirmed' ? T.green : T.gold) + '18', padding: '3px 10px', borderRadius: 5, fontFamily: FONT }}>
                    {d.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
                  </span>
                </div>
              ))
            }
          </>}

          {/* Message */}
          {msg && (
            <div style={{ marginTop: 14, background: msg.type === 'ok' ? T.green + '14' : T.red + '14', border: `1px solid ${msg.type === 'ok' ? T.green : T.red}33`, borderRadius: 9, padding: '12px 14px', fontSize: 13, color: msg.type === 'ok' ? T.green : T.red, fontFamily: FONT, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
              {msg.text}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeup { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
      `}</style>
    </div>
  );
}

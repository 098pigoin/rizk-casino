import { useState } from 'react';
import { T, FONT, MONO, INP } from './shared.jsx';
import { API, ApiError } from './api.js';

export default function AuthModal({ onAuth, onClose }) {
  const [tab, setTab]         = useState('login');   // login | register
  const [login, setLogin]     = useState('');
  const [email, setEmail]     = useState('');
  const [username, setUname]  = useState('');
  const [password, setPass]   = useState('');
  const [showPass, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      let data;
      if (tab === 'login') {
        data = await API.login(login, password);
      } else {
        data = await API.register(email, username, password);
      }
      localStorage.setItem('rizk_token', data.token);
      onAuth(data.user, data.token);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: T.bg2, border: `1px solid ${T.bd}`, borderRadius: 16, width: '100%', maxWidth: 420, padding: '28px 28px 24px', boxShadow: '0 24px 80px rgba(0,0,0,.6)', animation: 'fadeup .25s ease-out' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${T.teal},${T.tealD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#080e1a' }}>R</div>
            <span style={{ fontSize: 18, fontWeight: 800, color: T.white, fontFamily: FONT, letterSpacing: 2 }}>RIZK</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: T.muted, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: T.bg3, borderRadius: 9, padding: 4, marginBottom: 24, gap: 4 }}>
          {[['login', 'Log In'], ['register', 'Create Account']].map(([k, l]) => (
            <button key={k} onClick={() => { setTab(k); setError(''); }} style={{ flex: 1, background: tab === k ? T.teal : 'transparent', color: tab === k ? '#080e1a' : T.muted, border: 'none', borderRadius: 7, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, transition: 'all .15s' }}>{l}</button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={submit}>
          {tab === 'register' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: T.muted, fontFamily: FONT, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Email</label>
              <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ ...INP, padding: '12px 14px' }} />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: T.muted, fontFamily: FONT, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              {tab === 'login' ? 'Email or Username' : 'Username'}
            </label>
            <input
              type="text"
              placeholder={tab === 'login' ? 'email or username' : 'your_username'}
              value={tab === 'login' ? login : username}
              onChange={e => tab === 'login' ? setLogin(e.target.value) : setUname(e.target.value)}
              required
              style={{ ...INP, padding: '12px 14px' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, color: T.muted, fontFamily: FONT, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder={tab === 'register' ? 'at least 6 characters' : 'your password'}
                value={password}
                onChange={e => setPass(e.target.value)}
                required minLength={6}
                style={{ ...INP, padding: '12px 44px 12px 14px' }}
              />
              <button type="button" onClick={() => setShow(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 14 }}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: T.red + '16', border: `1px solid ${T.red}33`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: T.red, fontFamily: FONT }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: loading ? T.bg3 : `linear-gradient(135deg,${T.teal},${T.tealD})`, color: loading ? T.muted : '#080e1a', fontSize: 15, fontWeight: 800, cursor: loading ? 'wait' : 'pointer', fontFamily: FONT, boxShadow: loading ? 'none' : `0 0 24px ${T.teal}44`, transition: 'all .15s' }}>
            {loading ? '...' : tab === 'login' ? 'Log In →' : 'Create Account →'}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: 'center', fontSize: 12, color: T.muted, fontFamily: FONT }}>
          {tab === 'login'
            ? <>No account? <button onClick={() => { setTab('register'); setError(''); }} style={{ background: 'none', border: 'none', color: T.teal, cursor: 'pointer', fontWeight: 700, fontFamily: FONT }}>Create one</button></>
            : <>Already registered? <button onClick={() => { setTab('login'); setError(''); }} style={{ background: 'none', border: 'none', color: T.teal, cursor: 'pointer', fontWeight: 700, fontFamily: FONT }}>Log in</button></>
          }
        </div>

        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: T.muted, fontFamily: FONT }}>
          🔒 Secure · No credit card required · Demo play free
        </div>
      </div>

      <style>{`
        @keyframes fadeup { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
      `}</style>
    </div>
  );
}

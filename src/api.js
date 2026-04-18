const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(msg, status) { super(msg); this.status = status; }
}

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError(data.error || 'Request failed', res.status);
  return data;
}

export const API = {
  // Auth
  register:  (email, username, password) => req('POST', '/api/auth/register', { email, username, password }),
  login:     (login, password)           => req('POST', '/api/auth/login',    { login, password }),
  me:        (token)                     => req('GET',  '/api/auth/me',       null, token),

  // Wallet
  depositAddress: (token)         => req('GET',  '/api/wallet/deposit-address', null, token),
  verifyDeposit:  (tx_hash, token)=> req('POST', '/api/wallet/deposit/verify', { tx_hash }, token),
  withdraw:       (to, amt, token)=> req('POST', '/api/wallet/withdraw', { to_address: to, amount_eth: amt }, token),
  balance:        (token)         => req('GET',  '/api/wallet/balance', null, token),
  depositHistory: (token)         => req('GET',  '/api/wallet/deposits', null, token),

  // Games
  placeBet:   (game, amount, mode, token) => req('POST', '/api/games/bet',     { game, amount, mode }, token),
  resolveBet: (game, bet, mult, pnl, mode, token) => req('POST', '/api/games/resolve', { game, bet_amount: bet, multiplier: mult, pnl, mode }, token),
  history:    (token) => req('GET', '/api/games/history', null, token),
  leaderboard:(period) => req('GET', `/api/games/leaderboard?period=${period}`),
  stats:      (token) => req('GET', '/api/games/stats', null, token),
};

export { ApiError };

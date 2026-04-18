const BASE = import.meta.env.VITE_API_URL || 'https://web-production-0fbcf.up.railway.app';

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

async function req(path, opts = {}) {
  const token = localStorage.getItem('rizk_token');
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError(data.error || 'Request failed', res.status);
  return data;
}

export const API = {
  login: (login, password) => req('/api/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) }),
  register: (email, username, password) => req('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, username, password }) }),
  getMe: () => req('/api/auth/me'),
  placeBet: (game, amount, mode) => req('/api/games/bet', { method: 'POST', body: JSON.stringify({ game, amount, mode }) }),
  resolveGame: (game, bet_amount, multiplier, pnl, mode) => req('/api/games/resolve', { method: 'POST', body: JSON.stringify({ game, bet_amount, multiplier, pnl, mode }) }),
  getHistory: () => req('/api/games/history'),
  getLeaderboard: (period = 'today') => req(`/api/games/leaderboard?period=${period}`),
  getStats: () => req('/api/games/stats'),
  getDepositAddress: () => req('/api/wallet/deposit-address'),
  verifyDeposit: (tx_hash) => req('/api/wallet/deposit/verify', { method: 'POST', body: JSON.stringify({ tx_hash }) }),
  withdraw: (to_address, amount_eth) => req('/api/wallet/withdraw', { method: 'POST', body: JSON.stringify({ to_address, amount_eth }) }),
  getBalance: () => req('/api/wallet/balance'),
  getDeposits: () => req('/api/wallet/deposits'),
};

export default API;

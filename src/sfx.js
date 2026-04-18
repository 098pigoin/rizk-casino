// Sound engine — zero dependencies, Web Audio API only
let ctx = null;
let enabled = true;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function tone(freq, type, duration, vol = 0.15, delay = 0) {
  if (!enabled) return;
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
    gain.gain.setValueAtTime(vol, ac.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration);
    osc.start(ac.currentTime + delay);
    osc.stop(ac.currentTime + delay + duration + 0.05);
  } catch(e) {}
}

function noise(duration, vol = 0.05) {
  if (!enabled) return;
  try {
    const ac = getCtx();
    const bufSize = ac.sampleRate * duration;
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    const gain = ac.createGain();
    src.buffer = buf; src.connect(gain); gain.connect(ac.destination);
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    src.start(); src.stop(ac.currentTime + duration + 0.05);
  } catch(e) {}
}

export const SFX = {
  setEnabled: (v) => { enabled = v; },
  isEnabled: () => enabled,

  click: ()    => tone(800, 'sine', 0.08, 0.1),
  betPlace: () => { tone(440, 'sine', 0.1, 0.12); tone(660, 'sine', 0.1, 0.08, 0.05); },
  tick: ()     => tone(1200, 'square', 0.03, 0.05),

  win: () => {
    tone(523, 'sine', 0.12, 0.15);
    tone(659, 'sine', 0.12, 0.15, 0.1);
    tone(784, 'sine', 0.15, 0.18, 0.2);
  },
  bigWin: () => {
    [523,659,784,1047].forEach((f,i) => tone(f, 'sine', 0.18, 0.2, i*0.08));
  },
  lose: () => {
    tone(200, 'sawtooth', 0.15, 0.1);
    tone(150, 'sawtooth', 0.2, 0.1, 0.1);
  },
  crash: () => {
    tone(300, 'sawtooth', 0.05, 0.2);
    tone(200, 'sawtooth', 0.05, 0.2, 0.05);
    tone(120, 'sawtooth', 0.3, 0.15, 0.1);
    noise(0.3, 0.08);
  },
  cashout: () => {
    tone(880, 'sine', 0.08, 0.2);
    tone(1100, 'sine', 0.1, 0.18, 0.06);
    tone(1320, 'sine', 0.12, 0.2, 0.12);
  },
  flip: () => noise(0.04, 0.03),
  spin: () => { for(let i=0;i<3;i++) tone(200+i*80,'square',0.04,0.04,i*0.04); },
  slotStop: () => tone(600,'square',0.06,0.12),
  ach: () => {
    [659,784,880,1047].forEach((f,i) => tone(f,'sine',0.15,0.18,i*0.07));
  },
  plinko: () => tone(800+Math.random()*400,'sine',0.06,0.08),
  mine: () => { noise(0.1,0.15); tone(100,'sawtooth',0.2,0.2,0.05); },
};

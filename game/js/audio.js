// Ember & Thyme — kitchen sounds, synthesized in the browser.
// No audio files: every sound is an oscillator or a short burst of filtered
// noise from the Web Audio API, so the game loads nothing over the network.

let ctx = null;

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext ?? window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.12, slideTo = null) {
  const ac = audioCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
  gain.gain.setValueAtTime(vol, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + dur);
}

function noiseBurst(dur, vol = 0.08, lowpass = 1200) {
  const ac = audioCtx();
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const gain = ac.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
}

export function sfx(name) {
  if (name === 'sizzle') noiseBurst(0.35, 0.07, 2400);
  else if (name === 'pick') tone(520, 0.07, 'triangle', 0.1);
  else if (name === 'chop') { noiseBurst(0.09, 0.14, 900); tone(180, 0.06, 'square', 0.05); }
  else if (name === 'flip') tone(300, 0.1, 'triangle', 0.1, 620);
  else if (name === 'serve') { tone(660, 0.1, 'sine', 0.12); setTimeout(() => tone(880, 0.16, 'sine', 0.12), 90); }
  else if (name === 'error') tone(160, 0.12, 'sawtooth', 0.06);
  else if (name === 'bin') noiseBurst(0.16, 0.1, 500);
  else if (name === 'win') { [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'sine', 0.12), i * 130)); }
  else if (name === 'lose') { [392, 330, 262].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'sine', 0.1), i * 150)); }
}

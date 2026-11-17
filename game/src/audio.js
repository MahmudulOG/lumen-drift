// All sound is synthesised with WebAudio: no audio files, nothing to load.
// Short oscillator blips for game events, pitched up as the combo climbs, and
// a quiet two-note pad loop under play. The context is created lazily on the
// first user gesture, as browsers require.

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  let padTimer = null;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    return true;
  }

  function tone(freqFrom, freqTo, seconds, type, volume, when = 0) {
    if (!ensure()) return;
    const start = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), start + seconds);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain).connect(master);
    osc.start(start);
    osc.stop(start + seconds + 0.02);
  }

  function startPad() {
    if (padTimer !== null || !ensure()) return;
    const notes = [196.0, 246.94, 293.66, 392.0]; // G3 B3 D4 G4
    let i = 0;
    const tick = () => {
      if (!muted) tone(notes[i % notes.length], notes[i % notes.length], 1.6, 'sine', 0.035);
      i += 1;
      padTimer = window.setTimeout(tick, 1400);
    };
    tick();
  }

  function stopPad() {
    if (padTimer !== null) window.clearTimeout(padTimer);
    padTimer = null;
  }

  return {
    unlock() { ensure(); },
    setMuted(value) {
      muted = value;
      if (master) master.gain.value = value ? 0 : 0.5;
    },
    isMuted() { return muted; },
    startPad,
    stopPad,
    collect(combo) {
      const step = Math.min(combo, 12);
      const base = 620 * Math.pow(2, step / 12);
      tone(base, base * 1.5, 0.12, 'sine', 0.16);
      tone(base * 2, base * 2, 0.06, 'triangle', 0.05);
    },
    bright() {
      tone(880, 1320, 0.16, 'sine', 0.16);
      tone(1320, 1760, 0.2, 'sine', 0.1, 0.05);
    },
    shard() {
      [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, f, 0.14, 'sine', 0.11, i * 0.05));
    },
    dash() { tone(280, 920, 0.16, 'triangle', 0.1); },
    phase() {
      tone(330, 330, 0.3, 'sine', 0.09);
      tone(415, 415, 0.36, 'sine', 0.08, 0.12);
    },
    banish() { tone(340, 90, 0.14, 'square', 0.06); },
    pulse() {
      tone(220, 660, 0.22, 'sine', 0.14);
      tone(110, 330, 0.22, 'triangle', 0.08);
    },
    denied() { tone(160, 120, 0.09, 'square', 0.05); },
    hit() {
      tone(300, 55, 0.3, 'sawtooth', 0.16);
      tone(90, 40, 0.34, 'square', 0.1);
    },
    start() {
      tone(392, 392, 0.1, 'sine', 0.12);
      tone(523, 523, 0.1, 'sine', 0.12, 0.09);
      tone(659, 659, 0.16, 'sine', 0.12, 0.18);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.22, 'sine', 0.13, i * 0.11));
    },
    lose() {
      [392, 330, 262, 196].forEach((f, i) => tone(f, f * 0.94, 0.24, 'triangle', 0.12, i * 0.13));
    },
  };
}

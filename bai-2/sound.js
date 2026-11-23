'use strict';
(() => {
  let ctx = null;
  let muted = false;

  function audio() {
    if (muted) return null;
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    } catch {
      return null;
    }
  }

  function tone(freq, delay, dur, type = 'sine', vol = 0.08, endFreq = null) {
    const c = audio();
    if (!c) return;
    try {
      const now = c.currentTime + delay;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, now + dur);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.014);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    } catch {}
  }

  const presets = {
    pop: () => tone(520, 0, 0.09, 'triangle', 0.09, 760),
    step: () => {
      tone(440, 0, 0.08, 'sine', 0.06);
      tone(587, 0.07, 0.11, 'sine', 0.07);
    },
    scan: () => {
      tone(392, 0, 0.08, 'sine', 0.04, 523);
    },
    done: () => {
      tone(523.25, 0, 0.12, 'triangle', 0.08);
      tone(659.25, 0.09, 0.12, 'triangle', 0.08);
      tone(783.99, 0.18, 0.22, 'triangle', 0.09);
    },
    guess: () => {
      tone(440, 0, 0.1, 'sine', 0.07);
      tone(554.37, 0.09, 0.14, 'sine', 0.08);
    },
    happy: () => {
      tone(523.25, 0, 0.1, 'triangle', 0.09);
      tone(659.25, 0.08, 0.1, 'triangle', 0.09);
      tone(783.99, 0.16, 0.11, 'triangle', 0.09);
      tone(1046.5, 0.25, 0.24, 'triangle', 0.1);
    },
    oops: () => {
      tone(349.23, 0, 0.14, 'sine', 0.07, 293.66);
      tone(277.18, 0.13, 0.2, 'sine', 0.06, 246.94);
    },
    shutter: () => {
      tone(880, 0, 0.035, 'square', 0.05, 420);
      tone(1240, 0.03, 0.04, 'triangle', 0.05, 620);
    }
  };

  window.MitSound = {
    play(name) {
      if (muted) return;
      presets[name]?.();
    },
    isMuted() {
      return muted;
    },
    setMuted(next) {
      muted = !!next;
      if (!muted) presets.step();
      return muted;
    }
  };
})();

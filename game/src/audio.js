// All sound is synthesized with WebAudio: no audio files, nothing to load.
// A SoundKeeper owns the context, the mute flag and every little tune.

export class SoundKeeper {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.padTimer = 0;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    this.ctx = new AC();
    return true;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, dur, type = 'sine', vol = 0.16, slideTo = null, delay = 0) {
    if (this.muted || !this.ensure()) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  collect() {
    this.tone(880, 0.1, 'sine', 0.14);
    this.tone(1318, 0.14, 'sine', 0.12, null, 0.06);
  }

  shell() {
    this.tone(523, 0.1, 'triangle', 0.16);
    this.tone(784, 0.16, 'triangle', 0.14, null, 0.07);
  }

  heal() {
    this.tone(659, 0.12, 'sine', 0.14);
    this.tone(880, 0.2, 'sine', 0.14, null, 0.09);
  }

  sting() {
    this.tone(220, 0.22, 'sawtooth', 0.13, 82);
  }

  dash() {
    this.tone(340, 0.14, 'sine', 0.08, 720);
  }

  levelUp() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((n, i) => this.tone(n, 0.14, 'triangle', 0.13, null, i * 0.07));
  }

  win() {
    const notes = [523, 659, 784, 1046, 784, 1046, 1318];
    notes.forEach((n, i) => this.tone(n, 0.22, 'triangle', 0.14, null, i * 0.11));
  }

  lose() {
    const notes = [392, 330, 262, 196];
    notes.forEach((n, i) => this.tone(n, 0.26, 'triangle', 0.13, null, i * 0.14));
  }

  // A slow two-note lagoon pad that loops quietly while playing.
  padStep(dt, playing) {
    if (!playing || this.muted || !this.ctx) return;
    this.padTimer -= dt;
    if (this.padTimer <= 0) {
      this.padTimer = 2.4;
      this.tone(196, 2.2, 'sine', 0.035);
      this.tone(294, 2.2, 'sine', 0.028, null, 0.4);
    }
  }
}

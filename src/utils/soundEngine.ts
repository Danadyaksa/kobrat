"use client";

// Zero-asset Web Audio API tactile analog sound synthesizer for Kobrat
// Crafted after mechanical 35mm rangefinder shutters, cord plucks, and rotary detents.

class KobratSoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = false;
  private lastTickAt = 0;

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(next: boolean) {
    this.enabled = next;
    if (next) {
      this.ensureContext();
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public primeAudio() {
    if (!this.enabled) return;
    this.ensureContext();
  }

  // Subtle mechanical aperture bezel tick (hovering cards, nav items, dock)
  public tick(pitchMultiplier = 1) {
    if (!this.enabled) return;
    const nowMs = performance.now();
    if (nowMs - this.lastTickAt < 46) return;
    this.lastTickAt = nowMs;

    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== "running") return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(1650 * pitchMultiplier, t);
    osc.frequency.exponentialRampToValueAtTime(420 * pitchMultiplier, t + 0.014);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400 * pitchMultiplier, t);
    filter.Q.setValueAtTime(2.2, t);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.038, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.02);
  }

  // Dual-curtain 35mm focal-plane mechanical shutter (opening photos / lightbox)
  public shutter() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== "running") return;

    const triggerCurtain = (offset: number, freq: number, peak: number) => {
      const t = ctx.currentTime + offset;
      // Short filtered white-noise burst + mechanical click transient
      const bufferSize = Math.floor(ctx.sampleRate * 0.024);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(freq, t);
      filter.Q.setValueAtTime(1.6, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(peak, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.024);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(t);
      whiteNoise.stop(t + 0.025);
    };

    // First curtain open + second curtain close 24ms later
    triggerCurtain(0, 2200, 0.09);
    triggerCurtain(0.024, 1550, 0.07);
  }

  // Tactile lanyard / card grab tension sound
  public cordGrab() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== "running") return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(290, t + 0.045);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.045, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Elastic spring snap-back thud when releasing 3D cards or prints
  public cordSnap() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== "running") return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(92, t + 0.075);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.055, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Analog darkroom safelight switch relay
  public darkroomSwitch(enteringDarkroom: boolean) {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== "running") return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    if (enteringDarkroom) {
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.14);
    } else {
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(640, t + 0.12);
    }

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }
}

export const soundEngine = new KobratSoundEngine();

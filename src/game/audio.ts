class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType,
    volume: number,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const jitter = 0.94 + Math.random() * 0.12;

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(30, freqEnd * jitter),
      now + duration,
    );

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playPickup(): void {
    this.playTone(520, 860, 0.14, 'sine', 0.12);
  }

  public playStimulus(): void {
    this.playTone(440, 880, 0.22, 'triangle', 0.15);
    setTimeout(() => this.playTone(660, 1100, 0.25, 'sine', 0.12), 70);
  }

  public playDash(): void {
    this.playTone(280, 110, 0.18, 'triangle', 0.14);
  }

  public playShield(): void {
    this.playTone(340, 620, 0.26, 'sine', 0.14);
  }

  public playHit(): void {
    this.playTone(170, 58, 0.24, 'sawtooth', 0.16);
  }

  public playEnemyKo(): void {
    this.playTone(320, 120, 0.2, 'square', 0.12);
    setTimeout(() => this.playTone(540, 810, 0.18, 'triangle', 0.1), 50);
  }

  public playZoneEnter(): void {
    this.playTone(392, 587, 0.28, 'sine', 0.12);
  }

  public playMouthEntry(): void {
    this.playTone(260, 520, 0.22, 'sine', 0.13);
    setTimeout(() => this.playTone(480, 190, 0.28, 'triangle', 0.14), 450);
  }

  public playSplash(): void {
    this.playTone(420, 140, 0.16, 'sine', 0.16);
    setTimeout(() => this.playTone(260, 620, 0.18, 'triangle', 0.11), 45);
  }

  public playFlush(): void {
    this.playTone(340, 145, 0.65, 'sine', 0.14);
    setTimeout(() => this.playTone(520, 210, 0.58, 'triangle', 0.11), 160);
    setTimeout(() => this.playTone(280, 95, 0.55, 'sine', 0.12), 420);
  }

  public playVictory(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, n * 1.03, 0.28, 'triangle', 0.14), i * 110);
    });
  }

  public playDefeat(): void {
    const notes = [330, 277, 220, 165];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, n * 0.94, 0.28, 'sawtooth', 0.11), i * 130);
    });
  }
}

export const soundEngine = new SoundEngine();

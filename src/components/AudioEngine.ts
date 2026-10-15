import type { MetalMaterialId } from './WebGLMetalEngine';

export type MaterialSoundKind = 'button' | 'switch' | 'select' | 'metal';
type AudibleMetal = Exclude<MetalMaterialId, 'classic'>;
type SoundProfile = {
  label: string;
  description: string;
  frequency: number;
  decay: number;
  ratios: readonly number[];
  weights: readonly number[];
  body: number;
  textureCutoff: number;
  texture: number;
};

/** Designed sonic identities, rather than measurements of literal metal objects. */
export const METAL_SOUND_PROFILES: Record<AudibleMetal, SoundProfile> = {
  platinum: {
    label: 'Chrome', description: 'Bright, precise, polished',
    frequency: 1250, decay: 0.021, ratios: [1, 2.76, 5.4, 7.95],
    weights: [1, 0.25, 0.11, 0.035], body: 260, textureCutoff: 6500, texture: 0.045,
  },
  gold: {
    label: 'Gold', description: 'Warm, rounded, softly weighted',
    frequency: 570, decay: 0.016, ratios: [1, 2.32, 4.18, 6.05],
    weights: [1, 0.20, 0.055, 0.015], body: 170, textureCutoff: 1900, texture: 0.025,
  },
  obsidian: {
    label: 'Black Titanium', description: 'Low, dry, tightly damped',
    frequency: 285, decay: 0.010, ratios: [1, 2.61, 4.72, 7.03],
    weights: [1, 0.15, 0.035, 0.012], body: 105, textureCutoff: 1200, texture: 0.020,
  },
  cobalt: {
    label: 'Cobalt', description: 'Cool, crisp, sharply defined',
    frequency: 880, decay: 0.017, ratios: [1, 2.43, 4.91, 7.28],
    weights: [1, 0.31, 0.095, 0.025], body: 210, textureCutoff: 4300, texture: 0.040,
  },
  rosegold: {
    label: 'Rose Gold', description: 'Soft, warm, gently resonant',
    frequency: 690, decay: 0.019, ratios: [1, 2.11, 3.87, 5.92],
    weights: [1, 0.19, 0.055, 0.014], body: 155, textureCutoff: 2300, texture: 0.025,
  },
  emerald: {
    label: 'Emerald Titanium', description: 'Light, clear, delicately ringing',
    frequency: 1080, decay: 0.024, ratios: [1, 2.93, 5.12, 8.2],
    weights: [1, 0.23, 0.075, 0.022], body: 220, textureCutoff: 4800, texture: 0.030,
  },
};

const INTERACTIONS = {
  button: { strength: 0.82, decay: 0.88, pitch: 1, body: 1 },
  metal: { strength: 1, decay: 1, pitch: 0.96, body: 1.25 },
  switch: { strength: 0.82, decay: 0.66, pitch: 1.06, body: 0.7 },
  select: { strength: 0.58, decay: 0.52, pitch: 1.15, body: 0.45 },
} as const;
export const MATERIAL_SOUND_VOLUME = 0.22;

/** Short modal impacts: inharmonic resonances + a damped body + a tiny contact texture.
 * The same PCM generator is used by the live AudioBuffer and exported auditions. */
export function synthesizeMetalImpact(
  material: MetalMaterialId,
  kind: MaterialSoundKind = 'button',
  sampleRate = 48000,
) {
  if (material === 'classic' || !METAL_SOUND_PROFILES[material]) return new Float32Array(0);
  if (!Number.isFinite(sampleRate) || sampleRate < 8000 || sampleRate > 192000) {
    throw new RangeError('Unsupported sound sample rate');
  }
  const profile = METAL_SOUND_PROFILES[material];
  const action = INTERACTIONS[kind];
  const decay = profile.decay * action.decay;
  const secondContact = kind === 'switch' ? 0.009 : 0;
  const length = Math.ceil((decay * 6 + secondContact + 0.008) * sampleRate);
  const samples = new Float32Array(length);
  const modes = profile.ratios.map((ratio, i) => ({
    frequency: profile.frequency * action.pitch * ratio,
    weight: profile.weights[i],
    decay: decay * [1, 0.57, 0.34, 0.22][i],
  })).filter(mode => mode.frequency < sampleRate * 0.45);
  const cutoff = Math.min(profile.textureCutoff, sampleRate * 0.42);
  const smoothing = 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate);
  let seed = 0x5f3759df, noise = 0, peak = 0;
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    noise += ((seed / 0x80000000 - 1) - noise) * smoothing;
    let value = 0;
    for (let contact = 0; contact < (secondContact ? 2 : 1); contact++) {
      const age = t - contact * secondContact;
      if (age < 0) continue;
      const attack = 1 - Math.exp(-age / 0.00055);
      let impact = 0;
      for (const mode of modes) {
        impact += mode.weight * Math.sin(2 * Math.PI * mode.frequency * age)
          * Math.exp(-age / mode.decay);
      }
      impact += 0.16 * action.body * Math.sin(2 * Math.PI * profile.body * age)
        * Math.exp(-age / Math.min(decay * 0.65, 0.012));
      impact += noise * profile.texture * Math.exp(-age / 0.0025);
      value += impact * attack * (contact ? 0.34 : 1);
    }
    // Exact zero endpoints avoid discontinuities without a long or musical tail.
    value *= Math.min(1, (length - i - 1) / (sampleRate * 0.004));
    samples[i] = value;
    peak = Math.max(peak, Math.abs(value));
  }
  const gain = peak ? 0.4 * action.strength / peak : 0;
  for (let i = 0; i < length; i++) samples[i] *= gain;
  return samples;
}

export class ImmortalAudioEngine {
  private ctx: AudioContext | null = null;
  private output: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private voices = new Set<AudioBufferSourceNode>();
  private listeners = new Set<() => void>();
  private soundEnabled = true;
  private lastRequest = -Infinity;
  private unlocking = false;
  private pending: { material: AudibleMetal; kind: MaterialSoundKind; time: number } | null = null;

  public get enabled() { return this.soundEnabled; }
  public set enabled(value: boolean) {
    if (this.soundEnabled === value) return;
    this.soundEnabled = value;
    if (!value) this.pending = null;
    if (this.ctx && this.output) {
      const now = this.ctx.currentTime;
      this.output.gain.cancelScheduledValues(now);
      this.output.gain.setTargetAtTime(value ? MATERIAL_SOUND_VOLUME : 0, now, 0.003);
      if (!value) this.voices.forEach(source => {
        try { source.stop(now + (this.ctx?.state === 'running' ? 0.012 : 0)); } catch { /* Already ended. */ }
      });
    }
    this.listeners.forEach(listener => listener());
  }
  public getEnabled = () => this.soundEnabled;
  public subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private initContext(): AudioContext | null {
    if (this.ctx?.state === 'closed') {
      this.ctx = null; this.output = null; this.voices.clear(); this.buffers.clear();
    }
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx({ latencyHint: 'interactive' });
      this.output = this.ctx.createGain();
      this.output.gain.value = MATERIAL_SOUND_VOLUME;
      const limiter = this.ctx.createDynamicsCompressor();
      limiter.threshold.value = -14;
      limiter.knee.value = 8;
      limiter.ratio.value = 4;
      limiter.attack.value = 0.002;
      limiter.release.value = 0.05;
      this.output.connect(limiter);
      limiter.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private startImpact(material: AudibleMetal, kind: MaterialSoundKind) {
    const ctx = this.ctx;
    if (!ctx || !this.output || !this.soundEnabled) return;
    const key = `${ctx.sampleRate}:${material}:${kind}`;
    let buffer = this.buffers.get(key);
    if (!buffer) {
      const samples = synthesizeMetalImpact(material, kind, ctx.sampleRate);
      buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
      buffer.copyToChannel(samples, 0);
      this.buffers.set(key, buffer);
    }
    while (this.voices.size >= 4) {
      const oldest = this.voices.values().next().value!;
      this.voices.delete(oldest);
      try { oldest.stop(ctx.currentTime + 0.006); } catch { /* Already ended. */ }
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.output);
    source.onended = () => { source.disconnect(); this.voices.delete(source); };
    this.voices.add(source);
    source.start(ctx.currentTime + 0.004);
  }

  /** Material is explicit and defaults to silence, including for metallic-looking Classic buttons. */
  public playClick(kind: MaterialSoundKind = 'button', material: MetalMaterialId = 'classic') {
    if (!this.soundEnabled || material === 'classic' || !METAL_SOUND_PROFILES[material]) {
      if (material === 'classic') this.pending = null;
      return;
    }
    const time = performance.now();
    if (time - this.lastRequest < 35) return; // One impact per gesture, including nested handlers.
    this.lastRequest = time;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        this.pending = { material, kind, time };
        if (!this.unlocking) {
          this.unlocking = true;
          void ctx.resume().then(() => {
            const pending = this.pending; this.pending = null;
            if (this.soundEnabled && this.ctx === ctx && pending && performance.now() - pending.time < 200) {
              this.startImpact(pending.material, pending.kind);
            }
          }).catch(() => { this.pending = null; }).finally(() => { this.unlocking = false; });
        }
      } else if (ctx.state === 'running') this.startImpact(material, kind);
    } catch { /* Audio availability never blocks an interaction. */ }
  }
}

export const audioEngine = new ImmortalAudioEngine();

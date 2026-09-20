import type Phaser from 'phaser';
import { LOVE, SOUNDTRACK, STORAGE_KEYS } from '../config/settings';
import { storage } from '../utils/gameUtils';

export type SfxKey =
  | 'shot'
  | 'empty'
  | 'hit'
  | 'headshot'
  | 'fall'
  | 'escape'
  | 'reload'
  | 'button'
  | 'combo'
  | 'levelup'
  | 'extraLife'
  | 'awa'
  | 'gameover';

/** Sonidos en bucle (se inician y detienen explícitamente) */
export type LoopKey = 'siren';

/**
 * Archivos de audio reales. Mientras un valor sea null se usa el placeholder
 * sintetizado. Para usar un archivo: colocarlo en public/assets/audio y poner
 * aquí la ruta, p. ej. siren: '/assets/audio/sirena.mp3'.
 */
export const AUDIO_FILES: Record<SfxKey | LoopKey, string | null> = {
  shot: null,
  empty: null,
  hit: null,
  headshot: null,
  fall: null,
  escape: null,
  reload: null,
  button: null,
  combo: null,
  levelup: null,
  extraLife: null,
  /** Queja de Jacinto cuando el jugador falla */
  awa: '/assets/audio/awa.mp3',
  gameover: null,
  siren: null,
};

export const audioCacheKey = (key: SfxKey | LoopKey): string => `audio-${key}`;

/**
 * Sonido del juego.
 *  - Efectos: archivos reales si existen en la caché de Phaser; si no,
 *    placeholders sintetizados con WebAudio.
 *  - Soundtrack: se reproduce en bucle y en streaming con un <audio> (no se
 *    decodifica entero en memoria) y suena en paralelo a los efectos.
 */
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private sound: Phaser.Sound.BaseSoundManager | null = null;
  private track: HTMLAudioElement | null = null;
  private love: HTMLAudioElement | null = null;
  private trackActive = false;
  private trackPrimed = false;
  private fileSiren: Phaser.Sound.BaseSound | null = null;
  private siren: { osc: OscillatorNode; lfo: OscillatorNode; gain: GainNode } | null = null;
  private _muted = storage.get(STORAGE_KEYS.muted) === '1';

  constructor() {
    // Empieza a cargar la canción desde el menú para que la partida arranque sin espera
    this.ensureTrack();
    if (typeof Audio !== 'undefined') {
      this.love = new Audio(LOVE.src);
      this.love.preload = 'auto';
      this.love.volume = LOVE.volume;
      this.love.muted = this._muted;
    }
  }

  get muted(): boolean {
    return this._muted;
  }

  /** Vincula el gestor de sonido de Phaser (para archivos reales). */
  attach(sound: Phaser.Sound.BaseSoundManager): void {
    this.sound = sound;
    sound.mute = this._muted;
  }

  /** Debe llamarse en un gesto del usuario (click/tap/tecla). */
  unlock(): void {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
    this.primeTrack();
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
    storage.set(STORAGE_KEYS.muted, muted ? '1' : '0');
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.02);
    if (this.sound) this.sound.mute = muted;
    if (this.track) this.track.muted = muted;
    if (this.love) this.love.muted = muted;
  }

  toggleMute(): boolean {
    this.setMuted(!this._muted);
    return this._muted;
  }

  play(key: SfxKey): void {
    if (this._muted) return;
    if (AUDIO_FILES[key] && this.sound?.game.cache.audio.exists(audioCacheKey(key))) {
      this.sound.play(audioCacheKey(key), { volume: 0.7 });
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    switch (key) {
      case 'shot':
        this.noise(t, 0.22, 0.9, 'lowpass', 4200, 250);
        this.tone(t, 'sine', 140, 38, 0.18, 0.8);
        break;
      case 'empty':
        this.noise(t, 0.03, 0.4, 'bandpass', 2500, 2500);
        this.noise(t + 0.08, 0.03, 0.3, 'bandpass', 1800, 1800);
        break;
      case 'hit':
        this.tone(t, 'square', 880, 440, 0.09, 0.25);
        this.noise(t, 0.08, 0.35, 'highpass', 1500, 800);
        break;
      case 'headshot':
        this.tone(t, 'square', 1320, 660, 0.08, 0.25);
        this.tone(t + 0.07, 'square', 1760, 1760, 0.1, 0.22);
        this.noise(t, 0.1, 0.4, 'highpass', 2000, 900);
        break;
      case 'fall':
        this.tone(t, 'triangle', 1100, 160, 0.7, 0.3);
        break;
      case 'escape':
        [392, 330, 262, 196].forEach((f, i) => this.tone(t + i * 0.11, 'square', f, f * 0.97, 0.1, 0.18));
        break;
      case 'reload':
        this.noise(t, 0.05, 0.5, 'bandpass', 1800, 1200);
        this.noise(t + 0.16, 0.06, 0.55, 'bandpass', 2400, 1400);
        break;
      case 'button':
        this.tone(t, 'square', 660, 990, 0.06, 0.18);
        break;
      case 'combo':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(t + i * 0.06, 'square', f, f, 0.07, 0.16));
        break;
      case 'levelup':
        [440, 523, 659, 880, 659, 880].forEach((f, i) => this.tone(t + i * 0.09, 'square', f, f, 0.12, 0.18));
        break;
      case 'extraLife':
        [660, 880, 1320].forEach((f, i) => this.tone(t + i * 0.08, 'triangle', f, f, 0.12, 0.3));
        break;
      case 'gameover':
        [440, 415, 392, 370, 330, 262].forEach((f, i) => this.tone(t + i * 0.2, 'triangle', f, f * 0.98, 0.22, 0.3));
        break;
    }
  }

  /** Inicia el soundtrack (en bucle) desde el principio. */
  startSoundtrack(): void {
    const track = this.ensureTrack();
    if (!track) return;
    this.trackActive = true;
    track.currentTime = 0;
    track.muted = this._muted;
    track.play().catch(() => {
      // Autoplay bloqueado: el juego sigue sin música
    });
  }

  pauseSoundtrack(): void {
    this.track?.pause();
  }

  resumeSoundtrack(): void {
    if (this.trackActive) this.track?.play().catch(() => undefined);
  }

  stopSoundtrack(): void {
    this.trackActive = false;
    if (!this.track) return;
    this.track.pause();
    this.track.currentTime = 0;
  }

  /** Reproduce "te amo gordo" desde el inicio. Devuelve su duración en ms. */
  playLoveClip(): number {
    const love = this.love;
    if (!love) return LOVE.durationMs;
    love.currentTime = 0;
    love.muted = this._muted;
    love.play().catch(() => undefined);
    return Number.isFinite(love.duration) && love.duration > 0 ? love.duration * 1000 : LOVE.durationMs;
  }

  pauseLoveClip(): void {
    this.love?.pause();
  }

  resumeLoveClip(): void {
    if (this.love && this.love.currentTime > 0 && !this.love.ended) this.love.play().catch(() => undefined);
  }

  /** Sirena de patrulla (SERFOR): barrido "wail" continuo hasta stopSiren(). */
  startSiren(): void {
    if (this._muted) return;
    if (AUDIO_FILES.siren && this.sound?.game.cache.audio.exists(audioCacheKey('siren'))) {
      this.fileSiren ??= this.sound.add(audioCacheKey('siren'), { loop: true, volume: 0.5 });
      if (!this.fileSiren.isPlaying) this.fileSiren.play();
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.siren) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 950;
    // LFO triangular: sube y baja la frecuencia entre ~650 y ~1250 Hz
    const lfo = ctx.createOscillator();
    lfo.type = 'triangle';
    lfo.frequency.value = 0.9;
    const depth = ctx.createGain();
    depth.gain.value = 300;
    lfo.connect(depth).connect(osc.frequency);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2200;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.3);
    osc.connect(filter).connect(gain).connect(this.sfxGain);
    osc.start(t);
    lfo.start(t);
    this.siren = { osc, lfo, gain };
  }

  stopSiren(): void {
    this.fileSiren?.stop();
    const siren = this.siren;
    if (!siren || !this.ctx) return;
    this.siren = null;
    const t = this.ctx.currentTime;
    siren.gain.gain.cancelScheduledValues(t);
    siren.gain.gain.setValueAtTime(Math.max(0.0001, siren.gain.gain.value), t);
    siren.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    siren.osc.stop(t + 0.45);
    siren.lfo.stop(t + 0.45);
  }

  destroy(): void {
    this.stopSiren();
    this.stopSoundtrack();
    if (this.track) this.track.src = '';
    this.track = null;
    this.love?.pause();
    this.love = null;
    void this.ctx?.close();
    this.ctx = null;
  }

  // -------------------------------------------------------------------------

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor =
      typeof window !== 'undefined'
        ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;
    if (!Ctor) return null;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this._muted ? 0 : 1;
    this.master.connect(ctx.destination);
    this.sfxGain = ctx.createGain();
    this.sfxGain.gain.value = 0.65;
    this.sfxGain.connect(this.master);
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;
    return ctx;
  }

  private tone(
    when: number,
    type: OscillatorType,
    from: number,
    to: number,
    duration: number,
    volume: number,
    out: GainNode | null = this.sfxGain,
  ): void {
    if (!this.ctx || !out) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, when);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), when + duration);
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
    osc.connect(gain).connect(out);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  }

  private noise(
    when: number,
    duration: number,
    volume: number,
    filterType: BiquadFilterType,
    from: number,
    to: number,
    out: GainNode | null = this.sfxGain,
  ): void {
    if (!this.ctx || !this.noiseBuffer || !out) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(from, when);
    if (to !== from) filter.frequency.exponentialRampToValueAtTime(to, when + duration);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
    src.connect(filter).connect(gain).connect(out);
    src.start(when);
    src.stop(when + duration + 0.02);
  }

  private ensureTrack(): HTMLAudioElement | null {
    if (this.track || typeof Audio === 'undefined') return this.track;
    const track = new Audio(SOUNDTRACK.src);
    track.preload = 'auto';
    track.volume = SOUNDTRACK.volume;
    track.muted = this._muted;
    track.loop = true;
    this.track = track;
    return track;
  }

  /**
   * iOS/Safari solo permiten reproducir un <audio> dentro de un gesto del
   * usuario. La partida arranca un frame después del click, así que el
   * elemento se "desbloquea" en el primer gesto reproduciéndolo en silencio.
   */
  private primeTrack(): void {
    if (this.trackPrimed) return;
    const track = this.ensureTrack();
    if (!track) return;
    this.trackPrimed = true;
    const love = this.love;
    if (love) {
      love.muted = true;
      love
        .play()
        .then(() => {
          love.pause();
          love.currentTime = 0;
        })
        .catch(() => undefined)
        .finally(() => {
          love.muted = this._muted;
        });
    }
    if (this.trackActive) return;
    track.muted = true;
    track
      .play()
      .then(() => {
        if (!this.trackActive) {
          track.pause();
          track.currentTime = 0;
        }
      })
      .catch(() => {
        this.trackPrimed = false;
      })
      .finally(() => {
        track.muted = this._muted;
      });
  }
}

import type { GameResult } from '@/types/game';
import { PLAYER, SCORING } from '../config/settings';
import { loadRecord, saveRecord } from '../utils/gameUtils';

export interface HitResult {
  points: number;
  multiplier: number;
  /** El multiplicador subió con este acierto */
  multiplierUp: boolean;
  headshot: boolean;
}

/** Puntuación, combos y estadísticas de la partida actual. */
export class ScoreSystem {
  score = 0;
  combo = 0;
  maxCombo = 0;
  shots = 0;
  hits = 0;
  headshots = 0;
  readonly previousRecord = loadRecord();
  private readonly startedAt = Date.now();
  private nextExtraLifeAt: number = PLAYER.extraLifeEvery;

  get multiplier(): number {
    const { hitsPerStep, maxMultiplier } = SCORING.combo;
    return Math.min(maxMultiplier, 1 + Math.floor(this.combo / hitsPerStep));
  }

  get record(): number {
    return Math.max(this.previousRecord, this.score);
  }

  get isNewRecord(): boolean {
    return this.score > this.previousRecord;
  }

  get accuracy(): number {
    return this.shots === 0 ? 0 : Math.min(1, this.hits / this.shots);
  }

  registerShot(): void {
    this.shots++;
  }

  /** `extraInShot` = cuántos gallinazos ya se abatieron con este mismo disparo. */
  registerHit(headshot: boolean, extraInShot: number): HitResult {
    const before = this.multiplier;
    this.hits++;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    if (headshot) this.headshots++;
    const base = (headshot ? SCORING.headshot : SCORING.hit) + extraInShot * SCORING.multiHitBonus;
    const multiplier = this.multiplier;
    const points = base * multiplier;
    this.score += points;
    return { points, multiplier, multiplierUp: multiplier > before, headshot };
  }

  registerMiss(): void {
    this.combo = 0;
  }

  addBonus(points: number): void {
    this.score += points;
  }

  /** Devuelve cuántas vidas extra se ganaron desde la última consulta. */
  consumeExtraLives(): number {
    let lives = 0;
    while (this.score >= this.nextExtraLifeAt) {
      lives++;
      this.nextExtraLifeAt += PLAYER.extraLifeEvery;
    }
    return lives;
  }

  commitRecord(): void {
    if (this.isNewRecord) saveRecord(this.score);
  }

  toResult(level: number, won: boolean): GameResult {
    return {
      won,
      score: this.score,
      level,
      shots: this.shots,
      hits: this.hits,
      headshots: this.headshots,
      accuracy: Math.round(this.accuracy * 1000) / 1000,
      maxCombo: this.maxCombo,
      durationMs: Date.now() - this.startedAt,
    };
  }
}

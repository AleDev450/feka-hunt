import Phaser from 'phaser';
import { COLORS, CREDITS, DEPTH, FRIENDS, GAME_WIDTH, INPUT, PLAYER, RAID, SCORING, TIMING, VICTORY } from '../config/settings';
import { getServices, type GameServices } from '../config/services';
import { LoveInterlude } from '../cutscenes/LoveInterlude';
import { SerforRaid } from '../cutscenes/SerforRaid';
import { Crosshair } from '../entities/Crosshair';
import { Dog } from '../entities/Dog';
import { FriendsGroup } from '../entities/FriendsGroup';
import { Hunter, HunterPose } from '../entities/Hunter';
import type { Vulture, VultureOutcome } from '../entities/Vulture';
import { DifficultySystem, type DifficultyParams } from '../systems/DifficultySystem';
import { ScoreSystem, type HitResult } from '../systems/ScoreSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { Banner } from '../ui/Banner';
import { FloatingTextPool } from '../ui/FloatingText';
import { Hud, type TrackerSlot } from '../ui/Hud';
import { TEX } from '../ui/proceduralTextures';
import { arcadeText } from '../ui/text';
import { isTouchDevice } from '../utils/gameUtils';
import { Background } from '../world/Background';
import type { GameOverData } from './GameOverScene';
import { SCENES } from './keys';

type Phase = 'intro' | 'flight' | 'between' | 'love' | 'gameover';

/**
 * Partida. Orquesta niveles y tandas; la lógica de cada pieza vive en su
 * sistema/entidad (SpawnSystem, ScoreSystem, DifficultySystem, Vulture...).
 */
export class GameScene extends Phaser.Scene {
  private services!: GameServices;
  private background!: Background;
  private hunter!: Hunter;
  private dog!: Dog;
  private friends!: FriendsGroup;
  private crosshair!: Crosshair;
  private hud!: Hud;
  private floating!: FloatingTextPool;
  private banner!: Banner;
  private spawner!: SpawnSystem;
  private score!: ScoreSystem;
  private feathers!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparks: Phaser.GameObjects.Image[] = [];
  private sparkCursor = 0;

  private params!: DifficultyParams;
  private phase: Phase = 'intro';
  private level = 1;
  private lives: number = PLAYER.lives;
  private ammo = 0;
  private slots: TrackerSlot[] = [];
  private launched = 0;
  private flightStart = 0;
  private lastShotAt = 0;
  private reloadingUntil = 0;
  private touchMode = false;
  private fleeScheduled = false;

  constructor() {
    super(SCENES.game);
  }

  create(): void {
    this.services = getServices(this);
    this.touchMode = isTouchDevice();
    this.phase = 'intro';
    this.level = 1;
    this.lives = PLAYER.lives;
    this.score = new ScoreSystem();

    this.background = new Background(this);
    this.hunter = new Hunter(this);
    this.dog = new Dog(this, this.services.audio);
    this.friends = new FriendsGroup(this);
    this.crosshair = new Crosshair(this, this.touchMode);
    this.hud = new Hud(this, {
      onPause: () => this.pauseGame(),
      onToggleMute: () => this.services.audio.toggleMute(),
    });
    this.hud.drawMuteIcon(this.services.audio.muted);
    this.floating = new FloatingTextPool(this);
    this.banner = new Banner(this);
    this.createEffects();

    this.spawner = new SpawnSystem(this, {
      onResolved: (v, outcome) => this.onVultureResolved(v, outcome),
      onFlee: () => this.services.audio.play('escape'),
      onLanded: (v) => this.dog.fetch(v.x),
      onFlightComplete: () => this.onFlightComplete(),
    });

    this.hud.setScore(0);
    this.hud.setRecord(this.score.record);
    this.hud.setLives(this.lives);
    this.hud.setCombo(1, 0);
    this.hud.setAmmo(0, 0);

    this.bindInput();
    this.services.audio.startSoundtrack();
    this.showCredits();
    this.services.bridge.emit('game:start');
    this.startLevel(1);
  }

  update(_time: number, delta: number): void {
    this.background.update(delta);
    if (!this.touchMode && this.phase === 'flight') {
      const { x, y } = this.crosshair;
      this.crosshair.setLocked(this.spawner.hittable.some((v) => v.hitTest(x, y, 0, INPUT.headRadius) !== null));
    }
  }

  // ---------------------------------------------------------------------------
  // Flujo de niveles y tandas
  // ---------------------------------------------------------------------------

  private startLevel(level: number): void {
    this.level = level;
    this.params = DifficultySystem.forLevel(level);
    this.slots = Array<TrackerSlot>(this.params.vulturesPerLevel).fill('pending');
    this.launched = 0;
    this.phase = 'intro';
    this.hud.setLevel(level);
    this.hud.setTracker(this.slots);
    this.hunter.setRestPose(HunterPose.IDLE);
    const subtitle = level === 1 ? '¡A CAZAR GALLINAZOS!' : level === VICTORY.levels ? '¡ÚLTIMO NIVEL!' : '¡MÁS RÁPIDOS!';
    this.banner.show(`NIVEL ${level}/${VICTORY.levels}`, subtitle, TIMING.levelBannerMs);
    if (level > 1) this.services.audio.play('levelup');
    this.time.delayedCall(TIMING.levelBannerMs, () => this.startFlight());
  }

  private startFlight(): void {
    if (this.phase === 'gameover') return;
    const count = Math.min(this.params.simultaneous, this.params.vulturesPerLevel - this.launched);
    this.flightStart = this.launched;
    this.launched += count;
    this.fleeScheduled = false;

    this.ammo = this.params.shotsPerFlight;
    this.hud.setAmmo(this.ammo, this.params.shotsPerFlight);
    this.hunter.reload(TIMING.reloadMs);
    this.hunter.setRestPose(HunterPose.APUNTANDO);
    this.services.audio.play('reload');
    this.reloadingUntil = this.time.now + TIMING.reloadMs;
    this.phase = 'flight';
    this.time.delayedCall(TIMING.reloadMs * 0.5, () => this.spawner.startFlight(this.params, count));
  }

  private onFlightComplete(): void {
    if (this.phase === 'gameover') return;
    this.phase = 'between';
    this.crosshair.setLocked(false);
    this.hunter.setRestPose(HunterPose.IDLE);
    if (this.launched >= this.params.vulturesPerLevel) this.completeLevel();
    else this.time.delayedCall(TIMING.flightGapMs, () => this.startFlight());
  }

  private completeLevel(): void {
    const killed = this.slots.filter((s) => s === 'killed').length;
    const perfect = killed === this.slots.length;
    if (perfect) {
      this.score.addBonus(SCORING.perfectLevelBonus);
      this.refreshScore();
    }
    // Superó el último nivel: ganó (y llega SERFOR igual)
    if (this.level >= VICTORY.levels) {
      this.endGame(true);
      return;
    }
    if (perfect) {
      this.banner.show('¡PERFECTO!', `BONUS +${SCORING.perfectLevelBonus}`, TIMING.levelBannerMs);
      this.services.audio.play('combo');
    } else {
      this.banner.show(`NIVEL ${this.level} COMPLETO`, `GALLINAZOS ${killed}/${this.slots.length}`, TIMING.levelBannerMs);
    }
    if (killed >= this.slots.length / 2) {
      this.dog.celebrate();
      this.hunter.celebrate();
    }
    this.time.delayedCall(TIMING.levelBannerMs + 300, () => this.playLoveInterlude());
  }

  /** Entre niveles: se pausa todo el audio y suena "te amo gordo" con su escena. */
  private playLoveInterlude(): void {
    if (this.phase === 'gameover') return;
    this.phase = 'love';
    this.crosshair.setLocked(false);
    const { audio } = this.services;
    audio.pauseSoundtrack();
    const durationMs = audio.playLoveClip();
    new LoveInterlude(this, this.hunter, this.dog).play(durationMs, () => {
      if (this.phase !== 'love') return;
      audio.resumeSoundtrack();
      this.startLevel(this.level + 1);
    });
  }

  /** Fin de la partida (gane o pierda): siempre llega SERFOR. */
  private endGame(won: boolean): void {
    this.phase = 'gameover';
    this.spawner.fleeAll();
    this.crosshair.setLocked(false).setVisible(false);
    this.input.setDefaultCursor('default');
    this.services.audio.stopSoundtrack();
    this.services.audio.play(won ? 'levelup' : 'gameover');
    if (won) this.friends.cheer(RAID.bannerMs + 1500);
    else this.friends.sad(RAID.bannerMs + 1500);
    if (won) this.banner.show('¡GANASTE!', `¡SUPERASTE LOS ${VICTORY.levels} NIVELES!`, RAID.bannerMs);
    else this.banner.show('¡PERDISTE!', 'TE QUEDASTE SIN VIDAS', RAID.bannerMs, COLORS.redText);

    const isNewRecord = this.score.isNewRecord;
    this.score.commitRecord();
    const result = this.score.toResult(this.level, won);
    this.services.bridge.emit('game:over', result);
    const data: GameOverData = { result, record: this.score.record, isNewRecord };
    new SerforRaid(this, this.hunter, this.dog, this.services.audio).play(() => this.scene.start(SCENES.gameOver, data));
  }

  private showCredits(): void {
    const credit = arcadeText(this, GAME_WIDTH / 2, 104, `SOUNDTRACK: ${CREDITS.artist}`, 12, { color: COLORS.goldText })
      .setDepth(DEPTH.banner);
    this.tweens.add({ targets: credit, alpha: 0, delay: 4000, duration: 800, onComplete: () => credit.destroy() });
  }

  // ---------------------------------------------------------------------------
  // Disparo
  // ---------------------------------------------------------------------------

  private bindInput(): void {
    this.input.setDefaultCursor(this.touchMode ? 'default' : 'none');
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.wasTouch) return;
      this.crosshair.moveTo(p.x, p.y);
      this.hunter.faceTowards(p.x);
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      this.services.audio.unlock();
      if (over.some((o) => this.hud.interactive.includes(o))) return;
      this.shoot(p.x, p.y, p.wasTouch);
    });

    const keyboard = this.input.keyboard;
    keyboard?.on('keydown-P', () => this.pauseGame());
    keyboard?.on('keydown-ESC', () => this.pauseGame());
    keyboard?.on('keydown-M', () => this.hud.drawMuteIcon(this.services.audio.toggleMute()));

    const offPause = this.services.bridge.on('control:pause', () => this.pauseGame());
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      this.input.setDefaultCursor(this.touchMode ? 'default' : 'none');
      if (this.phase === 'love') this.services.audio.resumeLoveClip();
      else this.services.audio.resumeSoundtrack();
      this.services.bridge.emit('game:resumed');
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offPause();
      this.services.audio.stopSoundtrack();
      this.services.audio.stopSiren();
      this.services.audio.pauseLoveClip();
      this.spawner.reset();
      this.input.setDefaultCursor('default');
      this.events.off(Phaser.Scenes.Events.RESUME);
    });
  }

  private shoot(x: number, y: number, touch: boolean): void {
    if (this.phase === 'gameover') return;
    this.crosshair.moveTo(x, y);
    this.hunter.faceTowards(x);
    if (this.phase !== 'flight') return;

    const now = this.time.now;
    if (now < this.reloadingUntil || now - this.lastShotAt < INPUT.shotCooldownMs) return;
    if (this.ammo <= 0) {
      this.services.audio.play('empty');
      this.floating.show(x, y - 30, '¡SIN BALAS!', COLORS.grey, 14, 30);
      return;
    }

    this.lastShotAt = now;
    this.ammo--;
    this.hud.setAmmo(this.ammo, this.params.shotsPerFlight);
    this.score.registerShot();
    this.services.audio.play('shot');
    this.hunter.shoot();
    this.crosshair.kick();
    this.flash(x, y);
    this.cameras.main.shake(70, 0.003);

    const tolerance = touch ? INPUT.aimToleranceTouch : INPUT.aimToleranceMouse;
    const headRadius = touch ? INPUT.headRadiusTouch : INPUT.headRadius;
    let hitsThisShot = 0;
    for (const vulture of this.spawner.hittable) {
      const zone = vulture.hitTest(x, y, tolerance, headRadius);
      if (!zone) continue;
      const result = this.score.registerHit(zone === 'head', hitsThisShot);
      hitsThisShot++;
      this.onVultureHit(vulture, result);
    }

    if (hitsThisShot === 0) {
      this.score.registerMiss();
      this.floating.show(x, y - 24, 'FALLO', COLORS.grey, 12, 24);
      this.friends.sad(FRIENDS.missMs, false);
    } else {
      if (hitsThisShot > 1) this.floating.show(GAME_WIDTH / 2, 200, `¡DOBLETE! x${hitsThisShot}`, COLORS.goldText, 22);
      this.grantExtraLives();
    }
    this.refreshScore();

    if (this.ammo === 0 && this.spawner.isFlightActive && !this.fleeScheduled) {
      this.fleeScheduled = true;
      this.time.delayedCall(TIMING.outOfAmmoFleeDelayMs, () => this.spawner.fleeAll());
    }
  }

  private onVultureHit(vulture: Vulture, result: HitResult): void {
    vulture.hit();
    this.friends.cheer();
    this.markSlot('killed');
    this.feathers.explode(8, vulture.x, vulture.y);
    this.services.audio.play(result.headshot ? 'headshot' : 'hit');
    this.time.delayedCall(TIMING.hitFreezeMs, () => this.services.audio.play('fall'));
    if (result.headshot) this.floating.show(vulture.x, vulture.y - 50, `¡HEADSHOT! +${result.points}`, COLORS.goldText, 18);
    else this.floating.show(vulture.x, vulture.y - 50, `+${result.points}`, COLORS.white, 20);
    if (result.multiplierUp) {
      this.floating.show(vulture.x, vulture.y - 90, `COMBO x${result.multiplier}`, COLORS.redText, 22, 70);
      this.services.audio.play('combo');
    }
  }

  private onVultureResolved(vulture: Vulture, outcome: VultureOutcome): void {
    if (outcome !== 'escaped' || this.phase === 'gameover') return;
    this.markSlot('escaped');
    this.lives = Math.max(0, this.lives - SCORING.livesLostPerEscape);
    this.hud.setLives(this.lives);
    this.score.registerMiss();
    this.refreshScore();
    this.hunter.hurt();
    this.dog.bark();
    this.friends.sad();
    this.floating.show(Phaser.Math.Clamp(vulture.x, 200, GAME_WIDTH - 200), 140, '¡SE ESCAPÓ! -1 VIDA', COLORS.redText, 16, 30);
    this.cameras.main.flash(160, 140, 20, 20);
    if (this.lives <= 0) this.endGame(false);
  }

  // ---------------------------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------------------------

  private markSlot(state: TrackerSlot): void {
    const index = this.slots.indexOf('pending', this.flightStart);
    if (index === -1) return;
    this.slots[index] = state;
    this.hud.setTracker(this.slots);
  }

  private refreshScore(): void {
    this.hud.setScore(this.score.score);
    this.hud.setRecord(this.score.record);
    this.hud.setCombo(this.score.multiplier, this.score.combo);
  }

  private grantExtraLives(): void {
    const extra = this.score.consumeExtraLives();
    if (extra === 0 || this.lives >= PLAYER.maxLives) return;
    this.lives = Math.min(PLAYER.maxLives, this.lives + extra);
    this.hud.setLives(this.lives);
    this.services.audio.play('extraLife');
    this.floating.show(GAME_WIDTH / 2, 240, '¡VIDA EXTRA!', COLORS.redText, 24);
  }

  private createEffects(): void {
    this.feathers = this.add.particles(0, 0, 'feather', {
      speed: { min: 60, max: 200 },
      angle: { min: 0, max: 360 },
      gravityY: 220,
      lifespan: 900,
      rotate: { min: 0, max: 360 },
      alpha: { start: 1, end: 0 },
      emitting: false,
    });
    this.feathers.setDepth(DEPTH.fx);
    this.sparks = [0, 1, 2].map(() => this.add.image(0, 0, TEX.spark).setDepth(DEPTH.fx).setVisible(false));
  }

  /** Destello de disparo en el punto de impacto. */
  private flash(x: number, y: number): void {
    const spark = this.sparks[this.sparkCursor];
    this.sparkCursor = (this.sparkCursor + 1) % this.sparks.length;
    this.tweens.killTweensOf(spark);
    spark.setPosition(x, y).setScale(0.5).setAlpha(1).setVisible(true).setAngle(Phaser.Math.Between(0, 3) * 45);
    this.tweens.add({
      targets: spark,
      scale: 1.2,
      alpha: 0,
      duration: 140,
      onComplete: () => spark.setVisible(false),
    });
  }

  private pauseGame(): void {
    if (this.phase === 'gameover' || !this.scene.isActive()) return;
    this.services.audio.pauseSoundtrack();
    this.services.audio.pauseLoveClip();
    this.scene.launch(SCENES.pause);
    this.scene.pause();
    this.services.bridge.emit('game:paused');
  }
}

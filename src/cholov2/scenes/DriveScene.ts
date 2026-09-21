import Phaser from 'phaser';
import { CONFIG as C, type RaceEvent } from '../config';
import { Race } from '../systems/Race';
import { Road } from '../render/Road';
import { Effects } from '../render/Effects';
import { Controls } from '../ui/Controls';
import { Hud } from '../ui/Hud';
import { button, label } from '../ui/widgets';
import type { Sound } from '../systems/Sound';

export class DriveScene extends Phaser.Scene {
  private race!: Race;
  private road!: Road;
  private controls!: Controls;
  private hud!: Hud;
  private effects!: Effects;
  private taxi!: Phaser.GameObjects.Image;
  private shadows!: Phaser.GameObjects.Graphics;
  private zone!: Phaser.GameObjects.Graphics;
  private passenger!: Phaser.GameObjects.Image;
  private pin!: Phaser.GameObjects.Image;
  private stopLabel!: Phaser.GameObjects.Text;
  private traffic: Phaser.GameObjects.Image[] = [];
  private signals: Phaser.GameObjects.Text[] = [];
  private reaction!: Phaser.GameObjects.Image;
  private dialogue!: Phaser.GameObjects.Text;
  private reactionUntil = 0;
  private overlay?: Phaser.GameObjects.Container;
  private paused = false;
  private finished = false;
  private nextEffect = 0;
  private audio!: Sound;

  constructor() { super('Drive'); }
  create(): void {
    this.race = new Race();
    this.paused = false; this.finished = false; this.overlay = undefined;
    this.reactionUntil = 0; this.nextEffect = 0;
    this.audio = this.registry.get('audio') as Sound;
    this.audio.unlock();
    this.road = new Road(this);
    this.zone = this.add.graphics().setDepth(-10);
    this.shadows = this.add.graphics().setDepth(-5);
    this.traffic = this.race.traffic.pool.map(() => this.add.image(0, 0, 'auto').setOrigin(0.5, 1).setVisible(false));
    this.signals = this.race.traffic.pool.map(() => label(this, 0, 0, '', 20, '#ffda47').setOrigin(0.5).setVisible(false));
    this.passenger = this.add.image(0, 0, 'passenger-0').setOrigin(0.5, 1);
    this.pin = this.add.image(0, 0, 'pin').setOrigin(0.5, 1);
    this.stopLabel = label(this, 0, 0, '', 20, '#aaffcc').setOrigin(0.5).setDepth(1000);
    this.taxi = this.add.image(640, C.roadBottom, 'taxi-straight').setOrigin(0.5, 1).setDepth(C.roadBottom);
    this.effects = new Effects(this);
    this.hud = new Hud(this);
    this.controls = new Controls(this);
    this.add.image(1230, 163, 'control-pause').setDisplaySize(60, 60).setDepth(2200).setInteractive({ useHandCursor: true }).on('pointerup', () => this.pause());
    const mute = this.add.image(1154, 163, this.audio.muted ? 'control-mute' : 'control-sound').setDisplaySize(60, 60).setDepth(2200).setInteractive({ useHandCursor: true });
    mute.on('pointerup', () => { this.audio.toggle(); mute.setTexture(this.audio.muted ? 'control-mute' : 'control-sound'); });
    this.reaction = this.add.image(77, 292, 'driver-happy').setOrigin(0.5, 1).setScale(0.38).setDepth(2100).setVisible(false);
    this.dialogue = label(this, 140, 231, '', 20, '#ffe15d').setWordWrapWidth(280).setVisible(false);
    const escape = () => { if (this.paused) this.resume(); else this.pause(); };
    const blur = () => this.pause();
    const visibility = () => { if (document.hidden) this.pause(); };
    this.input.keyboard?.on('keydown-ESC', escape);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', visibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibility);
      this.input.keyboard?.off('keydown-ESC', escape);
      this.controls.clear(); this.audio.pause();
    });
    this.react('driver-happy', '¡A chambear! Busca el marcador verde.');
    this.renderWorld(false);
  }

  private pause(): void {
    if (this.paused || this.finished) return;
    this.paused = true; this.controls.clear(); this.audio.pause(); this.effects.pause(true);
    const previous = new Set(this.children.list);
    this.add.rectangle(640, 360, 1280, 720, 0x080e18, 0.88).setInteractive();
    label(this, 640, 205, 'EN PAUSA', 46, '#ffd14b').setOrigin(0.5);
    label(this, 640, 265, 'La carretera te espera', 24).setOrigin(0.5);
    button(this, 640, 355, 'CONTINUAR', () => this.resume(), 360);
    button(this, 640, 439, 'REINICIAR', () => this.scene.restart(), 360);
    button(this, 640, 523, 'VOLVER AL MENÚ', () => this.scene.start('Menu'), 360);
    this.overlay = this.add.container(0, 0, this.children.list.filter(child => !previous.has(child))).setDepth(5000);
  }
  private resume(): void {
    if (!this.paused || document.hidden) return;
    this.overlay?.destroy(); this.overlay = undefined;
    this.controls.clear(); this.paused = false; this.audio.unlock(); this.effects.pause(false);
  }
  private react(pose: string, message: string): void {
    this.reaction.setTexture(pose).setVisible(true);
    this.dialogue.setText(message).setVisible(true);
    this.reactionUntil = this.race.elapsed + 2.6;
  }
  private event(event: RaceEvent): void {
    this.audio.play(event);
    const x = this.road.project(this.race.player.x, 0).x;
    if (event === 'crash') {
      this.cameras.main.shake(130, 0.003);
      this.effects.emit('impact', x, C.roadBottom - 85);
      this.effects.emit('smoke', x, C.roadBottom - 40);
      this.react('driver-angry', this.race.police.active ? '¡La policía! Acelera y escapa.' : '¡Cuidado con el taxi!');
    } else if (event === 'water') this.effects.emit('water', x, C.roadBottom - 15);
    else if (event === 'pickup') this.react('driver-happy', `¡Vamos a ${this.race.passengers.destination}!`);
    else if (event === 'delivery') this.react('driver-victory', '¡Servicio completo! Ya cayó la tarifa.');
    else if (event === 'escape') this.react('driver-factos', '¡Los perdiste! +700 puntos');
    else if (event === 'near') this.react('driver-proud', '¡Por poquito! +150 puntos');
    else if (event === 'repair') this.react('driver-happy', '¡Taxi reparado! +25 de vida');
  }

  update(_time: number, delta: number): void {
    if (this.paused || this.finished || !this.race) return;
    const input = this.controls.read();
    this.race.update(delta / 1000, input);
    this.renderWorld(input.brake);
    for (const event of this.race.events) this.event(event);
    this.audio.update(this.race.player.speed, this.race.police.active, this.race.elapsed);
    if (this.race.elapsed >= this.reactionUntil) { this.reaction.setVisible(false); this.dialogue.setVisible(false); }
    if (this.race.player.turbo && this.race.elapsed >= this.nextEffect) {
      this.effects.emit('flame', this.taxi.x - 50, C.roadBottom + 8);
      this.effects.emit('flame', this.taxi.x + 50, C.roadBottom + 8);
      this.nextEffect = this.race.elapsed + 0.2;
    }
    if (this.race.reason) {
      this.finished = true; this.controls.clear(); this.audio.pause();
      const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      this.scene.start('Results', { result: this.race.result(), id });
    }
  }

  private renderWorld(braking: boolean): void {
    const p = this.race.player;
    this.road.draw(p.z, p.x);
    this.shadows.clear();
    this.race.traffic.pool.forEach((entity, i) => {
      const image = this.traffic[i], signal = this.signals[i], rel = entity.z - p.z;
      const visible = entity.active && rel > -3 && rel < C.viewDistance;
      image.setVisible(visible); signal.setVisible(false);
      if (!visible) return;
      const projected = this.road.project(entity.x, rel);
      const width = entity.kind === 'vehicle' ? entity.width * 2 * C.roadHalfWidth / C.roadHalfWorld : entity.kind === 'coin' || entity.kind === 'repair' ? 83 : 160;
      image.setTexture(entity.texture).setPosition(projected.x, projected.y).setScale(width / image.width * projected.scale).setDepth(projected.y);
      if (entity.kind === 'vehicle') {
        this.shadows.fillStyle(0x11131c, 0.3).fillEllipse(projected.x, projected.y - 2, width * projected.scale, 25 * projected.scale);
        if (entity.signal > 0) signal.setPosition(projected.x, projected.y - image.displayHeight - 15)
          .setText(entity.targetX > entity.x ? '→' : '←').setVisible(Math.floor(this.race.elapsed * 6) % 2 === 0);
      }
    });
    const pose = braking ? 'brake' : p.steer < -0.65 ? 'hardLeft' : p.steer < -0.15 ? 'left' : p.steer > 0.65 ? 'hardRight' : p.steer > 0.15 ? 'right' : 'straight';
    const pos = this.road.project(p.x, 0);
    this.taxi.setTexture(`taxi-${pose}`).setPosition(pos.x, C.roadBottom + Math.sin(this.race.elapsed * 17) * Math.min(1, p.speed / 20))
      .setScale(178 / this.textures.get('taxi-straight').getSourceImage().width)
      .setAngle(p.steer * 1.4).setAlpha(p.invincible > 0 && Math.floor(this.race.elapsed * 12) % 2 === 0 ? 0.6 : 1);
    this.shadows.fillStyle(0x11131c, 0.48).fillEllipse(pos.x, C.roadBottom, 168, 28);
    this.drawStop(); this.hud.update(this.race);
  }

  private drawStop(): void {
    const service = this.race.passengers, rel = service.zoneZ - this.race.player.z;
    const visible = rel > -C.zoneLength && rel < C.viewDistance;
    this.zone.clear(); this.pin.setVisible(visible); this.passenger.setVisible(visible && !service.aboard); this.stopLabel.setVisible(visible);
    if (!visible) return;
    const near = Math.max(-2, rel - C.zoneLength), far = Math.max(0, rel + C.zoneLength);
    const a = this.road.project(1.52, near), b = this.road.project(2.2, near), c = this.road.project(2.2, far), d = this.road.project(1.52, far);
    this.zone.fillStyle(this.race.police.active ? 0xe6a12f : 0x36d38c, 0.65)
      .fillTriangle(a.x, a.y, b.x, b.y, c.x, c.y).fillTriangle(a.x, a.y, c.x, c.y, d.x, d.y);
    const point = this.road.project(2.2, Math.max(0, rel));
    this.passenger.setTexture(`passenger-${service.person}`).setPosition(point.x, point.y).setScale(0.8 * point.scale).setDepth(point.y);
    const marker = this.road.project(1.85, Math.max(0, rel));
    this.pin.setPosition(marker.x, marker.y - 12).setScale(Math.max(0.23, 0.65 * marker.scale)).setDepth(marker.y + 1).setAlpha(this.race.police.active ? 0.45 : 1);
    this.stopLabel.setPosition(Math.min(1145, Math.max(145, marker.x)), Math.max(304, marker.y - 140 * marker.scale - 24))
      .setText(`${service.aboard ? 'DESTINO' : 'PARADA'} · ${Math.max(0, Math.ceil(rel))} m`);
  }
}

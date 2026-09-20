import Phaser from 'phaser';
import { frameIndex } from '../config/animations';
import { COLORS, DEPTH, GAME_HEIGHT, GAME_WIDTH, RAID, WORLD } from '../config/settings';
import type { Jacinto } from '../entities/Jacinto';
import type { Hunter } from '../entities/Hunter';
import { SerforAgent } from '../entities/SerforAgent';
import type { AudioSystem } from '../systems/AudioSystem';
import { arcadeText } from '../ui/text';

/** Posición de la barra de luces sobre la camioneta (px desde su esquina superior izquierda) */
const LIGHTS = { redX: 177, blueX: 195, y: 16, radius: 13 };

/**
 * Final de partida (gane o pierda): suena la sirena, llega la camioneta de
 * SERFOR, bajan dos agentes y detienen al cazador por cazar gallinazos.
 */
export class SerforRaid {
  private finished = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly hunter: Hunter,
    private readonly mascot: Jacinto,
    private readonly audio: AudioSystem,
  ) {}

  play(onDone: () => void): void {
    const s = this.scene;
    this.audio.startSiren();
    this.mascot.upset();

    // Luces rojo/azul parpadeando sobre toda la escena
    const overlay = s.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xff2020, 0.12)
      .setOrigin(0)
      .setDepth(DEPTH.fx + 2);
    const truck = s.add
      .image(GAME_WIDTH + 260, WORLD.hunter.y + 6, 'serforTruck')
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.hunter - 0.5);
    const redLight = s.add.circle(0, 0, LIGHTS.radius, 0xff2020).setBlendMode(Phaser.BlendModes.ADD).setDepth(truck.depth + 0.1);
    const blueLight = s.add.circle(0, 0, LIGHTS.radius, 0x3060ff).setBlendMode(Phaser.BlendModes.ADD).setDepth(truck.depth + 0.1);
    const placeLights = () => {
      const left = truck.x - truck.width / 2;
      const top = truck.y - truck.height;
      redLight.setPosition(left + LIGHTS.redX, top + LIGHTS.y);
      blueLight.setPosition(left + LIGHTS.blueX, top + LIGHTS.y);
    };
    placeLights();

    let red = true;
    s.time.addEvent({
      delay: RAID.lightBlinkMs,
      loop: true,
      callback: () => {
        red = !red;
        overlay.setFillStyle(red ? 0xff2020 : 0x2050ff, 0.12);
        redLight.setAlpha(red ? 1 : 0.15);
        blueLight.setAlpha(red ? 0.15 : 1);
      },
    });

    s.tweens.add({
      targets: truck,
      x: RAID.truckStopX,
      duration: RAID.truckDriveMs,
      ease: 'Cubic.easeOut',
      onUpdate: placeLights,
      onComplete: () => {
        s.cameras.main.shake(120, 0.004);
        this.deployAgents(truck.x - 110, onDone);
      },
    });
  }

  private deployAgents(doorX: number, onDone: () => void): void {
    const s = this.scene;
    const y = WORLD.hunter.y;
    // Por encima del HUD inferior para que no les tape las piernas
    const male = new SerforAgent(s, 'agentMale', doorX, y).setDepth(DEPTH.hud + 2);
    const female = new SerforAgent(s, 'agentFemale', doorX + 40, y).setDepth(DEPTH.hud + 1);
    this.hunter.surrender();
    this.showCryingGirl();

    let arrived = 0;
    const onArrive = () => {
      if (++arrived < 2) return;
      male.setPose('aim');
      female.setPose('aim');
      this.showSpeech(male, onDone);
    };
    male.runTo(this.hunter.x + RAID.maleOffsetX, RAID.agentRunMs, onArrive);
    female.runTo(this.hunter.x + RAID.femaleOffsetX, RAID.agentRunMs + 150, onArrive);
  }

  /** La chica llora al ver llegar a SERFOR... y termina capturada. */
  private showCryingGirl(): void {
    const s = this.scene;
    const girl = s.add
      .sprite(RAID.girlX, WORLD.hunter.y, 'girl', frameIndex('girl', 'surprised'))
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.hud + 1)
      .setAlpha(0);
    s.tweens.add({ targets: girl, alpha: 1, duration: 250 });
    (['surprised', 'tears', 'cover1', 'cover2', 'kneel'] as const).forEach((pose, i) =>
      s.time.delayedCall(i * RAID.girlCryFrameMs, () => girl.setFrame(frameIndex('girl', pose))),
    );
    s.time.delayedCall(RAID.girlCapturedAtMs, () => {
      girl.setTexture('girlCaptured');
      s.cameras.main.shake(100, 0.003);
    });
  }

  private showSpeech(speaker: SerforAgent, onDone: () => void): void {
    const s = this.scene;
    const bubbleX = speaker.x + 190;
    const bubbleY = 395;
    const w = 560;
    const h = 150;

    const bubble = s.add.container(bubbleX, bubbleY).setDepth(DEPTH.banner + 1);
    const g = s.add.graphics();
    g.fillStyle(0xffffff, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.lineStyle(5, 0x1a0f1a, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    // Cola del globo apuntando al agente
    const tipX = speaker.x - bubbleX;
    g.fillStyle(0xffffff, 1).fillTriangle(tipX + 10, h / 2 - 3, tipX + 60, h / 2 - 3, tipX + 12, h / 2 + 46);
    g.lineStyle(5, 0x1a0f1a, 1).lineBetween(tipX + 60, h / 2, tipX + 12, h / 2 + 46).lineBetween(tipX + 12, h / 2 + 46, tipX + 10, h / 2);
    bubble.add(g);
    bubble.add(s.add.image(-w / 2 + 60, 0, 'serforFace'));
    bubble.add(arcadeText(s, -w / 2 + 115, -34, '¡ALTO! ¡MANOS ARRIBA!', 18, { color: COLORS.redText, originX: 0, stroke: false }));
    bubble.add(
      arcadeText(s, -w / 2 + 115, 20, 'CAZAR GALLINAZOS ESTÁ\nPROHIBIDO. ¡QUEDAS DETENIDO!', 12, {
        color: '#1a0f1a',
        originX: 0,
        align: 'left',
        stroke: false,
      }),
    );
    bubble.setScale(0);
    s.tweens.add({ targets: bubble, scale: 1, duration: 280, ease: 'Back.easeOut' });

    const logo = s.add.image(GAME_WIDTH / 2, 170, 'serforLogo').setDepth(DEPTH.banner + 1).setScale(0);
    s.tweens.add({ targets: logo, scale: 1, duration: 320, delay: 150, ease: 'Back.easeOut' });

    const finish = () => {
      if (this.finished) return;
      this.finished = true;
      this.audio.stopSiren();
      onDone();
    };
    s.time.delayedCall(RAID.speechMs, finish);
    // Tocar la pantalla adelanta el final
    s.time.delayedCall(600, () => s.input.once('pointerdown', finish));
  }
}

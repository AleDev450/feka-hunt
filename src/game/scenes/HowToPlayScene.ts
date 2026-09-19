import Phaser from 'phaser';
import { COLORS, DEPTH, GAME_HEIGHT, GAME_WIDTH, PLAYER, SCORING, VICTORY } from '../config/settings';
import { ArcadeButton } from '../ui/ArcadeButton';
import { arcadeText } from '../ui/text';
import { Background } from '../world/Background';
import { SCENES } from './keys';

const LINES: { icon: string | null; text: string }[] = [
  { icon: 'crosshair', text: 'APUNTA CON EL MOUSE O TOCANDO LA PANTALLA.\nCLICK / TAP PARA DISPARAR.' },
  { icon: 'iconVulture', text: `GALLINAZO +${SCORING.hit}   CABEZA (HEADSHOT) +${SCORING.headshot}` },
  { icon: 'shell', text: 'MUNICIÓN LIMITADA EN CADA TANDA.\nSI TE QUEDAS SIN BALAS, LOS GALLINAZOS HUYEN.' },
  { icon: null, text: `ACIERTOS SEGUIDOS = COMBO (HASTA x${SCORING.combo.maxMultiplier}).\nFALLAR REINICIA EL COMBO.` },
  { icon: 'iconVultureEmpty', text: `SI UN GALLINAZO ESCAPA PIERDES UNA VIDA.\nVIDA EXTRA CADA ${PLAYER.extraLifeEvery} PUNTOS.` },
  { icon: null, text: `NIVEL PERFECTO: +${SCORING.perfectLevelBonus}.   P / ESC: PAUSA   M: SONIDO` },
  { icon: 'serforBadge', text: `SUPERA LOS ${VICTORY.levels} NIVELES (CADA UNO MÁS DIFÍCIL) PARA GANAR...\nPERO CUIDADO: ¡SERFOR VIGILA A LOS CAZADORES!` },
];

export class HowToPlayScene extends Phaser.Scene {
  constructor() {
    super(SCENES.howToPlay);
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.input.setDefaultCursor('default');
    new Background(this);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x05050c, 0.72).setOrigin(0).setDepth(DEPTH.hud - 1);
    arcadeText(this, cx, 55, 'CÓMO JUGAR', 36, { color: COLORS.goldText }).setDepth(DEPTH.hud);

    LINES.forEach(({ icon, text }, i) => {
      const y = 130 + i * 70;
      if (icon) this.add.image(170, y, icon).setDepth(DEPTH.hud);
      arcadeText(this, 230, y, text, 13, { align: 'left', originX: 0 }).setDepth(DEPTH.hud);
    });

    new ArcadeButton(this, cx, 650, 'VOLVER', () => this.scene.start(SCENES.menu), { width: 260 }).setDepth(DEPTH.hud);
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start(SCENES.menu));
    this.input.keyboard?.on('keydown-ENTER', () => this.scene.start(SCENES.menu));
  }
}

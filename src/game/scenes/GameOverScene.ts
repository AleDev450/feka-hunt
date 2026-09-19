import Phaser from 'phaser';
import type { GameResult } from '@/types/game';
import { COLORS, DEPTH, GAME_HEIGHT, GAME_WIDTH, STORAGE_KEYS } from '../config/settings';
import { getServices } from '../config/services';
import { ArcadeButton } from '../ui/ArcadeButton';
import { MAX_NAME_LENGTH, NameInput } from '../ui/NameInput';
import { arcadeString, arcadeText } from '../ui/text';
import { isTouchDevice, padScore, storage } from '../utils/gameUtils';
import { Background } from '../world/Background';
import { SCENES } from './keys';

export interface GameOverData {
  result: GameResult;
  record: number;
  isNewRecord: boolean;
}

export class GameOverScene extends Phaser.Scene {
  private data_!: GameOverData;
  private saved = false;

  constructor() {
    super(SCENES.gameOver);
  }

  init(data: GameOverData): void {
    this.data_ = data;
    this.saved = false;
  }

  create(): void {
    const { result, record, isNewRecord } = this.data_;
    const cx = GAME_WIDTH / 2;
    this.input.setDefaultCursor('default');
    new Background(this);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x05050c, 0.72).setOrigin(0).setDepth(DEPTH.hud - 1);
    const text = (x: number, y: number, value: string, size: number, color?: string) =>
      arcadeText(this, x, y, value, size, { color }).setDepth(DEPTH.hud);

    text(cx, 58, result.won ? '¡GANASTE!' : 'GAME OVER', 52, result.won ? COLORS.goldText : COLORS.redText);
    // Gane o pierda, SERFOR lo atrapó por cazar gallinazos
    const arrest = text(cx, 112, 'PERO SERFOR TE DETUVO: ¡LOS GALLINAZOS NO SE CAZAN!', 11, COLORS.white);
    this.add.image(cx - arrest.width / 2 - 30, 112, 'serforBadge').setDepth(DEPTH.hud).setScale(0.6);
    this.add.image(cx + arrest.width / 2 + 30, 112, 'serforBadge').setDepth(DEPTH.hud).setScale(0.6);

    text(cx - 180, 160, 'SCORE', 16, COLORS.goldText);
    text(cx - 180, 198, padScore(result.score), 32);
    text(cx + 180, 160, 'RÉCORD', 16, COLORS.goldText);
    text(cx + 180, 198, padScore(record), 32);
    if (isNewRecord && result.score > 0) {
      const badge = text(cx, 244, '¡NUEVO RÉCORD!', 18, COLORS.redText);
      this.tweens.add({ targets: badge, alpha: 0.2, duration: 400, yoyo: true, repeat: -1 });
    }

    const accuracy = Math.round(result.accuracy * 100);
    text(
      cx,
      285,
      `NIVEL ${result.level}   PRECISIÓN ${accuracy}%   COMBO MÁX ${result.maxCombo}   HEADSHOTS ${result.headshots}`,
      11,
      COLORS.grey,
    );

    if (result.score > 0) this.createNameEntry(result);
    else text(cx, 420, 'SIN PUNTOS PARA EL RANKING', 14, COLORS.grey);

    const again = () => this.scene.start(SCENES.game);
    [
      new ArcadeButton(this, cx - 330, 640, 'JUGAR DE NUEVO', again, { width: 300, fontSize: 14 }),
      new ArcadeButton(this, cx, 640, 'RANKING', () => this.scene.start(SCENES.ranking), { width: 300, fontSize: 14 }),
      new ArcadeButton(this, cx + 330, 640, 'MENÚ', () => this.scene.start(SCENES.menu), { width: 300, fontSize: 14 }),
    ].forEach((b) => b.setDepth(DEPTH.hud));
  }

  private createNameEntry(result: GameResult): void {
    const cx = GAME_WIDTH / 2;
    const { scores } = getServices(this);
    arcadeText(this, cx, 350, `TU NOMBRE (MÁXIMO ${MAX_NAME_LENGTH} LETRAS)`, 14, { color: COLORS.goldText }).setDepth(DEPTH.hud);
    const input = new NameInput(this, cx - 130, 420, storage.get(STORAGE_KEYS.playerName) ?? '').setDepth(DEPTH.hud);
    // En desktop se puede escribir directo; en móvil el foco lo da el toque (abre el teclado)
    if (!isTouchDevice()) input.focus();
    const status = arcadeText(this, cx, 510, '', 12, { color: COLORS.grey }).setDepth(DEPTH.hud);

    const save = async () => {
      if (this.saved) return;
      if (!input.value) {
        status.setText('ESCRIBE TU NOMBRE PRIMERO').setColor(COLORS.redText);
        input.focus();
        return;
      }
      this.saved = true;
      input.setEnabled(false);
      saveButton.setVisible(false);
      status.setText('GUARDANDO...');
      const playerName = input.value;
      storage.set(STORAGE_KEYS.playerName, playerName);
      try {
        await scores.submit({ playerName, result });
        const top = await scores.getLeaderboard({ period: 'all', limit: 100 });
        const position = top.findIndex((e) => e.playerName === playerName && e.score === result.score) + 1;
        if (!this.scene.isActive()) return;
        const where = scores.source === 'online' ? 'ONLINE' : 'LOCAL';
        status.setText(arcadeString(position > 0 ? `¡GUARDADO! PUESTO #${position} (RANKING ${where})` : `¡GUARDADO EN RANKING ${where}!`));
        status.setColor(COLORS.goldText);
      } catch {
        if (!this.scene.isActive()) return;
        this.saved = false;
        input.setEnabled(true);
        saveButton.setVisible(true);
        status.setText('NO SE PUDO GUARDAR. INTENTA DE NUEVO').setColor(COLORS.redText);
      }
    };
    const saveButton = new ArcadeButton(this, cx + 230, 420, 'GUARDAR', () => void save(), { width: 230, fontSize: 14 });
    saveButton.setDepth(DEPTH.hud);
    this.input.keyboard?.on('keydown-ENTER', () => void save());
  }
}

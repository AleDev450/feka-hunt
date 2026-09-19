import Phaser from 'phaser';
import type { LeaderboardPeriod } from '@/types/game';
import { COLORS, DEPTH, GAME_HEIGHT, GAME_WIDTH } from '../config/settings';
import { getServices } from '../config/services';
import { ArcadeButton } from '../ui/ArcadeButton';
import { arcadeString, arcadeText } from '../ui/text';
import { padScore } from '../utils/gameUtils';
import { Background } from '../world/Background';
import { SCENES } from './keys';

const ROWS = 8;
const PERIODS: { period: LeaderboardPeriod; label: string }[] = [
  { period: 'all', label: 'TOTAL' },
  { period: 'weekly', label: 'SEMANA' },
  { period: 'daily', label: 'HOY' },
];

export class RankingScene extends Phaser.Scene {
  private rows: Phaser.GameObjects.Text[] = [];
  private status!: Phaser.GameObjects.Text;
  private tabs: ArcadeButton[] = [];
  private requestId = 0;

  constructor() {
    super(SCENES.ranking);
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const { scores } = getServices(this);
    this.input.setDefaultCursor('default');
    new Background(this);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x05050c, 0.72).setOrigin(0).setDepth(DEPTH.hud - 1);
    arcadeText(this, cx, 55, 'RANKING', 40, { color: COLORS.goldText }).setDepth(DEPTH.hud);

    this.tabs = PERIODS.map(({ period, label }, i) =>
      new ArcadeButton(this, cx + (i - 1) * 230, 125, label, () => void this.loadLeaderboard(period, i), {
        width: 210,
        height: 50,
        fontSize: 12,
      }).setDepth(DEPTH.hud),
    );

    this.rows = Array.from({ length: ROWS }, (_, i) =>
      arcadeText(this, cx, 200 + i * 46, '', 18, { color: i === 0 ? COLORS.goldText : COLORS.white }).setDepth(DEPTH.hud),
    );
    this.status = arcadeText(this, cx, 360, '', 14, { color: COLORS.grey }).setDepth(DEPTH.hud);
    arcadeText(this, cx, 590, scores.source === 'online' ? 'RANKING ONLINE' : 'RANKING LOCAL (ESTE DISPOSITIVO)', 10, {
      color: COLORS.grey,
    }).setDepth(DEPTH.hud);

    const back = new ArcadeButton(this, cx, 650, 'VOLVER', () => this.scene.start(SCENES.menu), { width: 260 });
    back.setDepth(DEPTH.hud);
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start(SCENES.menu));
    void this.loadLeaderboard('all', 0);
  }

  private async loadLeaderboard(period: LeaderboardPeriod, tabIndex: number): Promise<void> {
    const id = ++this.requestId;
    this.tabs.forEach((t, i) => t.setFocused(i === tabIndex));
    this.rows.forEach((r) => r.setText(''));
    this.status.setText('CARGANDO...');
    try {
      const entries = await getServices(this).scores.getLeaderboard({ period, limit: ROWS });
      if (id !== this.requestId || !this.scene.isActive()) return;
      this.status.setText(entries.length === 0 ? arcadeString('AÚN NO HAY PUNTUACIONES') : '');
      entries.forEach((entry, i) => {
        const name = arcadeString(entry.playerName).padEnd(12, ' ');
        this.rows[i].setText(`#${i + 1}  ${name} ${padScore(entry.score)}  NV${entry.level}`);
      });
    } catch {
      if (id !== this.requestId || !this.scene.isActive()) return;
      this.status.setText('NO SE PUDO CARGAR EL RANKING').setColor(COLORS.redText);
    }
  }
}

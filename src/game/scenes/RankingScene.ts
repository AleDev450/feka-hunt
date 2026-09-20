import Phaser from 'phaser';
import type { LeaderboardPeriod, ScoreEntry } from '@/types/game';
import { COLORS, DEPTH, GAME_HEIGHT, GAME_WIDTH } from '../config/settings';
import { getServices } from '../config/services';
import { ArcadeButton } from '../ui/ArcadeButton';
import { arcadeString, arcadeText } from '../ui/text';
import { padScore } from '../utils/gameUtils';
import { Background } from '../world/Background';
import { SCENES } from './keys';

/** Top 50 por periodo, paginado */
const TOP = 50;
const ROWS_PER_PAGE = 10;
const PAGES = Math.ceil(TOP / ROWS_PER_PAGE);

const PERIODS: { period: LeaderboardPeriod; label: string }[] = [
  { period: 'all', label: 'TOTAL' },
  { period: 'weekly', label: 'SEMANA' },
  { period: 'daily', label: 'HOY' },
];

export class RankingScene extends Phaser.Scene {
  private rows: Phaser.GameObjects.Text[] = [];
  private status!: Phaser.GameObjects.Text;
  private pageLabel!: Phaser.GameObjects.Text;
  private tabs: ArcadeButton[] = [];
  private entries: ScoreEntry[] = [];
  private page = 0;
  private requestId = 0;

  constructor() {
    super(SCENES.ranking);
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const { scores } = getServices(this);
    this.input.setDefaultCursor('default');
    new Background(this);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x05050c, 0.78).setOrigin(0).setDepth(DEPTH.hud - 1);
    arcadeText(this, cx, 44, `RANKING TOP ${TOP}`, 32, { color: COLORS.goldText }).setDepth(DEPTH.hud);

    this.tabs = PERIODS.map(({ period, label }, i) =>
      new ArcadeButton(this, cx + (i - 1) * 230, 104, label, () => void this.loadLeaderboard(period, i), {
        width: 210,
        height: 46,
        fontSize: 12,
      }).setDepth(DEPTH.hud),
    );

    this.rows = Array.from({ length: ROWS_PER_PAGE }, (_, i) =>
      arcadeText(this, cx, 165 + i * 38, '', 15, { color: COLORS.white }).setDepth(DEPTH.hud),
    );
    this.status = arcadeText(this, cx, 330, '', 14, { color: COLORS.grey }).setDepth(DEPTH.hud);

    // Paginación
    new ArcadeButton(this, cx - 250, 578, 'ANTERIOR', () => this.turnPage(-1), { width: 230, height: 46, fontSize: 12 })
      .setDepth(DEPTH.hud);
    new ArcadeButton(this, cx + 250, 578, 'SIGUIENTE', () => this.turnPage(1), { width: 230, height: 46, fontSize: 12 })
      .setDepth(DEPTH.hud);
    this.pageLabel = arcadeText(this, cx, 578, '', 14, { color: COLORS.goldText }).setDepth(DEPTH.hud);
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) =>
      this.turnPage(dy > 0 ? 1 : -1),
    );
    this.input.keyboard?.on('keydown-LEFT', () => this.turnPage(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.turnPage(1));

    new ArcadeButton(this, cx, 645, 'VOLVER', () => this.scene.start(SCENES.menu), { width: 260 }).setDepth(DEPTH.hud);
    arcadeText(this, cx, 700, scores.source === 'online' ? 'RANKING ONLINE' : 'RANKING LOCAL (ESTE DISPOSITIVO)', 10, {
      color: COLORS.grey,
    }).setDepth(DEPTH.hud);
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start(SCENES.menu));

    void this.loadLeaderboard('all', 0);
  }

  private async loadLeaderboard(period: LeaderboardPeriod, tabIndex: number): Promise<void> {
    const id = ++this.requestId;
    this.tabs.forEach((t, i) => t.setFocused(i === tabIndex));
    this.entries = [];
    this.page = 0;
    this.renderPage();
    this.status.setText('CARGANDO...').setColor(COLORS.grey);
    try {
      const entries = await getServices(this).scores.getLeaderboard({ period, limit: TOP });
      if (id !== this.requestId || !this.scene.isActive()) return;
      this.entries = entries;
      this.status.setText(entries.length === 0 ? arcadeString('AÚN NO HAY PUNTUACIONES') : '');
      this.renderPage();
    } catch {
      if (id !== this.requestId || !this.scene.isActive()) return;
      this.status.setText('NO SE PUDO CARGAR EL RANKING').setColor(COLORS.redText);
    }
  }

  private turnPage(delta: number): void {
    const pages = Math.max(1, Math.ceil(this.entries.length / ROWS_PER_PAGE));
    this.page = Phaser.Math.Clamp(this.page + delta, 0, pages - 1);
    this.renderPage();
  }

  private renderPage(): void {
    const start = this.page * ROWS_PER_PAGE;
    this.rows.forEach((row, i) => {
      const entry = this.entries[start + i];
      if (!entry) {
        row.setText('');
        return;
      }
      const position = String(start + i + 1).padStart(2, ' ');
      const name = arcadeString(entry.playerName).padEnd(12, ' ');
      row.setText(`#${position}  ${name} ${padScore(entry.score)}  NV${entry.level}`);
      // Oro, plata y bronce para el podio
      row.setColor(start + i === 0 ? COLORS.goldText : start + i <= 2 ? '#d8d8e8' : COLORS.white);
    });
    const pages = Math.max(1, Math.ceil(this.entries.length / ROWS_PER_PAGE));
    this.pageLabel.setText(this.entries.length ? `${this.page + 1}/${Math.min(pages, PAGES)}` : '');
  }
}

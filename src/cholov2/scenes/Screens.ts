import Phaser from 'phaser';
import assets from '../assets.json';
import { label, button } from '../ui/widgets';
import { readResults, record, saveResult } from '../systems/Storage';
import type { Sound } from '../systems/Sound';
import type { RaceResult } from '../config';

export const audio = (scene: Phaser.Scene): Sound => scene.registry.get('audio') as Sound;
const centered = (s: Phaser.Scene, y: number, text: string, size = 24, color = '#ffffff') =>
  label(s, 640, y, text, size, color).setOrigin(0.5);
function background(s: Phaser.Scene): void {
  s.add.image(640, 360, 'cover').setDisplaySize(1280, 720);
  s.add.rectangle(640, 360, 1280, 720, 0x0b121e, 0.88);
}
function start(s: Phaser.Scene): void { audio(s).unlock(); s.scene.start('Drive'); }

export class LoadScene extends Phaser.Scene {
  constructor() { super('Load'); }
  preload(): void {
    centered(this, 305, 'CHOLO FACTOS', 42, '#ffd14b');
    const progress = centered(this, 375, 'Preparando Lima…', 23);
    const failures: string[] = [];
    this.load.on('progress', (value: number) => progress.setText(`Cargando ${Math.round(value * 100)}%`));
    this.load.on('loaderror', (file: Phaser.Loader.File) => failures.push(file.key));
    this.load.once('complete', () => {
      this.registry.set('loadErrors', failures);
      this.load.removeAllListeners('progress');
      this.load.removeAllListeners('loaderror');
    });
    for (const [key, url] of Object.entries(assets)) this.load.image(key, url);
    this.load.image('cover', '/assets/cholov2-inicio.png');
  }
  create(): void {
    const errors = this.registry.get('loadErrors') as string[];
    if (errors?.length) {
      centered(this, 455, 'No se pudieron cargar algunas imágenes. Recarga para reintentar.', 22, '#ffac8a');
      centered(this, 490, errors.slice(0, 5).join(', '), 16);
      return;
    }
    for (const name of ['smoke', 'impact', 'water', 'flame']) {
      this.anims.create({ key: name, frames: Array.from({ length: 6 }, (_, i) => ({ key: `${name}-${i}` })), frameRate: 14, repeat: 0 });
    }
    this.scene.start('Menu');
  }
}

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }
  create(): void {
    audio(this).pause();
    this.add.image(640, 360, 'cover').setDisplaySize(1280, 720);
    this.add.rectangle(145, 73, 290, 146, 0x111723, 0.98);
    label(this, 25, 26, 'TU MEJOR MARCA', 18, '#c9d1dc');
    label(this, 25, 59, record().toLocaleString('es-PE'), 36, '#ffdd5e');
    label(this, 25, 112, 'Guardada en este dispositivo', 15);
    this.add.rectangle(1150, 92, 260, 184, 0x111723, 0.98);
    const soundText = label(this, 1150, 110, '', 17).setOrigin(0.5);
    const soundButton = this.add.image(1150, 56, audio(this).muted ? 'control-mute' : 'control-sound')
      .setDisplaySize(60, 60).setInteractive({ useHandCursor: true });
    const refresh = () => { soundText.setText(audio(this).muted ? 'SONIDO DESACTIVADO' : 'SONIDO ACTIVADO'); soundButton.setTexture(audio(this).muted ? 'control-mute' : 'control-sound'); };
    soundButton.on('pointerup', () => { audio(this).toggle(); refresh(); });
    refresh();
    label(this, 1150, 146, 'FEKA GAMES', 22, '#ffd14b').setOrigin(0.5);
    this.add.rectangle(640, 619, 1280, 202, 0x111723, 0.98);
    centered(this, 544, 'RECOGE PASAJEROS · COBRA SERVICIOS · ESCAPA DE LA POLICÍA', 23, '#ffd14b');
    button(this, 210, 605, 'JUGAR', () => start(this), 240);
    button(this, 495, 605, 'CÓMO JUGAR', () => this.scene.start('Help'), 240);
    button(this, 780, 605, 'RANKING LOCAL', () => this.scene.start('Ranking'), 240);
    button(this, 1065, 605, 'FEKA GAMES', () => { window.location.href = '/'; }, 240);
    centered(this, 678, 'A / D: girar     S: frenar     ESPACIO: turbo     ESC: pausa', 20, '#d3d9df');
    this.input.keyboard?.once('keydown-ENTER', () => start(this));
  }
}

export class HelpScene extends Phaser.Scene {
  constructor() { super('Help'); }
  create(): void {
    background(this);
    centered(this, 66, 'TU TAXI. TUS REGLAS. LIMA TE ESPERA.', 33, '#ffd14b');
    this.add.image(170, 440, 'driver-proud').setOrigin(0.5, 1).setScale(0.95);
    const steps = [
      '1. Gira con A / D o ← / →. El taxi acelera automáticamente.',
      '2. Ve a la vereda derecha cuando veas el marcador verde.',
      '3. Mantén S / ↓ hasta detenerte y llenar la recogida.',
      '4. Lleva al pasajero al destino y vuelve a detenerte para cobrar.',
      '5. Chocar con tráfico activa la policía. ¡Acelera para escapar!',
      '6. ESPACIO usa Factómetro para el turbo. ESC pausa la partida.',
    ];
    steps.forEach((text, i) => label(this, 320, 140 + i * 54, text, 22));
    centered(this, 497, 'En celular puedes mantener dirección + freno o turbo a la vez.', 22, '#ffd14b');
    centered(this, 538, 'Las reparaciones recuperan vida. Sin vida o capturado, termina la carrera.', 20);
    button(this, 470, 630, 'VOLVER', () => this.scene.start('Menu'));
    button(this, 810, 630, '¡A MANEJAR!', () => start(this));
  }
}

export class ResultsScene extends Phaser.Scene {
  constructor() { super('Results'); }
  create(data: { result: RaceResult; id: string }): void {
    audio(this).pause();
    const r = data.result;
    let saved = true;
    try { saveResult(r, 'CHOLO', data.id); } catch { saved = false; }
    background(this);
    this.add.image(230, 568, 'driver-defeat').setOrigin(0.5, 1).setScale(1.15);
    centered(this, 64, 'FIN DE LA CARRERA', 42, '#ffd14b');
    centered(this, 118, r.reason, 26);
    centered(this, 200, `${r.score.toLocaleString('es-PE')} PUNTOS`, 48, '#ffd14b');
    centered(this, 263, `MEJOR MARCA: ${Math.max(record(), r.score).toLocaleString('es-PE')}`, 25);
    label(this, 425, 334, `RECORRIDO    ${(r.distance / 1000).toFixed(2)} km`, 27);
    label(this, 425, 382, `SERVICIOS     ${r.services}    ·    DINERO  S/ ${r.money}`, 27);
    label(this, 425, 430, `ESCAPES        ${r.escapes}    ·    ADELANTAMIENTOS  ${r.nearMisses}`, 23);
    centered(this, 530, saved ? 'Resultado guardado en el ranking de este dispositivo.' : 'No se pudo guardar: el almacenamiento del navegador no está disponible.', 20, '#c9d1dc');
    button(this, 300, 619, 'REINTENTAR', () => start(this), 270);
    button(this, 640, 619, 'RANKING LOCAL', () => this.scene.start('Ranking'), 270);
    button(this, 980, 619, 'MENÚ', () => this.scene.start('Menu'), 270);
  }
}

export class RankingScene extends Phaser.Scene {
  constructor() { super('Ranking'); }
  create(): void {
    background(this);
    centered(this, 65, 'RANKING · CHOLO FACTOS', 38, '#ffd14b');
    centered(this, 113, 'Resultados locales de este navegador', 20, '#c9d1dc');
    label(this, 190, 166, '#', 21); label(this, 270, 166, 'FECHA', 21);
    label(this, 550, 166, 'PUNTOS', 21); label(this, 790, 166, 'SERVICIOS', 21); label(this, 1010, 166, 'S/', 21);
    const rows = readResults().sort((a, b) => b.score - a.score).slice(0, 8);
    rows.forEach((r, i) => {
      const y = 215 + i * 43;
      this.add.rectangle(640, y + 13, 980, 39, i % 2 ? 0x222c38 : 0x151d28, 0.94);
      label(this, 190, y, String(i + 1), 22, '#ffd14b');
      label(this, 270, y, new Date(r.date).toLocaleDateString('es-PE'), 22);
      label(this, 550, y, r.score.toLocaleString('es-PE'), 22, '#ffd14b');
      label(this, 835, y, String(r.services), 22); label(this, 1010, y, String(r.money), 22);
    });
    if (!rows.length) centered(this, 350, 'Tu primera carrera empieza aquí. ¡Consigue la primera marca!', 24);
    button(this, 470, 641, 'MENÚ', () => this.scene.start('Menu'));
    button(this, 810, 641, 'JUGAR', () => start(this));
  }
}

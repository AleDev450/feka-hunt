import Phaser from 'phaser';
import { getServices } from '../config/services';
import { SCENES } from './keys';

/** Espera a que la tipografía arcade esté lista antes de dibujar textos. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    const { fontFamily } = getServices(this);
    const fontReady =
      typeof document !== 'undefined' && document.fonts
        ? document.fonts.load(`16px ${fontFamily}`).catch(() => undefined)
        : Promise.resolve();
    const timeout = new Promise((resolve) => window.setTimeout(resolve, 2500));
    void Promise.race([fontReady, timeout]).then(() => this.scene.start(SCENES.preload));
  }
}

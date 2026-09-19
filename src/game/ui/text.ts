import type Phaser from 'phaser';
import { COLORS } from '../config/settings';
import { getServices } from '../config/services';

export interface ArcadeTextOptions {
  color?: string;
  align?: 'left' | 'center' | 'right';
  originX?: number;
  originY?: number;
  stroke?: boolean;
  wrapWidth?: number;
  lineSpacing?: number;
}

/**
 * La fuente pixel dibuja las mayúsculas acentuadas como minúsculas: se
 * quitan las tildes (manteniendo la Ñ) para que el texto se lea bien.
 */
export const arcadeString = (text: string): string =>
  text.normalize('NFD').replace(/N\u0303/g, '\u00d1').replace(/[\u0300-\u036f]/g, '');

/** Texto con la tipografía arcade, contorno y sombra dura estilo 16-bit. */
export function arcadeText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size = 16,
  options: ArcadeTextOptions = {},
): Phaser.GameObjects.Text {
  const { fontFamily } = getServices(scene);
  const { color = COLORS.white, align = 'center', originX = 0.5, originY = 0.5, stroke = true } = options;
  const label = scene.add.text(x, y, arcadeString(text), {
    fontFamily,
    fontSize: `${size}px`,
    color,
    align,
    lineSpacing: options.lineSpacing ?? Math.round(size * 0.6),
    wordWrap: options.wrapWidth ? { width: options.wrapWidth } : undefined,
  });
  label.setOrigin(originX, originY);
  if (stroke) {
    const px = Math.max(2, Math.round(size / 6));
    label.setStroke(COLORS.shadow, px * 2);
    label.setShadow(px, px, '#000000', 0, true, false);
  }
  return label;
}

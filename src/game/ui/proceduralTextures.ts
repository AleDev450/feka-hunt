import type Phaser from 'phaser';

/**
 * Pequeñas texturas pixel-art generadas por código (no están en el
 * spritesheet de referencia): corazones de vida, chispa de disparo, etc.
 */

type Palette = Record<string, number>;

function pixelMap(scene: Phaser.Scene, key: string, rows: string[], palette: Palette, scale: number): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = palette[ch];
      if (color === undefined) return;
      g.fillStyle(color, 1);
      g.fillRect(x * scale, y * scale, scale, scale);
    });
  });
  g.generateTexture(key, rows[0].length * scale, rows.length * scale);
  g.destroy();
}

const HEART = [
  '.KK...KK.',
  'KRRK.KRRK',
  'KRWRKRRRK',
  'KRRRRRRRK',
  '.KRRRRRK.',
  '..KRRRK..',
  '...KRK...',
  '....K....',
];

const SPARK = [
  '....Y....',
  '....Y....',
  '...YWY...',
  '..YWWWY..',
  'YYWWWWWYY',
  '..YWWWY..',
  '...YWY...',
  '....Y....',
  '....Y....',
];

export const TEX = {
  heart: 'heart',
  heartEmpty: 'heart-empty',
  spark: 'spark',
  pixel: 'pixel',
} as const;

export function createProceduralTextures(scene: Phaser.Scene): void {
  pixelMap(scene, TEX.heart, HEART, { K: 0x1a0f1a, R: 0xe8412c, W: 0xffd0c0 }, 3);
  pixelMap(scene, TEX.heartEmpty, HEART, { K: 0x1a0f1a, R: 0x3a3048, W: 0x4a4058 }, 3);
  pixelMap(scene, TEX.spark, SPARK, { Y: 0xffc02e, W: 0xfff6d0 }, 5);
  pixelMap(scene, TEX.pixel, ['W'], { W: 0xffffff }, 1);
}

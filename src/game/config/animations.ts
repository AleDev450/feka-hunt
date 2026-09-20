import type Phaser from 'phaser';
import { SPRITE_SHEETS, type SheetKey } from './assetManifest';

type Sheets = typeof SPRITE_SHEETS;
export type FrameName<K extends SheetKey> = keyof Sheets[K]['frames'] & string;

export interface FrameMeta {
  index: number;
  body: { x: number; y: number; w: number; h: number };
  head?: { x: number; y: number };
}

/** Metadatos de un frame por nombre (body = caja opaca, head = centro de la cabeza). */
export function frameMeta<K extends SheetKey>(sheet: K, name: FrameName<K>): FrameMeta {
  const frames = SPRITE_SHEETS[sheet].frames as unknown as Record<string, FrameMeta>;
  return frames[name];
}

export const frameIndex = <K extends SheetKey>(sheet: K, name: FrameName<K>): number => frameMeta(sheet, name).index;

/** Metadatos indexados por número de frame. */
export function framesByIndex(sheet: SheetKey): FrameMeta[] {
  const frames = Object.values(SPRITE_SHEETS[sheet].frames) as unknown as FrameMeta[];
  return [...frames].sort((a, b) => a.index - b.index);
}

/** Los 6 tipos de gallinazo de imgs/gallinazos.png */
export const VULTURE_TYPES = ['clasico', 'narizon', 'serio', 'esport', 'mohicano', 'tranquilo'] as const;
export type VultureType = (typeof VULTURE_TYPES)[number];
export type VulturePose = 'fly1' | 'fly2' | 'fly3' | 'fly4' | 'fall' | 'dead';

/** Frame de un tipo concreto de gallinazo */
export const vultureFrame = (type: VultureType, pose: VulturePose): number =>
  frameIndex('vulture', `${type}_${pose}` as FrameName<'vulture'>);

export const vultureFlyAnim = (type: VultureType): string => `vulture-fly-${type}`;

export const ANIM = {
  ronchasDance: 'ronchas-dance',
  jacintoIdle: 'jacinto-idle',
  jacintoRun: 'jacinto-run',
  jacintoHit: 'jacinto-hit',
  agentMaleRun: 'agentMale-run',
  agentFemaleRun: 'agentFemale-run',
  girlWalk: 'girl-walk',
} as const;

export function registerAnimations(scene: Phaser.Scene): void {
  const { anims } = scene;
  if (anims.exists(ANIM.jacintoIdle)) return;

  anims.create({
    key: ANIM.ronchasDance,
    frames: anims.generateFrameNumbers('ronchas', { start: 0, end: 7 }),
    frameRate: 8,
    repeat: -1,
  });

  // Un aleteo por tipo de gallinazo
  for (const type of VULTURE_TYPES) {
    const fly = (['fly1', 'fly2', 'fly3', 'fly4', 'fly3', 'fly2'] as const).map((p) => vultureFrame(type, p));
    anims.create({
      key: vultureFlyAnim(type),
      frames: anims.generateFrameNumbers('vulture', { frames: fly }),
      frameRate: 10,
      repeat: -1,
    });
  }
  // Pequeño Jacinto: 6 frames por animación
  for (const [key, prefix, fps, repeat] of [
    [ANIM.jacintoIdle, 'idle', 7, -1],
    [ANIM.jacintoRun, 'run', 12, -1],
    [ANIM.jacintoHit, 'hit', 9, 0],
  ] as const) {
    anims.create({
      key,
      frames: anims.generateFrameNumbers('jacinto', {
        frames: [1, 2, 3, 4, 5, 6].map((n) => frameIndex('jacinto', `${prefix}${n}` as FrameName<'jacinto'>)),
      }),
      frameRate: fps,
      repeat,
    });
  }
  anims.create({
    key: ANIM.girlWalk,
    frames: anims.generateFrameNumbers('girl', {
      frames: (['walk1', 'walk2', 'walk3', 'walk4', 'walk5'] as const).map((f) => frameIndex('girl', f)),
    }),
    frameRate: 11,
    repeat: -1,
  });
  for (const [key, sheet] of [
    [ANIM.agentMaleRun, 'agentMale'],
    [ANIM.agentFemaleRun, 'agentFemale'],
  ] as const) {
    anims.create({
      key,
      frames: anims.generateFrameNumbers(sheet, { frames: [frameIndex(sheet, 'run'), frameIndex(sheet, 'walk')] }),
      frameRate: 8,
      repeat: -1,
    });
  }
}

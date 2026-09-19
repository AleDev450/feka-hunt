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

export const ANIM = {
  vultureFly: 'vulture-fly',
  dogRun: 'dog-run',
  dogBark: 'dog-bark',
  agentMaleRun: 'agentMale-run',
  agentFemaleRun: 'agentFemale-run',
  girlWalk: 'girl-walk',
} as const;

export function registerAnimations(scene: Phaser.Scene): void {
  const { anims } = scene;
  if (anims.exists(ANIM.vultureFly)) return;

  const fly = (['fly1', 'fly2', 'fly3', 'fly4', 'fly3', 'fly2'] as const).map((f) => frameIndex('vulture', f));
  anims.create({
    key: ANIM.vultureFly,
    frames: anims.generateFrameNumbers('vulture', { frames: fly }),
    frameRate: 10,
    repeat: -1,
  });
  anims.create({
    key: ANIM.dogRun,
    frames: anims.generateFrameNumbers('dog', { frames: [frameIndex('dog', 'run'), frameIndex('dog', 'idle')] }),
    frameRate: 9,
    repeat: -1,
  });
  anims.create({
    key: ANIM.dogBark,
    frames: anims.generateFrameNumbers('dog', { frames: [frameIndex('dog', 'bark'), frameIndex('dog', 'idle')] }),
    frameRate: 6,
    repeat: -1,
  });
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

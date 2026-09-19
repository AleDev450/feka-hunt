import Phaser from 'phaser';
import { ANIM, frameIndex, type FrameName } from '../config/animations';
import { DEPTH } from '../config/settings';

export type AgentSheet = 'agentMale' | 'agentFemale';
/** Ambas hojas tienen las mismas poses en el mismo orden */
export type AgentPose = FrameName<'agentMale'>;

const RUN_ANIM: Record<AgentSheet, string> = {
  agentMale: ANIM.agentMaleRun,
  agentFemale: ANIM.agentFemaleRun,
};

/** Agente de SERFOR (guardaparque) que llega al final de la partida. */
export class SerforAgent extends Phaser.GameObjects.Sprite {
  constructor(
    scene: Phaser.Scene,
    private readonly sheet: AgentSheet,
    x: number,
    y: number,
  ) {
    super(scene, x, y, sheet, frameIndex('agentMale', 'idle'));
    this.setOrigin(0.5, 1).setDepth(DEPTH.hunter + 1);
    scene.add.existing(this);
  }

  setPose(pose: AgentPose): this {
    this.anims.stop();
    return this.setFrame(frameIndex('agentMale', pose));
  }

  runTo(x: number, durationMs: number, onArrive: () => void): void {
    this.setFlipX(x < this.x);
    this.play(RUN_ANIM[this.sheet]);
    this.scene.tweens.add({
      targets: this,
      x,
      duration: durationMs,
      ease: 'Sine.easeOut',
      onComplete: onArrive,
    });
  }
}

import Phaser from 'phaser';

export class Effects {
  private readonly pool: Phaser.GameObjects.Sprite[];
  constructor(scene: Phaser.Scene) {
    this.pool = Array.from({ length: 12 }, () => {
      const sprite = scene.add.sprite(0, 0, 'smoke-0').setVisible(false).setActive(false).setDepth(900);
      sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => sprite.setVisible(false).setActive(false));
      return sprite;
    });
  }
  emit(key: 'smoke' | 'impact' | 'water' | 'flame', x: number, y: number): void {
    const sprite = this.pool.find(s => !s.active);
    if (!sprite) return;
    sprite.setPosition(x, y).setScale(key === 'flame' ? 0.34 : 0.5).setAlpha(key === 'smoke' ? 0.55 : 0.85)
      .setVisible(true).setActive(true).play(key);
  }
  pause(paused: boolean): void {
    for (const sprite of this.pool) if (sprite.active) {
      if (paused) sprite.anims.pause(); else sprite.anims.resume();
    }
  }
}

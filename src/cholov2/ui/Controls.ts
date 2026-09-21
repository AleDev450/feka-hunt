import Phaser from 'phaser';
import type { Controls as InputState } from '../config';

export class Controls {
  private readonly keys:Record<string,Phaser.Input.Keyboard.Key>;
  private readonly held=new Map<number,string>();
  constructor(private readonly scene:Phaser.Scene){
    this.keys=scene.input.keyboard!.addKeys('A,D,S,LEFT,RIGHT,DOWN,SPACE') as Record<string,Phaser.Input.Keyboard.Key>;
    const positions:[string,number,string][]=[['left',70,'A / ←'],['right',185,'D / →'],['brake',1095,'FRENO'],['turbo',1210,'TURBO']];
    for(const [action,x,label] of positions){
      const button=scene.add.image(x,637,`control-${action}`).setDisplaySize(92,92).setDepth(2200).setInteractive();
      scene.add.text(x,695,label,{fontFamily:'Arial',fontSize:'16px',fontStyle:'bold',color:'#ffffff',stroke:'#000000',strokeThickness:4}).setOrigin(0.5).setDepth(2200);
      button.on('pointerdown',(p:Phaser.Input.Pointer)=>this.held.set(p.id,action));
      button.on('pointerout',(p:Phaser.Input.Pointer)=>this.held.delete(p.id));
    }
    const release=(p:Phaser.Input.Pointer)=>this.held.delete(p.id);
    scene.input.on('pointerup',release);scene.input.on('pointerupoutside',release);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      scene.input.off('pointerup',release);scene.input.off('pointerupoutside',release);this.clear();
    });
  }
  read():InputState{
    const values=[...this.held.values()];
    return {steer:Number(this.keys.D.isDown||this.keys.RIGHT.isDown||values.includes('right'))-Number(this.keys.A.isDown||this.keys.LEFT.isDown||values.includes('left')),brake:this.keys.S.isDown||this.keys.DOWN.isDown||values.includes('brake'),turbo:this.keys.SPACE.isDown||values.includes('turbo')};
  }
  clear():void{this.held.clear();this.scene.input.keyboard?.resetKeys();}
}

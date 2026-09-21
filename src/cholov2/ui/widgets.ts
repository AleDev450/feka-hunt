import type Phaser from 'phaser';
import type { Sound } from '../systems/Sound';
export function label(s:Phaser.Scene,x:number,y:number,value:string,size=22,color='#ffffff'){
  return s.add.text(x,y,value,{fontFamily:'Arial, sans-serif',fontSize:`${size}px`,fontStyle:'bold',color,stroke:'#141821',strokeThickness:3}).setDepth(2001);
}
export function button(s:Phaser.Scene,x:number,y:number,value:string,action:()=>void,width=300){
  const img=s.add.image(x,y,'button-red').setDisplaySize(width,62).setDepth(2010).setInteractive({useHandCursor:true});
  label(s,x,y,value,22).setOrigin(0.5).setDepth(2011);
  img.on('pointerover',()=>img.setTexture('button-gold')).on('pointerout',()=>img.setTexture('button-red')).on('pointerup',()=>{
    const sound=s.registry.get('audio') as Sound|undefined;
    sound?.unlock();sound?.play('button');action();
  });
  return img;
}

import Phaser from 'phaser';
import { CONFIG as C } from '../config';

export class Road {
  private readonly g:Phaser.GameObjects.Graphics;
  private readonly skyline:Phaser.GameObjects.Image;
  private readonly props:{image:Phaser.GameObjects.Image;x:number;z:number;height:number}[]=[];
  distance=0;cameraX=0;
  constructor(scene:Phaser.Scene){
    scene.add.image(640,0,'sky').setOrigin(0.5,0).setDisplaySize(1280,310).setDepth(-30);
    this.skyline=scene.add.image(640,C.horizon+8,'skyline').setOrigin(0.5,1).setDisplaySize(1400,270).setDepth(-29);
    this.g=scene.add.graphics().setDepth(-20);
    const keys=['house','brick','colonial','tower','shop','restaurant','tree','palm','lamp','shelter','signRight','signLeft'];
    for(let i=0;i<36;i++){
      const key=keys[i%keys.length];
      const roadside=key==='lamp'||key.startsWith('sign');
      this.props.push({image:scene.add.image(0,0,key).setOrigin(0.5,1),x:(i%2?-1:1)*(roadside?2.6:3.5),z:35+Math.floor(i/2)*25,height:key==='lamp'?280:key.startsWith('sign')?150:key==='tree'?320:520});
    }
  }
  private bend(z:number):number{return Math.sin(z/250)*0.22+Math.sin(z/630)*0.18;}
  project(x:number,z:number):{x:number;y:number;scale:number} {
    const scale=C.projectionDistance/(Math.max(-4,z)+C.projectionDistance);
    const curve=(this.bend(this.distance+z)-this.bend(this.distance))*250*(1-scale);
    return {x:640+curve+(x-this.cameraX*0.65)*C.roadHalfWidth/C.roadHalfWorld*scale,y:C.horizon+(C.roadBottom-C.horizon)*scale,scale};
  }
  private strip(z1:number,z2:number,l:number,r:number,color:number):void{
    const a=this.project(l,z1),b=this.project(r,z1),c=this.project(r,z2),d=this.project(l,z2);
    this.g.fillStyle(color).fillTriangle(a.x,a.y,b.x,b.y,c.x,c.y).fillTriangle(a.x,a.y,c.x,c.y,d.x,d.y);
  }
  draw(distance:number,playerX:number):void{
    this.distance=distance;this.cameraX=playerX;
    this.skyline.x=640-this.bend(distance)*60-playerX*7;
    this.g.clear().fillStyle(0x9b9b83).fillRect(0,C.horizon,1280,720-C.horizon);
    const start=Math.floor(distance/8)*8;
    for(let abs=start+C.viewDistance;abs>=start-8;abs-=8){
      const z1=Math.max(-4,abs-distance),z2=abs+8-distance;if(z2<=-4)continue;
      const band=Math.floor(abs/8)%2===0;
      this.strip(z1,z2,-2.2,2.2,band?0xaaa799:0xb7b2a4);
      this.strip(z1,z2,-1.65,1.65,band?0xf2d4a0:0xe3ba81);
      this.strip(z1,z2,-1.5,1.5,band?0x41464f:0x454a52);
      for(const side of [-1,1])this.strip(z1,z2,side*1.48-0.02,side*1.48+0.02,0xf6cf47);
      if(band)for(const x of [-0.5,0.5])this.strip(z1,z2,x-0.016,x+0.016,0xf4ecda);
    }
    for(const prop of this.props){
      while(prop.z<distance-14)prop.z+=450;
      const rel=prop.z-distance,p=this.project(prop.x,rel);
      prop.image.setPosition(p.x,p.y).setScale(prop.height/prop.image.height*p.scale).setDepth(p.y).setVisible(rel>0&&rel<C.viewDistance);
    }
  }
}

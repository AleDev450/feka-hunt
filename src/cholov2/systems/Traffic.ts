import { CONFIG as C, moveToward } from '../config';
import type { Player } from './Player';
import type { Passengers } from './Passengers';
export type EntityKind='vehicle'|'cone'|'barrier'|'hole'|'bump'|'puddle'|'rubble'|'coin'|'repair';
export interface RoadEntity { active:boolean; kind:EntityKind; texture:string; x:number; targetX:number; z:number; speed:number; width:number; resolved:boolean; signal:number; timer:number; }
const cars=['auto','hatchback','combi','bus','mototaxi','truck'];
const obstacles=['cone','barrier','hole','bump','puddle','rubble','coin','repair'] as const;
export class Traffic {
  readonly pool:RoadEntity[]=Array.from({length:C.traffic.poolSize},()=>({active:false,kind:'vehicle',texture:'auto',x:0,targetX:0,z:0,speed:0,width:0.25,resolved:false,signal:0,timer:0}));
  nextZ:number=C.traffic.initialSpawn;
  constructor(private readonly random:()=>number=Math.random){}
  update(dt:number,player:Player,passengers:Passengers,difficulty:number):void {
    if(player.z>=this.nextZ){this.spawn(player,passengers);this.nextZ=player.z+Math.max(C.traffic.minInterval,C.traffic.spawnInterval-difficulty*C.traffic.intervalReduction);}
    for(const e of this.pool){
      if(!e.active)continue;
      e.z+=e.speed*dt;
      e.timer+=dt;
      if(e.texture==='combi')e.speed=9+Math.sin(e.timer*0.7)*4;
      if(e.texture==='mototaxi' && e.timer>5 && e.z-player.z>80){
        e.timer=0;e.targetX=e.x<0?0:e.x>0?0:(this.random()<0.5?-1:1);e.signal=1.5;
      }
      if(e.signal>0)e.signal-=dt;else e.x=moveToward(e.x,e.targetX,dt*0.4);
      if(e.z<player.z-40||e.z>player.z+600)e.active=false;
    }
  }
  private spawn(player:Player,passengers:Passengers):void {
    const e=this.pool.find(v=>!v.active);if(!e)return;
    const z=player.z+C.traffic.spawnAhead+this.random()*C.traffic.spawnSpread;if(passengers.protected(z))return;
    const vehicle=this.random()<C.traffic.vehicleChance;
    const kind=vehicle?'vehicle':obstacles[Math.floor(this.random()*obstacles.length)];
    const texture=vehicle?cars[Math.floor(this.random()*cars.length)]:kind;
    const x=Math.floor(this.random()*3)-1;
    // One object per longitudinal band leaves two clear lanes and a clear shoulder.
    if(this.pool.some(v=>v.active && Math.abs(v.z-z)<C.traffic.minimumGap))return;
    Object.assign(e,{active:true,kind,texture,x,targetX:x,z,speed:vehicle?(texture==='bus'||texture==='truck'?9:12+this.random()*7):0,width:texture==='bus'||texture==='truck'?0.37:0.25,resolved:false,signal:0,timer:0});
  }
}

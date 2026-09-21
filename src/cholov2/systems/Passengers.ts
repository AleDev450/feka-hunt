import { CONFIG as C } from '../config';
import type { Player } from './Player';
const destinations=['Centro de Lima','La Victoria','San Isidro','Miraflores'];
export class Passengers {
  aboard=false; zoneZ=170; hold=0; deadline:number=C.serviceDeadline; completed=0; person=0;
  destination='La Victoria'; missed=false;
  update(dt:number,player:Player,chased:boolean):'pickup'|'delivery'|null {
    if(chased){this.hold=0;return null;}
    if(this.aboard)this.deadline=Math.max(0,this.deadline-dt);
    if(player.z>this.zoneZ+C.zoneLength){this.zoneZ=player.z+150;this.hold=0;this.missed=true;}
    const near=Math.abs(this.zoneZ-player.z)<C.zoneLength;
    if(near && player.x>1.45 && player.speed<=C.pickupSpeed)this.hold+=dt;else this.hold=0;
    if(this.hold<C.stopHold)return null;
    this.hold=0;this.missed=false;
    if(!this.aboard){
      this.aboard=true;this.destination=destinations[this.completed%destinations.length];
      this.deadline=C.serviceDeadline;this.zoneZ=player.z+C.serviceDistance+this.completed*80;return 'pickup';
    }
    this.aboard=false;this.completed++;this.person=this.completed%6;this.zoneZ=player.z+180;return 'delivery';
  }
  protected(z:number):boolean{return Math.abs(z-this.zoneZ)<65;}
}

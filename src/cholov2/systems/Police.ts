import { CONFIG as C, clamp } from '../config';
export type PoliceState='clear'|'pursued'|'escaping'|'captured';
export class Police {
  state:PoliceState='clear'; gap:number=C.policeStartGap; age=0; closeTime=0; escapeTime=0;
  get active():boolean{return this.state==='pursued'||this.state==='escaping';}
  start():void {
    if(this.state==='captured')return;
    if(this.active){this.gap=Math.max(15,this.gap-C.policeCrashPenalty);return;}
    this.state='pursued';this.gap=C.policeStartGap;this.age=0;this.closeTime=0;this.escapeTime=0;
  }
  update(dt:number,speed:number):boolean {
    if(!this.active)return false;
    this.age+=dt;
    this.gap=clamp(this.gap+(speed-C.policeSpeed)*dt*C.policeClosingRate,0,C.policeMaxGap);
    if(this.age>C.policeGrace && this.gap<12)this.closeTime+=dt;else this.closeTime=0;
    if(this.closeTime>=C.policeCaptureSeconds){this.state='captured';return false;}
    if(this.gap>=C.policeEscapeGap){this.state='escaping';this.escapeTime+=dt;}else {this.state='pursued';this.escapeTime=0;}
    if(this.escapeTime>=C.policeEscapeSeconds){this.state='clear';this.escapeTime=0;return true;}
    return false;
  }
}

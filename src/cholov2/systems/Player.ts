import { CONFIG as C, clamp, moveToward, type Controls } from '../config';

export class Player {
  x=0; z=0; speed=0; health:number=C.maxHealth; fact:number=C.initialFact;
  invincible=0; slippery=0; turbo=false; steer=0;
  update(dt:number,input:Controls,difficulty:number):void {
    this.invincible=Math.max(0,this.invincible-dt);
    this.slippery=Math.max(0,this.slippery-dt);
    this.turbo=input.turbo && !input.brake && this.fact>0;
    if(this.turbo) this.fact=Math.max(0,this.fact-C.turboDrain*dt);
    const target=input.brake?0:this.turbo?C.turboSpeed:Math.min(C.maxCruise,C.cruise+difficulty*1.2);
    this.speed=moveToward(this.speed,target,(input.brake?C.brakeForce:C.acceleration)*dt);
    this.steer=moveToward(this.steer,input.steer,dt*(this.slippery>0?2:7));
    this.x=clamp(this.x+this.steer*C.steerSpeed*dt*(0.25+Math.min(1,this.speed/15)),-C.maxLateral,C.maxLateral);
    this.z+=this.speed*dt;
  }
  hit(damage:number):boolean {
    if(this.invincible>0)return false;
    this.health=Math.max(0,this.health-damage); this.speed*=0.48; this.invincible=C.invulnerability;
    return true;
  }
}

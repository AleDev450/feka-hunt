import type { RaceEvent } from '../config';
export class Sound {
  muted=false;private ctx:AudioContext|null=null;private gain:GainNode|null=null;private engine:OscillatorNode|null=null;private engineGain:GainNode|null=null;private siren:OscillatorNode|null=null;private sirenGain:GainNode|null=null;
  constructor(){try{this.muted=localStorage.getItem('cholo-factos:muted')==='1';}catch{}}
  unlock():void{
    if(typeof AudioContext==='undefined')return;
    if(!this.ctx){
      this.ctx=new AudioContext();this.gain=this.ctx.createGain();this.gain.connect(this.ctx.destination);this.gain.gain.value=this.muted?0:0.16;
      this.engine=this.ctx.createOscillator();this.engine.type='triangle';this.engineGain=this.ctx.createGain();this.engineGain.gain.value=0;this.engine.connect(this.engineGain).connect(this.gain);this.engine.start();
      this.siren=this.ctx.createOscillator();this.sirenGain=this.ctx.createGain();this.sirenGain.gain.value=0;this.siren.connect(this.sirenGain).connect(this.gain);this.siren.start();
    }
    void this.ctx.resume().catch(()=>{});
  }
  toggle():void{this.muted=!this.muted;try{localStorage.setItem('cholo-factos:muted',String(Number(this.muted)));}catch{}if(this.gain)this.gain.gain.value=this.muted?0:0.16;}
  update(speed:number,chased:boolean,time:number):void{if(!this.ctx)return;if(this.engineGain)this.engineGain.gain.value=0.08;this.engine?.frequency.setTargetAtTime(38+speed*5,this.ctx.currentTime,0.08);this.siren?.frequency.setValueAtTime(550+Math.sin(time*7)*220,this.ctx.currentTime);if(this.sirenGain)this.sirenGain.gain.value=chased?0.13:0;}
  play(event:RaceEvent|'button'):void{
    if(!this.ctx||!this.gain)return;const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=event==='crash'?'sawtooth':'sine';const f=event==='crash'?120:event==='water'?260:event==='pickup'?660:event==='delivery'?880:440;
    o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(event==='crash'?35:f*1.5,t+0.16);g.gain.setValueAtTime(0.4,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.23);o.connect(g).connect(this.gain);o.start(t);o.stop(t+0.25);
  }
  pause():void{if(this.engineGain)this.engineGain.gain.value=0;if(this.sirenGain)this.sirenGain.gain.value=0;void this.ctx?.suspend().catch(()=>{});}
  destroy():void{void this.ctx?.close().catch(()=>{});this.ctx=null;}
}

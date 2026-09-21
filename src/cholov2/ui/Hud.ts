import type Phaser from 'phaser';
import type { Race } from '../systems/Race';
import { label } from './widgets';
export class Hud {
  private readonly score;private readonly money;private readonly status;private readonly speed;private readonly life;private readonly fact;
  private readonly service;private readonly portrait;private readonly police;private readonly mirror;private readonly cop;
  constructor(s:Phaser.Scene){
    s.add.rectangle(18,16,265,106,0x111723,0.92).setOrigin(0).setDepth(2000).setStrokeStyle(2,0xf1be3f);
    label(s,35,24,'PUNTAJE',14,'#b6c2ce');this.score=label(s,35,42,'0',30,'#ffe15d');this.money=label(s,35,80,'S/ 0',23,'#87edb5');
    s.add.rectangle(990,16,270,106,0x111723,0.92).setOrigin(0).setDepth(2000).setStrokeStyle(2,0xf1be3f);
    this.speed=label(s,1007,27,'0 km/h',27);this.life=label(s,1007,70,'VIDA 100',22,'#87edb5');
    s.add.rectangle(640,683,400,26,0x111723,0.95).setDepth(2000).setStrokeStyle(2,0xffd149);
    this.fact=s.add.rectangle(444,683,1,18,0xffcc38).setOrigin(0,0.5).setDepth(2001);
    label(s,640,648,'FACTÓMETRO · ESPACIO = TURBO',16,'#ffe15d').setOrigin(0.5);
    s.add.rectangle(310,16,660,106,0x111723,0.92).setOrigin(0).setDepth(2000);
    this.portrait=s.add.image(352,116,'passenger-0').setOrigin(0.5,1).setScale(86/240).setDepth(2001);
    this.service=label(s,392,29,'BUSCA UN PASAJERO',21,'#ffe15d');
    this.status=label(s,392,67,'',18).setWordWrapWidth(558);
    this.mirror=s.add.image(640,192,'mirror').setScale(0.85).setDepth(2000).setVisible(false);
    this.cop=s.add.image(640,220,'policeFront-0').setOrigin(0.5,1).setDepth(2001).setVisible(false);
    this.police=label(s,640,254,'',19,'#ffdf57').setOrigin(0.5);
  }
  update(r:Race):void{
    const p=r.player,pass=r.passengers,dist=Math.max(0,Math.ceil(pass.zoneZ-p.z));
    this.score.setText(Math.floor(r.score).toLocaleString('es-PE'));this.money.setText(`S/ ${r.money}`);this.speed.setText(`${Math.round(p.speed*3.6)} km/h`);this.life.setText(`VIDA ${p.health}`).setColor(p.health<30?'#ff7a70':'#87edb5');this.fact.setSize(392*p.fact/100,18);
    this.portrait.setTexture(`passenger-${pass.person}`);
    this.service.setText(pass.aboard?`DESTINO: ${pass.destination.toUpperCase()}`:'PASAJERO EN LA VEREDA DERECHA');
    this.status.setText(r.police.active?'Pierde a la policía para continuar':pass.hold>0?`Mantén el freno · ${Math.min(100,Math.round(pass.hold/1.1*100))}%`:dist<55?'Acércate a la derecha y FRENA hasta detenerte':`${dist} m · ${pass.aboard?(pass.deadline>0?`${Math.ceil(pass.deadline)} s para bonificación`:'Sin bono · puedes completar el servicio'):(pass.missed?'Nueva oportunidad de parada':'Sigue el marcador verde')}`);
    this.mirror.setVisible(r.police.active);this.cop.setVisible(r.police.active);
    if(r.police.active){this.cop.setTexture(`policeFront-${Math.floor(r.elapsed*6)%2}`).setScale(0.15+(165-r.police.gap)/750);}
    this.police.setText(r.police.active?`${r.police.state==='escaping'?'ESCAPANDO':'POLICÍA'} · ${Math.round(r.police.gap)} m${r.police.closeTime>0?' · ¡ACELERA!':''}`:'');
  }
}

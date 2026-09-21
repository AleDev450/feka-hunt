import { CONFIG as C, type Controls, type RaceEvent, type RaceResult } from '../config';
import { Player } from './Player';
import { Police } from './Police';
import { Passengers } from './Passengers';
import { Traffic } from './Traffic';

export class Race {
  readonly player = new Player();
  readonly police = new Police();
  readonly passengers = new Passengers();
  readonly traffic: Traffic;
  score = 0;
  money = 0;
  elapsed = 0;
  nearMisses = 0;
  escapes = 0;
  crashes = 0;
  reason = '';
  events: RaceEvent[] = [];

  constructor(random: () => number = Math.random) { this.traffic = new Traffic(random); }

  get difficulty(): number {
    return Math.min(C.maxDifficulty, Math.floor(this.player.z / C.difficultyDistance) + this.passengers.completed * C.difficultyPerService);
  }

  update(delta: number, input: Controls): void {
    this.events = [];
    if (this.reason) return;
    const dt = Math.min(Math.max(0, delta), 0.05);
    const p = this.player, oldZ = p.z, wasTurbo = p.turbo, reward = C.rewards;
    this.elapsed += dt;
    p.update(dt, input, this.difficulty);
    if (p.turbo && !wasTurbo) this.events.push('turbo');
    this.score += (p.z - oldZ) * reward.distance;
    if (p.invincible === 0 && !input.brake && !p.turbo) p.fact = Math.min(100, p.fact + dt * reward.cleanFactPerSecond);
    this.traffic.update(dt, p, this.passengers, this.difficulty);

    for (const e of this.traffic.pool) {
      if (!e.active || e.resolved) continue;
      const rel = e.z - p.z, prevRel = e.z - e.speed * dt - oldZ, lateral = Math.abs(e.x - p.x);
      // Swept longitudinal contact, using world positions rather than sprite pixels.
      if (rel < 4 && prevRel > -4 && lateral < e.width + 0.23) {
        e.resolved = true;
        if (e.kind === 'coin') {
          this.money += reward.coinMoney; this.score += reward.coinScore;
          this.events.push('coin'); e.active = false;
        } else if (e.kind === 'repair') {
          p.health = Math.min(C.maxHealth, p.health + reward.repair);
          this.events.push('repair'); e.active = false;
        } else if (e.kind === 'puddle') {
          p.slippery = 2; p.speed *= 0.86; this.events.push('water');
        } else if ((e.kind !== 'hole' && e.kind !== 'bump') || p.speed > 14) {
          if (p.hit(C.damages[e.kind])) {
            this.crashes++; this.events.push('crash');
            if (e.kind === 'vehicle') this.police.start();
          }
        }
      } else if (rel < -5) {
        e.resolved = true;
        if (e.kind === 'vehicle' && lateral < 0.8 && lateral > e.width + 0.23) {
          this.nearMisses++; this.score += reward.nearScore;
          p.fact = Math.min(100, p.fact + reward.nearFact); this.events.push('near');
        }
      }
    }

    if (this.police.update(dt, p.speed)) {
      this.escapes++; this.score += reward.escapeScore;
      p.fact = Math.min(100, p.fact + reward.escapeFact); this.events.push('escape');
    }
    if (p.health <= 0) this.reason = 'El taxi quedó fuera de servicio';
    if (this.police.state === 'captured') this.reason = 'La policía te capturó';
    if (this.reason) return;
    const service = this.passengers.update(dt, p, this.police.active);
    if (service) {
      this.events.push(service);
      if (service === 'delivery') {
        const pay = reward.baseFare + (this.passengers.deadline > 0 ? Math.ceil(this.passengers.deadline / reward.bonusSeconds) : 0);
        this.money += pay; this.score += pay * reward.fareScore;
        p.fact = Math.min(100, p.fact + reward.deliveryFact);
      }
    }
  }

  result(): RaceResult {
    return { score: Math.floor(this.score), money: this.money, distance: this.player.z, services: this.passengers.completed, nearMisses: this.nearMisses, escapes: this.escapes, crashes: this.crashes, duration: this.elapsed, reason: this.reason };
  }
}

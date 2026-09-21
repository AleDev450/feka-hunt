export const CONFIG = {
  width: 1280, height: 720, horizon: 230, roadBottom: 610, roadHalfWidth: 530,
  viewDistance: 420, projectionDistance: 14, roadHalfWorld: 1.5,
  cruise: 23, maxCruise: 31, turboSpeed: 41, acceleration: 7, brakeForce: 18,
  steerSpeed: 1.4, maxLateral: 1.95, maxHealth: 100, invulnerability: 1.4,
  turboDrain: 20, initialFact: 45, pickupSpeed: 3, stopHold: 1.1,
  serviceDistance: 650, serviceDeadline: 60, zoneLength: 20,
  policeStartGap: 80, policeMaxGap: 165, policeEscapeGap: 145,
  policeGrace: 4, policeCaptureSeconds: 2.5, policeEscapeSeconds: 4,
  policeSpeed: 19, policeClosingRate: 1.3, policeCrashPenalty: 28,
  difficultyDistance: 900, difficultyPerService: 0.5, maxDifficulty: 8,
  traffic: { poolSize: 30, initialSpawn: 105, spawnInterval: 68, minInterval: 32, intervalReduction: 4, spawnAhead: 220, spawnSpread: 60, minimumGap: 38, vehicleChance: 0.65 },
  rewards: { distance: 0.7, coinMoney: 5, coinScore: 100, repair: 25, nearScore: 150, nearFact: 8, escapeScore: 700, escapeFact: 15, baseFare: 15, bonusSeconds: 4, fareScore: 50, deliveryFact: 30, cleanFactPerSecond: 0.9 },
  damages: { vehicle: 15, cone: 5, barrier: 9, hole: 9, bump: 5, puddle: 0, rubble: 20 },
} as const;
export const clamp = (v:number,min:number,max:number) => Math.max(min,Math.min(max,v));
export const moveToward = (v:number,target:number,step:number) => v+clamp(target-v,-step,step);
export interface Controls { steer:number; brake:boolean; turbo:boolean; }
export type RaceEvent = 'crash'|'water'|'pickup'|'delivery'|'coin'|'repair'|'escape'|'near'|'turbo';
export interface RaceResult { score:number; money:number; distance:number; services:number; nearMisses:number; escapes:number; crashes:number; duration:number; reason:string; }

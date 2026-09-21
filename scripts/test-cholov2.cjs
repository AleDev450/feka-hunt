// Exercise the real simulation without a browser or a second game implementation.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(output.outputText, filename);
};
const { Race } = require('../src/cholov2/systems/Race.ts');
const { Player } = require('../src/cholov2/systems/Player.ts');
const { Police } = require('../src/cholov2/systems/Police.ts');
const { Passengers } = require('../src/cholov2/systems/Passengers.ts');
const { Traffic } = require('../src/cholov2/systems/Traffic.ts');
const { CONFIG: C } = require('../src/cholov2/config.ts');
const neutral = { steer: 0, brake: false, turbo: false };
const brake = { ...neutral, brake: true };
function tick(race, seconds, controls = neutral) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) race.update(1 / 60, controls);
}
function entity(race, kind = 'vehicle', lateral = 0) {
  const e = race.traffic.pool[0];
  Object.assign(e, { active: true, kind, texture: kind === 'vehicle' ? 'auto' : kind, x: lateral, targetX: lateral, z: race.player.z + 1, speed: 0, width: 0.25, resolved: false, timer: 0, signal: 0 });
  return e;
}

test('automatic acceleration, full stop, release and bounded smooth steering', () => {
  const r = new Race(); r.traffic.nextZ = Infinity;
  tick(r, 5); assert.equal(r.player.speed, C.cruise);
  tick(r, 3, brake); assert.equal(r.player.speed, 0);
  const stopped = r.player.z; tick(r, 3, brake); assert.equal(r.player.z, stopped);
  tick(r, 1); assert.ok(r.player.speed > 0);
  const before = r.player.x; r.update(1 / 60, { ...neutral, steer: 1 });
  assert.ok(r.player.x > before && r.player.x < 0.1);
  tick(r, 10, { ...neutral, steer: 1 }); assert.equal(r.player.x, C.maxLateral);
});

test('movement at 30/60/120 FPS stays consistent and long frame is capped', () => {
  const distances = [30, 60, 120].map(fps => {
    const r = new Race(); r.traffic.nextZ = Infinity;
    for (let i = 0; i < fps * 10; i++) r.update(1 / fps, neutral);
    return r.player.z;
  });
  assert.ok(Math.max(...distances) - Math.min(...distances) < 0.4);
  const r = new Race(); r.update(60, neutral); assert.equal(r.elapsed, 0.05);
});

test('complete service requires right shoulder, low speed and a held stop', () => {
  const r = new Race(); r.traffic.nextZ = Infinity;
  r.player.z = r.passengers.zoneZ;
  tick(r, 2, brake); assert.equal(r.passengers.aboard, false);
  r.player.x = 1.8; r.player.speed = 20;
  r.update(1 / 60, neutral); assert.equal(r.passengers.hold, 0);
  r.player.speed = 0; tick(r, 0.5, brake); assert.equal(r.passengers.aboard, false);
  tick(r, 0.7, brake); assert.equal(r.passengers.aboard, true);
  assert.ok(r.passengers.zoneZ > r.player.z + 600);
  r.player.z = r.passengers.zoneZ;
  tick(r, 1.2, brake);
  assert.equal(r.passengers.aboard, false); assert.equal(r.passengers.completed, 1);
  assert.ok(r.money > 15); assert.ok(r.score >= r.money * 50);
  assert.equal(r.passengers.person, 1);
});

test('late delivery pays base fare; passing a stop offers another opportunity', () => {
  const r = new Race(); r.traffic.nextZ = Infinity;
  r.passengers.aboard = true; r.passengers.deadline = 0;
  r.player.x = 1.8; r.player.z = r.passengers.zoneZ;
  tick(r, 1.2, brake); assert.equal(r.money, 15);
  r.player.z = r.passengers.zoneZ + C.zoneLength + 1;
  r.update(1 / 60, brake);
  assert.equal(r.passengers.missed, true); assert.ok(r.passengers.zoneZ > r.player.z + 100);
});

test('police suspends deadline and stops, preserving passenger and destination', () => {
  const p = new Player(), service = new Passengers();
  p.x = 1.8; p.z = service.zoneZ;
  service.aboard = true; service.deadline = 21; service.hold = 1;
  const destination = service.destination;
  for (let i = 0; i < 600; i++) assert.equal(service.update(1 / 60, p, true), null);
  assert.equal(service.deadline, 21); assert.equal(service.hold, 0);
  assert.equal(service.aboard, true); assert.equal(service.destination, destination);
  p.z += 200; service.update(1 / 60, p, false);
  assert.equal(service.missed, true); assert.ok(service.zoneZ > p.z);
});

test('vehicle impact starts police, resolves once and grants brief impact protection', () => {
  const r = new Race(); entity(r);
  r.update(1 / 60, neutral); assert.equal(r.player.health, 85); assert.equal(r.police.active, true);
  tick(r, 0.5, brake); assert.equal(r.player.health, 85); assert.equal(r.crashes, 1);
  entity(r); r.update(1 / 60, brake); assert.equal(r.player.health, 85);
});

test('obstacles, coins and repair do not start a police pursuit', () => {
  for (const kind of ['cone', 'rubble', 'coin', 'repair', 'puddle']) {
    const r = new Race(); r.player.health = 70; entity(r, kind);
    r.update(1 / 60, neutral); assert.equal(r.police.active, false);
    if (kind === 'coin') assert.equal(r.money, 5);
    if (kind === 'repair') assert.equal(r.player.health, 95);
    if (kind === 'puddle') assert.ok(r.player.slippery > 0);
    if (kind === 'rubble') assert.equal(r.player.health, 50);
  }
});

test('potholes and bumps only damage at excessive speed', () => {
  for (const kind of ['hole', 'bump']) for (const speed of [0, 23]) {
    const r = new Race(); r.player.speed = speed; entity(r, kind);
    r.update(1 / 60, speed ? neutral : brake);
    assert.equal(r.player.health, speed ? 100 - C.damages[kind] : 100);
    assert.equal(r.police.active, false);
  }
});

test('near pass scores once, turbo consumes fact and does not block damage', () => {
  const r = new Race(); r.traffic.nextZ = Infinity;
  const e = entity(r, 'vehicle', 0.7); e.z = -6;
  r.update(1 / 60, neutral); assert.equal(r.nearMisses, 1);
  tick(r, 1); assert.equal(r.nearMisses, 1);
  const before = r.player.fact;
  tick(r, 1, { ...neutral, turbo: true }); assert.ok(r.player.fact < before);
  entity(r); r.update(1 / 60, { ...neutral, turbo: true }); assert.equal(r.player.health, 85);
  tick(r, 10, { ...neutral, turbo: true }); assert.ok(r.player.fact >= 0);
});

test('police grace, sustained capture and sustained escape', () => {
  const police = new Police(); police.start();
  for (let i = 0; i < 240; i++) police.update(1 / 60, 0);
  assert.notEqual(police.state, 'captured');
  for (let i = 0; i < 180; i++) police.update(1 / 60, 0);
  assert.equal(police.state, 'captured');
  const escape = new Police(); escape.start(); let count = 0;
  for (let i = 0; i < 900; i++) if (escape.update(1 / 60, 35)) count++;
  assert.equal(count, 1); assert.equal(escape.state, 'clear');
});

test('traffic pool stays bounded, lanes are escapable and stop zone is protected', () => {
  let seed = 981;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
  const traffic = new Traffic(random), p = new Player(), passengers = new Passengers();
  const textures = new Set(); let spawns = 0;
  for (let i = 0; i < 24000; i++) {
    p.z += 0.5; passengers.zoneZ = Math.floor(p.z / 1000) * 1000 + 500;
    const existing = new Set(traffic.pool.filter(e => e.active));
    traffic.update(1 / 60, p, passengers, 8);
    assert.equal(traffic.pool.length, 30);
    for (const e of traffic.pool.filter(e => e.active)) {
      assert.ok(e.x >= -1 && e.x <= 1);
      if (!existing.has(e)) {
        spawns++; textures.add(e.texture);
        assert.ok(!passengers.protected(e.z));
        assert.ok(e.z - p.z > 200);
        assert.ok(![...existing].some(other => other.active && Math.abs(other.z - e.z) < 37));
      }
    }
  }
  assert.ok(spawns > 100);
  for (const texture of ['combi', 'bus', 'mototaxi', 'auto', 'hatchback', 'truck', 'repair', 'coin']) assert.ok(textures.has(texture), texture);
});

test('end conditions freeze simulation and a new race resets all state', () => {
  const r = new Race(); r.player.health = 5; entity(r, 'rubble');
  r.update(1 / 60, neutral); assert.ok(r.reason);
  const snapshot = r.result(); tick(r, 2); assert.deepEqual(r.result(), snapshot);
  const fresh = new Race(); assert.equal(fresh.player.health, 100); assert.equal(fresh.score, 0);
  assert.equal(fresh.police.state, 'clear'); assert.equal(fresh.passengers.aboard, false);
  assert.equal(fresh.traffic.pool.filter(e => e.active).length, 0);
  const captured = new Race(); captured.police.start(); tick(captured, 8, brake);
  assert.equal(captured.police.state, 'captured'); assert.ok(captured.reason);
});

test('continuous driving can complete two fares without teleporting', () => {
  const r = new Race(() => 0.4);
  for (let i = 0; i < 60 * 200 && r.passengers.completed < 2; i++) {
    const remaining = r.passengers.zoneZ - r.player.z;
    const stoppingDistance = r.player.speed ** 2 / (2 * C.brakeForce) + 5;
    r.update(1 / 60, {
      steer: Math.abs(r.player.x - 1.8) < 0.05 ? 0 : r.player.x < 1.8 ? 1 : -1,
      brake: remaining < Math.max(10, stoppingDistance),
      turbo: false,
    });
  }
  assert.equal(r.reason, ''); assert.equal(r.passengers.completed, 2);
  assert.ok(r.player.z > 1400); assert.ok(r.money >= 30);
  assert.ok(r.difficulty > 0);
});

test('touch controls combine two fingers and clear on outside release and pause', () => {
  const Module = require('node:module'), originalLoad = Module._load;
  Module._load = function(request, ...args) {
    return request === 'phaser' ? { Scenes: { Events: { SHUTDOWN: 'shutdown' } } } : originalLoad.call(this, request, ...args);
  };
  let Controls;
  try { ({ Controls } = require('../src/cholov2/ui/Controls.ts')); } finally { Module._load = originalLoad; }
  const handlers = {}, buttons = {}, keys = Object.fromEntries(['A','D','S','LEFT','RIGHT','DOWN','SPACE'].map(k => [k, { isDown: false }]));
  const fake = {
    add: {
      image(_x, _y, name) {
        const events = {};
        const image = { setDisplaySize() { return this; }, setDepth() { return this; }, setInteractive() { return this; }, on(event, callback) { events[event] = callback; return this; } };
        buttons[name] = events; return image;
      },
      text() { return { setOrigin() { return this; }, setDepth() { return this; } }; },
    },
    input: { keyboard: { addKeys: () => keys, resetKeys: () => Object.values(keys).forEach(k => { k.isDown = false; }) }, on: (event, callback) => { handlers[event] = callback; } },
    events: { once() {} },
  };
  const controls = new Controls(fake);
  buttons['control-left'].pointerdown({ id: 1 }); buttons['control-brake'].pointerdown({ id: 2 });
  assert.deepEqual(controls.read(), { steer: -1, brake: true, turbo: false });
  handlers.pointerupoutside({ id: 1 }); assert.deepEqual(controls.read(), brake);
  buttons['control-turbo'].pointerdown({ id: 3 }); assert.equal(controls.read().turbo, true);
  buttons['control-brake'].pointerout({ id: 2 }); assert.equal(controls.read().brake, false);
  keys.D.isDown = true; controls.clear(); assert.deepEqual(controls.read(), neutral);
});

test('local results persist, deduplicate and remain separate from Gallinazo', () => {
  const data = new Map([['feka-scores', 'untouched']]);
  global.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  const storage = require('../src/cholov2/systems/Storage.ts');
  const result = new Race().result(); result.score = 1234;
  storage.saveResult(result, 'CHOLO', 'test-1'); storage.saveResult(result, 'CHOLO', 'test-1');
  assert.equal(storage.readResults().length, 1); assert.equal(storage.record(), 1234);
  assert.equal(data.get('feka-scores'), 'untouched');
  global.localStorage.getItem = () => { throw new Error('storage disabled'); };
  assert.deepEqual(storage.readResults(), []);
  delete global.localStorage;
});

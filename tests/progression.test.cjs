const test = require("node:test");
const assert = require("node:assert/strict");

class Vector {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  copy() { return new Vector(this.x, this.y); }
  set(x, y) { this.x = x; this.y = y; return this; }
  add(value) { this.x += value.x; this.y += value.y; return this; }
  sub(value) { this.x -= value.x; this.y -= value.y; return this; }
  mult(value) { this.x *= value; this.y *= value; return this; }
  div(value) { this.x /= value; this.y /= value; return this; }
  magSq() { return this.x * this.x + this.y * this.y; }
  mag() { return Math.sqrt(this.magSq()); }
  normalize() { const length = this.mag(); if (length) this.div(length); return this; }
  setMag(length) { return this.normalize().mult(length); }
  limit(maximum) { if (this.magSq() > maximum * maximum) this.setMag(maximum); return this; }
  static random2D() { return new Vector(1, 0); }
  static dist(first, second) { return Math.hypot(first.x - second.x, first.y - second.y); }
}

global.createVector = (x, y) => new Vector(x, y);
global.p5 = { Vector };
global.random = (minimum, maximum) => maximum === undefined
  ? minimum / 2
  : (minimum + maximum) / 2;
global.constrain = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
global.TWO_PI = Math.PI * 2;
global.simulationScale = 1;
global.gameDebug = false;
global.gardenSettings = { shadowPerception: 150, fireflyCohesion: 0.42 };

const Vehicle = require("../vehicle.js");
global.Vehicle = Vehicle;
const GardenDebugVehicle = require("../debug-vehicle.js");
global.GardenDebugVehicle = GardenDebugVehicle;
const GardenFlower = require("../flower.js");
const MagicCrystal = require("../crystal.js");
const CorruptionPatch = require("../corruption.js");
const GardenFirefly = require("../firefly.js");
const ShadowCreature = require("../shadow.js");
global.GardenSpirit = {
  nearest(vehicle, others) {
    return others.reduce((nearest, other) =>
      !nearest || Vector.dist(vehicle.pos, other.pos) < Vector.dist(vehicle.pos, nearest.pos)
        ? other
        : nearest, null);
  }
};

test("flowers need their configured number of fragments before blooming", () => {
  const flower = new GardenFlower(20, 30, "#ff99cc", 1);
  assert.equal(flower.crystalsNeeded, 3);
  assert.equal(flower.feedCrystal(), true);
  assert.equal(flower.awake, false);
  assert.equal(flower.crystalsFed, 1);
  assert.equal(flower.feedCrystal(), true);
  assert.equal(flower.awake, false);
  assert.equal(flower.feedCrystal(), true);
  assert.equal(flower.awake, true);
  assert.equal(flower.feedCrystal(), false);
  flower.update(0.5);
  assert.equal(flower.bloomProgress, 0.75);
});

test("collected crystals respawn only after their timer elapses", () => {
  const crystal = new MagicCrystal(40, 50, 310);
  assert.equal(crystal.collect(2), true);
  assert.equal(crystal.update(1), false);
  assert.equal(crystal.collected, true);
  assert.equal(crystal.update(1), true);
  assert.equal(crystal.collected, false);
  assert.equal(crystal.collect(), true);
});

test("corruption patches damage nearby unrescued spirits and expire", () => {
  const patch = new CorruptionPatch(10, 10, 2, 1);
  const spirits = [
    { pos: new Vector(20, 10), health: 100, rescued: false },
    { pos: new Vector(20, 10), health: 100, rescued: true }
  ];
  assert.equal(patch.update(0.5, spirits), false);
  assert.equal(spirits[0].health, 96.5);
  assert.equal(spirits[1].health, 100);
  assert.equal(patch.contains(new Vector(20, 10)), true);
  assert.equal(patch.update(0.5, spirits), true);
});

test("debug force capture preserves source vectors and slow motion scales movement", () => {
  const vehicle = new GardenDebugVehicle(50, 50, {
    maxSpeed: 4,
    maxForce: 2,
    velocity: new Vector(0, 0)
  });
  const source = new Vector(1, 0);
  vehicle.combine([[source, 0.5, "seek"]]);
  assert.equal(source.x, 1);
  assert.equal(vehicle.debugForces[0].label, "seek");
  assert.equal(vehicle.debugForces[0].vector.x, 0.5);

  vehicle.vel.set(2, 0);
  global.simulationScale = 0.5;
  vehicle.integrate(100, 100);
  assert.equal(vehicle.pos.x, 51);
  assert.equal(vehicle.vel.x, 2);
  global.simulationScale = 1.5;
  vehicle.integrate(100, 100);
  assert.equal(vehicle.pos.x, 54);
  global.simulationScale = 0;
  vehicle.integrate(100, 100);
  assert.equal(vehicle.pos.x, 54);
  global.simulationScale = 1;
});

test("shadow perception gates pursuit at the configured radius", () => {
  const shadow = new ShadowCreature(0, 0, 0);
  shadow.wander = () => new Vector(0, 1);
  shadow.pursue = () => new Vector(1, 0);
  const prey = { pos: new Vector(100, 0), vel: new Vector(0, 0), health: 100, rescued: false };
  const fairy = { pos: new Vector(300, 300), wardTimer: 0, invulnerable: 1 };

  shadow.updateAI([prey], fairy, [], 0.016, 90);
  assert.equal(shadow.debugTarget, null);
  assert.equal(shadow.debugForces.some(force => force.label === "pursue"), false);

  shadow.updateAI([prey], fairy, [], 0.016, 100);
  assert.equal(shadow.debugTarget, prey.pos);
  assert.equal(shadow.debugForces.some(force => force.label === "pursue"), true);
});

test("firefly cohesion weight follows the selected setting", () => {
  const firefly = new GardenFirefly(0, 0, 0);
  const noForce = () => new Vector(0, 0);
  firefly.followPath = noForce;
  firefly.wander = noForce;
  firefly.separation = noForce;
  firefly.alignment = noForce;
  firefly.cohesion = () => new Vector(2, 0);
  firefly.avoid = noForce;

  global.gardenSettings.fireflyCohesion = 0.75;
  firefly.updateAI([], {}, []);
  const cohesion = firefly.debugForces.find(force => force.label === "cohesion");
  assert.equal(cohesion.vector.x, 1.5);

  global.gardenSettings.fireflyCohesion = 0;
  firefly.updateAI([], {}, []);
  assert.equal(firefly.debugForces.some(force => force.label === "cohesion"), false);
  global.gardenSettings.fireflyCohesion = 0.42;
});

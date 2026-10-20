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
  dot(value) { return this.x * value.x + this.y * value.y; }
  static sub(a, b) { return a.copy().sub(b); }
  static dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  static random2D() { return new Vector(1, 0); }
}

global.createVector = (x, y) => new Vector(x, y);
global.p5 = { Vector };
global.random = (minimum, maximum) => {
  if (Array.isArray(minimum)) return minimum[0];
  if (maximum === undefined) return minimum / 2;
  return (minimum + maximum) / 2;
};
global.constrain = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
global.TWO_PI = Math.PI * 2;

const { GardenPath, projectPointToSegment } = require("../path.js");
const Vehicle = require("../vehicle.js");
global.projectPointToSegment = projectPointToSegment;

test("projects onto a segment and clamps beyond both endpoints", () => {
  const start = new Vector(0, 0);
  const end = new Vector(10, 0);
  assert.deepEqual(projectPointToSegment(new Vector(4, 3), start, end), new Vector(4, 0));
  assert.deepEqual(projectPointToSegment(new Vector(-5, 3), start, end), start);
  assert.deepEqual(projectPointToSegment(new Vector(15, 3), start, end), end);
  assert.deepEqual(projectPointToSegment(new Vector(5, 3), start, start), start);
});

test("complex path chooses its closest segment and looks ahead along it", () => {
  const path = new GardenPath([
    new Vector(0, 0), new Vector(100, 0),
    new Vector(100, 100), new Vector(0, 100)
  ], 10, true);
  const projection = path.project(new Vector(45, 7));
  assert.equal(projection.index, 0);
  assert.deepEqual(projection.point, new Vector(45, 0));
  assert.deepEqual(path.pointAhead(projection, 20), new Vector(65, 0));
});

test("seek and arrival return bounded steering and brake near a target", () => {
  const vehicle = new Vehicle(0, 0, { maxSpeed: 4, maxForce: 2, velocity: new Vector(0, 0) });
  const seek = vehicle.seek(new Vector(100, 0));
  const arrival = vehicle.arrive(new Vector(10, 0), 100, 1);
  assert.ok(seek.mag() <= vehicle.maxForce + 1e-9);
  assert.ok(arrival.mag() < seek.mag());
  assert.ok(vehicle.arrive(new Vector(0, 0)).mag() <= vehicle.maxForce);
});

test("flee, pursue, and evade use finite steering vectors", () => {
  const vehicle = new Vehicle(0, 0, { maxSpeed: 4, maxForce: 0.2, velocity: new Vector(1, 0) });
  const threat = { pos: new Vector(20, 0), vel: new Vector(-1, 0) };
  const fleeing = vehicle.flee(threat.pos);
  assert.ok(fleeing.x < 0);
  assert.ok(vehicle.pursue(threat).mag() <= vehicle.maxForce + 1e-9);
  assert.ok(vehicle.evade(threat).mag() <= vehicle.maxForce + 1e-9);
  assert.ok(Number.isFinite(vehicle.evade({ pos: vehicle.pos.copy(), vel: new Vector(0, 0) }).mag()));
});

test("avoidance is zero without obstacles and steers around a projected collision", () => {
  const vehicle = new Vehicle(0, 0, { maxSpeed: 3, maxForce: 0.2, radius: 8, velocity: new Vector(2, 0) });
  assert.equal(vehicle.avoid([]).mag(), 0);
  const force = vehicle.avoid([{ pos: new Vector(22, 0), radius: 8 }]);
  assert.ok(force.mag() > 0);
  assert.ok(Number.isFinite(force.x) && Number.isFinite(force.y));
});

test("flocking behaviors return zero for an empty neighborhood", () => {
  const vehicle = new Vehicle(0, 0);
  assert.equal(vehicle.separation([]).mag(), 0);
  assert.equal(vehicle.alignment([]).mag(), 0);
  assert.equal(vehicle.cohesion([]).mag(), 0);
});

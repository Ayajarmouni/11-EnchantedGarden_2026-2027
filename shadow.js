class ShadowCreature extends GardenDebugVehicle {
  constructor(x, y, index) {
    super(x, y, { maxSpeed: random(1.65, 2.1), maxForce: 0.105, radius: 14, wanderDistance: 35, wanderRadius: 20 });
    this.health = 2;
    this.index = index;
    this.stunTimer = 0;
    this.phase = random(TWO_PI);
  }

  updateAI(spirits, fairy, obstacles, dt, perception = gardenSettings.shadowPerception) {
    this.stunTimer = Math.max(0, this.stunTimer - dt);
    this.phase += 0.03;
    const warded = fairy.wardTimer > 0 && p5.Vector.dist(this.pos, fairy.pos) < 145;
    if (warded) this.health -= dt * 4;
    if (this.stunTimer > 0) {
      this.vel.mult(0.88);
      this.debugTarget = null;
      return;
    }
    if (warded) {
      this.debugTarget = fairy.pos;
      this.applyForce(this.combine([
        [this.evade(fairy, 12), 1.8, "evade"],
        [this.avoid(obstacles), 1.2, "obstacle"]
      ]));
      return;
    }
    const nearestSpirit = GardenSpirit.nearest(this, spirits.filter(spirit => spirit.health > 0 && !spirit.rescued));
    const prey = nearestSpirit && p5.Vector.dist(this.pos, nearestSpirit.pos) <= perception
      ? nearestSpirit
      : null;
    this.debugTarget = prey?.pos || null;
    const movement = prey ? this.pursue(prey, 20) : this.wander();
    this.applyForce(this.combine([
      [movement, 1.15, prey ? "pursue" : "wander"],
      [this.avoid(obstacles), 1.5, "obstacle"]
    ]));
    if (p5.Vector.dist(this.pos, fairy.pos) < 22 && fairy.invulnerable <= 0) {
      fairy.energy = Math.max(0, fairy.energy - 1);
      fairy.invulnerable = 1.5;
      this.applyForce(this.flee(fairy.pos).mult(1.3));
    }
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(Math.sin(this.phase) * 0.13);
    noStroke();
    fill(8, 14, 18, 90);
    ellipse(0, 3, 38, 25);
    fill(34, 40, 49, 240);
    beginShape();
    vertex(-14, 2);
    bezierVertex(-12, -10, 9, -14, 15, 0);
    bezierVertex(12, 10, 6, 13, 1, 7);
    bezierVertex(-5, 15, -11, 11, -14, 2);
    endShape(CLOSE);
    fill(225, 164, 130, 210);
    circle(-4, -1, 3);
    circle(5, -1, 3);
    fill(44, 32, 42, 200);
    triangle(-12, 5, -19, 13, -8, 10);
    triangle(11, 5, 18, 12, 8, 10);
    pop();
    this.drawDebug();
  }
}

if (typeof module !== "undefined" && module.exports) module.exports = ShadowCreature;

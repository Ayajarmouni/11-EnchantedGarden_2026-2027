class CorruptionPatch {
  constructor(x, y, index, duration = 36) {
    this.pos = createVector(x, y);
    this.index = index;
    this.radius = 55;
    this.remaining = duration;
    this.phase = random(TWO_PI);
  }

  update(dt, spirits) {
    this.remaining = Math.max(0, this.remaining - dt);
    this.phase += dt * 2;
    for (const spirit of spirits) {
      if (!spirit.rescued && p5.Vector.dist(spirit.pos, this.pos) < this.radius) {
        spirit.health = Math.max(0, spirit.health - dt * 7);
      }
    }
    return this.remaining <= 0;
  }

  contains(point, extraRadius = 0) {
    return p5.Vector.dist(point, this.pos) < this.radius + extraRadius;
  }

  show() {
    push();
    noStroke();
    fill(125, 43, 111, 15 + 5 * Math.sin(this.phase));
    circle(this.pos.x, this.pos.y, this.radius * 2);
    noFill();
    stroke(229, 104, 190, 72);
    strokeWeight(2);
    circle(this.pos.x, this.pos.y, this.radius * (1.55 + 0.08 * Math.sin(this.phase)));
    stroke(82, 42, 89, 100);
    strokeWeight(1);
    for (let mark = 0; mark < 3; mark += 1) {
      const angle = this.phase + mark * TWO_PI / 3;
      line(
        this.pos.x + Math.cos(angle) * 13,
        this.pos.y + Math.sin(angle) * 13,
        this.pos.x + Math.cos(angle + 0.7) * 30,
        this.pos.y + Math.sin(angle + 0.7) * 30
      );
    }
    pop();
  }
}

if (typeof module !== "undefined" && module.exports) module.exports = CorruptionPatch;

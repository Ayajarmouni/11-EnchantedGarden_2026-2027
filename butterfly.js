class GardenButterfly extends GardenDebugVehicle {
  constructor(x, y, index) {
    super(x, y, {
      maxSpeed: random(1.15, 1.8),
      maxForce: 0.055,
      radius: 4,
      wanderDistance: 28,
      wanderRadius: 24,
      wanderJitter: 0.18
    });
    this.index = index;
    this.phase = random(TWO_PI);
    this.palette = ["#ff9ccf", "#c9a6ff", "#ffcf9e", "#9ee6de"];
    this.wingColor = color(this.palette[index % this.palette.length]);
  }

  updateAI(butterflies, flowers, obstacles) {
    const bloom = flowers
      .slice()
      .sort((first, second) =>
        p5.Vector.dist(this.pos, first.pos) - p5.Vector.dist(this.pos, second.pos))[0];
    const visit = bloom && p5.Vector.dist(this.pos, bloom.pos) > 34
      ? this.arrive(bloom.pos, 110, 30)
      : createVector(0, 0);
    this.debugTarget = bloom?.pos || null;
    this.applyForce(this.combine([
      [visit, 0.62, "arrive"],
      [this.wander(), 0.38, "wander"],
      [this.separation(butterflies, 22), 0.8, "separation"],
      [this.cohesion(butterflies, 115), 0.16, "cohesion"],
      [this.avoid(obstacles), 1.35, "obstacle"]
    ]));
    this.phase += 0.22;
  }

  show() {
    const flap = Math.max(0.2, Math.abs(Math.sin(this.phase)));
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading() * 0.12);
    noStroke();
    fill(red(this.wingColor), green(this.wingColor), blue(this.wingColor), 45);
    ellipse(-5, -2, 14, 9 + flap * 8);
    ellipse(5, -2, 14, 9 + flap * 8);
    fill(red(this.wingColor), green(this.wingColor), blue(this.wingColor), 220);
    ellipse(-5, -2, 8, 5 + flap * 6);
    ellipse(5, -2, 8, 5 + flap * 6);
    fill("#fff0dc");
    ellipse(0, 0, 2.5, 7);
    stroke(red(this.wingColor), green(this.wingColor), blue(this.wingColor), 180);
    strokeWeight(0.8);
    line(0, -2, -2, -6);
    line(0, -2, 2, -6);
    pop();
    this.drawDebug();
  }
}

if (typeof module !== "undefined" && module.exports) module.exports = GardenButterfly;

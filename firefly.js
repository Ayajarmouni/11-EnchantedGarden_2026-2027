class GardenFirefly extends GardenDebugVehicle {
  constructor(x, y, index) {
    super(x, y, { maxSpeed: random(1.05, 1.6), maxForce: 0.045, radius: 3, wanderDistance: 35, wanderRadius: 22, wanderJitter: 0.13 });
    this.phase = random(TWO_PI);
    this.index = index;
    this.pathWeight = 0.45;
  }

  updateAI(swarm, circuit, obstacles, flowers = []) {
    const bloom = flowers.filter(flower => flower.awake)
      .sort((a, b) => p5.Vector.dist(this.pos, a.pos) - p5.Vector.dist(this.pos, b.pos))[0];
    this.debugTarget = bloom?.pos || null;
    const forces = [
      [this.followPath(circuit, 12, 20), bloom ? 0.18 : this.pathWeight, "path"],
      [bloom ? this.arrive(bloom.pos, 75, 8) : this.wander(), bloom ? 1.1 : 0.55, bloom ? "arrive" : "wander"],
      [this.separation(swarm, 15), 0.95, "separation"],
      [this.alignment(swarm, 65), 0.4, "alignment"],
      [this.cohesion(swarm, 85), gardenSettings.fireflyCohesion, "cohesion"],
      [this.avoid(obstacles), 1.3, "obstacle"]
    ];
    this.applyForce(this.combine(forces));
    this.phase += 0.08;
  }

  show() {
    push();
    noStroke();
    fill(240, 220, 147, 25 + Math.sin(this.phase) * 13);
    circle(this.pos.x, this.pos.y, 15);
    fill("#f7e6a2");
    circle(this.pos.x, this.pos.y, 3.5);
    pop();
    this.drawDebug();
  }
}

if (typeof module !== "undefined" && module.exports) module.exports = GardenFirefly;

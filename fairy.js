class GardenFairy extends GardenDebugVehicle {
  constructor(x, y) {
    super(x, y, { maxSpeed: 4.2, maxForce: 0.2, radius: 12, wanderDistance: 35, wanderRadius: 24 });
    this.destination = this.pos.copy();
    this.energy = 3;
    this.maxEnergy = 5;
    this.wardTimer = 0;
    this.wardCooldown = 0;
    this.invulnerable = 0;
    this.wingPhase = 0;
    this.crystalInventory = 0;
    this.trail = [];
  }

  setDestination(point) {
    this.destination = createVector(point.x, point.y);
  }

  updateAI(obstacles, dt, companions = []) {
    this.wardTimer = Math.max(0, this.wardTimer - dt);
    this.wardCooldown = Math.max(0, this.wardCooldown - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    const arrived = p5.Vector.dist(this.pos, this.destination) < 16;
    const movement = arrived ? this.wander() : this.arrive(this.destination, 90, 12);
    this.debugTarget = arrived ? null : this.destination;
    this.applyForce(this.combine([
      [movement, 1, arrived ? "wander" : "arrive"],
      [this.avoid(obstacles), 1.5, "obstacle"],
      [this.separation(companions.filter(agent => agent !== this), 34), 0.8, "separation"]
    ]));
    if (frameCount % 3 === 0) {
      this.trail.push(this.pos.copy());
      if (this.trail.length > 12) this.trail.shift();
    }
  }

  castWard() {
    if (this.energy < 1 || this.wardCooldown > 0) return false;
    this.energy -= 1;
    this.wardTimer = 1.15;
    this.wardCooldown = 2.2;
    return true;
  }

  show() {
    this.wingPhase += 0.2;
    push();
    noFill();
    stroke(255, 188, 226, 24);
    strokeWeight(2);
    for (let index = 1; index < this.trail.length; index += 1) {
      const from = this.trail[index - 1];
      const to = this.trail[index];
      stroke(255, 188, 226, 7 + index * 3);
      line(from.x, from.y, to.x, to.y);
    }
    translate(this.pos.x, this.pos.y);
    const pulse = 1 + Math.sin(this.wingPhase) * 0.12;
    if (this.wardTimer > 0) {
      noFill();
      stroke(255, 180, 222, 90 * this.wardTimer);
      strokeWeight(2.5);
      circle(0, 0, 290);
      noStroke();
      fill(255, 225, 241, 180);
      textAlign(CENTER);
      textSize(9);
      text(`${this.wardTimer.toFixed(1)} s`, 0, -157);
    }
    noStroke();
    const flap = Math.sin(this.wingPhase) * 3;
    fill(255, 174, 221, 40);
    ellipse(-14, -7 + flap, 27, 39);
    ellipse(14, -7 - flap, 27, 39);
    fill(255, 207, 239, 140);
    ellipse(-13, -8 + flap, 15, 28);
    ellipse(13, -8 - flap, 15, 28);
    fill(255, 246, 252, 200);
    circle(-13, -10 + flap, 4);
    circle(13, -10 - flap, 4);
    fill(255, 181, 221, 45);
    circle(0, 0, 45 + Math.sin(this.wingPhase * 0.7) * 3);
    fill("#f4a7d1");
    ellipse(0, 6, 13 * pulse, 18);
    fill("#fff0fa");
    ellipse(0, -5, 9, 11);
    fill("#8e557d");
    arc(0, -8, 10, 9, PI, TWO_PI);
    fill("#ffe6a0");
    triangle(-6, -9, 0, -19, 6, -9);
    fill("#ffb8dd");
    triangle(-4, -10, 0, -17, 2, -10);
    stroke("#f6d99e");
    strokeWeight(1.7);
    line(5, 7, 15, -7);
    noStroke();
    fill("#fff1ac");
    starShape(15, -8, 2, 5, 4);
    fill("#ffd7ee");
    starShape(-17, -19, 1.5, 3.5, 4);
    fill("#fff0bd");
    starShape(18, 9, 1, 2.5, 4);
    pop();
    this.drawDebug();
  }
}

function starShape(x, y, innerRadius, outerRadius, points) {
  push();
  translate(x, y);
  beginShape();
  for (let index = 0; index < points * 2; index += 1) {
    const angle = -HALF_PI + index * PI / points;
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    vertex(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  endShape(CLOSE);
  pop();
}

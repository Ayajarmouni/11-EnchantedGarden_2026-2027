class GardenSpirit extends GardenDebugVehicle {
  constructor(x, y, dna = null) {
    super(x, y, { maxSpeed: random(1.3, 2.1), maxForce: 0.075, radius: 9 });
    this.dna = dna ? GardenSpirit.mutate(dna) : {
      pathWeight: random(0.55, 1.25),
      flowerWeight: random(0.35, 1.2),
      fleeWeight: random(1.1, 1.8),
      perception: random(90, 165)
    };
    this.health = 100;
    this.rescued = false;
    this.fitness = 0;
    this.homePath = null;
    this.glowPhase = random(TWO_PI);
    this.lastDamage = 0;
  }

  static mutate(parentDna) {
    return {
      pathWeight: constrain(parentDna.pathWeight + random(-0.16, 0.16), 0.3, 1.6),
      flowerWeight: constrain(parentDna.flowerWeight + random(-0.2, 0.2), 0.2, 1.7),
      fleeWeight: constrain(parentDna.fleeWeight + random(-0.15, 0.15), 0.8, 2.1),
      perception: constrain(parentDna.perception + random(-14, 14), 70, 200)
    };
  }

  updateAI(spirits, shadows, flowers, obstacles, fairy, dt) {
    this.fitness += dt * (this.health / 100);
    const nearestShadow = GardenSpirit.nearest(this, shadows);
    const nearestFlower = flowers.filter(flower => flower.awake)
      .sort((a, b) => p5.Vector.dist(this.pos, a.pos) - p5.Vector.dist(this.pos, b.pos))[0];
    const fear = nearestShadow && p5.Vector.dist(this.pos, nearestShadow.pos) < this.dna.perception;
    this.debugTarget = fear ? nearestShadow.pos : nearestFlower?.pos || null;
    const route = this.homePath;
    const pathForce = route ? this.followPath(route, 16, 24) : this.wander();
    const flowerForce = nearestFlower ? this.seek(nearestFlower.pos) : createVector(0, 0);
    const flockForces = [
      [this.separation(spiritNeighbors(this, spirits), 28), 0.75],
      [this.alignment(spiritNeighbors(this, spirits), 100), 0.24],
      [this.cohesion(spiritNeighbors(this, spirits), 115), 0.3]
    ];
    const survivalForce = fear
      ? this.evade(nearestShadow, 18).mult(this.dna.fleeWeight)
      : createVector(0, 0);
    const forces = [
      [survivalForce, fear ? 1.35 : 0, "evade"],
      [pathForce, this.dna.pathWeight, "path"],
      [flowerForce, nearestFlower ? this.dna.flowerWeight * 0.28 : 0, "seek"],
      [flockForces[0][0], flockForces[0][1], "separation"],
      [flockForces[1][0], flockForces[1][1], "alignment"],
      [flockForces[2][0], flockForces[2][1], "cohesion"],
      [this.avoid(obstacles), 1.2, "obstacle"]
    ];
    if (fairy.wardTimer > 0 && p5.Vector.dist(this.pos, fairy.pos) < 125) {
      forces.push([this.seek(fairy.pos), 0.65, "shelter"]);
    }
    this.applyForce(this.combine(forces));
    const shelter = flowers.some(flower => flower.awake && p5.Vector.dist(flower.pos, this.pos) < 75);
    if (nearestShadow && p5.Vector.dist(this.pos, nearestShadow.pos) < 21 && !shelter) {
      this.health -= dt * 26;
      this.lastDamage += dt;
    }
    if (p5.Vector.dist(this.pos, fairy.pos) < 52) {
      this.health = Math.min(100, this.health + dt * 30);
    }
    if (shelter) this.health = Math.min(100, this.health + dt * 9);
    return this.health <= 0 ? "lost" : null;
  }

  static nearest(vehicle, others) {
    let nearest = null;
    let shortest = Infinity;
    for (const other of others) {
      const distance = p5.Vector.dist(vehicle.pos, other.pos);
      if (distance < shortest) {
        nearest = other;
        shortest = distance;
      }
    }
    return nearest;
  }

  show() {
    this.glowPhase += 0.04;
    push();
    translate(this.pos.x, this.pos.y);
    const glow = 10 + Math.sin(this.glowPhase) * 2;
    noStroke();
    fill(221, 238, 169, 18);
    circle(0, 0, glow * 4);
    fill(223, 239, 178, 95);
    circle(0, 0, glow);
    fill("#fff8d4");
    circle(0, 0, 5);
    if (this.rescued) {
      fill("#f1d894");
      textAlign(CENTER);
      textSize(10);
      text("✧", 0, -14);
    }
    pop();
    this.drawDebug();
  }
}

function spiritNeighbors(spirit, spirits) {
  return spirits.filter(other => other !== spirit && other.health > 0);
}

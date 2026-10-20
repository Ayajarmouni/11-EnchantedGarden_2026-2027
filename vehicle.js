class Vehicle {
  constructor(x, y, options = {}) {
    this.pos = createVector(x, y);
    this.vel = options.velocity?.copy() || p5.Vector.random2D().mult(0.2);
    this.acc = createVector(0, 0);
    this.maxSpeed = options.maxSpeed ?? 3;
    this.maxForce = options.maxForce ?? 0.12;
    this.radius = options.radius ?? 10;
    this.wanderAngle = random(TWO_PI);
    this.wanderDistance = options.wanderDistance ?? 42;
    this.wanderRadius = options.wanderRadius ?? 28;
    this.wanderJitter = options.wanderJitter ?? 0.2;
  }

  seek(target, speed = this.maxSpeed) {
    const desired = p5.Vector.sub(target, this.pos);
    if (desired.magSq() < 0.0001) return createVector(0, 0);
    desired.setMag(speed);
    return desired.sub(this.vel).limit(this.maxForce);
  }

  arrive(target, slowingRadius = 90, stopRadius = 4) {
    const desired = p5.Vector.sub(target, this.pos);
    const distance = desired.mag();
    if (distance <= stopRadius) return this.vel.copy().mult(-1).limit(this.maxForce);
    desired.setMag(this.maxSpeed * Math.min(1, distance / Math.max(1, slowingRadius)));
    return desired.sub(this.vel).limit(this.maxForce);
  }

  flee(target) {
    const away = p5.Vector.sub(this.pos, target);
    if (away.magSq() < 0.0001) away.set(this.vel.y || 1, -this.vel.x);
    away.setMag(this.maxSpeed);
    return away.sub(this.vel).limit(this.maxForce);
  }

  pursue(target, horizon = 24) {
    const distance = p5.Vector.dist(this.pos, target.pos);
    const time = Math.min(horizon, distance / Math.max(this.maxSpeed, 0.1));
    return this.seek(target.pos.copy().add(target.vel.copy().mult(time)));
  }

  evade(target, horizon = 24) {
    const distance = p5.Vector.dist(this.pos, target.pos);
    const time = Math.min(horizon, distance / Math.max(this.maxSpeed + target.vel.mag(), 0.1));
    const predicted = target.pos.copy().add(target.vel.copy().mult(time));
    return this.flee(predicted);
  }

  wander() {
    const forward = this.vel.copy();
    if (forward.magSq() < 0.01) forward.set(1, 0);
    forward.setMag(this.wanderDistance);
    const center = this.pos.copy().add(forward);
    this.wanderAngle += random(-this.wanderJitter, this.wanderJitter);
    const target = center.add(createVector(
      Math.cos(this.wanderAngle) * this.wanderRadius,
      Math.sin(this.wanderAngle) * this.wanderRadius
    ));
    return this.seek(target, this.maxSpeed * 0.75);
  }

  followPath(path, predictionFrames = 22, lookAhead = 44) {
    const future = this.pos.copy().add(this.vel.copy().mult(predictionFrames));
    const projection = path.project(future);
    if (projection.distance <= path.radius) return createVector(0, 0);
    return this.seek(path.pointAhead(projection, lookAhead));
  }

  avoid(obstacles, horizon = 26) {
    const ahead = this.vel.copy();
    if (ahead.magSq() < 0.01) ahead.set(1, 0);
    ahead.setMag(Math.min(this.maxSpeed * horizon, 100));
    const middle = ahead.copy().mult(0.5);
    let chosen = null;
    let chosenDistance = Infinity;
    for (const obstacle of obstacles) {
      const nearest = projectPointToSegment(obstacle.pos, this.pos, this.pos.copy().add(ahead));
      const distance = p5.Vector.dist(nearest, obstacle.pos) - obstacle.radius;
      if (distance < this.radius + 13 && distance < chosenDistance) {
        chosen = { obstacle, nearest };
        chosenDistance = distance;
      }
      const midpoint = this.pos.copy().add(middle);
      const midpointDistance = p5.Vector.dist(midpoint, obstacle.pos) - obstacle.radius;
      if (midpointDistance < this.radius + 13 && midpointDistance < chosenDistance) {
        chosen = { obstacle, nearest: midpoint };
        chosenDistance = midpointDistance;
      }
    }
    if (!chosen) return createVector(0, 0);
    let away = p5.Vector.sub(chosen.nearest, chosen.obstacle.pos);
    if (away.magSq() < 0.0001) away.set(-this.vel.y || 1, this.vel.x);
    away.setMag(this.maxSpeed).sub(this.vel).limit(this.maxForce);
    return away.mult(1.7);
  }

  separation(neighbors, radius = 34) {
    const steer = createVector(0, 0);
    let count = 0;
    for (const other of neighbors) {
      if (other === this) continue;
      const offset = p5.Vector.sub(this.pos, other.pos);
      const distance = offset.mag();
      if (distance > 0.001 && distance < radius) {
        steer.add(offset.normalize().div(distance));
        count += 1;
      }
    }
    if (!count || steer.magSq() < 0.0001) return steer;
    return steer.div(count).setMag(this.maxSpeed).sub(this.vel).limit(this.maxForce);
  }

  alignment(neighbors, radius = 100) {
    const average = createVector(0, 0);
    let count = 0;
    for (const other of neighbors) {
      if (other === this || p5.Vector.dist(this.pos, other.pos) >= radius) continue;
      average.add(other.vel);
      count += 1;
    }
    if (!count || average.magSq() < 0.0001) return createVector(0, 0);
    return average.div(count).setMag(this.maxSpeed).sub(this.vel).limit(this.maxForce);
  }

  cohesion(neighbors, radius = 125) {
    const center = createVector(0, 0);
    let count = 0;
    for (const other of neighbors) {
      if (other === this || p5.Vector.dist(this.pos, other.pos) >= radius) continue;
      center.add(other.pos);
      count += 1;
    }
    if (!count) return createVector(0, 0);
    return this.seek(center.div(count), this.maxSpeed * 0.7);
  }

  combine(forces) {
    const steering = createVector(0, 0);
    for (const [force, weight] of forces) steering.add(force.mult(weight));
    return steering.limit(this.maxForce);
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc).limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.set(0, 0);
  }

  keepInside(width, height, margin = this.radius) {
    const left = margin;
    const right = Math.max(left, width - margin);
    const top = margin;
    const bottom = Math.max(top, height - margin);
    if (this.pos.x < left) this.applyForce(createVector(this.maxForce, 0));
    else if (this.pos.x > right) this.applyForce(createVector(-this.maxForce, 0));
    if (this.pos.y < top) this.applyForce(createVector(0, this.maxForce));
    else if (this.pos.y > bottom) this.applyForce(createVector(0, -this.maxForce));
  }

  integrate(width, height) {
    this.keepInside(width, height);
    this.update();
    this.pos.x = constrain(this.pos.x, this.radius, width - this.radius);
    this.pos.y = constrain(this.pos.y, this.radius, height - this.radius);
  }

  drawDebug() {
    if (!gameDebug) return;
    push();
    noFill();
    stroke(255, 230, 168, 65);
    line(this.pos.x, this.pos.y, this.pos.x + this.vel.x * 8, this.pos.y + this.vel.y * 8);
    pop();
  }
}

if (typeof module !== "undefined" && module.exports) module.exports = Vehicle;

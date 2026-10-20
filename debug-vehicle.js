class GardenDebugVehicle extends Vehicle {
  constructor(x, y, options = {}) {
    super(x, y, options);
    this.debugForces = [];
    this.debugTarget = null;
  }

  combine(forces) {
    this.debugForces = forces
      .filter(([force, weight]) => weight !== 0 && force.magSq() > 0.0001)
      .map(([force, weight, label]) => ({
        label: label || "steering",
        vector: force.copy().mult(weight)
      }));
    return super.combine(forces.map(([force, weight]) => [force.copy(), weight]));
  }

  integrate(width, height) {
    const scale = typeof simulationScale === "number" ? simulationScale : 1;
    if (scale <= 0) return;
    if (scale === 1) {
      super.integrate(width, height);
      return;
    }
    const speedLimit = this.maxSpeed;
    this.maxSpeed *= scale;
    this.vel.mult(scale);
    this.acc.mult(scale * scale);
    super.integrate(width, height);
    this.vel.div(scale).limit(speedLimit);
    this.maxSpeed = speedLimit;
  }

  drawDebug() {
    if (!gameDebug) return;
    const colors = {
      seek: "#f4d58c",
      arrive: "#ffd5e9",
      pursue: "#ff8ba4",
      evade: "#aa9cff",
      separation: "#82e5d0",
      cohesion: "#ffb36d",
      alignment: "#a8d3ff",
      wander: "#f7a6ed",
      obstacle: "#ff6d6d",
      path: "#a5ef9b",
      flock: "#a8d3ff",
      shelter: "#ffe4a6"
    };
    push();
    textFont("monospace");
    textSize(9);
    for (const { label, vector } of this.debugForces) {
      const tint = colors[label] || "#ffffff";
      const endpoint = this.pos.copy().add(vector.copy().mult(650));
      stroke(tint);
      strokeWeight(1.5);
      line(this.pos.x, this.pos.y, endpoint.x, endpoint.y);
      noStroke();
      fill(tint);
      text(label, endpoint.x + 3, endpoint.y - 3);
    }
    if (this.debugTarget) {
      noFill();
      stroke("#fff4a8");
      circle(this.debugTarget.x, this.debugTarget.y, 12);
      line(this.pos.x, this.pos.y, this.debugTarget.x, this.debugTarget.y);
      noStroke();
      fill("#fff4a8");
      text("cible", this.debugTarget.x + 7, this.debugTarget.y - 7);
    }
    pop();
  }
}

if (typeof module !== "undefined" && module.exports) module.exports = GardenDebugVehicle;

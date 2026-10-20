class GardenFlower {
  constructor(x, y, color, index) {
    this.pos = createVector(x, y);
    this.color = color;
    this.index = index;
    this.awake = false;
    this.glow = random(TWO_PI);
    this.radius = 20;
    this.crystalsNeeded = 2 + index % 2;
    this.crystalsFed = 0;
    this.bloomProgress = 0;
  }

  feedCrystal() {
    if (this.awake || this.crystalsFed >= this.crystalsNeeded) return false;
    this.crystalsFed += 1;
    if (this.crystalsFed === this.crystalsNeeded) return this.wake();
    return true;
  }

  wake() {
    if (this.awake) return false;
    this.awake = true;
    this.bloomProgress = 0;
    return true;
  }

  update(dt) {
    this.glow += dt * 0.9;
    if (this.awake) this.bloomProgress = Math.min(1, this.bloomProgress + dt * 1.5);
  }

  show() {
    const bloom = this.awake ? 0.68 + this.bloomProgress * 0.32 : 0.68;
    push();
    noStroke();
    if (this.awake) {
      fill(red(this.color), green(this.color), blue(this.color), 22 + 8 * Math.sin(this.glow));
      circle(this.pos.x, this.pos.y, 90 + 10 * Math.sin(this.glow));
    }
    translate(this.pos.x, this.pos.y);
    for (let petal = 0; petal < 6; petal += 1) {
      push();
      rotate(TWO_PI * petal / 6 + this.glow * 0.07);
      fill(this.awake ? this.color : color(113, 132, 105));
      ellipse(0, -8 * bloom, 9 * bloom, 17 * bloom);
      pop();
    }
    fill(this.awake ? "#f9e8a2" : "#75836b");
    circle(0, 0, 10 * bloom);
    pop();
    if (!this.awake && gameDebug) {
      noFill();
      stroke(248, 238, 179, 55);
      circle(this.pos.x, this.pos.y, 75);
    }
    if (!this.awake) {
      noStroke();
      fill(255, 239, 249, 220);
      textAlign(CENTER);
      textSize(9);
      text(`${this.crystalsFed}/${this.crystalsNeeded} ✧`, this.pos.x, this.pos.y + 28);
    }
  }

}

if (typeof module !== "undefined" && module.exports) module.exports = GardenFlower;

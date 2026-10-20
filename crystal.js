class MagicCrystal {
  constructor(x, y, hue = 175) {
    this.pos = createVector(x, y);
    this.hue = hue;
    this.phase = random(TWO_PI);
    this.collected = false;
    this.respawnTimer = 0;
  }

  update(dt) {
    if (!this.collected) return false;
    this.respawnTimer = Math.max(0, this.respawnTimer - dt);
    if (this.respawnTimer > 0) return false;
    this.collected = false;
    return true;
  }

  collect(respawnDelay = 6) {
    if (this.collected) return false;
    this.collected = true;
    this.respawnTimer = respawnDelay;
    return true;
  }

  show() {
    if (this.collected) return;
    this.phase += 0.035;
    const bob = Math.sin(this.phase) * 4;
    push();
    translate(this.pos.x, this.pos.y + bob);
    noStroke();
    colorMode(HSB, 360, 100, 100, 100);
    fill(this.hue, 70, 100, 13 + 5 * Math.sin(this.phase));
    circle(0, 0, 68 + 5 * Math.sin(this.phase));
    fill(this.hue, 65, 100, 16);
    circle(0, 0, 40);
    fill(this.hue, 42, 100, 95);
    beginShape();
    vertex(0, -25);
    vertex(13, -7);
    vertex(10, 14);
    vertex(0, 23);
    vertex(-10, 14);
    vertex(-13, -7);
    endShape(CLOSE);
    fill(this.hue, 28, 100, 88);
    quad(0, -22, -3, -5, 0, 7, 0, 1);
    fill(this.hue + 18, 55, 100, 82);
    quad(0, -22, 11, -6, 3, -2, 0, -5);
    fill(48, 16, 100, 100);
    triangle(-2, -8, 0, -18, 2, -5);
    stroke(0, 0, 100, 75);
    strokeWeight(1);
    noFill();
    beginShape();
    vertex(0, -25);
    vertex(13, -7);
    vertex(10, 14);
    vertex(0, 23);
    vertex(-10, 14);
    vertex(-13, -7);
    endShape(CLOSE);
    colorMode(RGB, 255, 255, 255, 255);
    pop();
  }
}

if (typeof module !== "undefined" && module.exports) module.exports = MagicCrystal;

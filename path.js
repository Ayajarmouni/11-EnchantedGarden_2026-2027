function projectPointToSegment(point, start, end) {
  const segment = p5.Vector.sub(end, start);
  const lengthSquared = segment.magSq();
  if (lengthSquared <= 0.000001) return start.copy();
  const offset = p5.Vector.sub(point, start);
  const amount = constrain(offset.dot(segment) / lengthSquared, 0, 1);
  return start.copy().add(segment.mult(amount));
}

class GardenPath {
  constructor(points, radius = 36, closed = false) {
    this.points = points.map(point => point.copy());
    this.radius = radius;
    this.closed = closed;
  }

  project(point) {
    if (this.points.length < 2) return { point: this.points[0]?.copy() || point.copy(), distance: Infinity, index: 0 };
    const segmentCount = this.closed ? this.points.length : this.points.length - 1;
    let closest = null;
    for (let index = 0; index < segmentCount; index += 1) {
      const start = this.points[index];
      const end = this.points[(index + 1) % this.points.length];
      const projection = projectPointToSegment(point, start, end);
      const distance = p5.Vector.dist(point, projection);
      if (!closest || distance < closest.distance) closest = { point: projection, distance, index };
    }
    return closest;
  }

  pointAhead(projection, distance) {
    const start = this.points[projection.index];
    const end = this.points[(projection.index + 1) % this.points.length];
    const direction = p5.Vector.sub(end, start);
    const segmentLength = direction.mag();
    if (segmentLength <= 0.000001) return end.copy();
    const remaining = p5.Vector.dist(projection.point, end);
    if (distance <= remaining || !this.closed) {
      return projection.point.copy().add(direction.setMag(Math.min(distance, remaining)));
    }
    let left = distance - remaining;
    let index = (projection.index + 1) % this.points.length;
    while (left > 0 && (this.closed || index < this.points.length - 1)) {
      const nextIndex = (index + 1) % this.points.length;
      const nextDirection = p5.Vector.sub(this.points[nextIndex], this.points[index]);
      const nextLength = nextDirection.mag();
      if (nextLength >= left) return this.points[index].copy().add(nextDirection.setMag(left));
      left -= nextLength;
      index = nextIndex;
    }
    return end.copy();
  }

  show(debug = false) {
    if (this.points.length < 2) return;
    push();
    noFill();
    stroke(170, 191, 129, debug ? 65 : 30);
    strokeWeight(this.radius * 2);
    strokeJoin(ROUND);
    beginShape();
    for (const point of this.points) vertex(point.x, point.y);
    if (this.closed) endShape(CLOSE);
    else endShape();
    stroke(230, 226, 181, debug ? 130 : 60);
    strokeWeight(1);
    drawingContext.setLineDash([4, 11]);
    beginShape();
    for (const point of this.points) vertex(point.x, point.y);
    if (this.closed) endShape(CLOSE);
    else endShape();
    drawingContext.setLineDash([]);
    pop();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { GardenPath, projectPointToSegment };
}

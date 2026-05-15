import type { CardinalDirectionName, DirectionName, FrameRect, Vec2 } from "./types";

export function rects(values: Array<[number, number, number, number]>): FrameRect[] {
  return values.map(([x, y, w, h]) => ({ x, y, w, h }));
}

export function distance(a: Vec2, b: Vec2) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function length(vector: Vec2) {
  return Math.hypot(vector.x, vector.y);
}

export function lengthSq(vector: Vec2) {
  return vector.x * vector.x + vector.y * vector.y;
}

export function normalize(vector: Vec2) {
  const magnitude = length(vector);
  if (magnitude <= 0.0001) return vector;
  vector.x /= magnitude;
  vector.y /= magnitude;
  return vector;
}

export function dot(a: Vec2, b: Vec2) {
  return a.x * b.x + a.y * b.y;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function directionFromVector(vector: Vec2): DirectionName {
  const magnitude = length(vector);
  if (magnitude <= 0.0001) return "down";

  const angle = Math.atan2(vector.y, vector.x);
  const octant = Math.round(angle / (Math.PI / 4));
  switch ((octant + 8) % 8) {
    case 0:
      return "right";
    case 1:
      return "down_right";
    case 2:
      return "down";
    case 3:
      return "down_left";
    case 4:
      return "left";
    case 5:
      return "up_left";
    case 6:
      return "up";
    case 7:
      return "up_right";
    default:
      return "down";
  }
}

export function cardinalDirectionFromVector(vector: Vec2): CardinalDirectionName {
  if (Math.abs(vector.x) > Math.abs(vector.y)) {
    return vector.x > 0 ? "right" : "left";
  }
  return vector.y > 0 ? "down" : "up";
}

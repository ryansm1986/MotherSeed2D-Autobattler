import { distance } from "../math";
import type { Obstacle } from "../state";
import type { Vec2 } from "../types";
import { world } from "./arena";

export function clampToArena(entity: Vec2) {
  const boundary = world.walkableBoundary;
  if (isPointInPolygon(entity, boundary)) return;

  let closest = boundary[0];
  let closestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < boundary.length; index += 1) {
    const start = boundary[index];
    const end = boundary[(index + 1) % boundary.length];
    const point = closestPointOnSegment(entity, start, end);
    const pointDistance = distance(entity, point);
    if (pointDistance < closestDistance) {
      closest = point;
      closestDistance = pointDistance;
    }
  }

  entity.x = closest.x;
  entity.y = closest.y;
}

export function isInStairZone(entity: Vec2) {
  return world.stairZones.some((zone) => {
    const nx = (entity.x - zone.x) / zone.rx;
    const ny = (entity.y - zone.y) / zone.ry;
    return nx * nx + ny * ny <= 1;
  });
}

function isPointInPolygon(point: Vec2, polygon: readonly Vec2[]) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    const crossesY = currentPoint.y > point.y !== previousPoint.y > point.y;
    if (!crossesY) continue;

    const xAtY = ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) / (previousPoint.y - currentPoint.y) + currentPoint.x;
    if (point.x < xAtY) inside = !inside;
  }
  return inside;
}

function closestPointOnSegment(point: Vec2, start: Vec2, end: Vec2): Vec2 {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq <= 0.0001) return { ...start };

  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq));
  return {
    x: start.x + dx * t,
    y: start.y + dy * t,
  };
}

export function resolveObstacleCollision(entity: Vec2, radius: number, obstacles: readonly Obstacle[]) {
  obstacles.forEach((obstacle) => {
    const dx = entity.x - obstacle.x;
    const dy = entity.y - obstacle.y;
    const nx = dx / (obstacle.rx + radius);
    const ny = dy / (obstacle.ry + radius);
    const overlap = nx * nx + ny * ny;
    if (overlap > 0 && overlap < 1) {
      const angle = Math.atan2(ny, nx);
      entity.x = obstacle.x + Math.cos(angle) * (obstacle.rx + radius);
      entity.y = obstacle.y + Math.sin(angle) * (obstacle.ry + radius);
    }
  });
}

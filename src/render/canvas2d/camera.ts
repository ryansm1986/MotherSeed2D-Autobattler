import { clamp } from "../../game/math";
import type { GameState } from "../../game/state";
import type { Vec2 } from "../../game/types";
import { world } from "../../game/world/arena";
import type { CameraState } from "./types";

export function createCamera(): CameraState {
  return {
    x: 0,
    y: 0,
    scale: 1,
  };
}

export function resizeCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, camera: CameraState) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  camera.scale = Math.max(0.72, Math.min(1.08, Math.min(width / 1120, height / 740)));
}

export function updateCamera(camera: CameraState, state: GameState, delta: number) {
  const viewWidth = window.innerWidth / camera.scale;
  const viewHeight = window.innerHeight / camera.scale;
  const targetX = clamp(state.player.x - viewWidth / 2, 0, world.width - viewWidth);
  const targetY = clamp(state.player.y - viewHeight / 2, 0, world.height - viewHeight);
  camera.x += (targetX - camera.x) * (1 - Math.exp(-delta * 8));
  camera.y += (targetY - camera.y) * (1 - Math.exp(-delta * 8));
}

export function screenToWorld(canvas: HTMLCanvasElement, camera: CameraState, clientX: number, clientY: number): Vec2 {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / camera.scale + camera.x,
    y: (clientY - rect.top) / camera.scale + camera.y,
  };
}

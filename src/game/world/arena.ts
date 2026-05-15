import type { Vec2 } from "../types";

export const dungeonTreeArena = {
  sourceWidth: 1448,
  sourceHeight: 1086,
  scale: 2,
} as const;

const sourceWalkableBoundary = [
  { x: 654, y: 156 },
  { x: 654, y: 226 },
  { x: 610, y: 286 },
  { x: 500, y: 344 },
  { x: 400, y: 430 },
  { x: 318, y: 560 },
  { x: 308, y: 635 },
  { x: 355, y: 728 },
  { x: 472, y: 810 },
  { x: 680, y: 852 },
  { x: 884, y: 852 },
  { x: 1042, y: 818 },
  { x: 1138, y: 734 },
  { x: 1172, y: 632 },
  { x: 1128, y: 504 },
  { x: 1042, y: 410 },
  { x: 928, y: 348 },
  { x: 818, y: 304 },
  { x: 770, y: 254 },
  { x: 770, y: 156 },
] as const satisfies readonly Vec2[];

function scalePoint(point: Vec2): Vec2 {
  return {
    x: point.x * dungeonTreeArena.scale,
    y: point.y * dungeonTreeArena.scale,
  };
}

export const world = {
  width: dungeonTreeArena.sourceWidth * dungeonTreeArena.scale,
  height: dungeonTreeArena.sourceHeight * dungeonTreeArena.scale,
  center: {
    x: (dungeonTreeArena.sourceWidth * dungeonTreeArena.scale) / 2,
    y: (dungeonTreeArena.sourceHeight * dungeonTreeArena.scale) / 2,
  },
  safeRadius: 680 * dungeonTreeArena.scale,
  walkableScaleY: 0.72,
  walkableBoundary: sourceWalkableBoundary.map(scalePoint),
  playerSpawn: {
    x: (dungeonTreeArena.sourceWidth * dungeonTreeArena.scale) / 2,
    y: 760 * dungeonTreeArena.scale,
  },
  enemySpawn: {
    x: (dungeonTreeArena.sourceWidth * dungeonTreeArena.scale) / 2,
    y: 430 * dungeonTreeArena.scale,
  },
  codgerSpawn: {
    x: (dungeonTreeArena.sourceWidth * dungeonTreeArena.scale) / 2,
    y: (dungeonTreeArena.sourceHeight * dungeonTreeArena.scale) / 2,
  },
  stairZones: [
    { id: "north_stairs", x: 724 * dungeonTreeArena.scale, y: 154 * dungeonTreeArena.scale, rx: 155 * dungeonTreeArena.scale, ry: 92 * dungeonTreeArena.scale },
    { id: "south_stairs", x: 724 * dungeonTreeArena.scale, y: 974 * dungeonTreeArena.scale, rx: 178 * dungeonTreeArena.scale, ry: 96 * dungeonTreeArena.scale },
  ],
};

export const terrainOverlays = Array.from({ length: 130 }, (_, index) => {
  const angle = index * 2.399963;
  const radius = 80 + ((index * 67) % 640);
  return {
    x: world.center.x + Math.cos(angle) * radius,
    y: world.center.y + Math.sin(angle) * radius * 0.82,
    kind: index % 17 === 0 ? "white_wildflower" : index % 13 === 0 ? "yellow_wildflower" : index % 7 === 0 ? "small_rock_cluster" : "flat_grass_patch",
    scale: 0.72 + ((index * 19) % 7) * 0.055,
    alpha: 0.28 + ((index * 11) % 5) * 0.055,
  };
});

export const animatedGrassTufts = Array.from({ length: 34 }, (_, index) => {
  const angle = index * 2.399963;
  const radius = 130 + ((index * 91) % 560);
  return {
    x: world.center.x + Math.cos(angle) * radius,
    y: world.center.y + Math.sin(angle) * radius * 0.78,
    scale: 0.64 + ((index * 23) % 6) * 0.045,
    phase: index % 8,
  };
});

export const groveClearings = [
  { x: world.center.x - 20, y: world.center.y + 40, rx: 500, ry: 315, rotation: -0.08, alpha: 0.18 },
  { x: world.center.x - 430, y: world.center.y + 260, rx: 245, ry: 130, rotation: -0.28, alpha: 0.13 },
  { x: world.center.x + 420, y: world.center.y - 155, rx: 280, ry: 150, rotation: 0.18, alpha: 0.12 },
];

export const grovePathRoutes: Vec2[][] = [
  [
    { x: -140, y: world.center.y + 310 },
    { x: world.center.x - 520, y: world.center.y + 255 },
    { x: world.center.x - 150, y: world.center.y + 120 },
    { x: world.center.x + 285, y: world.center.y - 15 },
    { x: world.width + 140, y: world.center.y - 145 },
  ],
  [
    { x: world.center.x - 60, y: -120 },
    { x: world.center.x - 100, y: world.center.y - 365 },
    { x: world.center.x + 40, y: world.center.y - 40 },
    { x: world.center.x + 170, y: world.center.y + 315 },
    { x: world.center.x + 230, y: world.height + 120 },
  ],
];

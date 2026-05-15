import type { FrameRect, WorldAssetName } from "../types";

export const terrainTileSize = 48;

export const worldAssetRects: Record<WorldAssetName, FrameRect> = {
  grassTile: { x: 17, y: 70, w: 48, h: 48 },
  mossTile: { x: 182, y: 70, w: 48, h: 48 },
  stoneTile: { x: 238, y: 70, w: 48, h: 48 },
  waterTile: { x: 292, y: 70, w: 48, h: 48 },
  oakTree: { x: 388, y: 70, w: 104, h: 126 },
  pineTree: { x: 617, y: 70, w: 76, h: 126 },
  bush: { x: 398, y: 204, w: 66, h: 58 },
  flowers: { x: 503, y: 278, w: 66, h: 55 },
  log: { x: 512, y: 342, w: 105, h: 53 },
  stump: { x: 620, y: 342, w: 68, h: 70 },
  rock: { x: 392, y: 344, w: 68, h: 56 },
  banner: { x: 250, y: 272, w: 53, h: 94 },
  tent: { x: 247, y: 544, w: 114, h: 104 },
  house: { x: 194, y: 538, w: 168, h: 132 },
  treeHouse: { x: 20, y: 526, w: 164, h: 224 },
  chest: { x: 419, y: 556, w: 42, h: 38 },
  barrel: { x: 490, y: 704, w: 38, h: 48 },
  crate: { x: 583, y: 554, w: 42, h: 42 },
  coin: { x: 794, y: 889, w: 35, h: 35 },
};

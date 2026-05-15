import type { AnimationName, CardinalDirectionName, ClassId, DirectionName, MonsterAnimationName, MonsterId, WorldAssetName } from "../../game/types";

export type SpriteBounds = { x: number; y: number; w: number; h: number };
export type SpriteFrame = { canvas: HTMLCanvasElement; w: number; h: number; bounds?: SpriteBounds };

export type DrawProfile = {
  scale: number;
  anchorX: number;
  anchorY: number;
  baselineOffset: number;
  targetContentHeight?: number;
  minScale?: number;
};

export type PlayerSpriteSet = Record<DirectionName, Record<AnimationName, SpriteFrame[]>>;
export type MonsterSpriteSet = Record<DirectionName, Record<MonsterAnimationName, SpriteFrame[]>>;
export type MonsterSpriteCatalog = Record<MonsterId, MonsterSpriteSet>;

export type CameraState = {
  x: number;
  y: number;
  scale: number;
};

export type RenderAssets = {
  playerSprites: Partial<Record<ClassId, PlayerSpriteSet>>;
  monsterSprites: MonsterSpriteCatalog;
  worldAssets: Partial<Record<WorldAssetName, SpriteFrame>>;
  dungeonTreeRoomFrame: SpriteFrame | null;
  grassTerrainTile: SpriteFrame | null;
  grassTerrainProps: Record<string, SpriteFrame>;
  animatedGrassFrames: SpriteFrame[];
  magicMissileFrames: SpriteFrame[];
  clericFireballFrames: SpriteFrame[];
  enemyRockThrowFrames: SpriteFrame[];
  poisonCloudFrames: SpriteFrame[];
  shroomlingFrames: Partial<Record<CardinalDirectionName, SpriteFrame[]>>;
  spinningHeadFrames: SpriteFrame[];
  nightbloomThornFrames: SpriteFrame[];
  nightbloomPetalFrames: SpriteFrame[];
  nightbloomRootBurstFrames: SpriteFrame[];
  nightbloomNovaFrames: SpriteFrame[];
  nightbloomPetalImpactFrames: SpriteFrame[];
  obsidianLanceFrames: SpriteFrame[];
  obsidianShardFrames: SpriteFrame[];
  obsidianSmiteFrames: SpriteFrame[];
  obsidianWheelFrames: SpriteFrame[];
  abyssalBellShardFrames: SpriteFrame[];
  abyssalTollImpactFrames: SpriteFrame[];
  abyssalNovaFrames: SpriteFrame[];
  briarheartSkewerFrames: SpriteFrame[];
  briarheartSeedFrames: SpriteFrame[];
  briarheartVineFrames: SpriteFrame[];
  briarheartNovaFrames: SpriteFrame[];
  briarheartImpactFrames: SpriteFrame[];
  woundclockBoltFrames: SpriteFrame[];
  woundclockGearOrbFrames: SpriteFrame[];
  woundclockImpactFrames: SpriteFrame[];
  woundclockRiftFrames: SpriteFrame[];
  moonfallFrames: SpriteFrame[];
  motherslashWaveFrames: SpriteFrame[];
  verdantExplosionFrames: SpriteFrame[];
  rootbreakerShockwaveFrames: Partial<Record<CardinalDirectionName, SpriteFrame[]>>;
  thornwallCounterFrames: Partial<Record<CardinalDirectionName, SpriteFrame[]>>;
  motherloadBreakerFrames: Partial<Record<CardinalDirectionName, SpriteFrame[]>>;
  verdantGuillotineFrames: Partial<Record<CardinalDirectionName, SpriteFrame[]>>;
  moonwellBeamFrames: SpriteFrame[];
  moonBurstFrames: SpriteFrame[];
  clericHealFrames: SpriteFrame[];
  codgerIdleFrames: SpriteFrame[];
};

export type AnimationFrameLookup = {
  playerFrameCount(classId: ClassId, direction: DirectionName, animation: AnimationName): number;
  monsterFrameCount(monsterId: MonsterId, direction: DirectionName, animation: MonsterAnimationName): number;
  moonfallFrameCount(): number;
  codgerFrameCount(): number;
};

export type CanvasRenderer = {
  camera: CameraState;
  resize(): void;
  draw(state: import("../../game/state").GameState, delta: number): void;
};

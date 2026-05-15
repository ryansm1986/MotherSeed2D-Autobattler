import type { MonsterAnimationName, TelegraphKind } from "../../types";

export const obsidianReliquaryId = "obsidian_reliquary";

export type ObsidianAbilityDefinition = {
  id: TelegraphKind;
  animation: MonsterAnimationName;
  windup: number;
  active: number;
  recovery: number;
  cooldown: number;
  damage: number;
  range: { min: number; max: number; preferred: number };
};

export const obsidianReliquaryFight = {
  monsterId: obsidianReliquaryId,
  displayName: "Obsidian Reliquary",
  phaseTwoHealthRatio: 0.45,
  preferredDistance: 300,
  abilities: {
    glass_lance: {
      id: "glass_lance",
      animation: "cast",
      windup: 0.68,
      active: 0.08,
      recovery: 0.42,
      cooldown: 2.6,
      damage: 20,
      range: { min: 140, max: 760, preferred: 420 },
    },
    shard_spiral: {
      id: "shard_spiral",
      animation: "cast",
      windup: 0.96,
      active: 0.12,
      recovery: 0.58,
      cooldown: 5.4,
      damage: 12,
      range: { min: 110, max: 650, preferred: 330 },
    },
    reliquary_smite: {
      id: "reliquary_smite",
      animation: "cast",
      windup: 1.08,
      active: 0.12,
      recovery: 0.64,
      cooldown: 6.8,
      damage: 22,
      range: { min: 0, max: 620, preferred: 260 },
    },
    penitent_wheel: {
      id: "penitent_wheel",
      animation: "cast",
      windup: 1.22,
      active: 0.14,
      recovery: 0.9,
      cooldown: 9.4,
      damage: 30,
      range: { min: 0, max: 255, preferred: 130 },
    },
    phase_rupture: {
      id: "phase_rupture",
      animation: "phase_rupture",
      windup: 0.42,
      active: 0.1,
      recovery: 1.15,
      cooldown: 999,
      damage: 0,
      range: { min: 0, max: 999, preferred: 0 },
    },
  },
  projectiles: {
    lanceSpeed: 670,
    lanceLifetime: 1.28,
    shardSpeed: 370,
    shardLifetime: 1.72,
    shardCount: 8,
    phaseTwoShardCount: 12,
    shardSpread: Math.PI * 1.35,
    phaseTwoShardSpread: Math.PI * 1.72,
  },
  smite: {
    radius: 78,
    duration: 1.02,
    hitDelay: 0.36,
    phaseOneOffsets: [{ x: 0, y: 0 }, { x: 118, y: 42 }, { x: -96, y: -52 }],
    phaseTwoOffsets: [{ x: 0, y: 0 }, { x: 124, y: 46 }, { x: -108, y: -58 }, { x: 72, y: -126 }, { x: -74, y: 128 }],
  },
  wheel: {
    minRadius: 82,
    maxRadius: 308,
    duration: 0.98,
  },
} as const satisfies {
  monsterId: string;
  displayName: string;
  phaseTwoHealthRatio: number;
  preferredDistance: number;
  abilities: Record<"glass_lance" | "shard_spiral" | "reliquary_smite" | "penitent_wheel" | "phase_rupture", ObsidianAbilityDefinition>;
  projectiles: {
    lanceSpeed: number;
    lanceLifetime: number;
    shardSpeed: number;
    shardLifetime: number;
    shardCount: number;
    phaseTwoShardCount: number;
    shardSpread: number;
    phaseTwoShardSpread: number;
  };
  smite: {
    radius: number;
    duration: number;
    hitDelay: number;
    phaseOneOffsets: readonly { x: number; y: number }[];
    phaseTwoOffsets: readonly { x: number; y: number }[];
  };
  wheel: {
    minRadius: number;
    maxRadius: number;
    duration: number;
  };
};

export type ObsidianAbilityId = keyof typeof obsidianReliquaryFight.abilities;

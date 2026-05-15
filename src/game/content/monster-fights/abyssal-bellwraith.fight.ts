import type { MonsterAnimationName, TelegraphKind } from "../../types";

export const abyssalBellwraithId = "abyssal_bellwraith";

export type AbyssalAbilityDefinition = {
  id: TelegraphKind;
  animation: MonsterAnimationName;
  windup: number;
  active: number;
  recovery: number;
  cooldown: number;
  damage: number;
  range: { min: number; max: number; preferred: number };
};

export const abyssalBellwraithFight = {
  monsterId: abyssalBellwraithId,
  displayName: "Abyssal Bellwraith",
  phaseTwoHealthRatio: 0.5,
  preferredDistance: 335,
  abilities: {
    bell_shard: {
      id: "bell_shard",
      animation: "cast",
      windup: 0.74,
      active: 0.08,
      recovery: 0.46,
      cooldown: 2.35,
      damage: 22,
      range: { min: 140, max: 780, preferred: 440 },
    },
    tolling_fan: {
      id: "tolling_fan",
      animation: "cast",
      windup: 1.02,
      active: 0.12,
      recovery: 0.62,
      cooldown: 5.2,
      damage: 12,
      range: { min: 120, max: 680, preferred: 340 },
    },
    grave_mark: {
      id: "grave_mark",
      animation: "cast",
      windup: 1.16,
      active: 0.12,
      recovery: 0.68,
      cooldown: 6.6,
      damage: 24,
      range: { min: 0, max: 650, preferred: 280 },
    },
    dirge_nova: {
      id: "dirge_nova",
      animation: "cast",
      windup: 1.28,
      active: 0.14,
      recovery: 0.94,
      cooldown: 9.2,
      damage: 32,
      range: { min: 0, max: 270, preferred: 140 },
    },
    phase_toll: {
      id: "phase_toll",
      animation: "phase_toll",
      windup: 0.48,
      active: 0.1,
      recovery: 1.18,
      cooldown: 999,
      damage: 0,
      range: { min: 0, max: 999, preferred: 0 },
    },
  },
  projectiles: {
    shardSpeed: 690,
    shardLifetime: 1.22,
    fanSpeed: 390,
    fanLifetime: 1.62,
    fanCount: 7,
    phaseTwoFanCount: 11,
    fanSpread: Math.PI * 1.12,
    phaseTwoFanSpread: Math.PI * 1.68,
  },
  graveMark: {
    radius: 82,
    duration: 1.08,
    hitDelay: 0.4,
    phaseOneOffsets: [{ x: 0, y: 0 }, { x: 126, y: -38 }, { x: -112, y: 54 }],
    phaseTwoOffsets: [{ x: 0, y: 0 }, { x: 132, y: -44 }, { x: -118, y: 62 }, { x: 72, y: 132 }, { x: -82, y: -126 }],
  },
  nova: {
    minRadius: 86,
    maxRadius: 324,
    duration: 1.02,
    phaseTwoDelay: 0.34,
  },
} as const satisfies {
  monsterId: string;
  displayName: string;
  phaseTwoHealthRatio: number;
  preferredDistance: number;
  abilities: Record<"bell_shard" | "tolling_fan" | "grave_mark" | "dirge_nova" | "phase_toll", AbyssalAbilityDefinition>;
  projectiles: {
    shardSpeed: number;
    shardLifetime: number;
    fanSpeed: number;
    fanLifetime: number;
    fanCount: number;
    phaseTwoFanCount: number;
    fanSpread: number;
    phaseTwoFanSpread: number;
  };
  graveMark: {
    radius: number;
    duration: number;
    hitDelay: number;
    phaseOneOffsets: readonly { x: number; y: number }[];
    phaseTwoOffsets: readonly { x: number; y: number }[];
  };
  nova: {
    minRadius: number;
    maxRadius: number;
    duration: number;
    phaseTwoDelay: number;
  };
};

export type AbyssalAbilityId = keyof typeof abyssalBellwraithFight.abilities;

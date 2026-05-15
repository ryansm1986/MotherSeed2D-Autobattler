import type { MonsterAnimationName, TelegraphKind } from "../../types";

export const briarheartSovereignId = "briarheart_sovereign";

export type BriarheartAbilityDefinition = {
  id: TelegraphKind;
  animation: MonsterAnimationName;
  windup: number;
  active: number;
  recovery: number;
  cooldown: number;
  damage: number;
  range: { min: number; max: number; preferred: number };
};

export const briarheartSovereignFight = {
  monsterId: briarheartSovereignId,
  displayName: "Briarheart Sovereign",
  phaseTwoHealthRatio: 0.45,
  preferredDistance: 345,
  abilities: {
    briar_skewer: {
      id: "briar_skewer",
      animation: "cast",
      windup: 0.74,
      active: 0.08,
      recovery: 0.44,
      cooldown: 2.8,
      damage: 22,
      range: { min: 140, max: 780, preferred: 470 },
    },
    seed_barrage: {
      id: "seed_barrage",
      animation: "cast",
      windup: 1,
      active: 0.12,
      recovery: 0.62,
      cooldown: 5.2,
      damage: 13,
      range: { min: 120, max: 690, preferred: 390 },
    },
    strangler_grove: {
      id: "strangler_grove",
      animation: "cast",
      windup: 1.12,
      active: 0.12,
      recovery: 0.72,
      cooldown: 7.2,
      damage: 24,
      range: { min: 0, max: 640, preferred: 280 },
    },
    pollen_nova: {
      id: "pollen_nova",
      animation: "cast",
      windup: 1.28,
      active: 0.16,
      recovery: 0.94,
      cooldown: 9.8,
      damage: 32,
      range: { min: 0, max: 270, preferred: 130 },
    },
    sovereign_bloom: {
      id: "sovereign_bloom",
      animation: "phase_bloom",
      windup: 0.46,
      active: 0.1,
      recovery: 1.2,
      cooldown: 999,
      damage: 0,
      range: { min: 0, max: 999, preferred: 0 },
    },
  },
  projectiles: {
    skewerSpeed: 710,
    skewerLifetime: 1.24,
    seedSpeed: 390,
    seedLifetime: 1.8,
    seedCount: 7,
    phaseTwoSeedCount: 11,
    seedSpread: Math.PI * 1.1,
    phaseTwoSeedSpread: Math.PI * 1.62,
  },
  grove: {
    radius: 82,
    duration: 1.08,
    hitDelay: 0.38,
    phaseOneOffsets: [{ x: 0, y: 0 }, { x: 116, y: -44 }, { x: -104, y: 60 }],
    phaseTwoOffsets: [{ x: 0, y: 0 }, { x: 126, y: -48 }, { x: -116, y: 66 }, { x: 70, y: 132 }, { x: -78, y: -130 }, { x: 0, y: -180 }],
  },
  nova: {
    minRadius: 88,
    maxRadius: 326,
    duration: 1.02,
  },
} as const satisfies {
  monsterId: string;
  displayName: string;
  phaseTwoHealthRatio: number;
  preferredDistance: number;
  abilities: Record<"briar_skewer" | "seed_barrage" | "strangler_grove" | "pollen_nova" | "sovereign_bloom", BriarheartAbilityDefinition>;
  projectiles: {
    skewerSpeed: number;
    skewerLifetime: number;
    seedSpeed: number;
    seedLifetime: number;
    seedCount: number;
    phaseTwoSeedCount: number;
    seedSpread: number;
    phaseTwoSeedSpread: number;
  };
  grove: {
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
  };
};

export type BriarheartAbilityId = keyof typeof briarheartSovereignFight.abilities;

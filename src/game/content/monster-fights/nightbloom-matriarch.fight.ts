import type { MonsterAnimationName, TelegraphKind } from "../../types";

export const nightbloomMatriarchId = "nightbloom_matriarch";

export type NightbloomAbilityDefinition = {
  id: TelegraphKind;
  animation: MonsterAnimationName;
  windup: number;
  active: number;
  recovery: number;
  cooldown: number;
  damage: number;
  range: { min: number; max: number; preferred: number };
};

export const nightbloomMatriarchFight = {
  monsterId: nightbloomMatriarchId,
  displayName: "Nightbloom Matriarch",
  phaseTwoHealthRatio: 0.5,
  preferredDistance: 330,
  abilities: {
    thorn_lance: {
      id: "thorn_lance",
      animation: "thorn_lance",
      windup: 0.72,
      active: 0.08,
      recovery: 0.42,
      cooldown: 3.2,
      damage: 18,
      range: { min: 120, max: 720, preferred: 430 },
    },
    petal_fan: {
      id: "petal_fan",
      animation: "petal_fan",
      windup: 0.92,
      active: 0.1,
      recovery: 0.56,
      cooldown: 5,
      damage: 11,
      range: { min: 150, max: 620, preferred: 360 },
    },
    root_snare: {
      id: "root_snare",
      animation: "root_snare",
      windup: 1.05,
      active: 0.12,
      recovery: 0.64,
      cooldown: 7,
      damage: 16,
      range: { min: 0, max: 620, preferred: 260 },
    },
    nightbloom_nova: {
      id: "nightbloom_nova",
      animation: "nova",
      windup: 1.18,
      active: 0.16,
      recovery: 0.86,
      cooldown: 10,
      damage: 28,
      range: { min: 0, max: 250, preferred: 120 },
    },
    phase_bloom: {
      id: "phase_bloom",
      animation: "phase_bloom",
      windup: 0.35,
      active: 0.1,
      recovery: 1.25,
      cooldown: 999,
      damage: 0,
      range: { min: 0, max: 999, preferred: 0 },
    },
  },
  projectiles: {
    thornSpeed: 620,
    petalSpeed: 410,
    thornLifetime: 1.35,
    petalLifetime: 1.55,
    petalFanCount: 5,
    phaseTwoPetalFanCount: 7,
    petalFanSpread: Math.PI * 0.46,
    phaseTwoPetalFanSpread: Math.PI * 0.68,
  },
  rootSnare: {
    radius: 72,
    duration: 1.05,
    hitDelay: 0.32,
    phaseOneOffsets: [{ x: 0, y: 0 }, { x: 96, y: -28 }, { x: -88, y: 54 }],
    phaseTwoOffsets: [{ x: 0, y: 0 }, { x: 112, y: -36 }, { x: -102, y: 64 }, { x: 42, y: 116 }, { x: -58, y: -118 }],
  },
  nova: {
    minRadius: 76,
    maxRadius: 282,
    duration: 0.94,
  },
} as const satisfies {
  monsterId: string;
  displayName: string;
  phaseTwoHealthRatio: number;
  preferredDistance: number;
  abilities: Record<"thorn_lance" | "petal_fan" | "root_snare" | "nightbloom_nova" | "phase_bloom", NightbloomAbilityDefinition>;
  projectiles: {
    thornSpeed: number;
    petalSpeed: number;
    thornLifetime: number;
    petalLifetime: number;
    petalFanCount: number;
    phaseTwoPetalFanCount: number;
    petalFanSpread: number;
    phaseTwoPetalFanSpread: number;
  };
  rootSnare: {
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

export type NightbloomAbilityId = keyof typeof nightbloomMatriarchFight.abilities;

export function isNightbloomAbility(attack: TelegraphKind): attack is NightbloomAbilityId {
  return attack in nightbloomMatriarchFight.abilities;
}

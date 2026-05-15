import type { MonsterAnimationName, TelegraphKind } from "../../types";

export const woundclockArbiterId = "woundclock_arbiter";

export type WoundclockAbilityDefinition = {
  id: TelegraphKind;
  animation: MonsterAnimationName;
  windup: number;
  active: number;
  recovery: number;
  cooldown: number;
  damage: number;
  range: { min: number; max: number; preferred: number };
};

export const woundclockArbiterFight = {
  monsterId: woundclockArbiterId,
  displayName: "Woundclock Arbiter",
  phaseTwoHealthRatio: 0.5,
  preferredDistance: 410,
  abilities: {
    chrono_lance: {
      id: "chrono_lance",
      animation: "cast",
      windup: 0.66,
      active: 0.08,
      recovery: 0.42,
      cooldown: 2.35,
      damage: 23,
      range: { min: 170, max: 820, preferred: 540 },
    },
    gear_orbit: {
      id: "gear_orbit",
      animation: "cast",
      windup: 0.92,
      active: 0.12,
      recovery: 0.68,
      cooldown: 5.8,
      damage: 14,
      range: { min: 120, max: 700, preferred: 390 },
    },
    clockhand_sweep: {
      id: "clockhand_sweep",
      animation: "cast",
      windup: 0.96,
      active: 0.1,
      recovery: 0.7,
      cooldown: 6.6,
      damage: 30,
      range: { min: 0, max: 390, preferred: 240 },
    },
    time_rift: {
      id: "time_rift",
      animation: "cast",
      windup: 1.08,
      active: 0.12,
      recovery: 0.78,
      cooldown: 7.4,
      damage: 25,
      range: { min: 0, max: 680, preferred: 340 },
    },
    hour_zero: {
      id: "hour_zero",
      animation: "phase_bloom",
      windup: 0.52,
      active: 0.1,
      recovery: 1.25,
      cooldown: 999,
      damage: 0,
      range: { min: 0, max: 999, preferred: 0 },
    },
  },
  chronoLance: {
    speed: 760,
    lifetime: 1.28,
    phaseTwoCount: 3,
    phaseTwoSpread: Math.PI * 0.16,
  },
  gearOrbit: {
    count: 6,
    phaseTwoCount: 9,
    orbitDuration: 0.62,
    duration: 2.1,
    orbitRadius: 116,
    releaseSpeed: 430,
  },
  clockhandSweep: {
    length: 470,
    width: 34,
    duration: 1.05,
    phaseTwoDuration: 1.18,
    arc: Math.PI * 1.22,
  },
  timeRift: {
    radius: 76,
    duration: 1.08,
    hitDelay: 0.42,
    phaseOneOffsets: [{ x: 0, y: 0 }, { x: 132, y: -72 }, { x: -126, y: 74 }],
    phaseTwoOffsets: [{ x: 0, y: 0 }, { x: 146, y: -82 }, { x: -136, y: 86 }, { x: 84, y: 146 }, { x: -92, y: -142 }],
  },
} as const satisfies {
  monsterId: string;
  displayName: string;
  phaseTwoHealthRatio: number;
  preferredDistance: number;
  abilities: Record<"chrono_lance" | "gear_orbit" | "clockhand_sweep" | "time_rift" | "hour_zero", WoundclockAbilityDefinition>;
  chronoLance: {
    speed: number;
    lifetime: number;
    phaseTwoCount: number;
    phaseTwoSpread: number;
  };
  gearOrbit: {
    count: number;
    phaseTwoCount: number;
    orbitDuration: number;
    duration: number;
    orbitRadius: number;
    releaseSpeed: number;
  };
  clockhandSweep: {
    length: number;
    width: number;
    duration: number;
    phaseTwoDuration: number;
    arc: number;
  };
  timeRift: {
    radius: number;
    duration: number;
    hitDelay: number;
    phaseOneOffsets: readonly { x: number; y: number }[];
    phaseTwoOffsets: readonly { x: number; y: number }[];
  };
};

export type WoundclockAbilityId = keyof typeof woundclockArbiterFight.abilities;

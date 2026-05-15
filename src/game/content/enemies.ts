import type { MonsterAnimationName, MonsterId, TelegraphKind } from "../types";
import type { DrawProfile } from "../../render/canvas2d/types";
import { nightbloomMatriarchFight } from "./monster-fights/nightbloom-matriarch.fight";
import { obsidianReliquaryFight } from "./monster-fights/obsidian-reliquary.fight";
import { abyssalBellwraithFight } from "./monster-fights/abyssal-bellwraith.fight";
import { briarheartSovereignFight } from "./monster-fights/briarheart-sovereign.fight";
import { woundclockArbiterFight } from "./monster-fights/woundclock-arbiter.fight";

export const rootboundEliteName = "Rootbound Elite";

export type EnemyDefinition = {
  id: MonsterId;
  name: string;
  maxHealth: number;
  radius: number;
  moveSpeed: number;
  attackMap: Record<TelegraphKind, MonsterAnimationName>;
};

export const enemyRoster = [
  {
    id: "shroom_boy",
    name: "Deepcap Sporeling",
    maxHealth: 145,
    radius: 26,
    moveSpeed: 128,
    attackMap: {
      rock_slam: "rock_slam",
      rock_spray: "rock_spray",
      rock_throw: "rock_throw",
      spore_cloud: "rock_spray",
      shroom_toss: "rock_throw",
      bite: "bite",
      head_throw: "rock_throw",
      arm_attack: "rock_slam",
      thorn_lance: "rock_throw",
      petal_fan: "rock_spray",
      root_snare: "rock_slam",
      nightbloom_nova: "rock_slam",
      phase_bloom: "idle",
      glass_lance: "rock_throw",
      shard_spiral: "rock_spray",
      reliquary_smite: "rock_slam",
      penitent_wheel: "rock_slam",
      phase_rupture: "idle",
      bell_shard: "rock_throw",
      tolling_fan: "rock_spray",
      grave_mark: "rock_slam",
      dirge_nova: "rock_slam",
      phase_toll: "idle",
      briar_skewer: "rock_throw",
      seed_barrage: "rock_spray",
      strangler_grove: "rock_slam",
      pollen_nova: "rock_slam",
      sovereign_bloom: "idle",
      chrono_lance: "rock_throw",
      gear_orbit: "rock_spray",
      clockhand_sweep: "rock_slam",
      time_rift: "rock_slam",
      hour_zero: "idle",
    },
  },
  {
    id: "tree_goblin",
    name: "Barkjaw Goblin",
    maxHealth: 165,
    radius: 28,
    moveSpeed: 150,
    attackMap: {
      rock_slam: "rock_slam",
      rock_spray: "rock_spray",
      rock_throw: "rock_throw",
      spore_cloud: "rock_spray",
      shroom_toss: "rock_throw",
      bite: "rock_slam",
      head_throw: "rock_throw",
      arm_attack: "rock_slam",
      thorn_lance: "rock_throw",
      petal_fan: "rock_spray",
      root_snare: "rock_slam",
      nightbloom_nova: "rock_slam",
      phase_bloom: "idle",
      glass_lance: "rock_throw",
      shard_spiral: "rock_spray",
      reliquary_smite: "rock_slam",
      penitent_wheel: "rock_slam",
      phase_rupture: "idle",
      bell_shard: "rock_throw",
      tolling_fan: "rock_spray",
      grave_mark: "rock_slam",
      dirge_nova: "rock_slam",
      phase_toll: "idle",
      briar_skewer: "rock_throw",
      seed_barrage: "rock_spray",
      strangler_grove: "rock_slam",
      pollen_nova: "rock_slam",
      sovereign_bloom: "idle",
      chrono_lance: "rock_throw",
      gear_orbit: "rock_spray",
      clockhand_sweep: "rock_slam",
      time_rift: "rock_slam",
      hour_zero: "idle",
    },
  },
  {
    id: "moss_golem",
    name: rootboundEliteName,
    maxHealth: 220,
    radius: 34,
    moveSpeed: 108,
    attackMap: {
      rock_slam: "rock_slam",
      rock_spray: "rock_spray",
      rock_throw: "rock_throw",
      spore_cloud: "rock_spray",
      shroom_toss: "rock_throw",
      bite: "rock_slam",
      head_throw: "rock_throw",
      arm_attack: "rock_slam",
      thorn_lance: "rock_throw",
      petal_fan: "rock_spray",
      root_snare: "rock_slam",
      nightbloom_nova: "rock_slam",
      phase_bloom: "idle",
      glass_lance: "rock_throw",
      shard_spiral: "rock_spray",
      reliquary_smite: "rock_slam",
      penitent_wheel: "rock_slam",
      phase_rupture: "idle",
      bell_shard: "rock_throw",
      tolling_fan: "rock_spray",
      grave_mark: "rock_slam",
      dirge_nova: "rock_slam",
      phase_toll: "idle",
      briar_skewer: "rock_throw",
      seed_barrage: "rock_spray",
      strangler_grove: "rock_slam",
      pollen_nova: "rock_slam",
      sovereign_bloom: "idle",
      chrono_lance: "rock_throw",
      gear_orbit: "rock_spray",
      clockhand_sweep: "rock_slam",
      time_rift: "rock_slam",
      hour_zero: "idle",
    },
  },
  {
    id: "nightbloom_matriarch",
    name: nightbloomMatriarchFight.displayName,
    maxHealth: 520,
    radius: 42,
    moveSpeed: 92,
    attackMap: {
      rock_slam: "nova",
      rock_spray: "petal_fan",
      rock_throw: "thorn_lance",
      spore_cloud: "root_snare",
      shroom_toss: "petal_fan",
      bite: "thorn_lance",
      head_throw: "petal_fan",
      arm_attack: "thorn_lance",
      thorn_lance: "thorn_lance",
      petal_fan: "petal_fan",
      root_snare: "root_snare",
      nightbloom_nova: "nova",
      phase_bloom: "phase_bloom",
      glass_lance: "thorn_lance",
      shard_spiral: "petal_fan",
      reliquary_smite: "root_snare",
      penitent_wheel: "nova",
      phase_rupture: "phase_bloom",
      bell_shard: "thorn_lance",
      tolling_fan: "petal_fan",
      grave_mark: "root_snare",
      dirge_nova: "nova",
      phase_toll: "phase_bloom",
      briar_skewer: "thorn_lance",
      seed_barrage: "petal_fan",
      strangler_grove: "root_snare",
      pollen_nova: "nova",
      sovereign_bloom: "phase_bloom",
      chrono_lance: "thorn_lance",
      gear_orbit: "petal_fan",
      clockhand_sweep: "nova",
      time_rift: "root_snare",
      hour_zero: "phase_bloom",
    },
  },
  {
    id: "obsidian_reliquary",
    name: obsidianReliquaryFight.displayName,
    maxHealth: 610,
    radius: 46,
    moveSpeed: 86,
    attackMap: {
      rock_slam: "cast",
      rock_spray: "cast",
      rock_throw: "cast",
      spore_cloud: "cast",
      shroom_toss: "cast",
      bite: "cast",
      head_throw: "cast",
      arm_attack: "cast",
      thorn_lance: "cast",
      petal_fan: "cast",
      root_snare: "cast",
      nightbloom_nova: "cast",
      phase_bloom: "phase_rupture",
      glass_lance: "cast",
      shard_spiral: "cast",
      reliquary_smite: "cast",
      penitent_wheel: "cast",
      phase_rupture: "phase_rupture",
      bell_shard: "cast",
      tolling_fan: "cast",
      grave_mark: "cast",
      dirge_nova: "cast",
      phase_toll: "phase_rupture",
      briar_skewer: "cast",
      seed_barrage: "cast",
      strangler_grove: "cast",
      pollen_nova: "cast",
      sovereign_bloom: "phase_rupture",
      chrono_lance: "cast",
      gear_orbit: "cast",
      clockhand_sweep: "cast",
      time_rift: "cast",
      hour_zero: "phase_rupture",
    },
  },
  {
    id: "abyssal_bellwraith",
    name: abyssalBellwraithFight.displayName,
    maxHealth: 700,
    radius: 50,
    moveSpeed: 82,
    attackMap: {
      rock_slam: "cast",
      rock_spray: "cast",
      rock_throw: "cast",
      spore_cloud: "cast",
      shroom_toss: "cast",
      bite: "cast",
      head_throw: "cast",
      arm_attack: "cast",
      thorn_lance: "cast",
      petal_fan: "cast",
      root_snare: "cast",
      nightbloom_nova: "cast",
      phase_bloom: "phase_toll",
      glass_lance: "cast",
      shard_spiral: "cast",
      reliquary_smite: "cast",
      penitent_wheel: "cast",
      phase_rupture: "phase_toll",
      bell_shard: "cast",
      tolling_fan: "cast",
      grave_mark: "cast",
      dirge_nova: "cast",
      phase_toll: "phase_toll",
      briar_skewer: "cast",
      seed_barrage: "cast",
      strangler_grove: "cast",
      pollen_nova: "cast",
      sovereign_bloom: "phase_toll",
      chrono_lance: "cast",
      gear_orbit: "cast",
      clockhand_sweep: "cast",
      time_rift: "cast",
      hour_zero: "phase_toll",
    },
  },
  {
    id: "briarheart_sovereign",
    name: briarheartSovereignFight.displayName,
    maxHealth: 680,
    radius: 52,
    moveSpeed: 88,
    attackMap: {
      rock_slam: "cast",
      rock_spray: "cast",
      rock_throw: "cast",
      spore_cloud: "cast",
      shroom_toss: "cast",
      bite: "cast",
      head_throw: "cast",
      arm_attack: "cast",
      thorn_lance: "cast",
      petal_fan: "cast",
      root_snare: "cast",
      nightbloom_nova: "cast",
      phase_bloom: "phase_bloom",
      glass_lance: "cast",
      shard_spiral: "cast",
      reliquary_smite: "cast",
      penitent_wheel: "cast",
      phase_rupture: "phase_bloom",
      bell_shard: "cast",
      tolling_fan: "cast",
      grave_mark: "cast",
      dirge_nova: "cast",
      phase_toll: "phase_bloom",
      briar_skewer: "cast",
      seed_barrage: "cast",
      strangler_grove: "cast",
      pollen_nova: "cast",
      sovereign_bloom: "phase_bloom",
      chrono_lance: "cast",
      gear_orbit: "cast",
      clockhand_sweep: "cast",
      time_rift: "cast",
      hour_zero: "phase_bloom",
    },
  },
  {
    id: "woundclock_arbiter",
    name: woundclockArbiterFight.displayName,
    maxHealth: 760,
    radius: 54,
    moveSpeed: 92,
    attackMap: {
      rock_slam: "cast",
      rock_spray: "cast",
      rock_throw: "cast",
      spore_cloud: "cast",
      shroom_toss: "cast",
      bite: "cast",
      head_throw: "cast",
      arm_attack: "cast",
      thorn_lance: "cast",
      petal_fan: "cast",
      root_snare: "cast",
      nightbloom_nova: "cast",
      phase_bloom: "phase_bloom",
      glass_lance: "cast",
      shard_spiral: "cast",
      reliquary_smite: "cast",
      penitent_wheel: "cast",
      phase_rupture: "phase_bloom",
      bell_shard: "cast",
      tolling_fan: "cast",
      grave_mark: "cast",
      dirge_nova: "cast",
      phase_toll: "phase_bloom",
      briar_skewer: "cast",
      seed_barrage: "cast",
      strangler_grove: "cast",
      pollen_nova: "cast",
      sovereign_bloom: "phase_bloom",
      chrono_lance: "cast",
      gear_orbit: "cast",
      clockhand_sweep: "cast",
      time_rift: "cast",
      hour_zero: "phase_bloom",
    },
  },
] as const satisfies readonly EnemyDefinition[];

export function enemyForRoom(roomIndex: number): EnemyDefinition {
  return enemyRoster[((roomIndex % enemyRoster.length) + enemyRoster.length) % enemyRoster.length];
}

export function enemiesForRoom(roomIndex: number): EnemyDefinition[] {
  if (roomIndex < enemyRoster.length) return [enemyRoster[Math.max(0, roomIndex)]];

  const pairIndex = roomIndex - enemyRoster.length;
  const first = pairIndex % enemyRoster.length;
  const second = (first + 1) % enemyRoster.length;
  return [enemyRoster[first], enemyRoster[second]];
}

export function getEnemyDefinition(id: MonsterId): EnemyDefinition {
  return enemyRoster.find((enemy) => enemy.id === id) ?? enemyRoster[0];
}

export const enemyAttackTimings = {
  rock_spray: {
    windup: 1.2,
    active: 0.4,
    recovery: 0.9,
  },
  rock_slam: {
    windup: 1.35,
    active: 0.45,
    recovery: 0.9,
  },
  rock_throw: {
    windup: 0.5,
    active: 0.02,
    recovery: 0.4,
  },
  spore_cloud: {
    windup: 0.65,
    active: 0.08,
    recovery: 0.45,
  },
  shroom_toss: {
    windup: 0.48,
    active: 0.08,
    recovery: 0.55,
  },
  bite: {
    windup: 0.28,
    active: 0.16,
    recovery: 0.38,
  },
  head_throw: {
    windup: 0.78,
    active: 0.08,
    recovery: 5.65,
  },
  arm_attack: {
    windup: 0.46,
    active: 0.18,
    recovery: 0.46,
  },
  thorn_lance: {
    windup: nightbloomMatriarchFight.abilities.thorn_lance.windup,
    active: nightbloomMatriarchFight.abilities.thorn_lance.active,
    recovery: nightbloomMatriarchFight.abilities.thorn_lance.recovery,
  },
  petal_fan: {
    windup: nightbloomMatriarchFight.abilities.petal_fan.windup,
    active: nightbloomMatriarchFight.abilities.petal_fan.active,
    recovery: nightbloomMatriarchFight.abilities.petal_fan.recovery,
  },
  root_snare: {
    windup: nightbloomMatriarchFight.abilities.root_snare.windup,
    active: nightbloomMatriarchFight.abilities.root_snare.active,
    recovery: nightbloomMatriarchFight.abilities.root_snare.recovery,
  },
  nightbloom_nova: {
    windup: nightbloomMatriarchFight.abilities.nightbloom_nova.windup,
    active: nightbloomMatriarchFight.abilities.nightbloom_nova.active,
    recovery: nightbloomMatriarchFight.abilities.nightbloom_nova.recovery,
  },
  phase_bloom: {
    windup: nightbloomMatriarchFight.abilities.phase_bloom.windup,
    active: nightbloomMatriarchFight.abilities.phase_bloom.active,
    recovery: nightbloomMatriarchFight.abilities.phase_bloom.recovery,
  },
  glass_lance: {
    windup: obsidianReliquaryFight.abilities.glass_lance.windup,
    active: obsidianReliquaryFight.abilities.glass_lance.active,
    recovery: obsidianReliquaryFight.abilities.glass_lance.recovery,
  },
  shard_spiral: {
    windup: obsidianReliquaryFight.abilities.shard_spiral.windup,
    active: obsidianReliquaryFight.abilities.shard_spiral.active,
    recovery: obsidianReliquaryFight.abilities.shard_spiral.recovery,
  },
  reliquary_smite: {
    windup: obsidianReliquaryFight.abilities.reliquary_smite.windup,
    active: obsidianReliquaryFight.abilities.reliquary_smite.active,
    recovery: obsidianReliquaryFight.abilities.reliquary_smite.recovery,
  },
  penitent_wheel: {
    windup: obsidianReliquaryFight.abilities.penitent_wheel.windup,
    active: obsidianReliquaryFight.abilities.penitent_wheel.active,
    recovery: obsidianReliquaryFight.abilities.penitent_wheel.recovery,
  },
  phase_rupture: {
    windup: obsidianReliquaryFight.abilities.phase_rupture.windup,
    active: obsidianReliquaryFight.abilities.phase_rupture.active,
    recovery: obsidianReliquaryFight.abilities.phase_rupture.recovery,
  },
  bell_shard: {
    windup: abyssalBellwraithFight.abilities.bell_shard.windup,
    active: abyssalBellwraithFight.abilities.bell_shard.active,
    recovery: abyssalBellwraithFight.abilities.bell_shard.recovery,
  },
  tolling_fan: {
    windup: abyssalBellwraithFight.abilities.tolling_fan.windup,
    active: abyssalBellwraithFight.abilities.tolling_fan.active,
    recovery: abyssalBellwraithFight.abilities.tolling_fan.recovery,
  },
  grave_mark: {
    windup: abyssalBellwraithFight.abilities.grave_mark.windup,
    active: abyssalBellwraithFight.abilities.grave_mark.active,
    recovery: abyssalBellwraithFight.abilities.grave_mark.recovery,
  },
  dirge_nova: {
    windup: abyssalBellwraithFight.abilities.dirge_nova.windup,
    active: abyssalBellwraithFight.abilities.dirge_nova.active,
    recovery: abyssalBellwraithFight.abilities.dirge_nova.recovery,
  },
  phase_toll: {
    windup: abyssalBellwraithFight.abilities.phase_toll.windup,
    active: abyssalBellwraithFight.abilities.phase_toll.active,
    recovery: abyssalBellwraithFight.abilities.phase_toll.recovery,
  },
  briar_skewer: {
    windup: briarheartSovereignFight.abilities.briar_skewer.windup,
    active: briarheartSovereignFight.abilities.briar_skewer.active,
    recovery: briarheartSovereignFight.abilities.briar_skewer.recovery,
  },
  seed_barrage: {
    windup: briarheartSovereignFight.abilities.seed_barrage.windup,
    active: briarheartSovereignFight.abilities.seed_barrage.active,
    recovery: briarheartSovereignFight.abilities.seed_barrage.recovery,
  },
  strangler_grove: {
    windup: briarheartSovereignFight.abilities.strangler_grove.windup,
    active: briarheartSovereignFight.abilities.strangler_grove.active,
    recovery: briarheartSovereignFight.abilities.strangler_grove.recovery,
  },
  pollen_nova: {
    windup: briarheartSovereignFight.abilities.pollen_nova.windup,
    active: briarheartSovereignFight.abilities.pollen_nova.active,
    recovery: briarheartSovereignFight.abilities.pollen_nova.recovery,
  },
  sovereign_bloom: {
    windup: briarheartSovereignFight.abilities.sovereign_bloom.windup,
    active: briarheartSovereignFight.abilities.sovereign_bloom.active,
    recovery: briarheartSovereignFight.abilities.sovereign_bloom.recovery,
  },
  chrono_lance: {
    windup: woundclockArbiterFight.abilities.chrono_lance.windup,
    active: woundclockArbiterFight.abilities.chrono_lance.active,
    recovery: woundclockArbiterFight.abilities.chrono_lance.recovery,
  },
  gear_orbit: {
    windup: woundclockArbiterFight.abilities.gear_orbit.windup,
    active: woundclockArbiterFight.abilities.gear_orbit.active,
    recovery: woundclockArbiterFight.abilities.gear_orbit.recovery,
  },
  clockhand_sweep: {
    windup: woundclockArbiterFight.abilities.clockhand_sweep.windup,
    active: woundclockArbiterFight.abilities.clockhand_sweep.active,
    recovery: woundclockArbiterFight.abilities.clockhand_sweep.recovery,
  },
  time_rift: {
    windup: woundclockArbiterFight.abilities.time_rift.windup,
    active: woundclockArbiterFight.abilities.time_rift.active,
    recovery: woundclockArbiterFight.abilities.time_rift.recovery,
  },
  hour_zero: {
    windup: woundclockArbiterFight.abilities.hour_zero.windup,
    active: woundclockArbiterFight.abilities.hour_zero.active,
    recovery: woundclockArbiterFight.abilities.hour_zero.recovery,
  },
} as const satisfies Record<TelegraphKind, { windup: number; active: number; recovery: number }>;

export const mossGolemSpriteDraw = {
  v2Standard: {
    scale: 0.74,
    anchorX: 192,
    anchorY: 360,
    baselineOffset: 34,
  },
  v2Action: {
    scale: 0.48,
    anchorX: 576,
    anchorY: 1128,
    baselineOffset: 34,
  },
  death: {
    scale: 2.2,
    anchorX: 64,
    anchorY: 120,
    baselineOffset: 34,
  },
} as const satisfies Record<string, DrawProfile>;

export const enemySpriteDraw = {
  moss_golem: mossGolemSpriteDraw,
  tree_goblin: {
    standard: {
      scale: 1.46,
      anchorX: 64,
      anchorY: 120,
      baselineOffset: 22,
    },
    action: {
      scale: 0.5,
      anchorX: 192,
      anchorY: 360,
      baselineOffset: 22,
    },
  },
  shroom_boy: {
    standard: {
      scale: 1.5,
      anchorX: 64,
      anchorY: 120,
      baselineOffset: 22,
    },
    sprayAction: {
      scale: 0.96,
      anchorX: 192,
      anchorY: 375,
      baselineOffset: 22,
    },
    throwAction: {
      scale: 1.38,
      anchorX: 64,
      anchorY: 122,
      baselineOffset: 22,
    },
    biteAction: {
      scale: 1.5,
      anchorX: 64,
      anchorY: 120,
      baselineOffset: 22,
    },
  },
  nightbloom_matriarch: {
    standard: {
      scale: 0.92,
      anchorX: 64,
      anchorY: 116,
      baselineOffset: 30,
      targetContentHeight: 190,
    },
    action: {
      scale: 0.92,
      anchorX: 64,
      anchorY: 116,
      baselineOffset: 30,
      targetContentHeight: 198,
    },
    death: {
      scale: 0.92,
      anchorX: 64,
      anchorY: 116,
      baselineOffset: 30,
      targetContentHeight: 172,
    },
  },
  obsidian_reliquary: {
    standard: {
      scale: 0.9,
      anchorX: 64,
      anchorY: 116,
      baselineOffset: 32,
      targetContentHeight: 202,
    },
    action: {
      scale: 0.9,
      anchorX: 64,
      anchorY: 116,
      baselineOffset: 32,
      targetContentHeight: 212,
    },
    death: {
      scale: 0.9,
      anchorX: 64,
      anchorY: 116,
      baselineOffset: 32,
      targetContentHeight: 184,
    },
  },
  abyssal_bellwraith: {
    standard: {
      scale: 0.92,
      anchorX: 64,
      anchorY: 116,
      baselineOffset: 34,
      targetContentHeight: 226,
    },
    action: {
      scale: 0.92,
      anchorX: 64,
      anchorY: 116,
      baselineOffset: 34,
      targetContentHeight: 238,
    },
    death: {
      scale: 0.92,
      anchorX: 64,
      anchorY: 116,
      baselineOffset: 34,
      targetContentHeight: 206,
    },
  },
  briarheart_sovereign: {
    standard: {
      scale: 0.9,
      anchorX: 64,
      anchorY: 116,
      baselineOffset: 34,
      targetContentHeight: 236,
    },
    action: {
      scale: 0.9,
      anchorX: 64,
      anchorY: 116,
      baselineOffset: 34,
      targetContentHeight: 248,
    },
    death: {
      scale: 0.9,
      anchorX: 64,
      anchorY: 116,
      baselineOffset: 34,
      targetContentHeight: 208,
    },
  },
  woundclock_arbiter: {
    standard: {
      scale: 1,
      anchorX: 128,
      anchorY: 236,
      baselineOffset: 36,
      targetContentHeight: 258,
    },
    action: {
      scale: 1,
      anchorX: 128,
      anchorY: 236,
      baselineOffset: 36,
      targetContentHeight: 272,
    },
    death: {
      scale: 1,
      anchorX: 128,
      anchorY: 236,
      baselineOffset: 36,
      targetContentHeight: 230,
    },
  },
} as const satisfies Record<MonsterId, Record<string, DrawProfile>>;

export function getEnemyDrawProfile(monsterId: MonsterId, animation: MonsterAnimationName): DrawProfile {
  if (monsterId === "woundclock_arbiter") {
    if (animation === "death" || animation === "phase_bloom") return enemySpriteDraw.woundclock_arbiter.death;
    if (animation === "idle" || animation === "walk" || animation === "run") return enemySpriteDraw.woundclock_arbiter.standard;
    return enemySpriteDraw.woundclock_arbiter.action;
  }

  if (monsterId === "briarheart_sovereign") {
    if (animation === "death" || animation === "phase_bloom") return enemySpriteDraw.briarheart_sovereign.death;
    if (animation === "idle" || animation === "walk" || animation === "run") return enemySpriteDraw.briarheart_sovereign.standard;
    return enemySpriteDraw.briarheart_sovereign.action;
  }

  if (monsterId === "abyssal_bellwraith") {
    if (animation === "death" || animation === "phase_toll") return enemySpriteDraw.abyssal_bellwraith.death;
    if (animation === "idle" || animation === "walk" || animation === "run") return enemySpriteDraw.abyssal_bellwraith.standard;
    return enemySpriteDraw.abyssal_bellwraith.action;
  }

  if (monsterId === "obsidian_reliquary") {
    if (animation === "death") return enemySpriteDraw.obsidian_reliquary.death;
    if (animation === "idle" || animation === "walk" || animation === "run") return enemySpriteDraw.obsidian_reliquary.standard;
    return enemySpriteDraw.obsidian_reliquary.action;
  }

  if (monsterId === "nightbloom_matriarch") {
    if (animation === "death") return enemySpriteDraw.nightbloom_matriarch.death;
    if (animation === "idle" || animation === "walk" || animation === "run") return enemySpriteDraw.nightbloom_matriarch.standard;
    return enemySpriteDraw.nightbloom_matriarch.action;
  }

  if (monsterId === "moss_golem") {
    if (animation === "death") return mossGolemSpriteDraw.death;
    return animation === "idle" || animation === "rock_slam" || animation === "rock_spray" || animation === "rock_throw"
      ? mossGolemSpriteDraw.v2Action
      : mossGolemSpriteDraw.v2Standard;
  }

  if (monsterId === "shroom_boy") {
    if (animation === "rock_spray" || animation === "rock_slam") return enemySpriteDraw.shroom_boy.sprayAction;
    if (animation === "rock_throw") return enemySpriteDraw.shroom_boy.throwAction;
    if (animation === "bite") return enemySpriteDraw.shroom_boy.biteAction;
    return enemySpriteDraw.shroom_boy.standard;
  }

  return animation === "rock_slam" || animation === "rock_spray" || animation === "rock_throw" || animation === "bite"
    ? enemySpriteDraw[monsterId].action
    : enemySpriteDraw[monsterId].standard;
}

export const golemAudio = {
  rockSlamCrashVolume: 0.82,
  rockThrowVolume: 0.66,
  rockImpactVolume: 0.74,
  rockSprayVolume: 0.62,
} as const;

export const shroomAudio = {
  biteSnapVolume: 0.62,
  poisonSprayVolume: 0.58,
  sporeCloudVolume: 0.38,
  mouthTossVolume: 0.54,
  shroomlingChompVolume: 0.48,
} as const;

export const treeGoblinAudio = {
  armAttackVolume: 0.58,
  headThrowVolume: 0.62,
  headHitVolume: 0.54,
} as const;

export const nightbloomAudio = {
  thornVoiceVolume: 0.76,
  petalFanVoiceVolume: 0.76,
  rootSnareVoiceVolume: 0.8,
  novaVoiceVolume: 0.82,
  phaseVoiceVolume: 0.84,
} as const;

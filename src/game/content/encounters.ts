import { getEnemyDefinition, type EnemyDefinition } from "./enemies";
import type { MonsterId } from "../types";

export type EncounterTier = "pack" | "elite" | "boss";

export type EncounterDefinition = {
  id: string;
  name: string;
  tier: EncounterTier;
  enemyIds: MonsterId[];
  goldReward: number;
  shopOfferCount?: number;
  rerollCost?: number;
};

export const encounterPlan = [
  {
    id: "moss-golem-opening",
    name: "Opening Ring",
    tier: "pack",
    enemyIds: ["moss_golem"],
    goldReward: 11,
  },
  {
    id: "canopy-ambush",
    name: "Canopy Ambush",
    tier: "pack",
    enemyIds: ["tree_goblin"],
    goldReward: 14,
  },
  {
    id: "spore-crossing",
    name: "Spore Crossing",
    tier: "pack",
    enemyIds: ["shroom_boy", "moss_golem"],
    goldReward: 18,
  },
  {
    id: "nightbloom-elite",
    name: "Nightbloom Elite",
    tier: "elite",
    enemyIds: ["nightbloom_matriarch"],
    goldReward: 24,
  },
  {
    id: "market-unlock",
    name: "Market Unlock",
    tier: "pack",
    enemyIds: ["tree_goblin", "shroom_boy"],
    goldReward: 25,
    shopOfferCount: 4,
    rerollCost: 3,
  },
  {
    id: "obsidian-rite",
    name: "Obsidian Rite",
    tier: "elite",
    enemyIds: ["obsidian_reliquary"],
    goldReward: 31,
    shopOfferCount: 4,
    rerollCost: 3,
  },
  {
    id: "bell-and-bramble",
    name: "Bell and Bramble",
    tier: "elite",
    enemyIds: ["abyssal_bellwraith", "moss_golem"],
    goldReward: 36,
    shopOfferCount: 4,
    rerollCost: 4,
  },
  {
    id: "briarheart-boss",
    name: "Briarheart Boss",
    tier: "boss",
    enemyIds: ["briarheart_sovereign"],
    goldReward: 44,
    shopOfferCount: 5,
    rerollCost: 4,
  },
  {
    id: "woundclock-finale",
    name: "Woundclock Finale",
    tier: "boss",
    enemyIds: ["woundclock_arbiter"],
    goldReward: 52,
    shopOfferCount: 5,
    rerollCost: 5,
  },
] as const satisfies readonly EncounterDefinition[];

function encounterCycle(roomIndex: number) {
  return Math.max(0, Math.floor((Math.max(1, roomIndex) - 1) / encounterPlan.length));
}

export function encounterForRoom(roomIndex: number): EncounterDefinition {
  const safeRoomIndex = Math.max(1, Math.floor(roomIndex));
  const index = (safeRoomIndex - 1) % encounterPlan.length;
  return encounterPlan[index];
}

export function encounterEnemiesForRoom(roomIndex: number): EnemyDefinition[] {
  return encounterForRoom(roomIndex).enemyIds.map(getEnemyDefinition);
}

export function encounterGoldReward(roomIndex: number) {
  const encounter = encounterForRoom(roomIndex);
  return encounter.goldReward + encounterCycle(roomIndex) * 12;
}

export function encounterShopOfferCount(roomIndex: number) {
  const encounter = encounterForRoom(roomIndex);
  return Math.max(3, Math.min(5, encounter.shopOfferCount ?? 3 + Math.min(2, encounterCycle(roomIndex))));
}

export function encounterRerollCost(roomIndex: number) {
  const encounter = encounterForRoom(roomIndex);
  return encounter.rerollCost ?? 2 + Math.min(3, encounterCycle(roomIndex));
}

export function encounterLabel(roomIndex: number) {
  const encounter = encounterForRoom(roomIndex);
  const cycle = encounterCycle(roomIndex);
  return cycle > 0 ? `${encounter.name} +${cycle}` : encounter.name;
}

export type BattleType = "monster" | "pvp";

export const battleSlotsPerCycle = 3;
export const battleDurationSeconds = 60;
export const startingPlayerHealth = 50;

export function cycleIndexForBattle(battleIndex: number) {
  return Math.max(1, Math.floor((Math.max(1, Math.floor(battleIndex)) - 1) / battleSlotsPerCycle) + 1);
}

export function battleInCycleForBattle(battleIndex: number) {
  return ((Math.max(1, Math.floor(battleIndex)) - 1) % battleSlotsPerCycle) + 1;
}

export function battleTypeForBattle(battleIndex: number): BattleType {
  return battleInCycleForBattle(battleIndex) === battleSlotsPerCycle ? "pvp" : "monster";
}

export function playerDamageForCycle(cycleIndex: number) {
  return Math.min(24, 4 + Math.max(1, Math.floor(cycleIndex)) * 2);
}

export function overtimeDamageForElapsed(overtimeElapsed: number) {
  return Math.max(1, Math.floor(2 + Math.max(0, overtimeElapsed) * 0.45));
}

export function battleTypeLabel(type: BattleType) {
  return type === "pvp" ? "PvP Phase" : "Monster Phase";
}

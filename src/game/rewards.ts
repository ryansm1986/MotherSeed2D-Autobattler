import { addGearToInventory, gearDisplaySlot, generateGear } from "./combat/gear";
import { characterClasses } from "./content/classes";
import { encounterGearReward, encounterLabel } from "./content/encounters";
import { logEvent, type GameEvent, type GameState } from "./state";
import type { ClassId } from "./types";

function rewardClassId(state: GameState, roomIndex: number): ClassId {
  const party = state.party.members.filter((member) => characterClasses[member.classId]?.implemented);
  if (party.length === 0) return state.selectedClassId;
  return party[(Math.max(1, roomIndex) - 1) % party.length].classId;
}

export function grantEncounterGearReward(state: GameState): GameEvent[] {
  const roomIndex = Math.max(1, state.combat.roomIndex);
  const reward = encounterGearReward(roomIndex);
  if (reward.chance <= 0 || Math.random() > reward.chance) return [];

  const classId = rewardClassId(state, roomIndex);
  const gear = generateGear(classId, reward.rarity);
  const item = addGearToInventory(state, gear, classId);
  if (!item) {
    return [logEvent("Reward cache full", `${gear.name} could not fit in the backpack`)];
  }

  return [
    logEvent(
      `${gear.rarity} reward: ${gear.name}`,
      `${encounterLabel(roomIndex)} granted ${characterClasses[classId].name} ${gearDisplaySlot(gear.slot)}`,
    ),
  ];
}

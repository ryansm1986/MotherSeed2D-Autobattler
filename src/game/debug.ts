import { encounterEnemiesForRoom, encounterLabel, encounterPlan } from "./content/encounters";
import {
  beginBattleRound,
  createAutoAttackLoopState,
  ensureCombatRuntimeState,
  logEvent,
  type GameEvent,
  type GameState,
} from "./state";
import { world } from "./world/arena";
import { spawnRoomEnemy } from "./world/rooms";

export type DebugEncounterOption = {
  encounterIndex: number;
  roomIndex: number;
  label: string;
  detail: string;
};

export function debugEncounterOptions(): DebugEncounterOption[] {
  return encounterPlan.map((encounter, encounterIndex) => {
    const roomIndex = encounterIndex + 1;
    const names = encounterEnemiesForRoom(roomIndex).map((enemy) => enemy.name);
    return {
      encounterIndex,
      roomIndex,
      label: `Room ${roomIndex}: ${encounter.name}`,
      detail: `${encounter.tier.toUpperCase()} - ${names.join(" + ")} - ${encounter.goldReward}g`,
    };
  });
}

export function teleportToDebugEncounter(state: GameState, encounterIndex: number): GameEvent[] {
  ensureCombatRuntimeState(state);
  const maxEncounterIndex = encounterPlan.length - 1;
  const safeEncounterIndex = Math.max(0, Math.min(maxEncounterIndex, Math.floor(encounterIndex)));
  const roomIndex = safeEncounterIndex + 1;

  state.combat.roomIndex = roomIndex;
  state.combat.roomTransitionCooldown = 0.8;
  state.combat.targetLocked = true;
  state.combat.droppedGear = null;
  state.combat.droppedGearSourceLabel = null;
  state.combat.lootCorpseId = null;
  state.combat.hoveredLootCorpseId = null;
  state.combat.cooldowns = {};
  state.combat.autoLoop = createAutoAttackLoopState();
  state.player.lifeState = "alive";
  state.player.health = Math.max(1, state.player.health);
  state.player.x = world.playerSpawn.x;
  state.player.y = world.playerSpawn.y;
  state.player.facing = { x: 0, y: -1 };
  state.player.direction = "up";
  state.player.attackFlash = 0;
  state.player.specialFlash = 0;
  state.player.specialAnim = null;
  state.player.frontFlipSlashTime = 0;
  state.player.dodgeTime = 0;
  state.player.invulnerableTime = 0;
  spawnRoomEnemy(state);
  beginBattleRound(state);

  const encounterNames = [state.enemy, ...state.extraEnemies].map((enemy) => enemy.name).join(" and ");
  return [logEvent("Debug teleport", `${encounterLabel(roomIndex)}: ${encounterNames}`)];
}

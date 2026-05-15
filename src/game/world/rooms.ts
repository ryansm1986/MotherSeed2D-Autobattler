import { enemiesForRoom, type EnemyDefinition } from "../content/enemies";
import {
  beginBattleRound,
  createEnemyAttackCooldowns,
  createMotherLoadWindowState,
  ensureCombatRuntimeState,
  logEvent,
  type EnemyState,
  type GameEvent,
  type GameState,
} from "../state";
import { world } from "./arena";
import { isInStairZone } from "./collision";
import { canUseIntroStairs } from "./intro-room";

export function updateRoomTransition(state: GameState, delta: number, events: GameEvent[]) {
  state.combat.roomTransitionCooldown = Math.max(0, state.combat.roomTransitionCooldown - delta);
  if (state.round.phase === "battle" || state.round.phase === "victory" || state.round.phase === "defeat") return;
  if (state.combat.roomTransitionCooldown > 0 || !isInStairZone(state.player)) return;
  if (!canUseIntroStairs(state)) return;

  state.combat.roomIndex += 1;
  state.combat.roomTransitionCooldown = 1.2;
  state.combat.droppedGear = null;
  state.combat.droppedGearSourceLabel = null;
  state.combat.lootCorpseId = null;
  state.combat.hoveredLootCorpseId = null;
  state.combat.targetLocked = true;
  state.party.members.forEach((member, index) => {
    member.x = world.playerSpawn.x + index * 42;
    member.y = world.playerSpawn.y + index * 36;
    member.facing = { x: 0, y: -1 };
    member.direction = "up";
    member.attackFlash = 0;
    member.specialFlash = 0;
    member.specialAnim = null;
    member.frontFlipSlashTime = 0;
    member.aiMode = "follow";
  });
  spawnRoomEnemy(state);
  beginBattleRound(state);
  const encounterNames = [state.enemy, ...state.extraEnemies].map((enemy) => enemy.name).join(" and ");
  events.push(logEvent("Tree chamber shifted", `${encounterNames} step into the circle`));
}

export function spawnRoomEnemy(state: GameState) {
  ensureCombatRuntimeState(state);
  const encounterRoomIndex = Math.max(0, state.combat.roomIndex - 1);
  const encounter = enemiesForRoom(encounterRoomIndex);
  state.combat.lootCorpseId = null;
  state.combat.hoveredLootCorpseId = null;
  const spacing = encounter.length > 1 ? 180 : 0;
  resetEnemyState(state.enemy, encounter[0], state.combat.roomIndex, 0, -spacing * 0.5);
  state.extraEnemies = encounter.slice(1).map((enemy, index) =>
    createRoomEnemy(enemy, state.combat.roomIndex, index + 1, spacing * (index + 0.5)),
  );
  clearRoomProjectiles(state);
}

function createRoomEnemy(enemy: EnemyDefinition, roomIndex: number, enemyIndex: number, offsetX: number): EnemyState {
  return resetEnemyState({
    instanceId: "",
    monsterId: enemy.id,
    name: enemy.name,
    x: world.enemySpawn.x,
    y: world.enemySpawn.y,
    radius: enemy.radius,
    health: enemy.maxHealth,
    maxHealth: enemy.maxHealth,
    state: "idle",
    stateTimer: 1.1,
    attackIndex: 0,
    currentAttack: "rock_spray",
    attackForward: { x: 0, y: 1 },
    attackTarget: { x: world.playerSpawn.x, y: world.playerSpawn.y },
    attackCooldowns: createEnemyAttackCooldowns(),
    hasHitPlayer: false,
    rockSlamCrashPlayed: false,
    phaseBloomed: false,
    chainTag: "",
    chainTimer: 0,
    bleedTimer: 0,
    bleedTick: 0,
    flashTimer: 0,
    anim: "idle",
    direction: "down",
    animTimer: 0,
    animFrame: 0,
    visible: true,
  }, enemy, roomIndex, enemyIndex, offsetX);
}

function resetEnemyState(enemyState: EnemyState, enemy: EnemyDefinition, roomIndex: number, enemyIndex: number, offsetX: number): EnemyState {
  enemyState.instanceId = `room-${roomIndex}-enemy-${enemyIndex}`;
  enemyState.monsterId = enemy.id;
  enemyState.name = enemy.name;
  enemyState.maxHealth = enemy.maxHealth;
  enemyState.health = enemy.maxHealth;
  enemyState.radius = enemy.radius;
  enemyState.state = "idle";
  enemyState.stateTimer = 1.1 + enemyIndex * 0.24;
  enemyState.attackIndex = 0;
  enemyState.currentAttack = "rock_spray";
  enemyState.attackForward = { x: 0, y: 1 };
  enemyState.attackTarget = { x: world.playerSpawn.x, y: world.playerSpawn.y };
  enemyState.attackCooldowns = createEnemyAttackCooldowns();
  enemyState.hasHitPlayer = false;
  enemyState.rockSlamCrashPlayed = false;
  enemyState.phaseBloomed = false;
  enemyState.chainTag = "";
  enemyState.chainTimer = 0;
  enemyState.bleedTimer = 0;
  enemyState.bleedTick = 0;
  enemyState.flashTimer = 0;
  enemyState.anim = "idle";
  enemyState.direction = "down";
  enemyState.animTimer = 0;
  enemyState.animFrame = 0;
  enemyState.visible = true;
  enemyState.x = world.enemySpawn.x + offsetX + (Math.random() - 0.5) * 80;
  enemyState.y = world.enemySpawn.y + (Math.random() - 0.5) * 140;
  return enemyState;
}

export function clearRoomProjectiles(state: GameState) {
  ensureCombatRuntimeState(state);
  state.combat.pendingMagicMissileCast = null;
  state.combat.pendingMoonfallCast = null;
  state.combat.magicMissiles.length = 0;
  state.combat.moonfallStrikes.length = 0;
  state.combat.motherslashWaves.length = 0;
  state.combat.verdantExplosions.length = 0;
  state.combat.moonwellBeams.length = 0;
  state.combat.moonBurstEffects.length = 0;
  state.combat.clericHealEffects.length = 0;
  state.combat.rootbreakerShockwaves.length = 0;
  state.combat.thornwallCounters.length = 0;
  state.combat.motherloadBreakers.length = 0;
  state.combat.verdantGuillotines.length = 0;
  state.combat.enemyRockThrows.length = 0;
  state.combat.shroomSporeClouds.length = 0;
  state.combat.shroomlings.length = 0;
  state.combat.treeGoblinHeads.length = 0;
  state.combat.nightbloomThorns.length = 0;
  state.combat.nightbloomPetals.length = 0;
  state.combat.nightbloomRootBursts.length = 0;
  state.combat.nightbloomNovaWaves.length = 0;
  state.combat.nightbloomPetalImpacts.length = 0;
  state.combat.obsidianLances.length = 0;
  state.combat.obsidianShards.length = 0;
  state.combat.obsidianSmites.length = 0;
  state.combat.obsidianWheels.length = 0;
  state.combat.obsidianImpacts.length = 0;
  state.combat.abyssalBellShards.length = 0;
  state.combat.abyssalFanShards.length = 0;
  state.combat.abyssalGraveMarks.length = 0;
  state.combat.abyssalNovas.length = 0;
  state.combat.abyssalImpacts.length = 0;
  state.combat.briarheartSkewers.length = 0;
  state.combat.briarheartSeeds.length = 0;
  state.combat.briarheartVineEruptions.length = 0;
  state.combat.briarheartPollenNovas.length = 0;
  state.combat.briarheartImpacts.length = 0;
  state.combat.woundclockBolts.length = 0;
  state.combat.woundclockGearOrbs.length = 0;
  state.combat.woundclockSweeps.length = 0;
  state.combat.woundclockRifts.length = 0;
  state.combat.woundclockImpacts.length = 0;
  state.combat.motherLoadWindow = createMotherLoadWindowState();
  state.party.motherLoadWindow = createMotherLoadWindowState();
}

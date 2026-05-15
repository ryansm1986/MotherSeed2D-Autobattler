import { enemyAttackTimings, getEnemyDefinition } from "../../content/enemies";
import { abyssalBellwraithFight, type AbyssalAbilityId } from "../../content/monster-fights/abyssal-bellwraith.fight";
import { directionFromVector, length, lengthSq, normalize } from "../../math";
import { logEvent, type EnemyState, type GameEvent, type GameState } from "../../state";
import type { MonsterAnimationName, TelegraphKind } from "../../types";
import { clampToArena, resolveObstacleCollision } from "../../world/collision";
import {
  clearAbyssalBossEffects,
  spawnAbyssalBellShard,
  spawnAbyssalDirgeNova,
  spawnAbyssalGraveMarks,
  spawnAbyssalTollingFan,
} from "../projectiles";

export function updateAbyssalBellwraith(state: GameState, enemy: EnemyState, delta: number, events: GameEvent[]) {
  if (enemy.state === "dead" || !enemy.visible) return;

  if (state.player.lifeState !== "alive") {
    setAbyssalAnimation(enemy, "idle");
    return;
  }

  updateAbyssalCooldowns(enemy, delta);
  if (maybeBeginPhaseToll(state, enemy, events)) return;

  const toPlayer = { x: state.player.x - enemy.x, y: state.player.y - enemy.y };
  const distanceToPlayer = length(toPlayer);
  if (distanceToPlayer > 0.001) normalize(toPlayer);

  if (enemy.state === "idle") {
    if (distanceToPlayer > 0.001) enemy.direction = directionFromVector(toPlayer);

    const preferredDistance = abyssalBellwraithFight.preferredDistance;
    const enemyDefinition = getEnemyDefinition(enemy.monsterId);
    if (distanceToPlayer < preferredDistance - 104) {
      enemy.x -= toPlayer.x * enemyDefinition.moveSpeed * 0.72 * delta;
      enemy.y -= toPlayer.y * enemyDefinition.moveSpeed * 0.72 * delta;
      clampToArena(enemy);
      resolveObstacleCollision(enemy, enemy.radius, state.obstacles);
      setAbyssalAnimation(enemy, "walk");
    } else if (distanceToPlayer > preferredDistance + 126) {
      enemy.x += toPlayer.x * enemyDefinition.moveSpeed * delta;
      enemy.y += toPlayer.y * enemyDefinition.moveSpeed * delta;
      clampToArena(enemy);
      resolveObstacleCollision(enemy, enemy.radius, state.obstacles);
      setAbyssalAnimation(enemy, "walk");
    } else {
      setAbyssalAnimation(enemy, "idle");
    }

    enemy.stateTimer -= delta;
    if (enemy.stateTimer <= 0 && distanceToPlayer <= 800) {
      if (!beginAbyssalAttack(state, enemy, distanceToPlayer)) enemy.stateTimer = 0.16;
    }
    return;
  }

  enemy.stateTimer -= delta;
  setAbyssalAnimation(enemy, abyssalAnimationFor(enemy.currentAttack));

  if (enemy.state === "windup" && enemy.stateTimer <= 0) {
    enemy.state = "active";
    enemy.stateTimer = enemyAttackTimings[enemy.currentAttack].active;
    enemy.hasHitPlayer = false;
    resolveAbyssalAttack(state, enemy, events);
  } else if (enemy.state === "active") {
    if (enemy.stateTimer <= 0) {
      enemy.state = "recovery";
      enemy.stateTimer = enemyAttackTimings[enemy.currentAttack].recovery;
    }
  } else if (enemy.state === "recovery" && enemy.stateTimer <= 0) {
    enemy.state = "idle";
    enemy.stateTimer = enemy.phaseBloomed ? 0.58 : 0.78;
    setAbyssalAnimation(enemy, "idle");
  }
}

function maybeBeginPhaseToll(state: GameState, enemy: EnemyState, events: GameEvent[]) {
  if (enemy.phaseBloomed || enemy.health > enemy.maxHealth * abyssalBellwraithFight.phaseTwoHealthRatio) return false;

  enemy.phaseBloomed = true;
  enemy.currentAttack = "phase_toll";
  enemy.attackTarget = { x: enemy.x, y: enemy.y };
  enemy.attackForward = { x: 0, y: 1 };
  enemy.state = "windup";
  enemy.stateTimer = enemyAttackTimings.phase_toll.windup;
  enemy.hasHitPlayer = true;
  clearAbyssalBossEffects(state);
  setAbyssalAnimation(enemy, "phase_toll");
  events.push(logEvent("Abyssal toll", "The bell cracks and a second rhythm begins"));
  return true;
}

function beginAbyssalAttack(state: GameState, enemy: EnemyState, distanceToPlayer: number) {
  const attack = chooseAbyssalAttack(enemy, distanceToPlayer);
  if (!attack) return false;

  const toPlayer = { x: state.player.x - enemy.x, y: state.player.y - enemy.y };
  if (lengthSq(toPlayer) > 0.001) normalize(toPlayer);
  enemy.attackForward = lengthSq(toPlayer) > 0.001 ? toPlayer : { x: 0, y: 1 };
  enemy.attackTarget = { x: state.player.x, y: state.player.y };
  enemy.direction = directionFromVector(enemy.attackForward);
  enemy.currentAttack = attack;
  enemy.attackCooldowns[attack] = abyssalBellwraithFight.abilities[attack].cooldown;
  enemy.state = "windup";
  enemy.stateTimer = enemyAttackTimings[attack].windup;
  enemy.hasHitPlayer = false;
  setAbyssalAnimation(enemy, abyssalAnimationFor(attack));
  return true;
}

function chooseAbyssalAttack(enemy: EnemyState, distanceToPlayer: number): AbyssalAbilityId | null {
  if (distanceToPlayer <= abyssalBellwraithFight.abilities.dirge_nova.range.max && enemy.attackCooldowns.dirge_nova <= 0) {
    return "dirge_nova";
  }

  if (enemy.attackCooldowns.grave_mark <= 0 && (enemy.phaseBloomed || enemy.attackIndex % 3 === 2)) {
    enemy.attackIndex += 1;
    return "grave_mark";
  }

  if (enemy.attackCooldowns.tolling_fan <= 0 && (enemy.phaseBloomed || enemy.attackIndex % 2 === 1)) {
    enemy.attackIndex += 1;
    return "tolling_fan";
  }

  if (enemy.attackCooldowns.bell_shard <= 0) {
    enemy.attackIndex += 1;
    return "bell_shard";
  }

  if (enemy.attackCooldowns.grave_mark <= 0) {
    enemy.attackIndex += 1;
    return "grave_mark";
  }

  return null;
}

function resolveAbyssalAttack(state: GameState, enemy: EnemyState, events: GameEvent[]) {
  if (enemy.currentAttack === "bell_shard") {
    spawnAbyssalBellShard(state, enemy);
    events.push(logEvent("Bell shard", "A narrow ghost-flame shard locks onto your line"));
    return;
  }

  if (enemy.currentAttack === "tolling_fan") {
    spawnAbyssalTollingFan(state, enemy);
    events.push(logEvent("Tolling fan", "Bell fragments sweep out with deliberate gaps"));
    return;
  }

  if (enemy.currentAttack === "grave_mark") {
    spawnAbyssalGraveMarks(state, enemy);
    events.push(logEvent("Grave marks", "Spectral toll circles arm beneath you"));
    return;
  }

  if (enemy.currentAttack === "dirge_nova") {
    spawnAbyssalDirgeNova(state, enemy);
    events.push(logEvent("Dirge nova", "A hollow bell ring expands from the boss"));
  }
}

function updateAbyssalCooldowns(enemy: EnemyState, delta: number) {
  Object.keys(abyssalBellwraithFight.abilities).forEach((key) => {
    const attack = key as AbyssalAbilityId;
    enemy.attackCooldowns[attack] = Math.max(0, enemy.attackCooldowns[attack] - delta);
  });
}

function abyssalAnimationFor(attack: TelegraphKind): MonsterAnimationName {
  return abyssalBellwraithFight.abilities[attack as AbyssalAbilityId]?.animation ?? "cast";
}

function setAbyssalAnimation(enemy: EnemyState, nextAnim: MonsterAnimationName) {
  if (enemy.anim !== nextAnim) {
    enemy.anim = nextAnim;
    enemy.animFrame = 0;
    enemy.animTimer = 0;
  }
}

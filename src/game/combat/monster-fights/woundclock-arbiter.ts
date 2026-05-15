import { enemyAttackTimings, getEnemyDefinition } from "../../content/enemies";
import { woundclockArbiterFight, type WoundclockAbilityId } from "../../content/monster-fights/woundclock-arbiter.fight";
import { directionFromVector, length, lengthSq, normalize } from "../../math";
import { logEvent, type EnemyState, type GameEvent, type GameState } from "../../state";
import type { MonsterAnimationName, TelegraphKind } from "../../types";
import { clampToArena, resolveObstacleCollision } from "../../world/collision";
import {
  clearWoundclockBossEffects,
  spawnWoundclockChronoLance,
  spawnWoundclockClockhandSweep,
  spawnWoundclockGearOrbit,
  spawnWoundclockTimeRifts,
} from "../projectiles";

export function updateWoundclockArbiter(state: GameState, enemy: EnemyState, delta: number, events: GameEvent[]) {
  if (enemy.state === "dead" || !enemy.visible) return;

  if (state.player.lifeState !== "alive") {
    setWoundclockAnimation(enemy, "idle");
    return;
  }

  updateWoundclockCooldowns(enemy, delta);
  if (maybeBeginHourZero(state, enemy, events)) return;

  const toPlayer = { x: state.player.x - enemy.x, y: state.player.y - enemy.y };
  const distanceToPlayer = length(toPlayer);
  if (distanceToPlayer > 0.001) normalize(toPlayer);

  if (enemy.state === "idle") {
    if (distanceToPlayer > 0.001) enemy.direction = directionFromVector(toPlayer);

    const enemyDefinition = getEnemyDefinition(enemy.monsterId);
    const preferredDistance = woundclockArbiterFight.preferredDistance;
    const tangent = { x: -toPlayer.y, y: toPlayer.x };
    const phaseSpeed = enemy.phaseBloomed ? 1.1 : 0.84;
    const strafeSign = enemy.attackIndex % 2 === 0 ? 1 : -1;
    let moveX = tangent.x * strafeSign * 0.44;
    let moveY = tangent.y * strafeSign * 0.44;

    if (distanceToPlayer < preferredDistance - 110) {
      moveX -= toPlayer.x * 0.92;
      moveY -= toPlayer.y * 0.92;
    } else if (distanceToPlayer > preferredDistance + 132) {
      moveX += toPlayer.x;
      moveY += toPlayer.y;
    }

    const moveLength = Math.hypot(moveX, moveY);
    if (moveLength > 0.001) {
      enemy.x += (moveX / moveLength) * enemyDefinition.moveSpeed * phaseSpeed * delta;
      enemy.y += (moveY / moveLength) * enemyDefinition.moveSpeed * phaseSpeed * delta;
      clampToArena(enemy);
      resolveObstacleCollision(enemy, enemy.radius, state.obstacles);
      setWoundclockAnimation(enemy, "walk");
    } else {
      setWoundclockAnimation(enemy, "idle");
    }

    enemy.stateTimer -= delta;
    if (enemy.stateTimer <= 0 && distanceToPlayer <= 860) {
      if (!beginWoundclockAttack(state, enemy, distanceToPlayer)) enemy.stateTimer = 0.14;
    }
    return;
  }

  enemy.stateTimer -= delta;
  setWoundclockAnimation(enemy, woundclockAnimationFor(enemy.currentAttack));

  if (enemy.state === "windup" && enemy.stateTimer <= 0) {
    enemy.state = "active";
    enemy.stateTimer = enemyAttackTimings[enemy.currentAttack].active;
    enemy.hasHitPlayer = false;
    resolveWoundclockAttack(state, enemy, events);
  } else if (enemy.state === "active") {
    if (enemy.stateTimer <= 0) {
      enemy.state = "recovery";
      enemy.stateTimer = enemyAttackTimings[enemy.currentAttack].recovery;
    }
  } else if (enemy.state === "recovery" && enemy.stateTimer <= 0) {
    enemy.state = "idle";
    enemy.stateTimer = enemy.phaseBloomed ? 0.54 : 0.76;
    setWoundclockAnimation(enemy, "idle");
  }
}

function maybeBeginHourZero(state: GameState, enemy: EnemyState, events: GameEvent[]) {
  if (enemy.phaseBloomed || enemy.health > enemy.maxHealth * woundclockArbiterFight.phaseTwoHealthRatio) return false;

  enemy.phaseBloomed = true;
  enemy.currentAttack = "hour_zero";
  enemy.attackTarget = { x: enemy.x, y: enemy.y };
  enemy.attackForward = { x: 0, y: 1 };
  enemy.state = "windup";
  enemy.stateTimer = enemyAttackTimings.hour_zero.windup;
  enemy.hasHitPlayer = true;
  clearWoundclockBossEffects(state);
  setWoundclockAnimation(enemy, "phase_bloom");
  events.push(logEvent("Hour Zero", "The Arbiter fractures time and begins the second rhythm"));
  return true;
}

function beginWoundclockAttack(state: GameState, enemy: EnemyState, distanceToPlayer: number) {
  const attack = chooseWoundclockAttack(enemy, distanceToPlayer);
  if (!attack) return false;

  const toPlayer = { x: state.player.x - enemy.x, y: state.player.y - enemy.y };
  if (lengthSq(toPlayer) > 0.001) normalize(toPlayer);
  enemy.attackForward = lengthSq(toPlayer) > 0.001 ? toPlayer : { x: 0, y: 1 };
  enemy.attackTarget = { x: state.player.x, y: state.player.y };
  enemy.direction = directionFromVector(enemy.attackForward);
  enemy.currentAttack = attack;
  enemy.attackCooldowns[attack] = woundclockArbiterFight.abilities[attack].cooldown;
  enemy.state = "windup";
  enemy.stateTimer = enemyAttackTimings[attack].windup;
  enemy.hasHitPlayer = false;
  setWoundclockAnimation(enemy, woundclockAnimationFor(attack));
  return true;
}

function chooseWoundclockAttack(enemy: EnemyState, distanceToPlayer: number): WoundclockAbilityId | null {
  if (distanceToPlayer <= woundclockArbiterFight.abilities.clockhand_sweep.range.max && enemy.attackCooldowns.clockhand_sweep <= 0) {
    enemy.attackIndex += 1;
    return "clockhand_sweep";
  }

  if (enemy.attackCooldowns.time_rift <= 0 && (enemy.phaseBloomed || enemy.attackIndex % 4 === 2)) {
    enemy.attackIndex += 1;
    return "time_rift";
  }

  if (enemy.attackCooldowns.gear_orbit <= 0 && (enemy.phaseBloomed || enemy.attackIndex % 3 === 1)) {
    enemy.attackIndex += 1;
    return "gear_orbit";
  }

  if (enemy.attackCooldowns.chrono_lance <= 0) {
    enemy.attackIndex += 1;
    return "chrono_lance";
  }

  if (enemy.attackCooldowns.gear_orbit <= 0) {
    enemy.attackIndex += 1;
    return "gear_orbit";
  }

  return null;
}

function resolveWoundclockAttack(state: GameState, enemy: EnemyState, events: GameEvent[]) {
  if (enemy.currentAttack === "chrono_lance") {
    spawnWoundclockChronoLance(state, enemy);
    events.push(logEvent("Chrono lance", "A locked time bolt snaps across the arena"));
    return;
  }

  if (enemy.currentAttack === "gear_orbit") {
    spawnWoundclockGearOrbit(state, enemy);
    events.push(logEvent("Gear orbit", "Clock gears orbit before cutting loose"));
    return;
  }

  if (enemy.currentAttack === "clockhand_sweep") {
    spawnWoundclockClockhandSweep(state, enemy);
    events.push(logEvent("Clockhand sweep", "A clock hand rotates through the floor"));
    return;
  }

  if (enemy.currentAttack === "time_rift") {
    spawnWoundclockTimeRifts(state, enemy);
    events.push(logEvent("Time rift", "Delayed hourglass traps lock your last position"));
  }
}

function updateWoundclockCooldowns(enemy: EnemyState, delta: number) {
  Object.keys(woundclockArbiterFight.abilities).forEach((key) => {
    const attack = key as WoundclockAbilityId;
    enemy.attackCooldowns[attack] = Math.max(0, enemy.attackCooldowns[attack] - delta);
  });
}

function woundclockAnimationFor(attack: TelegraphKind): MonsterAnimationName {
  return woundclockArbiterFight.abilities[attack as WoundclockAbilityId]?.animation ?? "cast";
}

function setWoundclockAnimation(enemy: EnemyState, nextAnim: MonsterAnimationName) {
  if (enemy.anim !== nextAnim) {
    enemy.anim = nextAnim;
    enemy.animFrame = 0;
    enemy.animTimer = 0;
  }
}

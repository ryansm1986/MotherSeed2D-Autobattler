import { enemyAttackTimings, getEnemyDefinition } from "../../content/enemies";
import { nightbloomMatriarchFight, type NightbloomAbilityId } from "../../content/monster-fights/nightbloom-matriarch.fight";
import { directionFromVector, length, lengthSq, normalize } from "../../math";
import { logEvent, soundEvent, type EnemyState, type GameEvent, type GameState } from "../../state";
import type { MonsterAnimationName, TelegraphKind } from "../../types";
import { clampToArena, resolveObstacleCollision } from "../../world/collision";
import {
  clearNightbloomBossEffects,
  spawnNightbloomNova,
  spawnNightbloomPetalFan,
  spawnNightbloomRootSnare,
  spawnNightbloomThornLance,
} from "../projectiles";

export function updateNightbloomMatriarch(state: GameState, enemy: EnemyState, delta: number, events: GameEvent[]) {
  if (enemy.state === "dead" || !enemy.visible) return;

  if (state.player.lifeState !== "alive") {
    setNightbloomAnimation(enemy, "idle");
    return;
  }

  updateNightbloomCooldowns(enemy, delta);
  if (maybeBeginPhaseBloom(state, enemy, events)) return;

  const toPlayer = { x: state.player.x - enemy.x, y: state.player.y - enemy.y };
  const distanceToPlayer = length(toPlayer);
  if (distanceToPlayer > 0.001) normalize(toPlayer);

  if (enemy.state === "idle") {
    if (distanceToPlayer > 0.001) enemy.direction = directionFromVector(toPlayer);

    const preferredDistance = nightbloomMatriarchFight.preferredDistance;
    const enemyDefinition = getEnemyDefinition(enemy.monsterId);
    if (distanceToPlayer < preferredDistance - 90) {
      enemy.x -= toPlayer.x * enemyDefinition.moveSpeed * 0.72 * delta;
      enemy.y -= toPlayer.y * enemyDefinition.moveSpeed * 0.72 * delta;
      clampToArena(enemy);
      resolveObstacleCollision(enemy, enemy.radius, state.obstacles);
      setNightbloomAnimation(enemy, "walk");
    } else if (distanceToPlayer > preferredDistance + 105) {
      enemy.x += toPlayer.x * enemyDefinition.moveSpeed * delta;
      enemy.y += toPlayer.y * enemyDefinition.moveSpeed * delta;
      clampToArena(enemy);
      resolveObstacleCollision(enemy, enemy.radius, state.obstacles);
      setNightbloomAnimation(enemy, "walk");
    } else {
      setNightbloomAnimation(enemy, "idle");
    }

    enemy.stateTimer -= delta;
    if (enemy.stateTimer <= 0 && distanceToPlayer <= 760) {
      if (!beginNightbloomAttack(state, enemy, distanceToPlayer)) {
        enemy.stateTimer = 0.16;
      }
    }
    return;
  }

  enemy.stateTimer -= delta;
  setNightbloomAnimation(enemy, nightbloomAnimationFor(enemy.currentAttack));

  if (enemy.state === "windup" && enemy.stateTimer <= 0) {
    enemy.state = "active";
    enemy.stateTimer = enemyAttackTimings[enemy.currentAttack].active;
    enemy.hasHitPlayer = false;
    resolveNightbloomAttack(state, enemy, events);
  } else if (enemy.state === "active") {
    if (enemy.stateTimer <= 0) {
      enemy.state = "recovery";
      enemy.stateTimer = enemyAttackTimings[enemy.currentAttack].recovery;
    }
  } else if (enemy.state === "recovery" && enemy.stateTimer <= 0) {
    enemy.state = "idle";
    enemy.stateTimer = enemy.phaseBloomed ? 0.78 : 0.92;
    setNightbloomAnimation(enemy, "idle");
  }
}

export function isNightbloomAttack(attack: TelegraphKind) {
  return attack === "thorn_lance"
    || attack === "petal_fan"
    || attack === "root_snare"
    || attack === "nightbloom_nova"
    || attack === "phase_bloom";
}

function maybeBeginPhaseBloom(state: GameState, enemy: EnemyState, events: GameEvent[]) {
  if (enemy.phaseBloomed || enemy.health > enemy.maxHealth * nightbloomMatriarchFight.phaseTwoHealthRatio) return false;

  enemy.phaseBloomed = true;
  enemy.currentAttack = "phase_bloom";
  enemy.attackTarget = { x: enemy.x, y: enemy.y };
  enemy.attackForward = { x: 0, y: 1 };
  enemy.state = "windup";
  enemy.stateTimer = enemyAttackTimings.phase_bloom.windup;
  enemy.hasHitPlayer = true;
  clearNightbloomBossEffects(state);
  setNightbloomAnimation(enemy, "phase_bloom");
  events.push(soundEvent("nightbloomPhase"), soundEvent("nightbloomPhaseVoice"));
  events.push(logEvent("Nightbloom bloom", "The Matriarch flowers into a denser pattern"));
  return true;
}

function beginNightbloomAttack(state: GameState, enemy: EnemyState, distanceToPlayer: number) {
  const attack = chooseNightbloomAttack(enemy, distanceToPlayer);
  if (!attack) return false;

  const toPlayer = { x: state.player.x - enemy.x, y: state.player.y - enemy.y };
  if (lengthSq(toPlayer) > 0.001) normalize(toPlayer);
  enemy.attackForward = lengthSq(toPlayer) > 0.001 ? toPlayer : { x: 0, y: 1 };
  enemy.attackTarget = { x: state.player.x, y: state.player.y };
  enemy.direction = directionFromVector(enemy.attackForward);
  enemy.currentAttack = attack;
  enemy.attackCooldowns[attack] = nightbloomMatriarchFight.abilities[attack].cooldown;
  enemy.state = "windup";
  enemy.stateTimer = enemyAttackTimings[attack].windup;
  enemy.hasHitPlayer = false;
  setNightbloomAnimation(enemy, nightbloomAnimationFor(attack));
  return true;
}

function chooseNightbloomAttack(enemy: EnemyState, distanceToPlayer: number): NightbloomAbilityId | null {
  if (distanceToPlayer <= nightbloomMatriarchFight.abilities.nightbloom_nova.range.max && enemy.attackCooldowns.nightbloom_nova <= 0) {
    return "nightbloom_nova";
  }

  if (enemy.attackCooldowns.root_snare <= 0) return "root_snare";

  const nextFan = enemy.phaseBloomed || enemy.attackIndex % 3 === 1;
  if (nextFan && enemy.attackCooldowns.petal_fan <= 0) {
    enemy.attackIndex += 1;
    return "petal_fan";
  }

  if (enemy.attackCooldowns.thorn_lance <= 0) {
    enemy.attackIndex += 1;
    return "thorn_lance";
  }

  if (enemy.attackCooldowns.petal_fan <= 0) {
    enemy.attackIndex += 1;
    return "petal_fan";
  }

  return null;
}

function resolveNightbloomAttack(state: GameState, enemy: EnemyState, events: GameEvent[]) {
  if (enemy.currentAttack === "thorn_lance") {
    spawnNightbloomThornLance(state, enemy);
    events.push(soundEvent("nightbloomThorn"), soundEvent("nightbloomThornVoice"));
    return;
  }

  if (enemy.currentAttack === "petal_fan") {
    spawnNightbloomPetalFan(state, enemy);
    events.push(soundEvent("nightbloomCast"), soundEvent("nightbloomPetalFanVoice"));
    return;
  }

  if (enemy.currentAttack === "root_snare") {
    spawnNightbloomRootSnare(state, enemy);
    events.push(soundEvent("nightbloomRootBurst"), soundEvent("nightbloomRootSnareVoice"));
    return;
  }

  if (enemy.currentAttack === "nightbloom_nova") {
    spawnNightbloomNova(state, enemy);
    events.push(soundEvent("nightbloomNova"), soundEvent("nightbloomNovaVoice"));
  }
}

function updateNightbloomCooldowns(enemy: EnemyState, delta: number) {
  Object.keys(nightbloomMatriarchFight.abilities).forEach((key) => {
    const attack = key as NightbloomAbilityId;
    enemy.attackCooldowns[attack] = Math.max(0, enemy.attackCooldowns[attack] - delta);
  });
}

function nightbloomAnimationFor(attack: TelegraphKind): MonsterAnimationName {
  if (attack === "nightbloom_nova") return "nova";
  return nightbloomMatriarchFight.abilities[attack as NightbloomAbilityId]?.animation ?? "cast";
}

function setNightbloomAnimation(enemy: EnemyState, nextAnim: MonsterAnimationName) {
  if (enemy.anim !== nextAnim) {
    enemy.anim = nextAnim;
    enemy.animFrame = 0;
    enemy.animTimer = 0;
  }
}

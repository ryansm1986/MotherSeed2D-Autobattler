import { enemyAttackTimings, getEnemyDefinition } from "../../content/enemies";
import { briarheartSovereignFight, type BriarheartAbilityId } from "../../content/monster-fights/briarheart-sovereign.fight";
import { directionFromVector, length, lengthSq, normalize } from "../../math";
import { logEvent, type EnemyState, type GameEvent, type GameState } from "../../state";
import type { MonsterAnimationName, TelegraphKind } from "../../types";
import { clampToArena, resolveObstacleCollision } from "../../world/collision";
import {
  clearBriarheartBossEffects,
  spawnBriarheartPollenNova,
  spawnBriarheartSeedBarrage,
  spawnBriarheartSkewer,
  spawnBriarheartStranglerGrove,
} from "../projectiles";

export function updateBriarheartSovereign(state: GameState, enemy: EnemyState, delta: number, events: GameEvent[]) {
  if (enemy.state === "dead" || !enemy.visible) return;

  if (state.player.lifeState !== "alive") {
    setBriarheartAnimation(enemy, "idle");
    return;
  }

  updateBriarheartCooldowns(enemy, delta);
  if (maybeBeginSovereignBloom(state, enemy, events)) return;

  const toPlayer = { x: state.player.x - enemy.x, y: state.player.y - enemy.y };
  const distanceToPlayer = length(toPlayer);
  if (distanceToPlayer > 0.001) normalize(toPlayer);

  if (enemy.state === "idle") {
    if (distanceToPlayer > 0.001) enemy.direction = directionFromVector(toPlayer);

    const preferredDistance = briarheartSovereignFight.preferredDistance;
    const enemyDefinition = getEnemyDefinition(enemy.monsterId);
    if (distanceToPlayer < preferredDistance - 96) {
      enemy.x -= toPlayer.x * enemyDefinition.moveSpeed * 0.72 * delta;
      enemy.y -= toPlayer.y * enemyDefinition.moveSpeed * 0.72 * delta;
      clampToArena(enemy);
      resolveObstacleCollision(enemy, enemy.radius, state.obstacles);
      setBriarheartAnimation(enemy, "walk");
    } else if (distanceToPlayer > preferredDistance + 118) {
      enemy.x += toPlayer.x * enemyDefinition.moveSpeed * delta;
      enemy.y += toPlayer.y * enemyDefinition.moveSpeed * delta;
      clampToArena(enemy);
      resolveObstacleCollision(enemy, enemy.radius, state.obstacles);
      setBriarheartAnimation(enemy, "walk");
    } else {
      setBriarheartAnimation(enemy, "idle");
    }

    enemy.stateTimer -= delta;
    if (enemy.stateTimer <= 0 && distanceToPlayer <= 800) {
      if (!beginBriarheartAttack(state, enemy, distanceToPlayer)) enemy.stateTimer = 0.16;
    }
    return;
  }

  enemy.stateTimer -= delta;
  setBriarheartAnimation(enemy, briarheartAnimationFor(enemy.currentAttack));

  if (enemy.state === "windup" && enemy.stateTimer <= 0) {
    enemy.state = "active";
    enemy.stateTimer = enemyAttackTimings[enemy.currentAttack].active;
    enemy.hasHitPlayer = false;
    resolveBriarheartAttack(state, enemy, events);
  } else if (enemy.state === "active") {
    if (enemy.stateTimer <= 0) {
      enemy.state = "recovery";
      enemy.stateTimer = enemyAttackTimings[enemy.currentAttack].recovery;
    }
  } else if (enemy.state === "recovery" && enemy.stateTimer <= 0) {
    enemy.state = "idle";
    enemy.stateTimer = enemy.phaseBloomed ? 0.68 : 0.88;
    setBriarheartAnimation(enemy, "idle");
  }
}

function maybeBeginSovereignBloom(state: GameState, enemy: EnemyState, events: GameEvent[]) {
  if (enemy.phaseBloomed || enemy.health > enemy.maxHealth * briarheartSovereignFight.phaseTwoHealthRatio) return false;

  enemy.phaseBloomed = true;
  enemy.currentAttack = "sovereign_bloom";
  enemy.attackTarget = { x: enemy.x, y: enemy.y };
  enemy.attackForward = { x: 0, y: 1 };
  enemy.state = "windup";
  enemy.stateTimer = enemyAttackTimings.sovereign_bloom.windup;
  enemy.hasHitPlayer = true;
  clearBriarheartBossEffects(state);
  setBriarheartAnimation(enemy, "phase_bloom");
  events.push(logEvent("Sovereign bloom", "The Briarheart opens and the seed pattern thickens"));
  return true;
}

function beginBriarheartAttack(state: GameState, enemy: EnemyState, distanceToPlayer: number) {
  const attack = chooseBriarheartAttack(enemy, distanceToPlayer);
  if (!attack) return false;

  const toPlayer = { x: state.player.x - enemy.x, y: state.player.y - enemy.y };
  if (lengthSq(toPlayer) > 0.001) normalize(toPlayer);
  enemy.attackForward = lengthSq(toPlayer) > 0.001 ? toPlayer : { x: 0, y: 1 };
  enemy.attackTarget = { x: state.player.x, y: state.player.y };
  enemy.direction = directionFromVector(enemy.attackForward);
  enemy.currentAttack = attack;
  enemy.attackCooldowns[attack] = briarheartSovereignFight.abilities[attack].cooldown;
  enemy.state = "windup";
  enemy.stateTimer = enemyAttackTimings[attack].windup;
  enemy.hasHitPlayer = false;
  setBriarheartAnimation(enemy, briarheartAnimationFor(attack));
  return true;
}

function chooseBriarheartAttack(enemy: EnemyState, distanceToPlayer: number): BriarheartAbilityId | null {
  if (distanceToPlayer <= briarheartSovereignFight.abilities.pollen_nova.range.max && enemy.attackCooldowns.pollen_nova <= 0) {
    return "pollen_nova";
  }

  if (enemy.attackCooldowns.strangler_grove <= 0 && (enemy.phaseBloomed || enemy.attackIndex % 3 === 2)) {
    enemy.attackIndex += 1;
    return "strangler_grove";
  }

  if (enemy.attackCooldowns.seed_barrage <= 0 && (enemy.phaseBloomed || enemy.attackIndex % 2 === 1)) {
    enemy.attackIndex += 1;
    return "seed_barrage";
  }

  if (enemy.attackCooldowns.briar_skewer <= 0) {
    enemy.attackIndex += 1;
    return "briar_skewer";
  }

  if (enemy.attackCooldowns.strangler_grove <= 0) {
    enemy.attackIndex += 1;
    return "strangler_grove";
  }

  return null;
}

function resolveBriarheartAttack(state: GameState, enemy: EnemyState, events: GameEvent[]) {
  if (enemy.currentAttack === "briar_skewer") {
    spawnBriarheartSkewer(state, enemy);
    events.push(logEvent("Briar skewer", "The Sovereign locks a thorn line"));
    return;
  }

  if (enemy.currentAttack === "seed_barrage") {
    spawnBriarheartSeedBarrage(state, enemy);
    events.push(logEvent("Seed barrage", "Cursed seed pods fan across the arena"));
    return;
  }

  if (enemy.currentAttack === "strangler_grove") {
    spawnBriarheartStranglerGrove(state, enemy);
    events.push(logEvent("Strangler grove", "Vines mark the floor before erupting"));
    return;
  }

  if (enemy.currentAttack === "pollen_nova") {
    spawnBriarheartPollenNova(state, enemy);
    events.push(logEvent("Pollen nova", "A hollow pollen ring expands from the boss"));
  }
}

function updateBriarheartCooldowns(enemy: EnemyState, delta: number) {
  Object.keys(briarheartSovereignFight.abilities).forEach((key) => {
    const attack = key as BriarheartAbilityId;
    enemy.attackCooldowns[attack] = Math.max(0, enemy.attackCooldowns[attack] - delta);
  });
}

function briarheartAnimationFor(attack: TelegraphKind): MonsterAnimationName {
  return briarheartSovereignFight.abilities[attack as BriarheartAbilityId]?.animation ?? "cast";
}

function setBriarheartAnimation(enemy: EnemyState, nextAnim: MonsterAnimationName) {
  if (enemy.anim !== nextAnim) {
    enemy.anim = nextAnim;
    enemy.animFrame = 0;
    enemy.animTimer = 0;
  }
}

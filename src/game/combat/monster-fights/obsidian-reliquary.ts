import { enemyAttackTimings, getEnemyDefinition } from "../../content/enemies";
import { obsidianReliquaryFight, type ObsidianAbilityId } from "../../content/monster-fights/obsidian-reliquary.fight";
import { directionFromVector, length, lengthSq, normalize } from "../../math";
import { logEvent, type EnemyState, type GameEvent, type GameState } from "../../state";
import type { MonsterAnimationName, TelegraphKind } from "../../types";
import { clampToArena, resolveObstacleCollision } from "../../world/collision";
import {
  clearObsidianBossEffects,
  spawnObsidianGlassLance,
  spawnObsidianPenitentWheel,
  spawnObsidianReliquarySmite,
  spawnObsidianShardSpiral,
} from "../projectiles";

export function updateObsidianReliquary(state: GameState, enemy: EnemyState, delta: number, events: GameEvent[]) {
  if (enemy.state === "dead" || !enemy.visible) return;

  if (state.player.lifeState !== "alive") {
    setObsidianAnimation(enemy, "idle");
    return;
  }

  updateObsidianCooldowns(enemy, delta);
  if (maybeBeginPhaseRupture(state, enemy, events)) return;

  const toPlayer = { x: state.player.x - enemy.x, y: state.player.y - enemy.y };
  const distanceToPlayer = length(toPlayer);
  if (distanceToPlayer > 0.001) normalize(toPlayer);

  if (enemy.state === "idle") {
    if (distanceToPlayer > 0.001) enemy.direction = directionFromVector(toPlayer);

    const preferredDistance = obsidianReliquaryFight.preferredDistance;
    const enemyDefinition = getEnemyDefinition(enemy.monsterId);
    if (distanceToPlayer < preferredDistance - 92) {
      enemy.x -= toPlayer.x * enemyDefinition.moveSpeed * 0.68 * delta;
      enemy.y -= toPlayer.y * enemyDefinition.moveSpeed * 0.68 * delta;
      clampToArena(enemy);
      resolveObstacleCollision(enemy, enemy.radius, state.obstacles);
      setObsidianAnimation(enemy, "walk");
    } else if (distanceToPlayer > preferredDistance + 112) {
      enemy.x += toPlayer.x * enemyDefinition.moveSpeed * delta;
      enemy.y += toPlayer.y * enemyDefinition.moveSpeed * delta;
      clampToArena(enemy);
      resolveObstacleCollision(enemy, enemy.radius, state.obstacles);
      setObsidianAnimation(enemy, "walk");
    } else {
      setObsidianAnimation(enemy, "idle");
    }

    enemy.stateTimer -= delta;
    if (enemy.stateTimer <= 0 && distanceToPlayer <= 780) {
      if (!beginObsidianAttack(state, enemy, distanceToPlayer)) enemy.stateTimer = 0.16;
    }
    return;
  }

  enemy.stateTimer -= delta;
  setObsidianAnimation(enemy, obsidianAnimationFor(enemy.currentAttack));

  if (enemy.state === "windup" && enemy.stateTimer <= 0) {
    enemy.state = "active";
    enemy.stateTimer = enemyAttackTimings[enemy.currentAttack].active;
    enemy.hasHitPlayer = false;
    resolveObsidianAttack(state, enemy, events);
  } else if (enemy.state === "active") {
    if (enemy.stateTimer <= 0) {
      enemy.state = "recovery";
      enemy.stateTimer = enemyAttackTimings[enemy.currentAttack].recovery;
    }
  } else if (enemy.state === "recovery" && enemy.stateTimer <= 0) {
    enemy.state = "idle";
    enemy.stateTimer = enemy.phaseBloomed ? 0.68 : 0.86;
    setObsidianAnimation(enemy, "idle");
  }
}

function maybeBeginPhaseRupture(state: GameState, enemy: EnemyState, events: GameEvent[]) {
  if (enemy.phaseBloomed || enemy.health > enemy.maxHealth * obsidianReliquaryFight.phaseTwoHealthRatio) return false;

  enemy.phaseBloomed = true;
  enemy.currentAttack = "phase_rupture";
  enemy.attackTarget = { x: enemy.x, y: enemy.y };
  enemy.attackForward = { x: 0, y: 1 };
  enemy.state = "windup";
  enemy.stateTimer = enemyAttackTimings.phase_rupture.windup;
  enemy.hasHitPlayer = true;
  clearObsidianBossEffects(state);
  setObsidianAnimation(enemy, "phase_rupture");
  events.push(logEvent("Reliquary rupture", "The shrine splits open and the shard pattern tightens"));
  return true;
}

function beginObsidianAttack(state: GameState, enemy: EnemyState, distanceToPlayer: number) {
  const attack = chooseObsidianAttack(enemy, distanceToPlayer);
  if (!attack) return false;

  const toPlayer = { x: state.player.x - enemy.x, y: state.player.y - enemy.y };
  if (lengthSq(toPlayer) > 0.001) normalize(toPlayer);
  enemy.attackForward = lengthSq(toPlayer) > 0.001 ? toPlayer : { x: 0, y: 1 };
  enemy.attackTarget = { x: state.player.x, y: state.player.y };
  enemy.direction = directionFromVector(enemy.attackForward);
  enemy.currentAttack = attack;
  enemy.attackCooldowns[attack] = obsidianReliquaryFight.abilities[attack].cooldown;
  enemy.state = "windup";
  enemy.stateTimer = enemyAttackTimings[attack].windup;
  enemy.hasHitPlayer = false;
  setObsidianAnimation(enemy, obsidianAnimationFor(attack));
  return true;
}

function chooseObsidianAttack(enemy: EnemyState, distanceToPlayer: number): ObsidianAbilityId | null {
  if (distanceToPlayer <= obsidianReliquaryFight.abilities.penitent_wheel.range.max && enemy.attackCooldowns.penitent_wheel <= 0) {
    return "penitent_wheel";
  }

  if (enemy.attackCooldowns.reliquary_smite <= 0 && (enemy.phaseBloomed || enemy.attackIndex % 3 === 2)) {
    enemy.attackIndex += 1;
    return "reliquary_smite";
  }

  if (enemy.attackCooldowns.shard_spiral <= 0 && (enemy.phaseBloomed || enemy.attackIndex % 2 === 1)) {
    enemy.attackIndex += 1;
    return "shard_spiral";
  }

  if (enemy.attackCooldowns.glass_lance <= 0) {
    enemy.attackIndex += 1;
    return "glass_lance";
  }

  if (enemy.attackCooldowns.reliquary_smite <= 0) {
    enemy.attackIndex += 1;
    return "reliquary_smite";
  }

  return null;
}

function resolveObsidianAttack(state: GameState, enemy: EnemyState, events: GameEvent[]) {
  if (enemy.currentAttack === "glass_lance") {
    spawnObsidianGlassLance(state, enemy);
    events.push(logEvent("Glass lance", "The Reliquary locks a narrow line"));
    return;
  }

  if (enemy.currentAttack === "shard_spiral") {
    spawnObsidianShardSpiral(state, enemy);
    events.push(logEvent("Shard spiral", "Black glass fans across the room"));
    return;
  }

  if (enemy.currentAttack === "reliquary_smite") {
    spawnObsidianReliquarySmite(state, enemy);
    events.push(logEvent("Reliquary smite", "Ashen sigils bloom underfoot"));
    return;
  }

  if (enemy.currentAttack === "penitent_wheel") {
    spawnObsidianPenitentWheel(state, enemy);
    events.push(logEvent("Penitent wheel", "A hollow ring of glass expands from the boss"));
  }
}

function updateObsidianCooldowns(enemy: EnemyState, delta: number) {
  Object.keys(obsidianReliquaryFight.abilities).forEach((key) => {
    const attack = key as ObsidianAbilityId;
    enemy.attackCooldowns[attack] = Math.max(0, enemy.attackCooldowns[attack] - delta);
  });
}

function obsidianAnimationFor(attack: TelegraphKind): MonsterAnimationName {
  return obsidianReliquaryFight.abilities[attack as ObsidianAbilityId]?.animation ?? "cast";
}

function setObsidianAnimation(enemy: EnemyState, nextAnim: MonsterAnimationName) {
  if (enemy.anim !== nextAnim) {
    enemy.anim = nextAnim;
    enemy.animFrame = 0;
    enemy.animTimer = 0;
  }
}

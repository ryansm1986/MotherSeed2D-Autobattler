import { enemyAttackTimings, getEnemyDefinition } from "../content/enemies";
import { directionFromVector, distance, dot, length, lengthSq, normalize } from "../math";
import { allEnemies, livingPartyMembers, type EnemyState, logEvent, soundEvent, type GameEvent, type GameState } from "../state";
import type { MonsterAnimationName, TelegraphKind } from "../types";
import { clampToArena, resolveObstacleCollision } from "../world/collision";
import { dealPartyMemberDamage } from "./damage";
import { spawnEnemyRockThrow, spawnShroomlingToss, spawnShroomSporeCloud, spawnTreeGoblinHeadThrow } from "./projectiles";
import { updateNightbloomMatriarch } from "./monster-fights/nightbloom-matriarch";
import { updateObsidianReliquary } from "./monster-fights/obsidian-reliquary";
import { updateAbyssalBellwraith } from "./monster-fights/abyssal-bellwraith";
import { updateBriarheartSovereign } from "./monster-fights/briarheart-sovereign";
import { updateWoundclockArbiter } from "./monster-fights/woundclock-arbiter";

const closeAttackSequence: TelegraphKind[] = ["rock_spray", "rock_slam"];
const rockSprayRange = 260;
const shroomMeleeRange = 110;
const treeGoblinArmRange = 168;
const treeGoblinHeadThrowRange = 620;

export function updateEnemy(state: GameState, delta: number, events: GameEvent[]) {
  allEnemies(state).forEach((enemy) => updateOneEnemy(state, enemy, delta, events));
}

function updateOneEnemy(state: GameState, enemy: EnemyState, delta: number, events: GameEvent[]) {
  const { player } = state;
  if (enemy.state === "dead" || !enemy.visible) return;

  if (enemy.monsterId === "nightbloom_matriarch") {
    updateNightbloomMatriarch(state, enemy, delta, events);
    return;
  }
  if (enemy.monsterId === "obsidian_reliquary") {
    updateObsidianReliquary(state, enemy, delta, events);
    return;
  }
  if (enemy.monsterId === "abyssal_bellwraith") {
    updateAbyssalBellwraith(state, enemy, delta, events);
    return;
  }
  if (enemy.monsterId === "briarheart_sovereign") {
    updateBriarheartSovereign(state, enemy, delta, events);
    return;
  }
  if (enemy.monsterId === "woundclock_arbiter") {
    updateWoundclockArbiter(state, enemy, delta, events);
    return;
  }

  if (player.lifeState !== "alive") {
    setMonsterAnimation(enemy, "idle");
    return;
  }

  const toPlayer = { x: player.x - enemy.x, y: player.y - enemy.y };
  const distanceToPlayer = length(toPlayer);
  const enemyDefinition = getEnemyDefinition(enemy.monsterId);
  if (distanceToPlayer > 0.001) normalize(toPlayer);
  updateEnemyAttackCooldowns(enemy, delta);

  if (enemy.state === "idle") {
    if (distanceToPlayer > 0.001) enemy.direction = directionFromVector(toPlayer);

    const desiredDistance = enemy.monsterId === "tree_goblin" ? treeGoblinArmRange : shroomMeleeRange;
    if (distanceToPlayer > desiredDistance) {
      enemy.x += toPlayer.x * enemyDefinition.moveSpeed * delta;
      enemy.y += toPlayer.y * enemyDefinition.moveSpeed * delta;
      clampToArena(enemy);
      resolveObstacleCollision(enemy, enemy.radius, state.obstacles);
      setMonsterAnimation(enemy, "walk");
    } else {
      setMonsterAnimation(enemy, "idle");
    }

    enemy.stateTimer -= delta;
    const attackCheckRange = enemy.monsterId === "shroom_boy" || enemy.monsterId === "tree_goblin" ? treeGoblinHeadThrowRange : 420;
    if (enemy.stateTimer <= 0 && distanceToPlayer < attackCheckRange) {
      if (!beginEnemyAttack(state, enemy, distanceToPlayer)) {
        enemy.stateTimer = 0.18;
      }
    }
    return;
  }

  enemy.stateTimer -= delta;
  const holdHeadThrowAnimation = enemy.currentAttack === "head_throw" && enemy.state === "recovery";
  setMonsterAnimation(enemy, enemy.state === "windup" || enemy.state === "active" || holdHeadThrowAnimation ? getEnemyAttackAnimation(enemy) : "idle");

  if (enemy.state === "windup" && enemy.stateTimer <= 0) {
    enemy.state = "active";
    enemy.stateTimer = enemyAttackTimings[enemy.currentAttack].active;
    enemy.hasHitPlayer = false;
    pushEnemyAbilitySound(enemy, events);
    if (!isProjectileAttack(enemy.currentAttack)) {
      resolveEnemyHit(state, enemy, events);
    }
  } else if (enemy.state === "active") {
    resolveEnemyHit(state, enemy, events);
    if (isProjectileAttack(enemy.currentAttack) && enemy.hasHitPlayer) {
      enemy.state = "recovery";
      enemy.stateTimer = enemyAttackTimings[enemy.currentAttack].recovery;
      if (enemy.currentAttack !== "head_throw") setMonsterAnimation(enemy, "idle");
      return;
    }

    if (enemy.stateTimer <= 0) {
      enemy.state = "recovery";
      enemy.stateTimer = enemyAttackTimings[enemy.currentAttack].recovery;
    }
  } else if (enemy.state === "recovery" && enemy.stateTimer <= 0) {
    enemy.state = "idle";
    enemy.stateTimer = 1.25 + Math.random() * 0.45;
  }
}

export function getEnemyAttackAnimation(enemy: EnemyState): MonsterAnimationName {
  return getEnemyDefinition(enemy.monsterId).attackMap[enemy.currentAttack];
}

function beginEnemyAttack(state: GameState, enemy: EnemyState, distanceToPlayer: number) {
  const nextAttack = chooseEnemyAttack(enemy, distanceToPlayer);
  if (!nextAttack) return false;

  const toPlayer = { x: state.player.x - enemy.x, y: state.player.y - enemy.y };
  if (lengthSq(toPlayer) > 0.001) normalize(toPlayer);
  enemy.attackForward = toPlayer;
  enemy.attackTarget = { x: state.player.x, y: state.player.y };
  enemy.currentAttack = nextAttack;
  applyEnemyAttackCooldown(enemy, nextAttack);
  enemy.direction = directionFromVector(enemy.attackForward);
  enemy.state = "windup";
  enemy.stateTimer = enemyAttackTimings[enemy.currentAttack].windup;
  enemy.hasHitPlayer = false;
  enemy.rockSlamCrashPlayed = false;
  return true;
}

function chooseEnemyAttack(enemy: EnemyState, distanceToPlayer: number): TelegraphKind | null {
  if (enemy.monsterId === "shroom_boy") {
    if (enemy.attackCooldowns.spore_cloud <= 0) return "spore_cloud";
    if (distanceToPlayer <= shroomMeleeRange && enemy.attackCooldowns.bite <= 0) return "bite";
    if (distanceToPlayer > shroomMeleeRange && enemy.attackCooldowns.shroom_toss <= 0) return "shroom_toss";
    return null;
  }

  if (enemy.monsterId === "tree_goblin") {
    if (enemy.attackCooldowns.head_throw <= 0) return "head_throw";
    if (distanceToPlayer <= treeGoblinArmRange && enemy.attackCooldowns.arm_attack <= 0) return "arm_attack";
    return null;
  }

  if (distanceToPlayer > rockSprayRange) return "rock_throw";

  const nextAttack = closeAttackSequence[enemy.attackIndex % closeAttackSequence.length];
  enemy.attackIndex += 1;
  return nextAttack;
}

function applyEnemyAttackCooldown(enemy: EnemyState, attack: TelegraphKind) {
  if (enemy.monsterId === "shroom_boy") {
    if (attack === "spore_cloud") enemy.attackCooldowns.spore_cloud = 12;
    if (attack === "shroom_toss") enemy.attackCooldowns.shroom_toss = 6;
    if (attack === "bite") enemy.attackCooldowns.bite = 3;
  }

  if (enemy.monsterId === "tree_goblin") {
    if (attack === "head_throw") enemy.attackCooldowns.head_throw = 15;
    if (attack === "arm_attack") enemy.attackCooldowns.arm_attack = 2.6;
  }
}

function isProjectileAttack(attack: TelegraphKind) {
  return attack === "rock_throw" || attack === "spore_cloud" || attack === "shroom_toss" || attack === "head_throw";
}

function updateEnemyAttackCooldowns(enemy: EnemyState, delta: number) {
  Object.keys(enemy.attackCooldowns).forEach((key) => {
    const attack = key as TelegraphKind;
    enemy.attackCooldowns[attack] = Math.max(0, enemy.attackCooldowns[attack] - delta);
  });
}

function resolveEnemyHit(state: GameState, enemy: EnemyState, events: GameEvent[]) {
  if (enemy.hasHitPlayer) return;

  if (enemy.currentAttack === "rock_throw") {
    spawnEnemyRockThrow(state, enemy);
    enemy.hasHitPlayer = true;
    return;
  }

  if (enemy.currentAttack === "spore_cloud") {
    spawnShroomSporeCloud(state, enemy);
    enemy.hasHitPlayer = true;
    events.push(logEvent("Spore cloud", "The cloud drifts toward you"));
    return;
  }

  if (enemy.currentAttack === "shroom_toss") {
    spawnShroomlingToss(state, enemy);
    enemy.hasHitPlayer = true;
    events.push(logEvent("Shroom toss", "A little cap hits the floor running"));
    return;
  }

  if (enemy.currentAttack === "head_throw") {
    spawnTreeGoblinHeadThrow(state, enemy);
    enemy.hasHitPlayer = true;
    events.push(logEvent("Head throw", "The head whirls in widening circles"));
    return;
  }

  let damage = 0;
  const hitMembers = livingPartyMembers(state).filter((member) => {
    if (member.invulnerableTime > 0) return false;
    const distanceToPlayer = distance(member, enemy);

    if (enemy.currentAttack === "rock_slam") {
      damage = 24;
      return distanceToPlayer <= 155;
    } else if (enemy.currentAttack === "bite") {
      damage = 12;
      if (distanceToPlayer <= 96) {
        const toPlayer = { x: member.x - enemy.x, y: member.y - enemy.y };
        normalize(toPlayer);
        return dot(enemy.attackForward, toPlayer) > Math.cos(Math.PI * 0.28);
      }
    } else if (enemy.currentAttack === "arm_attack") {
      damage = 17;
      if (distanceToPlayer <= treeGoblinArmRange) {
        const toPlayer = { x: member.x - enemy.x, y: member.y - enemy.y };
        normalize(toPlayer);
        return dot(enemy.attackForward, toPlayer) > Math.cos(Math.PI * 0.36);
      }
    } else {
      damage = 18;
      if (distanceToPlayer <= 260) {
        const toPlayer = { x: member.x - enemy.x, y: member.y - enemy.y };
        normalize(toPlayer);
        return dot(enemy.attackForward, toPlayer) > Math.cos(Math.PI * 0.34);
      }
    }
    return false;
  });

  if (hitMembers.length > 0) {
    enemy.hasHitPlayer = true;
    hitMembers.forEach((member) => dealPartyMemberDamage(state, member, damage, "Hit", events));
  }
}

function pushEnemyAbilitySound(enemy: EnemyState, events: GameEvent[]) {
  if (enemy.monsterId === "moss_golem") {
    if (enemy.currentAttack === "rock_throw") events.push(soundEvent("mossGolemRockThrow"));
    if (enemy.currentAttack === "rock_spray") events.push(soundEvent("mossGolemRockSpray"));
    return;
  }

  if (enemy.monsterId === "tree_goblin") {
    if (enemy.currentAttack === "arm_attack") events.push(soundEvent("treeGoblinArmAttack"));
    if (enemy.currentAttack === "head_throw") events.push(soundEvent("treeGoblinHeadThrow"));
    return;
  }

  if (enemy.monsterId !== "shroom_boy") return;

  if (enemy.currentAttack === "bite") events.push(soundEvent("shroomBiteSnap"));
  if (enemy.currentAttack === "spore_cloud") events.push(soundEvent("shroomPoisonSpray"));
  if (enemy.currentAttack === "shroom_toss") events.push(soundEvent("shroomMouthToss"));
}

export function setMonsterAnimation(enemy: EnemyState, nextAnim: MonsterAnimationName) {
  if (enemy.anim !== nextAnim) {
    enemy.anim = nextAnim;
    enemy.animFrame = 0;
    enemy.animTimer = 0;
  }
}

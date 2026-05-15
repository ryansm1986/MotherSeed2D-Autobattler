import { updateAutoAttack } from "./abilities";
import { dealPartyMemberDamage } from "./damage";
import { directionFromVector, distance, lengthSq, normalize } from "../math";
import {
  activeLatticeSequence,
  livingEnemies,
  livingPartyMembers,
  logEvent,
  type GameEvent,
  type GameState,
  type PartyMemberState,
  withPartyMemberAliases,
} from "../state";
import type { AnimationName } from "../types";
import { clampToArena, resolveObstacleCollision } from "../world/collision";

const formationOffsets = [
  { x: -58, y: 72 },
  { x: 58, y: 82 },
  { x: 0, y: 132 },
];

export function updatePartyCompanions(state: GameState, delta: number, events: GameEvent[]) {
  const leader = state.player;
  const inCombat = livingEnemies(state).length > 0 && state.combat.targetLocked;
  state.party.members.forEach((member) => {
    if (member.id === leader.id) return;
    updatePartyMemberTimers(member, delta);
    if (member.lifeState !== "alive") {
      member.aiMode = "downed";
      return;
    }

    member.aiMode = inCombat ? "engage" : "follow";
    if (inCombat) {
      const movementAnim = updateCompanionCombatPosition(state, member, delta);
      withPartyMemberAliases(state, member.id, () => updateAutoAttack(state, delta, events));
      updateCompanionAnimation(member, movementAnim);
    } else {
      const movementAnim = updateCompanionFollow(state, leader, member, delta);
      updateCompanionAnimation(member, movementAnim);
    }
  });

  if (!inCombat) reviveDownedCompanions(state, events);
}

function updatePartyMemberTimers(member: PartyMemberState, delta: number) {
  member.dodgeTime = Math.max(0, member.dodgeTime - delta);
  member.dodgeAnimTime = Math.max(0, member.dodgeAnimTime - delta);
  member.invulnerableTime = Math.max(0, member.invulnerableTime - delta);
  member.attackFlash = Math.max(0, member.attackFlash - delta);
  member.specialFlash = Math.max(0, member.specialFlash - delta);
  if (member.specialFlash <= 0) member.specialAnim = null;
  member.frontFlipSlashTime = Math.max(0, member.frontFlipSlashTime - delta);
  member.autoTimer = Math.max(0, member.autoTimer - delta);
  member.stamina = Math.min(member.maxStamina, member.stamina + member.staminaRegen * delta);
}

function updateCompanionFollow(
  state: GameState,
  leader: PartyMemberState,
  member: PartyMemberState,
  delta: number,
): "idle" | "walk" | "sprint" {
  const offset = formationOffsets[Math.max(0, member.partyIndex - 1)] ?? formationOffsets[formationOffsets.length - 1];
  const target = { x: leader.x + offset.x, y: leader.y + offset.y };
  const toTarget = { x: target.x - member.x, y: target.y - member.y };
  const targetDistance = Math.hypot(toTarget.x, toTarget.y);

  if (targetDistance > 760) {
    member.x = target.x;
    member.y = target.y;
    return "idle";
  }

  if (targetDistance > 18) {
    normalize(toTarget);
    steerAwayFromParty(state, member, toTarget);
    const sprinting = targetDistance > 170;
    moveCompanion(state, member, toTarget, sprinting ? member.sprintSpeed : member.speed, delta);
    return sprinting ? "sprint" : "walk";
  }

  return "idle";
}

function updateCompanionCombatPosition(state: GameState, member: PartyMemberState, delta: number): "idle" | "walk" | "sprint" {
  const enemy = state.enemy;
  const attackRange = nextCompanionAttackRange(state, member);
  const desiredRange = companionDesiredCombatRange(member, attackRange);
  const toEnemy = { x: enemy.x - member.x, y: enemy.y - member.y };
  const enemyDistance = Math.max(1, Math.hypot(toEnemy.x, toEnemy.y));
  const steering = { x: 0, y: 0 };
  const enemyDirection = { x: toEnemy.x / enemyDistance, y: toEnemy.y / enemyDistance };

  if (enemyDistance > attackRange - 12) {
    steering.x += enemyDirection.x * 2.2;
    steering.y += enemyDirection.y * 2.2;
  } else if (enemyDistance > desiredRange + 44) {
    steering.x += enemyDirection.x;
    steering.y += enemyDirection.y;
  } else if (enemyDistance < desiredRange - 34) {
    steering.x -= enemyDirection.x;
    steering.y -= enemyDirection.y;
  }

  avoidEnemyTelegraph(state, member, steering);
  steerAwayFromParty(state, member, steering);

  if (lengthSq(steering) > 0.001) {
    normalize(steering);
    const closingFromFar = enemyDistance > attackRange + 120;
    moveCompanion(state, member, steering, closingFromFar ? member.sprintSpeed * 0.9 : member.speed * 0.92, delta);
  }

  if (enemyDistance > 0.001) {
    member.direction = directionFromVector(toEnemy);
    member.facing = { x: toEnemy.x / enemyDistance, y: toEnemy.y / enemyDistance };
  }

  return lengthSq(steering) > 0.001 ? (enemyDistance > attackRange + 120 ? "sprint" : "walk") : "idle";
}

function companionDesiredCombatRange(member: PartyMemberState, attackRange: number) {
  const fallbackRange = member.classId === "mage" || member.classId === "cleric" ? 430 : 132;
  const minimumRange = member.classId === "mage" || member.classId === "cleric" ? 180 : 96;
  return Math.max(minimumRange, Math.min(fallbackRange, attackRange - 56));
}

function nextCompanionAttackRange(state: GameState, member: PartyMemberState) {
  const sequence = activeLatticeSequence(state, member.id);
  const startIndex = Math.min(member.autoLoop.currentSlotIndex, sequence.length - 1);
  const orderedSlots = [
    ...sequence.slice(Math.max(0, startIndex)),
    ...sequence.slice(0, Math.max(0, startIndex)),
  ];
  const nextAttack = orderedSlots.find((ability) => ability && ability.kind !== "haste");
  if (nextAttack) return nextAttack.range;
  return member.classId === "mage" || member.classId === "cleric" ? 520 : 150;
}

function moveCompanion(state: GameState, member: PartyMemberState, direction: { x: number; y: number }, speed: number, delta: number) {
  member.x += direction.x * speed * delta;
  member.y += direction.y * speed * delta;
  member.direction = directionFromVector(direction);
  member.facing = { x: direction.x, y: direction.y };
  clampToArena(member);
  resolveObstacleCollision(member, member.radius, state.obstacles);
}

function updateCompanionAnimation(member: PartyMemberState, movementAnim: "idle" | "walk" | "sprint") {
  const nextAnim: AnimationName =
    member.frontFlipSlashTime > 0
      ? "front_flip_slash"
      : member.specialFlash > 0
      ? member.specialAnim ?? "attack2"
      : member.attackFlash > 0
        ? getCompanionAttackAnimation(member)
        : member.dodgeAnimTime > 0
          ? "dodge_roll"
          : movementAnim;
  setCompanionAnimation(member, nextAnim);
}

function getCompanionAttackAnimation(member: PartyMemberState): AnimationName {
  if (member.classId !== "warrior") return "attack1";
  return member.autoCount > 0 && member.autoCount % 2 === 0 ? "attack1_side_slash" : "attack1";
}

function setCompanionAnimation(member: PartyMemberState, nextAnim: AnimationName) {
  if (member.anim === nextAnim) return;
  member.anim = nextAnim;
  member.animFrame = 0;
  member.animTimer = 0;
}

function steerAwayFromParty(state: GameState, member: PartyMemberState, steering: { x: number; y: number }) {
  livingPartyMembers(state).forEach((other) => {
    if (other.id === member.id) return;
    const away = { x: member.x - other.x, y: member.y - other.y };
    const d2 = lengthSq(away);
    if (d2 <= 0.001 || d2 > 96 * 96) return;
    normalize(away);
    steering.x += away.x * 0.78;
    steering.y += away.y * 0.78;
  });
}

function avoidEnemyTelegraph(state: GameState, member: PartyMemberState, steering: { x: number; y: number }) {
  const enemy = state.enemy;
  if (enemy.state !== "windup" && enemy.state !== "active") return;
  const away = { x: member.x - enemy.attackTarget.x, y: member.y - enemy.attackTarget.y };
  const dangerRadius = enemy.currentAttack.includes("nova") ? 250 : 172;
  const d = Math.max(1, Math.hypot(away.x, away.y));
  if (d > dangerRadius) return;
  steering.x += (away.x / d) * 2.2;
  steering.y += (away.y / d) * 2.2;
}

export function reviveDownedCompanions(state: GameState, events: GameEvent[]) {
  if (livingEnemies(state).length > 0) return;
  const leader = state.player;
  state.party.members.forEach((member) => {
    if (member.lifeState !== "dead" || member.id === leader.id) return;
    member.lifeState = "alive";
    member.health = Math.max(1, Math.floor(member.maxHealth * 0.4));
    member.stamina = member.maxStamina;
    member.meter = Math.min(member.meter, Math.floor(member.maxMeter * 0.5));
    member.invulnerableTime = 1.2;
    member.x = leader.x + (member.partyIndex % 2 === 0 ? -56 : 56);
    member.y = leader.y + 78 + member.partyIndex * 18;
    member.aiMode = "follow";
    member.anim = "idle";
    events.push(logEvent(`${member.classId} regrows`, "A party member returns after the fight"));
  });
}

export function damageAllLivingPartyMembersInRadius(
  state: GameState,
  source: { x: number; y: number },
  radius: number,
  amount: number,
  label: string,
  events: GameEvent[],
) {
  livingPartyMembers(state).forEach((member) => {
    if (distance(source, member) > radius + member.radius) return;
    dealPartyMemberDamage(state, member, amount, label, events);
  });
}

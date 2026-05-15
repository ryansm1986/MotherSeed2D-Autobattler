import type { InputState } from "./input-actions";
import { type AnimationFrameLookup } from "../render/canvas2d/types";
import { enemyAttackTimings } from "./content/enemies";
import {
  allEnemies,
  completeBattleDefeat,
  completeBattleVictory,
  ensureCombatRuntimeState,
  enterShopPhase,
  livingEnemies,
  livingPartyMembers,
  logEvent,
  soundEvent,
  type EnemyState,
  type GameEvent,
  type GameState,
} from "./state";
import { dealPartyMemberDamage, dealSpecificEnemyDamage, respawnPlayer, updateBleed, updateFloatingCombatTexts } from "./combat/damage";
import { overtimeDamageForElapsed } from "./run-cycle";
import { updateEnemy } from "./combat/enemy-ai";
import { updateAutoAttack, updateCooldowns } from "./combat/abilities";
import { updatePartyCompanions } from "./combat/party-ai";
import { updatePlayer } from "./combat/player";
import { updateRoomTransition } from "./world/rooms";
import { updateIntroRoom } from "./world/intro-room";
import { rollShopInventory } from "./shop";
import { grantEncounterGearReward } from "./rewards";
import {
  updateMagicMissiles,
  updateEnemyRockThrows,
  updateMotherslashWaves,
  updateMoonfallStrikes,
  updateMoonBurstEffects,
  updateClericHealEffects,
  updateMoonwellBeams,
  updatePendingMagicMissileCast,
  updatePendingMoonfallCast,
  updateShroomlings,
  updateShroomSporeClouds,
  updateTreeGoblinHeads,
  updateVerdantExplosions,
  updateNightbloomProjectiles,
  clearNightbloomBossEffects,
  updateObsidianProjectiles,
  clearObsidianBossEffects,
  updateAbyssalProjectiles,
  clearAbyssalBossEffects,
  updateBriarheartProjectiles,
  clearBriarheartBossEffects,
  updateWoundclockProjectiles,
  clearWoundclockBossEffects,
  clearWarriorSkillEffects,
  updateWarriorSkillEffects,
} from "./combat/projectiles";

export function updateSimulation(
  state: GameState,
  inputState: InputState,
  delta: number,
  frameLookup?: AnimationFrameLookup,
): GameEvent[] {
  ensureCombatRuntimeState(state);
  const events: GameEvent[] = [];

  updateCooldowns(state, delta);
  updateFloatingCombatTexts(state, delta);
  updateIntroRoom(state, delta, frameLookup?.codgerFrameCount() ?? 1);
  if (state.round.phase === "battle") {
    updatePartyCompanions(state, delta, events, true);
  } else {
    updatePlayer(state, inputState, delta, events);
    updatePartyCompanions(state, delta, events);
  }
  updateRoomTransition(state, delta, events);
  updateCombat(state, delta, events, frameLookup);
  updateRoundPhase(state, delta, events);
  updateAnimations(state, delta, frameLookup, events);

  return events;
}

function updateRoundPhase(state: GameState, delta: number, events: GameEvent[]) {
  if (state.round.phase === "battle") {
    updateBattleClock(state, delta, events);
    if (livingEnemies(state).length === 0) {
      completeBattleVictory(state, events);
      if (state.round.battleType === "monster") events.push(...grantEncounterGearReward(state));
    } else if (livingPartyMembers(state).length === 0 || state.combat.playerRespawnTimer > 0) {
      completeBattleDefeat(state, events);
    }
    return;
  }

  if (state.round.phase !== "victory" && state.round.phase !== "defeat") return;
  state.round.phaseTimer = Math.max(0, state.round.phaseTimer - delta);
  if (state.round.phaseTimer <= 0) {
    enterShopPhase(state);
    events.push(...rollShopInventory(state));
  }
}

function updateBattleClock(state: GameState, delta: number, events: GameEvent[]) {
  state.round.battleElapsed += delta;
  if (state.round.battleElapsed < state.round.battleDuration) return;

  state.round.overtimeElapsed += delta;
  if (!state.round.overtimeAnnounced) {
    state.round.overtimeAnnounced = true;
    events.push(logEvent("OVERTIME", "All characters are taking ramping damage"));
  }

  state.round.overtimeTickTimer -= delta;
  if (state.round.overtimeTickTimer > 0) return;
  state.round.overtimeTickTimer = 1;

  const damage = overtimeDamageForElapsed(state.round.overtimeElapsed);
  livingEnemies(state).forEach((enemy) => {
    dealSpecificEnemyDamage(state, enemy, damage, "Overtime", events);
  });
  livingPartyMembers(state).forEach((member) => {
    const previousInvulnerableTime = member.invulnerableTime;
    member.invulnerableTime = 0;
    dealPartyMemberDamage(state, member, damage, "Overtime", events);
    member.invulnerableTime = Math.min(member.invulnerableTime, previousInvulnerableTime);
  });
}

function updateCombat(state: GameState, delta: number, events: GameEvent[], frameLookup?: AnimationFrameLookup) {
  if (state.player.lifeState === "dead") {
    state.combat.pendingMagicMissileCast = null;
    state.combat.pendingMoonfallCast = null;
    state.combat.motherslashWaves.length = 0;
    state.combat.verdantExplosions.length = 0;
    state.combat.moonwellBeams.length = 0;
    state.combat.moonBurstEffects.length = 0;
    state.combat.clericHealEffects.length = 0;
    clearWarriorSkillEffects(state);
    state.combat.enemyRockThrows.length = 0;
    state.combat.shroomSporeClouds.length = 0;
    state.combat.shroomlings.length = 0;
    state.combat.treeGoblinHeads.length = 0;
    clearNightbloomBossEffects(state);
    clearObsidianBossEffects(state);
    clearAbyssalBossEffects(state);
    clearBriarheartBossEffects(state);
    clearWoundclockBossEffects(state);
    state.combat.playerRespawnTimer -= delta;
    if (state.combat.playerRespawnTimer <= 0) respawnPlayer(state, events);
    return;
  }

  updateVerdantExplosions(state, delta, events);
  updateMoonwellBeams(state, delta, events);
  updateMotherslashWaves(state, delta, events);
  updateMoonBurstEffects(state, delta, events);
  updateClericHealEffects(state, delta);
  updateWarriorSkillEffects(state, delta, events);
  updateMoonfallStrikes(state, delta, events, frameLookup?.moonfallFrameCount() ?? 1);

  if (livingEnemies(state).length === 0) {
    return;
  }

  allEnemies(state).forEach((enemy) => {
    enemy.flashTimer = Math.max(0, enemy.flashTimer - delta);
  });
  updatePendingMagicMissileCast(state, delta);
  updateMagicMissiles(state, delta, events);
  updateEnemyRockThrows(state, delta, events);
  updateShroomSporeClouds(state, delta, events);
  updateShroomlings(state, delta, events);
  updateTreeGoblinHeads(state, delta, events);
  updateNightbloomProjectiles(state, delta, events);
  updateObsidianProjectiles(state, delta, events);
  updateAbyssalProjectiles(state, delta, events);
  updateBriarheartProjectiles(state, delta, events);
  updateWoundclockProjectiles(state, delta, events);
  updatePendingMoonfallCast(state, delta);

  allEnemies(state).forEach((enemy) => {
    if (enemy.chainTimer <= 0) return;
    enemy.chainTimer -= delta;
    if (enemy.chainTimer <= 0) enemy.chainTag = "";
  });

  updateBleed(state, delta, events);
  if (state.round.phase !== "battle") updateAutoAttack(state, delta, events);
  updateEnemy(state, delta, events);
}

function updateAnimations(state: GameState, delta: number, frameLookup: AnimationFrameLookup | undefined, events: GameEvent[]) {
  state.party.members.forEach((member) => updatePartyMemberAnimation(member, delta, frameLookup));
  allEnemies(state).forEach((enemy) => updateEnemyAnimation(enemy, delta, frameLookup, events));
}

function updatePartyMemberAnimation(member: GameState["player"], delta: number, frameLookup: AnimationFrameLookup | undefined) {
  member.animTimer += delta;
  const isWarrior = member.classId === "warrior";
  const isWarriorSkillAnim = member.anim === "rootbreaker_cleave"
    || member.anim === "thornwall_counter"
    || member.anim === "motherload_breaker"
    || member.anim === "verdant_guillotine";
  const playerRate =
    member.anim === "idle"
      ? 0.22
      : isWarriorSkillAnim
        ? 0.115
        : member.anim === "attack1" || member.anim === "attack1_side_slash" || member.anim === "front_flip_slash"
        ? isWarrior ? 0.16 : 0.24
        : member.anim === "attack2"
          ? isWarrior ? 0.2 : 0.26
          : member.anim === "dodge_roll"
            ? 0.125
            : member.anim === "sprint"
              ? 0.075
              : 0.105;
  const playerFrameCount = frameLookup?.playerFrameCount(member.classId, member.direction, member.anim) ?? 1;
  if (member.animTimer >= playerRate) {
    member.animTimer = 0;
    const oneShot = member.anim === "attack1"
      || member.anim === "attack1_side_slash"
      || member.anim === "front_flip_slash"
      || isWarriorSkillAnim
      || member.anim === "attack2"
      || member.anim === "dodge_roll";
    const nextFrame = member.animFrame + 1;
    member.animFrame = oneShot && nextFrame >= playerFrameCount ? playerFrameCount - 1 : nextFrame % playerFrameCount;
  }
}

function updateEnemyAnimation(enemy: EnemyState, delta: number, frameLookup: AnimationFrameLookup | undefined, events: GameEvent[]) {
  if (!enemy.visible) return;
  enemy.animTimer += delta;
  const enemyFrameCount = frameLookup?.monsterFrameCount(enemy.monsterId, enemy.direction, enemy.anim) ?? 1;
  const isAttackAnimation = enemy.anim === "rock_slam"
    || enemy.anim === "rock_spray"
    || enemy.anim === "rock_throw"
    || enemy.anim === "bite"
    || enemy.anim === "cast"
    || enemy.anim === "thorn_lance"
    || enemy.anim === "petal_fan"
    || enemy.anim === "root_snare"
    || enemy.anim === "nova"
    || enemy.anim === "phase_bloom"
    || enemy.anim === "phase_rupture"
    || enemy.anim === "phase_toll";
  const isOneShotAnimation = isAttackAnimation || enemy.anim === "death";
  if (syncTreeGoblinHeadThrowAnimation(enemy, enemyFrameCount)) return;
  if (syncGolemStrikeAnimation(enemy, enemyFrameCount)) {
    maybePlayRockSlamCrash(enemy, enemyFrameCount, events);
    return;
  }
  const attackDuration = enemy.state === "windup" || enemy.state === "active"
    ? enemy.stateTimer
    : 1;
  const enemyRate = enemy.anim === "rock_throw"
    ? 0.08
    : enemy.anim === "death"
      ? 0.13
    : isAttackAnimation
    ? Math.max(0.04, attackDuration / enemyFrameCount)
    : enemy.anim === "idle"
      ? 0.22
      : 0.13;
  if (enemy.animTimer >= enemyRate) {
    enemy.animTimer = 0;
    const nextFrame = enemy.animFrame + 1;
    enemy.animFrame = isOneShotAnimation && nextFrame >= enemyFrameCount ? enemyFrameCount - 1 : nextFrame % enemyFrameCount;
  }

  maybePlayRockSlamCrash(enemy, enemyFrameCount, events);
}

function syncTreeGoblinHeadThrowAnimation(enemy: EnemyState, enemyFrameCount: number) {
  if (enemy.monsterId !== "tree_goblin" || enemy.currentAttack !== "head_throw" || enemy.anim !== "rock_throw" || enemyFrameCount <= 1) {
    return false;
  }

  const holdFrame = Math.min(enemyFrameCount - 1, 4);

  if (enemy.state === "windup") {
    const windup = enemyAttackTimings.head_throw.windup;
    const progress = Math.min(1, Math.max(0, (windup - enemy.stateTimer) / windup));
    enemy.animFrame = Math.min(holdFrame, Math.floor(progress * (holdFrame + 1)));
    enemy.animTimer = 0;
    return true;
  }

  if (enemy.state === "active") {
    enemy.animFrame = holdFrame;
    enemy.animTimer = 0;
    return true;
  }

  if (enemy.state === "recovery") {
    const resumeDuration = 0.82;
    if (enemy.stateTimer > resumeDuration) {
      enemy.animFrame = holdFrame;
    } else {
      const progress = Math.min(1, Math.max(0, (resumeDuration - enemy.stateTimer) / resumeDuration));
      enemy.animFrame = Math.min(enemyFrameCount - 1, holdFrame + Math.floor(progress * (enemyFrameCount - holdFrame)));
    }
    enemy.animTimer = 0;
    return true;
  }

  return false;
}

function syncGolemStrikeAnimation(enemy: EnemyState, enemyFrameCount: number) {
  if ((enemy.anim !== "rock_slam" && enemy.anim !== "rock_spray") || enemyFrameCount <= 0) return false;

  if (enemy.state === "windup") {
    const windup = enemyAttackTimings[enemy.anim].windup;
    const progress = Math.min(1, Math.max(0, (windup - enemy.stateTimer) / windup));
    enemy.animFrame = Math.min(Math.max(0, enemyFrameCount - 2), Math.floor(progress * Math.max(1, enemyFrameCount - 1)));
    enemy.animTimer = 0;
    return true;
  }

  if (enemy.state === "active") {
    enemy.animFrame = Math.max(0, enemyFrameCount - 1);
    enemy.animTimer = 0;
    return true;
  }

  return false;
}

function maybePlayRockSlamCrash(enemy: EnemyState, enemyFrameCount: number, events: GameEvent[]) {
  if (
    enemy.anim === "rock_slam"
    && enemy.currentAttack === "rock_slam"
    && !enemy.rockSlamCrashPlayed
    && enemy.animFrame >= Math.max(0, enemyFrameCount - 1)
  ) {
    enemy.rockSlamCrashPlayed = true;
    events.push(soundEvent("golemRockSlamCrash"));
  }
}

import type { InputState } from "../input-actions";
import { directionFromVector, distance, lengthSq } from "../math";
import { livingEnemies, logEvent, promoteEnemy, type GameEvent, type GameState, type PartyMemberState } from "../state";
import type { AnimationName, Vec2 } from "../types";

export function updatePlayer(state: GameState, _inputState: InputState, delta: number, _events: GameEvent[]) {
  const { player } = state;
  if (player.lifeState === "dead") {
    player.dodgeTime = 0;
    player.dodgeAnimTime = 0;
    player.invulnerableTime = 0;
    player.attackFlash = 0;
    player.specialFlash = 0;
    player.specialAnim = null;
    player.frontFlipSlashTime = 0;
    setPlayerAnimation(state, "damage");
    return;
  }

  player.dodgeTime = Math.max(0, player.dodgeTime - delta);
  player.dodgeAnimTime = Math.max(0, player.dodgeAnimTime - delta);
  player.invulnerableTime = Math.max(0, player.invulnerableTime - delta);
  player.attackFlash = Math.max(0, player.attackFlash - delta);
  player.specialFlash = Math.max(0, player.specialFlash - delta);
  if (player.specialFlash <= 0) player.specialAnim = null;
  player.frontFlipSlashTime = Math.max(0, player.frontFlipSlashTime - delta);
  player.autoTimer = Math.max(0, player.autoTimer - delta);
  player.stamina = Math.min(player.maxStamina, player.stamina + player.staminaRegen * delta);
  updateTargetFacing(state);

  const nextAnim: AnimationName =
    player.frontFlipSlashTime > 0
      ? "front_flip_slash"
      : player.specialFlash > 0
      ? player.specialAnim ?? "attack2"
      : player.attackFlash > 0
        ? getAttackAnimation(state)
        : "idle";
  setPlayerAnimation(state, nextAnim);
}

function getAttackAnimation(state: GameState): AnimationName {
  if (state.player.classId !== "warrior") return "attack1";
  return state.player.autoCount > 0 && state.player.autoCount % 2 === 0
    ? "attack1_side_slash"
    : "attack1";
}

export function updateTargetFacing(state: GameState) {
  if (!state.combat.targetLocked) return;

  if (state.enemy.state === "dead" || !state.enemy.visible) {
    const nextTarget = nearestLivingEnemy(state);
    if (!nextTarget) return;
    promoteEnemy(state, nextTarget);
  }

  const toEnemy = { x: state.enemy.x - state.player.x, y: state.enemy.y - state.player.y };
  if (lengthSq(toEnemy) <= 0.001) return;
  state.player.direction = directionFromVector(toEnemy);
}

export function lockTarget(state: GameState): GameEvent[] {
  const nextTarget = nearestLivingEnemy(state);
  if (!nextTarget) return [];
  promoteEnemy(state, nextTarget);
  state.combat.targetLocked = true;
  return [logEvent("Target locked", state.enemy.name)];
}

export function clearTarget(state: GameState): GameEvent[] {
  if (!state.combat.targetLocked && !state.combat.pendingMagicMissileCast) return [];
  state.combat.targetLocked = false;
  state.combat.pendingMagicMissileCast = null;
  return [logEvent("Target cleared", "Autobattle targeting paused")];
}

export function isEnemyAtWorldPoint(state: GameState, point: Vec2) {
  const clickedEnemy = livingEnemies(state).find((enemy) => {
    const dx = (point.x - enemy.x) / 72;
    const dy = (point.y - (enemy.y + 12)) / 48;
    return dx * dx + dy * dy <= 1;
  });

  if (!clickedEnemy) return false;
  promoteEnemy(state, clickedEnemy);
  return true;
}

export function partyMemberAtWorldPoint(state: GameState, point: Vec2): PartyMemberState | null {
  return [...state.party.members].sort((a, b) => b.y - a.y).find((member) => {
    if (member.lifeState !== "alive") return false;
    const dx = (point.x - member.x) / 74;
    const dy = (point.y - (member.y - 42)) / 112;
    return dx * dx + dy * dy <= 1;
  }) ?? null;
}

export function setPlayerAnimation(state: GameState, nextAnim: AnimationName) {
  if (state.player.anim !== nextAnim) {
    state.player.anim = nextAnim;
    state.player.animFrame = 0;
    state.player.animTimer = 0;
  }
}

function nearestLivingEnemy(state: GameState) {
  return livingEnemies(state)
    .sort((a, b) => distance(state.player, a) - distance(state.player, b))[0] ?? null;
}

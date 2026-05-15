import { world } from "../world/arena";
import { generateGear } from "./gear";
import {
  allEnemies,
  createAutoAttackLoopState,
  createMotherLoadWindowState,
  ensureCombatRuntimeState,
  livingPartyMembers,
  livingEnemies,
  logEvent,
  promoteEnemy,
  setActivePartyMember,
  type EnemyState,
  type GameEvent,
  type GameState,
  type PartyMemberState,
} from "../state";

export function dealEnemyDamage(state: GameState, amount: number, source: string, events: GameEvent[]) {
  dealSpecificEnemyDamage(state, state.enemy, amount, source, events);
}

function dropGearOnEnemyCorpse(state: GameState, enemy: EnemyState, events: GameEvent[]) {
  if (state.combat.droppedGear) return;

  const droppedGear = generateGear(state.selectedClassId);
  state.combat.droppedGear = droppedGear;
  state.combat.droppedGearSourceLabel = null;
  state.combat.lootCorpseId = enemy.instanceId;
  state.combat.hoveredLootCorpseId = null;
  events.push(logEvent(`${droppedGear.rarity} drop: ${droppedGear.name}`, "Loot the fallen body or press E to open loot"));
}

export function dealSpecificEnemyDamage(state: GameState, enemy: EnemyState, amount: number, source: string, events: GameEvent[]) {
  if (enemy.state === "dead" || !enemy.visible) return;
  enemy.health = Math.max(0, enemy.health - amount);
  enemy.flashTimer = 0.12;
  spawnEnemyDamageText(state, enemy, amount);
  events.push(logEvent(`${source}: ${amount}`, enemy.chainTag ? `${enemy.name} chain: ${enemy.chainTag}` : enemy.name));

  if (enemy.health <= 0) {
    enemy.state = "dead";
    enemy.visible = true;
    enemy.anim = "death";
    enemy.direction = "down";
    enemy.animFrame = 0;
    enemy.animTimer = 0;
    enemy.flashTimer = 0;
    enemy.chainTag = "";
    enemy.chainTimer = 0;
    enemy.bleedTimer = 0;
    enemy.bleedTick = 0;
    state.combat.pendingMagicMissileCast = null;
    state.combat.pendingMoonfallCast = null;
    state.combat.magicMissiles.length = 0;

    dropGearOnEnemyCorpse(state, enemy, events);

    const remainingEnemies = livingEnemies(state);
    if (enemy === state.enemy && remainingEnemies.length > 0) {
      promoteEnemy(state, remainingEnemies[0]);
    }

    if (remainingEnemies.length === 0) {
      state.combat.motherLoadWindow = createMotherLoadWindowState();
      state.party.motherLoadWindow = createMotherLoadWindowState();
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
    }
  }
}

function spawnEnemyDamageText(state: GameState, enemy: EnemyState, amount: number) {
  const idNumber = state.combat.nextFloatingCombatTextId;
  state.combat.nextFloatingCombatTextId += 1;
  state.combat.floatingCombatTexts.push({
    id: `damage-${idNumber}`,
    kind: "enemyDamage",
    value: Math.round(amount),
    x: enemy.x,
    y: enemy.y - Math.max(58, enemy.radius * 2.1),
    timer: 0,
    duration: 0.9,
    driftX: idNumber % 2 === 0 ? 18 : -18,
  });

  if (state.combat.floatingCombatTexts.length > 18) {
    state.combat.floatingCombatTexts.splice(0, state.combat.floatingCombatTexts.length - 18);
  }
}

export function updateFloatingCombatTexts(state: GameState, delta: number) {
  state.combat.floatingCombatTexts.forEach((text) => {
    text.timer += delta;
  });
  state.combat.floatingCombatTexts = state.combat.floatingCombatTexts.filter((text) => text.timer < text.duration);
}

export function applyChain(state: GameState, tag: string, seconds: number) {
  applyEnemyChain(state.enemy, tag, seconds);
}

export function applyEnemyChain(enemy: EnemyState, tag: string, seconds: number) {
  enemy.chainTag = tag;
  enemy.chainTimer = seconds;
}

export function updateBleed(state: GameState, delta: number, events: GameEvent[]) {
  allEnemies(state).forEach((enemy) => {
    if (enemy.bleedTimer <= 0 || enemy.state === "dead") return;
    enemy.bleedTimer -= delta;
    enemy.bleedTick -= delta;
    if (enemy.bleedTick <= 0) {
      enemy.bleedTick = 1;
      dealSpecificEnemyDamage(state, enemy, 4, "Bleed", events);
    }
  });
}

export function defeatPlayer(state: GameState, events: GameEvent[]) {
  ensureCombatRuntimeState(state);
  if (state.player.lifeState === "dead") {
    const nextLiving = livingPartyMembers(state).find((member) => member.id !== state.player.id);
    if (nextLiving) {
      events.push(...setActivePartyMember(state, nextLiving.id));
      return;
    }
    if (state.combat.playerRespawnTimer > 0) return;
  } else {
    downPartyMember(state, state.player, events);
    const nextLiving = livingPartyMembers(state).find((member) => member.id !== state.player.id);
    if (nextLiving) {
      events.push(...setActivePartyMember(state, nextLiving.id));
      return;
    }
  }
  state.combat.pendingMagicMissileCast = null;
  state.combat.pendingMoonfallCast = null;
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
  state.combat.autoLoop = createAutoAttackLoopState();
  state.combat.motherLoadWindow = createMotherLoadWindowState();
  state.party.motherLoadWindow = createMotherLoadWindowState();
  state.combat.playerRespawnTimer = 3.2;
  events.push(logEvent("You fall", "Regrowing at the grove heart"));
}

export function dealPartyMemberDamage(
  state: GameState,
  member: PartyMemberState,
  amount: number,
  source: string,
  events: GameEvent[],
) {
  if (member.lifeState !== "alive" || member.invulnerableTime > 0) return;
  member.health = Math.max(0, member.health - amount);
  member.anim = "damage";
  events.push(logEvent(`${source}: ${amount}`, member.id === state.player.id ? "You were hit" : `${member.classId} was hit`));
  const wasDowned = member.health <= 0;
  if (wasDowned) downPartyMember(state, member, events);
  if (member.id === state.player.id && wasDowned) {
    const nextLiving = livingPartyMembers(state).find((candidate) => candidate.id !== member.id);
    if (nextLiving) events.push(...setActivePartyMember(state, nextLiving.id));
    else defeatPlayer(state, events);
  }
}

function downPartyMember(state: GameState, member: PartyMemberState, events: GameEvent[]) {
  if (member.lifeState === "dead") return;
  member.lifeState = "dead";
  member.health = 0;
  member.stamina = 0;
  member.meter = 0;
  member.dodgeTime = 0;
  member.invulnerableTime = 0;
  member.aiMode = "downed";
  member.anim = "damage";
  events.push(logEvent(`${member.classId} downed`, member.id === state.player.id ? "Control is shifting" : "They will regrow after combat"));
}

export function respawnPlayer(state: GameState, events: GameEvent[]) {
  ensureCombatRuntimeState(state);
  state.party.members.forEach((member, index) => {
    member.lifeState = "alive";
    member.x = world.playerSpawn.x + index * 42;
    member.y = world.playerSpawn.y + index * 36;
    member.health = member.maxHealth;
    member.stamina = member.maxStamina;
    member.meter = 0;
    member.dodgeTime = 0;
    member.dodgeAnimTime = 0;
    member.invulnerableTime = 1.2;
    member.direction = "down";
    member.facing = { x: 0, y: -1 };
    member.anim = "idle";
    member.animFrame = 0;
    member.animTimer = 0;
    member.aiMode = "follow";
  });
  state.party.activeMemberId = state.party.members[0].id;
  setActivePartyMember(state, state.party.activeMemberId);
  state.combat.pendingMagicMissileCast = null;
  state.combat.pendingMoonfallCast = null;
  state.combat.cooldowns = {};
  state.combat.autoLoop = createAutoAttackLoopState();
  state.combat.motherLoadWindow = createMotherLoadWindowState();
  state.party.motherLoadWindow = createMotherLoadWindowState();
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
  events.push(logEvent("Regrown", "Back in the fight"));
}

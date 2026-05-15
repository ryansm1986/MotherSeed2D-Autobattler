import {
  activeLatticeSequence,
  activeWeaponSpecials,
  branchLatticeFrame,
  createMotherLoadWindowState,
  getPartyMember,
  livingPartyMembers,
  logEvent,
  soundEvent,
  syncActiveMemberFromCombat,
  type GameEvent,
  type GameState,
  type PartyMemberId,
  withPartyMemberAliases,
} from "../state";
import { directionFromVector, distance, lengthSq } from "../math";
import type { SpecialAbility } from "../types";
import { applyChain, dealEnemyDamage } from "./damage";
import { scaleGearDamage } from "./gear";
import {
  magicMissileCastTiming,
  moonfallCastTiming,
  moonfallStrikeDuration,
  moonveilFlourishTiming,
  motherslashCastTiming,
  spawnMoonBurstEffect,
  spawnMoonwellBeam,
  spawnClericHealEffect,
  spawnMotherslashWaves,
  spawnMotherloadBreaker,
  spawnRootbreakerCleave,
  spawnThornwallCounter,
  spawnVerdantGuillotine,
  spawnVerdantExplosion,
} from "./projectiles";

const autoLoopRestartCooldown = 3;
const hasteMultiplier = 1.8;
const targetedSpecialTapWindow = 1.35;

type MotherLoadEffect = {
  damageBonus: number;
  meterRefund: number;
  invulnerableTime: number;
  chainTag: string | null;
  detail: string;
};

export function castSpecial(state: GameState, index: number): GameEvent[] {
  return castPartySpecial(state, state.party.activeMemberId, index);
}

export function castPartySpecial(state: GameState, memberId: PartyMemberId, index: number): GameEvent[] {
  return withPartyMemberAliases(state, memberId, () => castSpecialForActiveMember(state, index));
}

export function castPendingPartyTargetedSpecial(state: GameState, targetMemberId: PartyMemberId): GameEvent[] {
  const pending = state.party.pendingTargetedSpecial;
  if (!pending) return [];
  return withPartyMemberAliases(state, pending.casterMemberId, () =>
    castSpecialForActiveMember(state, pending.abilityIndex, targetMemberId),
  );
}

function castSpecialForActiveMember(state: GameState, index: number, targetMemberId: PartyMemberId | null = null): GameEvent[] {
  const events: GameEvent[] = [];
  const { player, enemy, combat } = state;
  if (player.lifeState !== "alive") return events;
  const ability = activeWeaponSpecials(state)[index];
  if (!ability) return events;
  const cooldown = combat.cooldowns[ability.id] ?? 0;
  if (ability.id === "mothers-healing") {
    return castMotherHealing(state, ability, index, targetMemberId);
  }
  if (enemy.state === "dead" || !enemy.visible) return events;
  const distanceToEnemy = distance(player, enemy);

  if (cooldown > 0 || player.meter < ability.cost) return events;
  state.party.pendingTargetedSpecial = null;
  if (distanceToEnemy > ability.range && ability.id !== "motherslash" && ability.id !== "motherspin" && ability.id !== "ward-pulse") {
    events.push(logEvent(`${ability.name} out of range`, ""));
    return events;
  }

  player.meter -= ability.cost;
  combat.cooldowns[ability.id] = ability.cooldown;
  player.specialFlash = 1.18;
  const motherLoad = consumeMotherLoadWindow(state, ability, events);
  const primesMotherLoad = hasMotherLoadTag(ability);
  if (motherLoad?.invulnerableTime) {
    player.invulnerableTime = Math.max(player.invulnerableTime, motherLoad.invulnerableTime);
  }

  if (ability.id === "moonfall") {
    player.specialFlash = moonfallCastTiming.specialFlash;
    events.push(soundEvent("moonfallVoice"), soundEvent("moonfallPortal"));
    const toEnemy = { x: enemy.x - player.x, y: enemy.y - player.y };
    if (lengthSq(toEnemy) > 0.001) player.direction = directionFromVector(toEnemy);
    combat.pendingMoonfallCast = {
      ownerMemberId: player.id,
      x: enemy.x,
      y: enemy.y,
      damage: scaleGearDamage(player, 48 + Math.ceil(combat.equippedGear.power * 0.75)) + (motherLoad?.damageBonus ?? 0),
      radius: 132,
      timer: moonfallCastTiming.releaseDelay,
    };
    events.push(logEvent("Moonfall called", "The spell gathers overhead"));
  }

  if (ability.id === "motherslash" || ability.id === "motherspin") {
    const toEnemy = { x: enemy.x - player.x, y: enemy.y - player.y };
    if (lengthSq(toEnemy) > 0.001) player.direction = directionFromVector(toEnemy);
    player.specialFlash = motherslashCastTiming.specialFlash;
    player.invulnerableTime = Math.max(player.invulnerableTime, 0.28, motherLoad?.invulnerableTime ?? 0);
    spawnMotherslashWaves(
      state,
      scaleGearDamage(player, 50 + Math.ceil(combat.equippedGear.power * 1.2)) + (motherLoad?.damageBonus ?? 0),
      ability.range,
      motherLoad?.chainTag ?? "Cyclone",
    );
    applyChain(state, motherLoad?.chainTag ?? "Cyclone", motherLoad ? 5.5 : 4.5);
    events.push(
      soundEvent("warriorByMothertree"),
      soundEvent("motherslashPulseWave"),
      logEvent(ability.name, motherLoad?.detail ?? "Cyclone waves pulse outward"),
    );
  }

  if (ability.id === "motherload-breaker") {
    const toEnemy = { x: enemy.x - player.x, y: enemy.y - player.y };
    if (lengthSq(toEnemy) > 0.001) player.direction = directionFromVector(toEnemy);
    player.specialAnim = "motherload_breaker";
    player.specialFlash = 0.94;
    const empowered = !!motherLoad;
    spawnMotherloadBreaker(
      state,
      scaleGearDamage(player, 38 + Math.ceil(combat.equippedGear.power * 1.05)) + (motherLoad?.damageBonus ?? 0) + (empowered ? 16 : 0),
      empowered,
    );
    events.push(
      soundEvent("motherloadBreakerCharge"),
      logEvent("Motherload Breaker", empowered ? "Mother Load detonates through the blade" : "Green-gold force gathers in the blade"),
    );
  }

  if (ability.id === "radiant-brand") {
    events.push(soundEvent("radiantBrand"));
    dealEnemyDamage(state, scaleGearDamage(player, 17 + combat.equippedGear.power) + (motherLoad?.damageBonus ?? 0), "Radiant Brand", events);
    applyChain(state, "Radiant", 8);
    events.push(logEvent("Radiant primer applied", "Judgment can detonate it"));
  }

  if (ability.id === "ward-pulse") {
    player.invulnerableTime = 0.5;
    player.health = Math.min(player.maxHealth, player.health + 18);
    events.push(soundEvent("wardPulse"), logEvent("Ward Pulse", "Recovered health and steadied your guard"));
    if (distanceToEnemy <= ability.range) {
      dealEnemyDamage(state, scaleGearDamage(player, 10 + combat.equippedGear.power), "Ward Pulse", events);
    }
  }

  if (ability.id === "judgment") {
    events.push(soundEvent("judgment"));
    let damage = scaleGearDamage(player, 25 + combat.equippedGear.power) + (motherLoad?.damageBonus ?? 0);
    if (enemy.chainTag === "Radiant") {
      damage += 24;
      player.health = Math.min(player.maxHealth, player.health + 12);
      applyChain(state, "Consecrated", 5);
      events.push(logEvent("Consecrated chain", "Radiant detonated by Judgment"));
    }
    dealEnemyDamage(state, damage, motherLoad ? "Judgment + Mother Load" : "Judgment", events);
  }

  if (motherLoad && !specialHandlesMotherLoad(ability.id)) {
    applyMotherLoadFallback(state, motherLoad, events);
  }
  if (primesMotherLoad) {
    openMotherLoadWindow(state, ability, events);
  }

  syncActiveMemberFromCombat(state);
  return events;
}

function castMotherHealing(
  state: GameState,
  ability: SpecialAbility,
  abilityIndex: number,
  targetMemberId: PartyMemberId | null,
): GameEvent[] {
  const events: GameEvent[] = [];
  const { player, combat } = state;
  const cooldown = combat.cooldowns[ability.id] ?? 0;
  if (cooldown > 0) return [logEvent("Mother's Healing recovering", `${cooldown.toFixed(1)}s remaining`)];
  if (player.meter < ability.cost) return [logEvent("Mother's Healing needs Bloom", `${ability.cost} Bloom required`)];

  if (!targetMemberId) {
    const pending = state.party.pendingTargetedSpecial;
    const isSecondTap = pending
      && pending.casterMemberId === player.id
      && pending.abilityId === ability.id
      && pending.abilityIndex === abilityIndex;
    if (!isSecondTap) {
      state.party.pendingTargetedSpecial = {
        casterMemberId: player.id,
        abilityIndex,
        abilityId: ability.id,
        timer: targetedSpecialTapWindow,
      };
      return [logEvent("Mother's Healing readied", "Click a party portrait or party member, or tap again for lowest-health ally")];
    }
    const lowestTarget = lowestHealthPartyMember(state);
    if (!lowestTarget) return [];
    targetMemberId = lowestTarget.id;
  }

  const target = getPartyMember(state, targetMemberId);
  if (!target || target.lifeState !== "alive") {
    state.party.pendingTargetedSpecial = null;
    return [logEvent("Mother's Healing failed", "No living party member selected")];
  }

  state.party.pendingTargetedSpecial = null;
  player.meter -= ability.cost;
  combat.cooldowns[ability.id] = ability.cooldown;
  consumeMotherLoadWindow(state, ability, events);
  player.specialAnim = "attack2";
  player.specialFlash = 1.08;
  const toTarget = { x: target.x - player.x, y: target.y - player.y };
  if (lengthSq(toTarget) > 0.001) player.direction = directionFromVector(toTarget);

  const healAmount = Math.min(target.maxHealth - target.health, 34 + Math.ceil(combat.equippedGear.power * 1.15));
  target.health = Math.min(target.maxHealth, target.health + healAmount);
  target.invulnerableTime = Math.max(target.invulnerableTime, 0.28);
  spawnClericHealEffect(state, target);
  events.push(
    soundEvent("wardPulse"),
    logEvent("Mother's Healing", healAmount > 0 ? `${target.classId} recovered ${healAmount} health` : `${target.classId} is already steady`),
  );

  syncActiveMemberFromCombat(state);
  return events;
}

function lowestHealthPartyMember(state: GameState) {
  return livingPartyMembers(state)
    .sort((left, right) => (left.health / left.maxHealth) - (right.health / right.maxHealth))[0] ?? null;
}

export function updateAutoAttack(state: GameState, delta: number, events: GameEvent[]) {
  const { player, enemy, combat } = state;
  if (player.lifeState !== "alive") return;
  if (!combat.targetLocked || enemy.health <= 0) return;
  if (enemy.state === "dead" || !enemy.visible) return;

  const loop = combat.autoLoop;
  loop.hasteTimer = Math.max(0, loop.hasteTimer - delta);
  loop.hasteMultiplier = loop.hasteTimer > 0 ? hasteMultiplier : 1;
  const adjustedDelta = delta * loop.hasteMultiplier;

  if (loop.restartTimer > 0) {
    loop.restartTimer = Math.max(0, loop.restartTimer - adjustedDelta);
    if (loop.restartTimer > 0) return;
    loop.currentSlotIndex = 0;
    loop.lastResolvedKind = null;
    state.party.motherLoadWindow = createMotherLoadWindowState();
  }

  if (loop.slotTimer > 0) {
    loop.slotTimer = Math.max(0, loop.slotTimer - adjustedDelta);
    if (loop.slotTimer > 0) return;
  }

  const sequence = activeLatticeSequence(state);
  const nextSlotIndex = nextFilledSlotIndex(sequence, loop.currentSlotIndex);
  if (nextSlotIndex < 0) {
    loop.currentSlotIndex = 0;
    loop.restartTimer = autoLoopRestartCooldown;
    loop.lastResolvedKind = null;
    return;
  }

  const ability = sequence[nextSlotIndex];
  if (!ability) return;
  if (ability.kind !== "haste" && distance(player, enemy) > ability.range) return;

  const didExecute = executeLatticeAbility(state, nextSlotIndex, events);
  if (!didExecute) return;

  const laterSlotIndex = nextFilledSlotIndex(sequence, nextSlotIndex + 1);
  if (laterSlotIndex < 0) {
    loop.currentSlotIndex = 0;
    loop.restartTimer = autoLoopRestartCooldown;
    loop.slotTimer = 0;
  } else {
    loop.currentSlotIndex = laterSlotIndex;
    loop.slotTimer = ability.baseCooldown;
  }
}

export function updateCooldowns(state: GameState, delta: number) {
  const pending = state.party.pendingTargetedSpecial;
  if (pending) {
    pending.timer -= delta;
    if (pending.timer <= 0) state.party.pendingTargetedSpecial = null;
  }

  state.party.members.forEach((member) => {
    activeWeaponSpecials(state, member.id).forEach((ability) => {
      member.cooldowns[ability.id] = Math.max(0, (member.cooldowns[ability.id] ?? 0) - delta);
    });
  });
}

function nextFilledSlotIndex<T>(slots: Array<T | null>, startIndex: number) {
  for (let index = startIndex; index < slots.length; index += 1) {
    if (slots[index]) return index;
  }
  return -1;
}

function executeLatticeAbility(state: GameState, slotIndex: number, events: GameEvent[]) {
  const ability = activeLatticeSequence(state)[slotIndex];
  if (!ability) return false;

  if (ability.kind === "haste") {
    state.combat.autoLoop.hasteTimer = ability.duration ?? 1;
    state.combat.autoLoop.hasteMultiplier = hasteMultiplier;
    state.combat.autoLoop.lastResolvedKind = ability.kind;
    events.push(logEvent("Lattice Haste", "Auto sequence quickened for 1 second"));
    return true;
  }

  if (ability.kind === "combo_attack" && state.combat.autoLoop.lastResolvedKind !== "basic_attack_1") {
    state.combat.autoLoop.lastResolvedKind = ability.kind;
    events.push(logEvent("Combo Attack skipped", "Needs Basic Attack 1 earlier in the sequence"));
    return true;
  }

  if (ability.kind === "rootbreaker_cleave") {
    const { player, enemy, combat } = state;
    const toEnemy = { x: enemy.x - player.x, y: enemy.y - player.y };
    if (lengthSq(toEnemy) > 0.001) player.direction = directionFromVector(toEnemy);
    player.attackFlash = 0;
    player.specialAnim = "rootbreaker_cleave";
    player.specialFlash = 0.84;
    spawnRootbreakerCleave(state, scaleGearDamage(player, 22 + Math.ceil(combat.equippedGear.power * 0.75)));
    events.push(
      soundEvent("rootbreakerCleaveSlam"),
      soundEvent("rootbreakerShockwaveTravel"),
      logEvent("Rootbreaker Cleave", "The lattice slams a root shockwave forward"),
    );
    state.combat.autoLoop.lastResolvedKind = ability.kind;
    return true;
  }

  if (ability.kind === "thornwall_counter") {
    const { player, enemy, combat } = state;
    const toEnemy = { x: enemy.x - player.x, y: enemy.y - player.y };
    if (lengthSq(toEnemy) > 0.001) player.direction = directionFromVector(toEnemy);
    player.attackFlash = 0;
    player.specialAnim = "thornwall_counter";
    player.specialFlash = 0.84;
    player.invulnerableTime = Math.max(player.invulnerableTime, 0.36);
    spawnThornwallCounter(state, scaleGearDamage(player, 18 + Math.ceil(combat.equippedGear.power * 0.65)));
    events.push(soundEvent("thornwallGuard"), logEvent("Thornwall Counter", "The lattice plants a thorn guard"));
    state.combat.autoLoop.lastResolvedKind = ability.kind;
    return true;
  }

  if (ability.kind === "moonveil_flourish") {
    const { player, enemy } = state;
    const toEnemy = { x: enemy.x - player.x, y: enemy.y - player.y };
    if (lengthSq(toEnemy) > 0.001) player.direction = directionFromVector(toEnemy);
    const damage = scaleGearDamage(player, Math.max(1, Math.round(basicWeaponDamage(state) * 1.55) + 6));
    player.specialFlash = moonveilFlourishTiming.specialFlash;
    player.invulnerableTime = Math.max(player.invulnerableTime, 0.18);
    spawnMoonBurstEffect(state, enemy, damage);
    events.push(logEvent("Moonveil Flourish", "Crescent moons burst under the target"));
    state.combat.autoLoop.lastResolvedKind = ability.kind;
    return true;
  }

  if (ability.kind === "verdant_guillotine") {
    const { player, enemy } = state;
    const toEnemy = { x: enemy.x - player.x, y: enemy.y - player.y };
    if (lengthSq(toEnemy) > 0.001) {
      player.direction = directionFromVector(toEnemy);
    }
    const damage = scaleGearDamage(player, Math.max(1, Math.round(basicWeaponDamage(state) * 1.65) + 8));
    player.specialAnim = "verdant_guillotine";
    player.specialFlash = 0.94;
    player.invulnerableTime = Math.max(player.invulnerableTime, 0.22);
    spawnVerdantGuillotine(state, enemy, damage);
    events.push(soundEvent("verdantGuillotineLeap"), logEvent("Verdant Guillotine", "The Warrior rises into an emerald execution drop"));
    state.combat.autoLoop.lastResolvedKind = ability.kind;
    return true;
  }

  const damage = ability.kind === "combo_attack"
    ? Math.max(1, Math.round(basicWeaponDamage(state) * 0.8))
    : ability.kind === "front_flip_slash"
      ? Math.max(1, Math.round(basicWeaponDamage(state) * 1.35) + 4)
      : basicWeaponDamage(state);
  const source = ability.kind === "combo_attack"
    ? "Combo Attack"
    : ability.kind === "front_flip_slash"
      ? ability.name
      : "Basic Attack 1";
  dealBasicWeaponAttack(state, scaleGearDamage(state.player, damage), source, slotIndex, events);
  if (ability.kind === "front_flip_slash") {
    state.player.attackFlash = 0;
    state.player.specialFlash = 0;
    state.player.frontFlipSlashTime = Math.max(state.player.frontFlipSlashTime, 0.92);
    state.player.invulnerableTime = Math.max(state.player.invulnerableTime, 0.18);
  }
  state.combat.autoLoop.lastResolvedKind = ability.kind;
  return true;
}

function basicWeaponDamage(state: GameState) {
  const isMage = state.player.classId === "mage";
  const base = isMage ? 10 + Math.ceil(state.combat.equippedGear.power * 0.6) : 8 + state.combat.equippedGear.power;
  return base + (state.player.autoCount % 3 === 2 ? 5 : 0);
}

function dealBasicWeaponAttack(state: GameState, damage: number, source: string, slotIndex: number, events: GameEvent[]) {
  const { player, enemy, combat } = state;
  player.autoCount += 1;

  if (player.classId === "mage") {
    player.attackFlash = magicMissileCastTiming.attackFlash;
    combat.pendingMagicMissileCast = {
      ownerMemberId: player.id,
      visual: "magicMissile",
      impactLabel: "Magic Missile",
      damage,
      timer: magicMissileCastTiming.releaseDelay,
    };
    events.push(soundEvent("magicMissileCast"));
    return;
  }

  const fireDamage = modifierForSlot(state, slotIndex)?.id === "mod:fire" ? 4 + Math.ceil(combat.equippedGear.power * 0.25) : 0;
  const totalDamage = damage + fireDamage;

  if (player.classId === "cleric") {
    player.attackFlash = magicMissileCastTiming.attackFlash;
    combat.pendingMagicMissileCast = {
      ownerMemberId: player.id,
      visual: "clericFireball",
      impactLabel: fireDamage > 0 ? `${source} + Fire` : "Cleric Fireball",
      chainTag: fireDamage > 0 ? "Fire" : undefined,
      chainDuration: fireDamage > 0 ? 3 : undefined,
      damage: totalDamage,
      timer: magicMissileCastTiming.releaseDelay,
    };
    events.push(soundEvent("radiantBrand"));
    if (fireDamage > 0) events.push(logEvent("Fire Modifier", `Next fireball carries +${fireDamage} fire`));
    return;
  }

  player.attackFlash = 0.82;
  events.push(soundEvent("warriorSwordSwish"));
  if (player.autoCount % 3 === 0) events.push(soundEvent("warriorHyah"));
  dealEnemyDamage(state, totalDamage, fireDamage > 0 ? `${source} + Fire` : source, events);
  if (fireDamage > 0) applyChain(state, "Fire", 3);
  if (source === "Basic Attack 1" && player.autoCount % 3 === 0 && combat.equippedGear.rarity !== "Common") {
    enemy.bleedTimer = 5;
    enemy.bleedTick = 1;
    applyChain(state, "Bleed", 5);
  }
  events.push(soundEvent("warriorSwordThump"));
  player.meter = Math.min(player.maxMeter, player.meter + 8);
}

function modifierForSlot(state: GameState, slotIndex: number) {
  const modifierId = state.combat.branchLattice.modifierSlotIds[slotIndex];
  if (!modifierId) return null;
  return branchLatticeFrame(state).modifierOptions.find((option) => option.id === modifierId) ?? null;
}

function hasMotherLoadTag(special: SpecialAbility) {
  return special.tags?.includes("MotherLoad") ?? false;
}

function specialHandlesMotherLoad(specialId: string) {
  return specialId === "motherslash"
    || specialId === "motherspin"
    || specialId === "motherload-breaker"
    || specialId === "moonfall"
    || specialId === "radiant-brand"
    || specialId === "judgment";
}

function openMotherLoadWindow(state: GameState, special: SpecialAbility, events: GameEvent[]) {
  state.party.motherLoadWindow = {
    isActive: true,
    sourceAbilityId: special.id,
    sourceAbilityName: special.name,
  };
  state.combat.motherLoadWindow = state.party.motherLoadWindow;
  if (canUseAnySpecial(state)) {
    if (state.player.classId === "mage") {
      events.push(soundEvent("mageMoonAwaits"));
    } else if (state.player.classId === "warrior") {
      events.push(soundEvent("warriorTimeForMotherload"));
    }
  }
  events.push(logEvent(`${special.name} Mother Load`, "Mother Load window opened"));
}

function canUseAnySpecial(state: GameState) {
  return activeWeaponSpecials(state).some((special) => {
    const cooldown = state.combat.cooldowns[special.id] ?? 0;
    const isRangeGated = special.id !== "motherslash" && special.id !== "motherspin" && special.id !== "ward-pulse" && special.id !== "mothers-healing";
    return (
      cooldown <= 0
      && state.player.meter >= special.cost
      && (!isRangeGated || distance(state.player, state.enemy) <= special.range)
    );
  });
}

function consumeMotherLoadWindow(state: GameState, special: SpecialAbility, events: GameEvent[]): MotherLoadEffect | null {
  const window = state.party.motherLoadWindow;
  if (!window.isActive) return null;

  const sourceName = window.sourceAbilityName ?? "Mother Load";
  state.party.motherLoadWindow = createMotherLoadWindowState();
  state.combat.motherLoadWindow = state.party.motherLoadWindow;
  if (!hasMotherLoadTag(special)) return null;

  const effect = motherLoadEffectForSpecial(state, special.id);
  if (special.id === "motherslash" || special.id === "motherspin" || special.id === "motherload-breaker") {
    spawnVerdantExplosion(state, motherLoadVisualDelayForSpecial(special.id));
  }
  if (special.id === "moonfall") {
    spawnMoonwellBeam(state, moonwellBeamDelayForMoonfall());
  }
  if (effect.meterRefund > 0) {
    state.player.meter = Math.min(state.player.maxMeter, state.player.meter + effect.meterRefund);
  }
  events.push(logEvent("Mother Load triggered", `${sourceName} empowers ${special.name}`));
  return effect;
}

function motherLoadVisualDelayForSpecial(specialId: string) {
  if (specialId === "motherslash" || specialId === "motherspin") return motherslashCastTiming.specialFlash + 0.08;
  if (specialId === "moonfall") return moonfallCastTiming.specialFlash + 0.08;
  return 0.6;
}

function moonwellBeamDelayForMoonfall() {
  return moonfallCastTiming.releaseDelay + moonfallStrikeDuration;
}

function motherLoadEffectForSpecial(state: GameState, specialId: string): MotherLoadEffect {
  const power = state.combat.equippedGear.power;
  if (specialId === "motherslash" || specialId === "motherspin") {
    return {
      damageBonus: 28 + Math.ceil(power * 0.8),
      meterRefund: 8,
      invulnerableTime: 0.42,
      chainTag: "Mother Load",
      detail: "Mother Load erupts through the cyclone waves",
    };
  }
  if (specialId === "moonfall") {
    return {
      damageBonus: 26 + Math.ceil(power * 0.7),
      meterRefund: 6,
      invulnerableTime: 0,
      chainTag: "Mother Load",
      detail: "Mother Load opens a moonwell beneath Moonfall",
    };
  }
  if (specialId === "radiant-brand") {
    return {
      damageBonus: 16 + Math.ceil(power * 0.55),
      meterRefund: 5,
      invulnerableTime: 0,
      chainTag: "Mother Load",
      detail: "Mother Load burns inside the radiant brand",
    };
  }
  if (specialId === "judgment") {
    return {
      damageBonus: 24 + Math.ceil(power * 0.65),
      meterRefund: 7,
      invulnerableTime: 0.18,
      chainTag: "Mother Load",
      detail: "Mother Load descends through Judgment",
    };
  }

  return {
    damageBonus: 12 + Math.ceil(power * 0.5),
    meterRefund: 5,
    invulnerableTime: 0,
    chainTag: "Mother Load",
    detail: "Mother Load adds bonus damage",
  };
}

function applyMotherLoadFallback(state: GameState, effect: MotherLoadEffect, events: GameEvent[]) {
  if (effect.chainTag) applyChain(state, effect.chainTag, 4);
  if (effect.damageBonus > 0) {
    dealEnemyDamage(state, effect.damageBonus, "Mother Load", events);
  }
  events.push(logEvent("Mother Load", effect.detail));
}

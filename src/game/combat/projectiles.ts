import { directionFromVector, distance, lengthSq, normalize } from "../math";
import { nightbloomMatriarchFight } from "../content/monster-fights/nightbloom-matriarch.fight";
import { obsidianReliquaryFight } from "../content/monster-fights/obsidian-reliquary.fight";
import { abyssalBellwraithFight } from "../content/monster-fights/abyssal-bellwraith.fight";
import { briarheartSovereignFight } from "../content/monster-fights/briarheart-sovereign.fight";
import { woundclockArbiterFight } from "../content/monster-fights/woundclock-arbiter.fight";
import { applyChain, applyEnemyChain, dealEnemyDamage, dealPartyMemberDamage, dealSpecificEnemyDamage } from "./damage";
import { allEnemies, getPartyMember, livingEnemies, logEvent, soundEvent, type EnemyState, type GameEvent, type GameState, type PartyMemberState } from "../state";
import type { CardinalDirectionName, Vec2 } from "../types";

export const magicMissileCastTiming = {
  releaseDelay: 0.28,
  attackFlash: 0.7,
} as const;

export const magicMissileLifetime = 1.4;
export const magicMissileAnimationRate = 0.075;
export const magicMissileForwardRotation = Math.PI;
const magicMissileHitRadius = 18;
const magicMissileTargetYOffset = -28;
export const enemyRockThrowAnimationRate = 0.08;
export const shroomlingAnimationRate = 0.095;
export const treeGoblinHeadAnimationRate = 0.1;
export const nightbloomProjectileAnimationRate = 0.075;
export const nightbloomRootBurstAnimationRate = 0.095;
export const nightbloomNovaAnimationRate = 0.09;
export const nightbloomPetalImpactAnimationRate = 0.075;
export const obsidianProjectileAnimationRate = 0.075;
export const obsidianSmiteAnimationRate = 0.095;
export const obsidianWheelAnimationRate = 0.09;
export const obsidianImpactAnimationRate = 0.075;
export const abyssalProjectileAnimationRate = 0.075;
export const abyssalImpactAnimationRate = 0.085;
export const abyssalNovaAnimationRate = 0.09;
export const briarheartProjectileAnimationRate = 0.075;
export const briarheartVineAnimationRate = 0.095;
export const briarheartNovaAnimationRate = 0.09;
export const briarheartImpactAnimationRate = 0.075;
export const woundclockProjectileAnimationRate = 0.07;
export const woundclockTrapAnimationRate = 0.085;
export const woundclockImpactAnimationRate = 0.075;
export const moonfallCastTiming = {
  releaseDelay: 0.62,
  specialFlash: 1.08,
} as const;
export const moonfallStrikeDuration = 1.64;
export const moonfallImpactDuration = 0.68;
export const moonfallFrameScale = 0.864;
export const motherslashCastTiming = {
  specialFlash: 1.6,
} as const;
export const motherslashWaveAnimationRate = 0.085;
export const motherslashWaveHitBand = 30;
export const verdantExplosionAnimationRate = 0.08;
export const verdantExplosionDuration = 0.78;
export const moonwellBeamAnimationRate = 0.095;
export const moonwellBeamDuration = 0.9;
export const moonwellBeamFrameScale = 0.68;
export const moonveilFlourishTiming = {
  specialFlash: 1.08,
} as const;
export const moonBurstAnimationRate = 0.075;
export const moonBurstDuration = 0.78;
export const moonBurstFrameScale = 0.78;
export const clericHealAnimationRate = 0.085;
export const clericHealEffectDuration = 0.72;
export const clericHealFrameScale = 0.56;
export const warriorSkillAnimationRate = 0.095;
export const rootbreakerShockwaveDuration = 0.58;
export const thornwallCounterDuration = 0.62;
export const motherloadBreakerDuration = 0.74;
export const verdantGuillotineDuration = 0.72;
const shroomSporeCloudSpeed = 62;
const shroomlingCrawlSpeed = 185;
const shroomlingChaseChompInterval = 0.58;
const treeGoblinHeadDuration = 5.4;
const treeGoblinHeadReturnStart = 4.35;

export function motherslashWaveRadius(wave: { timer: number; duration: number; maxRadius: number }) {
  const progress = Math.min(Math.max(wave.timer / wave.duration, 0), 1);
  const eased = progress * progress * (3 - 2 * progress);
  return wave.maxRadius * eased;
}

export function updatePendingMagicMissileCast(state: GameState, delta: number) {
  const pendingCast = state.combat.pendingMagicMissileCast;
  if (!pendingCast) return;
  pendingCast.timer -= delta;

  if (pendingCast.timer > 0) return;

  const { chainDuration, chainTag, damage, impactLabel, visual } = pendingCast;
  state.combat.pendingMagicMissileCast = null;
  const owner = getPartyMember(state, pendingCast.ownerMemberId) ?? state.player;
  if (!state.combat.targetLocked || owner.lifeState !== "alive" || state.enemy.health <= 0 || state.enemy.state === "dead") return;
  spawnMagicMissile(state, damage, owner, visual, impactLabel, chainTag, chainDuration);
}

function firstPartyMemberHit(state: GameState, source: Vec2, radius: number) {
  return state.party.members.find((member) =>
    member.lifeState === "alive"
    && member.invulnerableTime <= 0
    && distance(source, member) <= member.radius + radius,
  ) ?? null;
}

function firstPartyMemberInRadiusBand(state: GameState, source: Vec2, minRadius: number, radius: number) {
  return state.party.members.find((member) => {
    if (member.lifeState !== "alive" || member.invulnerableTime > 0) return false;
    const memberDistance = distance(source, member);
    return memberDistance >= minRadius - member.radius && memberDistance <= radius + member.radius;
  }) ?? null;
}

function firstPartyMemberOnRing(state: GameState, source: Vec2, radius: number, band: number) {
  return state.party.members.find((member) =>
    member.lifeState === "alive"
    && member.invulnerableTime <= 0
    && Math.abs(distance(source, member) - radius) <= member.radius + band,
  ) ?? null;
}

function hitPartyMemberWithCircle(
  state: GameState,
  source: Vec2,
  radius: number,
  damage: number,
  label: string,
  events: GameEvent[],
) {
  const hitMember = firstPartyMemberHit(state, source, radius);
  if (!hitMember) return false;
  dealPartyMemberDamage(state, hitMember, damage, label, events);
  return true;
}

export function spawnMagicMissile(
  state: GameState,
  damage: number,
  owner: PartyMemberState = state.player,
  visual: "magicMissile" | "clericFireball" = "magicMissile",
  impactLabel = "Magic Missile",
  chainTag?: string,
  chainDuration?: number,
) {
  const castDirection = { x: state.enemy.x - owner.x, y: state.enemy.y - owner.y };
  if (lengthSq(castDirection) > 0.001) {
    normalize(castDirection);
  } else {
    castDirection.x = owner.facing.x;
    castDirection.y = owner.facing.y;
  }
  const castOffset = {
    x: castDirection.x * 24,
    y: castDirection.y * 18 - 26,
  };

  state.combat.magicMissiles.push({
    ownerMemberId: owner.id,
    visual,
    impactLabel,
    chainTag,
    chainDuration,
    x: owner.x + castOffset.x,
    y: owner.y + castOffset.y,
    rotation: Math.atan2(castDirection.y, castDirection.x),
    speed: 640,
    damage,
    ttl: magicMissileLifetime,
  });
}

export function updateMagicMissiles(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.magicMissiles.length - 1; index >= 0; index -= 1) {
    const missile = state.combat.magicMissiles[index];
    missile.ttl -= delta;

    if (state.enemy.state !== "dead" && state.enemy.visible) {
      const target = { x: state.enemy.x, y: state.enemy.y + magicMissileTargetYOffset };
      const toTarget = { x: target.x - missile.x, y: target.y - missile.y };
      const targetDistance = Math.hypot(toTarget.x, toTarget.y);
      const hitDistance = state.enemy.radius + magicMissileHitRadius;
      const travelDistance = missile.speed * delta;

      if (targetDistance > 0.001) {
        const step = Math.min(travelDistance, targetDistance);
        missile.rotation = Math.atan2(toTarget.y, toTarget.x);
        missile.x += (toTarget.x / targetDistance) * step;
        missile.y += (toTarget.y / targetDistance) * step;
      }

      if (distance(missile, state.enemy) <= hitDistance || targetDistance <= travelDistance + hitDistance) {
        state.combat.magicMissiles.splice(index, 1);
        dealEnemyDamage(state, missile.damage, missile.impactLabel ?? "Magic Missile", events);
        if (missile.chainTag) applyChain(state, missile.chainTag, missile.chainDuration ?? 3);
        const owner = getPartyMember(state, missile.ownerMemberId) ?? state.player;
        owner.meter = Math.min(owner.maxMeter, owner.meter + 7);
        events.push(soundEvent("magicMissileImpact"));
        continue;
      }
    }

    if (missile.ttl <= 0) {
      state.combat.magicMissiles.splice(index, 1);
    }
  }
}

export function spawnClericHealEffect(state: GameState, target: PartyMemberState) {
  state.combat.clericHealEffects.push({
    targetMemberId: target.id,
    x: target.x,
    y: target.y,
    timer: 0,
    duration: clericHealEffectDuration,
  });
}

export function updateClericHealEffects(state: GameState, delta: number) {
  for (let index = state.combat.clericHealEffects.length - 1; index >= 0; index -= 1) {
    const effect = state.combat.clericHealEffects[index];
    effect.timer += delta;
    const target = getPartyMember(state, effect.targetMemberId);
    if (target) {
      effect.x = target.x;
      effect.y = target.y;
    }
    if (effect.timer >= effect.duration) {
      state.combat.clericHealEffects.splice(index, 1);
    }
  }
}

export function spawnEnemyRockThrow(state: GameState, enemy: EnemyState = state.enemy) {
  const throwDirection = { ...enemy.attackForward };
  if (lengthSq(throwDirection) > 0.001) {
    normalize(throwDirection);
  } else {
    throwDirection.x = 0;
    throwDirection.y = 1;
  }

  const start = {
    x: enemy.x + throwDirection.x * 58,
    y: enemy.y + throwDirection.y * 42,
  };
  const target = {
    x: state.player.x,
    y: state.player.y,
  };
  const toTarget = { x: target.x - start.x, y: target.y - start.y };
  const travelDistance = Math.max(Math.hypot(toTarget.x, toTarget.y), 1);
  const duration = Math.min(0.72, Math.max(0.28, travelDistance / 820));

  state.combat.enemyRockThrows.push({
    ownerMonsterId: enemy.monsterId,
    x: start.x,
    y: start.y,
    vx: toTarget.x / duration,
    vy: toTarget.y / duration,
    damage: 22,
    radius: 24,
    timer: 0,
    duration,
    rotation: Math.atan2(throwDirection.y, throwDirection.x),
    spin: throwDirection.x >= 0 ? 13 : -13,
  });
}

export function updateEnemyRockThrows(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.enemyRockThrows.length - 1; index >= 0; index -= 1) {
    const projectile = state.combat.enemyRockThrows[index];
    projectile.timer += delta;
    projectile.x += projectile.vx * delta;
    projectile.y += projectile.vy * delta;
    projectile.rotation += projectile.spin * delta;

    const hitMember = firstPartyMemberHit(state, projectile, projectile.radius);
    if (hitMember) {
      state.combat.enemyRockThrows.splice(index, 1);
      if (projectile.ownerMonsterId === "moss_golem") events.push(soundEvent("mossGolemRockImpact"));
      events.push(logEvent(`Rock throw: ${projectile.damage}`, "The boulder found its mark"));
      dealPartyMemberDamage(state, hitMember, projectile.damage, "Rock throw", events);
      continue;
    }

    if (projectile.timer >= projectile.duration + 0.25) {
      state.combat.enemyRockThrows.splice(index, 1);
    }
  }
}

export function spawnShroomSporeCloud(state: GameState, enemy: EnemyState) {
  const castDirection = { ...enemy.attackForward };
  if (lengthSq(castDirection) > 0.001) {
    normalize(castDirection);
  } else {
    castDirection.x = 0;
    castDirection.y = 1;
  }

  state.combat.shroomSporeClouds.push({
    x: enemy.x + castDirection.x * 64,
    y: enemy.y + castDirection.y * 44,
    radius: 72,
    timer: 0,
    duration: 10,
    damage: 5,
    hitTimer: 0,
  });
}

export function updateShroomSporeClouds(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.shroomSporeClouds.length - 1; index >= 0; index -= 1) {
    const cloud = state.combat.shroomSporeClouds[index];
    cloud.timer += delta;
    cloud.hitTimer = Math.max(0, cloud.hitTimer - delta);

    const toPlayer = { x: state.player.x - cloud.x, y: state.player.y - cloud.y };
    if (lengthSq(toPlayer) > 0.001) {
      normalize(toPlayer);
      cloud.x += toPlayer.x * shroomSporeCloudSpeed * delta;
      cloud.y += toPlayer.y * shroomSporeCloudSpeed * delta;
    }

    const hitMember = cloud.hitTimer <= 0 ? firstPartyMemberHit(state, cloud, cloud.radius * 0.72) : null;
    if (hitMember) {
      cloud.hitTimer = 0.8;
      events.push(soundEvent("shroomSporeCloud"));
      events.push(logEvent(`Poison spores: ${cloud.damage}`, "The cloud clings to you"));
      dealPartyMemberDamage(state, hitMember, cloud.damage, "Poison spores", events);
    }

    if (cloud.timer >= cloud.duration) {
      state.combat.shroomSporeClouds.splice(index, 1);
    }
  }
}

export function spawnShroomlingToss(state: GameState, enemy: EnemyState) {
  const throwDirection = { ...enemy.attackForward };
  if (lengthSq(throwDirection) > 0.001) {
    normalize(throwDirection);
  } else {
    throwDirection.x = 0;
    throwDirection.y = 1;
  }

  const start = {
    x: enemy.x + throwDirection.x * 42,
    y: enemy.y + throwDirection.y * 28,
  };
  const target = {
    x: state.player.x,
    y: state.player.y,
  };
  const tossDuration = 0.46;

  state.combat.shroomlings.push({
    x: start.x,
    y: start.y,
    vx: (target.x - start.x) / tossDuration,
    vy: (target.y - start.y) / tossDuration,
    direction: cardinalDirectionFromVector(throwDirection),
    radius: 18,
    timer: 0,
    tossDuration,
    duration: 5,
    damage: 9,
    attackTimer: 0,
    chaseChompTimer: 0,
  });
}

export function updateShroomlings(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.shroomlings.length - 1; index >= 0; index -= 1) {
    const shroomling = state.combat.shroomlings[index];
    shroomling.timer += delta;
    shroomling.attackTimer = Math.max(0, shroomling.attackTimer - delta);
    shroomling.chaseChompTimer = Math.max(0, shroomling.chaseChompTimer - delta);

    if (shroomling.timer < shroomling.tossDuration) {
      shroomling.x += shroomling.vx * delta;
      shroomling.y += shroomling.vy * delta;
      shroomling.direction = cardinalDirectionFromVector({ x: shroomling.vx, y: shroomling.vy });
    } else {
      const chaseTarget = state.player.lifeState === "alive" ? state.player : state.party.members.find((member) => member.lifeState === "alive") ?? state.player;
      const toPlayer = { x: chaseTarget.x - shroomling.x, y: chaseTarget.y - shroomling.y };
      const playerDistance = Math.hypot(toPlayer.x, toPlayer.y);
      if (lengthSq(toPlayer) > 0.001) {
        normalize(toPlayer);
        shroomling.x += toPlayer.x * shroomlingCrawlSpeed * delta;
        shroomling.y += toPlayer.y * shroomlingCrawlSpeed * delta;
        shroomling.direction = cardinalDirectionFromVector(toPlayer);
      }
      if (
        chaseTarget.lifeState === "alive"
        && playerDistance > chaseTarget.radius + shroomling.radius + 18
        && shroomling.chaseChompTimer <= 0
      ) {
        shroomling.chaseChompTimer = shroomlingChaseChompInterval;
        events.push(soundEvent("shroomlingChomp"));
      }
    }

    const hitMember = shroomling.attackTimer <= 0 ? firstPartyMemberHit(state, shroomling, shroomling.radius) : null;
    if (hitMember) {
      shroomling.attackTimer = 0.7;
      shroomling.chaseChompTimer = shroomlingChaseChompInterval;
      events.push(soundEvent("shroomlingChomp"));
      events.push(logEvent(`Shroomling bite: ${shroomling.damage}`, "The tossed cap snaps at your heels"));
      dealPartyMemberDamage(state, hitMember, shroomling.damage, "Shroomling bite", events);
    }

    if (shroomling.timer >= shroomling.duration) {
      state.combat.shroomlings.splice(index, 1);
    }
  }
}

function cardinalDirectionFromVector(vector: Vec2): CardinalDirectionName {
  const direction = directionFromVector(vector);
  if (direction === "left" || direction === "up" || direction === "right" || direction === "down") return direction;
  if (direction === "up_left" || direction === "up_right") return "up";
  return "down";
}

export function spawnTreeGoblinHeadThrow(state: GameState, enemy: EnemyState) {
  const throwDirection = { ...enemy.attackForward };
  if (lengthSq(throwDirection) > 0.001) {
    normalize(throwDirection);
  } else {
    throwDirection.x = 0;
    throwDirection.y = 1;
  }

  const start = {
    x: enemy.x + throwDirection.x * 52,
    y: enemy.y + throwDirection.y * 36 - 24,
  };

  state.combat.treeGoblinHeads.push({
    ownerId: enemy.instanceId,
    originX: start.x,
    originY: start.y,
    x: start.x,
    y: start.y,
    baseAngle: Math.atan2(state.player.y - start.y, state.player.x - start.x),
    radius: 26,
    timer: 0,
    duration: treeGoblinHeadDuration,
    damage: 13,
    hitTimer: 0,
  });
}

export function updateTreeGoblinHeads(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.treeGoblinHeads.length - 1; index >= 0; index -= 1) {
    const head = state.combat.treeGoblinHeads[index];
    const owner = allEnemies(state).find((enemy) => enemy.instanceId === head.ownerId);
    if (!owner || owner.state === "dead" || !owner.visible) {
      state.combat.treeGoblinHeads.splice(index, 1);
      continue;
    }

    head.timer += delta;
    head.hitTimer = Math.max(0, head.hitTimer - delta);

    const activeProgress = Math.min(head.timer / treeGoblinHeadReturnStart, 1);
    const easedProgress = activeProgress * activeProgress * (3 - 2 * activeProgress);
    const forward = {
      x: Math.cos(head.baseAngle),
      y: Math.sin(head.baseAngle),
    };
    const side = {
      x: -forward.y,
      y: forward.x,
    };
    const travel = 42 + easedProgress * 286;
    const spiralRadius = 18 + easedProgress * 92;
    const spinAngle = head.timer * (2.45 + activeProgress * 1.25);
    const orbitPoint = {
      x: head.originX + forward.x * travel + side.x * Math.cos(spinAngle) * spiralRadius + forward.x * Math.sin(spinAngle) * spiralRadius * 0.34,
      y: head.originY + forward.y * travel + side.y * Math.cos(spinAngle) * spiralRadius * 0.72 + forward.y * Math.sin(spinAngle) * spiralRadius * 0.24,
    };

    if (head.timer < treeGoblinHeadReturnStart) {
      head.x = orbitPoint.x;
      head.y = orbitPoint.y;
    } else {
      const returnProgress = Math.min((head.timer - treeGoblinHeadReturnStart) / (head.duration - treeGoblinHeadReturnStart), 1);
      const eased = returnProgress * returnProgress * (3 - 2 * returnProgress);
      head.x = orbitPoint.x + (owner.x - orbitPoint.x) * eased;
      head.y = orbitPoint.y + (owner.y - 48 - orbitPoint.y) * eased;
    }

    const hitMember = head.timer < treeGoblinHeadReturnStart && head.hitTimer <= 0
      ? firstPartyMemberHit(state, head, head.radius)
      : null;
    if (hitMember) {
      head.hitTimer = 0.52;
      events.push(soundEvent("treeGoblinHeadHit"));
      dealPartyMemberDamage(state, hitMember, head.damage, "Flying head", events);
    }

    if (head.timer >= head.duration) {
      state.combat.treeGoblinHeads.splice(index, 1);
    }
  }
}

export function clearNightbloomBossEffects(state: GameState) {
  state.combat.nightbloomThorns.length = 0;
  state.combat.nightbloomPetals.length = 0;
  state.combat.nightbloomRootBursts.length = 0;
  state.combat.nightbloomNovaWaves.length = 0;
  state.combat.nightbloomPetalImpacts.length = 0;
}

export function clearObsidianBossEffects(state: GameState) {
  state.combat.obsidianLances.length = 0;
  state.combat.obsidianShards.length = 0;
  state.combat.obsidianSmites.length = 0;
  state.combat.obsidianWheels.length = 0;
  state.combat.obsidianImpacts.length = 0;
}

export function clearAbyssalBossEffects(state: GameState) {
  state.combat.abyssalBellShards.length = 0;
  state.combat.abyssalFanShards.length = 0;
  state.combat.abyssalGraveMarks.length = 0;
  state.combat.abyssalNovas.length = 0;
  state.combat.abyssalImpacts.length = 0;
}

export function clearBriarheartBossEffects(state: GameState) {
  state.combat.briarheartSkewers.length = 0;
  state.combat.briarheartSeeds.length = 0;
  state.combat.briarheartVineEruptions.length = 0;
  state.combat.briarheartPollenNovas.length = 0;
  state.combat.briarheartImpacts.length = 0;
}

export function clearWoundclockBossEffects(state: GameState) {
  state.combat.woundclockBolts.length = 0;
  state.combat.woundclockGearOrbs.length = 0;
  state.combat.woundclockSweeps.length = 0;
  state.combat.woundclockRifts.length = 0;
  state.combat.woundclockImpacts.length = 0;
}

export function spawnNightbloomThornLance(state: GameState, enemy: EnemyState) {
  const forward = normalizedAttackForward(enemy);
  const start = {
    x: enemy.x + forward.x * 62,
    y: enemy.y + forward.y * 46 - 18,
  };

  state.combat.nightbloomThorns.push({
    ...start,
    vx: forward.x * nightbloomMatriarchFight.projectiles.thornSpeed,
    vy: forward.y * nightbloomMatriarchFight.projectiles.thornSpeed,
    rotation: Math.atan2(forward.y, forward.x),
    radius: 20,
    damage: nightbloomMatriarchFight.abilities.thorn_lance.damage,
    timer: 0,
    duration: nightbloomMatriarchFight.projectiles.thornLifetime,
  });
}

export function spawnNightbloomPetalFan(state: GameState, enemy: EnemyState) {
  const forward = normalizedAttackForward(enemy);
  const phaseTwo = isNightbloomPhaseTwo(enemy);
  const count = phaseTwo
    ? nightbloomMatriarchFight.projectiles.phaseTwoPetalFanCount
    : nightbloomMatriarchFight.projectiles.petalFanCount;
  const spread = phaseTwo
    ? nightbloomMatriarchFight.projectiles.phaseTwoPetalFanSpread
    : nightbloomMatriarchFight.projectiles.petalFanSpread;
  const baseAngle = Math.atan2(forward.y, forward.x);
  const start = {
    x: enemy.x + forward.x * 48,
    y: enemy.y + forward.y * 34 - 12,
  };

  for (let index = 0; index < count; index += 1) {
    const ratio = count <= 1 ? 0.5 : index / (count - 1);
    const angle = baseAngle - spread / 2 + spread * ratio;
    state.combat.nightbloomPetals.push({
      ...start,
      vx: Math.cos(angle) * nightbloomMatriarchFight.projectiles.petalSpeed,
      vy: Math.sin(angle) * nightbloomMatriarchFight.projectiles.petalSpeed,
      rotation: angle,
      radius: 15,
      damage: nightbloomMatriarchFight.abilities.petal_fan.damage,
      timer: 0,
      duration: nightbloomMatriarchFight.projectiles.petalLifetime,
    });
  }
}

export function spawnNightbloomRootSnare(state: GameState, enemy: EnemyState) {
  const offsets = isNightbloomPhaseTwo(enemy)
    ? nightbloomMatriarchFight.rootSnare.phaseTwoOffsets
    : nightbloomMatriarchFight.rootSnare.phaseOneOffsets;

  offsets.forEach((offset, index) => {
    state.combat.nightbloomRootBursts.push({
      x: enemy.attackTarget.x + offset.x,
      y: enemy.attackTarget.y + offset.y,
      radius: nightbloomMatriarchFight.rootSnare.radius,
      timer: 0,
      delay: index * 0.12,
      duration: nightbloomMatriarchFight.rootSnare.duration,
      damage: nightbloomMatriarchFight.abilities.root_snare.damage,
      hasHit: false,
    });
  });
}

export function spawnNightbloomNova(state: GameState, enemy: EnemyState) {
  state.combat.nightbloomNovaWaves.push({
    x: enemy.x,
    y: enemy.y + 6,
    timer: 0,
    duration: nightbloomMatriarchFight.nova.duration,
    minRadius: nightbloomMatriarchFight.nova.minRadius,
    maxRadius: isNightbloomPhaseTwo(enemy)
      ? nightbloomMatriarchFight.nova.maxRadius + 38
      : nightbloomMatriarchFight.nova.maxRadius,
    damage: nightbloomMatriarchFight.abilities.nightbloom_nova.damage,
    hasHit: false,
  });
}

export function updateNightbloomProjectiles(state: GameState, delta: number, events: GameEvent[]) {
  updateNightbloomProjectileArray(state, state.combat.nightbloomThorns, delta, events, "Thorn lance");
  updateNightbloomProjectileArray(state, state.combat.nightbloomPetals, delta, events, "Petal shard");
  updateNightbloomRootBursts(state, delta, events);
  updateNightbloomNovaWaves(state, delta, events);
  updateNightbloomPetalImpacts(state, delta);
}

function updateNightbloomProjectileArray(
  state: GameState,
  projectiles: typeof state.combat.nightbloomThorns,
  delta: number,
  events: GameEvent[],
  label: string,
) {
  for (let index = projectiles.length - 1; index >= 0; index -= 1) {
    const projectile = projectiles[index];
    projectile.timer += delta;
    projectile.x += projectile.vx * delta;
    projectile.y += projectile.vy * delta;

    const hitMember = firstPartyMemberHit(state, projectile, projectile.radius);
    if (hitMember) {
      spawnNightbloomPetalImpact(state, projectile.x, projectile.y, projectile.rotation);
      projectiles.splice(index, 1);
      dealPartyMemberDamage(state, hitMember, projectile.damage, label, events);
      continue;
    }

    if (projectile.timer >= projectile.duration) {
      projectiles.splice(index, 1);
    }
  }
}

function updateNightbloomRootBursts(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.nightbloomRootBursts.length - 1; index >= 0; index -= 1) {
    const burst = state.combat.nightbloomRootBursts[index];
    burst.timer += delta;
    const hitTime = burst.delay + nightbloomMatriarchFight.rootSnare.hitDelay;

    if (!burst.hasHit && burst.timer >= hitTime) {
      burst.hasHit = true;
      const hitMember = firstPartyMemberHit(state, burst, burst.radius);
      if (hitMember) {
        events.push(soundEvent("nightbloomRootBurst"));
        dealPartyMemberDamage(state, hitMember, burst.damage, "Root snare", events);
      }
    }

    if (burst.timer >= burst.delay + burst.duration) {
      state.combat.nightbloomRootBursts.splice(index, 1);
    }
  }
}

function updateNightbloomNovaWaves(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.nightbloomNovaWaves.length - 1; index >= 0; index -= 1) {
    const wave = state.combat.nightbloomNovaWaves[index];
    wave.timer += delta;
    const progress = Math.min(Math.max(wave.timer / wave.duration, 0), 1);
    const radius = wave.minRadius + (wave.maxRadius - wave.minRadius) * progress;

    if (!wave.hasHit && progress >= 0.48) {
      wave.hasHit = true;
      const hitMember = firstPartyMemberInRadiusBand(state, wave, wave.minRadius, radius);
      if (hitMember) dealPartyMemberDamage(state, hitMember, wave.damage, "Nightbloom nova", events);
    }

    if (wave.timer >= wave.duration) {
      state.combat.nightbloomNovaWaves.splice(index, 1);
    }
  }
}

function updateNightbloomPetalImpacts(state: GameState, delta: number) {
  state.combat.nightbloomPetalImpacts.forEach((impact) => {
    impact.timer += delta;
  });
  state.combat.nightbloomPetalImpacts = state.combat.nightbloomPetalImpacts.filter((impact) => impact.timer < impact.duration);
}

function spawnNightbloomPetalImpact(state: GameState, x: number, y: number, rotation: number) {
  state.combat.nightbloomPetalImpacts.push({
    x,
    y,
    rotation,
    timer: 0,
    duration: 0.36,
  });
}

function normalizedAttackForward(enemy: EnemyState): Vec2 {
  const forward = { ...enemy.attackForward };
  if (lengthSq(forward) > 0.001) {
    normalize(forward);
  } else {
    forward.x = 0;
    forward.y = 1;
  }
  return forward;
}

function isNightbloomPhaseTwo(enemy: EnemyState) {
  return enemy.phaseBloomed || enemy.health <= enemy.maxHealth * nightbloomMatriarchFight.phaseTwoHealthRatio;
}

export function spawnObsidianGlassLance(state: GameState, enemy: EnemyState) {
  const forward = normalizedAttackForward(enemy);
  const start = {
    x: enemy.x + forward.x * 66,
    y: enemy.y + forward.y * 46 - 20,
  };

  state.combat.obsidianLances.push({
    ...start,
    vx: forward.x * obsidianReliquaryFight.projectiles.lanceSpeed,
    vy: forward.y * obsidianReliquaryFight.projectiles.lanceSpeed,
    rotation: Math.atan2(forward.y, forward.x),
    radius: 21,
    damage: obsidianReliquaryFight.abilities.glass_lance.damage,
    timer: 0,
    duration: obsidianReliquaryFight.projectiles.lanceLifetime,
  });
}

export function spawnObsidianShardSpiral(state: GameState, enemy: EnemyState) {
  const forward = normalizedAttackForward(enemy);
  const phaseTwo = isObsidianPhaseTwo(enemy);
  const count = phaseTwo ? obsidianReliquaryFight.projectiles.phaseTwoShardCount : obsidianReliquaryFight.projectiles.shardCount;
  const spread = phaseTwo ? obsidianReliquaryFight.projectiles.phaseTwoShardSpread : obsidianReliquaryFight.projectiles.shardSpread;
  const baseAngle = Math.atan2(forward.y, forward.x) - spread / 2 + enemy.attackIndex * 0.21;
  const start = {
    x: enemy.x + forward.x * 44,
    y: enemy.y + forward.y * 34 - 12,
  };

  for (let index = 0; index < count; index += 1) {
    const angle = baseAngle + (spread * index) / Math.max(1, count - 1);
    state.combat.obsidianShards.push({
      ...start,
      vx: Math.cos(angle) * obsidianReliquaryFight.projectiles.shardSpeed,
      vy: Math.sin(angle) * obsidianReliquaryFight.projectiles.shardSpeed,
      rotation: angle,
      radius: 15,
      damage: obsidianReliquaryFight.abilities.shard_spiral.damage,
      timer: 0,
      duration: obsidianReliquaryFight.projectiles.shardLifetime,
    });
  }
}

export function spawnObsidianReliquarySmite(state: GameState, enemy: EnemyState) {
  const offsets = isObsidianPhaseTwo(enemy)
    ? obsidianReliquaryFight.smite.phaseTwoOffsets
    : obsidianReliquaryFight.smite.phaseOneOffsets;

  offsets.forEach((offset, index) => {
    state.combat.obsidianSmites.push({
      x: enemy.attackTarget.x + offset.x,
      y: enemy.attackTarget.y + offset.y,
      radius: obsidianReliquaryFight.smite.radius,
      timer: 0,
      delay: index * 0.1,
      duration: obsidianReliquaryFight.smite.duration,
      damage: obsidianReliquaryFight.abilities.reliquary_smite.damage,
      hasHit: false,
    });
  });
}

export function spawnObsidianPenitentWheel(state: GameState, enemy: EnemyState) {
  state.combat.obsidianWheels.push({
    x: enemy.x,
    y: enemy.y + 6,
    timer: 0,
    duration: obsidianReliquaryFight.wheel.duration,
    minRadius: obsidianReliquaryFight.wheel.minRadius,
    maxRadius: isObsidianPhaseTwo(enemy) ? obsidianReliquaryFight.wheel.maxRadius + 48 : obsidianReliquaryFight.wheel.maxRadius,
    damage: obsidianReliquaryFight.abilities.penitent_wheel.damage,
    hasHit: false,
  });
}

export function updateObsidianProjectiles(state: GameState, delta: number, events: GameEvent[]) {
  updateObsidianProjectileArray(state, state.combat.obsidianLances, delta, events, "Glass lance");
  updateObsidianProjectileArray(state, state.combat.obsidianShards, delta, events, "Spiral shard");
  updateObsidianSmites(state, delta, events);
  updateObsidianWheels(state, delta, events);
  updateObsidianImpacts(state, delta);
}

function updateObsidianProjectileArray(
  state: GameState,
  projectiles: typeof state.combat.obsidianLances,
  delta: number,
  events: GameEvent[],
  label: string,
) {
  for (let index = projectiles.length - 1; index >= 0; index -= 1) {
    const projectile = projectiles[index];
    projectile.timer += delta;
    projectile.x += projectile.vx * delta;
    projectile.y += projectile.vy * delta;

    const hitMember = firstPartyMemberHit(state, projectile, projectile.radius);
    if (hitMember) {
      spawnObsidianImpact(state, projectile.x, projectile.y, projectile.rotation);
      projectiles.splice(index, 1);
      dealPartyMemberDamage(state, hitMember, projectile.damage, label, events);
      continue;
    }

    if (projectile.timer >= projectile.duration) projectiles.splice(index, 1);
  }
}

function updateObsidianSmites(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.obsidianSmites.length - 1; index >= 0; index -= 1) {
    const smite = state.combat.obsidianSmites[index];
    smite.timer += delta;
    const hitTime = smite.delay + obsidianReliquaryFight.smite.hitDelay;

    if (!smite.hasHit && smite.timer >= hitTime) {
      smite.hasHit = true;
      const hitMember = firstPartyMemberHit(state, smite, smite.radius);
      if (hitMember) dealPartyMemberDamage(state, hitMember, smite.damage, "Reliquary smite", events);
    }

    if (smite.timer >= smite.delay + smite.duration) state.combat.obsidianSmites.splice(index, 1);
  }
}

function updateObsidianWheels(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.obsidianWheels.length - 1; index >= 0; index -= 1) {
    const wheel = state.combat.obsidianWheels[index];
    wheel.timer += delta;
    const progress = Math.min(Math.max(wheel.timer / wheel.duration, 0), 1);
    const radius = wheel.minRadius + (wheel.maxRadius - wheel.minRadius) * progress;
    const hitMember = firstPartyMemberOnRing(state, wheel, radius, 34);

    if (!wheel.hasHit && progress > 0.18 && hitMember) {
      wheel.hasHit = true;
      dealPartyMemberDamage(state, hitMember, wheel.damage, "Penitent wheel", events);
    }

    if (wheel.timer >= wheel.duration) state.combat.obsidianWheels.splice(index, 1);
  }
}

function updateObsidianImpacts(state: GameState, delta: number) {
  state.combat.obsidianImpacts.forEach((impact) => {
    impact.timer += delta;
  });
  state.combat.obsidianImpacts = state.combat.obsidianImpacts.filter((impact) => impact.timer < impact.duration);
}

function spawnObsidianImpact(state: GameState, x: number, y: number, rotation: number) {
  state.combat.obsidianImpacts.push({
    x,
    y,
    rotation,
    timer: 0,
    duration: 0.32,
  });
}

function isObsidianPhaseTwo(enemy: EnemyState) {
  return enemy.phaseBloomed || enemy.health <= enemy.maxHealth * obsidianReliquaryFight.phaseTwoHealthRatio;
}

export function spawnAbyssalBellShard(state: GameState, enemy: EnemyState) {
  const forward = normalizedAttackForward(enemy);
  const start = {
    x: enemy.x + forward.x * 70,
    y: enemy.y + forward.y * 48 - 22,
  };

  state.combat.abyssalBellShards.push({
    ...start,
    vx: forward.x * abyssalBellwraithFight.projectiles.shardSpeed,
    vy: forward.y * abyssalBellwraithFight.projectiles.shardSpeed,
    rotation: Math.atan2(forward.y, forward.x),
    radius: 22,
    damage: abyssalBellwraithFight.abilities.bell_shard.damage,
    timer: 0,
    duration: abyssalBellwraithFight.projectiles.shardLifetime,
  });
}

export function spawnAbyssalTollingFan(state: GameState, enemy: EnemyState) {
  const forward = normalizedAttackForward(enemy);
  const phaseTwo = isAbyssalPhaseTwo(enemy);
  const count = phaseTwo ? abyssalBellwraithFight.projectiles.phaseTwoFanCount : abyssalBellwraithFight.projectiles.fanCount;
  const spread = phaseTwo ? abyssalBellwraithFight.projectiles.phaseTwoFanSpread : abyssalBellwraithFight.projectiles.fanSpread;
  const baseAngle = Math.atan2(forward.y, forward.x) - spread / 2 - enemy.attackIndex * 0.16;
  const start = {
    x: enemy.x + forward.x * 48,
    y: enemy.y + forward.y * 36 - 14,
  };

  for (let index = 0; index < count; index += 1) {
    const angle = baseAngle + (spread * index) / Math.max(1, count - 1);
    state.combat.abyssalFanShards.push({
      ...start,
      vx: Math.cos(angle) * abyssalBellwraithFight.projectiles.fanSpeed,
      vy: Math.sin(angle) * abyssalBellwraithFight.projectiles.fanSpeed,
      rotation: angle,
      radius: 15,
      damage: abyssalBellwraithFight.abilities.tolling_fan.damage,
      timer: 0,
      duration: abyssalBellwraithFight.projectiles.fanLifetime,
    });
  }
}

export function spawnAbyssalGraveMarks(state: GameState, enemy: EnemyState) {
  const offsets = isAbyssalPhaseTwo(enemy)
    ? abyssalBellwraithFight.graveMark.phaseTwoOffsets
    : abyssalBellwraithFight.graveMark.phaseOneOffsets;

  offsets.forEach((offset, index) => {
    state.combat.abyssalGraveMarks.push({
      x: enemy.attackTarget.x + offset.x,
      y: enemy.attackTarget.y + offset.y,
      radius: abyssalBellwraithFight.graveMark.radius,
      timer: 0,
      delay: index * 0.11,
      duration: abyssalBellwraithFight.graveMark.duration,
      damage: abyssalBellwraithFight.abilities.grave_mark.damage,
      hasHit: false,
    });
  });
}

export function spawnAbyssalDirgeNova(state: GameState, enemy: EnemyState) {
  const phaseTwo = isAbyssalPhaseTwo(enemy);
  const waveCount = phaseTwo ? 2 : 1;
  for (let index = 0; index < waveCount; index += 1) {
    state.combat.abyssalNovas.push({
      x: enemy.x,
      y: enemy.y + 8,
      timer: 0,
      delay: index * abyssalBellwraithFight.nova.phaseTwoDelay,
      duration: abyssalBellwraithFight.nova.duration,
      minRadius: abyssalBellwraithFight.nova.minRadius + index * 42,
      maxRadius: abyssalBellwraithFight.nova.maxRadius + (phaseTwo ? 48 : 0) + index * 72,
      damage: abyssalBellwraithFight.abilities.dirge_nova.damage,
      hasHit: false,
    });
  }
}

export function updateAbyssalProjectiles(state: GameState, delta: number, events: GameEvent[]) {
  updateAbyssalProjectileArray(state, state.combat.abyssalBellShards, delta, events, "Bell shard");
  updateAbyssalProjectileArray(state, state.combat.abyssalFanShards, delta, events, "Tolling shard");
  updateAbyssalGraveMarks(state, delta, events);
  updateAbyssalNovas(state, delta, events);
  updateAbyssalImpacts(state, delta);
}

function updateAbyssalProjectileArray(
  state: GameState,
  projectiles: typeof state.combat.abyssalBellShards,
  delta: number,
  events: GameEvent[],
  label: string,
) {
  for (let index = projectiles.length - 1; index >= 0; index -= 1) {
    const projectile = projectiles[index];
    projectile.timer += delta;
    projectile.x += projectile.vx * delta;
    projectile.y += projectile.vy * delta;

    const hitMember = firstPartyMemberHit(state, projectile, projectile.radius);
    if (hitMember) {
      spawnAbyssalImpact(state, projectile.x, projectile.y, projectile.rotation);
      projectiles.splice(index, 1);
      dealPartyMemberDamage(state, hitMember, projectile.damage, label, events);
      continue;
    }

    if (projectile.timer >= projectile.duration) projectiles.splice(index, 1);
  }
}

function updateAbyssalGraveMarks(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.abyssalGraveMarks.length - 1; index >= 0; index -= 1) {
    const mark = state.combat.abyssalGraveMarks[index];
    mark.timer += delta;
    const hitTime = mark.delay + abyssalBellwraithFight.graveMark.hitDelay;

    if (!mark.hasHit && mark.timer >= hitTime) {
      mark.hasHit = true;
      const hitMember = firstPartyMemberHit(state, mark, mark.radius);
      if (hitMember) dealPartyMemberDamage(state, hitMember, mark.damage, "Grave mark", events);
    }

    if (mark.timer >= mark.delay + mark.duration) state.combat.abyssalGraveMarks.splice(index, 1);
  }
}

function updateAbyssalNovas(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.abyssalNovas.length - 1; index >= 0; index -= 1) {
    const nova = state.combat.abyssalNovas[index];
    nova.timer += delta;
    if (nova.timer < nova.delay) continue;

    const localTimer = nova.timer - nova.delay;
    const progress = Math.min(Math.max(localTimer / nova.duration, 0), 1);
    const radius = nova.minRadius + (nova.maxRadius - nova.minRadius) * progress;
    const hitMember = firstPartyMemberOnRing(state, nova, radius, 36);

    if (!nova.hasHit && progress > 0.18 && hitMember) {
      nova.hasHit = true;
      dealPartyMemberDamage(state, hitMember, nova.damage, "Dirge nova", events);
    }

    if (localTimer >= nova.duration) state.combat.abyssalNovas.splice(index, 1);
  }
}

function updateAbyssalImpacts(state: GameState, delta: number) {
  state.combat.abyssalImpacts.forEach((impact) => {
    impact.timer += delta;
  });
  state.combat.abyssalImpacts = state.combat.abyssalImpacts.filter((impact) => impact.timer < impact.duration);
}

function spawnAbyssalImpact(state: GameState, x: number, y: number, rotation: number) {
  state.combat.abyssalImpacts.push({
    x,
    y,
    rotation,
    timer: 0,
    duration: 0.34,
  });
}

function isAbyssalPhaseTwo(enemy: EnemyState) {
  return enemy.phaseBloomed || enemy.health <= enemy.maxHealth * abyssalBellwraithFight.phaseTwoHealthRatio;
}

export function spawnBriarheartSkewer(state: GameState, enemy: EnemyState) {
  const forward = normalizedAttackForward(enemy);
  const start = {
    x: enemy.x + forward.x * 74,
    y: enemy.y + forward.y * 50 - 22,
  };

  state.combat.briarheartSkewers.push({
    ...start,
    vx: forward.x * briarheartSovereignFight.projectiles.skewerSpeed,
    vy: forward.y * briarheartSovereignFight.projectiles.skewerSpeed,
    rotation: Math.atan2(forward.y, forward.x),
    radius: 23,
    damage: briarheartSovereignFight.abilities.briar_skewer.damage,
    timer: 0,
    duration: briarheartSovereignFight.projectiles.skewerLifetime,
  });
}

export function spawnBriarheartSeedBarrage(state: GameState, enemy: EnemyState) {
  const forward = normalizedAttackForward(enemy);
  const phaseTwo = isBriarheartPhaseTwo(enemy);
  const count = phaseTwo
    ? briarheartSovereignFight.projectiles.phaseTwoSeedCount
    : briarheartSovereignFight.projectiles.seedCount;
  const spread = phaseTwo
    ? briarheartSovereignFight.projectiles.phaseTwoSeedSpread
    : briarheartSovereignFight.projectiles.seedSpread;
  const baseAngle = Math.atan2(forward.y, forward.x) - spread / 2 + enemy.attackIndex * 0.18;
  const start = {
    x: enemy.x + forward.x * 52,
    y: enemy.y + forward.y * 38 - 14,
  };

  for (let index = 0; index < count; index += 1) {
    const angle = baseAngle + (spread * index) / Math.max(1, count - 1);
    state.combat.briarheartSeeds.push({
      ...start,
      vx: Math.cos(angle) * briarheartSovereignFight.projectiles.seedSpeed,
      vy: Math.sin(angle) * briarheartSovereignFight.projectiles.seedSpeed,
      rotation: angle,
      radius: 16,
      damage: briarheartSovereignFight.abilities.seed_barrage.damage,
      timer: 0,
      duration: briarheartSovereignFight.projectiles.seedLifetime,
    });
  }
}

export function spawnBriarheartStranglerGrove(state: GameState, enemy: EnemyState) {
  const offsets = isBriarheartPhaseTwo(enemy)
    ? briarheartSovereignFight.grove.phaseTwoOffsets
    : briarheartSovereignFight.grove.phaseOneOffsets;

  offsets.forEach((offset, index) => {
    state.combat.briarheartVineEruptions.push({
      x: enemy.attackTarget.x + offset.x,
      y: enemy.attackTarget.y + offset.y,
      radius: briarheartSovereignFight.grove.radius,
      timer: 0,
      delay: index * 0.1,
      duration: briarheartSovereignFight.grove.duration,
      damage: briarheartSovereignFight.abilities.strangler_grove.damage,
      hasHit: false,
    });
  });
}

export function spawnBriarheartPollenNova(state: GameState, enemy: EnemyState) {
  state.combat.briarheartPollenNovas.push({
    x: enemy.x,
    y: enemy.y + 8,
    timer: 0,
    duration: briarheartSovereignFight.nova.duration,
    minRadius: briarheartSovereignFight.nova.minRadius,
    maxRadius: isBriarheartPhaseTwo(enemy)
      ? briarheartSovereignFight.nova.maxRadius + 52
      : briarheartSovereignFight.nova.maxRadius,
    damage: briarheartSovereignFight.abilities.pollen_nova.damage,
    hasHit: false,
  });
}

export function updateBriarheartProjectiles(state: GameState, delta: number, events: GameEvent[]) {
  updateBriarheartProjectileArray(state, state.combat.briarheartSkewers, delta, events, "Briar skewer");
  updateBriarheartProjectileArray(state, state.combat.briarheartSeeds, delta, events, "Cursed seed");
  updateBriarheartVineEruptions(state, delta, events);
  updateBriarheartPollenNovas(state, delta, events);
  updateBriarheartImpacts(state, delta);
}

function updateBriarheartProjectileArray(
  state: GameState,
  projectiles: typeof state.combat.briarheartSkewers,
  delta: number,
  events: GameEvent[],
  label: string,
) {
  for (let index = projectiles.length - 1; index >= 0; index -= 1) {
    const projectile = projectiles[index];
    projectile.timer += delta;
    projectile.x += projectile.vx * delta;
    projectile.y += projectile.vy * delta;

    const hitMember = firstPartyMemberHit(state, projectile, projectile.radius);
    if (hitMember) {
      spawnBriarheartImpact(state, projectile.x, projectile.y, projectile.rotation);
      projectiles.splice(index, 1);
      dealPartyMemberDamage(state, hitMember, projectile.damage, label, events);
      continue;
    }

    if (projectile.timer >= projectile.duration) projectiles.splice(index, 1);
  }
}

function updateBriarheartVineEruptions(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.briarheartVineEruptions.length - 1; index >= 0; index -= 1) {
    const eruption = state.combat.briarheartVineEruptions[index];
    eruption.timer += delta;
    const hitTime = eruption.delay + briarheartSovereignFight.grove.hitDelay;

    if (!eruption.hasHit && eruption.timer >= hitTime) {
      eruption.hasHit = true;
      const hitMember = firstPartyMemberHit(state, eruption, eruption.radius);
      if (hitMember) dealPartyMemberDamage(state, hitMember, eruption.damage, "Strangler grove", events);
    }

    if (eruption.timer >= eruption.delay + eruption.duration) {
      state.combat.briarheartVineEruptions.splice(index, 1);
    }
  }
}

function updateBriarheartPollenNovas(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.briarheartPollenNovas.length - 1; index >= 0; index -= 1) {
    const nova = state.combat.briarheartPollenNovas[index];
    nova.timer += delta;
    const progress = Math.min(Math.max(nova.timer / nova.duration, 0), 1);
    const radius = nova.minRadius + (nova.maxRadius - nova.minRadius) * progress;
    const hitMember = firstPartyMemberOnRing(state, nova, radius, 38);

    if (!nova.hasHit && progress > 0.2 && hitMember) {
      nova.hasHit = true;
      dealPartyMemberDamage(state, hitMember, nova.damage, "Pollen nova", events);
    }

    if (nova.timer >= nova.duration) state.combat.briarheartPollenNovas.splice(index, 1);
  }
}

function updateBriarheartImpacts(state: GameState, delta: number) {
  state.combat.briarheartImpacts.forEach((impact) => {
    impact.timer += delta;
  });
  state.combat.briarheartImpacts = state.combat.briarheartImpacts.filter((impact) => impact.timer < impact.duration);
}

function spawnBriarheartImpact(state: GameState, x: number, y: number, rotation: number) {
  state.combat.briarheartImpacts.push({
    x,
    y,
    rotation,
    timer: 0,
    duration: 0.34,
  });
}

function isBriarheartPhaseTwo(enemy: EnemyState) {
  return enemy.phaseBloomed || enemy.health <= enemy.maxHealth * briarheartSovereignFight.phaseTwoHealthRatio;
}

export function spawnWoundclockChronoLance(state: GameState, enemy: EnemyState) {
  const forward = normalizedAttackForward(enemy);
  const phaseTwo = isWoundclockPhaseTwo(enemy);
  const count = phaseTwo ? woundclockArbiterFight.chronoLance.phaseTwoCount : 1;
  const spread = phaseTwo ? woundclockArbiterFight.chronoLance.phaseTwoSpread : 0;
  const baseAngle = Math.atan2(forward.y, forward.x);
  const start = {
    x: enemy.x + forward.x * 68,
    y: enemy.y + forward.y * 48 - 20,
  };

  for (let index = 0; index < count; index += 1) {
    const ratio = count <= 1 ? 0.5 : index / (count - 1);
    const angle = baseAngle - spread / 2 + spread * ratio;
    state.combat.woundclockBolts.push({
      ...start,
      vx: Math.cos(angle) * woundclockArbiterFight.chronoLance.speed,
      vy: Math.sin(angle) * woundclockArbiterFight.chronoLance.speed,
      rotation: angle,
      radius: 18,
      damage: woundclockArbiterFight.abilities.chrono_lance.damage,
      timer: 0,
      duration: woundclockArbiterFight.chronoLance.lifetime,
    });
  }
}

export function spawnWoundclockGearOrbit(state: GameState, enemy: EnemyState) {
  const phaseTwo = isWoundclockPhaseTwo(enemy);
  const count = phaseTwo ? woundclockArbiterFight.gearOrbit.phaseTwoCount : woundclockArbiterFight.gearOrbit.count;
  const baseAngle = Math.atan2(enemy.attackForward.y, enemy.attackForward.x);

  for (let index = 0; index < count; index += 1) {
    const angle = baseAngle + (Math.PI * 2 * index) / count;
    const angularSpeed = (phaseTwo ? 4.6 : 3.6) * (index % 2 === 0 ? 1 : -1);
    state.combat.woundclockGearOrbs.push({
      centerX: enemy.x,
      centerY: enemy.y - 18,
      x: enemy.x + Math.cos(angle) * woundclockArbiterFight.gearOrbit.orbitRadius,
      y: enemy.y - 18 + Math.sin(angle) * woundclockArbiterFight.gearOrbit.orbitRadius * 0.72,
      angle,
      angularSpeed,
      orbitRadius: woundclockArbiterFight.gearOrbit.orbitRadius + (index % 3) * 12,
      vx: 0,
      vy: 0,
      rotation: angle,
      radius: 20,
      damage: woundclockArbiterFight.abilities.gear_orbit.damage,
      timer: 0,
      orbitDuration: woundclockArbiterFight.gearOrbit.orbitDuration + (index % 2) * 0.12,
      duration: woundclockArbiterFight.gearOrbit.duration,
      released: false,
    });
  }
}

export function spawnWoundclockClockhandSweep(state: GameState, enemy: EnemyState) {
  const forward = normalizedAttackForward(enemy);
  const baseAngle = Math.atan2(forward.y, forward.x);
  const clockwise = enemy.attackIndex % 2 === 0 ? 1 : -1;
  const arc = woundclockArbiterFight.clockhandSweep.arc * clockwise;
  state.combat.woundclockSweeps.push({
    x: enemy.x,
    y: enemy.y - 12,
    startAngle: baseAngle - arc * 0.5,
    endAngle: baseAngle + arc * 0.5,
    length: woundclockArbiterFight.clockhandSweep.length,
    width: woundclockArbiterFight.clockhandSweep.width,
    timer: 0,
    duration: isWoundclockPhaseTwo(enemy)
      ? woundclockArbiterFight.clockhandSweep.phaseTwoDuration
      : woundclockArbiterFight.clockhandSweep.duration,
    damage: woundclockArbiterFight.abilities.clockhand_sweep.damage,
    hasHit: false,
  });
}

export function spawnWoundclockTimeRifts(state: GameState, enemy: EnemyState) {
  const offsets = isWoundclockPhaseTwo(enemy)
    ? woundclockArbiterFight.timeRift.phaseTwoOffsets
    : woundclockArbiterFight.timeRift.phaseOneOffsets;
  offsets.forEach((offset, index) => {
    state.combat.woundclockRifts.push({
      x: enemy.attackTarget.x + offset.x,
      y: enemy.attackTarget.y + offset.y,
      radius: woundclockArbiterFight.timeRift.radius + (index === 0 ? 10 : 0),
      timer: 0,
      delay: index * 0.08,
      duration: woundclockArbiterFight.timeRift.duration,
      damage: woundclockArbiterFight.abilities.time_rift.damage,
      hasHit: false,
    });
  });
}

export function updateWoundclockProjectiles(state: GameState, delta: number, events: GameEvent[]) {
  updateWoundclockBolts(state, delta, events);
  updateWoundclockGearOrbs(state, delta, events);
  updateWoundclockSweeps(state, delta, events);
  updateWoundclockRifts(state, delta, events);
  updateWoundclockImpacts(state, delta);
}

function updateWoundclockBolts(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.woundclockBolts.length - 1; index >= 0; index -= 1) {
    const bolt = state.combat.woundclockBolts[index];
    bolt.timer += delta;
    bolt.x += bolt.vx * delta;
    bolt.y += bolt.vy * delta;

    if (hitPartyMemberWithCircle(state, bolt, bolt.radius, bolt.damage, "Chrono lance", events)) {
      spawnWoundclockImpact(state, bolt.x, bolt.y, bolt.rotation);
      state.combat.woundclockBolts.splice(index, 1);
      continue;
    }

    if (bolt.timer >= bolt.duration) state.combat.woundclockBolts.splice(index, 1);
  }
}

function updateWoundclockGearOrbs(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.woundclockGearOrbs.length - 1; index >= 0; index -= 1) {
    const orb = state.combat.woundclockGearOrbs[index];
    orb.timer += delta;
    orb.rotation += 7.6 * delta;

    if (!orb.released && orb.timer < orb.orbitDuration) {
      orb.angle += orb.angularSpeed * delta;
      orb.x = orb.centerX + Math.cos(orb.angle) * orb.orbitRadius;
      orb.y = orb.centerY + Math.sin(orb.angle) * orb.orbitRadius * 0.72;
    } else {
      if (!orb.released) {
        orb.released = true;
        const toPlayer = { x: state.player.x - orb.x, y: state.player.y - orb.y };
        if (lengthSq(toPlayer) > 0.001) normalize(toPlayer);
        orb.vx = toPlayer.x * woundclockArbiterFight.gearOrbit.releaseSpeed;
        orb.vy = toPlayer.y * woundclockArbiterFight.gearOrbit.releaseSpeed;
      }
      orb.x += orb.vx * delta;
      orb.y += orb.vy * delta;
    }

    if (hitPartyMemberWithCircle(state, orb, orb.radius, orb.damage, "Gear orbit", events)) {
      spawnWoundclockImpact(state, orb.x, orb.y, orb.rotation);
      state.combat.woundclockGearOrbs.splice(index, 1);
      continue;
    }

    if (orb.timer >= orb.duration) state.combat.woundclockGearOrbs.splice(index, 1);
  }
}

function updateWoundclockSweeps(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.woundclockSweeps.length - 1; index >= 0; index -= 1) {
    const sweep = state.combat.woundclockSweeps[index];
    sweep.timer += delta;
    const progress = Math.min(Math.max(sweep.timer / sweep.duration, 0), 1);
    const angle = sweep.startAngle + (sweep.endAngle - sweep.startAngle) * progress;

    if (!sweep.hasHit && progress > 0.08) {
      const end = {
        x: sweep.x + Math.cos(angle) * sweep.length,
        y: sweep.y + Math.sin(angle) * sweep.length,
      };
      const hitMember = state.party.members.find((member) =>
        member.lifeState === "alive"
        && member.invulnerableTime <= 0
        && distanceToSegment(member, sweep, end) <= member.radius + sweep.width,
      );
      if (hitMember) {
        sweep.hasHit = true;
        dealPartyMemberDamage(state, hitMember, sweep.damage, "Clockhand sweep", events);
      }
    }

    if (sweep.timer >= sweep.duration) state.combat.woundclockSweeps.splice(index, 1);
  }
}

function updateWoundclockRifts(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.woundclockRifts.length - 1; index >= 0; index -= 1) {
    const rift = state.combat.woundclockRifts[index];
    rift.timer += delta;
    const hitTime = rift.delay + woundclockArbiterFight.timeRift.hitDelay;

    if (!rift.hasHit && rift.timer >= hitTime) {
      rift.hasHit = true;
      spawnWoundclockImpact(state, rift.x, rift.y, 0);
      if (hitPartyMemberWithCircle(state, rift, rift.radius, rift.damage, "Time rift", events)) {
        continue;
      }
    }

    if (rift.timer >= rift.delay + rift.duration) state.combat.woundclockRifts.splice(index, 1);
  }
}

function updateWoundclockImpacts(state: GameState, delta: number) {
  state.combat.woundclockImpacts.forEach((impact) => {
    impact.timer += delta;
  });
  state.combat.woundclockImpacts = state.combat.woundclockImpacts.filter((impact) => impact.timer < impact.duration);
}

function spawnWoundclockImpact(state: GameState, x: number, y: number, rotation: number) {
  state.combat.woundclockImpacts.push({
    x,
    y,
    rotation,
    timer: 0,
    duration: 0.36,
  });
}

function distanceToSegment(point: Vec2, start: Vec2, end: Vec2) {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const lengthSquared = segmentX * segmentX + segmentY * segmentY;
  if (lengthSquared <= 0.001) return distance(point, start);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * segmentX + (point.y - start.y) * segmentY) / lengthSquared));
  const closest = { x: start.x + segmentX * t, y: start.y + segmentY * t };
  return distance(point, closest);
}

function isWoundclockPhaseTwo(enemy: EnemyState) {
  return enemy.phaseBloomed || enemy.health <= enemy.maxHealth * woundclockArbiterFight.phaseTwoHealthRatio;
}

export function spawnMotherslashWaves(state: GameState, damage: number, maxRadius: number, chainTag = "Cyclone") {
  const center = {
    x: state.player.x,
    y: state.player.y + 8,
  };
  const pulseWeights = [0.42, 0.34, 0.24];
  const pulseDelays = [0.1, 0.3, 0.5];

  state.combat.motherslashWaves.length = 0;
  pulseWeights.forEach((weight, index) => {
    state.combat.motherslashWaves.push({
      ...center,
      timer: -pulseDelays[index],
      delay: pulseDelays[index],
      duration: 0.74 + index * 0.08,
      maxRadius,
      damage: Math.max(1, Math.round(damage * weight)),
      chainTag,
      hitEnemyIds: [],
    });
  });
}

export function updateMotherslashWaves(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.motherslashWaves.length - 1; index >= 0; index -= 1) {
    const wave = state.combat.motherslashWaves[index];
    if (!wave) continue;
    wave.timer += delta;

    if (wave.timer < 0) continue;

    const progress = Math.min(wave.timer / wave.duration, 1);
    const radius = motherslashWaveRadius(wave);
    livingEnemies(state).forEach((enemy) => {
      const enemyDistance = distance(wave, enemy);
      const hasReachedEnemy = Math.abs(enemyDistance - radius) <= enemy.radius + motherslashWaveHitBand;

      if (wave.hitEnemyIds.includes(enemy.instanceId) || progress < 0.1 || !hasReachedEnemy) return;

      wave.hitEnemyIds.push(enemy.instanceId);
      dealSpecificEnemyDamage(state, enemy, wave.damage, "Motherslash", events);
      if (enemy.health > 0 && enemy.visible) {
        state.player.meter = Math.min(state.player.maxMeter, state.player.meter + 5);
        applyEnemyChain(enemy, wave.chainTag, wave.chainTag === "Mother Load" ? 5.5 : 4.5);
      }
    });

    if (wave.timer >= wave.duration + 0.18) {
      state.combat.motherslashWaves.splice(index, 1);
    }
  }
}

export function spawnVerdantExplosion(state: GameState, delay = 0) {
  const hasTarget = state.combat.targetLocked
    && state.enemy.visible
    && state.enemy.health > 0
    && state.enemy.state !== "dead";
  const origin = hasTarget ? state.enemy : state.player;

  state.combat.verdantExplosions.push({
    x: origin.x,
    y: origin.y + (hasTarget ? 4 : -12),
    timer: -delay,
    duration: verdantExplosionDuration,
    soundPlayed: false,
  });
}

export function updateVerdantExplosions(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.verdantExplosions.length - 1; index >= 0; index -= 1) {
    const explosion = state.combat.verdantExplosions[index];
    explosion.timer += delta;
    if (!explosion.soundPlayed && explosion.timer >= 0) {
      explosion.soundPlayed = true;
      events.push(soundEvent("warriorVerdantExplosionVoice"), soundEvent("verdantExplosion"));
    }
    if (explosion.timer >= explosion.duration) {
      state.combat.verdantExplosions.splice(index, 1);
    }
  }
}

export function spawnMoonwellBeam(state: GameState, delay = 0) {
  const hasTarget = state.combat.targetLocked
    && state.enemy.visible
    && state.enemy.health > 0
    && state.enemy.state !== "dead";
  const origin = hasTarget ? state.enemy : state.player;

  state.combat.moonwellBeams.push({
    x: origin.x,
    y: origin.y + (hasTarget ? 6 : 18),
    timer: -delay,
    duration: moonwellBeamDuration,
    soundPlayed: false,
  });
}

export function updateMoonwellBeams(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.moonwellBeams.length - 1; index >= 0; index -= 1) {
    const beam = state.combat.moonwellBeams[index];
    beam.timer += delta;
    if (!beam.soundPlayed && beam.timer >= 0) {
      beam.soundPlayed = true;
      events.push(soundEvent("moonwellVoice"), soundEvent("moonwellEffect"));
    }
    if (beam.timer >= beam.duration) {
      state.combat.moonwellBeams.splice(index, 1);
    }
  }
}

export function spawnMoonBurstEffect(state: GameState, target: EnemyState, damage: number) {
  state.combat.moonBurstEffects.push({
    x: target.x,
    y: target.y + 10,
    timer: 0,
    duration: moonBurstDuration,
    damage,
    radius: 118,
    hasHit: false,
  });
}

export function updateMoonBurstEffects(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.moonBurstEffects.length - 1; index >= 0; index -= 1) {
    const burst = state.combat.moonBurstEffects[index];
    burst.timer += delta;

    if (!burst.hasHit && burst.timer >= moonBurstAnimationRate * 5) {
      burst.hasHit = true;
      const hitEnemies = livingEnemies(state).filter((enemy) => distance(burst, enemy) <= burst.radius + enemy.radius);
      if (hitEnemies.length > 0) {
        hitEnemies.forEach((enemy) => {
          dealSpecificEnemyDamage(state, enemy, burst.damage, "Moonveil Flourish", events);
          applyEnemyChain(enemy, "Moonveil", 4.5);
        });
        state.player.meter = Math.min(state.player.maxMeter, state.player.meter + 9);
      } else if (livingEnemies(state).length > 0) {
        events.push(logEvent("Moonveil Flourish missed", "The moons found empty ground"));
      }
    }

    if (burst.timer >= burst.duration) {
      state.combat.moonBurstEffects.splice(index, 1);
    }
  }
}

export function spawnRootbreakerCleave(state: GameState, damage: number) {
  const direction = cardinalDirectionForPlayer(state);
  const forward = vectorForCardinalDirection(direction);
  state.combat.rootbreakerShockwaves.push({
    x: state.player.x + forward.x * 56,
    y: state.player.y + forward.y * 46 + 6,
    vx: forward.x * 560,
    vy: forward.y * 560,
    direction,
    timer: 0,
    duration: rootbreakerShockwaveDuration,
    damage,
    radius: 46,
    hitEnemyIds: [],
    impactSoundPlayed: false,
  });
}

export function spawnThornwallCounter(state: GameState, damage: number) {
  const direction = cardinalDirectionForPlayer(state);
  const forward = vectorForCardinalDirection(direction);
  state.combat.thornwallCounters.push({
    x: state.player.x + forward.x * 62,
    y: state.player.y + forward.y * 42 + 8,
    direction,
    timer: 0,
    duration: thornwallCounterDuration,
    damage,
    radius: 118,
    hitEnemyIds: [],
    bloomSoundPlayed: false,
    retaliateSoundPlayed: false,
  });
}

export function spawnMotherloadBreaker(state: GameState, damage: number, empowered: boolean) {
  const direction = cardinalDirectionForPlayer(state);
  const forward = vectorForCardinalDirection(direction);
  state.combat.motherloadBreakers.push({
    x: state.player.x + forward.x * 74,
    y: state.player.y + forward.y * 48 + 8,
    direction,
    timer: 0,
    duration: motherloadBreakerDuration,
    damage,
    radius: empowered ? 154 : 116,
    empowered,
    hasHit: false,
    hitSoundPlayed: false,
  });
}

export function spawnVerdantGuillotine(state: GameState, target: EnemyState, damage: number) {
  const direction = cardinalDirectionForPlayer(state);
  state.combat.verdantGuillotines.push({
    x: target.x,
    y: target.y + 8,
    direction,
    timer: 0,
    duration: verdantGuillotineDuration,
    damage,
    radius: 118,
    hasHit: false,
    dropSoundPlayed: false,
  });
}

export function clearWarriorSkillEffects(state: GameState) {
  state.combat.rootbreakerShockwaves.length = 0;
  state.combat.thornwallCounters.length = 0;
  state.combat.motherloadBreakers.length = 0;
  state.combat.verdantGuillotines.length = 0;
}

export function updateWarriorSkillEffects(state: GameState, delta: number, events: GameEvent[]) {
  updateRootbreakerShockwaves(state, delta, events);
  updateThornwallCounters(state, delta, events);
  updateMotherloadBreakers(state, delta, events);
  updateVerdantGuillotines(state, delta, events);
}

function updateRootbreakerShockwaves(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.rootbreakerShockwaves.length - 1; index >= 0; index -= 1) {
    const wave = state.combat.rootbreakerShockwaves[index];
    wave.timer += delta;
    wave.x += wave.vx * delta;
    wave.y += wave.vy * delta;

    livingEnemies(state).forEach((enemy) => {
      if (wave.hitEnemyIds.includes(enemy.instanceId)) return;
      if (distance(wave, enemy) > wave.radius + enemy.radius) return;
      wave.hitEnemyIds.push(enemy.instanceId);
      dealSpecificEnemyDamage(state, enemy, wave.damage, "Rootbreaker Cleave", events);
      if (enemy.health > 0 && enemy.visible) {
        applyEnemyChain(enemy, "Rootbreak", 4.5);
        state.player.meter = Math.min(state.player.maxMeter, state.player.meter + 6);
      }
      if (!wave.impactSoundPlayed) {
        wave.impactSoundPlayed = true;
        events.push(soundEvent("rootbreakerImpact"));
      }
    });

    if (wave.timer >= wave.duration) state.combat.rootbreakerShockwaves.splice(index, 1);
  }
}

function updateThornwallCounters(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.thornwallCounters.length - 1; index >= 0; index -= 1) {
    const counter = state.combat.thornwallCounters[index];
    counter.timer += delta;
    if (!counter.bloomSoundPlayed && counter.timer >= 0.14) {
      counter.bloomSoundPlayed = true;
      events.push(soundEvent("thornwallBloom"));
    }

    if (counter.timer >= 0.28) {
      livingEnemies(state).forEach((enemy) => {
        if (counter.hitEnemyIds.includes(enemy.instanceId)) return;
        if (distance(counter, enemy) > counter.radius + enemy.radius) return;
        counter.hitEnemyIds.push(enemy.instanceId);
        dealSpecificEnemyDamage(state, enemy, counter.damage, "Thornwall Counter", events);
        if (enemy.health > 0 && enemy.visible) {
          applyEnemyChain(enemy, "Briar", 4);
          state.player.meter = Math.min(state.player.maxMeter, state.player.meter + 5);
        }
        if (!counter.retaliateSoundPlayed) {
          counter.retaliateSoundPlayed = true;
          events.push(soundEvent("thornwallRetaliate"));
        }
      });
    }

    if (counter.timer >= counter.duration) state.combat.thornwallCounters.splice(index, 1);
  }
}

function updateMotherloadBreakers(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.motherloadBreakers.length - 1; index >= 0; index -= 1) {
    const breaker = state.combat.motherloadBreakers[index];
    breaker.timer += delta;

    if (!breaker.hasHit && breaker.timer >= 0.24) {
      breaker.hasHit = true;
      const hitEnemies = livingEnemies(state).filter((enemy) => distance(breaker, enemy) <= breaker.radius + enemy.radius);
      hitEnemies.forEach((enemy) => {
        dealSpecificEnemyDamage(state, enemy, breaker.damage, breaker.empowered ? "Motherload Breaker Detonation" : "Motherload Breaker", events);
        if (enemy.health > 0 && enemy.visible) applyEnemyChain(enemy, breaker.empowered ? "Mother Load" : "Rootbreak", breaker.empowered ? 5.5 : 4);
      });
      if (hitEnemies.length > 0) state.player.meter = Math.min(state.player.maxMeter, state.player.meter + (breaker.empowered ? 10 : 6));
      events.push(soundEvent(breaker.empowered ? "motherloadBreakerDetonation" : "motherloadBreakerHit"));
    }

    if (breaker.timer >= breaker.duration) state.combat.motherloadBreakers.splice(index, 1);
  }
}

function updateVerdantGuillotines(state: GameState, delta: number, events: GameEvent[]) {
  for (let index = state.combat.verdantGuillotines.length - 1; index >= 0; index -= 1) {
    const guillotine = state.combat.verdantGuillotines[index];
    guillotine.timer += delta;
    if (!guillotine.dropSoundPlayed && guillotine.timer >= 0.18) {
      guillotine.dropSoundPlayed = true;
      events.push(soundEvent("verdantGuillotineDrop"));
    }

    if (!guillotine.hasHit && guillotine.timer >= 0.24) {
      guillotine.hasHit = true;
      const hitEnemies = livingEnemies(state).filter((enemy) => distance(guillotine, enemy) <= guillotine.radius + enemy.radius);
      hitEnemies.forEach((enemy) => {
        dealSpecificEnemyDamage(state, enemy, guillotine.damage, "Verdant Guillotine", events);
        if (enemy.health > 0 && enemy.visible) applyEnemyChain(enemy, "Guillotine", 4.5);
      });
      if (hitEnemies.length > 0) state.player.meter = Math.min(state.player.maxMeter, state.player.meter + 8);
    }

    if (guillotine.timer >= guillotine.duration) state.combat.verdantGuillotines.splice(index, 1);
  }
}

function cardinalDirectionForPlayer(state: GameState): CardinalDirectionName {
  const direction = state.player.direction;
  if (direction === "left" || direction === "right" || direction === "up" || direction === "down") return direction;
  if (direction === "up_left" || direction === "up_right") return "up";
  return "down";
}

function vectorForCardinalDirection(direction: CardinalDirectionName): Vec2 {
  if (direction === "left") return { x: -1, y: 0 };
  if (direction === "right") return { x: 1, y: 0 };
  if (direction === "up") return { x: 0, y: -1 };
  return { x: 0, y: 1 };
}

export function updateMoonfallStrikes(state: GameState, delta: number, events: GameEvent[], moonfallFrameCount: number) {
  for (let index = state.combat.moonfallStrikes.length - 1; index >= 0; index -= 1) {
    const strike = state.combat.moonfallStrikes[index];
    strike.timer += delta;
    const progress = Math.min(strike.timer / strike.duration, 1);
    const finalFrameStart = moonfallFrameCount > 1 ? (moonfallFrameCount - 1) / moonfallFrameCount : 0.78;

    if (!strike.impacted && progress >= 0.78) {
      strike.impacted = true;
      const hitEnemies = livingEnemies(state).filter((enemy) => distance({ x: strike.x, y: strike.targetY }, enemy) <= strike.radius);
      if (hitEnemies.length > 0) {
        hitEnemies.forEach((enemy) => {
          dealSpecificEnemyDamage(state, enemy, strike.damage, "Moonfall", events);
          applyEnemyChain(enemy, "Moonstruck", 5);
        });
      } else if (livingEnemies(state).length > 0) {
        events.push(logEvent("Moonfall missed", "The target slipped away"));
      }
    }

    if (!strike.crashPlayed && progress >= finalFrameStart) {
      strike.crashPlayed = true;
      events.push(soundEvent("moonfallCrash"));
    }

    if (strike.timer >= strike.duration + moonfallImpactDuration) {
      state.combat.moonfallStrikes.splice(index, 1);
    }
  }
}

export function updatePendingMoonfallCast(state: GameState, delta: number) {
  const pendingCast = state.combat.pendingMoonfallCast;
  if (!pendingCast) return;
  pendingCast.timer -= delta;

  if (pendingCast.timer > 0) return;

  state.combat.pendingMoonfallCast = null;
  if (state.player.lifeState !== "alive" || state.enemy.health <= 0 || state.enemy.state === "dead") return;

  state.combat.moonfallStrikes.push({
    x: pendingCast.x,
    startY: pendingCast.y - 430,
    targetY: pendingCast.y,
    timer: 0,
    duration: moonfallStrikeDuration,
    damage: pendingCast.damage,
    radius: pendingCast.radius,
    impacted: false,
    crashPlayed: false,
  });
}

import type { AnimationName, ClassId, DirectionName } from "../../game/types";
import type { PlayerSpriteSet, SpriteFrame } from "./types";
import { loadImage, makeImageFrame, mirrorFrameHorizontally } from "./sprite-loader";

const warriorFrameUrls = import.meta.glob([
  "../../../assets/characters/green_warrior/idle/frames/idle_*_[0-9][0-9].png",
  "../../../assets/characters/green_warrior/walk/frames/walk_*_[0-9][0-9].png",
  "../../../assets/characters/green_warrior/sprint/frames/sprint_*_[0-9][0-9].png",
  "../../../assets/characters/green_warrior/dodge/frames/dodge_*_[0-9][0-9].png",
  "../../../assets/characters/green_warrior/attack/down_slash/frames/attack_*_[0-9][0-9].png",
  "../../../assets/characters/green_warrior/attack/side_slash/{down,left,right,up}/attack_*_[0-9][0-9].png",
  "../../../assets/characters/green_warrior/attack/front_flip_slash/{left,Right}/front_flip_slash-[1-9].png",
  "../../../assets/characters/green_warrior/specials/MotherSpin/frames/special_*_[0-9][0-9].png",
  "../../../assets/characters/green_warrior/abilities/{rootbreaker_cleave,thornwall_counter,motherload_breaker,verdant_guillotine}/cast/frames/{down,left,right,up}/*_[0-9][0-9].png",
], {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const purpleMageFrameUrls = import.meta.glob([
  "../../../assets/characters/purple_mage/idle/frames/idle_*_[0-9][0-9].png",
  "../../../assets/characters/purple_mage/walk/frames/walk_*_[0-9][0-9].png",
  "../../../assets/characters/purple_mage/walk_v2/frames/walk_v2_*_[0-9][0-9].png",
  "../../../assets/characters/purple_mage/sprint/frames/sprint_*_[0-9][0-9].png",
  "../../../assets/characters/purple_mage/dodge/frames/dodge_*_[0-9][0-9].png",
  "../../../assets/characters/purple_mage/attack/frames/attack_*_[0-9][0-9].png",
  "../../../assets/characters/purple_mage/special_cast/frames/special_cast_*_[0-9][0-9].png",
  "../../../assets/characters/purple_mage/spin_cast/frames/spin_cast_*_[0-9][0-9].png",
], {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const clericFrameUrls = import.meta.glob([
  "../../../assets/characters/cleric/idle/frames/idle_*_[0-9][0-9].png",
  "../../../assets/characters/cleric/walk/frames/walk_*_[0-9][0-9].png",
  "../../../assets/characters/cleric/sprint/frames/sprint_*_[0-9][0-9].png",
  "../../../assets/characters/cleric/dodge/frames/dodge_*_[0-9][0-9].png",
  "../../../assets/characters/cleric/spell_cast_2/frames/spell_cast_2_*_[0-9][0-9].png",
  "../../../assets/characters/cleric/special_cast/frames/special_cast_*_[0-9][0-9].png",
], {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

export const warriorDirections = ["down", "down_right", "right", "up_right", "up", "up_left", "left", "down_left"] as const satisfies readonly DirectionName[];

type FrameUrlResolution = {
  urls: string[];
  mirrorX?: boolean;
};

const purpleMageDirectionAssets: Record<DirectionName, string> = {
  down: "south",
  down_right: "southeast",
  right: "east",
  up_right: "northeast",
  up: "north",
  up_left: "northwest",
  left: "west",
  down_left: "southwest",
};

const purpleMageIdleDirectionFallbackAssets: Record<DirectionName, "south" | "east" | "north" | "west"> = {
  down: "south",
  down_right: "south",
  right: "east",
  up_right: "north",
  up: "north",
  up_left: "north",
  left: "west",
  down_left: "south",
};

const purpleMageSpinCastFallbackAssets: Record<DirectionName, "south" | "east" | "north" | "west"> = {
  down: "south",
  down_right: "south",
  right: "east",
  up_right: "north",
  up: "north",
  up_left: "north",
  left: "west",
  down_left: "west",
};

const clericCardinalDirectionFallbackAssets: Record<DirectionName, "south" | "east" | "north" | "west"> = {
  down: "south",
  down_right: "south",
  right: "east",
  up_right: "north",
  up: "north",
  up_left: "north",
  left: "west",
  down_left: "south",
};

const warriorAnimationPaths = {
  idle: "idle",
  walk: "walk",
  run: "sprint",
  sprint: "sprint",
  dodge_roll: "dodge",
  attack1: "attack",
  attack1_side_slash: "side_slash",
  front_flip_slash: "front_flip_slash",
  rootbreaker_cleave: "ability:rootbreaker_cleave",
  thornwall_counter: "ability:thornwall_counter",
  motherload_breaker: "ability:motherload_breaker",
  verdant_guillotine: "ability:verdant_guillotine",
  attack2: "special",
} as const satisfies Record<Exclude<AnimationName, "damage" | "victory">, string>;

const warriorSpecialDirectionFallbacks: Partial<Record<DirectionName, DirectionName>> = {
  down_left: "down",
  down_right: "down",
  up_left: "up",
  up_right: "up",
};

const warriorCardinalDirectionFallbacks: Partial<Record<DirectionName, DirectionName>> = {
  down_left: "down",
  down_right: "down",
  up_left: "up",
  up_right: "up",
};

export async function loadPlayerSprites(classIds?: readonly ClassId[]): Promise<Partial<Record<ClassId, PlayerSpriteSet>>> {
  const loadAll = !classIds;
  const requested = new Set<ClassId>(classIds ?? ["warrior", "mage", "cleric"]);
  if (requested.has("cleric")) requested.add("warrior");

  const [warriorSprites, mageSprites] = await Promise.all([
    loadAll || requested.has("warrior") ? loadWarriorSprites() : Promise.resolve(null),
    loadAll || requested.has("mage") ? loadPurpleMageSprites() : Promise.resolve(null),
  ]);
  const clericSprites = loadAll || requested.has("cleric")
    ? await loadClericSprites(warriorSprites ?? await loadWarriorSprites())
    : null;

  return {
    ...(warriorSprites ? { warrior: warriorSprites } : {}),
    ...(clericSprites ? { cleric: clericSprites } : {}),
    ...(mageSprites ? { mage: mageSprites } : {}),
  };
}

async function loadWarriorSprites(): Promise<PlayerSpriteSet> {
  const output = {} as PlayerSpriteSet;
  const animations = ["idle", "walk", "sprint", "dodge_roll", "attack1", "attack1_side_slash", "front_flip_slash", "rootbreaker_cleave", "thornwall_counter", "motherload_breaker", "verdant_guillotine", "attack2"] as const satisfies readonly AnimationName[];

  await Promise.all(warriorDirections.map(async (direction) => {
    output[direction] = {} as Record<AnimationName, SpriteFrame[]>;
    await Promise.all(animations.map(async (animation) => {
      const urls = getWarriorFrameUrls(direction, animation);
      const frames = await Promise.all(urls.map(async (url) => makeImageFrame(await loadImage(url))));
      output[direction][animation] = frames;
    }));
    output[direction].run = output[direction].sprint;
    output[direction].damage = output[direction].idle;
    output[direction].victory = output[direction].idle;
  }));

  return output;
}

async function loadPurpleMageSprites(): Promise<PlayerSpriteSet> {
  const output = {} as PlayerSpriteSet;
  const animations = ["idle", "walk", "sprint", "dodge_roll", "attack1", "attack1_side_slash", "front_flip_slash", "attack2"] as const satisfies readonly AnimationName[];

  await Promise.all(warriorDirections.map(async (direction) => {
    output[direction] = {} as Record<AnimationName, SpriteFrame[]>;
    await Promise.all(animations.map(async (animation) => {
      const source = getPurpleMageFrameSource(direction, animation);
      const frames = await Promise.all(source.urls.map(async (url) => makeImageFrame(await loadImage(url))));
      output[direction][animation] = source.mirrorX ? frames.map(mirrorFrameHorizontally) : frames;
    }));
    output[direction].run = output[direction].sprint;
    output[direction].damage = output[direction].idle;
    output[direction].victory = output[direction].idle;
  }));

  return output;
}

async function loadClericSprites(fallbackSprites: PlayerSpriteSet): Promise<PlayerSpriteSet> {
  const output = {} as PlayerSpriteSet;

  await Promise.all(warriorDirections.map(async (direction) => {
    output[direction] = { ...fallbackSprites[direction] } as Record<AnimationName, SpriteFrame[]>;
    await Promise.all((["idle", "walk", "sprint", "dodge_roll", "attack1", "attack1_side_slash", "attack2"] as const).map(async (animation) => {
      const source = getClericFrameSource(direction, animation);
      if (source.length === 0) return;
      output[direction][animation] = await Promise.all(source.map(async (url) => makeImageFrame(await loadImage(url))));
    }));
    output[direction].run = output[direction].sprint;
  }));

  return output;
}

function getWarriorFrameUrls(direction: DirectionName, animation: AnimationName): string[] {
  if (animation === "damage" || animation === "victory") return [];

  const assetAnimation = warriorAnimationPaths[animation];
  if (animation === "idle") {
    const idleDirection = warriorIdleDirectionFor(direction);
    return findWarriorFrameUrls(assetAnimation, idleDirection);
  }

  const urls = findWarriorFrameUrls(assetAnimation, direction);

  if (urls.length > 0) return urls;

  if (animation === "walk") {
    const walkDirection = warriorCardinalDirectionFallbacks[direction];
    const walkFallbackUrls = walkDirection ? findWarriorFrameUrls("walk", walkDirection) : [];
    if (walkFallbackUrls.length > 0) {
      console.warn(`Missing green_warrior walk/${direction}; using ${walkDirection} four-direction walk frames.`);
      return walkFallbackUrls;
    }

    const sprintFallbackUrls = findWarriorFrameUrls("sprint", direction);
    if (sprintFallbackUrls.length > 0) {
      console.warn(`Missing green_warrior walk/${direction}; using sprint frames until that four-direction walk direction is exported.`);
      return sprintFallbackUrls;
    }
  }

  if (animation === "dodge_roll") {
    const dodgeDirection = warriorCardinalDirectionFallbacks[direction];
    const dodgeFallbackUrls = dodgeDirection ? findWarriorFrameUrls("dodge", dodgeDirection) : [];
    if (dodgeFallbackUrls.length > 0) {
      console.warn(`Missing green_warrior ${assetAnimation}/${direction}; using ${dodgeDirection} four-direction dodge frames.`);
      return dodgeFallbackUrls;
    }

    const fallbackUrls = findWarriorFrameUrls("sprint", direction);
    if (fallbackUrls.length > 0) {
      console.warn(`Missing green_warrior ${assetAnimation}/${direction}; using sprint frames until dodge is exported.`);
      return fallbackUrls;
    }
  }

  if (animation === "attack1") {
    const attackDirection = warriorCardinalDirectionFallbacks[direction];
    const attackFallbackUrls = attackDirection ? findWarriorFrameUrls("attack", attackDirection) : [];
    if (attackFallbackUrls.length > 0) {
      console.warn(`Missing green_warrior ${assetAnimation}/${direction}; using ${attackDirection} four-direction attack frames.`);
      return attackFallbackUrls;
    }
  }

  if (animation === "attack1_side_slash") {
    const sideSlashDirection = warriorCardinalDirectionFallbacks[direction];
    const sideSlashFallbackUrls = sideSlashDirection ? findWarriorFrameUrls("side_slash", sideSlashDirection) : [];
    if (sideSlashFallbackUrls.length > 0) {
      console.warn(`Missing green_warrior ${assetAnimation}/${direction}; using ${sideSlashDirection} four-direction side slash frames.`);
      return sideSlashFallbackUrls;
    }

    const attackDirection = warriorCardinalDirectionFallbacks[direction];
    const attackFallbackUrls = attackDirection ? findWarriorFrameUrls("attack", attackDirection) : findWarriorFrameUrls("attack", direction);
    if (attackFallbackUrls.length > 0) {
      console.warn(`Missing green_warrior ${assetAnimation}/${direction}; using original attack frames.`);
      return attackFallbackUrls;
    }
  }

  if (animation === "front_flip_slash") {
    const frontFlipDirection = frontFlipSlashDirection(direction);
    const frontFlipUrls = findWarriorFrameUrls("front_flip_slash", frontFlipDirection);
    if (frontFlipUrls.length > 0) return frontFlipUrls;
  }

  if (animation === "sprint" || animation === "run") {
    const fallbackUrls = findWarriorFrameUrls("walk", direction);
    if (fallbackUrls.length > 0) {
      console.warn(`Missing green_warrior ${assetAnimation}/${direction}; using walk frames until that sprint direction is exported.`);
      return fallbackUrls;
    }
  }

  if (animation === "rootbreaker_cleave" || animation === "thornwall_counter" || animation === "motherload_breaker" || animation === "verdant_guillotine") {
    const abilityDirection = warriorCardinalDirectionFallbacks[direction] ?? direction;
    const abilityUrls = findWarriorFrameUrls(assetAnimation, abilityDirection);
    if (abilityUrls.length > 0) return abilityUrls;
  }

  if (animation === "attack2") {
    const specialDirection = warriorSpecialDirectionFallbacks[direction];
    const specialFallbackUrls = specialDirection ? findWarriorFrameUrls("special", specialDirection) : [];
    if (specialFallbackUrls.length > 0) {
      console.warn(`Missing green_warrior ${assetAnimation}/${direction}; using ${specialDirection} special frames.`);
      return specialFallbackUrls;
    }

    const downSpecialUrls = findWarriorFrameUrls("special", "down");
    if (downSpecialUrls.length > 0) {
      console.warn(`Missing green_warrior ${assetAnimation}/${direction}; using down spinning special frames.`);
      return downSpecialUrls;
    }

    const fallbackUrls = findWarriorFrameUrls("attack", direction);
    if (fallbackUrls.length > 0) {
      console.warn(`Missing green_warrior ${assetAnimation}/${direction}; using attack frames until that special direction is exported.`);
      return fallbackUrls;
    }
  }

  throw new Error(`Missing green_warrior frames for ${direction}/${animation}. Expected canonical ${assetAnimation}_${direction}_NN.png files.`);
}

function findWarriorFrameUrls(assetAnimation: string, direction: DirectionName): string[] {
  const prefix = warriorFramePrefix(assetAnimation, direction);
  return Object.entries(warriorFrameUrls)
    .filter(([path]) => path.includes(prefix) && warriorFramePathMatches(assetAnimation, direction, path))
    .sort(([left], [right]) => warriorFrameSortValue(left) - warriorFrameSortValue(right))
    .map(([, url]) => url);
}

function warriorFramePathMatches(assetAnimation: string, direction: DirectionName, path: string) {
  if (assetAnimation.startsWith("ability:")) {
    const ability = assetAnimation.slice("ability:".length);
    return new RegExp(`${ability}_${direction}_\\d{2}\\.png$`).test(path);
  }
  if (assetAnimation === "front_flip_slash") return /front_flip_slash-\d+\.png$/.test(path);
  const frameName = assetAnimation === "side_slash" ? "attack" : assetAnimation;
  return new RegExp(`${frameName}_${direction}_\\d{2}\\.png$`).test(path);
}

function warriorFrameSortValue(path: string) {
  const match = path.match(/(?:_|-)(\d+)\.png$/);
  return match ? Number(match[1]) : 0;
}

function warriorFramePrefix(assetAnimation: string, direction: DirectionName) {
  if (assetAnimation.startsWith("ability:")) {
    const ability = assetAnimation.slice("ability:".length);
    return `/assets/characters/green_warrior/abilities/${ability}/cast/frames/${direction}/${ability}_${direction}_`;
  }

  if (assetAnimation === "attack") {
    return `/assets/characters/green_warrior/attack/down_slash/frames/attack_${direction}_`;
  }

  if (assetAnimation === "side_slash") {
    return `/assets/characters/green_warrior/attack/side_slash/${direction}/attack_${direction}_`;
  }

  if (assetAnimation === "front_flip_slash") {
    return `/assets/characters/green_warrior/attack/front_flip_slash/${direction === "left" ? "left" : "Right"}/front_flip_slash-`;
  }

  if (assetAnimation === "special") {
    return `/assets/characters/green_warrior/specials/MotherSpin/frames/special_${direction}_`;
  }

  return `/assets/characters/green_warrior/${assetAnimation}/frames/${assetAnimation}_${direction}_`;
}

function frontFlipSlashDirection(direction: DirectionName): "left" | "right" {
  return direction === "left" || direction === "up_left" || direction === "down_left" ? "left" : "right";
}

function warriorIdleDirectionFor(direction: DirectionName): DirectionName {
  if (direction === "up_left" || direction === "up_right") return "up";
  if (direction === "down_left" || direction === "down_right") return "down";
  return direction;
}

function getPurpleMageFrameSource(direction: DirectionName, animation: AnimationName): FrameUrlResolution {
  const assetDirection = purpleMageDirectionAssets[direction];

  if (animation === "idle" || animation === "damage" || animation === "victory") {
    const directionalIdleUrls = findPurpleMageFrameUrls("idle", assetDirection);
    if (directionalIdleUrls.length > 0) return { urls: directionalIdleUrls };
    return { urls: findPurpleMageFrameUrls("idle", purpleMageIdleDirectionFallbackAssets[direction]) };
  }

  if (animation === "walk") {
    const walkV2Urls = findPurpleMageFrameUrls("walk_v2", assetDirection);
    if (walkV2Urls.length > 0) return { urls: walkV2Urls };
    return { urls: findPurpleMageFrameUrls("walk", assetDirection) };
  }

  if (animation === "sprint" || animation === "run") {
    const sprintUrls = findPurpleMageFrameUrls("sprint", assetDirection);
    if (sprintUrls.length > 0) return { urls: sprintUrls };
    if (assetDirection === "southwest") {
      const mirroredSoutheastUrls = findPurpleMageFrameUrls("sprint", "southeast");
      if (mirroredSoutheastUrls.length > 0) return { urls: mirroredSoutheastUrls, mirrorX: true };
    }
    const walkV2Urls = findPurpleMageFrameUrls("walk_v2", assetDirection);
    if (walkV2Urls.length > 0) return { urls: walkV2Urls };
    return { urls: findPurpleMageFrameUrls("walk", assetDirection) };
  }

  if (animation === "dodge_roll") {
    const dodgeUrls = findPurpleMageFrameUrls("dodge", assetDirection);
    if (dodgeUrls.length > 0) return { urls: dodgeUrls };
    return { urls: findPurpleMageFrameUrls("sprint", assetDirection) };
  }

  if (animation === "attack1" || animation === "attack1_side_slash" || animation === "front_flip_slash") {
    return { urls: findPurpleMageFrameUrls("attack", assetDirection) };
  }

  if (animation === "attack2") {
    const spinCastUrls = findPurpleMageFrameUrls("spin_cast", assetDirection);
    if (spinCastUrls.length > 0) return { urls: spinCastUrls };
    const spinCastFallbackUrls = findPurpleMageFrameUrls("spin_cast", purpleMageSpinCastFallbackAssets[direction]);
    if (spinCastFallbackUrls.length > 0) return { urls: spinCastFallbackUrls };
    const specialCastUrls = findPurpleMageFrameUrls("special_cast", assetDirection);
    if (specialCastUrls.length > 0) return { urls: specialCastUrls };
    return { urls: findPurpleMageFrameUrls("attack", assetDirection) };
  }

  throw new Error(`Missing purple_mage frames for ${direction}/${animation}.`);
}

function getClericFrameSource(direction: DirectionName, animation: "idle" | "walk" | "sprint" | "dodge_roll" | "attack1" | "attack1_side_slash" | "attack2"): string[] {
  const assetDirection = clericCardinalDirectionFallbackAssets[direction];
  const assetAnimation = animation === "dodge_roll"
    ? "dodge"
    : animation === "attack2"
      ? "special_cast"
      : animation === "attack1" || animation === "attack1_side_slash"
      ? "spell_cast_2"
      : animation;
  return findClericFrameUrls(assetAnimation, assetDirection);
}

function findClericFrameUrls(assetAnimation: "idle" | "walk" | "sprint" | "dodge" | "spell_cast_2" | "special_cast", assetDirection: "south" | "east" | "north" | "west"): string[] {
  const prefix = `/assets/characters/cleric/${assetAnimation}/frames/${assetAnimation}_${assetDirection}_`;
  return Object.entries(clericFrameUrls)
    .filter(([path]) => path.includes(prefix) && /^\d{2}\.png$/.test(path.slice(path.lastIndexOf("_") + 1)))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, url]) => url);
}

function findPurpleMageFrameUrls(assetAnimation: "idle" | "walk" | "walk_v2" | "sprint" | "dodge" | "attack" | "special_cast" | "spin_cast", assetDirection: string): string[] {
  const prefix = `/assets/characters/purple_mage/${assetAnimation}/frames/${assetAnimation}_${assetDirection}_`;
  return Object.entries(purpleMageFrameUrls)
    .filter(([path]) => path.includes(prefix) && /^\d{2}\.png$/.test(path.slice(path.lastIndexOf("_") + 1)))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, url]) => url);
}

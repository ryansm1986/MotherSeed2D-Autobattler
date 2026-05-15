import type { DirectionName, MonsterAnimationName, MonsterId } from "../../game/types";
import { loadImage, makeImageFrame } from "./sprite-loader";
import type { MonsterSpriteCatalog, MonsterSpriteSet } from "./types";
import { warriorDirections } from "./character-sprites";

const monsterFrameUrls = import.meta.glob([
  "../../../assets/monsters/moss_golem_v2/*/frames/*.png",
  "../../../assets/monsters/tree_goblin/*/frames/*.png",
  "../../../assets/monsters/tree_goblin/*/frames/*/*.png",
  "../../../assets/monsters/shroom_boy/*/frames/*.png",
  "../../../assets/monsters/nightbloom_matriarch/*/frames/*.png",
  "../../../assets/monsters/nightbloom_matriarch/*/frames/*/*.png",
  "../../../assets/monsters/obsidian_reliquary/*/frames/*.png",
  "../../../assets/monsters/obsidian_reliquary/*/frames/*/*.png",
  "../../../assets/monsters/abyssal_bellwraith/*/frames/*.png",
  "../../../assets/monsters/abyssal_bellwraith/*/frames/*/*.png",
  "../../../assets/monsters/briarheart_sovereign/*/frames/*.png",
  "../../../assets/monsters/briarheart_sovereign/*/frames/*/*.png",
  "../../../assets/monsters/woundclock_arbiter/*/frames/*.png",
  "../../../assets/monsters/woundclock_arbiter/*/frames/*/*.png",
], {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const monsterSubjects = {
  moss_golem: "moss_golem_v2",
  tree_goblin: "tree_goblin",
  shroom_boy: "shroom_boy",
  nightbloom_matriarch: "nightbloom_matriarch",
  obsidian_reliquary: "obsidian_reliquary",
  abyssal_bellwraith: "abyssal_bellwraith",
  briarheart_sovereign: "briarheart_sovereign",
  woundclock_arbiter: "woundclock_arbiter",
} as const satisfies Record<MonsterId, string>;

export async function loadMonsterSprites(monsterIds?: readonly MonsterId[]): Promise<MonsterSpriteCatalog> {
  const catalog = {} as MonsterSpriteCatalog;
  const monstersToLoad = monsterIds
    ? (Object.keys(monsterSubjects) as MonsterId[]).filter((monsterId) => monsterIds.includes(monsterId))
    : Object.keys(monsterSubjects) as MonsterId[];
  const animations = [
    "idle",
    "walk",
    "run",
    "rock_slam",
    "rock_spray",
    "rock_throw",
    "bite",
    "cast",
    "thorn_lance",
    "petal_fan",
    "root_snare",
    "nova",
    "phase_bloom",
    "phase_rupture",
    "phase_toll",
    "death",
  ] as const satisfies readonly MonsterAnimationName[];

  await Promise.all(monstersToLoad.map(async (monsterId) => {
    const output = {} as MonsterSpriteSet;
    await Promise.all(warriorDirections.map(async (direction) => {
      output[direction] = {} as Record<MonsterAnimationName, ReturnType<typeof makeImageFrame>[]>;
      await Promise.all(animations.map(async (animation) => {
        const urls = getMonsterFrameUrls(monsterId, direction, animation);
        output[direction][animation] = await Promise.all(urls.map(async (url) => makeImageFrame(await loadImage(url))));
      }));
    }));
    catalog[monsterId] = output;
  }));

  return catalog;
}

function getMonsterFrameUrls(monsterId: MonsterId, direction: DirectionName, animation: MonsterAnimationName): string[] {
  if (monsterId === "nightbloom_matriarch") return getNightbloomFrameUrls(direction, animation);
  if (monsterId === "obsidian_reliquary") return getObsidianFrameUrls(direction, animation);
  if (monsterId === "abyssal_bellwraith") return getAbyssalFrameUrls(direction, animation);
  if (monsterId === "briarheart_sovereign") return getBriarheartFrameUrls(direction, animation);
  if (monsterId === "woundclock_arbiter") return getWoundclockFrameUrls(direction, animation);
  if (monsterId === "moss_golem") return getMossGolemFrameUrls(direction, animation);

  const animationCandidates = monsterAnimationCandidates(monsterId, animation);
  for (const assetAnimation of animationCandidates) {
    const urls = findMonsterV2FrameUrls(monsterSubjects[monsterId], assetAnimation, direction);
    if (urls.length > 0) return urls;
  }

  return getMossGolemFrameUrls(direction, animation);
}

function getWoundclockFrameUrls(direction: DirectionName, animation: MonsterAnimationName): string[] {
  const assetAnimation = animation === "run" || animation === "walk"
    ? "idle"
    : animation === "death"
      ? "death"
      : animation === "phase_bloom" || animation === "phase_rupture" || animation === "phase_toll"
        ? "phase_zero"
        : animation === "idle"
          ? "idle"
          : "cast";
  const candidates = assetAnimation === "death" || assetAnimation === "phase_zero"
    ? ["down"]
    : [cardinalGameDirectionFor(direction), "down"];

  for (const candidate of new Set(candidates)) {
    const urls = findMonsterFrameUrls("woundclock_arbiter", assetAnimation, candidate);
    if (urls.length > 0) return urls;
  }

  const fallback = findMonsterFrameUrls("woundclock_arbiter", "idle", "down");
  if (fallback.length > 0) return fallback;
  return getMossGolemFrameUrls(direction, "idle");
}

function getBriarheartFrameUrls(direction: DirectionName, animation: MonsterAnimationName): string[] {
  const assetAnimation = animation === "run"
    ? "walk"
    : animation === "death"
      ? "death"
      : animation === "phase_bloom" || animation === "phase_rupture" || animation === "phase_toll"
        ? "phase_bloom"
        : animation === "idle" || animation === "walk"
          ? animation
          : "cast";
  const cardinalDirection = cardinalGameDirectionFor(direction);
  const candidates = assetAnimation === "death" || assetAnimation === "phase_bloom"
    ? ["down"]
    : [cardinalDirection, direction, compassDirectionFor(direction)];

  for (const candidate of new Set(candidates)) {
    const urls = findMonsterFrameUrls("briarheart_sovereign", assetAnimation, candidate);
    if (urls.length > 0) return urls;
  }

  const fallback = findMonsterFrameUrls("briarheart_sovereign", "idle", cardinalDirection);
  if (fallback.length > 0) return fallback;
  return getMossGolemFrameUrls(direction, "idle");
}

function getAbyssalFrameUrls(direction: DirectionName, animation: MonsterAnimationName): string[] {
  const assetAnimation = animation === "run" || animation === "walk"
    ? "idle"
    : animation === "death" || animation === "phase_toll" || animation === "phase_bloom" || animation === "phase_rupture"
      ? "death"
      : animation === "idle"
        ? "idle"
        : "cast";
  const cardinalDirection = cardinalGameDirectionFor(direction);
  const candidates = assetAnimation === "death"
    ? ["down"]
    : [cardinalDirection, "down"];

  for (const candidate of new Set(candidates)) {
    const urls = findMonsterFrameUrls("abyssal_bellwraith", assetAnimation, candidate);
    if (urls.length > 0) return urls;
  }

  const fallback = findMonsterFrameUrls("abyssal_bellwraith", "idle", "down");
  if (fallback.length > 0) return fallback;
  return getMossGolemFrameUrls(direction, "idle");
}

function getObsidianFrameUrls(direction: DirectionName, animation: MonsterAnimationName): string[] {
  const assetAnimation = animation === "run"
    ? "walk"
    : animation === "phase_bloom"
      ? "phase_rupture"
      : animation === "rock_slam" || animation === "rock_spray" || animation === "rock_throw" || animation === "bite" || animation === "thorn_lance" || animation === "petal_fan" || animation === "root_snare" || animation === "nova"
        ? "cast"
        : animation;
  const cardinalDirection = cardinalGameDirectionFor(direction);
  const candidates = assetAnimation === "death" || assetAnimation === "phase_rupture"
    ? ["down"]
    : [cardinalDirection, direction, compassDirectionFor(direction)];

  for (const candidate of new Set(candidates)) {
    const urls = findMonsterFrameUrls("obsidian_reliquary", assetAnimation, candidate);
    if (urls.length > 0) return urls;
  }

  const fallback = findMonsterFrameUrls("obsidian_reliquary", "idle", cardinalDirection);
  if (fallback.length > 0) return fallback;
  return getMossGolemFrameUrls(direction, "idle");
}

function getMossGolemFrameUrls(direction: DirectionName, animation: MonsterAnimationName): string[] {
  const animationCandidates = animation === "idle"
    ? ["idle_v2"]
    : animation === "death"
      ? ["death"]
    : animation === "run"
      ? ["run", "walk"]
    : animation === "bite"
      ? ["rock_slam"]
      : animation === "rock_slam" || animation === "rock_spray" || animation === "rock_throw"
        ? [animation]
        : ["idle_v2"];

  for (const assetAnimation of animationCandidates) {
    const urls = findMonsterV2FrameUrls("moss_golem_v2", assetAnimation, direction);
    if (urls.length > 0) return urls;
  }

  throw new Error(`Missing exported moss_golem_v2 frames for ${direction}/${animation}.`);
}

function getNightbloomFrameUrls(direction: DirectionName, animation: MonsterAnimationName): string[] {
  const assetAnimation = animation === "run"
    ? "walk"
    : animation === "rock_slam" || animation === "rock_spray" || animation === "rock_throw" || animation === "bite" || animation === "cast"
      ? "cast"
      : animation;
  const cardinalDirection = cardinalGameDirectionFor(direction);
  const candidates = assetAnimation === "death" || assetAnimation === "phase_bloom"
    ? ["down"]
    : [cardinalDirection, direction, compassDirectionFor(direction)];

  for (const candidate of new Set(candidates)) {
    const urls = findMonsterFrameUrls("nightbloom_matriarch", assetAnimation, candidate);
    if (urls.length > 0) return urls;
  }

  const fallback = findMonsterFrameUrls("nightbloom_matriarch", "idle", cardinalDirection);
  if (fallback.length > 0) return fallback;
  return getMossGolemFrameUrls(direction, "idle");
}

function monsterAnimationCandidates(monsterId: MonsterId, animation: MonsterAnimationName): string[] {
  if (animation === "idle") return ["idle"];
  if (animation === "death") return ["death"];
  if (animation === "walk" || animation === "run") return ["walk", "idle"];
  if (monsterId === "tree_goblin") {
    if (animation === "rock_throw") return ["head_throw", "attack"];
    return ["attack"];
  }
  if (monsterId === "shroom_boy" && animation === "rock_throw") return ["mouth_throw", "poison_spray"];
  if (monsterId === "shroom_boy" && animation === "bite") return ["bite", "poison_spray"];
  if (animation === "rock_spray") return ["poison_spray"];
  return ["poison_spray", "walk", "idle"];
}

function findMonsterV2FrameUrls(subject: string, animation: string, direction: DirectionName): string[] {
  const candidates = animation === "rock_spray"
    ? [compassDirectionFor(direction), direction]
    : animation === "death"
      ? [compassDirectionFor(direction), "south"]
    : animation === "rock_throw" || animation === "mouth_throw"
      ? [direction, compassDirectionFor(direction), cardinalCompassDirectionFor(direction)]
      : animation === "bite"
        ? [direction, compassDirectionFor(direction), cardinalCompassDirectionFor(direction)]
    : [direction, compassDirectionFor(direction)];

  for (const candidate of new Set(candidates)) {
    const urls = findMonsterFrameUrls(subject, animation, candidate);
    if (urls.length > 0) return urls;
  }

  return [];
}

function findMonsterFrameUrls(subject: string, animation: string, direction: string): string[] {
  const prefixes = [
    `/assets/monsters/${subject}/${animation}/frames/${animation}_${direction}_`,
    `/assets/monsters/${subject}/${animation}/frames/${animation}_v2_${direction}_`,
    `/assets/monsters/${subject}/${animation}/frames/${direction}/${animation}_${direction}_`,
    `/assets/monsters/${subject}/${animation}/frames/${direction}/${animation}_v2_${direction}_`,
  ];
  return Object.entries(monsterFrameUrls)
    .filter(([path]) => prefixes.some((prefix) => path.includes(prefix)) && /^\d{2}\.png$/.test(path.slice(path.lastIndexOf("_") + 1)))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, url]) => url);
}

export function compassDirectionFor(direction: DirectionName): string {
  if (direction === "down") return "south";
  if (direction === "down_right") return "southeast";
  if (direction === "right") return "east";
  if (direction === "up_right") return "northeast";
  if (direction === "up") return "north";
  if (direction === "up_left") return "northwest";
  if (direction === "left") return "west";
  return "southwest";
}

function cardinalCompassDirectionFor(direction: DirectionName): string {
  if (direction === "left") return "west";
  if (direction === "right") return "east";
  if (direction === "up" || direction === "up_left" || direction === "up_right") return "north";
  return "south";
}

function cardinalGameDirectionFor(direction: DirectionName): "down" | "left" | "right" | "up" {
  if (direction === "left" || direction === "up_left") return "left";
  if (direction === "right" || direction === "up_right") return "right";
  if (direction === "up") return "up";
  return "down";
}

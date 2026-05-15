import rpgAssetsUrl from "../../../assets/RPGAssets.png?url";
import largeGrassTerrainUrl from "../../../assets/world/terrain/large_grass.png?url";
import dungeonTreeRoomUrl from "../../../assets/world/dungeon/tree/tree_base.png?url";
import magicMissileUrl from "../../../assets/characters/purple_mage/projectiles/magic_missile/magic_missile.png?url";
import moonfallUrl from "../../../assets/characters/purple_mage/spells/moonfall/moonfall.png?url";
import codgerIdleSheetUrl from "../../../assets/characters/codger/idle_bird_then_laugh_hold_sprite/sheet-transparent-1x10.png?url";
import { worldAssetRects } from "../../game/content/world-assets";
import type { CardinalDirectionName, ClassId, FrameRect, MonsterId, WorldAssetName } from "../../game/types";
import { loadMonsterSprites } from "./monster-sprites";
import { loadPlayerSprites } from "./character-sprites";
import type { AnimationFrameLookup, RenderAssets, SpriteBounds, SpriteFrame } from "./types";

const grassTerrainPropUrls = import.meta.glob("../../../assets/world/terrain/rpg_grass_source/props/*.png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const animatedGrassFrameUrls = import.meta.glob("../../../assets/world/grass/frames/*.png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const magicMissileFrameUrls = import.meta.glob("../../../assets/characters/purple_mage/projectiles/magic_missile/frames/magic_missile_left_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const clericFireballFrameUrls = import.meta.glob("../../../assets/characters/cleric/projectiles/fireball/frames/cleric_fireball_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const moonfallFrameUrls = import.meta.glob("../../../assets/characters/purple_mage/spells/moonfall/frames/moonfall_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const enemyRockThrowFrameUrls = import.meta.glob("../../../assets/projectiles/boulder/boulder-rotate-[0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const poisonCloudFrameUrls = import.meta.glob("../../../assets/monsters/shroom_boy/projectiles/poison_cloud/frames/poison_cloud_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const shroomlingFrameUrls = import.meta.glob("../../../assets/monsters/shroom_boy/projectiles/tiny_waddle_chomp/frames/*/tiny_waddle_chomp_*_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const spinningHeadFrameUrls = import.meta.glob("../../../assets/monsters/tree_goblin/projectiles/spinning_head/frames/spinning_head_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const nightbloomThornFrameUrls = import.meta.glob("../../../assets/monsters/nightbloom_matriarch/thorn_lance_projectile/frames/thorn_lance_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const nightbloomPetalFrameUrls = import.meta.glob("../../../assets/monsters/nightbloom_matriarch/petal_shard_projectile/frames/petal_shard_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const nightbloomRootBurstFrameUrls = import.meta.glob("../../../assets/monsters/nightbloom_matriarch/root_burst_effect/frames/root_burst_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const nightbloomNovaFrameUrls = import.meta.glob("../../../assets/monsters/nightbloom_matriarch/nightbloom_nova_effect/frames/nightbloom_nova_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const nightbloomPetalImpactFrameUrls = import.meta.glob("../../../assets/monsters/nightbloom_matriarch/petal_impact_effect/frames/petal_impact_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const obsidianLanceFrameUrls = import.meta.glob("../../../assets/monsters/obsidian_reliquary/glass_lance_projectile/frames/glass_lance_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const obsidianShardFrameUrls = import.meta.glob("../../../assets/monsters/obsidian_reliquary/spiral_shard_projectile/frames/spiral_shard_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const obsidianSmiteFrameUrls = import.meta.glob("../../../assets/monsters/obsidian_reliquary/smite_impact_effect/frames/smite_impact_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const obsidianWheelFrameUrls = import.meta.glob("../../../assets/monsters/obsidian_reliquary/wheel_nova_effect/frames/wheel_nova_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const abyssalBellShardFrameUrls = import.meta.glob("../../../assets/monsters/abyssal_bellwraith/bell_shard_projectile/frames/bell_shard_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const abyssalTollImpactFrameUrls = import.meta.glob("../../../assets/monsters/abyssal_bellwraith/bell_toll_impact/frames/bell_toll_impact_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const abyssalNovaFrameUrls = import.meta.glob("../../../assets/monsters/abyssal_bellwraith/bell_toll_nova/frames/bell_toll_nova_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const briarheartSkewerFrameUrls = import.meta.glob("../../../assets/monsters/briarheart_sovereign/briar_skewer_projectile/frames/briar_skewer_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const briarheartSeedFrameUrls = import.meta.glob("../../../assets/monsters/briarheart_sovereign/cursed_seed_projectile/frames/cursed_seed_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const briarheartVineFrameUrls = import.meta.glob("../../../assets/monsters/briarheart_sovereign/vine_eruption_effect/frames/vine_eruption_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const briarheartNovaFrameUrls = import.meta.glob("../../../assets/monsters/briarheart_sovereign/pollen_nova_effect/frames/pollen_nova_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const briarheartImpactFrameUrls = import.meta.glob("../../../assets/monsters/briarheart_sovereign/seed_impact_effect/frames/seed_impact_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const woundclockBoltFrameUrls = import.meta.glob("../../../assets/monsters/woundclock_arbiter/chrono_bolt_projectile/frames/chrono_bolt_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const woundclockGearOrbFrameUrls = import.meta.glob("../../../assets/monsters/woundclock_arbiter/gear_orb_projectile/frames/gear_orb_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const woundclockImpactFrameUrls = import.meta.glob("../../../assets/monsters/woundclock_arbiter/clock_impact_effect/frames/clock_impact_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const woundclockRiftFrameUrls = import.meta.glob("../../../assets/monsters/woundclock_arbiter/time_rift_effect/frames/time_rift_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const motherslashWaveFrameUrls = import.meta.glob(
  "../../../assets/characters/green_warrior/specials/effects/motherslash_pulse/frames/circle_special_effect_hollow_outer_pulse_padded_[0-9][0-9].png",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const verdantExplosionFrameUrls = import.meta.glob(
  "../../../assets/characters/green_warrior/specials/effects/verdant_explosion/frames/verdant_explosion_[0-9][0-9].png",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const moonwellBeamFrameUrls = import.meta.glob(
  "../../../assets/characters/purple_mage/special_effects/moonwell/beam/frames/moonwell_beam_[0-9][0-9].png",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const moonBurstFrameUrls = import.meta.glob(
  "../../../assets/characters/purple_mage/special_effects/moon_burst/moon_burst-*.png",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const clericHealFrameUrls = import.meta.glob(
  "../../../assets/characters/cleric/special_effects/heal_envelope/frames/heal_envelope_[0-9][0-9].png",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const rootbreakerShockwaveFrameUrls = import.meta.glob(
  "../../../assets/characters/green_warrior/abilities/rootbreaker_cleave/shockwave/frames/{down,left,right,up}/rootbreaker_shockwave_*_[0-9][0-9].png",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const thornwallCounterFrameUrls = import.meta.glob(
  "../../../assets/characters/green_warrior/abilities/thornwall_counter/thornwall/frames/{down,left,right,up}/thornwall_counter_fx_*_[0-9][0-9].png",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const motherloadBreakerFrameUrls = import.meta.glob(
  "../../../assets/characters/green_warrior/abilities/motherload_breaker/rupture/frames/{down,left,right,up}/motherload_breaker_fx_*_[0-9][0-9].png",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const verdantGuillotineFrameUrls = import.meta.glob(
  "../../../assets/characters/green_warrior/abilities/verdant_guillotine/impact/frames/{down,left,right,up}/verdant_guillotine_fx_*_[0-9][0-9].png",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const codgerIdleFrameUrls = import.meta.glob(
  "../../../assets/characters/codger/idle_bird_then_laugh_hold_sprite/codger-bird-laugh-hold-idle-*.png",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

const pendingImages = new Set<HTMLImageElement>();
const imageLoadPromises = new Map<string, Promise<HTMLImageElement>>();
const imageFrameCache = new WeakMap<HTMLImageElement, SpriteFrame>();
const imageLoadQueue: Array<() => void> = [];
let activeImageLoads = 0;

export type RenderAssetLoadOptions = {
  playerClassIds?: readonly ClassId[];
  monsterIds?: readonly MonsterId[];
  startupOnly?: boolean;
};

export async function loadRenderAssets(options: RenderAssetLoadOptions = {}): Promise<RenderAssets> {
  const [playerSprites, monsterSprites, worldFrames] = await Promise.all([
    loadPlayerSprites(options.playerClassIds),
    loadMonsterSprites(options.monsterIds),
    loadWorldAndEffectAssets(options),
  ]);

  return {
    playerSprites,
    monsterSprites,
    ...worldFrames,
  };
}

export function createAnimationFrameLookup(assets: RenderAssets): AnimationFrameLookup {
  return {
    playerFrameCount(classId, direction, animation) {
      return assets.playerSprites[classId]?.[direction][animation]?.length
        ?? assets.playerSprites.warrior?.[direction][animation]?.length
        ?? 1;
    },
    monsterFrameCount(monsterId, direction, animation) {
      return assets.monsterSprites[monsterId]?.[direction][animation]?.length
        ?? assets.monsterSprites.moss_golem?.[direction][animation]?.length
        ?? 1;
    },
    moonfallFrameCount() {
      return assets.moonfallFrames.length;
    },
    codgerFrameCount() {
      return assets.codgerIdleFrames.length;
    },
  };
}

async function loadWorldAndEffectAssets(options: RenderAssetLoadOptions): Promise<Omit<RenderAssets, "playerSprites" | "monsterSprites">> {
  const startupOnly = options.startupOnly === true;
  const playerClassIds = new Set(options.playerClassIds ?? []);
  const monsterIds = new Set(options.monsterIds ?? []);
  const loadMageEffects = !startupOnly || playerClassIds.has("mage");
  const loadClericEffects = !startupOnly || playerClassIds.has("cleric");
  const loadWarriorEffects = !startupOnly || playerClassIds.has("warrior");
  const loadShroomEffects = !startupOnly || monsterIds.has("shroom_boy");
  const loadTreeGoblinEffects = !startupOnly || monsterIds.has("tree_goblin");
  const loadBossEffects = !startupOnly;
  const image = await loadImage(rpgAssetsUrl);
  const grassImage = await loadImage(largeGrassTerrainUrl);
  const dungeonTreeRoomFrame = await loadImage(dungeonTreeRoomUrl).then(makeImageFrame);
  const worldAssets: Partial<Record<WorldAssetName, SpriteFrame>> = {};

  (Object.keys(worldAssetRects) as WorldAssetName[]).forEach((name) => {
    worldAssets[name] = makeTransparentFrame(image, worldAssetRects[name]);
  });

  const grassTerrainTile = makeImageFrame(grassImage);
  const grassTerrainProps = await loadFrameMap(grassTerrainPropUrls);
  const animatedGrassFrames = await Promise.all(
    Object.entries(animatedGrassFrameUrls)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(async ([, url]) => makeImageFrame(await loadImage(url))),
  );
  const magicMissileEntries = Object.entries(magicMissileFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const clericFireballEntries = Object.entries(clericFireballFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const moonfallEntries = Object.entries(moonfallFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const enemyRockThrowEntries = Object.entries(enemyRockThrowFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const poisonCloudEntries = Object.entries(poisonCloudFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const shroomlingEntries = Object.entries(shroomlingFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const spinningHeadEntries = Object.entries(spinningHeadFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const nightbloomThornEntries = Object.entries(nightbloomThornFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const nightbloomPetalEntries = Object.entries(nightbloomPetalFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const nightbloomRootBurstEntries = Object.entries(nightbloomRootBurstFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const nightbloomNovaEntries = Object.entries(nightbloomNovaFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const nightbloomPetalImpactEntries = Object.entries(nightbloomPetalImpactFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const obsidianLanceEntries = Object.entries(obsidianLanceFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const obsidianShardEntries = Object.entries(obsidianShardFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const obsidianSmiteEntries = Object.entries(obsidianSmiteFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const obsidianWheelEntries = Object.entries(obsidianWheelFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const abyssalBellShardEntries = Object.entries(abyssalBellShardFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const abyssalTollImpactEntries = Object.entries(abyssalTollImpactFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const abyssalNovaEntries = Object.entries(abyssalNovaFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const briarheartSkewerEntries = Object.entries(briarheartSkewerFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const briarheartSeedEntries = Object.entries(briarheartSeedFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const briarheartVineEntries = Object.entries(briarheartVineFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const briarheartNovaEntries = Object.entries(briarheartNovaFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const briarheartImpactEntries = Object.entries(briarheartImpactFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const woundclockBoltEntries = Object.entries(woundclockBoltFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const woundclockGearOrbEntries = Object.entries(woundclockGearOrbFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const woundclockImpactEntries = Object.entries(woundclockImpactFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const woundclockRiftEntries = Object.entries(woundclockRiftFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const motherslashWaveEntries = Object.entries(motherslashWaveFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const verdantExplosionEntries = Object.entries(verdantExplosionFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const moonwellBeamEntries = Object.entries(moonwellBeamFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const moonBurstEntries = Object.entries(moonBurstFrameUrls)
    .sort(([left], [right]) => frameNumberFromPath(left) - frameNumberFromPath(right));
  const clericHealEntries = Object.entries(clericHealFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const rootbreakerShockwaveEntries = Object.entries(rootbreakerShockwaveFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const thornwallCounterEntries = Object.entries(thornwallCounterFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const motherloadBreakerEntries = Object.entries(motherloadBreakerFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const verdantGuillotineEntries = Object.entries(verdantGuillotineFrameUrls)
    .sort(([left], [right]) => left.localeCompare(right));
  const codgerIdleEntries = Object.entries(codgerIdleFrameUrls)
    .sort(([left], [right]) => frameNumberFromPath(left) - frameNumberFromPath(right));

  const [magicMissileFrames, clericFireballFrames, moonfallFrames, enemyRockThrowFrames, poisonCloudFrames, shroomlingFrames, spinningHeadFrames, nightbloomThornFrames, nightbloomPetalFrames, nightbloomRootBurstFrames, nightbloomNovaFrames, nightbloomPetalImpactFrames, obsidianLanceFrames, obsidianShardFrames, obsidianSmiteFrames, obsidianWheelFrames, abyssalBellShardFrames, abyssalTollImpactFrames, abyssalNovaFrames, briarheartSkewerFrames, briarheartSeedFrames, briarheartVineFrames, briarheartNovaFrames, briarheartImpactFrames, woundclockBoltFrames, woundclockGearOrbFrames, woundclockImpactFrames, woundclockRiftFrames, motherslashWaveFrames, verdantExplosionFrames, moonwellBeamFrames, moonBurstFrames, clericHealFrames, rootbreakerShockwaveFrames, thornwallCounterFrames, motherloadBreakerFrames, verdantGuillotineFrames, codgerIdleFrames] = await Promise.all([
    !loadMageEffects
      ? Promise.resolve([])
      : magicMissileEntries.length > 0
      ? Promise.all(magicMissileEntries.map(([, url]) => loadImage(url).then(makeImageFrame)))
      : loadImage(magicMissileUrl).then(makeGreenScreenFrame).then((frame) => [frame]),
    loadClericEffects ? Promise.all(clericFireballEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    !loadMageEffects
      ? Promise.resolve([])
      : moonfallEntries.length > 0
      ? Promise.all(moonfallEntries.map(([, url]) => loadImage(url).then(makeMoonfallFrame)))
      : loadImage(moonfallUrl).then(makeGreenScreenFrame).then((frame) => [frame]),
    loadBossEffects ? Promise.all(enemyRockThrowEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadShroomEffects ? Promise.all(poisonCloudEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadShroomEffects ? loadDirectionalFrameMap(shroomlingEntries) : Promise.resolve({}),
    loadTreeGoblinEffects ? Promise.all(spinningHeadEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(nightbloomThornEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(nightbloomPetalEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(nightbloomRootBurstEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(nightbloomNovaEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(nightbloomPetalImpactEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(obsidianLanceEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(obsidianShardEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(obsidianSmiteEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(obsidianWheelEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(abyssalBellShardEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(abyssalTollImpactEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(abyssalNovaEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(briarheartSkewerEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(briarheartSeedEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(briarheartVineEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(briarheartNovaEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(briarheartImpactEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(woundclockBoltEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(woundclockGearOrbEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(woundclockImpactEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadBossEffects ? Promise.all(woundclockRiftEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadWarriorEffects ? Promise.all(motherslashWaveEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadWarriorEffects ? Promise.all(verdantExplosionEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadMageEffects ? Promise.all(moonwellBeamEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadMageEffects ? Promise.all(moonBurstEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadClericEffects ? Promise.all(clericHealEntries.map(([, url]) => loadImage(url).then(makeImageFrame))) : Promise.resolve([]),
    loadWarriorEffects ? loadCardinalFrameMap(rootbreakerShockwaveEntries) : Promise.resolve({}),
    loadWarriorEffects ? loadCardinalFrameMap(thornwallCounterEntries) : Promise.resolve({}),
    loadWarriorEffects ? loadCardinalFrameMap(motherloadBreakerEntries) : Promise.resolve({}),
    loadWarriorEffects ? loadCardinalFrameMap(verdantGuillotineEntries) : Promise.resolve({}),
    codgerIdleEntries.length > 0
      ? Promise.all(codgerIdleEntries.map(([, url]) => loadImage(url).then(makeImageFrame)))
      : loadImage(codgerIdleSheetUrl).then((image) => splitHorizontalFrames(image, 10)),
  ]);

  return {
    worldAssets,
    dungeonTreeRoomFrame,
    grassTerrainTile,
    grassTerrainProps,
    animatedGrassFrames,
    magicMissileFrames,
    clericFireballFrames,
    enemyRockThrowFrames,
    poisonCloudFrames,
    shroomlingFrames,
    spinningHeadFrames,
    nightbloomThornFrames,
    nightbloomPetalFrames,
    nightbloomRootBurstFrames,
    nightbloomNovaFrames,
    nightbloomPetalImpactFrames,
    obsidianLanceFrames,
    obsidianShardFrames,
    obsidianSmiteFrames,
    obsidianWheelFrames,
    abyssalBellShardFrames,
    abyssalTollImpactFrames,
    abyssalNovaFrames,
    briarheartSkewerFrames,
    briarheartSeedFrames,
    briarheartVineFrames,
    briarheartNovaFrames,
    briarheartImpactFrames,
    woundclockBoltFrames,
    woundclockGearOrbFrames,
    woundclockImpactFrames,
    woundclockRiftFrames,
    moonfallFrames,
    motherslashWaveFrames,
    verdantExplosionFrames,
    rootbreakerShockwaveFrames,
    thornwallCounterFrames,
    motherloadBreakerFrames,
    verdantGuillotineFrames,
    moonwellBeamFrames,
    moonBurstFrames,
    clericHealFrames,
    codgerIdleFrames,
  };
}

async function loadCardinalFrameMap(entries: [string, string][]): Promise<Partial<Record<CardinalDirectionName, SpriteFrame[]>>> {
  const groupedEntries: Partial<Record<CardinalDirectionName, [string, string][]>> = {};

  entries.forEach(([path, url]) => {
    const direction = path.match(/\/frames\/(down|left|right|up)\//)?.[1] as CardinalDirectionName | undefined;
    if (!direction) return;
    groupedEntries[direction] ??= [];
    groupedEntries[direction]!.push([path, url]);
  });

  const frames: Partial<Record<CardinalDirectionName, SpriteFrame[]>> = {};
  await Promise.all((Object.keys(groupedEntries) as CardinalDirectionName[]).map(async (direction) => {
    const directionEntries = groupedEntries[direction]!.sort(([left], [right]) => frameNumberFromPath(left) - frameNumberFromPath(right));
    frames[direction] = await Promise.all(directionEntries.map(([, url]) => loadImage(url).then(makeImageFrame)));
  }));

  return frames;
}

function frameNumberFromPath(path: string) {
  const match = path.match(/(\d+)\.png$/);
  return match ? Number(match[1]) : 0;
}

export function loadImage(url: string, attempt = 0): Promise<HTMLImageElement> {
  const cached = imageLoadPromises.get(url);
  if (cached) return cached;

  const promise = enqueueImageLoad(() =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      pendingImages.add(image);
      image.onload = () => {
        pendingImages.delete(image);
        resolve(image);
      };
      image.onerror = () => {
        pendingImages.delete(image);
        imageLoadPromises.delete(url);
        if (attempt < 1) {
          resolve(loadImage(withImageRetryToken(url, attempt + 1)));
          return;
        }
        reject(new Error(`Failed to load ${url}`));
      };
      image.src = url;
    }),
  );
  imageLoadPromises.set(url, promise);
  return promise;
}

function withImageRetryToken(url: string, attempt: number) {
  return `${url}${url.includes("?") ? "&" : "?"}retry=${attempt}`;
}

function enqueueImageLoad<T>(loader: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    imageLoadQueue.push(() => {
      activeImageLoads += 1;
      loader()
        .then(resolve, reject)
        .finally(() => {
          activeImageLoads = Math.max(0, activeImageLoads - 1);
          pumpImageLoadQueue();
        });
    });
    pumpImageLoadQueue();
  });
}

function pumpImageLoadQueue() {
  while (activeImageLoads < maxConcurrentImageLoads() && imageLoadQueue.length > 0) {
    imageLoadQueue.shift()?.();
  }
}

function maxConcurrentImageLoads() {
  if (navigator.maxTouchPoints > 0 && window.matchMedia("(max-width: 900px)").matches) return 2;
  return 6;
}

export function makeTransparentFrame(image: HTMLImageElement, frame: FrameRect): SpriteFrame {
  const buffer = document.createElement("canvas");
  buffer.width = frame.w;
  buffer.height = frame.h;
  const frameCtx = buffer.getContext("2d")!;

  frameCtx.drawImage(image, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);
  const pixels = frameCtx.getImageData(0, 0, frame.w, frame.h);
  let minX = frame.w;
  let minY = frame.h;
  let maxX = -1;
  let maxY = -1;

  for (let index = 0; index < pixels.data.length; index += 4) {
    const r = pixels.data[index];
    const g = pixels.data[index + 1];
    const b = pixels.data[index + 2];
    if (r > 242 && g > 242 && b > 242) {
      pixels.data[index + 3] = 0;
    } else {
      const pixelIndex = index / 4;
      const x = pixelIndex % frame.w;
      const y = Math.floor(pixelIndex / frame.w);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  frameCtx.putImageData(pixels, 0, 0);

  if (maxX < minX || maxY < minY) {
    return makeSpriteFrame(buffer);
  }

  const padding = 2;
  const trimmedX = Math.max(0, minX - padding);
  const trimmedY = Math.max(0, minY - padding);
  const trimmedW = Math.min(frame.w - trimmedX, maxX - trimmedX + 1 + padding);
  const trimmedH = Math.min(frame.h - trimmedY, maxY - trimmedY + 1 + padding);
  const trimmed = document.createElement("canvas");
  trimmed.width = trimmedW;
  trimmed.height = trimmedH;
  trimmed.getContext("2d")!.drawImage(buffer, trimmedX, trimmedY, trimmedW, trimmedH, 0, 0, trimmedW, trimmedH);

  return makeSpriteFrame(trimmed);
}

export function makeGreenScreenFrame(image: HTMLImageElement): SpriteFrame {
  const buffer = document.createElement("canvas");
  buffer.width = image.naturalWidth;
  buffer.height = image.naturalHeight;
  const frameCtx = buffer.getContext("2d")!;

  frameCtx.drawImage(image, 0, 0);
  const pixels = frameCtx.getImageData(0, 0, buffer.width, buffer.height);
  let minX = buffer.width;
  let minY = buffer.height;
  let maxX = -1;
  let maxY = -1;

  for (let index = 0; index < pixels.data.length; index += 4) {
    const r = pixels.data[index];
    const g = pixels.data[index + 1];
    const b = pixels.data[index + 2];
    const isGreenScreen = g > 150 && r < 100 && b < 120;
    if (isGreenScreen) {
      pixels.data[index + 3] = 0;
    } else {
      const pixelIndex = index / 4;
      const x = pixelIndex % buffer.width;
      const y = Math.floor(pixelIndex / buffer.width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  frameCtx.putImageData(pixels, 0, 0);

  if (maxX < minX || maxY < minY) {
    return makeSpriteFrame(buffer);
  }

  const padding = 2;
  const trimmedX = Math.max(0, minX - padding);
  const trimmedY = Math.max(0, minY - padding);
  const trimmedW = Math.min(buffer.width - trimmedX, maxX - trimmedX + 1 + padding);
  const trimmedH = Math.min(buffer.height - trimmedY, maxY - trimmedY + 1 + padding);
  const trimmed = document.createElement("canvas");
  trimmed.width = trimmedW;
  trimmed.height = trimmedH;
  trimmed.getContext("2d")!.drawImage(buffer, trimmedX, trimmedY, trimmedW, trimmedH, 0, 0, trimmedW, trimmedH);

  return makeSpriteFrame(trimmed);
}

export function makeImageFrame(image: HTMLImageElement): SpriteFrame {
  const cached = imageFrameCache.get(image);
  if (cached) return cached;
  const frame = createImageFrame(image);
  imageFrameCache.set(image, frame);
  return frame;
}

function createImageFrame(image: HTMLImageElement): SpriteFrame {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const frameCtx = canvas.getContext("2d")!;
  frameCtx.drawImage(image, 0, 0);
  return makeSpriteFrame(canvas);
}

export function makeSpriteFrame(canvas: HTMLCanvasElement): SpriteFrame {
  return { canvas, w: canvas.width, h: canvas.height, bounds: measureOpaqueBounds(canvas) };
}

export function measureOpaqueBounds(canvas: HTMLCanvasElement, alphaThreshold = 8): SpriteBounds | undefined {
  const frameCtx = canvas.getContext("2d", { willReadFrequently: true });
  if (!frameCtx) return undefined;
  const pixels = frameCtx.getImageData(0, 0, canvas.width, canvas.height);
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const alpha = pixels.data[(y * canvas.width + x) * 4 + 3];
      if (alpha <= alphaThreshold) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) return undefined;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

export function makeMoonfallFrame(image: HTMLImageElement): SpriteFrame {
  const frame = createImageFrame(image);
  const frameCtx = frame.canvas.getContext("2d")!;

  const pixels = frameCtx.getImageData(0, 0, frame.w, frame.h);

  for (let index = 0; index < pixels.data.length; index += 4) {
    const pixelIndex = index / 4;
    const y = Math.floor(pixelIndex / frame.w);
    const inGuideBand = y < 80 || y > frame.h - 80;
    const isWhiteGuide = pixels.data[index] > 220 && pixels.data[index + 1] > 220 && pixels.data[index + 2] > 220;

    if (inGuideBand && isWhiteGuide) {
      pixels.data[index + 3] = 0;
    }
  }

  frameCtx.putImageData(pixels, 0, 0);
  return makeSpriteFrame(frame.canvas);
}

function splitHorizontalFrames(image: HTMLImageElement, frameCount: number): SpriteFrame[] {
  const frameWidth = Math.floor(image.naturalWidth / frameCount);
  const frames: SpriteFrame[] = [];

  for (let index = 0; index < frameCount; index += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = frameWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext("2d")!.drawImage(
      image,
      index * frameWidth,
      0,
      frameWidth,
      image.naturalHeight,
      0,
      0,
      frameWidth,
      image.naturalHeight,
    );
    frames.push(makeSpriteFrame(canvas));
  }

  return frames;
}

export function mirrorFrameHorizontally(frame: SpriteFrame): SpriteFrame {
  const buffer = document.createElement("canvas");
  buffer.width = frame.w;
  buffer.height = frame.h;
  const bufferCtx = buffer.getContext("2d")!;
  bufferCtx.translate(frame.w, 0);
  bufferCtx.scale(-1, 1);
  bufferCtx.drawImage(frame.canvas, 0, 0);
  return makeSpriteFrame(buffer);
}

function assetNameFromPath(path: string): string {
  return path.split("/").pop()?.replace(/\.png$/, "") ?? path;
}

async function loadFrameMap(urls: Record<string, string>): Promise<Record<string, SpriteFrame>> {
  const frames: Record<string, SpriteFrame> = {};
  await Promise.all(Object.entries(urls).map(async ([path, url]) => {
    frames[assetNameFromPath(path)] = makeImageFrame(await loadImage(url));
  }));
  return frames;
}

async function loadDirectionalFrameMap(entries: [string, string][]): Promise<Partial<Record<CardinalDirectionName, SpriteFrame[]>>> {
  const groupedEntries: Partial<Record<CardinalDirectionName, [string, string][]>> = {};

  entries.forEach(([path, url]) => {
    const direction = path.match(/\/frames\/(south|north|east|west)\//)?.[1];
    if (!direction) return;
    const cardinalDirection = direction === "south"
      ? "down"
      : direction === "north"
        ? "up"
        : direction === "east"
          ? "right"
          : "left";
    groupedEntries[cardinalDirection] ??= [];
    groupedEntries[cardinalDirection]!.push([path, url]);
  });

  const frames: Partial<Record<CardinalDirectionName, SpriteFrame[]>> = {};
  await Promise.all((Object.keys(groupedEntries) as CardinalDirectionName[]).map(async (direction) => {
    const directionEntries = groupedEntries[direction]!.sort(([left], [right]) => left.localeCompare(right));
    frames[direction] = await Promise.all(directionEntries.map(([, url]) => loadImage(url).then(makeImageFrame)));
  }));

  return frames;
}

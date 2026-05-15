# Playable Characters

This guide documents how playable characters are currently added and tuned in MotherSeed 2D.

The game is a custom Canvas 2D and TypeScript prototype. Character select and HUD are DOM overlays, while the world, sprites, projectiles, and spell effects are drawn on the canvas. Runtime behavior is split by ownership: content in `src/game/content`, simulation in `src/game/combat`, Canvas drawing/loading in `src/render/canvas2d`, and DOM rendering in `src/ui`.

## Core Files

- `src/game/types.ts`
  Defines `ClassId`, `CharacterClass`, `SpecialAbility`, weapon Special tags, Branch Lattice auto ability types, Finisher tags, animation names, and shared gameplay types.
- `src/game/content/classes.ts`
  Defines character select data, stats, baseline Special metadata, portraits, and character order.
- `src/game/input-actions.ts`
  Maps physical keys to gameplay actions such as `special-1`, `special-2`, and `special-3`.
- `src/game/state.ts`
  Defines serializable player, enemy, combat runtime, and UI flow state.
- `src/game/combat/abilities.ts`
  Dispatches Branch Lattice auto attacks and Special behavior by `special.id`.
- `src/render/canvas2d/character-sprites.ts`
  Loads playable character sprite frame sets.
- `src/render/canvas2d/renderer.ts`
  Draws playable characters and owns draw profiles/visual scale.
- `src/ui/character-select.ts` and `src/ui/hud.ts`
  Render character select and HUD view models from state/content data.
- `assets/characters/<character_id>/`
  Stores character portraits, sprites, generated frames, projectiles, spells, previews, and QA files.
- `docs/SPRITE_GIF_FRAME_EXTRACTION.md`
  Documents the reusable GIF-to-PNG frame extraction and normalization tool.
- `docs/CHARACTER_SPRITE_STANDARDS.md`
  Defines the asset standards for animation agents, including source resolution, transparent runtime PNGs, stable bottom-center anchors, and practical padding rules for normal versus wide special frames.

## Current Runtime Shape

The current playable character path has these stages:

1. `characterClasses` and `characterOrder` render character select.
2. `applySelectedClass()` in `src/game/state.ts` copies class stats into player state.
3. `loadPlayerSprites()` in `src/render/canvas2d/character-sprites.ts` loads a `PlayerSpriteSet` for implemented classes.
4. `renderer.ts` chooses the active sprite set for animation and drawing.
5. `updatePartyCompanions()` in `src/game/combat/party-ai.ts` drives party positioning and combat animation intent.
6. `updateAutoAttack()` in `src/game/combat/abilities.ts` runs the Branch Lattice auto-attack loop.
7. Finisher-tagged Branch abilities run as Branch Lattice identity attacks, but do not open Mother Load.
8. `activeWeaponSpecials()` collects Specials from equipped gear, falling back to class baseline Specials. `castSpecial()` dispatches Special behavior by `special.id`; Specials tagged `MotherLoad` prime Mother Load and trigger it when chained back to back.
9. Projectile/spell state updates live in `src/game/combat/projectiles.ts`; visuals are drawn in `renderer.ts`. Purple Mage's Moonfall Mother Load queues the Moonwell beam after the Moonfall animation finishes and plays `A_Moonwell.mp3` plus the Moonwell effect sound with the beam.
10. `renderHud()` reads state and ability metadata for the panels.

## Add A Playable Character

### 1. Add Or Reuse A Class Id

Edit `src/game/types.ts` if the character needs a new id:

```ts
export type ClassId = "warrior" | "ranger" | "mage" | "thief" | "cleric";
```

Keep ids lowercase and stable. The id becomes the key used by character select, sprite loading, behavior dispatch, and later save data.

### 2. Add Character Select Data

Edit `src/game/content/classes.ts`.

Import the portrait with Vite's `?url` loader:

```ts
import purpleMagePortraitUrl from "../../../assets/characters/purple_mage/portrait.png?url";
```

Then add or update the `CharacterClass` entry:

```ts
mage: {
  id: "mage",
  name: "Purple Mage",
  title: "Moonveil Arcanist",
  weapon: "Lunar Staff",
  role: "Pressure enemies from range with magic missiles and lunar burst damage.",
  status: "Implemented",
  implemented: true,
  accent: "#b274e4",
  portraitUrl: purpleMagePortraitUrl,
  glyph: "M",
  stats: { health: 95, stamina: 95, meter: 120 },
  abilities: [
    { key: "1", id: "moonfall", name: "Moonfall", cost: 45, cooldown: 8.5, range: 560, tags: ["MotherLoad"] },
  ],
}
```

Add the id to `characterOrder` if it is new:

```ts
export const characterOrder: ClassId[] = ["warrior", "ranger", "mage", "thief", "cleric"];
```

Use `implemented: false` for a visible planned slot. Use `implemented: true` only when the sprite set and runtime behavior are both wired.

### 3. Place Character Assets

Use this folder shape for new playable characters:

```text
assets/characters/<character_id>/
  portrait.png
  base/
  idle/
  walk/
    frames/
  sprint/
    frames/
  dodge/
    frames/
  attack/
    frames/
  specials/
    MotherSpin/
      frames/
    effects/
  special_cast/
    frames/
  projectiles/
  spells/
```

The current runtime expects canonical frame filenames that can be discovered with `import.meta.glob()`.

For the warrior, frame names are in gameplay direction form:

```text
idle_down_01.png
walk_right_01.png
attack_left_01.png
```

For the purple mage, frame names are in compass direction form:

```text
down-idle.gif
walk_south_01.png
walk_east_01.png
attack_west_01.png
sprint_east_01.png
idle_south_01.png
special_cast_north_01.png
```

If a character uses compass names, add a direction mapping like `purpleMageDirectionAssets` in `src/render/canvas2d/character-sprites.ts`. GIFs can be useful as source exports, but runtime animations should be extracted into normalized PNG frame sequences so the game loop controls timing and each animation family has a consistent canvas and baseline. Use `tools/extract_gif_frames.py`; the workflow is documented in `docs/SPRITE_GIF_FRAME_EXTRACTION.md`.

### 4. Load Sprite Frames

In `src/render/canvas2d/character-sprites.ts`, add an asset glob for the character frames:

```ts
const purpleMageFrameUrls = import.meta.glob([
  "../assets/characters/purple_mage/idle/frames/idle_*_[0-9][0-9].png",
  "../assets/characters/purple_mage/walk/frames/walk_*_[0-9][0-9].png",
  "../assets/characters/purple_mage/walk_v2/frames/walk_v2_*_[0-9][0-9].png",
  "../assets/characters/purple_mage/sprint/frames/sprint_*_[0-9][0-9].png",
  "../assets/characters/purple_mage/dodge/frames/dodge_*_[0-9][0-9].png",
  "../assets/characters/purple_mage/attack/frames/attack_*_[0-9][0-9].png",
  "../assets/characters/purple_mage/special_cast/frames/special_cast_*_[0-9][0-9].png",
  "../assets/characters/purple_mage/spin_cast/frames/spin_cast_*_[0-9][0-9].png",
], {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;
```

Add a loader that returns a complete `PlayerSpriteSet`. Every direction should provide these animation keys:

- `idle`
- `walk`
- `sprint`
- `run`
- `dodge_roll`
- `attack1`
- `attack1_side_slash`
- `attack2`
- `damage`
- `victory`

Fallbacks are fine during prototyping. For example, the purple mage currently uses normalized cardinal idle frames, `walk_v2/frames` for walking, dedicated dodge frames for dodge rolls, sprint frames for sprint/run, `attack/frames` for every Magic Missile basic attack cast, `spin_cast/frames` for Moonveil Flourish, and `special_cast/frames` for Moonfall casting. The cleric uses `spell_cast_2/frames` for the red basic spell cast, `special_cast/frames` for Mother's Healing, `projectiles/fireball/frames` for the fireball projectile, and `special_effects/heal_envelope/frames` for the heal envelope. If one cardinal sprint direction is missing during asset production, prefer an explicit fallback such as mirroring the opposite side direction over silently dropping back to walk frames.

Register the sprite set in `loadPlayerSprites()`:

```ts
playerSprites = {
  warrior: warriorSprites,
  cleric: warriorSprites,
  mage: mageSprites,
};
```

Do not register a class as implemented unless `activePlayerSpriteSet()` can return a valid sprite set for it.

### 5. Set The Draw Profile

Each character needs a draw profile so its sprite baseline lands on the same ground position as collision and shadows.

```ts
const purpleMageSpriteDraw = {
  standard: {
    scale: 0.98,
    anchorX: 64,
    anchorY: 118,
    baselineOffset: 28,
    targetContentHeight: 120,
  },
};
```

Tune this by running the game and checking:

- Feet sit on the shadow.
- Movement does not make the character appear to float.
- Attack frames do not jump wildly from idle.
- Large action frames do not cover the enemy or HUD.

If a character has oversized attack or special frames, add an action draw profile like the warrior or purple mage `wideAction` profiles. This keeps wider action canvases planted on the same ground point as idle and movement frames.

When a character mixes source canvas sizes, prefer `targetContentHeight` on its draw profiles. The runtime measures each frame's opaque bounds, scales the visible sprite to that target height, centers it on the bounds, and bottom-aligns it to the character baseline. This keeps high-resolution or oversized exports, such as `walk_v2`, usable without destructively resizing the source PNGs.

### 6. Implement The Default Attack

Default attacks are Branch Lattice auto abilities and live in `updateAutoAttack()` in `src/game/combat/abilities.ts`.

For melee classes, use short range and direct damage:

```ts
if (distance(player, enemy) > 120 || player.autoTimer > 0) return;
player.autoTimer = defaultAttackCooldown;
dealEnemyDamage(damage, "Sword Slash");
```

For ranged classes, use a longer range and spawn a projectile:

```ts
const isCaster = selectedClassId === "mage" || selectedClassId === "cleric";
const autoRange = isCaster ? 520 : 120;

if (isCaster) {
  player.autoTimer = defaultAttackCooldown;
  player.attackFlash = magicMissileCastTiming.attackFlash;
  pendingMagicMissileCast = {
    damage,
    timer: magicMissileCastTiming.releaseDelay,
  };
  return;
}
```

When a projectile should leave the character during an attack animation, queue the cast instead of spawning immediately. Tune `releaseDelay` to the frame where the staff, hand, or weapon visually releases the attack. The purple mage uses the `attack/frames` sequence for Magic Missile, then releases the projectile after a short delay so the shot lines up with the cast pose. The cleric follows the same queued cast path but maps `attack1` to the red `spell_cast_2/frames` animation and marks the projectile visual as `clericFireball`.

Projectile behavior should be split into three small functions:

- `spawnX()`: create projectile state.
- `updateX(delta)`: move, hit test, apply damage, remove expired projectiles.
- `drawX()`: draw the projectile or fallback shape.

Keep projectile state serializable where possible. Do not store canvas contexts, DOM nodes, or loaded images in projectile instances.

### 6a. Add Finishers And Mother Load

Branch Lattice abilities can opt into the `Finisher` tag in `src/game/types.ts` / `src/game/state.ts` for starter amulet identity and auto-slotting. Finishers do not open Mother Load.

Specials can opt into the `MotherLoad` tag on `SpecialAbility`. When a MotherLoad-tagged Special resolves in `castSpecial()`, it opens `state.combat.motherLoadWindow`. The next successful MotherLoad-tagged Special consumes the window for a bonus effect, then immediately opens the next window so back-to-back tagged Specials can continue chaining. Untagged support, heal, or buff Specials clear an active Mother Load window without triggering the bonus.

Keep Mother Load state serializable:

```ts
{
  isActive: true,
  sourceAbilityId: "motherspin",
  sourceAbilityName: "Mother Spin",
}
```

Starter amulets are offered by the codger in the initial room through `src/game/world/intro-room.ts`; when equipped, the amulet contributes its class Finisher option to the Branch Lattice and the lattice auto-slots it when possible. Warrior **Verdant Guillotine** uses the warrior leap animation and Purple Mage **Moonveil Flourish** uses the mage spin-cast animation with moon-burst frames from `assets/characters/purple_mage/special_effects/moon_burst`. MotherLoad-triggered Warrior Specials spawn the **Verdant Explosion** visual from `assets/characters/green_warrior/specials/effects/verdant_explosion`; Purple Mage Moonfall Mother Load queues the Moonwell beam. If the Mother Load window opens while another weapon Special is usable, `openMotherLoadWindow()` emits the warrior `warriorTimeForMotherload` cue from `assets/characters/green_warrior/sounds/voice/Time_for_Motherload.mp3` or the purple mage `mageMoonAwaits` cue from `assets/characters/purple_mage/sounds/voice/Moon_awaits.mp3`.

### 7. Implement Specials

Baseline Special metadata is seeded from `classes.ts`. Equipped gear can also contribute Specials through its frame data; the active bar takes the first three Specials from equipped gear in slot order, then falls back to class baseline Specials if no gear grants any. Behavior is dispatched by `special.id` in `castSpecial()` in `src/game/combat/abilities.ts`.

Use the ability metadata for:

- `key`: HUD label and physical special slot.
- `id`: behavior dispatch key.
- `name`: HUD and event log label.
- `cost`: meter cost.
- `cooldown`: cooldown timer.
- `range`: range gate.
- `tags`: optional behavior tags such as `MotherLoad` for damaging Specials that can prime and trigger Mother Load.

Then add behavior:

```ts
if (ability.id === "moonfall") {
  pendingMoonfallCast = {
    x: enemy.x,
    y: enemy.y,
    damage: 48,
    radius: 132,
    timer: moonfallCastTiming.releaseDelay,
  };
  pushLog("Moonfall called", "The spell gathers overhead");
}
```

For delayed effects, use a state object and update it each frame. Apply damage once at a clear impact point, then remove the effect after its visual recovery. Moonfall uses `attack2` as the special animation state, maps the purple mage to `special_cast/frames`, and queues the falling moon after `moonfallCastTiming.releaseDelay` so the spell effect lines up with the cast pose. Mother Spin uses the warrior `specials/MotherSpin/frames` spin animation, then updates `motherslashWaves` so pulse damage follows the outward cyclone rings loaded from `assets/characters/green_warrior/specials/effects/motherslash_pulse/frames`. Warrior Mother Load also spawns `verdantExplosions`, a delayed Canvas-only visual effect loaded from `assets/characters/green_warrior/specials/effects/verdant_explosion/frames` and drawn low in the render order behind actors and projectiles. When the delayed explosion activates, `updateVerdantExplosions()` emits the `warriorVerdantExplosionVoice` and `verdantExplosion` sound events for the Green Warrior voice line in `assets/characters/green_warrior/sounds/voice/` and the impact SFX in `assets/characters/green_warrior/sounds/motherload/`.

Support Specials that target party members can use `state.party.pendingTargetedSpecial` to stage a single-tap targeting window. Mother's Healing uses `attack2`, maps the cleric to `special_cast/frames`, spawns `clericHealEffects` around the healed member, and supports two input paths: single tap the Special then click an in-world party member or party portrait, or double tap the Special to auto-heal the living party member with the lowest health percentage.

### 8. Add Effect Assets

Import single effect images directly:

```ts
import magicMissileUrl from "../assets/characters/purple_mage/projectiles/magic_missile/magic_missile.png?url";
import moonfallUrl from "../assets/characters/purple_mage/spells/moonfall/moonfall.png?url";
import moonfallCrashUrl from "../assets/characters/purple_mage/spells/moonfall/sound_effects/Crashing.mp3?url";
import moonfallPortalUrl from "../assets/characters/purple_mage/spells/moonfall/sound_effects/Portal.mp3?url";
import moonfallVoiceUrl from "../assets/characters/purple_mage/spells/moonfall/voiceline/Moonfall.mp3?url";
```

Import animated effect frames with `import.meta.glob()`:

```ts
const magicMissileFrameUrls = import.meta.glob("../assets/characters/purple_mage/projectiles/magic_missile/frames/magic_missile_left_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const moonfallFrameUrls = import.meta.glob("../assets/characters/purple_mage/spells/moonfall/frames/moonfall_[0-9][0-9].png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;
```

Load them in `loadWorldAssets()` or a future dedicated effect loader:

```ts
[magicMissileFrames, moonfallFrames] = await Promise.all([
  magicMissileEntries.length > 0
    ? Promise.all(magicMissileEntries.map(([, url]) => loadImage(url).then(makeImageFrame)))
    : loadImage(magicMissileUrl).then(makeGreenScreenFrame).then((frame) => [frame]),
  moonfallEntries.length > 0
    ? Promise.all(moonfallEntries.map(([, url]) => loadImage(url).then(makeMoonfallFrame)))
    : loadImage(moonfallUrl).then(makeGreenScreenFrame).then((frame) => [frame]),
]);
```

Use `makeImageFrame()` for transparent PNGs. Use `makeGreenScreenFrame()` only for green-keyed generated images that need runtime cleanup. Prefer normalized transparent PNG assets when possible. For fixed-canvas effect animations, preserve the shared canvas so every frame anchors consistently; use a specialized cleanup loader such as `makeMoonfallFrame()` only when generated guide artifacts need to be hidden at runtime.

Spell audio should be dispatched from gameplay timing, not draw code. For example, Moonfall emits voice and portal sound events in `castSpecial()` when the cast succeeds, then emits the crash sound from `updateMoonfallStrikes()` when the animation reaches impact.

### 9. Update HUD And Character Select Text

Most HUD and character select UI updates automatically from `CharacterClass` data:

- Character name and stats.
- Weapon Special names, keys, costs, cooldowns.
- Portrait and accent color.
- Implemented or planned state.

If the number of implemented classes changes, update static copy such as:

```html
Five paths. Three awaken in this build.
```

If a class uses fewer than three abilities, the action bar will render fewer slots. That is fine for the prototype, but if the layout later assumes exactly three slots, update CSS and smoke tests together.

## Adjust An Existing Character

Use this table for common changes.

| Goal | File or function |
| --- | --- |
| Rename class, title, weapon, role | `src/game/content/classes.ts` |
| Change health or max meter | `stats` in `classes.ts` |
| Change special cost, cooldown, or range | `abilities` in `classes.ts` |
| Change special behavior or damage | `castSpecial()` in `src/game/combat/abilities.ts` |
| Add a gear-granted Special | Add `weaponSpecials` to the gear frame; debug starter gear does this in `src/game/combat/gear.ts` |
| Change default attack range, cadence, or damage | `updateAutoAttack()` in `src/game/combat/abilities.ts` |
| Add a Finisher or Mother Load bonus | Finishers: `src/game/types.ts` and `src/game/state.ts`; MotherLoad Specials: `src/game/types.ts`, `src/game/content/classes.ts`, and `src/game/combat/abilities.ts` |
| Change projectile speed or lifetime | The class projectile state/update functions |
| Change sprite scale or baseline | Character draw profile in `src/render/canvas2d/renderer.ts` |
| Change portrait | `portraitUrl` import and asset file |
| Change command key mapping | `src/game/input-actions.ts` |
| Change target lock or click-to-clear targeting | `lockTarget()`, `clearTarget()`, and `isEnemyAtWorldPoint()` in `src/game/combat/player.ts` |
| Change character select order | `characterOrder` in `classes.ts` |

Balance changes should usually be made in one pass, then verified with a short fight. Watch time-to-kill, meter gain speed, cooldown uptime, and whether enemy telegraphs stay readable.

## Asset Quality Checklist

Use `docs/CHARACTER_SPRITE_STANDARDS.md` as the source-of-truth handoff before requesting or approving new animation frames.

Before marking a character implemented:

- Portrait exists and loads in character select.
- Every required cardinal direction has at least one valid frame for idle, movement, and casting or attack.
- Frames are transparent or use a known cleanup path.
- Sprite scale matches the arena and enemy size.
- Feet stay anchored during idle and movement.
- Attack frames face the target direction.
- Projectiles or spell effects are not huge raw source images at runtime scale.
- Special effects do not hide enemy telegraphs for too long.
- The class has a meaningful default attack and at least one special.
- Empty left-click clears target lock so auto-attack gating stays intentional.

## Smoke Test Checklist

Run the production build first:

```powershell
npm run build
```

Then run locally:

```powershell
npm run dev
```

Local smoke test:

1. Open the app.
2. Start from the title screen.
3. Select the character.
4. Confirm the portrait, class name, stats, and ability list.
5. Enter the autobattler loop.
6. Start a fight and watch the party position itself.
7. Let the default attack fire.
8. Use each implemented special.
9. Confirm event log messages, enemy health changes, cooldowns, and meter changes.
10. Die or defeat the enemy once if the change touched reset, death, loot, or respawn.

Browser automation can also verify the happy path: select the class, enter the loop, wait for auto attacks, trigger a special, and check that no page errors were logged.

## Good Defaults

Use these as starting points for new classes:

| Archetype | Health | Meter | Auto range | Auto cadence | Special range |
| --- | ---: | ---: | ---: | ---: | ---: |
| Melee tank | 130-150 | 100 | 100-140 | 1.2-1.5s | 100-220 |
| Mobile melee | 100-120 | 100 | 90-125 | 0.8-1.2s | 100-300 |
| Ranged caster | 85-105 | 110-130 | 520-760 | 0.8-1.1s | 360-600 |
| Support | 110-130 | 100-120 | 140-240 | 1.1-1.4s | 180-360 |

These are not rules. They are safe first values for a prototype fight against the current Rootbound Elite.

## Refactor Direction

As playable classes grow, avoid adding class logic to `src/main.ts`. The current extracted ownership is:

```text
src/game/content/classes.ts
src/game/combat/abilities.ts
src/game/combat/player.ts
src/game/combat/projectiles.ts
src/render/canvas2d/character-sprites.ts
src/render/canvas2d/renderer.ts
```

Keep the same rule from the game foundations: simulation owns state and rules; rendering owns sprites, draw order, camera, and visual effects; DOM owns character select and HUD text.

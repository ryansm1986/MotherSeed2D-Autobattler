# MotherSeed 2D Foundation Review

This review uses the Game Studio web-game-foundations checklist: simulation/render separation, explicit input mapping, first-class assets, save/debug/perf boundaries, and DOM UI over the playfield.

## Current Verdict

The project is now correctly aligned around a 2D character in a 2D world. The current Canvas 2D runtime is a reasonable foundation for the next phase, provided the code is split into clear modules before more gameplay scope is added.

The prototype is healthy for proving combat feel. The first structural refactor is now in place: `src/main.ts` is a bootstrap that delegates state, simulation, rendering, UI, and audio to focused modules.

## What Is Already Good

- Vite and strict TypeScript are in place.
- Canvas 2D fits the new 2D world direction.
- The playable loop has clear verbs: move, dodge, target, auto-attack, specials, equip.
- HUD, title, and character select are DOM overlays, which is the right default for menus and text-heavy UI.
- The 2D world already uses useful ARPG conventions: follow camera, arena bounds, telegraphs, Y-ish draw ordering, obstacles, sprite animation, combat ranges, cooldowns, and generated loot.
- Character and world art are grouped under `assets/`.
- Several sprite JSON manifests already exist, which points toward a stronger asset pipeline.
- The Krita workflow documents repeatable 2D sprite export.

## Main Risks

- `src/main.ts` used to own content, simulation state, input handling, asset loading, rendering, UI rendering, and the game loop. It is now bootstrap-only.
- Gameplay state now lives in `src/game/state.ts`, but more tests are needed before treating the simulation as fully portable.
- Input has explicit gameplay actions in `src/game/input-actions.ts`; menu navigation still handles some browser keys directly at the bootstrap layer.
- Content is partly hardcoded in TypeScript and partly represented by asset JSON files, with no single asset/content manifest boundary yet.
- Ability behavior is handled with conditionals keyed by ability IDs, which will become brittle as classes and weapons expand.
- Enemy attack behavior is hardcoded rather than authored as data.
- Save data, debug overlays, deterministic seeds, and performance probes are not defined yet.
- Root `AGENTS.md` and `docs/CODEMAP.md` now document where agents should look and what boundaries to respect.

## Foundation Decision

Keep the current Canvas 2D prototype. Do not migrate to Three.js. Do not migrate to Phaser yet.

Canvas 2D is good enough for the current milestone: prove that movement, dodging, target lock, auto-attacks, telegraphs, meter, specials, class identity, and procedural gear feel good in a 2D world.

Consider Phaser later only if one of these becomes expensive in the custom runtime:

- tilemap editing and collision
- animation state management
- scene transitions
- camera tooling
- particle and VFX workflow
- broadphase collision or pathing

## Target Source Layout

```text
src/
  app/
    audio.ts
  game/
    state.ts
    simulation.ts
    types.ts
    math.ts
    input-actions.ts
  game/combat/
    abilities.ts
    auto-attack.ts
    chains.ts
    damage.ts
    enemy-ai.ts
    gear.ts
  game/content/
    classes.ts
    enemies.ts
    gear-tables.ts
    world-assets.ts
  game/world/
    arena.ts
    collision.ts
    generation.ts
    sectors.ts
    seeded-random.ts
  render/canvas2d/
    renderer.ts
    camera.ts
    sprite-loader.ts
    character-sprites.ts
    monster-sprites.ts
  ui/
    app-shell.ts
    hud.ts
    character-select.ts
    pause-menu.ts
    event-log.ts
```

This structure keeps the current renderer, but makes the simulation portable. If the project later adopts Phaser, the simulation and content modules should survive.

## Improvement Plan

### Phase 1: Stabilize The Prototype Boundary

Goal: make the current game easier to change without changing behavior.

- Shared types and pure math helpers live in `src/game/types.ts` and `src/game/math.ts`.
- `characterClasses` and ability definitions live in `src/game/content/classes.ts`.
- World constants, decorations, and world asset rects live in `src/game/content/world-assets.ts` and `src/game/world/arena.ts`.
- Player, enemy, gear, cooldowns, target lock, timers, and UI flow live in `GameState`.
- `src/main.ts` is bootstrap only.
- Add `createInitialGameState(selectedClassId, seed)` so restarts and future saves are deterministic.

Definition of done:

- `npm run build` passes.
- The game feels the same.
- Most gameplay state can be inspected as plain JSON.

### Phase 2: Add Explicit Input Actions

Goal: stop gameplay logic from depending on raw key codes.

- Define actions: `move-up`, `move-down`, `move-left`, `move-right`, `dodge`, `target-next`, `special-1`, `special-2`, `special-3`, `equip`, `confirm`, `cancel`, `pause`.
- Create one keyboard mapping table.
- Have the simulation consume actions or an `InputState`, not DOM events.
- Keep menu navigation separate from gameplay actions.

Definition of done:

- Changing key bindings only touches one file.
- Gamepad or remapping support has an obvious place to attach.

### Phase 3: Split Simulation From Rendering

Goal: make combat rules testable and portable.

- `updateSimulation(state, input, delta)` now coordinates movement, stamina, cooldowns, enemy AI, combat, and loot.
- Renderer reads state and render assets but does not own gameplay rules.
- UI reads view models generated from state.
- Gameplay functions emit queued `GameEvent[]` instead of writing directly to the DOM.
- Keep Canvas-only objects such as `CanvasRenderingContext2D`, `HTMLCanvasElement`, `HTMLImageElement`, and sprite frame canvases out of simulation state.

Definition of done:

- The render layer draws from `GameState`.
- Combat code can run in a test without a canvas.

### Phase 4: Make Content Data-Driven

Goal: add classes, enemies, abilities, and gear without expanding main-loop conditionals.

- Define ability effects as data plus small effect handlers.
- Define enemy attack patterns with windup, active, recovery, shape, range, damage, and tracking behavior.
- Add stable asset keys for sprites, world objects, title art, portraits, VFX, and UI icons.
- Convert hardcoded sprite rects and world asset rects into content modules or JSON manifests.
- Align the Krita exporter with the same sprite manifest source of truth.

Definition of done:

- Adding one enemy attack does not require editing the main loop.
- Asset filenames are implementation details, not public game IDs.

### Phase 5: Save, Debug, And Perf Boundaries

Goal: prepare for procedural world and longer sessions.

- Define `SaveGameV1` from serializable simulation state only.
- Add a local save/load smoke path.
- Add a debug overlay toggle for fps, entity count, seed, player position, enemy state, collision shapes, telegraph shapes, and current input actions.
- Add fixed-step simulation or isolate time handling so multiplayer can adopt it later if needed.

Definition of done:

- Save/load restores class, stats, gear, position, enemy state, and seed.
- Debug info can be toggled without touching gameplay code.

### Phase 6: Grow The 2D World Deliberately

Goal: expand beyond the arena without losing performance or determinism.

- Introduce `SectorId` or chunk-like coordinates for 2D regions.
- Generate or load only nearby world sectors.
- Give each sector its own spawn table, collision data, decoration data, and points of interest.
- Keep the first implementation small: one grove plus nearby encounter spaces.

Definition of done:

- The game can move between at least two 2D regions without treating the whole future world as one giant object.

## Project Review Notes

### Runtime

The current Vite and TypeScript setup is appropriate. No engine migration is needed right now.

### Renderer

Canvas 2D is aligned with the project. The current renderer should be extracted behind a `render/canvas2d` boundary before more render features are added.

### Simulation

The current simulation is separated from rendering and UI enough for focused follow-up tests. The next priority is adding tests around the pure combat and movement modules.

### Input

Keyboard handling works, but raw `event.code` checks are scattered in the global keydown handler and movement update. Add an action map before adding remapping, gamepad, or more menus.

### Assets

The asset folders are promising but need stable manifest keys. The current game imports some assets directly and discovers warrior animation frames with `import.meta.glob`, while other character assets include JSON manifests. Pick one manifest pattern and use it consistently.

### UI

DOM overlays are the right choice. The next UI improvement is not visual polish; it is separating UI rendering from gameplay mutation and generating simple view models from `GameState`.

### Tests And Verification

There are no automated gameplay tests yet. After Phase 3, add focused tests for math, collision, enemy attack hit checks, cooldowns, meter spending, chain reactions, and gear rolls.

## Near-Term Stop List

Avoid these until Phase 3 is done:

- Adding full inventory UI.
- Adding more than one new enemy family.
- Building procedural sector streaming.
- Starting multiplayer infrastructure.
- Migrating to Phaser.
- Adding more classes beyond small data stubs.

Those features are all good ideas, but they will be much cheaper once state, input, content, and rendering have clean boundaries.

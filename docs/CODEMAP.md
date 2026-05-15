# MotherSeed 2D Code Map

## Runtime Flow

`src/main.ts` is now the bootstrap:

1. Creates the DOM shell with `createAppShell()`.
2. Creates serializable `GameState` with `createInitialGameState()`.
3. Creates input and audio services.
4. Loads Canvas render assets with `loadRenderAssets()`.
5. Creates the Canvas renderer with `createCanvasRenderer()`.
6. Routes browser events into state, simulation, UI, and audio.
7. Runs `updateSimulation()` and `renderer.draw()` each frame.

## Game State And Simulation

- `src/game/state.ts` defines player, enemy, combat runtime, equipped-gear Specials, Branch Lattice auto-loop state, Mother Load window state, UI flow, and events.
- `src/game/save.ts` owns versioned local save/load data, preserving class, vitals, room, intro progress, equipment, inventory, and Branch Lattice while restoring live combat to a safe clean state.
- `src/game/debug.ts` owns debug-only helpers for encounter teleporting and pause-menu test actions.
- `src/game/simulation.ts` coordinates the frame update and returns `GameEvent[]`.
- `src/game/combat/player.ts` owns movement, stamina, dodge, target lock, and facing.
- `src/game/combat/enemy-ai.ts` owns Rootbound Elite movement, windup/active/recovery states, and hit checks.
- `src/game/combat/abilities.ts` owns Branch Lattice auto-loop execution, MotherLoad-tagged Special chaining, Special cooldowns, and special dispatch by `special.id`.
- `src/game/combat/projectiles.ts` owns Magic Missile, Moonfall, and Mother Load effect state updates.
- `src/game/combat/damage.ts` owns damage, chains, death, respawn, and loot drop transitions.
- `src/game/combat/gear.ts` owns gear generation, Special/frame option generation, equipping, and Branch Lattice assignment normalization.

## Content And World

- `src/game/content/classes.ts` is character select data, stats, ability metadata, portraits, and order.
- `src/game/content/enemies.ts` is enemy identity, timings, draw profile data, and enemy audio constants.
- `src/game/content/world-assets.ts` is stable world asset rect data.
- `src/game/world/arena.ts` is current arena size, routes, clearings, and decorative placement.
- `src/game/world/collision.ts` is gameplay collision and arena clamping.
- `src/game/world/intro-room.ts` owns the initial codger room interaction, tutorial dialogue, starter amulet gift, and intro stair gating.

## Rendering

- `src/render/canvas2d/types.ts` defines Canvas-only sprite/render types and public renderer interfaces.
- `src/render/canvas2d/sprite-loader.ts` loads all render assets and exposes animation frame counts.
- `src/render/canvas2d/character-sprites.ts` resolves playable character frame sequences.
- `src/render/canvas2d/monster-sprites.ts` resolves moss golem frame sequences.
- `src/render/canvas2d/camera.ts` owns camera state, resize, follow, and screen-to-world conversion.
- `src/render/canvas2d/renderer.ts` draws world, telegraphs, projectiles, characters, enemy, loot, and spell effects.

## UI

- `src/ui/app-shell.ts` creates the DOM structure and returns stable element handles.
- `src/ui/hud.ts` creates and applies the HUD view model.
- `src/ui/character-select.ts` creates and applies character select view models.
- `src/ui/inventory.ts` creates and applies the DOM inventory view model.
- `src/ui/branch-lattice.ts` creates and applies the Branch Lattice overlay view model.
- `src/ui/mobile-controls.ts` maps phone-only virtual controls onto the existing `InputState`.
- `src/ui/pause-menu.ts` owns pause tabs and copy.
- `src/ui/debug-menu.ts` owns the pause-menu debug encounter controls.
- `src/ui/event-log.ts` applies log events.
- `src/style.css` owns DOM overlay styling, including the shared `Cinzel` UI font family.

## Design Docs

- `docs/game_design/ITEMS_AND_AFFIXES.md` defines the planned equipment slots, core stats, affix types, and how gear contributes Abilities and Modifiers to the Branch Lattice.
- `docs/PLAYABLE_CHARACTERS.md` explains how playable classes, abilities, sprite loading, draw profiles, and UI metadata are wired.
- `docs/CHARACTER_SPRITE_STANDARDS.md` is the animation-agent handoff for high-resolution character sprites, source padding, anchors, naming, transparency, and QA.
- `docs/SPRITE_GIF_FRAME_EXTRACTION.md` documents the GIF-to-PNG extraction and normalization workflow.

## Refactor Guardrails

- Keep `main.ts` small; do not put gameplay, rendering, or DOM templates back into it.
- Keep Canvas objects in `render/canvas2d`, DOM objects in `ui`, and plain serializable state in `game`.
- Keep touch controls as UI input adapters that emit existing gameplay actions; do not add mobile-only simulation state.
- When adding a new feature, choose the module by ownership, not by convenience.
- Preserve current asset paths unless the task is specifically about asset cleanup.

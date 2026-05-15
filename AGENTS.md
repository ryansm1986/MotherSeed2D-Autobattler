# MotherSeed 2D Agent Guide

## Direction

MotherSeed 2D is a Vite + TypeScript browser autobattler RPG prototype. The renderer is custom Canvas 2D, and title, character select, HUD, pause, shop, and sound controls are DOM overlays.

Do not migrate to Phaser, Three.js, or React unless the user explicitly asks. Keep simulation state serializable and keep Canvas/DOM objects out of `src/game/` state.

## Commands

```powershell
npm install
npm run dev
npm run build
npm run preview
```

Run `npm run build` after code changes.

## Source Map

- `src/main.ts`: bootstrap only. Creates shell/state/input/audio, loads render assets, wires events, and starts the loop.
- `src/app/`: browser-app services such as audio.
- `src/game/state.ts`: serializable game state, UI flow state, events, class application, weapon special data, Branch Lattice frame data, and auto-loop state.
- `src/game/simulation.ts`: top-level simulation update coordinator.
- `src/game/combat/`: party AI, targeting, enemy AI, abilities, damage, projectiles, gear.
- `src/game/content/`: authored gameplay/content data such as classes, enemies, and world asset rects.
- `src/game/world/`: arena data and gameplay collision.
- `src/render/canvas2d/`: Canvas-only sprite loading, camera, render assets, draw profiles, and drawing.
- `src/ui/`: DOM shell, HUD, character select, shop, pause menu, event log rendering, inventory, Branch Lattice, and phone command controls.
- `docs/CHARACTER_SPRITE_STANDARDS.md`: animation-agent standards for high-resolution character sprites, padding, anchors, naming, transparency, and QA.
- `assets/`: source and generated art/audio. Do not reorganize asset churn while doing code refactors.
- `tools/`: asset pipeline scripts.

## Boundary Rules

- `src/game/` can read content data and math, but should not store `HTMLCanvasElement`, `CanvasRenderingContext2D`, `HTMLImageElement`, or DOM nodes in `GameState`.
- `src/render/canvas2d/` owns sprite frames, Canvas drawing, draw profiles, camera transforms, and image cleanup.
- `src/ui/` owns DOM templates and applying view models to elements.
- Simulation emits `GameEvent[]`; `main.ts` routes log events to UI and sound events to audio.
- Prefer adding content data before adding new conditionals in the frame loop.

## Where To Edit

- Add or tune classes: `src/game/content/classes.ts`.
- Change class special behavior: `src/game/combat/abilities.ts`.
- Change auto attacks: `src/game/combat/abilities.ts`.
- Change projectile or spell timing: `src/game/combat/projectiles.ts`.
- Change party targeting helpers: `src/game/combat/player.ts`.
- Change enemy behavior: `src/game/combat/enemy-ai.ts` and `src/game/content/enemies.ts`.
- Change arena/world placement: `src/game/world/arena.ts`.
- Change collision: `src/game/world/collision.ts`.
- Change sprite loading: `src/render/canvas2d/character-sprites.ts`, `monster-sprites.ts`, or `sprite-loader.ts`.
- Change drawing/visual scale: `src/render/canvas2d/renderer.ts`.
- Change HUD/menus: `src/ui/` and `src/style.css`.
- Change Branch Lattice screen: `src/ui/branch-lattice.ts`, `src/ui/app-shell.ts`, `src/game/state.ts`, `src/game/combat/gear.ts`, and `src/style.css`.
- Change phone command controls: `src/ui/mobile-controls.ts`, `src/ui/app-shell.ts`, and phone media queries in `src/style.css`.

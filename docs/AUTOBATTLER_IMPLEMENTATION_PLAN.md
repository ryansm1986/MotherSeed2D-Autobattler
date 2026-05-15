# Autobattler Implementation Plan

## North Star

Build an auto battler RPG loop:

1. Draft or assemble a party.
2. Enter an AI-controlled fight against monsters.
3. Win gold and loot.
4. Spend gold in shops on gear.
5. Improve party power.
6. Repeat through escalating encounters.
7. Later: fight saved/generated enemy parties in PvP-style battles.

## Fork Strategy

Keep the Vite + TypeScript + Canvas 2D foundation, but pivot the game loop from direct ARPG control to party management plus AI-resolved battles.

Reuse the current renderer, content files, gear systems, inventory UI, event pipeline, monster-fight content, and existing `party-ai.ts` direction where possible. Replace the control model, encounter flow, and progression loop over time.

## Progress Tracker

Status labels:

- `[x]` Implemented and covered by smoke/build checks.
- `[~]` In progress or partially implemented.
- `[ ]` Not started.

Current slice:

- `[x]` Phase 1: round phase state, AI-controlled battles, victory/defeat resolution, one-time gold rewards, and shop placeholder.
- `[x]` Phase 3 slice: first functional shop loop: roll gear, buy to backpack, reroll, and start the next fight.
- `[ ]` Phase 2: shared combatant model.
- `[~]` Phase 4: authored encounter progression data, rewards, and shop unlock metadata.
- `[ ]` Phase 5: serializable AI intents and roles.
- `[ ]` Phase 6: dedicated party/formation preparation screen.
- `[ ]` Phase 7: PvP / CPU player groups.

Progress log:

- 2026-05-15: Added `GamePhase` / round state, drove active player through party AI during battle, awarded gold once on victory, returned victory/defeat to a shop placeholder, and surfaced gold/phase/result in HUD.
- 2026-05-15: Completed the first functional Phase 3 shop loop with rolled gear offers, gold costs, buying into the backpack, rerolls, persisted shop state, and a start-next-fight action.
- 2026-05-15: Started Phase 4 with an authored encounter plan that drives room spawns, debug teleport options, gold rewards, and shop offer/reroll unlocks.

## Phase 1: Auto Battler MVP

Goal: one party vs one monster group, fully AI-controlled.

Core changes:

- `[x]` Replace direct player movement/combat input with party AI.
- `[~]` Treat the player side as multiple combatants, not one `player`.
- `[x]` Add round states: `preparing`, `battle`, `victory`, `defeat`, `shop`.
- `[x]` Make combat run without player input once battle starts.
- `[x]` Award gold on victory.
- `[x]` Return to shop after victory or defeat.

Likely files:

- `src/game/state.ts`: add serializable party, gold, battle phase, shop state.
- `src/game/simulation.ts`: coordinate battle/shop/round transitions.
- `src/game/combat/party-ai.ts`: become the main decision system for player-side units.
- `src/game/combat/enemy-ai.ts`: expand to support monster groups.
- `src/game/combat/damage.ts`: handle party/enemy deaths and victory checks.
- `src/render/canvas2d/renderer.ts`: draw multiple allied characters and monsters.
- `src/ui/hud.ts`: show party, gold, round, battle result.

## Phase 2: Party And Unit Model

Goal: make player characters data-driven units.

Add a shared combatant model:

```ts
type TeamId = "player" | "enemy";

type CombatUnit = {
  id: string;
  team: TeamId;
  classId?: string;
  enemyId?: string;
  level: number;
  position: Vector2;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  range: number;
  cooldowns: Record<string, number>;
  equipment: EquippedGear;
  intent?: AiIntent;
};
```

Architectural choice: avoid special-casing `player` and `enemy` too much. Future PvP/CPU-party battles become easier if both sides are arrays of combat units with different team IDs.

## Phase 3: Shop And Economy

Goal: create the between-fights decision layer.

Add shop state:

- `[x]` Current gold.
- `[x]` Shop inventory.
- `[x]` Reroll cost.
- `[~]` Buy/sell/equip actions.
- `[ ]` Optional lock/freeze shop later.
- `[x]` Gear rarity and pricing.

Likely files:

- `src/game/combat/gear.ts`: extend existing gear generation with prices and shop pools.
- `src/game/state.ts`: add shop inventory and economy state.
- `src/ui/inventory.ts`: reuse for party equipment.
- New `src/ui/shop.ts`: shop DOM surface.
- `src/style.css`: shop layout.

Initial shop loop:

1. `[x]` Victory gives gold.
2. `[x]` Shop rolls 3-5 items.
3. `[x]` Player buys gear.
4. `[~]` Player equips gear to party members.
5. `[x]` Start next fight.

## Phase 4: Encounter Progression

Goal: make the game feel like a run.

Add encounter tiers:

- `[x]` Fight 1-3: small monster packs.
- `[x]` Fight 4: elite.
- `[x]` Fight 5: shop upgrade unlock.
- `[x]` Fight 8 or 10: boss.

Content should live in data, not frame-loop conditionals:

- `src/game/content/enemies.ts`
- `src/game/content/encounters.ts`
- `src/game/content/monster-fights/*.fight.ts`

Add rewards:

- `[x]` Gold.
- Item drops.
- Party XP or unit upgrades.
- `[x]` New shop tier unlocks.

## Phase 5: Real Auto Battler Decisions

Goal: make AI behavior interesting.

Add AI roles:

- Tank: protects nearby allies, seeks front line.
- Duelist: dives fragile targets.
- Caster: keeps range, prioritizes clustered enemies.
- Support: heals/shields lowest-health ally.
- Ranger: kites and focuses low-health targets.

Represent decisions as serializable intents:

```ts
type AiIntent =
  | { type: "move"; target: Vector2 }
  | { type: "attack"; targetUnitId: string }
  | { type: "cast"; abilityId: string; targetUnitId?: string; targetPoint?: Vector2 }
  | { type: "hold" };
```

This keeps AI debuggable and renderable. The UI can later show intent lines, target icons, or pause/debug overlays.

## Phase 6: Formation And Preparation

Goal: give the player meaningful control without direct combat input.

Add a preparation screen where the player can:

- Pick party members.
- Equip gear.
- Arrange formation.
- Choose next encounter.
- Start battle.

Use existing DOM overlay style, not a new framework.

Likely files:

- New `src/ui/party-screen.ts`
- New `src/ui/shop.ts`
- `src/ui/app-shell.ts`
- `src/style.css`
- `src/game/state.ts`

## Phase 7: PvP / CPU Player Groups

Goal: support party-vs-party battles.

Do this only after the shared combatant model is solid.

Add:

- Enemy player-party generator.
- Saved party snapshots.
- CPU-controlled teams using the same AI rules as the player party.
- Async PvP-style battles where both sides are AI-controlled.
- Later, deterministic seeds for replayable battle results.

Key requirement: battle simulation should not depend on DOM, Canvas, images, or browser-only objects. That keeps PvP simulation testable and potentially portable.

## Testing Plan

For each major phase:

- Run `npm run build`.
- Add simulation tests for:
  - AI picks valid targets.
  - Battle ends when one side is defeated.
  - Gold is awarded only once.
  - Shop purchases subtract gold.
  - Gear modifies stats correctly.
  - PvP-style team-vs-team fights resolve without player input.

## First Implementation Slice

The best first slice is:

1. Add `GamePhase` / round state.
2. Add party array to `GameState`.
3. Make existing selected character become party member 1.
4. Disable direct combat control during battle.
5. Use `party-ai.ts` to drive the player unit.
6. Award gold on victory.
7. Add a simple post-battle shop placeholder.

That gives the fork its new identity quickly without tearing apart the whole codebase at once.

## Repository Seeding Note

A literal GitHub fork under `ryansm1986` is not available because the source repository is already owned by that account. A full hard-fork push of the current source was also blocked by repository size: the source is about 2.8 GB, mostly generated art/audio/archive assets.

Recommended next step: seed this repository with a slimmer runtime-focused copy of the codebase, leaving archived/generated asset churn behind or moving heavyweight assets to Git LFS/release artifacts.

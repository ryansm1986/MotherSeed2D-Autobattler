# MotherSeed 2D ARPG Plan

## Core Vision

MotherSeed is a browser-based fantasy ARPG with 2D animated characters moving through a 2D world. The player controls positioning, dodging, target selection, and special ability timing while basic attacks and some gear abilities run automatically once an enemy is in range.

The combat goal is long, meaningful encounters. Fights should feel closer to a deliberate boss duel than a clicker: the player is rewarded for reading enemy attacks, staying in range at the right moments, building special meter through auto-attacks, and triggering weapon skills into skill chains.

The long-term game is a large 2D world with procedural regions, procedural gear, cooperative skill chains, fantasy classes, and enemy encounters designed around spatial awareness.

## Direction Lock

MotherSeed is now a 2D character in a 2D world project.

This means:

- The playfield is 2D.
- Characters, monsters, world props, telegraphs, VFX, and UI are authored for 2D readability.
- Canvas 2D is the current renderer.
- Phaser remains a possible future engine if collision, tilemaps, animation tools, or scene management outgrow the custom Canvas runtime.
- Three.js, 3D terrain, billboard characters, camera pitch, GLB/glTF shipping, and 3D collision conventions are out of scope unless the direction changes again.

## Design Pillars

1. Positioning matters.
   Dodging, line of sight, attack cones, ground hazards, terrain blockers, and range bands should matter more than raw rotation speed.

2. Auto-combat creates pressure, not autopilot.
   Basic attacks happen automatically, but the player still chooses targets, movement, defensive timing, and when to spend special meter.

3. Weapons define active specials.
   Classes provide identity and starting kits, but weapons provide the special skills that create build variety.

4. Gear creates tactical behaviors.
   Procedural gear should include stats plus at least one auto-battler-style ability that changes how the character fights.

5. Skill chains create depth.
   Special abilities can prime, extend, or detonate chains. A single-player prototype can prove this before any cooperative version exists.

6. The world must be chunkable.
   Procedural generation, deterministic seeds, and asset streaming should be assumed from the beginning, even while the first playable area is a fixed arena.

## Recommended Technical Direction

### Browser Stack

Recommended current stack:

- Rendering: Canvas 2D through the existing Vite and TypeScript app.
- Characters: directional sprite sheets or frame sequences.
- World: tile-like ground, layered props, collision shapes, and Y-sorted entities.
- UI: DOM overlays for title, character select, HUD, menus, inventory, settings, and accessibility-sensitive controls.
- Game code: TypeScript.
- Physics and collision: lightweight custom 2D controller for the prototype; consider Phaser only when the project needs stronger built-in tilemap, animation, or collision tooling.
- Networking later: authoritative server with simulation snapshots, but only after the single-player loop feels good.

Canvas 2D is a good fit right now because the current game already proves movement, telegraphs, sprite animation, DOM HUD, and combat readability without adding engine migration cost.

### 2D World Model

Initial approach:

- Use world-space coordinates for all entities.
- Use circles, ellipses, lines, and polygons for gameplay collision and telegraphs.
- Draw terrain first, then decorations, enemies, player, loot, VFX, and overlays.
- Sort tall props, enemies, and the player by world Y when they need depth ordering.
- Keep gameplay collision separate from art bounds.
- Treat sprite feet or contact points as the entity position.

Why this helps:

- Combat readability stays high.
- Sprite production remains straightforward.
- Collision is easy to reason about.
- The renderer can stay replaceable because simulation state does not depend on Canvas objects.

Risks:

- Sprite sheets can become hard to manage without stable manifests.
- A large world can become expensive if every asset is drawn every frame.
- Collision and pathing can become messy if art bounds are reused as gameplay bounds.

Mitigation:

- Use stable asset keys and manifests.
- Keep world chunks or sectors explicit before the world grows.
- Store collision as authored gameplay shapes.
- Add debug overlays for entity positions, collision, telegraphs, fps, and current input actions.

## Camera And Controls

Initial camera:

- Top-down or three-quarter 2D follow camera.
- Smoothly follows the player.
- Clamps to the current arena or loaded world region.
- Zoom stays readable on desktop and mobile-sized viewports.
- Future options can include lock-on framing, boss-arena framing, and map-zone transitions.

Player controls:

- WASD movement.
- Space dodge.
- Tab cycles or locks target.
- Number keys trigger weapon specials.
- E equips dropped gear in the prototype.
- Enter, Space, Escape, and arrows navigate menus.

Combat should not require the player to manually click every basic attack.

## Combat Model

### Combat Loop

1. Player selects or cycles to an enemy.
2. Player moves into range.
3. Auto-attacks begin.
4. Auto-attacks generate special meter.
5. Enemy uses readable 2D telegraphs.
6. Player dodges, repositions, blocks, or outranges attacks.
7. Player spends meter on weapon specials.
8. Specials can trigger, extend, or finish skill chains.
9. Gear abilities add automatic procs, buffs, reactions, or companion effects.

### Desired Fight Length

Normal enemy:

- 20 to 45 seconds early prototype.
- Requires at least one dodge or reposition decision.

Elite enemy:

- 60 to 120 seconds.
- Has phases or changing attack patterns.

Boss enemy:

- 3 to 8 minutes.
- Focused on telegraphs, arena control, and meter timing.

### Auto-Attacks

Auto-attacks should have:

- Range.
- Attack interval.
- Animation lock or soft commitment.
- Hit timing within animation.
- Meter generation.
- Optional class or weapon modifier.

Example:

- Warrior sword: melee slash every 1.6 seconds, generates 8 meter.
- Thief daggers: quick strike every 0.8 seconds, generates 3 meter, higher crit chance.
- Ranger bow: ranged shot every 1.4 seconds, generates 5 meter.
- Cleric mace: melee strike every 1.8 seconds, generates 6 meter and minor self-barrier.
- Mage staff: ranged bolt every 1.7 seconds, generates 7 meter.

### Dodge And Defense

Dodging should be a core skill check.

Prototype options:

- Dodge roll with invulnerability frames.
- Short dash with no invulnerability, but fast repositioning.
- Class-specific defensive movement later.

Recommendation:

- Start with a stamina-based dodge that has brief invulnerability.
- Tune stamina so dodging every attack is impossible.
- Enemy attacks should punish panic dodging but reward recognition.

### Enemy Attacks

Enemy attacks should be authored as data:

- Windup duration.
- Telegraph shape.
- Active duration.
- Recovery duration.
- Damage.
- Status effects.
- Tracking behavior.
- Interruptibility.

Telegraph types:

- Circle AoE.
- Cone.
- Line.
- Donut.
- Expanding ring.
- Delayed ground hazard.
- Projectile pattern.

## Special Meter

Meter is generated by:

- Successful auto-attacks.
- Certain gear abilities.
- Perfect dodges or near misses, if desired.
- Skill-chain participation.

Meter is spent on:

- Weapon specials.
- Class utility abilities.
- Chain finishers.

Prototype meter:

- 0 to 100.
- Basic specials cost 25 to 50.
- Heavy finishers cost 75 to 100.

Design rule:

- Specials should not simply be damage buttons. Each one should move the fight state forward by applying chain tags, creating openings, repositioning, shielding, interrupting, or changing the enemy's next decision.

## Skill Chains

Skill chains are coordinated sequences of special effects. A special can apply a chain state, interact with an existing state, or finish the chain.

Example chain tags:

- Break
- Ignite
- Chill
- Shock
- Bleed
- Radiant
- Shadow
- Expose
- Launch
- Bind

Example chain flow:

1. Warrior uses Shield Break.
   Applies Break primer.

2. Mage uses Flame Lance.
   Break + Ignite creates Sundered Flame.

3. Ranger uses Piercing Shot.
   Sundered Flame detonates into armor-ignoring burn damage.

Single-player prototype version:

- Player can chain their own weapon specials.
- Gear auto abilities can contribute simple chain tags.
- Enemies can display active chain state above their health bar.

Cooperative version:

- Multiple players can contribute.
- Chain windows are time-limited.
- Some classes specialize in priming, extending, or detonating.
- Bosses may resist repeated chain types.

## Procedural Gear

Gear should be built from templates, affixes, rarity, level, and ability rolls.

Gear slots:

- Weapon
- Head
- Chest
- Hands
- Legs
- Feet
- Ring
- Amulet
- Trinket

Minimum generated gear fields:

- Item level.
- Rarity.
- Primary stat.
- Secondary stats.
- One or more auto-battler abilities.
- Optional skill-chain modifier.

Stats:

- Power
- Defense
- Vitality
- Precision
- Haste
- Focus
- Spirit
- Crit chance
- Crit damage
- Meter gain
- Dodge recovery
- Stamina

Auto-battler ability examples:

- Every third auto-attack applies Bleed.
- After a dodge, next auto-attack generates extra meter.
- When below 35 percent health, gain a temporary barrier.
- Auto-attacks against burning enemies heal the player slightly.
- Every 12 seconds, fire a minor holy bolt against the current target.
- Critical hits reduce special cooldowns.

Weapon-generated specials:

- Weapons define 2 to 4 special skills.
- Higher rarity weapons can add alternate specials or modify a base special.
- Class restrictions can exist, but should not be too narrow too early.

## Classes

Classes provide starting identity, animation flavor, base stats, and initial weapon kits. Long-term builds should still be driven heavily by weapons and gear.

### Warrior

Starting weapon:

- Sword and shield.

Combat identity:

- Durable melee fighter.
- Breaks armor.
- Can block or reduce incoming damage.
- Good at starting physical chains.

Starter attacks:

- Auto: Sword Slash.
- Special 1: Shield Break, applies Break.
- Special 2: Guarded Rush, gap close plus short barrier.
- Special 3: Cleaving Arc, cone attack that extends Break chains.

### Thief

Starting weapon:

- Dual daggers.

Combat identity:

- Fast melee skirmisher.
- Bleed, poison, expose, and evasion.
- High reward for staying close during danger windows.

Starter attacks:

- Auto: Dagger Flurry.
- Special 1: Hamstring, applies Bleed and slow.
- Special 2: Shadowstep, dodge-through attack.
- Special 3: Expose Weakness, primes Expose chain.

### Ranger

Starting weapon:

- Bow.

Combat identity:

- Ranged precision.
- Traps, kiting, and piercing attacks.
- Strong at detonating chains from range.

Starter attacks:

- Auto: Bow Shot.
- Special 1: Piercing Shot, line attack and chain extender.
- Special 2: Snare Trap, applies Bind.
- Special 3: Volley Mark, causes auto-attacks to seek marked target.

### Cleric

Starting weapon:

- Mace and focus.

Combat identity:

- Durable support caster.
- Radiant damage, barriers, sustain.
- Can stabilize long fights and enable chain windows.

Starter attacks:

- Auto: Consecrated Strike.
- Special 1: Radiant Brand, applies Radiant.
- Special 2: Ward Pulse, barrier and cleanse.
- Special 3: Judgment, detonates Radiant chains.

### Mage

Starting weapon:

- Staff.

Combat identity:

- Ranged elemental caster.
- Ignite, Chill, Shock.
- High special impact with lower defenses.

Starter attacks:

- Auto: Arcane Bolt.
- Special 1: Flame Lance, applies Ignite.
- Special 2: Frost Ring, applies Chill in an area.
- Special 3: Storm Sigil, delayed Shock detonation.

## Procedural 2D World

### Long-Term World Goals

- Large 2D world.
- Deterministic procedural regions.
- Biomes.
- Points of interest.
- Dungeons.
- Enemy camps.
- Resource nodes.
- Roads, landmarks, ruins, and region identities.
- Streamed or paged sectors around the player.

### Prototype World

Start small:

- One grove, island, valley, or arena field.
- Seeded decoration and obstacle placement.
- Static collision obstacles.
- Spawn zones.
- One enemy camp.
- One elite encounter.
- One simple boss arena.

### Sector System

Future sector fields:

- Sector coordinate.
- Seed.
- Biome.
- Tile and decoration data.
- Collision data.
- Navigation hints.
- Spawn table.
- Resource table.
- Points of interest.
- Temporary player-built or world-state data.

Use deterministic generation for static content and server-persisted state for changes if multiplayer arrives later.

## Multiplayer Architecture Direction

The first prototype should be local-first, but the code should not assume the client is authoritative forever.

Long-term networking principles:

- Server authoritative combat if the game becomes multiplayer.
- Client predicts local movement.
- Server validates targeting, hits, damage, loot, and progression.
- World is divided into zones or simulation sectors.
- Nearby entities are replicated to the client.
- Combat events use timestamps and deterministic ability definitions.

Possible architecture:

- Client: Browser, Canvas 2D or Phaser, TypeScript.
- Game server: Node.js, Bun, Go, or Rust.
- Realtime transport: WebSocket initially.
- Persistence: Postgres.
- Cache/session: Redis if needed later.
- Content definitions: JSON, YAML, or TypeScript data modules.

Do not build multiplayer infrastructure first. Build the game loop first, then make the simulation portable enough to move server-side.

## Data-Driven Content

Core content should be defined as data instead of hardcoded logic where practical.

Suggested definitions:

- Classes.
- Weapons.
- Abilities.
- Status effects.
- Chain reactions.
- Enemy attack patterns.
- Gear affixes.
- Loot tables.
- Biomes.
- Spawn tables.
- Sprite manifests.
- World prop manifests.

Example ability fields:

- id
- name
- classTags
- weaponTags
- range
- cost
- cooldown
- castTime
- animation
- telegraph
- effects
- chainPrimer
- chainExtender
- chainFinisher

## Visual Direction

Temporary placeholder direction:

- 2D character sprites.
- Directional frame animations.
- 2D tiled or painterly terrain.
- Clear combat telegraphs.
- Simple VFX for chain tags and specials.

Long-term direction:

- Dark fantasy tone.
- Readable silhouettes.
- Strong ground telegraphs.
- High-contrast enemy attack indicators.
- Character sprites with directional animation sets.
- Weapons and gear represented by icons first, then visual layers later.

Important readability rule:

- Combat indicators matter more than visual noise. The player must understand what to dodge.

## First Playable Prototype

Goal:

Prove that 2D characters in a 2D browser world can support fun auto-combat with movement, dodging, target selection, and specials.

Scope:

- One controllable character.
- One class first, probably Warrior.
- One weapon with auto-attack and three specials.
- One enemy type.
- One elite enemy with telegraphed attacks.
- Tab targeting.
- Auto-attack in range.
- Meter generation.
- Manual specials.
- Dodge.
- Health, stamina, and meter UI.
- Simple loot drop with generated stats and one auto ability.
- One small 2D arena or field.

Success criteria:

- Moving and dodging feels responsive.
- Auto-attacks start and stop correctly based on target and range.
- Enemy attacks are readable and avoidable.
- Specials feel worth saving meter for.
- A fight lasts long enough to require multiple decisions.
- Gear changes combat behavior in a noticeable way.

## Milestone Plan

### Milestone 1: Rendering And Movement

- Render a 2D arena.
- Add player sprite animation.
- Add follow camera.
- Add WASD movement.
- Add dodge movement.
- Add simple collision.

### Milestone 2: Targeting And Auto-Attack

- Add enemy entity.
- Add target selection.
- Add tab targeting.
- Add range checks.
- Add auto-attack timer.
- Add health bars.
- Add meter generation.

### Milestone 3: Enemy Telegraphs

- Add enemy AI state machine.
- Add windup, active, recovery attack phases.
- Add ground telegraph shapes.
- Add dodge invulnerability.
- Add damage resolution.

### Milestone 4: Specials And Skill Chains

- Add weapon special definitions.
- Add meter costs.
- Add chain tags.
- Add chain reaction rules.
- Add VFX placeholders.

### Milestone 5: Procedural Gear

- Add generated item model.
- Add rarity and stat rolls.
- Add gear auto abilities.
- Add simple inventory and equip flow.
- Add loot drops from enemies.

### Milestone 6: Procedural Arena

- Add seeded 2D world generation.
- Add sector-like layout even if only a small area loads.
- Add spawn tables.
- Add obstacles and environmental hazards.

### Milestone 7: Class Expansion

- Add Thief, Ranger, Cleric, and Mage.
- Add class-specific starting weapons.
- Add placeholder animation sets.
- Add class stat differences.

### Milestone 8: Multiplayer Foundation

- Extract shared simulation logic.
- Add local server only when multiplayer testing begins.
- Add WebSocket connection.
- Add authoritative movement and combat events.
- Add second player replication.
- Add cooperative chain contribution.

## Suggested File And Code Organization

Future structure:

```text
src/
  app/
    bootstrap.ts
    loop.ts
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
    sprites.ts
    telegraphs.ts
  ui/
    hud.ts
    inventory.ts
    target-frame.ts
    character-select.ts
```

## Main Design Questions

1. Should the player aim specials manually, or should specials fire at the tab target by default?

2. Should the camera be close and character-focused, or zoomed out for encounter readability?

3. Should dodge use stamina, charges, cooldown, or a class-specific resource?

4. Should auto-attacks root the player briefly, slow movement, or allow full movement?

5. Should weapons be class-locked, loosely class-favored, or fully open?

6. Should gear abilities be mostly passive procs, or should some behave like auto-cast mini-skills?

7. Do you want one global special meter, or separate meters such as weapon meter, class meter, and chain meter?

8. Should skill chains be elemental, physical, class-based, weapon-based, or a mix?

9. Should the first prototype focus on Warrior, or would Mage better prove telegraphs and ranged dodging?

10. Should enemy combat be more boss-pattern based, more AI-behavior based, or a hybrid?

11. How punishing should death be in the long-term game?

12. Should the procedural world feel open and seamless, or should it be divided into visible sectors or regions?

13. Should multiplayer eventually support small parties, shared public zones, or both?

14. Should art direction lean grim dark fantasy, colorful high fantasy, or something stranger?

15. Should world generation prioritize handcrafted points of interest stitched into procedural regions, or fully generated discovery?

## Current Assumptions

- The first implementation is browser-based and TypeScript-first.
- Canvas 2D is the current renderer.
- Characters use 2D directional sprite animation.
- Combat is local single-player before networking.
- Warrior is the safest first class because melee range, dodging, blocking, meter, and targeting all get tested immediately.
- Future multiplayer architecture should influence data boundaries, but not dominate the first prototype.

## Immediate Next Step

Stabilize the current playable combat prototype:

- Keep the Warrior and Cleric character-select flow working.
- Keep the 2D arena, enemy cone attack, and circle slam.
- Keep tab targeting, auto-attack, meter, specials, dodge, and gear drop behavior.
- Extract simulation, content, input, rendering, and UI boundaries before adding major new systems.

This will answer the most important question first: whether the core combat fantasy feels good before the project grows into world generation, itemization, class expansion, and multiplayer systems.

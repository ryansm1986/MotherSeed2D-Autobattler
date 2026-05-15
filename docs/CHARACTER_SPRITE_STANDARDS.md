# Character Sprite Standards

This document is the handoff brief for agents producing playable character, companion, NPC, and humanoid monster animation assets for MotherSeed 2D.

The game uses custom Canvas 2D rendering. Runtime sprites are PNG frame sequences loaded from `assets/characters/` or `assets/monsters/`; source GIFs or generated sheets are acceptable as intermediate files only.

## Goals

- High-quality, high-resolution source art that can be safely normalized for runtime.
- Stable bottom-center anchoring so feet stay planted on the character shadow.
- Enough empty canvas around every pose for weapons, robes, hair, spell flares, jump frames, and dodge movement.
- Consistent character proportions across all animations and directions.
- Transparent runtime PNG frames with no accidental background color, guide marks, or clipped edges.

## Research Basis

There is no universal HD 2D sprite size. Current engine and tool guidance points to choosing sprite resolution from the game's target/reference resolution, expected on-screen footprint, and consistent scaling rather than making every source frame huge.

- Unity's 2D import guidance notes that Pixels Per Unit is mostly a scale convention for high-resolution artwork, and that bottom pivots are common for characters or props that stand on the ground: https://learn.unity.com/tutorial/importing-2d-assets-into-unity-2019-3
- Unity's Pixel Perfect Camera documentation frames reference resolution as the original resolution the assets are designed for, and says Asset Pixels Per Unit should match sprite PPU values in the scene: https://docs.unity.cn/Manual/urp/2d-pixelperfect-ref.html
- Aseprite exports animations as PNG sequences or sprite sheets and supports padding between sprites: https://www.aseprite.org/docs/exporting and https://www.aseprite.org/docs/sprite-sheet/
- Aseprite CLI supports `--trim`, `--extrude`, and shape padding, which are useful for atlases but can affect frame bounds if used without an anchor plan: https://www.aseprite.org/docs/cli/
- TexturePacker's alignment guidance reinforces that trimmed sprites need metadata so runtime can preserve original size and anchor points: https://www.codeandweb.com/texturepacker/knowledgebase/keep-animation-alignment-with-trim

For MotherSeed 2D, current playable characters render at roughly 112-128 px visible character height in-world. That means a 1536 px source frame for every locomotion pose is unnecessary unless it is being used as an intermediate illustration that will be heavily processed. The standards below target crisp HD sprites without ballooning source size, memory, repository weight, and iteration time.

## Required Source Quality

Use these standards for new animation generation or regeneration:

| Asset stage | Minimum | Preferred | Notes |
| --- | ---: | ---: | --- |
| Visible in-game character height | 96 px | 112-144 px | Match current draw profiles before changing renderer scale. |
| Runtime normalized locomotion frame | 192 x 192 px | 256 x 256 px | Good for idle, walk, sprint, damage, and compact casts. |
| Runtime normalized action frame | 256 x 256 px | 384 x 384 px | Use for attacks, dodge, larger robes, and weapon motion. |
| Runtime normalized wide special frame | 384 x 384 px | 512 x 512 px | Use for leaps, spins, oversized silhouettes, or body-attached effects. |
| Raw generation canvas, normal pose | 512 x 512 px | 768 x 768 px | Source can be cleaned and normalized down to runtime frames. |
| Raw generation canvas, wide special | 768 x 768 px | 1024 x 1024 px | Use when the pose needs large safe margins or effect separation. |
| Raw portrait source | 1024 x 1024 px | 1536 x 1536 px | Portraits are UI art, not runtime animation frames. |

Use larger than `1024 x 1024` only for hero illustrations, marketing art, very large boss effects, or cases where the art process demonstrably loses quality during cleanup. Do not use `1536 x 1536` as the default for every character animation frame.

Legacy extraction examples may mention `128` frame sizes. Treat those as acceptable prototype/runtime sizes, but prefer `256 x 256` or `384 x 384` normalized frames for new HD playable character work.

## Padding And Safe Area

Every raw source frame or source-sheet cell must include enough empty white space or transparent space around the visible character silhouette and any attached weapon, cloak, hair, or held effect.

Use these margins:

| Motion type | Required side/top padding |
| --- | ---: |
| Runtime normalized idle, walk, sprint | 24-48 px |
| Runtime normalized attack, dodge, compact cast | 48-80 px |
| Runtime normalized wide special | 80-128 px |
| Raw generation normal pose | 128 px minimum, 192 px preferred |
| Raw generation wide special | 256 px preferred |
| Large special effects attached to the body | 256 px or separate the effect into its own effect asset |

Padding means clear empty space from the outermost opaque pixel to the cell edge. Do not let silhouettes, shadows, particles, weapons, or capes touch the image edge.

The earlier `256 px on every side` rule is still useful for wide raw generation, but it is not appropriate for every normal `512 x 512` character frame because it leaves no practical room for the character. For normal poses, use `128-192 px` raw padding and normalize to runtime frames with smaller transparent margins.

For image-generation prompts, explicitly ask for:

```text
full body centered in frame, large empty white background margin, at least 128 pixels of clear space on all sides, no cropping, no frame edge contact
```

For wide specials, use:

```text
full body centered in frame, large empty white background margin, at least 256 pixels of clear space on all sides for weapon and spell motion, no cropping, no frame edge contact
```

For runtime PNGs, the final background should be transparent. Use a plain white background for raw prompt/source images, then remove it before runtime frames are loaded by the game.

## Generated Strip Shape

Animation agents may generate one-row strips with up to 6 frames when the workflow can preserve the required per-frame canvas size, padding, shared scale, and bottom-center anchor. A `1x6` raw strip is acceptable for 6-frame idle, cast, attack, dodge, and similar compact animations only if every cell still meets the size and padding standards in this document.

Do not use a `1x6` prompt if the image generator shrinks the character cells, reduces the required empty margin, clips weapons/effects, or makes the strip too wide to inspect reliably. In that case, generate smaller one-row chunks such as `1x4` frames 1-4 plus `1x2` frames 5-6, then combine the cleaned frames after QC.

For 8-frame locomotion, continue to generate and process frames as one-row chunks that preserve the full per-cell standards, then compose the final direction strip or sheet after cleanup.

## Canvas And Anchor Standards

All frames in one animation direction should share:

- Same canvas size.
- Same character scale.
- Same bottom-center foot anchor.
- Same ground line.
- Same approximate head height for idle and locomotion.

Anchor policy:

- Place the character's standing point at bottom-center.
- Keep both feet visually connected to the same ground line unless the pose intentionally jumps.
- If one foot lifts during a walk cycle, the planted foot should still preserve the ground reference.
- Keep the shadow centered under the same gameplay position in previews.

Do not crop each frame independently for final runtime output unless the loader/draw profile is designed for measured opaque bounds. If frames are trimmed, preserve metadata or a shared draw profile that restores the bottom-center anchor.

## Direction Standards

Playable characters should be authored in four cardinal directions only. Do not request, generate, or block approval on diagonal animation frames.

```text
down
right
up
left
```

Compass naming is also acceptable when the loader maps it explicitly:

```text
south
east
north
west
```

Gameplay direction names map to compass directions as `down=south`, `up=north`, `right=east`, and `left=west`. If gameplay movement or targeting produces a diagonal facing, the renderer/loader should use the nearest cardinal frame. Diagonal-specific art is legacy-only and should not be part of new playable, companion, NPC, or humanoid monster animation handoffs.

## Animation Set Standards

New playable characters should provide these runtime animation families:

| Runtime animation | Recommended frames | Notes |
| --- | ---: | --- |
| `idle` | 6-8 | Subtle breathing, no foot drift. Six frames is the minimum for new or regenerated idle animations. |
| `walk` | 8 | Clear readable gait in all four cardinal directions. |
| `sprint` / `run` | 8 | Faster lean and stride than walk, with grounded alternating middle steps. |
| `dodge_roll` | 6-8 | Ends close enough to anchor cleanly after gameplay movement. |
| `attack1` | 6-8 | Basic auto attack or primary cast. |
| `attack1_side_slash` | 6-8 | Alternate attack/cast, can reuse with distinct timing if needed. |
| `attack2` | 8-12 | Special cast or heavier action. |
| `damage` | 2-4 | Hit reaction, readable but quick. |
| `victory` | 6-10 | Optional flourish; can fall back during prototype. |

Class identity animations such as `front_flip_slash`, `motherload_breaker`, or spell-specific casts should get their own source folders and draw profiles when their silhouette is much wider or taller than locomotion.

Walk, sprint, and run animations must include an alternating middle/passing step so the actor reads as grounded instead of sliding or floating. Across the 8-frame cycle, include left-foot contact, a middle/passing pose, right-foot contact, and the opposite middle/passing pose. Keep at least one foot visually planted on the ground line during contact and passing poses, preserve the same bottom-center baseline, and avoid vertical bobbing that makes the character hover.

## File Layout

Use this shape for playable character assets:

```text
assets/characters/<character_id>/
  portrait.png
  source/
    prompts/
    raw/
    qa/
  idle/frames/
  walk/frames/
  sprint/frames/
  dodge/frames/
  attack/frames/
  special_cast/frames/
  special_effects/
  projectiles/
  spells/
```

Generated source files should be kept under `source/raw/` or the animation-specific `raw/` folder. Runtime PNG frames should live under the animation `frames/` folder.

## Filename Standards

Use predictable names that sort lexically in frame order.

Gameplay direction style:

```text
<animation>_<direction>_<index:02d>.png
walk_down_01.png
attack_left_06.png
```

Compass style:

```text
<animation>_<compass_direction>_<index:02d>.png
walk_east_01.png
special_cast_north_08.png
```

Avoid spaces, uppercase file extensions, duplicate frame numbers, and mixed padding such as `1.png`, `02.png`, `003.png` in the same folder.

## Background And Transparency

Runtime frames should be transparent PNGs.

Intermediate background standard:

- Use a plain white background for generated raw sheets and source frames.
- Transparent source is acceptable when the tool can preserve clean alpha.
- Remove the white background during cleanup before exporting runtime frames.

Unacceptable runtime artifacts:

- White boxes around the sprite.
- Matte halos from failed background removal.
- Cropped weapons, hair, shadows, robes, or spell particles.
- Guide lines, labels, frame numbers, grid lines, or color bars.
- Inconsistent shadow baked into some frames but not others.

## QA Checklist

Before an animation is approved:

- Normal raw frames have at least 128 px empty padding on every side.
- Wide raw special frames have at least 256 px empty padding on every side.
- Runtime normalized frames have transparent margins appropriate to their profile, usually 24-128 px.
- No opaque pixel touches any frame edge.
- Runtime frames are transparent PNGs.
- Every frame in the same animation direction has the same canvas size.
- Character proportions are consistent across all four cardinal directions.
- Feet or intended anchor points stay planted.
- The action reads clearly at in-game scale.
- Consecutive frames are not accidentally identical.
- Attack/cast release frames are obvious enough for gameplay timing.
- Large effects do not hide enemy telegraphs for too long.
- Preview GIF or contact sheet has been inspected before runtime wiring.

## Animation Agent Handoff Prompt

When asking an animation agent to create a character animation, include this block:

```text
Create high-resolution MotherSeed 2D character sprite animation frames.
Use a square source canvas of 768 x 768 px per frame for normal character animation.
Keep the full body centered with at least 128 px of empty white space or transparent space on every side.
Use a plain white background for raw generation.
Do not crop the character, weapon, hair, robe, shadow, or effects.
Keep a stable bottom-center foot anchor and consistent character scale across all frames.
Author only the four cardinal directions: down/south, up/north, right/east, and left/west. Do not create diagonal animation frames.
Idle animations must contain at least 6 frames per direction.
One-row 6-frame strips are allowed when each cell still preserves the required source canvas size, padding, and anchor.
Normalize approved runtime frames to 256 x 256 px for locomotion or 384 x 384 px for action if the silhouette needs more room.
Export transparent PNG runtime frames with predictable names: <animation>_<direction>_<index:02d>.png.
Provide a preview GIF or contact sheet for QA.
```

For wide special attacks, replace the padding line with:

```text
Use a 1024 x 1024 px source canvas and keep at least 256 px of empty space on every side because this animation has wide weapon or spell motion.
```

## Runtime Integration Notes

- Sprite loading lives in `src/render/canvas2d/character-sprites.ts`.
- Draw profiles and visual scale live in `src/render/canvas2d/renderer.ts`.
- GIF extraction is documented in `docs/SPRITE_GIF_FRAME_EXTRACTION.md`.
- Playable character implementation is documented in `docs/PLAYABLE_CHARACTERS.md`.
- Canvas and image objects must stay in `src/render/canvas2d/`; do not store them in `src/game/` state.

# General 2D Sprite Animation Pipeline

Use this template for characters, monsters, bosses, NPCs, and other 2D animated subjects.

## Required Skill

Use `$game-studio:sprite-pipeline` throughout the animation build.

- Apply the skill during intake, setup, source-strip generation, normalization, preview rendering, GIF creation, QA, and final assembly.
- Keep the skill reference at the top of every copied prompt or worker prompt used for animation jobs.
- Follow the skill's whole-strip generation, shared-scale normalization, bottom-center anchoring, and preview-before-approval workflow.
- If live image generation or editing is needed, use it through this sprite-pipeline workflow rather than treating generation as a standalone step.

## Required Source

Every pipeline requires a four-directional base folder.

- The base folder is the source of truth for identity, silhouette, palette, proportions, body shape, outfit, anatomy, default items, and directional readability.
- The base folder must contain four canonical base files: `north.png`, `south.png`, `east.png`, and `west.png`.
- `north.png` is the north/up/back-facing base. `south.png` is the south/down/front-facing base. `east.png` is the east/right-facing base. `west.png` is the west/left-facing base.
- Character item, clothing, skin, hair, fur, scale, armor, and equipment colors must remain consistent across all four base files unless the user explicitly specifies a color change.
- If the base folder or any required cardinal base file is missing, stop and ask for the complete base folder before generating animations.
- Project root, subject type, subject id, and destination folder are inferred from the base folder location. Do not ask the user for them separately.
- The base folder must be inside the project at `<project>/assets/characters/<subject_id>/base/` or `<project>/assets/monsters/<subject_id>/base/`.
- Infer subject type from the `characters` or `monsters` path segment, subject id from the folder after that segment, and the subject pipeline folder from the subject folder that contains `base/`.
- If the base folder is outside the project, outside the correct asset location, or missing any required cardinal base file, stop and ask the user to move or complete it before generation.
- Do not use other characters, monsters, older animation sheets, or unrelated asset folders as source material unless the user explicitly approves that reference.

## Intake Questions

Ask these questions before starting a new animation pass.

Questions 1 and 2 are required. Use the defaults below for blank answers to questions 3 through 7.

1. What animation do you want to work on?
2. What is the location of the base folder?
3. Do you have any direction on how the animation should look?
4. Is there a number of frames you'd like the animation to be?
5. Do you want 8 directional or 4 directional set of animations?
6. Are there any required items/weapons the character should have on them or in their hands?
7. For monsters, would you like default size, medium, or large?

## Defaults

Animation direction/default style:

- Use readable production animation at game scale.
- Body motion should be clear and purposeful.
- Do not create a static pose with effects pasted on top.
- Every frame slot must be a distinct newly drawn animation pose, not a duplicate, near-duplicate, shifted copy, rotated copy, or same body pose with small effects added.
- Before generating, write a concise frame-by-frame pose plan for the requested frame count so each frame has a specific motion purpose.
- Frame-to-frame silhouettes must visibly change at game scale. For idle, use subtle but real breathing, weight, cloth, hair, weapon, tail, wing, or posture changes. For locomotion and actions, use clear limb, torso, head, weapon, or creature-anatomy progression.
- For action animations, include anticipation, contact/action, follow-through, and recovery.
- For action animations, the strip must include distinct key poses for wind-up, commitment, impact/cast/contact, follow-through, and recovery. Do not use an idle body with an effect drawn on top.

Frame counts:

- `idle`: 5 frames
- `walk`: 8 frames
- `run` or `sprint`: 8 frames
- `dodge`, `hurt`, `block`, `interact`: 5 frames
- `attack`, `cast`, `special`, `skill`: 8 frames
- `death`: 8 frames
- Unknown animation: 8 frames unless the user specifies otherwise

Direction set:

- Default is 8-directional.
- 8-direction order: `south`, `southeast`, `east`, `northeast`, `north`, `northwest`, `west`, `southwest`.
- 4-direction order: `south`, `east`, `north`, `west`.
- If the selected direction set is 8-directional, all eight directions are required for the animation. Generate, QA, preview, GIF, and approve every direction before assembly or completion.
- If the selected direction set is 4-directional, all four directions are required for the animation. Generate, QA, preview, GIF, and approve every direction before assembly or completion.
- Do not mark an animation complete with missing directions, skipped diagonals, or partial direction coverage unless the user explicitly changes the selected direction set.
- Legacy direction aliases are allowed only when needed by an existing engine export: `down=south`, `down_right=southeast`, `right=east`, `up_right=northeast`, `up=north`, `up_left=northwest`, `left=west`, `down_left=southwest`.

Serial direction processing:

- Process one animation plus one direction at a time.
- One queue row equals one job. One job equals one animation, one direction, one source prompt, one horizontal source strip, one normalization pass, one preview set, one GIF, and one QA note.
- Do not generate multiple directions in one source image, source sheet, canvas, prompt, or batch.
- Do not ask image generation for an 8-direction or 4-direction sheet. Ask only for the current direction named by the active queue row.
- Finish the current direction job to `approved` or `needs_revision` before starting source generation for another direction.
- Multi-direction source images are invalid even if they contain the right poses. Reject them and regenerate a single-direction strip for the active queue row.

Directional base selection:

- Cardinal animation jobs must use the matching cardinal base file: `north` uses `base/north.png`, `south` uses `base/south.png`, `east` uses `base/east.png`, and `west` uses `base/west.png`.
- Diagonal animation jobs must use both adjacent cardinal base files as references: `northeast` uses `base/north.png` and `base/east.png`; `southeast` uses `base/south.png` and `base/east.png`; `southwest` uses `base/south.png` and `base/west.png`; `northwest` uses `base/north.png` and `base/west.png`.
- The generated direction must preserve identity, colors, equipment, proportions, and silhouette consistency with the selected cardinal base source or source pair.
- Do not generate every direction from a single front-facing base. Each direction must use its mapped cardinal base source or adjacent cardinal source pair.

Items/equipment:

- Default: preserve items, weapons, clothing, props, horns, tails, wings, armor, or held objects visible in the directional base set.
- Preserve base-set colors for items, clothing, skin, hair, fur, scales, armor, and equipment unless the user specifically asks for a color change.
- Do not add new weapons, shields, items, or props unless the user asks for them.
- For monsters or creatures without hands, interpret this as required visible body features or carried/attached objects.

Monster size:

- Default: `default`, about character size, 1x character footprint.
- `medium`: about 2 times character size.
- `large`: about 3 times character size.
- Use `default` for characters, non-monsters, and blank monster-size answers.
- The selected monster size affects frame profile, source-strip spacing, raw gutter, reference canvas size, preview labeling, and QA expectations.
- Keep the selected monster size consistent across every direction and animation for the subject unless the user explicitly changes it.
- Do not shrink medium or large monsters into a character-sized frame. Use the size-aware frame profile instead.

## Frame Profiles

Use `frame_profiles.csv` as the starting point.

- Default gameplay profile: `default_128`, `128x128`, anchor `{ x: 64, y: 120 }`.
- Default expanded action profile: `expanded_action_384`, `384x384`, anchor `{ x: 192, y: 376 }`.
- Medium monster gameplay profile: `monster_medium_256`, `256x256`, anchor `{ x: 128, y: 240 }`.
- Medium monster expanded action profile: `monster_medium_action_768`, `768x768`, anchor `{ x: 384, y: 752 }`.
- Large monster gameplay profile: `monster_large_384`, `384x384`, anchor `{ x: 192, y: 360 }`.
- Large monster expanded action profile: `monster_large_action_1152`, `1152x1152`, anchor `{ x: 576, y: 1128 }`.

Use the expanded action profile for large attacks, spells, special effects, long weapons, wings, tails, leaps, or any animation where the full silhouette needs more room.

Choose profiles by monster size first, then by animation needs. For example, a medium monster uses `monster_medium_256` for ordinary idle or walk rows, and `monster_medium_action_768` for attacks, spells, specials, death, large effects, or oversized motion. A large monster uses `monster_large_384` or `monster_large_action_1152`.

## Source Strip Rules

Generate one full horizontal source strip for one animation/direction job.

- Use `$game-studio:sprite-pipeline` for every source-strip generation request.
- The source-generation prompt must name exactly one animation and exactly one direction.
- The generated source image must contain exactly one horizontal strip for the active direction only.
- Do not include rows, panels, labels, thumbnails, comparison poses, direction turnarounds, multiple facings, or any other direction in the source image.
- Do not batch required directions together. Generate `south`, `southeast`, `east`, `northeast`, `north`, `northwest`, `west`, and `southwest` as separate source-generation requests when 8-directional is selected.
- Generate the full strip in one request, but each frame slot inside that strip must be a different newly drawn pose for that frame's beat.
- Do not satisfy the frame count by duplicating the same pose, shifting the same pose, changing only the effect layer, changing only the shadow, or making only tiny accessory movements.
- Frame 1 may start close to the mapped base only when the animation needs it, but the strip may not repeat that base pose across the remaining frames.
- The source prompt must include numbered frame beats, one beat per requested frame, before image generation starts.
- Generate the strip from the mapped directional base file or adjacent cardinal base pair and the current prompt, not by rotating, warping, scaling, or drawing over an existing animation frame.
- Use `south.png`, `north.png`, `east.png`, or `west.png` for cardinal jobs, and use the two adjacent cardinal base files for diagonal jobs.
- Keep all poses on a flat `#ff00ff` chroma-key background or transparent background.
- The initial generated strip must leave at least one full frame of empty flat `#ff00ff` space between neighboring visible pose bounds before cleanup, segmentation, repack, or normalization.
- Full-frame spacing means at least the selected frame width: `128px` for `default_128`, `256px` for `monster_medium_256`, `384px` for `expanded_action_384` or `monster_large_384`, `768px` for `monster_medium_action_768`, and `1152px` for `monster_large_action_1152`.
- No body part, weapon, tail, wing, scarf, glow, slash, shadow, particle, alpha haze, or loose pixels may enter a neighboring pose lane.

If the source image contains more than one direction, multiple rows, turnarounds, panels, pose comparisons, source poses that overlap, effects that bridge pose lanes, or frames that are duplicated/near-duplicated/static, reject and regenerate the source. Do not try to salvage multi-direction, visibly contaminated, or static sources by equal-slot slicing.

## Normalization Rules

- Use `$game-studio:sprite-pipeline` for normalization and preview validation.
- Remove chroma key or preserve alpha.
- Segment by visible pose groups after cleanup before cropping.
- Repack poses into wide transparent slots.
- Normalize all frames in one job to one shared frame profile.
- Use one shared scale across the whole job.
- Align frames to one shared anchor, usually bottom-center.
- Do not shrink individual frames to fit effects. Use a larger frame profile instead.
- Do not shrink medium or large monsters to character scale. Preserve the selected monster footprint and use the matching size-aware profile.

## Directory Layout

Each animation should use this structure:

```text
<animation>/
  raw/        generated strips, chromakey sources, edit canvases, grouped/repacked intermediates
  frames/     normalized final frames named <job_id>_01.png, <job_id>_02.png, ...
  preview/    preview PNGs, 4x previews, focused QA sheets, overlays
  gif/        one looping GIF per direction/job named <job_id>.gif
  qa/         per-job QA notes
  assembled/  full sheets and metadata after all directions are approved
```

Do not assemble a full animation sheet while any direction for that animation is still `in_progress` or `needs_revision`.
Do not assemble a full animation sheet if the queue is missing any required direction for the selected direction set.

## QA Gates

Before approval, confirm:

- `$game-studio:sprite-pipeline` was used throughout the animation build.
- The job was processed as one animation plus one direction only.
- The source image contains exactly one horizontal strip for the active direction and no other directions, rows, panels, turnarounds, or grouped direction sheets.
- The base folder exists and contains `north.png`, `south.png`, `east.png`, and `west.png`.
- The correct mapped directional base file or adjacent cardinal base pair was used as the required source reference.
- The row was generated as the requested animation plus direction.
- The animation queue contains every required direction for the selected direction set.
- The frame count matches the requested or default frame count.
- The selected monster size and frame profile match the subject: default 1x, medium 2x, or large 3x.
- The direction is correct in every frame, including recovery frames.
- Every frame is a distinct newly drawn pose for its beat. No duplicated, near-duplicated, shifted, rotated, or effect-only copies of the base/body pose.
- The body or creature anatomy visibly moves; it is not a static base pose with effects pasted on top.
- Character item, clothing, skin, hair, fur, scale, armor, and equipment colors stay consistent with the directional base set unless the user specified changes.
- Required items/weapons/features are present, and unrequested items were not added.
- Initial source strip spacing passes the full-frame spacing gate.
- Final frames match the selected profile exactly.
- Transparent background is preserved.
- No final-frame edge contact or cropped effects.
- No inter-frame bleed in standard, enlarged, focused, or GIF previews.
- A looping GIF exists in `<animation>/gif/<job_id>.gif`.

## Assembly

Only assemble full sheets after all required directions for the animation are approved.

For 8-directional animations, the required approved directions are:

```text
south
southeast
east
northeast
north
northwest
west
southwest
```

For 4-directional animations, the required approved directions are:

```text
south
east
north
west
```

For 8-direction sheets, use canonical row order:

```text
south
southeast
east
northeast
north
northwest
west
southwest
```

For 4-direction sheets, use canonical row order:

```text
south
east
north
west
```

If an existing engine requires legacy row names, export aliases may map `south=down`, `southeast=down_right`, `east=right`, `northeast=up_right`, `north=up`, `northwest=up_left`, `west=left`, and `southwest=down_left` after QA approval.

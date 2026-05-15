# General 2D Sprite Animation Pipeline

Use this template for characters, monsters, bosses, NPCs, and other 2D animated subjects.

## Required Skill

Use `$game-studio:sprite-pipeline` throughout the animation build.

- Apply the skill during intake, setup, source-strip generation, normalization, preview rendering, GIF creation, QA, and final assembly.
- Keep the skill reference at the top of every copied prompt or worker prompt used for animation jobs.
- Follow the skill's whole-strip generation, shared-scale normalization, bottom-center anchoring, and preview-before-approval workflow.
- If live image generation or editing is needed, use it through this sprite-pipeline workflow rather than treating generation as a standalone step.

## Template-Only Tooling

Use only the reusable template files and the active `$game-studio:sprite-pipeline` workflow for the animation build.

- Do not search the project for existing animation tools, hidden scripts, old pipeline folders, prior generated strips, prior normalized frames, or automation from another character or monster.
- Do not use existing animation-specific tools or scripts unless they are explicitly named in this copied subject pipeline or the user explicitly approves them.
- Do not inspect old animation outputs to decide how to build the new animation. The only visual source is the required directional base folder plus any user-approved references.
- Treat every animation/direction job as fresh work: new source prompt, new one-direction strip, new normalized frames, new previews, new GIF, and new QA note.
- Use shell/file operations only to read the template files, verify required paths, copy template files, create required folders, and inspect current job outputs.
- If a fresh helper script, config, checklist, or temporary processing tool is created for this process, create it only under the current animation folder at `<SUBJECT_PIPELINE_FOLDER>/<ANIMATION>/tools/`.
- Name job-specific helper tools with the active `<JOB_ID>` prefix and list them in the job QA note and `animation_queue.csv`.
- Do not create, modify, or reuse shared animation tooling in the project root, project `scripts/`, reusable template folder, another subject folder, or another animation folder unless the user explicitly approves it.
- If a needed tool or workflow is not described in the reusable template files, do not hunt for one in the repo. Do the step from scratch following the template rules, or stop and ask the user to approve a specific tool.

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
- Do not use other characters, monsters, older animation sheets, unrelated asset folders, or previous generated outputs as source material unless the user explicitly approves that reference.

## Intake Questions

Ask these questions before starting a new animation pass.

Questions 1 and 2 are required. Use the defaults below for blank answers to questions 3 through 8.

1. What animation do you want to work on?
2. What is the location of the base folder?
3. Do you have any direction on how the animation should look?
4. Is there a number of frames you'd like the animation to be?
5. Do you want 8 directional or 4 directional set of animations?
6. Are there any required items/weapons the character should have on them or in their hands?
7. For monsters, would you like default size, medium, or large?
8. Should I follow the one-job-at-a-time pipeline from these templates?

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
- Required directions must be processed in canonical order unless the user explicitly selects a different active direction. The first default direction is `south`/`down`.
- Do not mark an animation complete with missing directions, skipped diagonals, or partial direction coverage unless the user explicitly changes the selected direction set.
- Legacy direction aliases are allowed only when needed by an existing engine export: `down=south`, `down_right=southeast`, `right=east`, `up_right=northeast`, `up=north`, `up_left=northwest`, `left=west`, `down_left=southwest`.

Serial direction processing:

- Default answer to "Should I follow the one-job-at-a-time pipeline from these templates?" is `Yes, strictly follow the templates`.
- If the user leaves the answer blank, treat it as yes.
- If the user answers no or asks for a different processing mode, do not start generation until they explicitly approve the alternate workflow, including whether directions may be batched and which template QA gates still apply.
- Process one animation plus one direction at a time.
- One queue row equals one job. One job equals one animation, one direction, one source prompt, one horizontal source strip, one normalization pass, one preview set, one GIF, and one QA note.
- One job is not complete when the raw strip is generated. A direction is complete only after the raw strip, normalized frames, preview PNGs, looping GIF, QA note, queue row paths, and approval status are all finished for that direction.
- Do not pre-generate raw strips or source prompts for later directions. Finish the current direction package before starting any task for the next direction.
- If the current direction is `south`/`down`, complete all `south`/`down` outputs under `raw/`, `frames/`, `preview/`, `gif/`, and `qa/` before starting `southeast`, `east`, or any other direction.
- Do not generate multiple directions in one source image, source sheet, canvas, prompt, or batch.
- Do not ask image generation for an 8-direction or 4-direction sheet. Ask only for the current direction named by the active queue row.
- Finish the current direction job to `approved` before starting source generation, cleanup, normalization, preview, GIF, or QA work for another direction.
- If the current direction is marked `needs_revision`, continue revising that same direction until it is `approved`, unless the user explicitly pauses or skips it.
- Before claiming or starting any direction, verify every earlier required direction in canonical order is already `approved` with completed raw, frame, preview, GIF, and QA outputs. If an earlier direction is pending, in progress, missing outputs, or needs revision, work on that earlier direction instead.
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
- For every initial source strip, explicitly check for the selected profile's required empty space between neighboring visible pose bounds before cleanup, slicing, repack, or normalization. The default/medium/large source whitespace padding is increased by `128px` above the old frame-width minimum.
- Monster spacing is measured between the rightmost visible pixel of pose `N` and the leftmost visible pixel of pose `N+1`, including body, limbs, tail, wings, weapons, shadows, glows, particles, alpha haze, and all effect pixels.
- If a monster strip fails this spacing check, reject and regenerate the source strip with a wider horizontal source canvas and larger gutters. Do not try to salvage it by equal-slot slicing, shrinking the monster, reducing the animation scale, or cropping effects.

## Large Model Whitespace Standard

Use this standard for medium monsters, large monsters, bosses, and any oversized subject using an expanded source canvas.

- Extra-wide source canvas space is reserved for empty margins, frame-lane gutters, motion, weapons, tails, wings, shadows, glows, particles, and effects. It is not available for scaling the core model larger.
- The source canvas width, lane width, action frame size, and gutter size must not influence model scale. The mapped base files and selected size profile define the model scale.
- Keep the core body/model at a stable gameplay footprint across every frame and direction. Do not let the model grow to fill an extra-wide lane, expanded action frame, or empty `#ff00ff` area.
- For `monster_medium_256` and `monster_large_384` gameplay profiles, target the core body/model at about 70-75% of the selected frame width and height. Treat 80% of selected frame width or height as the hard maximum before effects.
- For `monster_medium_action_768` and `monster_large_action_1152`, keep the core body/model at the matching gameplay-size footprint. The larger action canvas is for effects and motion range, not a larger body.
- For expanded action frames, effects may extend beyond the core body footprint, but the full body/effect bounds still need clear empty margins and must not touch frame edges or neighboring source lanes.
- If QA sees the model swell, become a larger version of itself, or fill the empty lane/canvas space, fail the strip as `needs_revision`. Required fix: regenerate at the same model scale on an extra-wide horizontal canvas with more empty margins and gutters.
- Preserve plenty of flat `#ff00ff` or transparent space around each pose. The empty space is intentional production padding, not unused space to fill.

## Action/Attack Whitespace Standard

Use this standard for `attack`, `cast`, `special`, `skill`, `death`, `large_effect`, lunges, weapon swings, spell casts, projectile starts, wing strikes, tail strikes, leaps, impact flashes, and other high-motion rows.

- Treat action/attack rows as expanded-canvas rows by default. They need extra room for anticipation, commitment, contact/cast/impact, follow-through, recovery, weapons, trails, effects, wings, tails, shadows, and particles.
- The full action envelope includes the body, weapon, item, limb, tail, wing, slash arc, spell glow, hit flash, projectile start, shadow, smoke, particle, alpha haze, and every loose effect pixel.
- Preserve obvious empty `#ff00ff` or transparent space around the full action envelope in every raw source frame and every normalized frame.
- The expanded action canvas is a whitespace and motion budget. It is not permission to scale the core body larger or stretch the effect until it reaches the lane or frame edge.
- If the action envelope touches or nearly touches the source image edge, frame edge, neighboring pose lane, or required gutter, fail the row as `needs_revision`.
- Required fix for failed action/attack whitespace: regenerate on a wider horizontal source canvas with larger gutters, or move to the next larger expanded action profile when needed, while keeping the core body at the same gameplay scale.
- When in doubt, preserve more empty space. A readable attack with generous margins is preferred over a tightly packed attack that risks bleed or cutoff.

## Frame Profiles

Use `frame_profiles.csv` as the starting point.

- Default gameplay profile: `default_128`, `128x128`, anchor `{ x: 64, y: 120 }`.
- Default expanded action profile: `expanded_action_384`, `384x384`, anchor `{ x: 192, y: 376 }`.
- Medium monster gameplay profile: `monster_medium_256`, `256x256`, anchor `{ x: 128, y: 240 }`.
- Medium monster expanded action profile: `monster_medium_action_768`, `768x768`, anchor `{ x: 384, y: 752 }`.
- Large monster gameplay profile: `monster_large_384`, `384x384`, anchor `{ x: 192, y: 360 }`.
- Large monster expanded action profile: `monster_large_action_1152`, `1152x1152`, anchor `{ x: 576, y: 1128 }`.

Use the expanded action profile for large attacks, spells, special effects, long weapons, wings, tails, leaps, or any animation where the full action envelope needs more room.

Choose profiles by monster size first, then by animation needs. For example, a medium monster uses `monster_medium_256` for ordinary idle or walk rows, and `monster_medium_action_768` for attacks, spells, specials, death, large effects, or oversized motion. A large monster uses `monster_large_384` or `monster_large_action_1152`.

Use `min_raw_gutter_px` as a starting horizontal safety gutter for source generation. If the generated strip cannot meet the required spacing at the selected subject scale, increase the raw source canvas width and source gutters. Never reduce the subject scale to satisfy source spacing.

For medium and large models, use `min_top_side_padding_px` as a minimum internal whitespace requirement in normalized frames. More padding is preferred when the animation still reads clearly. Do not reduce padding just because the canvas has unused room.

## Source Strip Rules

Generate one full horizontal source strip for one animation/direction job.

- Use `$game-studio:sprite-pipeline` for every source-strip generation request.
- The source-generation prompt must name exactly one animation and exactly one direction.
- The initial source-generation prompt must explicitly request an extended-width horizontal canvas with expanded empty distance between every frame lane. It must say not to make a compact strip.
- For medium and large models, the source-generation prompt must explicitly say: keep the core model at the selected gameplay scale; do not enlarge the model to fill the extra-wide canvas, frame lane, or empty space; preserve plenty of flat `#ff00ff` or transparent space around every pose.
- For action/attack rows, the source-generation prompt must explicitly say: preserve extra empty `#ff00ff` or transparent space around the full action envelope, including body, weapon, slash/trail, spell glow, particles, shadow, wings, tail, and recovery motion.
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
- The initial generated strip must leave at least the selected profile's required empty flat `#ff00ff` spacing between neighboring visible pose bounds before cleanup, segmentation, repack, or normalization.
- The initial generated strip should have extended canvas distance between frames, not merely barely separated slots. The hard minimum is the selected profile spacing; when in doubt, make the source canvas wider and the gutters larger.
- Required source spacing is frame-profile specific and includes the extra `128px` whitespace padding: `256px` for `default_128`, `384px` for `monster_medium_256`, `512px` for `expanded_action_384` or `monster_large_384`, `896px` for `monster_medium_action_768`, and `1280px` for `monster_large_action_1152`.
- If selected profile spacing cannot fit inside the requested source image, request or build a wider horizontal source canvas. Increase canvas width, lane width, and flat `#ff00ff` gutters rather than reducing pose size.
- Minimum source canvas width should be treated as flexible and expandable. Start with at least `(frame_count * selected_frame_width) + ((frame_count - 1) * min_initial_source_spacing_px) + (2 * min_raw_gutter_px)`, then expand wider if oversized poses, weapons, tails, wings, shadows, glows, or effects need more room.
- Extended canvas and lane width must not change subject scale. If there is extra room, leave it empty.
- For action/attack rows, measure spacing and edge safety against the full action envelope, not only the body. Weapon arcs, trails, impact flashes, spell glow, smoke, particles, and alpha haze count as visible bounds.
- If an action/attack envelope is tight, clipped, near the edge, or close to a neighboring lane, expand the horizontal canvas, lane width, gutters, or frame profile. Do not shrink the subject, enlarge the effect to fill the lane, crop the envelope, or accept reduced padding.
- For monster jobs, treat the selected profile spacing rule as a hard gate. Measure the empty gutter between each neighboring pair of visible poses and confirm it is at least `384px` for medium gameplay, `512px` for large gameplay, `896px` for medium action/effect rows, or `1280px` for large action/effect rows before accepting the strip.
- For monster action, spell, special, death, leap, wing, tail, or large-effect rows, use the expanded monster action profile spacing: `896px` for medium monsters and `1280px` for large monsters.
- Review the raw generated strip immediately after generation and before cleanup, slicing, repack, or normalization. If the measured spacing is below the selected profile spacing requirement, fail QA for that strip and mark it `needs_revision` with the instruction: "Regenerate with an extended-width horizontal source canvas and larger empty gutters between frame lanes."
- Reject monster source strips where extended anatomy, weapons, shadows, glows, slashes, smoke, sparks, particles, or alpha haze touch another pose lane or reduce the empty gutter below the selected profile spacing. Regenerate on a wider source canvas at the same monster scale.
- No body part, weapon, tail, wing, scarf, glow, slash, shadow, particle, alpha haze, or loose pixels may enter a neighboring pose lane.

If the source image contains more than one direction, multiple rows, turnarounds, panels, pose comparisons, source poses that overlap, effects that bridge pose lanes, spacing below the selected profile spacing requirement, or frames that are duplicated/near-duplicated/static, reject and regenerate the source. Do not try to salvage multi-direction, visibly contaminated, tightly spaced, or static sources by equal-slot slicing.

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
- Do not shrink frames or poses to create more inter-frame spacing. Spacing problems must be fixed in the raw/source stage by expanding canvas width, source lane width, raw gutter, or by regenerating with wider spacing.
- Do not enlarge frames or poses to fill empty source canvas, wide lanes, or expanded action profiles. Normalize from the subject's selected scale and preserve empty transparent padding.

## Directory Layout

Each animation should use this structure:

```text
<animation>/
  raw/        generated strips, chromakey sources, edit canvases, grouped/repacked intermediates
  frames/     normalized final frames named <job_id>_01.png, <job_id>_02.png, ...
  preview/    preview PNGs, 4x previews, focused QA sheets, overlays
  gif/        one looping GIF per direction/job named <job_id>.gif
  qa/         per-job QA notes
  tools/      freshly created helper scripts, configs, checklists, or temporary job tools
  assembled/  full sheets and metadata after all directions are approved
```

Do not assemble a full animation sheet while any direction for that animation is still `in_progress` or `needs_revision`.
Do not assemble a full animation sheet if the queue is missing any required direction for the selected direction set.

Do not assemble, prefetch, pre-generate, or prepare later-direction source strips while an earlier direction is still pending, in progress, missing deliverables, or needs revision.

## QA Gates

Before approval, confirm:

- `$game-studio:sprite-pipeline` was used throughout the animation build.
- Only reusable template files and user-approved tooling/references were used; no existing project animation tooling or old generated outputs were discovered and reused.
- Any fresh helper tools created for the process live under `<animation>/tools/`, are named/scoped to the active animation or `<job_id>`, and are listed in the queue and QA note.
- No helper tools were created or modified in shared project locations, the reusable template folder, another subject folder, or another animation folder without explicit user approval.
- The job was processed as one animation plus one direction only.
- No later direction was started before this direction had completed raw output, normalized frames, previews, GIF, QA note, queue row update, and `approved` status.
- If this was not the first direction in canonical order, all earlier required directions were already approved with completed raw, frame, preview, GIF, and QA outputs before this job started.
- The source image contains exactly one horizontal strip for the active direction and no other directions, rows, panels, turnarounds, or grouped direction sheets.
- The initial source-generation request explicitly asked for an extended-width horizontal canvas and expanded empty distance between every frame lane.
- Raw-strip spacing was reviewed immediately after generation and before cleanup/repack/normalization.
- The base folder exists and contains `north.png`, `south.png`, `east.png`, and `west.png`.
- The correct mapped directional base file or adjacent cardinal base pair was used as the required source reference.
- The row was generated as the requested animation plus direction.
- The animation queue contains every required direction for the selected direction set.
- The frame count matches the requested or default frame count.
- The selected monster size and frame profile match the subject: default 1x, medium 2x, or large 3x.
- Medium/large model whitespace standard passed: the core model did not grow to fill the extra-wide canvas, lane, or expanded frame, and normalized frames retain plenty of empty transparent padding.
- For medium/large gameplay frames, the core model remains near the 70-75% target occupancy and does not exceed the 80% hard maximum before effects.
- For medium/large expanded action frames, the core model remains at the matching gameplay-size footprint; only motion/effects use the expanded canvas.
- Action/attack whitespace standard passed: the full action envelope has obvious empty `#ff00ff` or transparent margins in raw source frames and normalized frames.
- For action/attack rows, weapons, trails, slashes, spell glows, particles, shadows, wings, tails, and recovery motion do not touch source edges, final frame edges, neighboring pose lanes, or required gutters.
- If action/attack whitespace failed, the row was marked `needs_revision` with instructions to regenerate on a wider horizontal source canvas with larger gutters or a larger expanded action profile while preserving the same core body scale.
- For monster jobs, the selected monster profile's `min_initial_source_spacing_px` was used as the minimum empty gutter between every neighboring pair of visible source poses.
- For monster jobs, the initial source strip was rejected and regenerated on a wider horizontal source canvas if any neighboring pose gap was less than the selected profile spacing or if any effect/anatomy crossed into a neighboring pose lane.
- The spacing requirement was satisfied by source canvas width, lane width, and gutter size, not by shrinking the subject, reducing animation scale, or cropping effects.
- The direction is correct in every frame, including recovery frames.
- Every frame is a distinct newly drawn pose for its beat. No duplicated, near-duplicated, shifted, rotated, or effect-only copies of the base/body pose.
- The body or creature anatomy visibly moves; it is not a static base pose with effects pasted on top.
- Character item, clothing, skin, hair, fur, scale, armor, and equipment colors stay consistent with the directional base set unless the user specified changes.
- Required items/weapons/features are present, and unrequested items were not added.
- Initial source strip spacing passes the selected profile spacing gate.
- If initial strip spacing did not pass, the row was marked `needs_revision` with instructions to regenerate on an extended-width horizontal source canvas with larger gutters. No normalization was approved from a failing raw strip.
- Monster source strip spacing was checked before cleanup/repack/normalization, not only after final frames were produced.
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

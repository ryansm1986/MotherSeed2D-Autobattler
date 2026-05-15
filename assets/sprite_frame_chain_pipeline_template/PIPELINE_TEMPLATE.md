# Sprite Frame-Chain Pipeline

Use this template for one-frame-at-a-time 2D animation generation for characters, monsters, bosses, NPCs, and other sprite subjects.

## Required Skill

Use `$game-studio:sprite-pipeline` throughout the animation build.

- This is an explicit user-approved frame-by-frame mode. The sprite-pipeline skill normally prefers whole-strip generation because frame chains can drift; this template accepts that tradeoff and adds stricter anti-drift QA.
- Apply the skill during intake, setup, per-frame source generation, normalization, preview rendering, GIF creation, QA, and final assembly.
- Keep the skill reference at the top of every copied prompt or worker prompt used for animation jobs.
- Use the skill's shared-scale normalization, bottom-center anchoring, and preview-before-approval workflow after the raw frame chain is approved.

## Template-Only Tooling

Use only the reusable template files and the active `$game-studio:sprite-pipeline` workflow for the animation build.

- Do not search the project for existing animation tools, hidden scripts, old pipeline folders, prior generated strips, prior normalized frames, or automation from another character or monster.
- Do not use existing animation-specific tools or scripts unless they are explicitly named in this copied subject pipeline or the user explicitly approves them.
- Treat every animation/direction/frame as fresh work: new per-frame prompt, new raw source frame, new frame QA note, then shared normalization after all raw frames are approved.
- If a fresh helper script, config, checklist, or temporary processing tool is created, create it only under `<SUBJECT_PIPELINE_FOLDER>/<ANIMATION>/tools/`.
- Name job-specific helper tools with the active `<JOB_ID>` prefix and list them in the frame QA, direction QA, and `animation_queue.csv`.

## Required Source

Every pipeline requires a four-directional base folder.

- The base folder is the source of truth for identity, silhouette, palette, proportions, body shape, outfit, anatomy, default items, and directional readability.
- The base folder must contain `north.png`, `south.png`, `east.png`, and `west.png`.
- Project root, subject type, subject id, and destination folder are inferred from the base folder location. Do not ask the user for them separately.
- The base folder must be inside the project at `<project>/assets/characters/<subject_id>/base/` or `<project>/assets/monsters/<subject_id>/base/`.
- Infer subject type from the `characters` or `monsters` path segment, subject id from the folder after that segment, and the subject pipeline folder from the subject folder that contains `base/`.
- If the base folder is outside the project, outside the correct asset location, or missing any required cardinal base file, stop and ask the user to move or complete it before generation.

## Intake Questions

Questions 1 and 2 are required. Use the defaults below for blank answers to questions 3 through 8.

1. What animation do you want to work on?
2. What is the location of the base folder?
3. Do you have any direction on how the animation should look?
4. Is there a number of frames you'd like the animation to be?
5. Do you want 8 directional or 4 directional set of animations?
6. Are there any required items/weapons the character should have on them or in their hands?
7. For monsters, would you like default size, medium, or large?
8. Should I follow the one-job-at-a-time frame-chain pipeline from these templates?

## Defaults

Animation direction/default style:

- Use readable production animation at game scale.
- Body motion should be clear and purposeful.
- Every frame must be a distinct newly generated picture for its planned beat.
- Do not create a static pose with effects pasted on top.
- Before generating frame 01, write a concise frame-by-frame pose plan for the requested frame count.
- Frame-to-frame silhouettes must visibly change at game scale.
- For action animations, include anticipation, contact/action, follow-through, and recovery.

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
- If the selected direction set is 8-directional, all eight directions are required for the animation.
- If the selected direction set is 4-directional, all four directions are required for the animation.
- Required directions must be processed in canonical order unless the user explicitly selects a different active direction. The first default direction is `south`/`down`.

## Serial Frame-Chain Processing

- Default answer to "Should I follow the one-job-at-a-time frame-chain pipeline from these templates?" is `Yes, strictly follow the templates`.
- If the user leaves the answer blank, treat it as yes.
- Process one animation plus one direction plus one frame at a time.
- One direction job is not complete until every raw source frame is approved, all frames are normalized together, previews and GIF are rendered, direction QA is written, the queue row is updated, and the direction status is `approved`.
- Do not generate a full source strip.
- Do not generate multiple source frames in one image, one prompt, one source canvas, or one batch.
- Do not move to frame `N+1` until frame `N` is approved.
- Do not move to a later direction while the current direction has any pending, in-progress, or needs-revision frame.
- If a frame is marked `needs_revision`, keep revising that same frame from the same previous approved source until it is approved, unless the user explicitly pauses or skips it.
- Before starting any direction, verify every earlier required direction in canonical order is already `approved` with completed raw frames, normalized frames, previews, GIF, QA, and queue outputs.

## Directional Base Selection

- `north` uses `<BASE_FOLDER_PATH>/north.png`.
- `south` uses `<BASE_FOLDER_PATH>/south.png`.
- `east` uses `<BASE_FOLDER_PATH>/east.png`.
- `west` uses `<BASE_FOLDER_PATH>/west.png`.
- `northeast` uses both `<BASE_FOLDER_PATH>/north.png` and `<BASE_FOLDER_PATH>/east.png`.
- `southeast` uses both `<BASE_FOLDER_PATH>/south.png` and `<BASE_FOLDER_PATH>/east.png`.
- `southwest` uses both `<BASE_FOLDER_PATH>/south.png` and `<BASE_FOLDER_PATH>/west.png`.
- `northwest` uses both `<BASE_FOLDER_PATH>/north.png` and `<BASE_FOLDER_PATH>/west.png`.
- Diagonal frame-chain jobs use the adjacent cardinal base pair as identity references for every frame.

## Frame Source Chain

Each frame uses a primary motion source and persistent identity reference.

- Frame 01 primary source: mapped directional base file or adjacent cardinal base pair.
- Frame 01 identity reference: mapped directional base file or adjacent cardinal base pair.
- Frame 02 primary source: approved raw or normalized frame 01.
- Frame 02 identity reference: original mapped base source(s), plus approved frame 01 when useful.
- Frame `N` primary source: approved raw or normalized frame `N-1`.
- Frame `N` identity reference: original mapped base source(s), plus frame 01 when useful for style lock.
- The previous frame is a continuity source, not a final image to slide, rotate, smear, or draw effects over.
- The prompt must ask for a new complete frame for the planned beat while preserving identity from the base.
- If the chain drifts, return to the last approved stable frame and regenerate the failed frame with stronger base-reference language.

## Monster Size

- Default: `default`, about character size, 1x character footprint.
- `medium`: about 2 times character size.
- `large`: about 3 times character size.
- Use `default` for characters, non-monsters, and blank monster-size answers.
- The selected monster size affects frame profile, raw source canvas size, preview labeling, and QA expectations.
- Keep the selected monster size consistent across every direction and animation for the subject unless the user explicitly changes it.
- Do not shrink medium or large monsters into a character-sized frame. Use the size-aware frame profile instead.

## Large Model Whitespace Standard

Use this standard for medium monsters, large monsters, bosses, and oversized subjects.

- Extra source canvas space is reserved for empty margins, motion, weapons, tails, wings, shadows, glows, particles, and effects.
- The source canvas size and expanded action frame size must not influence model scale. The mapped base files and selected size profile define model scale.
- Keep the core body/model at a stable gameplay footprint across every frame and direction.
- For `monster_medium_256` and `monster_large_384` gameplay profiles, target the core body/model at about 70-75% of the selected frame width and height. Treat 80% as the hard maximum before effects.
- For `monster_medium_action_768` and `monster_large_action_1152`, keep the core body/model at the matching gameplay-size footprint. The larger action canvas is for effects and motion range, not a larger body.

## Action/Attack Whitespace Standard

Use this standard for `attack`, `cast`, `special`, `skill`, `death`, `large_effect`, lunges, weapon swings, spell casts, projectile starts, wing strikes, tail strikes, leaps, impact flashes, and other high-motion rows.

- Treat action/attack rows as expanded-canvas rows by default.
- The full action envelope includes the body, weapon, item, limb, tail, wing, slash arc, spell glow, hit flash, projectile start, shadow, smoke, particle, alpha haze, and every loose effect pixel.
- Preserve obvious empty `#ff00ff` or transparent space around the full action envelope in every raw source frame and every normalized frame.
- If the action envelope touches or nearly touches the raw source edge, normalized frame edge, or required padding, fail the frame as `needs_revision`.
- Required fix: regenerate that same frame on a larger source canvas or use a larger expanded action profile while keeping the core body at the same gameplay scale.

## Frame Profiles

Use `frame_profiles.csv` as the starting point.

- Default gameplay profile: `default_128`, `128x128`, anchor `{ x: 64, y: 120 }`.
- Default expanded action profile: `expanded_action_384`, `384x384`, anchor `{ x: 192, y: 376 }`.
- Medium monster gameplay profile: `monster_medium_256`, `256x256`, anchor `{ x: 128, y: 240 }`.
- Medium monster expanded action profile: `monster_medium_action_768`, `768x768`, anchor `{ x: 384, y: 752 }`.
- Large monster gameplay profile: `monster_large_384`, `384x384`, anchor `{ x: 192, y: 360 }`.
- Large monster expanded action profile: `monster_large_action_1152`, `1152x1152`, anchor `{ x: 576, y: 1128 }`.

Choose profiles by monster size first, then by animation needs. Use expanded action profiles for attacks, spells, specials, death, large effects, long weapons, wings, tails, leaps, or any animation where the full action envelope needs more room.

## Per-Frame Source Rules

Generate exactly one raw source frame for one animation, one direction, and one frame index.

- Use `$game-studio:sprite-pipeline` for every source-frame generation request.
- The source-generation prompt must name exactly one animation, one direction, and one frame index.
- The source-generation prompt must include the planned beat for that frame.
- The source-generation prompt must include the original mapped base source(s) as identity references.
- For frame 02 and later, the source-generation prompt must include the previous approved frame as the primary motion source.
- The generated source image must contain exactly one complete sprite frame, centered on a generous transparent or flat `#ff00ff` canvas.
- Do not include strips, rows, panels, labels, thumbnails, comparison poses, direction turnarounds, multiple facings, scenery, UI, or any other frame.
- Do not ask image generation for a sprite sheet or multi-frame output.
- The frame must be a newly generated pose for the planned beat. It cannot be a duplicate, near-duplicate, shifted copy, rotated copy, scale-only copy, shadow-only change, or effect-only change.
- Keep the same subject, facing direction, silhouette family, proportions, palette family, readable key features, outfit, and required equipment.
- Preserve base-set colors for items, clothing, skin, hair, fur, scales, armor, and equipment unless the user specifically asks for a color change.
- Keep all raw source frames on a flat `#ff00ff` chroma-key background or transparent background.
- Use a raw source canvas larger than the final frame profile so there is room for padding, action, effects, and QA cropping decisions.
- Do not scale the body or effect up to fill the raw canvas.
- Do not crop body parts, weapons, tails, wings, shadows, glows, particles, alpha haze, or effects.

## Frame Approval Gates

Before frame `N` can become the source for frame `N+1`, confirm:

- The generated image contains exactly one frame.
- The frame uses the correct animation, direction, and planned beat.
- The frame is a distinct new pose from the previous approved frame.
- The body or creature anatomy visibly changes in a way appropriate to the animation.
- The previous frame was used for continuity, not copied in place.
- The original base source identity remains intact.
- There is no visible drift in color, proportions, equipment, size, anatomy, or facing direction.
- Required items, weapons, clothing, armor, body features, horns, claws, wings, tails, glow, or other specified details are present.
- No unrequested items, weapons, shields, props, limbs, heads, tails, wings, or unrelated objects were added.
- Raw canvas padding is generous.
- Action/attack full-envelope whitespace passes when applicable.
- No source edge contact or cropped effect/body pixels.
- Transparent or `#ff00ff` background is preserved.

If any gate fails, mark the frame `needs_revision`, record the failure, and regenerate the same frame from the same previous approved source plus the original base.

## Normalization Rules

- Normalize only after every raw source frame for the active direction is approved.
- Use `$game-studio:sprite-pipeline` for normalization and preview validation.
- Remove chroma key or preserve alpha.
- Normalize all frames in the direction to one shared frame profile.
- Use one shared scale across the whole direction.
- Align frames to one shared anchor, usually bottom-center.
- Do not shrink individual frames to fit effects. Use a larger frame profile instead.
- Do not shrink medium or large monsters to character scale.
- Do not enlarge frames or poses to fill empty source canvas or expanded action profiles.
- Save frames as `<SUBJECT_PIPELINE_FOLDER>/<ANIMATION>/frames/<JOB_ID>_01.png` through the final frame.

## Directory Layout

Each animation should use this structure:

```text
<animation>/
  raw/        one raw source image per frame
  frames/     normalized final frames named <job_id>_01.png, <job_id>_02.png, ...
  preview/    preview PNGs, 4x previews, focused QA sheets, overlays
  gif/        one looping GIF per direction/job named <job_id>.gif
  qa/         per-frame QA, frame-chain manifest, and final direction QA
  tools/      freshly created helper scripts, configs, checklists, or temporary job tools
  assembled/  full sheets and metadata after all directions are approved
```

Do not assemble a full animation sheet while any direction or frame for that animation is pending, in progress, or needs revision.

## QA Gates

Before direction approval, confirm:

- `$game-studio:sprite-pipeline` was used throughout the animation build.
- Only reusable template files and user-approved tooling/references were used.
- Any fresh helper tools live under `<animation>/tools/` and are listed in the queue and QA notes.
- No full source strip or multi-frame generated source was used.
- The direction was processed one frame at a time in frame-index order.
- No later frame started before the previous frame was approved.
- No later direction started before this direction had completed raw frames, frame QA, normalized frames, previews, GIF, final direction QA, queue row update, and `approved` status.
- The base folder exists and contains `north.png`, `south.png`, `east.png`, and `west.png`.
- The correct mapped directional base file or adjacent cardinal base pair was used for every frame.
- The frame count matches the requested or default frame count.
- Every raw frame is a distinct newly generated pose for its beat.
- The chain did not drift in identity, colors, scale, equipment, or facing direction.
- Action/attack full-envelope whitespace passed when applicable.
- Final frames match the selected profile exactly.
- Transparent background is preserved.
- No final-frame edge contact or cropped effects.
- No inter-frame visual popping beyond the intended animation motion.
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

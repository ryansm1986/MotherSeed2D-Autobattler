# Agent Job Prompt: idle_south

Use `$game-studio:sprite-pipeline`.

Keep using `$game-studio:sprite-pipeline` for the entire job: source-strip generation, cleanup, normalization, preview rendering, GIF creation, QA notes, and queue update.

Process exactly one animation/direction job at a time from full start to full finish. Do not generate or process multiple directions in one source image, one source sheet, one prompt, one batch, or one work pass.

Use only the reusable template files copied from `D:\projects\MotherSeed2D\assets\sprite_pipeline_template` and `$game-studio:sprite-pipeline` for this job. Do not search the project for existing animation tools, old pipeline scripts, old generated strips, old normalized frames, hidden automation, or another character/monster pipeline.

Inferred project root: `D:\projects\MotherSeed2D`
Inferred subject id: `shroom_boy`
Inferred subject type: `monster`
Base folder: `D:\projects\MotherSeed2D\assets\monsters\shroom_boy\base`
Required base files: `D:\projects\MotherSeed2D\assets\monsters\shroom_boy\base\north.png`, `D:\projects\MotherSeed2D\assets\monsters\shroom_boy\base\south.png`, `D:\projects\MotherSeed2D\assets\monsters\shroom_boy\base\east.png`, `D:\projects\MotherSeed2D\assets\monsters\shroom_boy\base\west.png`
Mapped base source(s) for this job: `D:\projects\MotherSeed2D\assets\monsters\shroom_boy\base\south.png`
Inferred pipeline folder: `D:\projects\MotherSeed2D\assets\monsters\shroom_boy`
Queue file: `D:\projects\MotherSeed2D\assets\monsters\shroom_boy\animation_queue.csv`
Frame profiles: `D:\projects\MotherSeed2D\assets\monsters\shroom_boy\frame_profiles.csv`
Subject size: `default`
One-job-at-a-time answer: `Yes, strictly follow the templates`

Task: Work only on `idle_south`, which is `idle/south` with `5` frames.

## Active Job Settings

- Direction set: `8_directional`
- Required directions: `south`, `southeast`, `east`, `northeast`, `north`, `northwest`, `west`, `southwest`
- Frame profile: `default_128`
- Final frame size: `128x128`
- Anchor: bottom-center at `{ x: 64, y: 120 }`
- Required initial source-strip spacing: at least `256px` empty flat `#ff00ff` space between neighboring visible pose bounds before cleanup/repack/normalization
- Minimum raw gutter: `256px`
- Minimum source canvas width: at least `(5 * 128) + (4 * 256) + (2 * 256) = 2176px`, and wider if needed
- Required items/features: preserve visible base-set shroom features, colors, face, cap/head silhouette, hands, body shape, and proportions; do not add unrequested items or weapons
- User animation direction: the monster should stand and only move its face, head, or hands in the 5 generated frames

## Numbered Frame-By-Frame Pose Plan

1. Neutral south-facing idle stance: feet/body planted, cap settled, face looking forward, hands relaxed near the body.
2. Small inhale/readiness beat: cap/head lifts a few pixels, eyes/face subtly brighten or widen, hands rise slightly without moving the body from its planted stance.
3. Peak idle expression: head tilts gently, face changes clearly, one or both hands make a tiny expressive curl or lift; body remains standing in place.
4. Exhale/settle beat: cap/head eases back down, facial expression softens, hands lower toward the neutral position.
5. Loop return beat: pose returns close to frame 1 but not an exact duplicate; face, head, and hands align for a seamless loop into frame 1.

## Source Generation Request

Use these exact base picture reference(s): `D:\projects\MotherSeed2D\assets\monsters\shroom_boy\base\south.png`

Generate exactly one fresh full horizontal source strip for `idle/south` only, with exactly 5 frame slots. Use a flat `#ff00ff` chroma-key background or transparent background. The strip must show only the south-facing direction. Do not include multiple directions, multiple rows, labels, reference grids, thumbnails, turnarounds, comparison panels, scenery, UI, or poster composition.

Create an extended-width horizontal canvas with expanded empty distance between every frame lane. Do not make a compact strip. Preserve at least 256px of empty flat `#ff00ff` space between neighboring visible pose bounds before any cleanup, slicing, repack, or normalization. Prefer a wider horizontal canvas over smaller poses when spacing is tight. Keep the monster at the selected default gameplay scale; do not shrink it to satisfy spacing and do not enlarge it to fill the extra-wide canvas or lane.

Every frame must be a distinct newly drawn idle pose for the numbered beat plan. Do not duplicate, near-duplicate, shift, rotate, scale, smear, or use effect-only copies of the same body pose. The body must stay standing and planted; only the face, head/cap, and hands should move. Preserve the base-set palette, shroom cap/head silhouette, face, hands, body proportions, and visible features from `D:\projects\MotherSeed2D\assets\monsters\shroom_boy\base\south.png`. Do not add weapons, props, extra limbs, extra heads, unrelated items, scenery, text, watermark, shadows that bridge lanes, or loose pixels in the gutters.

After generation, save the raw source strip as `D:\projects\MotherSeed2D\assets\monsters\shroom_boy\idle\raw\idle_south_raw.png`, then review raw spacing before cleanup/repack/normalization.

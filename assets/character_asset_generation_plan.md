# Parallel-Safe 8-Direction Animation Pipeline

## Summary
Generate 48 total jobs: 6 animations x 8 directions. The pipeline must treat each job as exactly one animation plus one direction, finish QA for that job, then move to another row. No batching across animations, no batching across directions.

Multiple agents may work at the same time, but each agent must own exactly one queue row and one file prefix. Parallel work is safe only when agents claim different `job_id` rows and write only to that row's expected files.

The user will supply the approved base sprite. Before animation generation begins, prepare that base sprite by making its background transparent without distorting, recoloring, or compressing the character pixels.

For every animation/direction job, the agent must generate new pictures that fit the current spec. Example: for `idle_right`, use the approved base sprite as the character model, generate a correct `idle_right` pose, then generate the additional frames needed to make that idle animation look natural.

## Base Sprite Preparation
1. Save the user-supplied base sprite as the untouched original.
2. Create a working copy for transparency cleanup.
3. Remove only the background pixels and preserve the character pixels exactly.
4. Do not apply color correction, smoothing, scaling, compression, palette reduction, or anti-aliasing changes to the character.
5. Export a transparent PNG as the canonical base sprite.
6. QA the cleaned base sprite against the original.
7. Use only the approved transparent base sprite for every animation job.

## Job Queue
Create a single queue table with:

`job_id`, `animation`, `direction`, `frame_count`, `status`, `base_sprite`, `generated_pose`, `raw_output`, `normalized_output`, `preview`, `qa_notes`

Allowed statuses:

`pending`, `in_progress`, `needs_revision`, `approved`, `rejected`

Multiple rows may be `in_progress` when multiple agents are active. Each `in_progress` row must include an owner note in `qa_notes` such as `Owner: <agent/thread>; claimed: <date/time>; scope: <job_id only>`. An agent must not edit, regenerate, normalize, QA, or approve a row owned by another active agent.

If a row has `in_progress` status and no clear owner note, treat it as owned by another thread until the user clarifies or the row is explicitly released.

Direction order:

1. `down`
2. `down_right`
3. `right`
4. `up_right`
5. `up`
6. `up_left`
7. `left`
8. `down_left`

Animation order:

1. `idle`: 5 frames
2. `walk`: 8 frames
3. `sprint`: 12 frames
4. `dodge`: 5 frames
5. `attack`: 8 frames
6. `special`: 8 frames

## Frame Size Profiles

Use animation-size profiles instead of assuming every animation is `64x64`.

- Default profile: `64x64`, anchor `{ x: 32, y: 60 }`. Use this for `idle`, `walk`, `sprint`, and `dodge` unless the row is explicitly approved for a larger profile.
- Wide action profile: `96x80`, anchor `{ x: 48, y: 76 }`. Use this for future `attack` and `special` regeneration so one-handed sword arcs have enough horizontal and vertical room.

All frames within one job must use the same profile. Existing approved `attack` rows may remain trusted as `64x64` historical outputs until they are intentionally regenerated.

## Strip Spacing And Bleed Prevention

Bleed prevention is mandatory for every generated strip.

- Prompt for at least two full sprite-widths of flat `#ff00ff` gutter between neighboring poses. No body part, sword, scarf, shadow, glow, or loose pixel cluster may cross into a neighboring pose's gutter.
- After chroma removal, segment the full strip by alpha component groups before cropping. Do not start with equal-width slicing, because tight generated strips can pull neighboring-pose fragments into a normalized frame.
- Repack each grouped pose into a dynamic transparent slot with generous side padding. Use `slot_w = max(max_group_width + 320, ceil(original_width / frame_count) + 240)` as the minimum safe rule.
- Reject or regenerate any strip where the standard, 4x, or focused QA preview shows vertical slivers, sword fragments, cloak/scarf fragments, shadows, or alpha haze between sprites.

## Per-Job Steps
For each queue row:

1. Re-read `animation_queue.csv` immediately before claiming a row.
2. Choose only one `pending` or explicitly released `needs_revision` row.
3. Set only that row to `in_progress` and write an owner note in `qa_notes`: `Owner: <agent/thread>; claimed: <date/time>; scope: <job_id only>`.
4. Confirm: `animation=<name> direction=<direction> frame_count=<n>`.
5. Load the approved transparent base sprite as the character model.
6. Generate a new pose/image matching only the current animation and direction.
7. Generate the remaining frames for that same animation/direction so the motion reads well.
8. Keep the full strip limited to this one animation and this one direction.
9. Prompt constraints must include: based on the supplied transparent base sprite, same character, same facing direction, same silhouette, same outfit proportions, same palette family, sword held visibly in the character's right hand in every frame, left hand empty in every frame, no shield, transparent background or flat `#ff00ff` chroma key, exact frame count, at least two full sprite-widths of empty `#ff00ff` gutter between poses, no scenery, no labels, no poster composition.
10. Save raw output as: `assets/characters/<character>/<animation>/raw/<animation>_<direction>_raw.png`.
11. Normalize into the current animation profile's frame size with the profile's shared bottom-center anchor.
12. Save normalized frames as: `assets/characters/<character>/<animation>/frames/<animation>_<direction>_01.png`.
13. Render a preview: `<animation>_<direction>_preview.png`.
14. QA the preview at game scale.
15. If QA fails, revise only this job or mark this row `needs_revision` with a specific note.
16. If QA passes, mark this job `approved`.
17. Before finishing, re-read the queue and confirm no other row was accidentally modified.

## Parallel Agent Rules

- Never work on a row whose `status` is `in_progress` unless the row's `qa_notes` explicitly names your current thread as the owner.
- Never use another row's raw generation as a visual reference. The only shared references are the canonical base sprite and approved same-character seed frames.
- Write only files whose basename starts with the active `job_id`, plus that job's QA note. Example: `walk_left` work may write `walk_left_*` files only.
- Do not rename, delete, or overwrite another agent's files. If a collision exists, create a rejected backup with the active `job_id` in the filename.
- Do not assemble a full animation sheet while any direction in that animation is still `in_progress` or `needs_revision`.
- If the queue changed while you were working, preserve other agents' changes and update only your owned row.
- If the user says another agent owns a row, skip it even if it appears `pending`.
- At handoff, update the resume file with the owned row, final status, generated paths, and any rejected attempts.

## QA Gates
Each job must pass:

- Matches the approved transparent base sprite.
- New generated pose fits the requested animation and direction.
- Additional frames create a believable animation.
- Transparent background preserved.
- Character colors are not distorted.
- Facing direction is correct.
- Feet/ground contact stays aligned to the animation profile anchor.
- Every frame in the job uses the animation profile's frame size.
- `attack` and `special` jobs use the wide action profile unless intentionally preserving an approved historical `64x64` output.
- Sword and weapon arcs are not cropped; `attack` and `special` previews include an extra side-padding check.
- Motion reads clearly at game scale.
- No extra objects, scenery, labels, or UI text.
- Sword remains visibly held in the character's right hand in every frame. For back-facing/up-facing directions, the character's right hand appears on screen-right.
- Left hand remains empty in every frame. Do not generate a shield, buckler, off-hand weapon, or held object in the left hand.
- Full strips must include at least two full sprite-widths of flat `#ff00ff` gutter between poses. After chroma removal, segment the full strip by alpha component groups before cropping; do not use `image_width / frame_count` as the first split when normalizing.
- QA previews must show clean empty spacing between sprites. If body, sword, scarf, or limb slivers bleed into neighboring frames, regenerate with wider gutters or reprocess from component groups before approval.
- Looping animations loop cleanly: `idle`, `walk`, `sprint`.
- One-shot animations have clear anticipation/contact/recovery: `dodge`, `attack`, `special`.

## Assembly And Integration
After all 8 directions for one animation are approved, assemble that animation's sheet and metadata. Do not assemble partial directions into runtime assets unless they are clearly marked as draft.

In parallel mode, assembly is a separate integration task. Start assembly only after re-reading the queue and confirming every direction for that animation is `approved` and no agent is still writing files under that animation folder.

After all 48 jobs are approved:

- Update character metadata from 4 directions to 8 directions.
- Use the 8-direction list consistently in manifests, frame paths, previews, and runtime loading.
- Extend `DirectionName` and direction selection logic from 4-way to 8-way.
- Keep existing runtime animation mappings compatible unless new runtime names are added.

## Assumptions
- The supplied base sprite is the source of truth for the character.
- Every animation/direction requires newly generated images, not just reused existing frames.
- Background removal must preserve character colors exactly.
- Each generation request should produce one full strip for one animation/direction, not individual unrelated frames.
- The pipeline should prioritize consistency over speed.

## Agent Prompt Template

Use this prompt when starting a new agent/thread:

```text
Use $game-studio:sprite-pipeline.

Project: D:/projects/MotherSeed2D
Character: green_warrior_v2
Resume file: assets/characters/green_warrior_v2/PIPELINE_RESUME.md
Queue file: assets/characters/green_warrior_v2/animation_queue.csv

Task: Work only on <JOB_ID>, which is <ANIMATION>/<DIRECTION> with <FRAME_COUNT> frames.

Parallel coordination:
- Re-read animation_queue.csv before doing anything.
- If <JOB_ID> is owned by another in_progress row note, stop and report it.
- Claim only <JOB_ID> by setting status=in_progress and qa_notes to: Owner: <your thread name>; claimed: <date/time>; scope: <JOB_ID only>.
- Do not edit any files for other job IDs.
- Do not assemble animation sheets.

Sprite requirements:
- Use only the canonical green_warrior_v2 base/reference assets.
- Generate one full horizontal strip for <JOB_ID>, not separate unrelated frames.
- Same character, same facing direction, same silhouette, same outfit proportions, same palette family.
- Sword visibly held in the character's right hand in every frame.
- Left hand empty in every frame.
- No shield, buckler, off-hand weapon, or held object.
- Transparent or flat #ff00ff chroma-key background.
- At least two full sprite-widths of empty flat #ff00ff gutter between each neighboring pose; no sword, scarf, shadow, glow, alpha haze, or loose pixels between poses.
- No scenery, labels, UI, poster composition, or unrelated objects.

Workflow:
1. Build or verify the edit canvas from the approved seed/reference.
2. Generate the strip.
3. Save raw/chromakey files under assets/characters/green_warrior_v2/<ANIMATION>/raw/ using the <JOB_ID> prefix.
4. Remove chroma key, group full-strip alpha components into poses, repack with wide transparent padding using at least `slot_w = max(max_group_width + 320, ceil(original_width / frame_count) + 240)`, then normalize to the animation profile size and shared bottom-center anchor. Do not use equal-width first-pass slicing if there is any risk of bleed. Default profile is 64x64 with anchor { x: 32, y: 60 }; attack/special wide action profile is 96x80 with anchor { x: 48, y: 76 }.
5. Save frames as assets/characters/green_warrior_v2/<ANIMATION>/frames/<JOB_ID>_01.png through the final frame.
6. Render standard, 4x, and focused weapon/no-shield QA previews; for attack/special, include an explicit side-padding/no-cropping check. Reject any visible inter-frame bleed or stray fragments.
7. Write assets/characters/green_warrior_v2/<ANIMATION>/qa/<JOB_ID>_qa.md.
8. Mark only <JOB_ID> approved when QA passes, or needs_revision with a concrete reason.
9. Update PIPELINE_RESUME.md with exactly what changed.
```

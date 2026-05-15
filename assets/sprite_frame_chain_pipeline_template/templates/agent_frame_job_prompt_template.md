# Agent Frame Job Prompt Template

Use `$game-studio:sprite-pipeline`.

Keep using `$game-studio:sprite-pipeline` for this frame job: one-frame source generation, QA, manifest update, and later shared normalization/preview work.

Process exactly one animation/direction/frame job. Do not generate multiple frames, strips, rows, directions, or batches.

Use only the copied subject pipeline files derived from `assets/sprite_frame_chain_pipeline_template` plus the required base folder and approved previous frame source. Do not search the project for existing animation tools, old pipeline scripts, old generated strips, old normalized frames, hidden automation, or another character/monster pipeline.

Inferred project root: `<PROJECT_PATH>`
Inferred subject id: `<SUBJECT_ID>`
Inferred subject type: `<character|monster>`
Base folder: `<BASE_FOLDER_PATH>`
Mapped base source(s): `<BASE_SOURCE_PATHS>`
Inferred pipeline folder: `<SUBJECT_PIPELINE_FOLDER>`
Queue file: `<SUBJECT_PIPELINE_FOLDER>/animation_queue.csv`
Frame chain manifest: `<SUBJECT_PIPELINE_FOLDER>/<ANIMATION>/qa/<JOB_ID>_frame_chain_manifest.csv`
Frame profiles: `<SUBJECT_PIPELINE_FOLDER>/frame_profiles.csv`
Subject size: `<default|medium|large>`

Task: Work only on `<JOB_ID>` frame `<FRAME_INDEX>` of `<FRAME_COUNT>` for `<ANIMATION>/<DIRECTION>`.

Planned frame beat: `<FRAME_BEAT>`
Primary source for this frame: `<PRIMARY_SOURCE_PATH>`
Identity reference source(s): `<BASE_SOURCE_PATHS>`
Previous approved frame, if any: `<PREVIOUS_APPROVED_FRAME_PATH_OR_NOT_APPLICABLE>`
Frame profile: `<PROFILE>`

## Required Inputs

- `$game-studio:sprite-pipeline` must be active.
- Template-only tooling is required.
- Base folder must contain `north.png`, `south.png`, `east.png`, and `west.png`.
- Frame 01 must use the mapped directional base source as the primary source.
- Frame 02 and later must use the approved previous frame as the primary source.
- Every frame must also use the original mapped base source(s) as identity, color, proportion, silhouette, and equipment reference.
- Do not start this frame unless every earlier frame for `<JOB_ID>` is approved.
- Do not start any later frame until this frame is approved.

## Source Generation Requirements

- Generate exactly one raw source image for `<ANIMATION>/<DIRECTION>/frame_<FRAME_INDEX>`.
- The image must contain exactly one complete sprite frame, not a strip, sheet, row, panel, turnaround, comparison pose, or multi-frame image.
- The generated frame must be a new complete picture for `<FRAME_BEAT>`.
- The previous frame is a motion-continuity source. Do not merely shift, rotate, scale, smear, or draw effects over it.
- Preserve the same subject, facing direction, silhouette family, proportions, palette family, readable key features, outfit, and required equipment from the base.
- Character item, clothing, skin, hair, fur, scale, armor, and equipment colors must remain consistent with the base unless the user specified a change.
- Preserve selected monster size and footprint.
- Use a transparent or flat `#ff00ff` background.
- Leave generous empty transparent or `#ff00ff` padding around the full sprite.
- For action/attack rows, leave generous empty space around the full action envelope: body, weapon, slash/trail, spell glow, impact flash, particles, shadow, wings, tail, and recovery motion.
- Do not crop any body part, item, weapon, wing, tail, scarf, shadow, glow, particle haze, alpha haze, loose pixel, or effect.

## Workflow

1. Confirm `$game-studio:sprite-pipeline` is active.
2. Re-read `animation_queue.csv` and `<JOB_ID>_frame_chain_manifest.csv`.
3. Verify all earlier frames for `<JOB_ID>` are `approved`.
4. Verify no later frame for `<JOB_ID>` has been started.
5. Confirm `<PRIMARY_SOURCE_PATH>` exists.
6. Confirm `<BASE_SOURCE_PATHS>` exist.
7. If a fresh helper tool is needed, create it under `<SUBJECT_PIPELINE_FOLDER>/<ANIMATION>/tools/` with the `<JOB_ID>` prefix and list it in QA.
8. Generate one fresh raw source frame for `<FRAME_INDEX>` using the primary source and identity reference sources.
9. Save the raw source frame to `<SUBJECT_PIPELINE_FOLDER>/<ANIMATION>/raw/<JOB_ID>_frame_<FRAME_INDEX>_raw.png`.
10. Review the raw frame before generating any later frame.
11. Write `<SUBJECT_PIPELINE_FOLDER>/<ANIMATION>/qa/<JOB_ID>_frame_<FRAME_INDEX>_qa.md` using `frame_qa_template.md`.
12. If QA fails, mark this manifest row `needs_revision`, record the reason, and regenerate the same frame from the same previous approved source plus the original base.
13. If QA passes, mark this manifest row `approved`, update the queue `current_frame`, and stop. Do not generate the next frame in the same pass unless the user explicitly asked for continuous execution and the manifest confirms this frame is approved.

## Frame Approval Gates

- Exactly one frame in the generated image.
- Correct animation, direction, frame index, and planned beat.
- Clear motion change from the previous approved frame, unless this is frame 01.
- No duplicated, near-duplicated, shifted, rotated, scaled, smeared, shadow-only, effect-only, or idle-body-copy frame.
- No drift from the base in colors, proportions, equipment, anatomy, size, or direction.
- Required items/weapons/features are present.
- No unrequested items or anatomy were added.
- Background is transparent or flat `#ff00ff`.
- Generous padding remains around the sprite.
- Action/attack full-envelope whitespace passes when applicable.
- No edge contact or cropped pixels.

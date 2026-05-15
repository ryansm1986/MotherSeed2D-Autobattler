# <JOB_ID> Direction QA

Status: `pending_generation`

## Inputs

- Required skill: `$game-studio:sprite-pipeline`
- Animation/direction: `<ANIMATION> + <DIRECTION>`
- Frame count: `<FRAME_COUNT>`
- Direction set: `<4_DIRECTIONAL_OR_8_DIRECTIONAL>`
- Required directions for selected set: `<REQUIRED_DIRECTIONS>`
- Base folder location: `<BASE_FOLDER_PATH>`
- Mapped base source(s): `<BASE_SOURCE_PATHS>`
- Frame chain manifest: `<SUBJECT_PIPELINE_FOLDER>/<ANIMATION>/qa/<JOB_ID>_frame_chain_manifest.csv`
- Raw frame directory: `<SUBJECT_PIPELINE_FOLDER>/<ANIMATION>/raw/`
- Normalized frames: `<SUBJECT_PIPELINE_FOLDER>/<ANIMATION>/frames/<JOB_ID>_01.png` through `<JOB_ID>_<FRAME_COUNT>.png`
- Preview: `<SUBJECT_PIPELINE_FOLDER>/<ANIMATION>/preview/<JOB_ID>_preview.png`
- Review GIF: `<SUBJECT_PIPELINE_FOLDER>/<ANIMATION>/gif/<JOB_ID>.gif`
- Local tools folder, if needed: `<SUBJECT_PIPELINE_FOLDER>/<ANIMATION>/tools/`

## Required Before Direction Approval

- `$game-studio:sprite-pipeline` was used throughout source generation, normalization, preview rendering, GIF creation, and QA.
- Only reusable template files, copied subject pipeline files, and user-approved tools/references were used.
- No existing project animation tooling, old pipeline scripts, prior generated strips, prior normalized frames, hidden automation, or another subject pipeline was searched for or reused.
- Any freshly created helper scripts, configs, checklists, or temporary processing tools are stored under `<SUBJECT_PIPELINE_FOLDER>/<ANIMATION>/tools/`.
- No full source strip or multi-frame generated source was used.
- Every raw source frame was generated one frame at a time in frame-index order.
- No frame `N+1` was started before frame `N` was approved.
- Frame 01 used the mapped base source as primary source.
- Every frame 02+ used the approved previous frame as primary source and original mapped base source(s) as identity reference.
- Every frame has a passing per-frame QA note.
- Frame chain manifest has exactly `<FRAME_COUNT>` rows for this job and every row is `approved`.
- Every raw frame is a distinct newly generated pose for its planned beat.
- The frame chain did not drift in identity, colors, proportions, scale, equipment, anatomy, or direction.
- Body/creature anatomy visibly moves and does not read as a static pose with effects pasted on top.
- Action/attack full-envelope whitespace passed when applicable.
- Normalized frames use one shared scale and bottom-center anchor.
- Final frames match the selected frame profile exactly.
- Transparent background is preserved.
- No final-frame edge contact or cropped effect/body pixels.
- Standard preview, enlarged preview, focused QA preview, and looping review GIF were exported.
- Do not start the next direction until this direction QA is approved and the queue row is updated to `approved`.

Final direction QA status: `pending_generation`

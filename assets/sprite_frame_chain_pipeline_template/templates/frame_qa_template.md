# <JOB_ID> Frame <FRAME_INDEX> QA

Status: `pending_generation`

## Inputs

- Required skill: `$game-studio:sprite-pipeline`
- Tooling scope: template-only tooling; no unapproved existing project animation tools
- Animation/direction/frame: `<ANIMATION> + <DIRECTION> + frame <FRAME_INDEX> of <FRAME_COUNT>`
- Planned frame beat: `<FRAME_BEAT>`
- Base folder location: `<BASE_FOLDER_PATH>`
- Mapped base source(s): `<BASE_SOURCE_PATHS>`
- Primary source for this frame: `<PRIMARY_SOURCE_PATH>`
- Previous approved frame: `<PREVIOUS_APPROVED_FRAME_PATH_OR_NOT_APPLICABLE>`
- Subject size: `<default|medium|large>`
- Frame profile: `<PROFILE>`
- Required items/weapons/features: `<REQUIRED_ITEMS_OR_DEFAULT_FROM_BASE>`
- Expected raw frame: `<SUBJECT_PIPELINE_FOLDER>/<ANIMATION>/raw/<JOB_ID>_frame_<FRAME_INDEX>_raw.png`
- Expected normalized frame after direction normalization: `<SUBJECT_PIPELINE_FOLDER>/<ANIMATION>/frames/<JOB_ID>_<FRAME_INDEX>.png`
- Frame manifest row: `<SUBJECT_PIPELINE_FOLDER>/<ANIMATION>/qa/<JOB_ID>_frame_chain_manifest.csv`
- Local tools folder, if needed: `<SUBJECT_PIPELINE_FOLDER>/<ANIMATION>/tools/`

## Source Provenance

- Fresh source confirmation: `<CONFIRM_PRIMARY_SOURCE_AND_BASE_REFERENCE_USED>`
- Template-only tooling confirmation: `<CONFIRM_ONLY_TEMPLATE_TOOLING_USED>`
- Fresh helper tools created under `<ANIMATION>/tools/`, if any: `<LIST_PATHS_OR_NONE>`
- Rejected frame attempts, if any: `<LIST_REJECTED_ATTEMPTS_AND_REASONS_OR_NONE>`

## Required Before Frame Approval

- `$game-studio:sprite-pipeline` was used for the frame job.
- Only reusable template files, copied subject pipeline files, and user-approved tools/references were used.
- No full source strip, multi-frame source image, direction sheet, turnaround, comparison panel, or batch output was used.
- Frame 01 used the mapped base source as primary source, or frame 02+ used the approved previous frame as primary source.
- Original mapped base source(s) were used as identity, color, proportion, silhouette, and equipment references.
- All earlier frames for this job were already approved before this frame started.
- No later frame was started before this frame was approved.
- Generated image contains exactly one complete sprite frame.
- Frame matches the requested animation, direction, frame index, and planned beat.
- Frame is a distinct newly generated pose, not a duplicate or near-duplicate of the previous frame.
- Body/creature anatomy visibly moves in the planned way.
- Previous frame was used for continuity, not copied in place with only a shift, rotation, scale, smear, shadow, or effect change.
- No identity drift from base: colors, proportions, silhouette, equipment, anatomy, size, and facing direction remain consistent.
- Character item, clothing, skin, hair, fur, scale, armor, and equipment colors remain consistent with the directional base set unless the user specified changes.
- Required items/weapons/features are present.
- No unrequested item, weapon, shield, prop, limb, head, tail, wing, or unrelated object was added.
- Raw frame has transparent or flat `#ff00ff` background.
- Raw frame has generous empty padding around the full sprite.
- For action/attack rows, the full action envelope retained generous empty `#ff00ff` or transparent space.
- No body, weapon, slash/trail, spell glow, impact flash, particles, shadow, wings, tail, recovery motion, or loose effect pixels touch the source edge.
- If QA failed, this frame must be marked `needs_revision` and regenerated from the same previous approved frame plus the original base.

Final frame QA status: `pending_generation`

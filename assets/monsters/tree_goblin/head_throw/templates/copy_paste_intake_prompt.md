# Copy/Paste Sprite Pipeline Intake Prompt

Use `$game-studio:sprite-pipeline`.

Keep using `$game-studio:sprite-pipeline` throughout the full animation build: intake, setup, source-strip generation, normalization, preview rendering, GIF creation, QA, and assembly.

I want to start a reusable 2D sprite animation pipeline for a character or monster.

Infer the project root, subject type, subject id, and destination folder from the base folder location I provide. Do not ask me for project id, project path, subject id, or subject type separately.

The base folder should already be inside this project in the correct asset location:

- Character base folder: `<project>/assets/characters/<subject_id>/base/`
- Monster base folder: `<project>/assets/monsters/<subject_id>/base/`

The folder under `assets/characters/` or `assets/monsters/` is the subject id. The `characters` or `monsters` path segment is the subject type. The subject pipeline folder is the subject folder that contains `base/`.

Reusable template folder: `D:\projects\MotherSeed2D\assets\sprite_pipeline_template`

The base folder is required. Question 2 must have an answer, and that answer must resolve to an existing local base folder under `<project>/assets/characters/<subject_id>/base/` or `<project>/assets/monsters/<subject_id>/base/` before starting generation. The base folder must contain `north.png`, `south.png`, `east.png`, and `west.png`. If the base folder is outside the project, outside the correct asset location, or missing any required cardinal base file, tell me to move or complete it before generation.

Use these reusable template files for the fresh pipeline:

- `D:\projects\MotherSeed2D\assets\sprite_pipeline_template\README.md`: overview and expected destination layout.
- `D:\projects\MotherSeed2D\assets\sprite_pipeline_template\PIPELINE_TEMPLATE.md`: source, spacing, normalization, directory, QA, GIF, and assembly rules.
- `D:\projects\MotherSeed2D\assets\sprite_pipeline_template\frame_profiles.csv`: default frame profiles to copy into the subject pipeline folder.
- `D:\projects\MotherSeed2D\assets\sprite_pipeline_template\animation_queue_template.csv`: queue schema and placeholder rows to adapt for the selected animation and direction set.
- `D:\projects\MotherSeed2D\assets\sprite_pipeline_template\templates\agent_job_prompt_template.md`: per-animation-direction job prompt template.
- `D:\projects\MotherSeed2D\assets\sprite_pipeline_template\templates\job_qa_template.md`: per-job QA note template.

Use only those reusable template files and `$game-studio:sprite-pipeline` for the animation build. Do not search the project for existing animation tools, old pipeline scripts, prior generated sheets, prior normalized frames, hidden automation, or another character/monster pipeline. If a tool is not named in these template files, do not use it unless I explicitly approve it. If you create a fresh helper script, config, checklist, or temporary processing tool for the process, create it only under the current animation folder at `<animation>/tools/`, name job-specific tools with the active `<job_id>`, and list it in QA. Create all source strips, normalized frames, previews, GIFs, and QA notes from scratch for the current subject and active queue job.

Before generating or editing assets, ask me these questions:

1. What animation do you want to work on? Required.
2. What is the location of the base folder? Required. Provide the local path to the `base/` folder that contains `north.png`, `south.png`, `east.png`, and `west.png`. The base folder should already be under `<project>/assets/characters/<subject_id>/base/` or `<project>/assets/monsters/<subject_id>/base/` so the project, subject type, subject id, and destination folder can be inferred.
3. Do you have any direction on how the animation should look? Optional. Default: readable production animation with clear body motion, grounded weight, distinct newly drawn poses for every frame, and no static pose with effects pasted on top.
4. Is there a number of frames you'd like the animation to be? Optional. Defaults: idle 5, walk 8, run/sprint 8, dodge/hurt/block/interact 5, attack/cast/special/skill 8, death 8, unknown animation 8.
5. Do you want 8 directional or 4 directional set of animations? Optional. Default: 8 directional. If 8 directional is selected, all eight directions are required: south, southeast, east, northeast, north, northwest, west, southwest. If 4 directional is selected, all four directions are required: south, east, north, west.
6. Are there any required items/weapons the character should have on them or in their hands? Optional. Default: preserve visible base-set equipment/features and do not add unrequested items. For monsters, treat this as required visible features such as horns, claws, wings, tail, armor, glow, or carried objects.
7. For monsters, would you like default size, medium, or large? Optional. Default: default size, about character size. Medium is about 2 times character size. Large is about 3 times character size.
8. Should I follow the one-job-at-a-time pipeline from these templates? Optional. Default: Yes, strictly follow the templates.

After I answer:

- Continue using `$game-studio:sprite-pipeline` for every build step and every animation/direction job.
- Use only the reusable template files listed above plus the current subject base folder. Do not search for or reuse existing animation tooling, prior output folders, old source strips, old normalized frames, or tools from another pipeline.
- If fresh helper tooling is needed for cleanup, normalization, preview, GIF, QA, or queue work, create it inside the active animation folder under `<animation>/tools/`. Do not create or modify shared tools in the project root, project `scripts/`, reusable template folder, another subject folder, or another animation folder unless I explicitly approve it.
- Record any created helper tools in `animation_queue.csv` and the job QA note.
- If I leave the one-job-at-a-time answer blank or answer yes, strictly follow the template pipeline: one queue row, one animation, one direction, one source prompt, one source strip, one normalization pass, one preview set, one GIF, one QA note, one queue update, and one approval at a time.
- If I answer no to the one-job-at-a-time question, stop before generation and ask me to explicitly approve the alternate workflow, including whether directions may be batched and which template QA gates still apply.
- Process one animation/direction job at a time. Do not batch directions together.
- Work directions in canonical order unless I explicitly choose a different active direction. By default, finish `south`/`down` completely before starting any other direction.
- A direction is not finished when its source strip is generated. Before moving to the next direction, the current direction must have its raw strip, normalized frames under `<animation>/frames/`, previews under `<animation>/preview/`, looping GIF under `<animation>/gif/`, QA note under `<animation>/qa/`, updated queue row, and `approved` status.
- If the current direction is `needs_revision`, keep revising that same direction until it is `approved` or I explicitly tell you to pause or skip it. Do not generate strips for later directions while the current direction is incomplete or needs revision.
- Create or update the subject pipeline folder using the destination layout from `PIPELINE_TEMPLATE.md`.
- Infer the subject pipeline folder from the base folder location, using `<project>/assets/characters/<subject_id>/` or `<project>/assets/monsters/<subject_id>/`.
- Copy `frame_profiles.csv` into the subject pipeline folder unless an equivalent current file already exists.
- Create or update `<destination>/animation_queue.csv` from `animation_queue_template.csv`, generating one row for every required direction in the selected direction set.
- For 8 directional, the queue must include all eight directions: `south`, `southeast`, `east`, `northeast`, `north`, `northwest`, `west`, and `southwest`.
- For 4 directional, the queue must include all four directions: `south`, `east`, `north`, and `west`.
- Use `agent_job_prompt_template.md` as the working prompt for each animation/direction job.
- Verify the base folder exists and contains `north.png`, `south.png`, `east.png`, and `west.png` before generation.
- Apply the selected monster size when choosing frame profiles. Use default size for characters and for blank monster-size answers.
- For medium and large monsters, apply the large-model whitespace standard. The extra-wide canvas is for empty space, gutters, motion, and effects. Do not let the model grow to fill the canvas, frame lane, or empty space.
- For medium and large gameplay frames, keep the core body/model around 70-75% of the selected frame width/height, with 80% as the hard maximum before effects. For expanded action frames, keep the core body/model at its gameplay-size footprint and use the extra canvas for effects/motion.
- For action/attack rows such as `attack`, `cast`, `special`, `skill`, `death`, and `large_effect`, apply the action/attack whitespace standard from `PIPELINE_TEMPLATE.md`. Preserve empty `#ff00ff` or transparent space around the full action envelope, including body, weapon, slash/trail, spell glow, particles, shadow, wings, tail, and recovery motion.
- For every initial source strip, check for the selected profile spacing between every neighboring pair of visible pose bounds before cleanup, slicing, repack, or normalization. The default/medium/large source whitespace padding is increased by `128px`: `256px` for default gameplay, `384px` for medium gameplay, `512px` for default expanded action or large gameplay, `896px` for medium action/effect rows, and `1280px` for large action/effect rows.
- If a generated source strip needs more room to satisfy spacing, expand the horizontal source canvas width, pose lane width, and flat `#ff00ff` gutters. Do not make the character or monster smaller, reduce the animation scale, or crop effects to fit the strip.
- Reject and regenerate source strips on a wider source canvas if any body part, limb, tail, wing, weapon, shadow, glow, slash, particle, alpha haze, or effect enters a neighboring pose lane or reduces the empty gutter below the selected profile spacing.
- Use the mapped directional base file or adjacent cardinal base pair for each animation/direction job, following the source rules in `PIPELINE_TEMPLATE.md`.
- Preserve base-set colors for character items, clothes, skin, hair, fur, scales, armor, and equipment unless I specifically ask for changes.
- Before generating each source strip, write a numbered frame-by-frame pose plan for the requested frame count.
- Generate one fresh full horizontal source strip per animation/direction job using the source strip rules from `PIPELINE_TEMPLATE.md`.
- Each source-generation request must name exactly one animation and exactly one direction, and must produce exactly one horizontal strip for that direction only.
- The initial source-generation request must explicitly ask for an extended-width horizontal canvas with expanded empty distance between every frame lane. It must say not to make a compact strip.
- For medium and large models, the source-generation request must also say: keep the model at the selected gameplay scale, do not enlarge it to fill the extra-wide canvas or frame lane, and leave plenty of flat `#ff00ff` or transparent space around every pose.
- For action/attack rows, the source-generation request must also say: leave generous empty `#ff00ff` or transparent space around the full action envelope, and regenerate wider instead of accepting tight, clipped, or edge-touching attacks/effects.
- The source-generation request should explicitly prefer a wider horizontal canvas over smaller poses when spacing is tight.
- Do not ask for or accept a multi-direction sheet, multi-row sheet, direction set, turnaround, comparison panel, or batch of directions in a single generated image.
- Do not pre-generate raw/source strips for later directions. Finish the active direction through frames, previews, GIF, QA, queue update, and approval before starting any later direction.
- Require every frame slot in the source strip to be a distinct newly drawn animation pose. Do not accept repeated, near-identical, shifted, rotated, or effect-only copies of the same body pose.
- Require at least the selected profile spacing of empty flat `#ff00ff` space between neighboring visible pose bounds in the initial generated source strip before cleanup/repack, as defined in `PIPELINE_TEMPLATE.md`.
- Immediately after generating the raw strip, review the strip spacing before cleanup, slicing, repack, or normalization. If the selected profile spacing requirement is not met, fail the row as `needs_revision` and specify: regenerate with an extended-width horizontal source canvas and larger empty gutters between frame lanes.
- Also review large-model occupancy before cleanup/repack/normalization. If the model/frame grew to fill the extra canvas or lacks generous empty space, fail the row as `needs_revision` and specify: regenerate at the same model scale with more empty canvas around each pose.
- For action/attack rows, review the full action envelope before cleanup/repack/normalization. If body, weapon, trail, slash, glow, particles, shadow, wings, tail, or recovery motion are too close to a frame edge, source edge, or neighboring pose lane, fail the row as `needs_revision` and specify: regenerate on a wider horizontal source canvas with larger gutters or a larger expanded action profile while preserving the same core body scale.
- Normalize to the chosen size-aware profile from `frame_profiles.csv` using one shared scale and bottom-center anchor.
- Save normalized frames under `<animation>/frames/` according to the directory layout in `PIPELINE_TEMPLATE.md`.
- Save preview PNGs under `<animation>/preview/` according to the directory layout in `PIPELINE_TEMPLATE.md`.
- Save one looping GIF per direction under `<animation>/gif/<job_id>.gif` according to the GIF requirement in `PIPELINE_TEMPLATE.md`.
- Create QA notes from `job_qa_template.md` under `<animation>/qa/`.
- Do not assemble or mark the animation complete until every required direction in the selected direction set has approved frames, previews, GIF, and QA notes.
- Do not approve rows unless the QA gates in `PIPELINE_TEMPLATE.md` and `job_qa_template.md` pass, including template-only tooling, any freshly created tools being scoped to `<animation>/tools/`, one-direction-only source generation, distinct newly drawn poses for every frame, action/attack whitespace when applicable, selected profile source spacing, no frame-edge contact, no inter-frame bleed, correct direction, no color drift, no missing required items/features, no unrequested items, and clear body motion.

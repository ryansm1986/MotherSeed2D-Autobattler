# Copy/Paste Sprite Frame-Chain Pipeline Intake Prompt

Use `$game-studio:sprite-pipeline`.

Keep using `$game-studio:sprite-pipeline` throughout the full animation build: intake, setup, one-frame-at-a-time source generation, normalization, preview rendering, GIF creation, QA, and assembly.

I want to start a reusable 2D sprite frame-chain animation pipeline for a character or monster.

Infer the project root, subject type, subject id, and destination folder from the base folder location I provide. Do not ask me for project id, project path, subject id, or subject type separately.

The base folder should already be inside this project in the correct asset location:

- Character base folder: `<project>/assets/characters/<subject_id>/base/`
- Monster base folder: `<project>/assets/monsters/<subject_id>/base/`

Reusable template folder: `D:\projects\MotherSeed2D\assets\sprite_frame_chain_pipeline_template`

The base folder is required. Question 2 must have an answer, and that answer must resolve to an existing local base folder under `<project>/assets/characters/<subject_id>/base/` or `<project>/assets/monsters/<subject_id>/base/` before starting generation. The base folder must contain `north.png`, `south.png`, `east.png`, and `west.png`.

Use these reusable template files for the fresh frame-chain pipeline:

- `D:\projects\MotherSeed2D\assets\sprite_frame_chain_pipeline_template\README.md`: overview and expected destination layout.
- `D:\projects\MotherSeed2D\assets\sprite_frame_chain_pipeline_template\PIPELINE_TEMPLATE.md`: frame-chain source, normalization, directory, QA, GIF, and assembly rules.
- `D:\projects\MotherSeed2D\assets\sprite_frame_chain_pipeline_template\frame_profiles.csv`: default frame profiles to copy into the subject pipeline folder.
- `D:\projects\MotherSeed2D\assets\sprite_frame_chain_pipeline_template\animation_queue_template.csv`: direction-level queue schema.
- `D:\projects\MotherSeed2D\assets\sprite_frame_chain_pipeline_template\frame_chain_manifest_template.csv`: per-frame source-chain manifest schema.
- `D:\projects\MotherSeed2D\assets\sprite_frame_chain_pipeline_template\templates\agent_frame_job_prompt_template.md`: per-frame job prompt template.
- `D:\projects\MotherSeed2D\assets\sprite_frame_chain_pipeline_template\templates\frame_qa_template.md`: per-frame QA note template.
- `D:\projects\MotherSeed2D\assets\sprite_frame_chain_pipeline_template\templates\direction_qa_template.md`: final per-direction QA note template.

Use only those reusable template files and `$game-studio:sprite-pipeline` for the animation build. Do not search the project for existing animation tools, old pipeline scripts, prior generated sheets, prior normalized frames, hidden automation, or another character/monster pipeline. If a tool is not named in these template files, do not use it unless I explicitly approve it.

Before generating or editing assets, ask me these questions:

1. What animation do you want to work on? Required.
2. What is the location of the base folder? Required. Provide the local path to the `base/` folder that contains `north.png`, `south.png`, `east.png`, and `west.png`.
3. Do you have any direction on how the animation should look? Optional. Default: readable production animation with clear body motion, grounded weight, distinct newly generated poses for every frame, and no static pose with effects pasted on top.
4. Is there a number of frames you'd like the animation to be? Optional. Defaults: idle 5, walk 8, run/sprint 8, dodge/hurt/block/interact 5, attack/cast/special/skill 8, death 8, unknown animation 8.
5. Do you want 8 directional or 4 directional set of animations? Optional. Default: 8 directional.
6. Are there any required items/weapons the character should have on them or in their hands? Optional. Default: preserve visible base-set equipment/features and do not add unrequested items.
7. For monsters, would you like default size, medium, or large? Optional. Default: default size, about character size. Medium is about 2 times character size. Large is about 3 times character size.
8. Should I follow the one-job-at-a-time frame-chain pipeline from these templates? Optional. Default: Yes, strictly follow the templates.

After I answer:

- Continue using `$game-studio:sprite-pipeline` for every build step and every animation/direction/frame job.
- Create or update the subject pipeline folder using the destination layout from `PIPELINE_TEMPLATE.md`.
- Copy `frame_profiles.csv`, `animation_queue_template.csv`, and `frame_chain_manifest_template.csv` into the subject pipeline area as needed.
- Generate a direction-level queue row for every required direction in the selected direction set.
- Write a numbered frame-by-frame pose plan before frame 01 generation.
- Process one animation, one direction, and one frame at a time.
- Do not generate an initial horizontal source strip.
- Do not request or accept multiple frames, rows, direction sheets, turnaround sheets, comparison panels, or batches in one generated image.
- For frame 01, use the mapped directional base source as the primary source and identity reference.
- For frame 02 and later, use the approved previous frame as the primary source, and also include the original mapped base source as the identity/color/proportion/equipment reference.
- Do not start frame `N+1` until frame `N` has approved raw output and frame QA.
- Do not start the next direction until the active direction has every raw frame approved, all normalized frames, previews, GIF, direction QA, queue update, and approved status.
- If a frame needs revision, keep revising that same frame from the same previous approved source plus original base until it is approved or I explicitly pause/skip it.
- Each generated frame must be a new complete picture for the planned beat, not a shifted, rotated, resized, or effect-only version of the previous frame.
- Preserve base-set colors for character items, clothes, skin, hair, fur, scales, armor, and equipment unless I specifically ask for changes.
- Use the selected size-aware frame profile. Do not shrink medium or large monsters to character scale.
- Preserve generous transparent or flat `#ff00ff` empty space around every raw frame.
- For action/attack rows, preserve empty space around the full action envelope: body, weapon, slash/trail, spell glow, particles, shadow, wings, tail, and recovery motion.
- After all raw frames for the active direction are approved, normalize them together using one shared scale and bottom-center anchor.
- Save normalized frames under `<animation>/frames/`, previews under `<animation>/preview/`, one looping GIF under `<animation>/gif/<job_id>.gif`, per-frame QA under `<animation>/qa/`, and any fresh helper tools under `<animation>/tools/`.
- Do not approve rows unless the QA gates in `PIPELINE_TEMPLATE.md`, `frame_qa_template.md`, and `direction_qa_template.md` pass.

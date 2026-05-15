# Agent Job Prompt: idle_northeast

Use `$game-studio:sprite-pipeline`.

Use only the reusable template files copied from `D:\projects\MotherSeed2D\assets\sprite_pipeline_template`, this subject base folder, and freshly created tools under `D:\projects\MotherSeed2D\assets\monsters\shroom_boy\idle\tools`.

Task: Work only on `idle_northeast`, which is `idle/northeast` with `5` frames.

Use these exact base picture reference(s): D:\projects\MotherSeed2D\assets\monsters\shroom_boy\base\north.png;D:\projects\MotherSeed2D\assets\monsters\shroom_boy\base\east.png

Frame-by-frame pose plan:
1. Neutral `northeast` idle stance: feet/body planted, cap/head settled, face oriented correctly, hands relaxed near the body.
2. Small inhale/readiness beat: cap/head lifts a few pixels, face subtly changes, hands rise slightly.
3. Peak idle expression: head tilts gently, face changes clearly, one or both hands make a tiny expressive curl or lift.
4. Exhale/settle beat: cap/head eases back down, facial expression softens, hands lower toward neutral.
5. Loop return beat: pose returns close to frame 1 but is not an exact duplicate.

Generate exactly one fresh full horizontal source strip for `idle/northeast` only. Use a flat `#ff00ff` chroma-key background or transparent background. Create an extended-width horizontal canvas with expanded empty distance between every frame lane. Do not make a compact strip. Preserve at least `256px` of empty flat `#ff00ff` space between neighboring visible pose bounds before cleanup, slicing, repack, or normalization. Prefer a wider horizontal canvas over smaller poses when spacing is tight.

The monster should stand and only move its face, head/cap, or hands in the 5 generated frames. The body and feet stay planted. Preserve the base-set orange mushroom cap, cream spots, beige body, eye/face details, small hands, feet, colors, silhouette, and proportions. Do not add weapons, props, extra limbs, extra heads, unrelated items, scenery, text, watermark, shadows that bridge lanes, or loose pixels in the gutters.

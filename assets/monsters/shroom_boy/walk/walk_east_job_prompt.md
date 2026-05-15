# Agent Job Prompt: walk_east

Use `$game-studio:sprite-pipeline`.

Task: Work only on `walk_east`, which is `walk/east` with `8` frames.

Use these exact base picture reference(s): D:\projects\MotherSeed2D\assets\monsters\shroom_boy\base\east.png

Frame-by-frame pose plan:
1. Neutral planted waddle stance facing `east`; weight centered, hands slightly out for balance.
2. Weight shifts to the first foot; cap/head leans with the step, opposite hand bobs forward.
3. First foot presses down; body squashes slightly, cap dips, hands counter-swing.
4. Body rolls over the planted foot; second foot begins to lift, head/cap sways to the other side.
5. Neutral crossing beat; body rises slightly, hands pass through center.
6. Weight shifts to the second foot; cap/head leans the opposite way, first hand bobs forward.
7. Second foot presses down; body squashes slightly, cap dips, hands counter-swing.
8. Recovery into loop; body rolls back toward frame 1 with a small waddling sway.

Generate exactly one fresh full horizontal source strip for `walk/east` only. Use a flat `#ff00ff` chroma-key background or transparent background. Create an extended-width horizontal canvas with expanded empty distance between every frame lane. Do not make a compact strip. Preserve at least `256px` of empty flat `#ff00ff` space between neighboring visible pose bounds before cleanup, slicing, repack, or normalization.

The monster should waddle: short shuffling steps, side-to-side weight sway, tiny foot lifts, cap/head bob, and hand counter-swing. Every frame must be a distinct newly drawn walking pose. Preserve the shroom cap, cream spots, beige body, face or back-view features, hands, feet, colors, silhouette, and proportions from the named base references. Do not add weapons, props, extra limbs, extra heads, unrelated items, scenery, text, watermark, shadows that bridge lanes, or loose pixels in gutters.

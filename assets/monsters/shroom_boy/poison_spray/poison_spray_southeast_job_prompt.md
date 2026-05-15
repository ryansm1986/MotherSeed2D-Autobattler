$game-studio:sprite-pipeline

Animation job: poison_spray
Direction: southeast
Frame count: 8
Frame profile: expanded_action_384 (384x384), expanded action/effect spacing.
Use these exact base picture reference(s): D:\projects\MotherSeed2D\assets\monsters\shroom_boy\base\south.png; D:\projects\MotherSeed2D\assets\monsters\shroom_boy\base\east.png

Numbered frame-by-frame pose plan:
1. Neutral stance: cap low and body relaxed, pores still closed.
2. Anticipation: mushroom clenches inward, face tightens, hands curl near body.
3. Strain: cap compresses and tilts, cheeks/face scrunch harder, pore bumps begin to show.
4. Pores open: small holes on top of cap appear with the first faint green steam wisps.
5. Spray begins: body remains clenched while several short green poison jets rise from cap pores.
6. Peak spray: strongest green steamy poison plume, cap still squeezed, hands tense.
7. Release: spray thins into curling vapor, body starts easing back from the clench.
8. Recovery: pores fade/close, leftover steam dissipates, pose returns toward ready stance.

Generate exactly one fresh full horizontal source strip for the monster shroom_boy, animation poison_spray, direction southeast only.
Use an extended-width horizontal canvas with expanded empty distance between every frame lane. Do not make a compact strip.
Leave at least 896px of empty #ff00ff source whitespace between neighboring visible pose/effect bounds, which is 256px more than the prior widened gutters.
Use a flat #ff00ff chroma-key background or transparent background, no scenery, no text, no labels, no panels, no turnarounds, no multi-direction sheet.
Preserve the mushroom monster identity, base-set colors, silhouette family, face readability, proportions, and direction from the mapped base reference(s).
The monster clenches up like it urgently needs to poop, then small pores open on top of the mushroom cap and green steamy poison sprays upward/outward from those pores.
Preserve extra empty #ff00ff or transparent space around the full action envelope, including body, hands, cap pores, green poison jets, steam wisps, particles, shadow, and recovery motion.
Prefer a wider horizontal canvas over smaller poses when spacing is tight. Regenerate wider instead of accepting clipped, tight, or edge-touching poison effects.
Every frame must be a distinct newly drawn pose for its beat. Do not use repeated, near-identical, shifted, rotated, or effect-only copies of the same body pose.

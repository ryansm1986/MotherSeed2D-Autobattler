# Rock Slam Source Generation Prompt

Use case: stylized-concept
Asset type: 2D pixel-art game sprite animation source strip
Input image: `assets/monsters/moss_golem_v2/base/moss_golem_base.png` is the required source reference.
Primary request: Create one fresh 8-frame horizontal source strip for `rock_slam_<direction>`.
Subject: the same moss golem from the base image, with the same bulky stone body, moss mats, vine bands, green glowing eyes, green chest core, heavy fists, large feet, silhouette family, and color palette.
Style/medium: crisp 2D pixel-art production sprite, readable at game scale, transparent-friendly chroma-key source.
Background: perfectly flat solid `#ff00ff` chroma-key, no shadows, gradients, scenery, labels, floor plane, watermark, text, or poster composition.
Composition/framing: one horizontal strip, exactly 8 visible golem poses in sequence, all facing `<direction>`, with at least one full `1152px`-equivalent empty flat `#ff00ff` space between neighboring visible pose bounds before cleanup or repack.
Motion: braced ready pose; deep crouch/reach to ground; boulder begins forming in hands; boulder lifted with body strain; torso twists and raises boulder toward target direction; impact frame slamming the boulder into the ground in front of the facing direction; recoil/follow-through with debris contained in the pose lane; grounded recovery.
Constraints: subject size is `large`, about 3 times character size; normalize with `monster_large_action_1152`; preserve base-image colors and features; do not add weapons, armor, clothing, extra limbs, extra eyes, or unrequested props; the boulder is animation-specific and should look like local stone matching the golem palette; keep all body parts, boulder, debris, and effects inside their own pose lane.
Avoid: static body with only a pasted boulder/effect, wrong direction, color drift, frame-edge contact, inter-frame bleed, cropped fists, cropped boulder, merged poses, loose pixels crossing into another pose lane.

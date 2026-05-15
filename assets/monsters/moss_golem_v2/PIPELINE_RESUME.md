# moss_golem_v2 Sprite Pipeline Workflow And Resume Notes

Last updated: 2026-04-27 for the first `rock_slam` 8-direction intake.

## Source Of Truth

- Monster folder: `assets/monsters/moss_golem_v2`
- Required base image: `assets/monsters/moss_golem_v2/base/moss_golem_base.png`
- Queue file: `assets/monsters/moss_golem_v2/animation_queue.csv`
- Frame profiles: `assets/monsters/moss_golem_v2/frame_profiles.csv`
- Active animation folder: `assets/monsters/moss_golem_v2/rock_slam`

Use the required base image as the source reference for every generated row. Preserve the moss golem's stone body, moss mats, vine bands, green glowing eyes, green chest core, bulky arms, heavy fists, large feet, silhouette, and palette unless the user explicitly asks for changes.

## Intake

- Animation: `rock_slam`
- User direction: the golem reaches to the ground, pulls up a large boulder, and slams it on the ground in the direction it is facing.
- Direction set: 8 directional.
- Direction order: `down`, `down_right`, `right`, `up_right`, `up`, `up_left`, `left`, `down_left`.
- Frame count: 8 frames per direction.
- Required visible features/items: preserve all base-image monster features; do not add unrequested weapons or carried items. The boulder is part of this animation only.

## Monster Size And Frame Profile

Use subject size `large` for this monster. Use `monster_large_action_1152` for `rock_slam`:

- Final frame size: `1152x1152`
- Anchor: `{ x: 576, y: 1128 }`
- Minimum top/side padding: `288px`
- Minimum floor padding: `24px`
- Required initial source-strip spacing: at least `1152px` of empty flat `#ff00ff` between neighboring visible pose bounds before cleanup/repack.

## Fresh-Source Contract

Each direction must generate one fresh full horizontal source strip from the base image. Do not rotate, warp, scale, or draw over another direction or prior animation. Do not approve any row with frame-edge contact, inter-frame bleed, wrong direction, color drift, missing base-image features, unrequested items, or static body motion.

## Rock Slam Motion Contract

Each approved row should read as a heavy 8-frame production animation:

1. Braced ready pose, facing the row direction.
2. Deep crouch/reach toward the ground.
3. Fingers/fists wedge under a forming boulder.
4. Boulder lifts with visible body strain.
5. Boulder rises to slam position, torso twists toward the target direction.
6. Impact frame: boulder slams into the ground in front of the facing direction.
7. Follow-through with recoil and settling debris contained inside the frame.
8. Recovery back toward a grounded combat stance.

## Current Rock Slam State

- `approved`: 8
- `pending_generation`: 0
- `in_progress`: 0
- `needs_revision`: 0
- `rejected`: 0

Rock Slam is assembled:

- Sheet: `assets/monsters/moss_golem_v2/rock_slam/assembled/moss_golem_v2_rock_slam_8dir_8f_1152x1152.png`
- Metadata: `assets/monsters/moss_golem_v2/rock_slam/assembled/moss_golem_v2_rock_slam_8dir_8f_1152x1152.json`
- Review sheet: `assets/monsters/moss_golem_v2/rock_slam/preview/rock_slam_all_directions_preview.png`

Each direction has normalized frames, preview PNGs, a looping GIF, and a QA note.

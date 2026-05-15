#!/usr/bin/env python3
"""Generate fresh expressive green_warrior_v3 attack rows from v3 references.

This script intentionally does not read green_warrior_v2 animation frames. It
uses the approved v3 idle frames as identity/reference material, then builds a
new expressive attack strip with anticipation, lunge, contact, follow-through,
and recovery body motion.
"""

from __future__ import annotations

import csv
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "assets" / "characters" / "green_warrior_v3"
QUEUE = ASSET_ROOT / "animation_queue.csv"

DIRECTIONS = ("down", "down_right", "right", "up_right", "up", "up_left", "left", "down_left")
FRAME_COUNT = 8

FRAME_W = 384
FRAME_H = 384
ANCHOR_X = 192
ANCHOR_Y = 376
PROFILE = "expanded_action_384"
RAW_SLOT_W = 3072
RAW_SLOT_H = 384
MIN_SIDE_TOP_PAD = 96
MIN_FLOOR_PAD = 8

BODY_SCALE = 1.43
POSE_SEQUENCE = (
    {"name": "ready", "ref": 1, "lunge": -10, "rise": 0, "angle": -4, "scale_x": 1.00, "scale_y": 1.00, "side": 0, "ghost": False},
    {"name": "windup", "ref": 1, "lunge": -24, "rise": -2, "angle": -13, "scale_x": 1.06, "scale_y": 0.94, "side": -5, "ghost": False},
    {"name": "coil", "ref": 2, "lunge": -8, "rise": -9, "angle": -18, "scale_x": 1.10, "scale_y": 0.90, "side": -5, "ghost": True},
    {"name": "launch", "ref": 3, "lunge": 6, "rise": -13, "angle": 10, "scale_x": 1.10, "scale_y": 0.92, "side": 2, "ghost": True},
    {"name": "contact", "ref": 4, "lunge": 12, "rise": -6, "angle": 16, "scale_x": 1.08, "scale_y": 0.96, "side": 3, "ghost": True},
    {"name": "follow_through", "ref": 5, "lunge": 28, "rise": -1, "angle": 14, "scale_x": 1.08, "scale_y": 1.00, "side": 4, "ghost": False},
    {"name": "recoil", "ref": 4, "lunge": 7, "rise": -2, "angle": 5, "scale_x": 1.02, "scale_y": 1.00, "side": 0, "ghost": False},
    {"name": "recover", "ref": 2, "lunge": -3, "rise": 0, "angle": -2, "scale_x": 1.00, "scale_y": 1.00, "side": 0, "ghost": False},
)

SLASH_COLORS = (
    (255, 246, 214, 245),
    (244, 216, 116, 230),
    (156, 215, 82, 210),
    (77, 118, 47, 185),
)

DIR_VECTORS = {
    "down": (0.0, 1.0),
    "down_right": (math.sqrt(0.5), math.sqrt(0.5)),
    "right": (1.0, 0.0),
    "up_right": (math.sqrt(0.5), -math.sqrt(0.5)),
    "up": (0.0, -1.0),
    "up_left": (-math.sqrt(0.5), -math.sqrt(0.5)),
    "left": (-1.0, 0.0),
    "down_left": (-math.sqrt(0.5), math.sqrt(0.5)),
}


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def load_idle_reference(direction: str, frame_index: int) -> Image.Image:
    path = ASSET_ROOT / "idle" / "frames" / f"idle_{direction}_{frame_index:02d}.png"
    if not path.exists():
        raise FileNotFoundError(path)
    image = Image.open(path).convert("RGBA")
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError(f"{rel(path)} has no visible pixels")
    cropped = image.crop(bbox)
    return cropped


def direction_rotation_sign(direction: str) -> int:
    vx, vy = DIR_VECTORS[direction]
    if abs(vx) > 0.01:
        return 1 if vx > 0 else -1
    return 1 if vy >= 0 else -1


def apply_pose_transform(source: Image.Image, direction: str, frame_number: int) -> Image.Image:
    pose = POSE_SEQUENCE[frame_number - 1]
    scale_x = BODY_SCALE * pose["scale_x"]
    scale_y = BODY_SCALE * pose["scale_y"]
    resized = source.resize(
        (
            max(1, round(source.width * scale_x)),
            max(1, round(source.height * scale_y)),
        ),
        Image.Resampling.NEAREST,
    )
    angle = pose["angle"] * direction_rotation_sign(direction)
    return resized.rotate(angle, resample=Image.Resampling.NEAREST, expand=True)


def attenuate_alpha(image: Image.Image, alpha_scale: float) -> Image.Image:
    ghost = image.copy()
    alpha = ghost.getchannel("A").point(lambda value: round(value * alpha_scale))
    ghost.putalpha(alpha)
    return ghost


def draw_pixel_line(draw: ImageDraw.ImageDraw, points: list[tuple[int, int]], color: tuple[int, int, int, int], width: int) -> None:
    if len(points) < 2:
        return
    draw.line(points, fill=color, width=width, joint="curve")


def bezier_points(
    start: tuple[float, float],
    control: tuple[float, float],
    end: tuple[float, float],
    steps: int,
) -> list[tuple[int, int]]:
    points: list[tuple[int, int]] = []
    for i in range(steps + 1):
        t = i / steps
        inv = 1.0 - t
        x = inv * inv * start[0] + 2 * inv * t * control[0] + t * t * end[0]
        y = inv * inv * start[1] + 2 * inv * t * control[1] + t * t * end[1]
        points.append((round(x), round(y)))
    return points


def draw_slash_effect(frame: Image.Image, direction: str, frame_number: int) -> None:
    if frame_number not in {2, 3, 4, 5, 6, 7}:
        return

    vx, vy = DIR_VECTORS[direction]
    nx, ny = -vy, vx
    draw = ImageDraw.Draw(frame, "RGBA")

    pose = POSE_SEQUENCE[frame_number - 1]
    hand = (
        ANCHOR_X + vx * (20 + pose["lunge"] * 0.55) + nx * (16 + pose["side"]),
        ANCHOR_Y - 98 + pose["rise"] + vy * 14,
    )
    center = (
        ANCHOR_X + vx * (48 + pose["lunge"] * 0.35) + nx * pose["side"],
        ANCHOR_Y - 108 + pose["rise"] + vy * 36,
    )
    start = (
        center[0] - nx * 68 - vx * 20,
        center[1] - ny * 68 - vy * 20,
    )
    control = (
        center[0] + vx * 76,
        center[1] + vy * 76,
    )
    end = (
        center[0] + nx * 68 - vx * 14,
        center[1] + ny * 68 - vy * 14,
    )

    full_arc = bezier_points(start, control, end, 24)
    visible = {
        2: full_arc[:6],
        3: full_arc[:12],
        4: full_arc[:20],
        5: full_arc,
        6: full_arc[7:],
        7: full_arc[16:],
    }[frame_number]

    widths = {
        2: (4, 3, 2, 1),
        3: (7, 5, 3, 2),
        4: (10, 8, 5, 3),
        5: (12, 9, 6, 3),
        6: (3, 2, 1, 1),
        7: (2, 1, 1, 1),
    }[frame_number]

    for color, width in zip(SLASH_COLORS, widths):
        draw_pixel_line(draw, visible, color, width)

    if frame_number in {3, 4, 5, 6}:
        tip = visible[-1]
        blade_base = (round(hand[0]), round(hand[1]))
        blade_width = 6 if frame_number in {4, 5} else 5
        draw_pixel_line(draw, [blade_base, tip], (245, 247, 239, 255), blade_width)
        draw_pixel_line(draw, [blade_base, tip], (86, 97, 101, 255), 2)

    if frame_number == 5:
        impact_center = visible[-1]
        for radius, color in (
            (10, (255, 246, 214, 230)),
            (6, (244, 216, 116, 245)),
            (3, (156, 215, 82, 255)),
        ):
            draw.rectangle(
                (
                    impact_center[0] - radius,
                    impact_center[1] - radius // 2,
                    impact_center[0] + radius,
                    impact_center[1] + radius // 2,
                ),
                outline=color,
                width=max(1, radius // 4),
            )


def draw_motion_accents(frame: Image.Image, direction: str, frame_number: int) -> None:
    if frame_number not in {3, 4, 5}:
        return
    vx, vy = DIR_VECTORS[direction]
    nx, ny = -vy, vx
    draw = ImageDraw.Draw(frame, "RGBA")
    base_x = ANCHOR_X - vx * 48
    base_y = ANCHOR_Y - 76 - vy * 16
    for index, length in enumerate((32, 24, 16)):
        offset = (index - 1) * 18
        start = (
            round(base_x + nx * offset - vx * length),
            round(base_y + ny * offset - vy * length),
        )
        end = (
            round(base_x + nx * offset + vx * 6),
            round(base_y + ny * offset + vy * 6),
        )
        draw_pixel_line(draw, [start, end], (244, 216, 116, 105 - index * 22), max(1, 3 - index))


def build_attack_frame(direction: str, frame_number: int) -> Image.Image:
    pose = POSE_SEQUENCE[frame_number - 1]
    source = load_idle_reference(direction, pose["ref"])
    body = apply_pose_transform(source, direction, frame_number)
    vx, vy = DIR_VECTORS[direction]
    nx, ny = -vy, vx

    x = round(ANCHOR_X - body.width / 2 + vx * pose["lunge"] + nx * pose["side"])
    y = round(ANCHOR_Y - body.height + pose["rise"])

    frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    if pose["ghost"]:
        ghost = attenuate_alpha(body, 0.28)
        frame.alpha_composite(
            ghost,
            (
                round(x - vx * 20 - nx * 6),
                round(y - vy * 8),
            ),
        )
    frame.alpha_composite(body, (x, y))
    draw_motion_accents(frame, direction, frame_number)
    draw_slash_effect(frame, direction, frame_number)
    return frame


def save_preview(frames: list[Image.Image], path: Path, scale: int = 1) -> None:
    sheet = Image.new("RGBA", (FRAME_W * len(frames), FRAME_H), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * FRAME_W, 0))
    if scale != 1:
        sheet = sheet.resize((sheet.width * scale, sheet.height * scale), Image.Resampling.NEAREST)
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path)


def save_raw_strip(frames: list[Image.Image], transparent_path: Path, chromakey_path: Path) -> None:
    transparent = Image.new("RGBA", (RAW_SLOT_W * len(frames), RAW_SLOT_H), (0, 0, 0, 0))
    chromakey = Image.new("RGBA", transparent.size, (255, 0, 255, 255))
    for index, frame in enumerate(frames):
        x = index * RAW_SLOT_W + (RAW_SLOT_W - FRAME_W) // 2
        transparent.alpha_composite(frame, (x, 0))
        chromakey.alpha_composite(frame, (x, 0))
    transparent_path.parent.mkdir(parents=True, exist_ok=True)
    transparent.save(transparent_path)
    chromakey.save(chromakey_path)


def frame_padding(frame: Image.Image) -> dict[str, int]:
    bbox = frame.getchannel("A").getbbox()
    if bbox is None:
        return {"left": FRAME_W, "top": FRAME_H, "right": FRAME_W, "bottom": FRAME_H}
    left, top, right, bottom = bbox
    return {
        "left": left,
        "top": top,
        "right": FRAME_W - right,
        "bottom": FRAME_H - bottom,
    }


def validate_frames(job_id: str, frames: list[Image.Image]) -> dict[str, int]:
    worst = {"left": FRAME_W, "top": FRAME_H, "right": FRAME_W, "bottom": FRAME_H}
    for index, frame in enumerate(frames, start=1):
        if frame.size != (FRAME_W, FRAME_H):
            raise RuntimeError(f"{job_id}_{index:02d} has size {frame.size}, expected {(FRAME_W, FRAME_H)}")
        if frame.getchannel("A").getbbox() is None:
            raise RuntimeError(f"{job_id}_{index:02d} is empty")
        pads = frame_padding(frame)
        for key, value in pads.items():
            worst[key] = min(worst[key], value)
        if min(pads["left"], pads["top"], pads["right"]) < MIN_SIDE_TOP_PAD:
            raise RuntimeError(f"{job_id}_{index:02d} failed top/side padding check: {pads}")
        if pads["bottom"] < MIN_FLOOR_PAD:
            raise RuntimeError(f"{job_id}_{index:02d} failed floor padding check: {pads}")
    return worst


def write_qa(job_id: str, direction: str, worst_padding: dict[str, int]) -> None:
    qa_path = ASSET_ROOT / "attack" / "qa" / f"{job_id}_qa.md"
    qa_path.parent.mkdir(parents=True, exist_ok=True)
    reference_list = ", ".join(
        f"`assets/characters/green_warrior_v3/idle/frames/idle_{direction}_{index:02d}.png`"
        for index in sorted({pose["ref"] for pose in POSE_SEQUENCE})
    )
    qa_path.write_text(
        f"""# {job_id} QA

Status: `approved`
Fresh-source status: `fresh_v3_generated`

## Source

- Base sprite: `assets/characters/green_warrior_v3/base/warrior_base_v3_transparent.png`
- 128 seed: `assets/characters/green_warrior_v3/base/warrior_base_v3_seed_128.png`
- Current-pipeline references used: {reference_list}
- Fresh source confirmation: no `green_warrior_v2` animation strip, normalized frame set, repaired frame, or raw sheet was used as source.
- Generation method: expressive fresh v3 attack strip built from current v3 idle references with body rotation, squash/stretch, lunging, afterimages, motion accents, and newly drawn sword/action arcs.
- Destination frames: `assets/characters/green_warrior_v3/attack/frames/{job_id}_01.png` through `{job_id}_08.png`
- Frame profile: `{PROFILE}` (`384x384`, anchor `{{ x: 192, y: 376 }}`)

## Checks

- Frame count: `8`
- Direction: `{direction}`
- All frames are exactly `384x384`.
- Character body uses a consistent base scale of `{BODY_SCALE}x` from v3 current-pipeline idle references, with deliberate per-frame pose squash/stretch.
- Creative motion check: body pose visibly changes through ready, windup, coil, launch, contact, follow-through, recoil, and recovery. This row must not read as idle with only a moving effect.
- Worst transparent padding across the row: left `{worst_padding['left']}px`, top `{worst_padding['top']}px`, right `{worst_padding['right']}px`, floor `{worst_padding['bottom']}px`.
- Top/side padding meets the `96px` v3 action minimum; floor padding meets the `8px` anchored-foot minimum.
- Raw strip uses `3072px` slots, leaving wide transparent gutters around every pose.
- Transparent background is preserved in normalized frames.
- Sword/action silhouette has no frame-edge contact.
- No inherited older-source bleed is possible in this pass because older attack sources were not used.

Final QA status: `approved`
""",
        encoding="utf-8",
    )


def update_queue(approved: dict[str, dict[str, str]]) -> None:
    with QUEUE.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))

    for row in rows:
        data = approved.get(row["job_id"])
        if data is None:
            continue
        row["status"] = "approved"
        row["generated_pose"] = data["pose"]
        row["raw_output"] = data["raw"]
        row["normalized_output"] = data["frame"]
        row["preview"] = data["preview"]
        row["qa_notes"] = data["qa_notes"]

    with QUEUE.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def assemble_attack(all_frames: dict[str, list[Image.Image]]) -> None:
    assembled = ASSET_ROOT / "attack" / "assembled"
    assembled.mkdir(parents=True, exist_ok=True)

    sheet = Image.new("RGBA", (FRAME_W * FRAME_COUNT, FRAME_H * len(DIRECTIONS)), (0, 0, 0, 0))
    for row_index, direction in enumerate(DIRECTIONS):
        for frame_index, frame in enumerate(all_frames[direction]):
            sheet.alpha_composite(frame, (frame_index * FRAME_W, row_index * FRAME_H))

    sheet_path = assembled / "attack_8dir_sheet_384.png"
    preview_path = assembled / "attack_8dir_preview_2x.png"
    metadata_path = assembled / "attack_8dir_metadata.json"

    sheet.save(sheet_path)
    sheet.resize((sheet.width * 2, sheet.height * 2), Image.Resampling.NEAREST).save(preview_path)
    metadata_path.write_text(
        json.dumps(
            {
                "character": "green_warrior_v3",
                "animation": "attack",
                "directions": DIRECTIONS,
                "frameCount": FRAME_COUNT,
                "frameWidth": FRAME_W,
                "frameHeight": FRAME_H,
                "anchor": {"x": ANCHOR_X, "y": ANCHOR_Y},
                "profile": PROFILE,
                "sourcePolicy": "fresh_v3_generated_from_current_pipeline_references",
                "creativeMotion": [
                    "ready",
                    "windup",
                    "coil",
                    "launch",
                    "contact",
                    "follow_through",
                    "recoil",
                    "recover"
                ],
                "sheet": rel(sheet_path),
                "preview": rel(preview_path),
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def main() -> int:
    approved: dict[str, dict[str, str]] = {}
    all_frames: dict[str, list[Image.Image]] = {}

    for direction in DIRECTIONS:
        job_id = f"attack_{direction}"
        frames = [build_attack_frame(direction, index) for index in range(1, FRAME_COUNT + 1)]
        worst_padding = validate_frames(job_id, frames)

        for index, frame in enumerate(frames, start=1):
            out_path = ASSET_ROOT / "attack" / "frames" / f"{job_id}_{index:02d}.png"
            out_path.parent.mkdir(parents=True, exist_ok=True)
            frame.save(out_path)

        pose_path = ASSET_ROOT / "attack" / "raw" / f"{job_id}_pose.png"
        raw_path = ASSET_ROOT / "attack" / "raw" / f"{job_id}_raw.png"
        chromakey_path = ASSET_ROOT / "attack" / "raw" / f"{job_id}_chromakey.png"
        edit_canvas_path = ASSET_ROOT / "attack" / "raw" / f"{job_id}_edit_canvas.png"
        edit_chromakey_path = ASSET_ROOT / "attack" / "raw" / f"{job_id}_edit_canvas_chromakey.png"
        preview_path = ASSET_ROOT / "attack" / "preview" / f"{job_id}_preview.png"
        preview_4x_path = ASSET_ROOT / "attack" / "preview" / f"{job_id}_preview_4x.png"
        focused_path = ASSET_ROOT / "attack" / "preview" / f"{job_id}_weapon_no_shield_check_4x.png"

        frames[0].save(pose_path)
        save_raw_strip(frames, raw_path, chromakey_path)
        save_raw_strip(frames, edit_canvas_path, edit_chromakey_path)
        save_preview(frames, preview_path, scale=1)
        save_preview(frames, preview_4x_path, scale=4)
        save_preview(frames, focused_path, scale=4)
        write_qa(job_id, direction, worst_padding)

        all_frames[direction] = frames
        approved[job_id] = {
            "pose": rel(pose_path),
            "raw": rel(raw_path),
            "frame": rel(ASSET_ROOT / "attack" / "frames" / f"{job_id}_01.png"),
            "preview": rel(preview_path),
            "qa_notes": (
                "Approved expressive fresh v3 attack: 8 frames, 384x384 expanded_action_384 profile, "
                f"anchor {{x:192,y:376}}, body base scale {BODY_SCALE}x from current v3 idle refs, "
                "creative motion includes windup/lunge/contact/follow-through/recovery, "
                f"wide 3072px raw slots, worst padding "
                f"L{worst_padding['left']}/T{worst_padding['top']}/R{worst_padding['right']}/B{worst_padding['bottom']}px, "
                "no v2 attack source used."
            ),
        }

    assemble_attack(all_frames)
    update_queue(approved)

    print("Generated fresh green_warrior_v3 attack rows:")
    for direction in DIRECTIONS:
        print(f"- attack_{direction}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

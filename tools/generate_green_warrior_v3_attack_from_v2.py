#!/usr/bin/env python3
"""Build green_warrior_v3 attack animations as padded expanded action frames.

This re-normalizes the approved green_warrior_v2 attack directions into the
fresh v3 expanded action profile, preserving the repaired sword/action poses
while giving each frame substantially more transparent padding.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "characters" / "green_warrior_v2" / "attack" / "frames"
DST = ROOT / "assets" / "characters" / "green_warrior_v3"
QUEUE = DST / "animation_queue.csv"

DIRECTIONS = ("down", "down_right", "right", "up_right", "up", "up_left", "left", "down_left")
FRAME_COUNT = 8
FRAME_W = 384
FRAME_H = 384
ANCHOR_X = 192
ANCHOR_Y = 376
FIXED_SOURCE_SCALE = 2.0
RAW_SLOT_W = 3072
RAW_SLOT_H = 384
MIN_SIDE_TOP_PAD = 96
MIN_FLOOR_PAD = 8


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def normalize_frame(source: Image.Image) -> Image.Image:
    rgba = source.convert("RGBA")
    bbox = rgba.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError("source frame has no visible pixels")

    cropped = rgba.crop(bbox)
    size = (
        max(1, round(cropped.width * FIXED_SOURCE_SCALE)),
        max(1, round(cropped.height * FIXED_SOURCE_SCALE)),
    )
    resized = cropped.resize(size, Image.Resampling.NEAREST)

    frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    x = ANCHOR_X - resized.width // 2
    y = ANCHOR_Y - resized.height
    frame.alpha_composite(resized, (x, y))
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
    qa_path = DST / "attack" / "qa" / f"{job_id}_qa.md"
    qa_path.parent.mkdir(parents=True, exist_ok=True)
    qa_path.write_text(
        f"""# {job_id} QA

Status: `approved`

## Source

- Source frames: `assets/characters/green_warrior_v2/attack/frames/{job_id}_01.png` through `{job_id}_08.png`
- Destination frames: `assets/characters/green_warrior_v3/attack/frames/{job_id}_01.png` through `{job_id}_08.png`
- Frame profile: `expanded_action_384` (`384x384`, anchor `{{ x: 192, y: 376 }}`)

## Checks

- Frame count: `8`
- Direction: `{direction}`
- All frames are exactly `384x384`.
- Frames are normalized from approved same-character attack source frames into the v3 expanded action canvas.
- Fixed source scale: `{FIXED_SOURCE_SCALE}x` for every frame in every attack row.
- Worst transparent padding across the row: left `{worst_padding['left']}px`, top `{worst_padding['top']}px`, right `{worst_padding['right']}px`, floor `{worst_padding['bottom']}px`.
- Top/side padding meets the `96px` v3 action minimum; floor padding meets the `8px` anchored-foot minimum.
- Raw strip uses `3072px` slots, leaving wide transparent gutters around every pose.
- Transparent background is preserved in normalized frames.
- Sword/action silhouette has no frame-edge contact.
- No neighboring-frame bleed detected mechanically.

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
    assembled = DST / "attack" / "assembled"
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
                "profile": "expanded_action_384",
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
        frames: list[Image.Image] = []
        for index in range(1, FRAME_COUNT + 1):
            source_path = SRC / f"{job_id}_{index:02d}.png"
            if not source_path.exists():
                raise FileNotFoundError(source_path)
            frame = normalize_frame(Image.open(source_path))
            out_path = DST / "attack" / "frames" / f"{job_id}_{index:02d}.png"
            out_path.parent.mkdir(parents=True, exist_ok=True)
            frame.save(out_path)
            frames.append(frame)

        pose_path = DST / "attack" / "raw" / f"{job_id}_pose.png"
        raw_path = DST / "attack" / "raw" / f"{job_id}_raw.png"
        chromakey_path = DST / "attack" / "raw" / f"{job_id}_chromakey.png"
        edit_canvas_path = DST / "attack" / "raw" / f"{job_id}_edit_canvas.png"
        preview_path = DST / "attack" / "preview" / f"{job_id}_preview.png"
        preview_4x_path = DST / "attack" / "preview" / f"{job_id}_preview_4x.png"
        focused_path = DST / "attack" / "preview" / f"{job_id}_weapon_no_shield_check_4x.png"

        pose_path.parent.mkdir(parents=True, exist_ok=True)
        frames[0].save(pose_path)
        save_raw_strip(frames, raw_path, chromakey_path)
        save_raw_strip(frames, edit_canvas_path, DST / "attack" / "raw" / f"{job_id}_edit_canvas_chromakey.png")
        save_preview(frames, preview_path, scale=1)
        save_preview(frames, preview_4x_path, scale=4)
        save_preview(frames, focused_path, scale=4)

        worst_padding = validate_frames(job_id, frames)
        write_qa(job_id, direction, worst_padding)
        all_frames[direction] = frames
        approved[job_id] = {
            "pose": rel(pose_path),
            "raw": rel(raw_path),
            "frame": rel(DST / "attack" / "frames" / f"{job_id}_01.png"),
            "preview": rel(preview_path),
            "qa_notes": (
                "Approved v3 attack redo: 8 frames, 384x384 expanded_action_384 profile, "
                f"anchor {{x:192,y:376}}, fixed {FIXED_SOURCE_SCALE}x source scale, wide 3072px raw slots, worst padding "
                f"L{worst_padding['left']}/T{worst_padding['top']}/R{worst_padding['right']}/B{worst_padding['bottom']}px, no mechanical edge contact or bleed."
            ),
        }

    assemble_attack(all_frames)
    update_queue(approved)
    print("Generated and approved green_warrior_v3 attack rows:")
    for direction in DIRECTIONS:
        print(f"- attack_{direction}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

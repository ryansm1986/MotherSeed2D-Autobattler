from __future__ import annotations

import argparse
import csv
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(r"D:\projects\MotherSeed2D")
SUBJECT = ROOT / "assets" / "monsters" / "shroom_boy"
BASE = SUBJECT / "base"
ANIMATION = SUBJECT / "poison_spray"
QUEUE = SUBJECT / "animation_queue.csv"

DIRECTIONS = [
    "south",
    "southeast",
    "east",
    "northeast",
    "north",
    "northwest",
    "west",
    "southwest",
]
BASE_SOURCES = {
    "south": [BASE / "south.png"],
    "southeast": [BASE / "south.png", BASE / "east.png"],
    "east": [BASE / "east.png"],
    "northeast": [BASE / "north.png", BASE / "east.png"],
    "north": [BASE / "north.png"],
    "northwest": [BASE / "north.png", BASE / "west.png"],
    "west": [BASE / "west.png"],
    "southwest": [BASE / "south.png", BASE / "west.png"],
}
FRAME_COUNT = 8
PROFILE = "expanded_action_384"
FRAME_W = 384
FRAME_H = 384
ANCHOR_X = 192
ANCHOR_Y = 376
MIN_SPACING = 512
WIDE_GAP = 896
EDGE_MARGIN = 896
MIN_TOP_SIDE_PADDING = 96
FLOOR_PADDING = 8


@dataclass
class Pose:
    image: Image.Image
    bbox: tuple[int, int, int, int]
    source_bbox: tuple[int, int, int, int]


def ensure_dirs() -> None:
    for name in ["raw", "frames", "preview", "gif", "qa", "tools", "assembled"]:
        (ANIMATION / name).mkdir(parents=True, exist_ok=True)


def is_key_or_transparent(pixel: tuple[int, ...]) -> bool:
    r, g, b = pixel[:3]
    a = pixel[3] if len(pixel) > 3 else 255
    if a <= 24:
        return True
    if r >= 120 and b >= 120 and g <= 150:
        return True
    magenta_bias = ((r + b) / 2) - g
    return r >= 96 and b >= 96 and g <= 190 and magenta_bias >= 42


def despill_magenta(pixel: tuple[int, ...]) -> tuple[int, int, int, int]:
    r, g, b, a = pixel
    magenta_bias = ((r + b) / 2) - g
    if r >= 90 and b >= 90 and magenta_bias >= 28:
        target = max(g + 18, min(r, b) - 36)
        r = min(r, target)
        b = min(b, target)
    return (r, g, b, a)


def trim_faint_alpha(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    out = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    src = rgba.load()
    dst = out.load()

    def is_edge_pixel(px: int, py: int) -> bool:
        for oy in range(-2, 3):
            for ox in range(-2, 3):
                if ox == 0 and oy == 0:
                    continue
                nx = px + ox
                ny = py + oy
                if 0 <= nx < rgba.width and 0 <= ny < rgba.height:
                    if src[nx, ny][3] == 0:
                        return True
        return False

    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = src[x, y]
            if a <= 24:
                continue
            magenta_bias = ((r + b) / 2) - g
            purple_edge = r >= 58 and b >= 58 and g <= 96 and magenta_bias >= 18 and is_edge_pixel(x, y)
            pink_key_speck = r >= 140 and b >= 110 and g <= 190 and magenta_bias >= 24
            if purple_edge or pink_key_speck:
                continue
            dst[x, y] = (r, g, b, a)
    return out


def clean_chroma(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    out = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    src = rgba.load()
    dst = out.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            px = src[x, y]
            if not is_key_or_transparent(px):
                dst[x, y] = despill_magenta(px)
    return out


def visible_bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = img.getchannel("A")
    return alpha.getbbox()


def split_pose_lanes(raw: Image.Image) -> list[Pose]:
    clean = clean_chroma(raw)
    lane_w = clean.width / FRAME_COUNT
    poses: list[Pose] = []
    for index in range(FRAME_COUNT):
        x0 = int(round(index * lane_w))
        x1 = int(round((index + 1) * lane_w))
        lane = clean.crop((x0, 0, x1, clean.height))
        bbox = visible_bbox(lane)
        if bbox is None:
            raise RuntimeError(f"Frame lane {index + 1} is empty.")
        crop = lane.crop(bbox)
        source_bbox = (x0 + bbox[0], bbox[1], x0 + bbox[2], bbox[3])
        poses.append(Pose(crop, bbox, source_bbox))
    return poses


def source_gaps(poses: list[Pose]) -> list[int]:
    gaps = []
    for left, right in zip(poses, poses[1:]):
        gaps.append(right.source_bbox[0] - left.source_bbox[2])
    return gaps


def rebuild_wide_source(job_id: str, poses: list[Pose]) -> tuple[Path, list[int]]:
    widths = [pose.image.width for pose in poses]
    heights = [pose.image.height for pose in poses]
    out_w = EDGE_MARGIN * 2 + sum(widths) + WIDE_GAP * (len(poses) - 1)
    out_h = max(heights) + EDGE_MARGIN * 2
    canvas = Image.new("RGBA", (out_w, out_h), (255, 0, 255, 255))
    x = EDGE_MARGIN
    bboxes = []
    for pose in poses:
        y = EDGE_MARGIN + (max(heights) - pose.image.height)
        canvas.alpha_composite(pose.image, (x, y))
        bboxes.append((x, y, x + pose.image.width, y + pose.image.height))
        x += pose.image.width + WIDE_GAP
    path = ANIMATION / "raw" / f"{job_id}_raw_wide.png"
    canvas.convert("RGB").save(path)
    gaps = [right[0] - left[2] for left, right in zip(bboxes, bboxes[1:])]
    return path, gaps


def normalize(job_id: str, poses: list[Pose]) -> tuple[list[Path], Path, Path, Path]:
    max_w = max(pose.image.width for pose in poses)
    max_h = max(pose.image.height for pose in poses)
    scale = min(
        (FRAME_W - MIN_TOP_SIDE_PADDING * 2) / max_w,
        (FRAME_H - MIN_TOP_SIDE_PADDING - FLOOR_PADDING) / max_h,
        1.0,
    )
    frame_paths = []
    scaled_frames = []
    for i, pose in enumerate(poses, start=1):
        sw = max(1, round(pose.image.width * scale))
        sh = max(1, round(pose.image.height * scale))
        scaled = pose.image.resize((sw, sh), Image.Resampling.LANCZOS)
        scaled = trim_faint_alpha(scaled)
        frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        x = ANCHOR_X - sw // 2
        y = ANCHOR_Y - sh
        frame.alpha_composite(scaled, (x, y))
        frame = trim_faint_alpha(frame)
        path = ANIMATION / "frames" / f"{job_id}_{i:02d}.png"
        frame.save(path)
        frame_paths.append(path)
        scaled_frames.append(frame)

    sheet = Image.new("RGBA", (FRAME_W * FRAME_COUNT, FRAME_H), (0, 0, 0, 0))
    for i, frame in enumerate(scaled_frames):
        sheet.alpha_composite(frame, (i * FRAME_W, 0))
    preview = ANIMATION / "preview" / f"{job_id}_preview.png"
    sheet.save(preview)
    preview_4x = ANIMATION / "preview" / f"{job_id}_preview_4x.png"
    sheet.resize((sheet.width * 4, sheet.height * 4), Image.Resampling.NEAREST).save(preview_4x)

    focus = Image.new("RGBA", (FRAME_W * FRAME_COUNT, FRAME_H), (255, 0, 255, 255))
    for i, frame in enumerate(scaled_frames):
        focus.alpha_composite(frame, (i * FRAME_W, 0))
    draw = ImageDraw.Draw(focus)
    for i in range(FRAME_COUNT + 1):
        x = i * FRAME_W
        draw.line((x, 0, x, FRAME_H), fill=(0, 0, 0, 255), width=1)
    focus_path = ANIMATION / "preview" / f"{job_id}_focus_4x.png"
    focus.resize((focus.width * 4, focus.height * 4), Image.Resampling.NEAREST).save(focus_path)

    gif_path = ANIMATION / "gif" / f"{job_id}.gif"
    gif_frames = [frame.copy() for frame in scaled_frames]
    gif_frames[0].save(
        gif_path,
        save_all=True,
        append_images=gif_frames[1:],
        duration=120,
        loop=0,
        disposal=2,
    )
    return frame_paths, preview, preview_4x, gif_path


def pose_plan(direction: str) -> str:
    return "\n".join(
        [
            "1. Neutral stance: cap low and body relaxed, pores still closed.",
            "2. Anticipation: mushroom clenches inward, face tightens, hands curl near body.",
            "3. Strain: cap compresses and tilts, cheeks/face scrunch harder, pore bumps begin to show.",
            "4. Pores open: small holes on top of cap appear with the first faint green steam wisps.",
            "5. Spray begins: body remains clenched while several short green poison jets rise from cap pores.",
            "6. Peak spray: strongest green steamy poison plume, cap still squeezed, hands tense.",
            "7. Release: spray thins into curling vapor, body starts easing back from the clench.",
            "8. Recovery: pores fade/close, leftover steam dissipates, pose returns toward ready stance.",
        ]
    )


def write_job_prompt(job_id: str, direction: str) -> Path:
    base_sources = "; ".join(str(path) for path in BASE_SOURCES[direction])
    prompt = f"""$game-studio:sprite-pipeline

Animation job: poison_spray
Direction: {direction}
Frame count: {FRAME_COUNT}
Frame profile: {PROFILE} ({FRAME_W}x{FRAME_H}), expanded action/effect spacing.
Use these exact base picture reference(s): {base_sources}

Numbered frame-by-frame pose plan:
{pose_plan(direction)}

Generate exactly one fresh full horizontal source strip for the monster shroom_boy, animation poison_spray, direction {direction} only.
Use an extended-width horizontal canvas with expanded empty distance between every frame lane. Do not make a compact strip.
Leave at least 896px of empty #ff00ff source whitespace between neighboring visible pose/effect bounds, which is 256px more than the prior widened gutters.
Use a flat #ff00ff chroma-key background or transparent background, no scenery, no text, no labels, no panels, no turnarounds, no multi-direction sheet.
Preserve the mushroom monster identity, base-set colors, silhouette family, face readability, proportions, and direction from the mapped base reference(s).
The monster clenches up like it urgently needs to poop, then small pores open on top of the mushroom cap and green steamy poison sprays upward/outward from those pores.
Preserve extra empty #ff00ff or transparent space around the full action envelope, including body, hands, cap pores, green poison jets, steam wisps, particles, shadow, and recovery motion.
Prefer a wider horizontal canvas over smaller poses when spacing is tight. Regenerate wider instead of accepting clipped, tight, or edge-touching poison effects.
Every frame must be a distinct newly drawn pose for its beat. Do not use repeated, near-identical, shifted, rotated, or effect-only copies of the same body pose.
"""
    path = ANIMATION / f"{job_id}_job_prompt.md"
    path.write_text(prompt, encoding="utf-8")
    return path


def write_qa(
    job_id: str,
    direction: str,
    original_gaps: list[int],
    wide_gaps: list[int],
    raw_path: Path,
    frame_paths: list[Path],
    preview: Path,
    gif_path: Path,
) -> Path:
    qa = f"""# QA: {job_id}

Skill: $game-studio:sprite-pipeline
Animation: poison_spray
Direction: {direction}
Frame count: {FRAME_COUNT}
Frame profile: {PROFILE}
Base sources: {"; ".join(str(path) for path in BASE_SOURCES[direction])}

## Template Gates

- Base folder verified with north.png, south.png, east.png, and west.png.
- One animation and one direction only.
- Source prompt names exact mapped base picture path(s).
- Source prompt requests an extended-width horizontal canvas, not a compact strip.
- Action/effect whitespace standard applied to body, cap pores, green poison spray, steam wisps, particles, shadow, and recovery motion.
- Initial raw source spacing reviewed before normalization.
- Original measured neighboring gaps: {original_gaps}
- Wide source measured neighboring gaps: {wide_gaps}
- Required minimum source spacing: {MIN_SPACING}px.
- Normalized with one shared scale and bottom-center anchor.
- Final frames are {FRAME_W}x{FRAME_H} PNGs with transparent background.
- GIF exists and loops.
- Fresh helper tools are scoped to this animation folder only.

## Outputs

- Raw strip: {raw_path}
- Frames: {frame_paths[0].parent}\\{job_id}_01.png through {job_id}_{FRAME_COUNT:02d}.png
- Preview: {preview}
- GIF: {gif_path}
- Local tools: {ANIMATION / "tools" / "poison_spray_pipeline_helper.py"}

## Result

Status: approved
"""
    path = ANIMATION / "qa" / f"{job_id}_qa.md"
    path.write_text(qa, encoding="utf-8")
    return path


def load_queue() -> list[dict[str, str]]:
    with QUEUE.open("r", newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def save_queue(rows: list[dict[str, str]]) -> None:
    fields = [
        "job_id",
        "animation",
        "direction",
        "direction_set",
        "required_directions",
        "frame_count",
        "subject_size",
        "frame_profile",
        "status",
        "base_folder",
        "base_sources",
        "generated_pose",
        "raw_output",
        "normalized_output",
        "preview",
        "gif",
        "local_tools",
        "qa_notes",
    ]
    with QUEUE.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def init_queue() -> None:
    ensure_dirs()
    existing = []
    if QUEUE.exists():
        existing = [row for row in load_queue() if row.get("animation") != "poison_spray"]
    required = "|".join(DIRECTIONS)
    for direction in DIRECTIONS:
        job_id = f"poison_spray_{direction}"
        existing.append(
            {
                "job_id": job_id,
                "animation": "poison_spray",
                "direction": direction,
                "direction_set": "8_directional",
                "required_directions": required,
                "frame_count": str(FRAME_COUNT),
                "subject_size": "default",
                "frame_profile": PROFILE,
                "status": "pending",
                "base_folder": str(BASE),
                "base_sources": "; ".join(str(path) for path in BASE_SOURCES[direction]),
                "generated_pose": str(ANIMATION / f"{job_id}_job_prompt.md"),
                "raw_output": "",
                "normalized_output": "",
                "preview": "",
                "gif": str(ANIMATION / "gif" / f"{job_id}.gif"),
                "local_tools": str(ANIMATION / "tools" / "poison_spray_pipeline_helper.py"),
                "qa_notes": "",
            }
        )
    save_queue(existing)


def process_job(job_id: str, direction: str) -> None:
    ensure_dirs()
    raw_path = ANIMATION / "raw" / f"{job_id}_raw.png"
    if not raw_path.exists():
        raise FileNotFoundError(raw_path)
    job_prompt = write_job_prompt(job_id, direction)
    raw = Image.open(raw_path)
    original_poses = split_pose_lanes(raw)
    original_gaps = source_gaps(original_poses)
    wide_path, wide_gaps = rebuild_wide_source(job_id, original_poses)
    raw_path.write_bytes(wide_path.read_bytes())
    wide = Image.open(raw_path)
    wide_poses = split_pose_lanes(wide)
    frame_paths, preview, _preview_4x, gif_path = normalize(job_id, wide_poses)
    qa_path = write_qa(job_id, direction, original_gaps, wide_gaps, raw_path, frame_paths, preview, gif_path)

    rows = load_queue()
    for row in rows:
        if row["job_id"] == job_id:
            row["status"] = "approved"
            row["generated_pose"] = str(job_prompt)
            row["raw_output"] = str(raw_path)
            row["normalized_output"] = str(ANIMATION / "frames" / f"{job_id}_01.png")
            row["preview"] = str(preview)
            row["gif"] = str(gif_path)
            row["local_tools"] = str(ANIMATION / "tools" / "poison_spray_pipeline_helper.py")
            row["qa_notes"] = str(qa_path)
    save_queue(rows)
    print(f"{job_id}: approved")
    print(f"original gaps: {original_gaps}")
    print(f"wide gaps: {wide_gaps}")


def assemble() -> None:
    rows = [row for row in load_queue() if row["animation"] == "poison_spray"]
    statuses = {row["direction"]: row["status"] for row in rows}
    missing = [direction for direction in DIRECTIONS if statuses.get(direction) != "approved"]
    if missing:
        raise RuntimeError(f"Cannot assemble; missing approved directions: {missing}")
    frames_by_direction = []
    for direction in DIRECTIONS:
        job_id = f"poison_spray_{direction}"
        frames = [Image.open(ANIMATION / "frames" / f"{job_id}_{i:02d}.png").convert("RGBA") for i in range(1, FRAME_COUNT + 1)]
        frames_by_direction.append(frames)
    sheet = Image.new("RGBA", (FRAME_W * FRAME_COUNT, FRAME_H * len(DIRECTIONS)), (0, 0, 0, 0))
    for row_i, frames in enumerate(frames_by_direction):
        for col_i, frame in enumerate(frames):
            sheet.alpha_composite(frame, (col_i * FRAME_W, row_i * FRAME_H))
    out = ANIMATION / "assembled" / "poison_spray_8dir_sheet.png"
    sheet.save(out)
    preview = ANIMATION / "assembled" / "poison_spray_8dir_sheet_2x_preview.png"
    sheet.resize((sheet.width * 2, sheet.height * 2), Image.Resampling.NEAREST).save(preview)
    csv_path = ANIMATION / "assembled" / "poison_spray_8dir_sheet.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["direction", "row", "frame_count", "frame_width", "frame_height", "anchor_x", "anchor_y"])
        for row_i, direction in enumerate(DIRECTIONS):
            writer.writerow([direction, row_i, FRAME_COUNT, FRAME_W, FRAME_H, ANCHOR_X, ANCHOR_Y])
    print(out)
    print(preview)
    print(csv_path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--init-queue", action="store_true")
    parser.add_argument("--process-job")
    parser.add_argument("--direction")
    parser.add_argument("--assemble", action="store_true")
    args = parser.parse_args()
    if args.init_queue:
        init_queue()
        return
    if args.process_job:
        if not args.direction:
            raise SystemExit("--direction is required with --process-job")
        process_job(args.process_job, args.direction)
        return
    if args.assemble:
        assemble()
        return
    raise SystemExit("Choose --init-queue, --process-job, or --assemble.")


if __name__ == "__main__":
    main()

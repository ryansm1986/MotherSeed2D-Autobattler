from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw


JOB_ID = "idle_west"
FRAME_COUNT = 5
FRAME_WIDTH = 384
FRAME_HEIGHT = 384
ANCHOR_X = 192
ANCHOR_Y = 360
MIN_GUTTER = 384
KEY = (255, 0, 255)


def is_subject_pixel(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a == 0:
        return False
    # Treat near-flat magenta as background, allowing light generation drift.
    if r >= 220 and g <= 45 and b >= 220:
        return False
    # Antialiased chroma-key edges often become purple instead of exact #ff00ff.
    if r >= 120 and b >= 120 and g <= 100 and (r + b) >= (2 * g + 180):
        return False
    if r >= 70 and b >= 70 and g <= 135 and abs(r - b) <= 100 and b >= g:
        return False
    return True


def mask_bounds_by_column(img: Image.Image) -> tuple[list[tuple[int, int]], list[int]]:
    rgba = img.convert("RGBA")
    width, height = rgba.size
    active = []
    for x in range(width):
        column_active = False
        for y in range(height):
            if is_subject_pixel(rgba.getpixel((x, y))):
                column_active = True
                break
        active.append(column_active)

    runs: list[tuple[int, int]] = []
    start = None
    for index, value in enumerate(active):
        if value and start is None:
            start = index
        elif not value and start is not None:
            runs.append((start, index - 1))
            start = None
    if start is not None:
        runs.append((start, width - 1))
    return runs, [0 if active_col else 1 for active_col in active]


def group_runs(runs: list[tuple[int, int]]) -> list[tuple[int, int]]:
    if not runs:
        return []
    groups = [runs[0]]
    for start, end in runs[1:]:
        prev_start, prev_end = groups[-1]
        gap = start - prev_end - 1
        # Small holes inside one sprite are pose internals, not pose separators.
        if gap < 48:
            groups[-1] = (prev_start, end)
        else:
            groups.append((start, end))
    return groups


def pose_bounds(img: Image.Image, x0: int, x1: int) -> tuple[int, int, int, int]:
    rgba = img.convert("RGBA")
    min_x, min_y = rgba.size
    max_x = max_y = -1
    for y in range(rgba.height):
        for x in range(x0, x1 + 1):
            if is_subject_pixel(rgba.getpixel((x, y))):
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x < 0:
        raise ValueError(f"empty pose bounds {x0}-{x1}")
    return min_x, min_y, max_x, max_y


def measure(source: Path) -> dict:
    img = Image.open(source).convert("RGBA")
    runs, _ = mask_bounds_by_column(img)
    groups = group_runs(runs)
    bounds = [pose_bounds(img, start, end) for start, end in groups]
    gaps = []
    for left, right in zip(bounds, bounds[1:]):
        gaps.append(right[0] - left[2] - 1)
    return {
        "job_id": JOB_ID,
        "source": str(source),
        "image_size": list(img.size),
        "pose_count": len(bounds),
        "pose_bounds": [list(bound) for bound in bounds],
        "gaps_px": gaps,
        "min_required_gutter_px": MIN_GUTTER,
        "spacing_pass": len(bounds) == FRAME_COUNT and all(gap >= MIN_GUTTER for gap in gaps),
    }


def chroma_to_alpha(crop: Image.Image) -> Image.Image:
    rgba = crop.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if not is_subject_pixel((r, g, b, a)):
                pixels[x, y] = (0, 0, 0, 0)
            elif r > b and b > g and r > 90 and b > 70:
                pixels[x, y] = (min(r, 170), g, min(b, 120), a)
    return rgba


def normalize(source: Path, frames_dir: Path, preview_dir: Path, gif_dir: Path, allow_spacing_fail: bool) -> dict:
    report = measure(source)
    if not report["spacing_pass"] and not allow_spacing_fail:
        raise SystemExit(json.dumps(report, indent=2))

    img = Image.open(source).convert("RGBA")
    crops = [chroma_to_alpha(img.crop((x0, y0, x1 + 1, y1 + 1))) for x0, y0, x1, y1 in report["pose_bounds"]]

    max_w = max(crop.width for crop in crops)
    max_h = max(crop.height for crop in crops)
    available_w = FRAME_WIDTH - 72
    available_h = FRAME_HEIGHT - 60
    scale = min(1.0, available_w / max_w, available_h / max_h)

    frames_dir.mkdir(parents=True, exist_ok=True)
    preview_dir.mkdir(parents=True, exist_ok=True)
    gif_dir.mkdir(parents=True, exist_ok=True)

    frames = []
    for index, crop in enumerate(crops, start=1):
        scaled = crop.resize((round(crop.width * scale), round(crop.height * scale)), Image.Resampling.LANCZOS)
        frame = Image.new("RGBA", (FRAME_WIDTH, FRAME_HEIGHT), (0, 0, 0, 0))
        x = round(ANCHOR_X - scaled.width / 2)
        y = round(ANCHOR_Y - scaled.height)
        frame.alpha_composite(scaled, (x, y))
        out = frames_dir / f"{JOB_ID}_{index:02d}.png"
        frame.save(out)
        frames.append(frame)

    preview = Image.new("RGBA", (FRAME_WIDTH * FRAME_COUNT, FRAME_HEIGHT), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        preview.alpha_composite(frame, (index * FRAME_WIDTH, 0))
    preview.save(preview_dir / f"{JOB_ID}_preview.png")

    preview_4x = preview.resize((preview.width * 4, preview.height * 4), Image.Resampling.NEAREST)
    preview_4x.save(preview_dir / f"{JOB_ID}_preview_4x.png")

    focused = Image.new("RGBA", (FRAME_WIDTH * FRAME_COUNT, FRAME_HEIGHT), (255, 0, 255, 255))
    for index, frame in enumerate(frames):
        focused.alpha_composite(frame, (index * FRAME_WIDTH, 0))
    draw = ImageDraw.Draw(focused)
    for index in range(FRAME_COUNT):
        x = index * FRAME_WIDTH
        draw.rectangle((x, 0, x + FRAME_WIDTH - 1, FRAME_HEIGHT - 1), outline=(0, 255, 255, 255), width=2)
    focused.save(preview_dir / f"{JOB_ID}_focused_qa.png")

    gif_frames = [frame.convert("P", palette=Image.Palette.ADAPTIVE) for frame in frames]
    gif_frames[0].save(
        gif_dir / f"{JOB_ID}.gif",
        save_all=True,
        append_images=gif_frames[1:],
        duration=180,
        loop=0,
        disposal=2,
    )

    report["normalized_scale"] = scale
    report["spacing_override"] = allow_spacing_fail and not report["spacing_pass"]
    report["outputs"] = {
        "frames_dir": str(frames_dir),
        "preview": str(preview_dir / f"{JOB_ID}_preview.png"),
        "preview_4x": str(preview_dir / f"{JOB_ID}_preview_4x.png"),
        "focused_qa": str(preview_dir / f"{JOB_ID}_focused_qa.png"),
        "gif": str(gif_dir / f"{JOB_ID}.gif"),
    }
    return report


def expand_source_canvas(source: Path, out: Path, gutter: int = MIN_GUTTER, margin: int = MIN_GUTTER) -> dict:
    report = measure(source)
    if report["pose_count"] != FRAME_COUNT:
        raise SystemExit(json.dumps(report, indent=2))

    img = Image.open(source).convert("RGBA")
    crops = []
    for x0, y0, x1, y1 in report["pose_bounds"]:
        crops.append(img.crop((x0, y0, x1 + 1, y1 + 1)))

    width = (margin * 2) + sum(crop.width for crop in crops) + (gutter * (len(crops) - 1))
    height = max(img.height, max(crop.height for crop in crops) + 160)
    expanded = Image.new("RGBA", (width, height), (*KEY, 255))

    floor_y = max(y1 for _, _, _, y1 in report["pose_bounds"])
    target_floor = min(height - 80, floor_y)
    x = margin
    placements = []
    for crop, bounds in zip(crops, report["pose_bounds"]):
        _, _, _, y1 = bounds
        y = target_floor - (y1 - bounds[1])
        expanded.alpha_composite(crop, (x, y))
        placements.append([x, y, x + crop.width - 1, y + crop.height - 1])
        x += crop.width + gutter

    out.parent.mkdir(parents=True, exist_ok=True)
    expanded.convert("RGB").save(out)
    expanded_report = measure(out)
    expanded_report["source_original"] = str(source)
    expanded_report["expanded_canvas"] = str(out)
    expanded_report["placements"] = placements
    expanded_report["canvas_expansion_gutter_px"] = gutter
    expanded_report["canvas_expansion_margin_px"] = margin
    return expanded_report


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--frames-dir", type=Path)
    parser.add_argument("--preview-dir", type=Path)
    parser.add_argument("--gif-dir", type=Path)
    parser.add_argument("--process", action="store_true")
    parser.add_argument("--allow-spacing-fail", action="store_true")
    parser.add_argument("--expand-source", type=Path)
    args = parser.parse_args()

    if args.expand_source:
        result = expand_source_canvas(args.source, args.expand_source)
    elif args.process:
        result = normalize(args.source, args.frames_dir, args.preview_dir, args.gif_dir, args.allow_spacing_fail)
    else:
        result = measure(args.source)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

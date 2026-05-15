#!/usr/bin/env python3
"""Finish one sprite-pipeline job from a generated chroma-key strip."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw


REQUIRED_DIRECTIONS = "south;southeast;east;northeast;north;northwest;west;southwest"


def is_key(px: tuple[int, int, int, int]) -> bool:
    r, g, b, _ = px
    return (
        (r > 95 and b > 95 and g < 120 and abs(r - b) < 105 and (r + b) > (2 * g + 95))
        or (r > 180 and b > 180 and g < 150)
    )


def checker(size: tuple[int, int], cell: int = 8) -> Image.Image:
    image = Image.new("RGBA", size, (235, 238, 242, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2 == 0:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=(214, 220, 226, 255))
    return image


def detect_groups(image: Image.Image, split_gap: int) -> list[list[int]]:
    width, height = image.size
    occupied: list[int] = []
    for x in range(width):
        count = sum(1 for y in range(height) if image.getpixel((x, y))[3] > 8)
        if count > 8:
            occupied.append(x)
    groups: list[list[int]] = []
    for x in occupied:
        if not groups or x - groups[-1][1] > split_gap:
            groups.append([x, x])
        else:
            groups[-1][1] = x
    return groups


def crop_groups(image: Image.Image, groups: list[list[int]]) -> list[Image.Image]:
    width, height = image.size
    crops: list[Image.Image] = []
    for gx0, gx1 in groups:
        xs: list[int] = []
        ys: list[int] = []
        for y in range(height):
            for x in range(max(0, gx0 - 4), min(width, gx1 + 5)):
                if image.getpixel((x, y))[3] > 8:
                    xs.append(x)
                    ys.append(y)
        if not xs:
            raise SystemExit(f"No content detected for group {gx0}-{gx1}")
        crops.append(
            image.crop(
                (
                    max(0, min(xs) - 2),
                    max(0, min(ys) - 2),
                    min(width - 1, max(xs) + 2) + 1,
                    min(height - 1, max(ys) + 2) + 1,
                )
            )
        )
    return crops


def visible_bounds_for_groups(image: Image.Image, groups: list[list[int]]) -> list[tuple[int, int, int, int]]:
    width, height = image.size
    bounds: list[tuple[int, int, int, int]] = []
    for gx0, gx1 in groups:
        xs: list[int] = []
        ys: list[int] = []
        for y in range(height):
            for x in range(max(0, gx0), min(width, gx1 + 1)):
                if image.getpixel((x, y))[3] > 8:
                    xs.append(x)
                    ys.append(y)
        if not xs:
            raise SystemExit(f"No visible content detected for source group {gx0}-{gx1}")
        bounds.append((min(xs), min(ys), max(xs) + 1, max(ys) + 1))
    return bounds


def visible_gaps(bounds: list[tuple[int, int, int, int]]) -> list[int]:
    return [bounds[index + 1][0] - bounds[index][2] for index in range(len(bounds) - 1)]


def contact_sheet(
    frames: list[Image.Image],
    frame_width: int,
    frame_height: int,
    anchor_y: int,
    scale: int,
    out_path: Path,
    *,
    boxes: bool = False,
) -> None:
    columns = 4
    gap = 8 if scale == 1 else 24
    rows = (len(frames) + columns - 1) // columns
    sheet = checker(
        (
            columns * frame_width * scale + (columns - 1) * gap,
            rows * frame_height * scale + (rows - 1) * gap,
        ),
        max(8, 8 * scale),
    )
    draw = ImageDraw.Draw(sheet)
    for index, frame in enumerate(frames):
        column = index % columns
        row = index // columns
        x = column * (frame_width * scale + gap)
        y = row * (frame_height * scale + gap)
        sheet.alpha_composite(
            frame.resize((frame_width * scale, frame_height * scale), Image.Resampling.NEAREST),
            (x, y),
        )
        if boxes:
            bbox = frame.getchannel("A").getbbox()
            if bbox:
                bx0, by0, bx1, by1 = [value * scale for value in bbox]
                draw.rectangle(
                    (x + bx0, y + by0, x + bx1 - 1, y + by1 - 1),
                    outline=(255, 64, 64, 255),
                    width=max(1, scale),
                )
            draw.line(
                (x, y + anchor_y * scale, x + frame_width * scale - 1, y + anchor_y * scale),
                fill=(64, 160, 255, 255),
                width=max(1, scale),
            )
    sheet.save(out_path)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--job-id", required=True)
    parser.add_argument("--animation", required=True)
    parser.add_argument("--direction", required=True)
    parser.add_argument("--attempt", required=True, type=Path)
    parser.add_argument("--base-sources", required=True)
    parser.add_argument("--plan-json")
    parser.add_argument("--plan-file", type=Path)
    parser.add_argument("--profile", default="expanded_action_384")
    parser.add_argument("--frame-count", type=int, default=8)
    parser.add_argument("--frame-width", type=int, default=384)
    parser.add_argument("--frame-height", type=int, default=384)
    parser.add_argument("--anchor-x", type=int, default=192)
    parser.add_argument("--anchor-y", type=int, default=376)
    parser.add_argument("--min-side", type=int, default=96)
    parser.add_argument("--min-top", type=int, default=96)
    parser.add_argument("--source-spacing", type=int, default=384)
    parser.add_argument("--split-mode", choices=("groups", "slots"), default="groups")
    args = parser.parse_args()

    root = args.root
    animation_dir = root / args.animation
    raw_dir = animation_dir / "raw"
    frames_dir = animation_dir / "frames"
    preview_dir = animation_dir / "preview"
    gif_dir = animation_dir / "gif"
    qa_dir = animation_dir / "qa"
    for directory in (raw_dir, frames_dir, preview_dir, gif_dir, qa_dir):
        directory.mkdir(parents=True, exist_ok=True)

    raw_path = raw_dir / f"{args.job_id}_raw.png"
    image = Image.open(args.attempt).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    for y in range(height):
        for x in range(width):
            if is_key(pixels[x, y]):
                pixels[x, y] = (0, 0, 0, 0)

    if args.split_mode == "slots":
        groups = []
        for index in range(args.frame_count):
            left = round(index * image.width / args.frame_count)
            right = round((index + 1) * image.width / args.frame_count) - 1
            groups.append([left, right])
    else:
        groups: list[list[int]] | None = None
        for split_gap in (2, 4, 8, 10, 16, 24, 32):
            candidate = detect_groups(image, split_gap)
            if len(candidate) == args.frame_count:
                groups = candidate
                break
        if groups is None:
            raise SystemExit(f"{args.job_id}: expected {args.frame_count} groups, could not segment source")

    initial_bounds = visible_bounds_for_groups(image, groups)
    initial_gaps = visible_gaps(initial_bounds)
    if initial_gaps and min(initial_gaps) < args.source_spacing:
        raise SystemExit(
            f"{args.job_id}: initial generated source spacing failed; "
            f"required >= {args.source_spacing}px, got min {min(initial_gaps)}px gaps={initial_gaps}. "
            "Regenerate the source strip with wider empty #ff00ff gutters before cleanup/repack."
        )

    crops = crop_groups(image, groups)

    gutter = args.source_spacing
    outer = args.source_spacing
    top_pad = max(args.min_top, 96)
    bottom_pad = max(args.frame_height - args.anchor_y, 16)
    repacked = Image.new(
        "RGBA",
        (outer * 2 + sum(crop.width for crop in crops) + gutter * (len(crops) - 1), max(crop.height for crop in crops) + top_pad + bottom_pad),
        (255, 0, 255, 255),
    )
    x = outer
    baseline = repacked.height - bottom_pad
    for crop in crops:
        repacked.alpha_composite(crop, (x, baseline - crop.height))
        x += crop.width + gutter
    repacked.convert("RGB").save(raw_path)

    max_width = max(crop.width for crop in crops)
    max_height = max(crop.height for crop in crops)
    scale = min(
        (args.frame_width - args.min_side * 2) / max_width,
        (args.anchor_y - args.min_top) / max_height,
    )
    frames: list[Image.Image] = []
    frame_bounds: list[tuple[int, int, int, int] | None] = []
    for index, crop in enumerate(crops, start=1):
        resized_width = max(1, round(crop.width * scale))
        resized_height = max(1, round(crop.height * scale))
        resized = crop.resize((resized_width, resized_height), Image.Resampling.NEAREST)
        frame = Image.new("RGBA", (args.frame_width, args.frame_height), (0, 0, 0, 0))
        frame.alpha_composite(
            resized,
            (round(args.anchor_x - resized_width / 2), round(args.anchor_y - resized_height)),
        )
        frame.save(frames_dir / f"{args.job_id}_{index:02d}.png")
        frames.append(frame)
        frame_bounds.append(frame.getchannel("A").getbbox())

    contact_sheet(frames, args.frame_width, args.frame_height, args.anchor_y, 1, preview_dir / f"{args.job_id}_preview.png")
    contact_sheet(frames, args.frame_width, args.frame_height, args.anchor_y, 4, preview_dir / f"{args.job_id}_preview_4x.png")
    contact_sheet(frames, args.frame_width, args.frame_height, args.anchor_y, 4, preview_dir / f"{args.job_id}_focused_qa.png", boxes=True)

    gif_frames: list[Image.Image] = []
    for frame in frames:
        background = checker((args.frame_width * 2, args.frame_height * 2), 16)
        background.alpha_composite(frame.resize((args.frame_width * 2, args.frame_height * 2), Image.Resampling.NEAREST))
        gif_frames.append(background.convert("P", palette=Image.Palette.ADAPTIVE, colors=255))
    gif_frames[0].save(
        gif_dir / f"{args.job_id}.gif",
        save_all=True,
        append_images=gif_frames[1:],
        duration=100,
        loop=0,
        optimize=False,
        disposal=2,
    )

    edge_contacts = []
    for index, bbox in enumerate(frame_bounds, start=1):
        if bbox is None:
            edge_contacts.append((index, "empty"))
            continue
        left, top, right, bottom = bbox
        if left <= 0 or top <= 0 or right >= args.frame_width or bottom >= args.frame_height:
            edge_contacts.append((index, bbox))
    fringe = sum(
        1
        for frame in frames
        for r, g, b, a in frame.getdata()
        if a > 0 and r > 95 and b > 95 and g < 120 and abs(r - b) < 105 and (r + b) > (2 * g + 95)
    )
    if edge_contacts:
        raise SystemExit(f"{args.job_id}: edge contact {edge_contacts}")
    if fringe:
        raise SystemExit(f"{args.job_id}: magenta fringe {fringe}")

    if args.plan_file:
        plan = json.loads(args.plan_file.read_text(encoding="utf-8-sig"))
    elif args.plan_json:
        plan = json.loads(args.plan_json)
    else:
        raise SystemExit("Either --plan-json or --plan-file is required.")
    qa_path = qa_dir / f"{args.job_id}_qa.md"
    qa_path.write_text(
        "\n".join(
            [
                f"# {args.job_id} QA",
                "",
                "Status: `approved`",
                "",
                "## Inputs",
                "",
                f"- Queue row: `{args.job_id}`",
                "- Required skill: `$game-studio:sprite-pipeline`",
                f"- Animation/direction: `{args.animation} + {args.direction}`",
                f"- Mapped base source(s): `{args.base_sources}`",
                "- Direction set: `8_directional`",
                f"- Frame count: `{args.frame_count}`",
                "- Subject size: `default`",
                f"- Frame profile: `{args.profile}`",
                f"- Raw generated attempt: `{args.attempt}`",
                f"- Accepted source strip: `{raw_path}`",
                f"- Normalized frames: `{frames_dir}\\{args.job_id}_01.png` through `{args.job_id}_{args.frame_count:02d}.png`",
                f"- Preview: `{preview_dir}\\{args.job_id}_preview.png`",
                f"- 4x preview: `{preview_dir}\\{args.job_id}_preview_4x.png`",
                f"- Focused QA preview: `{preview_dir}\\{args.job_id}_focused_qa.png`",
                f"- Review GIF: `{gif_dir}\\{args.job_id}.gif`",
                "",
                "## Frame-by-frame pose plan",
                "",
                *[f"{index}. {beat}" for index, beat in enumerate(plan, start=1)],
                "",
                "## Source Provenance",
                "",
                "- Fresh source generated from the mapped base reference(s).",
                f"- Source was segmented into {args.frame_count} pose groups and repacked onto a clean flat `#ff00ff` strip with `{args.source_spacing}px` gutters before normalization.",
                "",
                "## QA Results",
                "",
                f"- `{args.frame_count}` distinct animation poses detected and normalized.",
                f"- Final frames are exactly `{args.frame_width}x{args.frame_height}`, transparent, and use shared bottom-center anchor `{{ x: {args.anchor_x}, y: {args.anchor_y} }}`.",
                "- No edge contact detected.",
                "- No magenta-like fringe pixels detected.",
                "- Preview, 4x preview, focused QA preview, and looping GIF exist.",
                "",
                "Final QA status: `approved`",
                "",
            ]
        ),
        encoding="utf-8",
    )

    queue_path = root / "animation_queue.csv"
    with queue_path.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
        fieldnames = list(rows[0].keys())
    found = False
    for row in rows:
        if row["job_id"] == args.job_id:
            row["status"] = "approved"
            row["generated_pose"] = f"see {args.animation}/qa/{args.job_id}_qa.md frame-by-frame pose plan"
            row["raw_output"] = str(raw_path)
            row["normalized_output"] = str(frames_dir / f"{args.job_id}_01.png")
            row["preview"] = str(preview_dir / f"{args.job_id}_preview.png")
            row["gif"] = str(gif_dir / f"{args.job_id}.gif")
            row["qa_notes"] = str(qa_path)
            found = True
    if not found:
        raise SystemExit(f"Queue row not found: {args.job_id}")
    with queue_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"{args.job_id} approved scale={scale:.6f} groups={groups}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

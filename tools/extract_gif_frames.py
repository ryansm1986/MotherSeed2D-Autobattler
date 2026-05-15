#!/usr/bin/env python3
"""Extract GIF animation frames into runtime-ready PNG sprite frames.

The tool can either dump frames at their original GIF canvas size or normalize
them into a fixed game canvas with a shared scale and bottom-center anchor.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageSequence


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TEMPLATE = "{animation}_{direction}_{index:02d}.png"


@dataclass(frozen=True)
class GifJob:
    path: Path
    animation: str
    direction: str


@dataclass(frozen=True)
class Normalization:
    frame_width: int
    frame_height: int
    target_visible_height: int
    output_anchor_x: float
    output_baseline_y: float


def rel(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(ROOT)).replace("\\", "/")
    except ValueError:
        return str(path)


def normalize_token(value: str) -> str:
    token = value.strip().lower().replace("-", "_").replace(" ", "_")
    token = re.sub(r"[^a-z0-9_]+", "_", token)
    token = re.sub(r"_+", "_", token).strip("_")
    return token


def expand_inputs(patterns: Iterable[str]) -> list[Path]:
    paths: list[Path] = []
    for pattern in patterns:
        raw = Path(pattern)
        if any(char in pattern for char in "*?[]"):
            root = Path.cwd()
            matches = sorted(root.glob(pattern))
            paths.extend(path for path in matches if path.is_file())
        elif raw.is_file():
            paths.append(raw)
        else:
            raise SystemExit(f"ERROR: input not found: {pattern}")

    deduped: list[Path] = []
    seen: set[Path] = set()
    for path in paths:
        resolved = path.resolve()
        if resolved in seen:
            continue
        seen.add(resolved)
        deduped.append(path)

    if not deduped:
        raise SystemExit("ERROR: no GIF files matched --input")
    return deduped


def parse_frame_size(value: str) -> tuple[int, int]:
    if "x" not in value.lower():
        size = int(value)
        return size, size
    left, right = value.lower().split("x", 1)
    return int(left), int(right)


def parse_direction_map(value: str | None) -> dict[str, str]:
    if not value:
        return {}
    output: dict[str, str] = {}
    for item in value.split(","):
        if not item.strip():
            continue
        if "=" not in item:
            raise SystemExit(f"ERROR: invalid --direction-map item {item!r}; expected from=to")
        source, target = item.split("=", 1)
        output[normalize_token(source)] = normalize_token(target)
    return output


def infer_animation_direction(path: Path, forced_animation: str | None, forced_direction: str | None) -> tuple[str, str]:
    stem = normalize_token(path.stem)
    parts = [part for part in stem.split("_") if part]

    if forced_animation and forced_direction:
        return normalize_token(forced_animation), normalize_token(forced_direction)

    if forced_animation:
        animation = normalize_token(forced_animation)
        direction_parts = [part for part in parts if part != animation]
        if forced_direction:
            return animation, normalize_token(forced_direction)
        if not direction_parts:
            raise SystemExit(f"ERROR: could not infer direction from {path.name}; pass --direction")
        return animation, "_".join(direction_parts)

    if forced_direction:
        direction = normalize_token(forced_direction)
        animation_parts = [part for part in parts if part != direction]
        if not animation_parts:
            raise SystemExit(f"ERROR: could not infer animation from {path.name}; pass --animation")
        return "_".join(animation_parts), direction

    if len(parts) < 2:
        raise SystemExit(f"ERROR: could not infer animation/direction from {path.name}")

    known_directions = {
        "down",
        "up",
        "left",
        "right",
        "south",
        "north",
        "east",
        "west",
        "down_left",
        "down_right",
        "up_left",
        "up_right",
        "southwest",
        "southeast",
        "northwest",
        "northeast",
    }

    for size in (2, 1):
        if len(parts) <= size:
            continue
        candidate = "_".join(parts[:size])
        if candidate in known_directions:
            return "_".join(parts[size:]), candidate

        candidate = "_".join(parts[-size:])
        if candidate in known_directions:
            return "_".join(parts[:-size]), candidate

    return parts[0], "_".join(parts[1:])


def load_gif_frames(path: Path) -> tuple[list[Image.Image], list[int]]:
    image = Image.open(path)
    frames: list[Image.Image] = []
    durations: list[int] = []
    for frame in ImageSequence.Iterator(image):
        frames.append(frame.convert("RGBA"))
        durations.append(int(frame.info.get("duration", image.info.get("duration", 100))))
    if not frames:
        raise SystemExit(f"ERROR: {rel(path)} did not contain any frames")
    return frames, durations


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    return image.getchannel("A").getbbox()


def union_bbox(frames: list[Image.Image]) -> tuple[int, int, int, int]:
    boxes = [box for frame in frames if (box := alpha_bbox(frame))]
    if not boxes:
        raise SystemExit("ERROR: all frames are transparent")
    return (
        min(box[0] for box in boxes),
        min(box[1] for box in boxes),
        max(box[2] for box in boxes),
        max(box[3] for box in boxes),
    )


def normalize_frames(frames: list[Image.Image], settings: Normalization) -> tuple[list[Image.Image], dict[str, float]]:
    source_box = union_bbox(frames)
    source_anchor_x = (source_box[0] + source_box[2]) / 2
    source_baseline_y = source_box[3]
    source_visible_height = source_box[3] - source_box[1]
    scale = settings.target_visible_height / source_visible_height

    normalized: list[Image.Image] = []
    for frame in frames:
        box = alpha_bbox(frame)
        output = Image.new("RGBA", (settings.frame_width, settings.frame_height), (0, 0, 0, 0))
        if box:
            cropped = frame.crop(box)
            scaled_size = (
                max(1, round(cropped.width * scale)),
                max(1, round(cropped.height * scale)),
            )
            scaled = cropped.resize(scaled_size, Image.Resampling.LANCZOS)
            paste_x = round(settings.output_anchor_x + (box[0] - source_anchor_x) * scale)
            paste_y = round(settings.output_baseline_y + (box[1] - source_baseline_y) * scale)
            output.alpha_composite(scaled, (paste_x, paste_y))
        normalized.append(output)

    metadata = {
        "scale": scale,
        "source_anchor_x": source_anchor_x,
        "source_baseline_y": source_baseline_y,
        "source_visible_height": source_visible_height,
        "output_anchor_x": settings.output_anchor_x,
        "output_baseline_y": settings.output_baseline_y,
    }
    return normalized, metadata


def render_name(template: str, *, job: GifJob, index: int, source_stem: str) -> str:
    return template.format(
        animation=job.animation,
        direction=job.direction,
        gif_stem=normalize_token(source_stem),
        index=index,
    )


def ensure_safe_outputs(paths: list[Path], overwrite: bool, *, check_existing: bool) -> None:
    duplicates = sorted({path for path in paths if paths.count(path) > 1})
    if duplicates:
        formatted = "\n".join(f"- {rel(path)}" for path in duplicates)
        raise SystemExit(f"ERROR: output name collision:\n{formatted}")
    if not check_existing:
        return
    existing = [path for path in paths if path.exists()]
    if existing and not overwrite:
        formatted = "\n".join(f"- {rel(path)}" for path in existing[:20])
        extra = "" if len(existing) <= 20 else f"\n...and {len(existing) - 20} more"
        raise SystemExit(f"ERROR: output files already exist. Pass --overwrite to replace them:\n{formatted}{extra}")


def write_manifest(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extract GIF frames into PNGs, optionally normalized for runtime sprites.")
    parser.add_argument("--input", nargs="+", required=True, help="One or more GIF files or glob patterns")
    parser.add_argument("--out-dir", type=Path, required=True, help="Directory for extracted PNG frames")
    parser.add_argument("--animation", help="Override animation name, such as idle or attack")
    parser.add_argument("--direction", help="Override direction name for a single GIF")
    parser.add_argument("--direction-map", help="Comma-separated direction remaps, such as down=south,up=north")
    parser.add_argument("--name-template", default=DEFAULT_TEMPLATE, help=f"Output filename template. Default: {DEFAULT_TEMPLATE}")
    parser.add_argument("--frame-size", help="Normalize into a fixed canvas, either N or WIDTHxHEIGHT")
    parser.add_argument("--target-visible-height", type=int, help="Visible sprite height after normalization")
    parser.add_argument("--anchor-x", type=float, help="Output anchor x. Defaults to frame width / 2")
    parser.add_argument("--baseline-y", type=float, help="Output baseline y. Defaults to frame height - 2")
    parser.add_argument("--manifest", type=Path, help="Optional JSON manifest path")
    parser.add_argument("--overwrite", action="store_true", help="Replace existing output files")
    parser.add_argument("--dry-run", action="store_true", help="Print planned outputs without writing files")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    direction_map = parse_direction_map(args.direction_map)
    input_paths = expand_inputs(args.input)

    if args.direction and len(input_paths) > 1:
        raise SystemExit("ERROR: --direction can only be used with one input GIF")

    normalization: Normalization | None = None
    if args.frame_size:
        if not args.target_visible_height:
            raise SystemExit("ERROR: --target-visible-height is required when --frame-size is used")
        frame_width, frame_height = parse_frame_size(args.frame_size)
        normalization = Normalization(
            frame_width=frame_width,
            frame_height=frame_height,
            target_visible_height=args.target_visible_height,
            output_anchor_x=args.anchor_x if args.anchor_x is not None else frame_width / 2,
            output_baseline_y=args.baseline_y if args.baseline_y is not None else frame_height - 2,
        )
    elif args.anchor_x is not None or args.baseline_y is not None or args.target_visible_height is not None:
        raise SystemExit("ERROR: --anchor-x, --baseline-y, and --target-visible-height require --frame-size")

    jobs: list[GifJob] = []
    for path in input_paths:
        animation, direction = infer_animation_direction(path, args.animation, args.direction)
        direction = direction_map.get(direction, direction)
        jobs.append(GifJob(path=path, animation=animation, direction=direction))

    planned_outputs: list[Path] = []
    loaded: list[tuple[GifJob, list[Image.Image], list[int], dict[str, float]]] = []
    for job in jobs:
        frames, durations = load_gif_frames(job.path)
        metadata: dict[str, float] = {}
        if normalization:
            frames, metadata = normalize_frames(frames, normalization)
        loaded.append((job, frames, durations, metadata))
        for index in range(1, len(frames) + 1):
            planned_outputs.append(args.out_dir / render_name(args.name_template, job=job, index=index, source_stem=job.path.stem))

    ensure_safe_outputs(planned_outputs, args.overwrite, check_existing=not args.dry_run)

    print(f"Inputs:      {len(jobs)} GIF(s)")
    print(f"Output dir:  {rel(args.out_dir)}")
    if normalization:
        print(f"Normalize:   {normalization.frame_width}x{normalization.frame_height}, visible height {normalization.target_visible_height}")
    else:
        print("Normalize:   off")

    if args.dry_run:
        print("Dry run:     no files written")
        for path in planned_outputs[:30]:
            print(f"- {rel(path)}")
        if len(planned_outputs) > 30:
            print(f"...and {len(planned_outputs) - 30} more")
        return 0

    args.out_dir.mkdir(parents=True, exist_ok=True)
    manifest_jobs: list[dict] = []
    output_iter = iter(planned_outputs)
    for job, frames, durations, metadata in loaded:
        frame_paths: list[str] = []
        for frame in frames:
            out_path = next(output_iter)
            frame.save(out_path)
            frame_paths.append(rel(out_path))
        manifest_jobs.append(
            {
                "source": rel(job.path),
                "animation": job.animation,
                "direction": job.direction,
                "frames": frame_paths,
                "durations_ms": durations,
                "normalization": metadata,
            }
        )

    if args.manifest:
        args.manifest.parent.mkdir(parents=True, exist_ok=True)
        write_manifest(
            args.manifest,
            {
                "tool": "tools/extract_gif_frames.py",
                "jobs": manifest_jobs,
            },
        )
        print(f"Manifest:    {rel(args.manifest)}")

    print(f"Wrote:       {len(planned_outputs)} PNG frame(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

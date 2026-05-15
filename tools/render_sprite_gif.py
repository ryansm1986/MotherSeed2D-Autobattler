#!/usr/bin/env python3
"""Render a looping review GIF from normalized sprite frames."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CHARACTER_ROOT = ROOT / "assets" / "characters" / "green_warrior_v3"


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT)).replace("\\", "/")
    except ValueError:
        return str(path)


def load_queue_row(character_root: Path, job_id: str) -> dict[str, str]:
    queue_path = character_root / "animation_queue.csv"
    with queue_path.open("r", encoding="utf-8", newline="") as handle:
        rows = [row for row in csv.DictReader(handle) if row["job_id"] == job_id]
    if len(rows) != 1:
        raise SystemExit(f"ERROR: expected exactly one queue row for {job_id}, found {len(rows)}")
    return rows[0]


def checker(size: tuple[int, int], cell: int) -> Image.Image:
    image = Image.new("RGBA", size, (28, 28, 28, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2 == 0:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=(58, 58, 58, 255))
    return image


def frame_path(frames_dir: Path, job_id: str, index: int) -> Path:
    return frames_dir / f"{job_id}_{index:02d}.png"


def load_frames(frames_dir: Path, job_id: str, frame_count: int) -> list[Image.Image]:
    frames: list[Image.Image] = []
    missing: list[Path] = []
    for index in range(1, frame_count + 1):
        path = frame_path(frames_dir, job_id, index)
        if not path.exists():
            missing.append(path)
            continue
        image = Image.open(path).convert("RGBA")
        if image.getchannel("A").getbbox() is None:
            raise SystemExit(f"ERROR: {rel(path)} is empty")
        frames.append(image)
    if missing:
        formatted = "\n".join(f"- {rel(path)}" for path in missing)
        raise SystemExit(f"ERROR: missing frame files:\n{formatted}")
    return frames


def compose_frame(frame: Image.Image, scale: int, background: str) -> Image.Image:
    scaled_size = (frame.width * scale, frame.height * scale)
    scaled = frame.resize(scaled_size, Image.Resampling.NEAREST)
    if background == "checker":
        base = checker(scaled_size, max(4, 8 * scale))
    elif background == "magenta":
        base = Image.new("RGBA", scaled_size, (255, 0, 255, 255))
    elif background == "transparent":
        base = Image.new("RGBA", scaled_size, (0, 0, 0, 0))
    else:
        raise SystemExit(f"ERROR: unsupported background {background!r}")
    base.alpha_composite(scaled)
    return base.convert("P", palette=Image.Palette.ADAPTIVE, colors=255)


def render_gif(
    frames: list[Image.Image],
    out_path: Path,
    *,
    scale: int,
    fps: float,
    background: str,
    pingpong: bool,
) -> None:
    if not frames:
        raise SystemExit("ERROR: no frames to render")
    if scale < 1:
        raise SystemExit("ERROR: --scale must be at least 1")
    if fps <= 0:
        raise SystemExit("ERROR: --fps must be greater than 0")

    sequence = frames
    if pingpong and len(frames) > 2:
        sequence = frames + frames[-2:0:-1]

    duration_ms = max(10, round(1000 / fps))
    gif_frames = [compose_frame(frame, scale, background) for frame in sequence]
    out_path.parent.mkdir(parents=True, exist_ok=True)
    gif_frames[0].save(
        out_path,
        save_all=True,
        append_images=gif_frames[1:],
        duration=duration_ms,
        loop=0,
        optimize=False,
        disposal=2,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render a looping review GIF from normalized sprite frames.")
    parser.add_argument("--job-id", required=True, help="Queue job id, such as sprint_down")
    parser.add_argument("--character-root", type=Path, default=DEFAULT_CHARACTER_ROOT)
    parser.add_argument("--frames-dir", type=Path, help="Override normalized frame directory")
    parser.add_argument("--out", type=Path, help="Output GIF path")
    parser.add_argument("--frame-count", type=int, help="Override frame count instead of reading the queue")
    parser.add_argument("--scale", type=int, default=4, help="Nearest-neighbor display scale")
    parser.add_argument("--fps", type=float, default=10.0, help="Playback rate")
    parser.add_argument("--background", choices=("checker", "magenta", "transparent"), default="checker")
    parser.add_argument("--pingpong", action="store_true", help="Append reversed in-between frames for boomerang review")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    character_root = args.character_root.resolve()
    row = load_queue_row(character_root, args.job_id)
    animation = row["animation"]
    frame_count = args.frame_count or int(row["frame_count"])
    frames_dir = args.frames_dir or character_root / animation / "frames"
    out_path = args.out or character_root / animation / "preview" / f"{args.job_id}_anim.gif"

    frames = load_frames(frames_dir, args.job_id, frame_count)
    render_gif(
        frames,
        out_path,
        scale=args.scale,
        fps=args.fps,
        background=args.background,
        pingpong=args.pingpong,
    )

    print(f"Rendered GIF: {rel(out_path)}")
    print(f"Frames:       {len(frames)}")
    print(f"Scale/FPS:    {args.scale}x @ {args.fps:g} fps")
    print(f"Background:   {args.background}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

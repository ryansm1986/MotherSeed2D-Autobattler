from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw


KEY = (255, 0, 255)


def is_background(r: int, g: int, b: int) -> bool:
    return r >= 185 and b >= 185 and g <= 95


def chroma_to_alpha(src: Image.Image) -> Image.Image:
    rgba = src.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if is_background(r, g, b):
                pixels[x, y] = (r, g, b, 0)
    return rgba


def alpha_bbox(img: Image.Image) -> tuple[int, int, int, int]:
    alpha = img.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        raise ValueError("No visible pixels found")
    return bbox


def split_equal_lanes(img: Image.Image, frames: int) -> list[Image.Image]:
    lane_w = img.width / frames
    lanes: list[Image.Image] = []
    for i in range(frames):
        left = round(i * lane_w)
        right = round((i + 1) * lane_w)
        lanes.append(img.crop((left, 0, right, img.height)))
    return lanes


def normalize_frames(
    lanes: list[Image.Image],
    out_dir: Path,
    job_id: str,
    frame_w: int,
    frame_h: int,
    anchor_x: int,
    anchor_y: int,
) -> list[Path]:
    bboxes = [alpha_bbox(lane) for lane in lanes]
    max_w = max(x2 - x1 for x1, y1, x2, y2 in bboxes)
    max_h = max(y2 - y1 for x1, y1, x2, y2 in bboxes)
    scale = min((frame_w - 96) / max_w, (anchor_y - 24) / max_h, 1.0)
    out_dir.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    for idx, (lane, bbox) in enumerate(zip(lanes, bboxes), start=1):
        x1, y1, x2, y2 = bbox
        crop = lane.crop(bbox)
        resized = crop.resize(
            (max(1, round(crop.width * scale)), max(1, round(crop.height * scale))),
            Image.Resampling.LANCZOS,
        )
        frame = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
        paste_x = round(anchor_x - resized.width / 2)
        paste_y = round(anchor_y - resized.height)
        frame.alpha_composite(resized, (paste_x, paste_y))
        path = out_dir / f"{job_id}_{idx:02d}.png"
        frame.save(path)
        paths.append(path)
    return paths


def make_preview(paths: list[Path], out: Path, scale: int = 1) -> None:
    frames = [Image.open(path).convert("RGBA") for path in paths]
    w, h = frames[0].size
    sheet = Image.new("RGBA", (w * len(frames), h), (32, 32, 32, 255))
    for i, frame in enumerate(frames):
        bg = Image.new("RGBA", frame.size, (38, 38, 38, 255))
        tile = Image.alpha_composite(bg, frame)
        sheet.alpha_composite(tile, (i * w, 0))
    if scale != 1:
        sheet = sheet.resize((sheet.width * scale, sheet.height * scale), Image.Resampling.NEAREST)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)


def make_focused_preview(paths: list[Path], out: Path) -> None:
    frames = [Image.open(path).convert("RGBA") for path in paths]
    boxes = [alpha_bbox(frame) for frame in frames]
    left = max(0, min(x1 for x1, y1, x2, y2 in boxes) - 24)
    top = max(0, min(y1 for x1, y1, x2, y2 in boxes) - 24)
    right = min(frames[0].width, max(x2 for x1, y1, x2, y2 in boxes) + 24)
    bottom = min(frames[0].height, max(y2 for x1, y1, x2, y2 in boxes) + 24)
    crops = [frame.crop((left, top, right, bottom)) for frame in frames]
    w, h = crops[0].size
    sheet = Image.new("RGBA", (w * len(crops), h), (38, 38, 38, 255))
    for i, crop in enumerate(crops):
        sheet.alpha_composite(crop, (i * w, 0))
    sheet = sheet.resize((sheet.width * 2, sheet.height * 2), Image.Resampling.NEAREST)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)


def make_gif(paths: list[Path], out: Path) -> None:
    frames = []
    for path in paths:
        frame = Image.open(path).convert("RGBA")
        bg = Image.new("RGBA", frame.size, (38, 38, 38, 255))
        frames.append(Image.alpha_composite(bg, frame).convert("P", palette=Image.Palette.ADAPTIVE))
    out.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(out, save_all=True, append_images=frames[1:], duration=110, loop=0, disposal=2)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--raw", required=True, type=Path)
    parser.add_argument("--job-id", default="rock_spray_south")
    parser.add_argument("--frames-dir", required=True, type=Path)
    parser.add_argument("--preview-dir", required=True, type=Path)
    parser.add_argument("--gif-dir", required=True, type=Path)
    args = parser.parse_args()

    src = Image.open(args.raw)
    alpha = chroma_to_alpha(src)
    lanes = split_equal_lanes(alpha, 8)
    frame_paths = normalize_frames(lanes, args.frames_dir, args.job_id, 1152, 1152, 576, 1128)
    make_preview(frame_paths, args.preview_dir / f"{args.job_id}_preview.png", scale=1)
    make_preview(frame_paths, args.preview_dir / f"{args.job_id}_preview_4x.png", scale=4)
    make_focused_preview(frame_paths, args.preview_dir / f"{args.job_id}_focused_qa.png")
    make_gif(frame_paths, args.gif_dir / f"{args.job_id}.gif")


if __name__ == "__main__":
    main()

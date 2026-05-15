from __future__ import annotations

from pathlib import Path
import shutil

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
FRAMES = ROOT / "frames"
PREVIEW = ROOT / "preview"
GIF = ROOT / "gif"
BACKUP = FRAMES / "backup_before_slam_scale"
JOB_IDS = [
    "rock_spray_south",
    "rock_spray_southeast",
    "rock_spray_east",
    "rock_spray_northeast",
    "rock_spray_north",
    "rock_spray_northwest",
    "rock_spray_west",
    "rock_spray_southwest",
]
FRAME_W = 1152
FRAME_H = 1152
ANCHOR_X = 576
ANCHOR_Y = 1128
SCALE = 2.6


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("Frame has no visible pixels")
    return bbox


def backup_frames() -> None:
    BACKUP.mkdir(parents=True, exist_ok=True)
    for path in FRAMES.glob("rock_spray_*.png"):
        target = BACKUP / path.name
        if not target.exists():
            shutil.copy2(path, target)


def rescale_frame(path: Path) -> None:
    source = Image.open(path).convert("RGBA")
    bbox = alpha_bbox(source)
    crop = source.crop(bbox)
    resized = crop.resize(
        (round(crop.width * SCALE), round(crop.height * SCALE)),
        Image.Resampling.LANCZOS,
    )
    frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    paste_x = round(ANCHOR_X - resized.width / 2)
    paste_y = round(ANCHOR_Y - resized.height)
    frame.alpha_composite(resized, (paste_x, paste_y))
    frame.save(path)


def make_preview(paths: list[Path], out: Path, scale: int = 1) -> None:
    frames = [Image.open(path).convert("RGBA") for path in paths]
    w, h = frames[0].size
    sheet = Image.new("RGBA", (w * len(frames), h), (38, 38, 38, 255))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * w, 0))
    if scale != 1:
        sheet = sheet.resize((sheet.width * scale, sheet.height * scale), Image.Resampling.NEAREST)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)


def make_focused_preview(paths: list[Path], out: Path) -> None:
    frames = [Image.open(path).convert("RGBA") for path in paths]
    boxes = [alpha_bbox(frame) for frame in frames]
    left = max(0, min(box[0] for box in boxes) - 24)
    top = max(0, min(box[1] for box in boxes) - 24)
    right = min(FRAME_W, max(box[2] for box in boxes) + 24)
    bottom = min(FRAME_H, max(box[3] for box in boxes) + 24)
    crops = [frame.crop((left, top, right, bottom)) for frame in frames]
    w, h = crops[0].size
    sheet = Image.new("RGBA", (w * len(crops), h), (38, 38, 38, 255))
    for index, crop in enumerate(crops):
        sheet.alpha_composite(crop, (index * w, 0))
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
    backup_frames()
    for path in sorted(FRAMES.glob("rock_spray_*.png")):
        if BACKUP in path.parents:
            continue
        rescale_frame(path)

    for job_id in JOB_IDS:
        paths = [FRAMES / f"{job_id}_{index:02d}.png" for index in range(1, 9)]
        missing = [path for path in paths if not path.exists()]
        if missing:
            raise FileNotFoundError(f"Missing frames for {job_id}: {missing}")
        make_preview(paths, PREVIEW / f"{job_id}_preview.png")
        make_preview(paths, PREVIEW / f"{job_id}_preview_4x.png", scale=4)
        make_focused_preview(paths, PREVIEW / f"{job_id}_focused_qa.png")
        make_gif(paths, GIF / f"{job_id}.gif")


if __name__ == "__main__":
    main()

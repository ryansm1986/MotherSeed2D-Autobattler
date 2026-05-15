from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "effects" / "motherload" / "verdant_explosion"
RAW_DIR = OUT_DIR / "raw"
FRAMES_DIR = OUT_DIR / "frames"
PREVIEW_DIR = OUT_DIR / "preview"

SOURCE_CHROMA = RAW_DIR / "verdant_explosion_imagegen_chromakey.png"
SOURCE_ALPHA = RAW_DIR / "verdant_explosion_imagegen_alpha.png"
OUTPUT_STRIP = RAW_DIR / "verdant_explosion_imagegen_8f_768x768.png"

FRAME_COUNT = 8
FRAME_SIZE = 768
TARGET_CONTENT_SIZE = 620
ALPHA_THRESHOLD = 8
SOURCE_SLOT_EDGES = [0, 173, 388, 606, 838, 1138, 1370, 1579, 1774]


def alpha_bbox(image: Image.Image, threshold: int = ALPHA_THRESHOLD) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel("A").point(lambda value: 255 if value > threshold else 0)
    return alpha.getbbox()


def split_sheet(sheet: Image.Image) -> list[Image.Image]:
    if sheet.width == SOURCE_SLOT_EDGES[-1]:
        return [
            sheet.crop((SOURCE_SLOT_EDGES[index], 0, SOURCE_SLOT_EDGES[index + 1], sheet.height))
            for index in range(FRAME_COUNT)
        ]

    slot_width = sheet.width / FRAME_COUNT
    slots: list[Image.Image] = []
    for index in range(FRAME_COUNT):
        left = int(round(index * slot_width))
        right = int(round((index + 1) * slot_width))
        slots.append(sheet.crop((left, 0, right, sheet.height)))
    return slots


def crop_slot(slot: Image.Image) -> Image.Image | None:
    bbox = alpha_bbox(slot)
    if bbox is None:
        return None
    padding = 10
    left = max(0, bbox[0] - padding)
    top = max(0, bbox[1] - padding)
    right = min(slot.width, bbox[2] + padding)
    bottom = min(slot.height, bbox[3] + padding)
    return slot.crop((left, top, right, bottom))


def normalized_frames(crops: list[Image.Image | None]) -> list[Image.Image]:
    content_sizes = [(crop.width, crop.height) for crop in crops if crop is not None]
    if not content_sizes:
        raise SystemExit("No alpha content found in generated Verdant Explosion sheet.")

    max_width = max(width for width, _ in content_sizes)
    max_height = max(height for _, height in content_sizes)
    scale = min(TARGET_CONTENT_SIZE / max(max_width, 1), TARGET_CONTENT_SIZE / max(max_height, 1))

    frames: list[Image.Image] = []
    for crop in crops:
        frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
        if crop is not None:
            width = max(1, round(crop.width * scale))
            height = max(1, round(crop.height * scale))
            resized = crop.resize((width, height), Image.Resampling.LANCZOS)
            frame.alpha_composite(resized, ((FRAME_SIZE - width) // 2, (FRAME_SIZE - height) // 2))
        frames.append(frame)
    return frames


def write_frames(frames: list[Image.Image]) -> list[Path]:
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    frame_paths: list[Path] = []
    for old_frame in FRAMES_DIR.glob("verdant_explosion_*.png"):
        old_frame.unlink()

    for index, frame in enumerate(frames, start=1):
        path = FRAMES_DIR / f"verdant_explosion_{index:02d}.png"
        frame.save(path)
        frame_paths.append(path)
    return frame_paths


def write_strip(frames: list[Image.Image]) -> None:
    strip = Image.new("RGBA", (FRAME_SIZE * FRAME_COUNT, FRAME_SIZE), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        strip.alpha_composite(frame, (index * FRAME_SIZE, 0))
    strip.save(OUTPUT_STRIP)


def paint_checkerboard(image: Image.Image, tile: int = 16) -> None:
    draw = ImageDraw.Draw(image)
    colors = ((240, 243, 246, 255), (225, 230, 235, 255))
    for top in range(0, image.height, tile):
        for left in range(0, image.width, tile):
            draw.rectangle((left, top, left + tile, top + tile), fill=colors[((left // tile) + (top // tile)) % 2])


def write_contact_sheet(frames: list[Image.Image], out_path: Path, background: tuple[int, int, int, int]) -> None:
    columns = 4
    thumb = 256
    gap = 18
    rows = math.ceil(len(frames) / columns)
    sheet = Image.new("RGBA", (columns * thumb + (columns - 1) * gap, rows * thumb + (rows - 1) * gap), background)
    if background[3] == 0:
        paint_checkerboard(sheet)

    for index, frame in enumerate(frames):
        row = index // columns
        column = index % columns
        tile = Image.new("RGBA", (thumb, thumb), background)
        if background[3] == 0:
            paint_checkerboard(tile)
        tile.alpha_composite(frame.resize((thumb, thumb), Image.Resampling.LANCZOS))
        sheet.alpha_composite(tile, (column * (thumb + gap), row * (thumb + gap)))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)


def write_gif(frames: list[Image.Image], out_path: Path) -> None:
    gif_frames: list[Image.Image] = []
    for frame in frames:
        background = Image.new("RGBA", frame.size, (28, 34, 28, 255))
        background.alpha_composite(frame)
        gif_frames.append(background.resize((256, 256), Image.Resampling.LANCZOS).convert("P", palette=Image.Palette.ADAPTIVE))
    gif_frames[0].save(out_path, save_all=True, append_images=gif_frames[1:], duration=82, loop=0, disposal=2)


def write_manifest(frame_paths: list[Path]) -> None:
    manifest = {
        "id": "motherload.verdant_explosion",
        "name": "Verdant Explosion",
        "purpose": "First Mother Load special effect: a plant-based magical explosion.",
        "source": {
            "mode": "imagegen",
            "chromaKeySource": "raw/verdant_explosion_imagegen_chromakey.png",
            "alphaSource": "raw/verdant_explosion_imagegen_alpha.png",
            "keyColor": "#ff00ff",
        },
        "frameCount": FRAME_COUNT,
        "frameSize": [FRAME_SIZE, FRAME_SIZE],
        "anchor": "center",
        "layout": "single row, 8 equal centered transparent frames",
        "animation": [
            "compact seed flash",
            "green-gold sprout burst",
            "leafy shock ring opens",
            "vines and roots erupt outward",
            "full verdant explosion",
            "bloom fade begins",
            "outer fragments decay",
            "final fading embers",
        ],
        "runtimeFrames": "frames/verdant_explosion_[0-9][0-9].png",
        "rawStrip": "raw/verdant_explosion_imagegen_8f_768x768.png",
        "previews": {
            "contactSheet": "preview/verdant_explosion_contact_sheet.png",
            "checkerSheet": "preview/verdant_explosion_checker_preview.png",
            "gif": "preview/verdant_explosion_anim.gif",
        },
        "pipeline": {
            "skill": "game-studio:sprite-pipeline",
            "steps": [
                "generated one 8-frame horizontal chroma-key sheet with imagegen",
                "removed magenta chroma key to alpha",
                "split into 8 imagegen-aware slots",
                "normalized every frame to a shared 768px center anchor",
                "rendered preview sheet and GIF",
            ],
        },
        "frames": [str(path.relative_to(OUT_DIR)).replace("\\", "/") for path in frame_paths],
    }
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    if not SOURCE_ALPHA.exists():
        raise SystemExit(f"Missing alpha sheet: {SOURCE_ALPHA}")

    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SOURCE_ALPHA).convert("RGBA")
    crops = [crop_slot(slot) for slot in split_sheet(sheet)]
    frames = normalized_frames(crops)
    frame_paths = write_frames(frames)
    write_strip(frames)
    write_contact_sheet(frames, PREVIEW_DIR / "verdant_explosion_contact_sheet.png", (31, 36, 31, 255))
    write_contact_sheet(frames, PREVIEW_DIR / "verdant_explosion_checker_preview.png", (0, 0, 0, 0))
    write_gif(frames, PREVIEW_DIR / "verdant_explosion_anim.gif")
    write_manifest(frame_paths)


if __name__ == "__main__":
    main()

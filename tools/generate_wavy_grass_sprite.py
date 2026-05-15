#!/usr/bin/env python3
"""Generate an RPGAssets-style animated grass sprite for map decoration."""

from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "world" / "grass"
FRAMES_DIR = OUT_DIR / "frames"
STYLE_PATCH = ROOT / "assets" / "world" / "terrain" / "rpg_grass_source" / "props" / "flat_grass_patch.png"

FRAME_SIZE = 64
FRAME_COUNT = 8
FRAME_DURATION_MS = 120


PALETTE = {
    "outline": (36, 54, 24, 235),
    "deep": (48, 73, 29, 255),
    "dark": (69, 101, 35, 255),
    "mid": (103, 137, 44, 255),
    "light": (143, 174, 55, 255),
    "tip": (188, 203, 75, 255),
    "flower": (220, 203, 84, 255),
    "shadow": (21, 35, 22, 120),
}


TUFTS = [
    (6, 47, 12, 0.35, 0.1),
    (11, 44, 17, 0.62, 0.6),
    (17, 45, 20, 0.82, 1.0),
    (23, 43, 15, 0.45, 1.7),
    (29, 44, 22, 0.95, 2.1),
    (35, 45, 18, 0.66, 2.8),
    (41, 43, 21, 0.84, 3.3),
    (47, 45, 16, 0.48, 3.9),
    (53, 46, 12, 0.32, 4.4),
]


GRASS_CLUSTERS = [
    (8, 51, 10, 5),
    (15, 49, 13, 7),
    (24, 50, 15, 6),
    (34, 48, 14, 7),
    (43, 50, 13, 6),
    (52, 51, 10, 5),
]


def load_style_patch() -> Image.Image | None:
    if not STYLE_PATCH.exists():
        return None
    return Image.open(STYLE_PATCH).convert("RGBA")


def draw_shadow(draw: ImageDraw.ImageDraw) -> None:
    draw.ellipse((7, 48, 58, 62), fill=PALETTE["shadow"])
    draw.rectangle((13, 54, 51, 59), fill=(31, 49, 25, 95))


def paste_source_patch(image: Image.Image, patch: Image.Image | None) -> None:
    if patch is None:
        return
    x = (FRAME_SIZE - patch.width) // 2
    y = 39
    image.alpha_composite(patch, (x, y))


def draw_jagged_mat(draw: ImageDraw.ImageDraw, phase: float) -> None:
    points: list[tuple[int, int]] = [(4, 56), (4, 50)]
    for x in range(4, 61, 3):
        wave = math.sin(phase + x * 0.31)
        notch = -2 if x % 9 == 1 else 0
        y = round(49 + wave * 1.1 + notch)
        points.append((x, y))
    points.extend([(60, 57), (42, 59), (24, 59)])
    draw.polygon(points, fill=PALETTE["deep"])

    for x, y, width, height in GRASS_CLUSTERS:
        sway = round(math.sin(phase + x * 0.24) * 2)
        draw.polygon(
            [
                (x - width // 2, y + 3),
                (x - width // 3 + sway, y - height // 2),
                (x + sway, y - height),
                (x + width // 3 + sway, y - height // 2),
                (x + width // 2, y + 3),
            ],
            fill=PALETTE["dark"],
        )
        draw.line((x - width // 3, y - 1, x + sway, y - height + 1), fill=PALETTE["light"], width=2)
        draw.point((x + sway, y - height), fill=PALETTE["tip"])


def draw_pixel_tuft(draw: ImageDraw.ImageDraw, x: int, y: int, height: int, strength: float, phase_offset: float, phase: float) -> None:
    sway = math.sin(phase + phase_offset) * strength * 5.4
    top_x = round(x + sway)
    mid_x = round(x + sway * 0.55)
    tip_y = y - height
    mid_y = y - round(height * 0.58)

    silhouette = [
        (x - 3, y + 2),
        (x - 2, y - 4),
        (mid_x - 2, mid_y),
        (top_x, tip_y),
        (mid_x + 3, mid_y + 2),
        (x + 4, y + 2),
    ]
    draw.polygon(silhouette, fill=PALETTE["outline"])

    core = [
        (x - 2, y + 1),
        (x - 1, y - 5),
        (mid_x - 1, mid_y + 1),
        (top_x, tip_y + 2),
        (mid_x + 2, mid_y + 2),
        (x + 2, y + 1),
    ]
    draw.polygon(core, fill=PALETTE["mid"])

    draw.line((x - 1, y - 3, mid_x, mid_y + 1, top_x, tip_y + 3), fill=PALETTE["light"], width=2)
    if height > 15:
        draw.line((x + 2, y - 1, mid_x + 2, mid_y + 4), fill=PALETTE["dark"], width=2)
    draw.point((top_x, tip_y + 1), fill=PALETTE["tip"])


def draw_micro_clusters(draw: ImageDraw.ImageDraw, phase: float) -> None:
    for index, x in enumerate(range(8, 57, 6)):
        y = 50 + (index % 3)
        offset = round(math.sin(phase * 0.8 + index) * 1.5)
        color = PALETTE["light"] if index % 2 else PALETTE["mid"]
        draw.line((x, y, x + offset, y - 6), fill=PALETTE["outline"], width=2)
        draw.line((x, y, x + offset, y - 6), fill=color, width=1)

    for index, (x, y) in enumerate(((14, 45), (32, 42), (49, 46))):
        bob = round(math.sin(phase + index * 1.9) * 1)
        draw.point((x, y + bob), fill=PALETTE["flower"])
        draw.point((x + 1, y + bob), fill=PALETTE["tip"])


def draw_frame(frame_index: int, patch: Image.Image | None) -> Image.Image:
    image = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    phase = (frame_index / FRAME_COUNT) * math.tau

    draw_shadow(draw)
    draw_jagged_mat(draw, phase)

    for x, y, height, strength, phase_offset in TUFTS:
        draw_pixel_tuft(draw, x, y, height, strength, phase_offset, phase)

    paste_source_patch(image, patch)
    draw = ImageDraw.Draw(image, "RGBA")
    draw_micro_clusters(draw, phase)

    return image


def save_strip(frames: list[Image.Image], path: Path) -> None:
    strip = Image.new("RGBA", (FRAME_SIZE * len(frames), FRAME_SIZE), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        strip.alpha_composite(frame, (index * FRAME_SIZE, 0))
    strip.save(path)


def save_metadata(path: Path) -> None:
    metadata = {
        "name": "wavy_grass",
        "type": "animated_map_decoration",
        "style": "RPGAssets grass source matched",
        "styleSource": "../terrain/rpg_grass_source/props/flat_grass_patch.png",
        "image": "wavy_grass_8x64.png",
        "frameSize": {"w": FRAME_SIZE, "h": FRAME_SIZE},
        "frames": FRAME_COUNT,
        "frameDurationMs": FRAME_DURATION_MS,
        "loop": True,
        "anchor": {"x": 32, "y": 57, "mode": "bottom-center"},
        "usage": {
            "recommendedDrawScale": 1.0,
            "collision": "none",
            "ySortOffset": 0,
            "placement": "paint as an animated decorative overlay on RPGAssets grass tiles",
        },
        "framesDirectory": "frames",
    }
    path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)

    patch = load_style_patch()
    frames = [draw_frame(index, patch) for index in range(FRAME_COUNT)]
    for index, frame in enumerate(frames, start=1):
        frame.save(FRAMES_DIR / f"wavy_grass_{index:02d}.png")

    save_strip(frames, OUT_DIR / "wavy_grass_8x64.png")
    frames[0].save(
        OUT_DIR / "wavy_grass_preview.gif",
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATION_MS,
        loop=0,
        disposal=2,
    )
    save_metadata(OUT_DIR / "wavy_grass_8x64.json")


if __name__ == "__main__":
    main()

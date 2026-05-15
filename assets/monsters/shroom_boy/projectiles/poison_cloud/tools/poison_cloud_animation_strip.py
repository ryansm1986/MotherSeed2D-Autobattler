from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "base.png"
RAW_DIR = ROOT / "raw"
FRAME_DIR = ROOT / "frames"
PREVIEW_DIR = ROOT / "preview"
GIF_DIR = ROOT / "gif"
QA_DIR = ROOT / "qa"

FRAME_COUNT = 8
FRAME_SIZE = 1254
WORK_SIZE = 209
SCALE = FRAME_SIZE // WORK_SIZE
KEY = (255, 0, 255)

PALETTE = {
    "outline": (176, 163, 72, 215),
    "deep": (194, 181, 82, 230),
    "mid": (221, 214, 104, 242),
    "light": (244, 240, 140, 250),
    "hot": (255, 253, 182, 255),
    "spore": (255, 246, 112, 255),
}


PUFFS = [
    (93, 57, 22), (111, 57, 22),
    (73, 70, 19), (97, 73, 25), (124, 72, 19),
    (57, 88, 21), (80, 89, 25), (107, 91, 25), (132, 91, 22), (151, 94, 19),
    (45, 110, 22), (68, 112, 27), (96, 113, 31), (127, 113, 27), (154, 116, 22),
    (50, 135, 22), (75, 137, 25), (104, 137, 29), (132, 137, 24), (159, 139, 21),
    (68, 159, 20), (93, 160, 23), (119, 160, 23), (143, 158, 20),
]

SPORES = [
    (40, 68, 3), (67, 39, 2), (98, 30, 3), (132, 41, 3), (166, 65, 3),
    (28, 96, 2), (181, 100, 2), (32, 142, 3), (174, 147, 3),
    (53, 177, 2), (104, 188, 3), (151, 181, 2),
    (17, 118, 2), (193, 128, 2), (126, 23, 2), (80, 192, 2),
]


def ensure_dirs() -> None:
    for path in (RAW_DIR, FRAME_DIR, PREVIEW_DIR, GIF_DIR, QA_DIR):
        path.mkdir(parents=True, exist_ok=True)


def pixel_circle(draw: ImageDraw.ImageDraw, cx: float, cy: float, radius: float, fill: tuple[int, int, int, int]) -> None:
    left = round(cx - radius)
    right = round(cx + radius)
    top = round(cy - radius)
    bottom = round(cy + radius)
    rr = radius * radius
    for y in range(top, bottom + 1):
        for x in range(left, right + 1):
            if (x - cx) * (x - cx) + (y - cy) * (y - cy) <= rr:
                draw.point((x, y), fill=fill)


def pixel_blob(draw: ImageDraw.ImageDraw, cx: float, cy: float, rx: float, ry: float, fill: tuple[int, int, int, int]) -> None:
    left = round(cx - rx)
    right = round(cx + rx)
    top = round(cy - ry)
    bottom = round(cy + ry)
    for y in range(top, bottom + 1):
        for x in range(left, right + 1):
            nx = (x - cx) / max(rx, 1)
            ny = (y - cy) / max(ry, 1)
            if nx * nx + ny * ny <= 1:
                draw.point((x, y), fill=fill)


def draw_round_spore(draw: ImageDraw.ImageDraw, cx: float, cy: float, size: int, alpha: int) -> None:
    shadow = PALETTE["deep"][:3] + (max(80, alpha - 70),)
    color = PALETTE["spore"][:3] + (alpha,)
    hot = PALETTE["hot"][:3] + (min(255, alpha + 28),)
    radius = max(1, size)
    pixel_circle(draw, cx + 1, cy + 1, radius + 1, shadow)
    pixel_circle(draw, cx, cy, radius, color)
    if radius >= 2:
        pixel_circle(draw, cx - radius * 0.28, cy - radius * 0.32, max(1, radius * 0.42), hot)
    else:
        draw.point((round(cx), round(cy)), fill=hot)


def draw_new_frame(index: int) -> Image.Image:
    t = index / FRAME_COUNT
    rng = random.Random(4108 + index * 97)
    phase = t * math.tau
    image = Image.new("RGBA", (WORK_SIZE, WORK_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    breathe = math.sin(phase)
    center_x = WORK_SIZE / 2 + 1.5 * math.sin(phase + 0.6)
    center_y = WORK_SIZE / 2 + 2.5 * math.sin(phase + 1.4)

    ordered_puffs = sorted(PUFFS, key=lambda item: item[1])
    for puff_index, (base_x, base_y, base_r) in enumerate(ordered_puffs):
        local = phase + puff_index * 0.71
        dx = base_x - WORK_SIZE / 2
        dy = base_y - WORK_SIZE / 2
        push = 1.0 + 0.035 * math.sin(local)
        cx = center_x + dx * push + 1.2 * math.sin(local * 0.9)
        cy = center_y + dy * (1.0 + 0.025 * math.cos(local)) + 1.0 * math.cos(local * 1.1)
        rx = base_r * (1.0 + 0.04 * breathe + 0.05 * math.sin(local))
        ry = base_r * (0.92 - 0.025 * breathe + 0.04 * math.cos(local))

        pixel_blob(draw, cx + 2, cy + 3, rx + 2, ry + 2, PALETTE["outline"])
        pixel_blob(draw, cx, cy, rx, ry, PALETTE["deep"])
        pixel_blob(draw, cx - 1, cy - 1, rx * 0.88, ry * 0.84, PALETTE["mid"])
        pixel_blob(draw, cx - rx * 0.18, cy - ry * 0.24, rx * 0.48, ry * 0.38, PALETTE["light"])

        if puff_index % 2 == index % 3:
            pixel_blob(draw, cx - rx * 0.24, cy - ry * 0.33, max(2, rx * 0.18), max(2, ry * 0.12), PALETTE["hot"])

        # A few blocky cut-ins keep the cloud clustered like the source instead of looking airbrushed.
        if puff_index % 4 == 0:
            notch = PALETTE["deep"][:3] + (90,)
            draw.rectangle(
                (
                    round(cx + rx * 0.25),
                    round(cy + ry * 0.12),
                    round(cx + rx * 0.48),
                    round(cy + ry * 0.36),
                ),
                fill=notch,
            )

    for spore_index, (base_x, base_y, size) in enumerate(SPORES):
        local = phase + spore_index * 0.58
        dx = base_x - WORK_SIZE / 2
        dy = base_y - WORK_SIZE / 2
        outward = 1.0 + 0.07 * ((index + spore_index % 3) / FRAME_COUNT)
        cx = WORK_SIZE / 2 + dx * outward + 4.5 * math.sin(local)
        cy = WORK_SIZE / 2 + dy * outward - 5.5 * t + 3.5 * math.cos(local * 1.2)
        alpha = round(170 + 70 * ((math.sin(local * 1.4) + 1) / 2))
        draw_round_spore(draw, cx, cy, size, alpha)

    # Newly emitted spores appear close to the rounded cloud body on alternating frames.
    for burst in range(5):
        angle = phase * 0.65 + burst * math.tau / 5 + rng.uniform(-0.12, 0.12)
        radius = 59 + rng.uniform(-7, 9)
        cx = WORK_SIZE / 2 + math.cos(angle) * radius
        cy = WORK_SIZE / 2 + math.sin(angle) * radius - 2
        draw_round_spore(draw, cx, cy, 1 + (burst + index) % 2, 150 + burst * 18)

    return image.resize((FRAME_SIZE, FRAME_SIZE), Image.Resampling.NEAREST)


def save_chromakey_copy(rgba: Image.Image, out: Path) -> None:
    keyed = Image.new("RGBA", rgba.size, KEY + (255,))
    keyed.alpha_composite(rgba)
    keyed.convert("RGB").save(out)


def main() -> None:
    ensure_dirs()

    frames = [draw_new_frame(i) for i in range(FRAME_COUNT)]
    strip = Image.new("RGBA", (FRAME_SIZE * FRAME_COUNT, FRAME_SIZE), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        frame.save(FRAME_DIR / f"poison_cloud_{index + 1:02}.png")
        strip.alpha_composite(frame, (index * FRAME_SIZE, 0))

    strip.save(RAW_DIR / "poison_cloud_strip.png")
    save_chromakey_copy(strip, RAW_DIR / "poison_cloud_strip_chromakey.png")

    preview_frames = [
        frame.resize((251, 251), Image.Resampling.NEAREST)
        for frame in frames
    ]
    preview = Image.new("RGBA", (251 * FRAME_COUNT, 251), (0, 0, 0, 0))
    for index, frame in enumerate(preview_frames):
        preview.alpha_composite(frame, (index * 251, 0))
    preview.save(PREVIEW_DIR / "poison_cloud_preview.png")

    gif_frames = [
        frame.resize((256, 256), Image.Resampling.NEAREST)
        for frame in frames
    ]
    gif_frames[0].save(
        GIF_DIR / "poison_cloud.gif",
        save_all=True,
        append_images=gif_frames[1:],
        duration=90,
        loop=0,
        disposal=2,
    )

    (QA_DIR / "poison_cloud_qa.md").write_text(
        "\n".join(
            [
                "# QA: poison_cloud",
                "",
                "Skill: $game-studio:sprite-pipeline",
                "Projectile: poison_cloud",
                f"Frame count: {FRAME_COUNT}",
                f"Style source: {BASE}",
                "",
                "## Result",
                "",
                "- Regenerated as newly drawn pixel-art frames, not transformed copies of `base.png`.",
                "- `base.png` was used only for style intent: rounded circular yellow poison cloud, chunky puff silhouette, and loose spores.",
                "- Each frame is freshly composed from rounded puff clusters with subtle breathing motion and drifting spore positions.",
                "- Frames share the original 1254x1254 canvas and export as one horizontal transparent strip.",
                "",
                "## Outputs",
                "",
                f"- Strip: {RAW_DIR / 'poison_cloud_strip.png'}",
                f"- Chroma-key strip: {RAW_DIR / 'poison_cloud_strip_chromakey.png'}",
                f"- Frames: {FRAME_DIR / 'poison_cloud_01.png'} through {FRAME_DIR / 'poison_cloud_08.png'}",
                f"- Preview: {PREVIEW_DIR / 'poison_cloud_preview.png'}",
                f"- GIF: {GIF_DIR / 'poison_cloud.gif'}",
            ]
        )
        + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()

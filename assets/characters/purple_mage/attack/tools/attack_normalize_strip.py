from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


FRAME_COUNT = 6
FRAME_SIZE = 128
ANCHOR_Y = 126


def is_chroma_green(r: int, g: int, b: int, a: int) -> bool:
    if a == 0:
        return True
    green_score = g - max(r, b)
    return g >= 90 and green_score > 35 and g > r * 1.18 and g > b * 1.18


def make_alpha_source(img: Image.Image) -> tuple[Image.Image, Image.Image, list[tuple[int, int]]]:
    img = img.convert("RGBA")
    width, height = img.size
    pixels = img.load()
    alpha = Image.new("L", img.size, 0)
    alpha_pixels = alpha.load()
    col_counts = [0] * width

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if not is_chroma_green(r, g, b, a):
                alpha_pixels[x, y] = 255
                col_counts[x] += 1

    runs: list[tuple[int, int]] = []
    in_run = False
    start = 0
    for x, count in enumerate(col_counts):
        if count > 8 and not in_run:
            start = x
            in_run = True
        elif (count <= 8 or x == width - 1) and in_run:
            end = x if count <= 8 else x + 1
            if end - start > 20:
                runs.append((start, end))
            in_run = False

    merged: list[tuple[int, int]] = []
    for run in runs:
        if merged and run[0] - merged[-1][1] < 24:
            merged[-1] = (merged[-1][0], run[1])
        else:
            merged.append(run)

    runs = sorted(merged, key=lambda run: run[1] - run[0], reverse=True)[:FRAME_COUNT]
    runs.sort()
    if len(runs) != FRAME_COUNT:
        raise SystemExit(f"Expected {FRAME_COUNT} sprite groups, found {len(runs)}: {runs}")

    rgba = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out_pixels = rgba.load()
    for y in range(height):
        for x in range(width):
            if alpha_pixels[x, y] == 255:
                r, g, b, _a = pixels[x, y]
                if g > max(r, b) + 18 and g > 70:
                    g = min(g, max(r, b) + 6)
                out_pixels[x, y] = (r, g, b, 255)
    return rgba, alpha, runs


def resize_premultiplied(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    arr = np.array(img.convert("RGBA")).astype("float32")
    alpha = arr[:, :, 3:4] / 255.0
    arr[:, :, :3] *= alpha
    premul = Image.fromarray(arr.clip(0, 255).astype("uint8"), "RGBA").resize(
        size, Image.Resampling.LANCZOS
    )
    resized = np.array(premul).astype("float32")
    a = resized[:, :, 3]
    mask = a > 0
    resized[:, :, :3][mask] = resized[:, :, :3][mask] * 255.0 / a[mask, None]
    return Image.fromarray(resized.clip(0, 255).astype("uint8"), "RGBA")


def normalize_strip(source: Path, direction: str, attack_dir: Path) -> dict[str, str]:
    raw_dir = attack_dir / "raw"
    frames_dir = attack_dir / "frames"
    preview_dir = attack_dir / "preview"
    gif_dir = attack_dir / "gif"
    for folder in (raw_dir, frames_dir, preview_dir, gif_dir):
        folder.mkdir(parents=True, exist_ok=True)

    source_strip = raw_dir / f"attack_{direction}_6frame_staff_tip_blue_green_strip.png"
    source_original = raw_dir / f"attack_{direction}_6frame_staff_tip_blue_green_strip_original.png"
    if source.resolve() != source_original.resolve():
        source_original.write_bytes(source.read_bytes())
    source_strip.write_bytes(source.read_bytes())

    img = Image.open(source).convert("RGBA")
    rgba, alpha, runs = make_alpha_source(img)
    alpha_strip = raw_dir / f"attack_{direction}_6frame_staff_tip_blue_alpha_strip.png"
    raw_alpha = raw_dir / f"attack_{direction}_raw.png"
    rgba.save(alpha_strip)
    rgba.save(raw_alpha)

    crops: list[Image.Image] = []
    width, height = img.size
    for sx, ex in runs:
        x0 = max(0, sx - 10)
        x1 = min(width, ex + 10)
        bbox = alpha.crop((x0, 0, x1, height)).getbbox()
        if bbox is None:
            raise SystemExit(f"No visible pixels in group {sx}-{ex}")
        bx0, by0, bx1, by1 = bbox
        crop_box = (
            max(0, x0 + bx0 - 4),
            max(0, by0 - 4),
            min(width, x0 + bx1 + 4),
            min(height, by1 + 4),
        )
        crops.append(rgba.crop(crop_box))

    max_w = max(crop.size[0] for crop in crops)
    max_h = max(crop.size[1] for crop in crops)
    scale = min(116 / max_w, 124 / max_h)

    frames: list[Image.Image] = []
    for idx, crop in enumerate(crops, 1):
        new_w = max(1, round(crop.size[0] * scale))
        new_h = max(1, round(crop.size[1] * scale))
        resized = resize_premultiplied(crop, (new_w, new_h)).copy()
        pixels = resized.load()
        for y in range(new_h):
            for x in range(new_w):
                r, g, b, a = pixels[x, y]
                if a <= 6:
                    pixels[x, y] = (0, 0, 0, 0)
                elif g > max(r, b) + 18 and g > 70 and a < 245:
                    pixels[x, y] = (r, min(g, max(r, b) + 6), b, a)

        frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
        frame.alpha_composite(resized, ((FRAME_SIZE - new_w) // 2, ANCHOR_Y - new_h))
        frame_path = frames_dir / f"attack_{direction}_{idx:02d}.png"
        frame.save(frame_path)
        frames.append(frame)

    normalized_strip = raw_dir / f"attack_{direction}_normalized_strip.png"
    strip = Image.new("RGBA", (FRAME_SIZE * FRAME_COUNT, FRAME_SIZE), (0, 0, 0, 0))
    for idx, frame in enumerate(frames):
        strip.alpha_composite(frame, (idx * FRAME_SIZE, 0))
    strip.save(normalized_strip)

    preview = Image.new(
        "RGBA",
        (FRAME_SIZE * FRAME_COUNT + 8 * (FRAME_COUNT - 1), FRAME_SIZE),
        (60, 60, 60, 255),
    )
    for idx, frame in enumerate(frames):
        preview.alpha_composite(frame, (idx * (FRAME_SIZE + 8), 0))
    preview_path = preview_dir / f"attack_{direction}_preview.png"
    preview_4x_path = preview_dir / f"attack_{direction}_preview_4x.png"
    preview.save(preview_path)
    preview.resize((preview.width * 4, preview.height * 4), Image.Resampling.NEAREST).save(preview_4x_path)

    green_preview = Image.new("RGBA", (FRAME_SIZE * FRAME_COUNT, FRAME_SIZE), (0, 255, 0, 255))
    for idx, frame in enumerate(frames):
        green_preview.alpha_composite(frame, (idx * FRAME_SIZE, 0))
    green_preview_path = preview_dir / f"attack_{direction}_green_preview_4x.png"
    green_preview.resize((green_preview.width * 4, green_preview.height * 4), Image.Resampling.NEAREST).save(
        green_preview_path
    )

    gif_path = gif_dir / f"attack_{direction}.gif"
    frames[0].save(gif_path, save_all=True, append_images=frames[1:], duration=110, loop=0, disposal=2)

    return {
        "raw": str(raw_alpha),
        "normalized": str(normalized_strip),
        "preview": str(preview_path),
        "preview_4x": str(preview_4x_path),
        "green_preview_4x": str(green_preview_path),
        "gif": str(gif_path),
        "runs": str(runs),
        "scale": f"{scale:.6f}",
    }


def write_qa(direction: str, attack_dir: Path, base_sources: str) -> None:
    qa_dir = attack_dir / "qa"
    qa_dir.mkdir(parents=True, exist_ok=True)
    path = qa_dir / f"attack_{direction}_qa.md"
    path.write_text(
        f"""# attack_{direction} QA

- Source strip: `assets/characters/purple_mage/attack/raw/attack_{direction}_6frame_staff_tip_blue_green_strip.png`
- Alpha strip: `assets/characters/purple_mage/attack/raw/attack_{direction}_raw.png`
- Normalized strip: `assets/characters/purple_mage/attack/raw/attack_{direction}_normalized_strip.png`
- Normalized frames: `assets/characters/purple_mage/attack/frames/attack_{direction}_01.png` through `attack_{direction}_06.png`
- Preview: `assets/characters/purple_mage/attack/preview/attack_{direction}_preview.png`
- 4x preview: `assets/characters/purple_mage/attack/preview/attack_{direction}_preview_4x.png`
- Green 4x preview: `assets/characters/purple_mage/attack/preview/attack_{direction}_green_preview_4x.png`
- GIF: `assets/characters/purple_mage/attack/gif/attack_{direction}.gif`
- Mapped base source(s): `{base_sources}`
- Local tool: `assets/characters/purple_mage/attack/tools/attack_normalize_strip.py`

Checks performed:

- Six {direction}-facing staff attack frames exported at 128x128 RGBA.
- Staff lowers to about hip height, blue effect appears only at the staff tip, then disappears before the return pose.
- No projectile, loose spell bolt, scenery, labels, or extra external spell effects are intended in this animation.
- Shared max crop scale and bottom anchor used for stable frame registration.
- Green chroma background removed from normalized frames, then edge despill and premultiplied-alpha resizing were applied to prevent green fringe pixels on sprite edges.
""",
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--direction", required=True)
    parser.add_argument("--attack-dir", default=Path(__file__).resolve().parents[1], type=Path)
    parser.add_argument("--base-sources", required=True)
    args = parser.parse_args()

    result = normalize_strip(args.source, args.direction, args.attack_dir)
    write_qa(args.direction, args.attack_dir, args.base_sources)
    for key, value in result.items():
        print(f"{key}={value}")


if __name__ == "__main__":
    main()

from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "Monsters.png"
OUT_DIR = ROOT / "assets" / "monsters" / "moss_golem"

FRAME_W = 224
FRAME_H = 128
ANCHOR = {"x": FRAME_W // 2, "y": 116, "type": "bottom-center"}
DIRECTIONS = ("down", "left", "right", "up")


# Broad source slots around the Moss Golem region. Each slot is intentionally
# wider than the visible sprite so cleanup can trim naturally while keeping
# large slam effects and flying rocks intact.
SOURCE_WINDOWS: dict[str, dict[str, list[tuple[int, int, int, int]]]] = {
    "down": {
        "idle": [(258, 766, 68, 64), (330, 766, 66, 64), (400, 766, 64, 64)],
        "walk": [(496, 766, 70, 66), (562, 766, 88, 66), (634, 766, 70, 66), (704, 766, 70, 66)],
        "run": [(808, 766, 76, 66), (880, 766, 72, 66), (948, 766, 94, 66), (1018, 766, 70, 66)],
        "attack": [(1098, 766, 94, 68), (1168, 766, 120, 68), (1284, 766, 220, 68), (1284, 766, 220, 68)],
    },
    "left": {
        "idle": [(266, 832, 58, 58), (338, 832, 56, 58), (408, 832, 56, 58)],
        "walk": [(496, 832, 68, 58), (564, 832, 68, 58), (634, 832, 68, 58), (704, 832, 68, 58)],
        "run": [(808, 832, 76, 58), (878, 832, 78, 58), (946, 832, 100, 58), (1018, 832, 72, 58)],
        "attack": [(1098, 832, 94, 60), (1168, 832, 120, 60), (1284, 832, 220, 60), (1284, 832, 220, 60)],
    },
    "right": {
        "idle": [(266, 894, 58, 58), (338, 894, 58, 58), (408, 894, 58, 58)],
        "walk": [(496, 894, 68, 58), (564, 894, 68, 58), (634, 894, 68, 58), (704, 894, 68, 58)],
        "run": [(808, 894, 76, 58), (878, 894, 78, 58), (946, 894, 100, 58), (1018, 894, 72, 58)],
        "attack": [(1098, 894, 94, 60), (1168, 894, 120, 60), (1284, 894, 220, 60), (1284, 894, 220, 60)],
    },
    "up": {
        "idle": [(248, 956, 86, 68), (320, 956, 86, 68), (390, 956, 86, 68)],
        "walk": [(496, 956, 70, 68), (562, 956, 72, 68), (632, 956, 70, 68), (702, 956, 72, 68)],
        "run": [(808, 956, 76, 68), (878, 956, 72, 68), (952, 956, 58, 68), (1018, 956, 68, 68)],
        "attack": [(1098, 956, 94, 68), (1168, 956, 124, 68), (1098, 956, 94, 68), (1168, 956, 124, 68)],
    },
}


def remove_edge_fragments(image: Image.Image) -> None:
    alpha = image.getchannel("A")
    pixels = alpha.load()
    rgba = image.load()
    visited: set[tuple[int, int]] = set()

    for y in range(image.height):
        for x in range(image.width):
            if pixels[x, y] == 0 or (x, y) in visited:
                continue

            stack = [(x, y)]
            visited.add((x, y))
            component: list[tuple[int, int]] = []
            min_x = max_x = x
            min_y = max_y = y

            while stack:
                px, py = stack.pop()
                component.append((px, py))
                min_x = min(min_x, px)
                min_y = min(min_y, py)
                max_x = max(max_x, px)
                max_y = max(max_y, py)

                for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    if nx < 0 or ny < 0 or nx >= image.width or ny >= image.height:
                        continue
                    if pixels[nx, ny] == 0 or (nx, ny) in visited:
                        continue
                    visited.add((nx, ny))
                    stack.append((nx, ny))

            touches_edge = min_x == 0 or min_y == 0 or max_x == image.width - 1 or max_y == image.height - 1
            if touches_edge and len(component) < 360:
                for px, py in component:
                    r, g, b, _ = rgba[px, py]
                    rgba[px, py] = (r, g, b, 0)


def remove_white_and_trim(image: Image.Image) -> tuple[Image.Image, tuple[int, int, int, int]]:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    min_x = rgba.width
    min_y = rgba.height
    max_x = -1
    max_y = -1

    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if r > 242 and g > 242 and b > 242:
                pixels[x, y] = (255, 255, 255, 0)
                continue
            if a:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    remove_edge_fragments(rgba)

    pixels = rgba.load()
    min_x = rgba.width
    min_y = rgba.height
    max_x = -1
    max_y = -1
    for y in range(rgba.height):
        for x in range(rgba.width):
            if pixels[x, y][3]:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    if max_x < min_x or max_y < min_y:
        return rgba, (0, 0, rgba.width, rgba.height)

    padding = 2
    box = (
        max(0, min_x - padding),
        max(0, min_y - padding),
        min(rgba.width, max_x + 1 + padding),
        min(rgba.height, max_y + 1 + padding),
    )
    return rgba.crop(box), box


def normalize_frame(trimmed: Image.Image) -> tuple[Image.Image, dict[str, int]]:
    frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    x = (FRAME_W - trimmed.width) // 2
    y = ANCHOR["y"] - trimmed.height

    if x < 0 or y < 0:
        raise ValueError(f"Frame content {trimmed.size} does not fit {FRAME_W}x{FRAME_H}")

    frame.alpha_composite(trimmed, (x, y))
    return frame, {"x": x, "y": y, "w": trimmed.width, "h": trimmed.height}


def render_preview(frames: list[Image.Image], labels: list[str], out: Path, columns: int) -> None:
    cell_w = FRAME_W
    cell_h = FRAME_H + 18
    rows = (len(frames) + columns - 1) // columns
    preview = Image.new("RGBA", (columns * cell_w, rows * cell_h), (30, 38, 32, 255))
    draw = ImageDraw.Draw(preview)

    for index, frame in enumerate(frames):
        x = (index % columns) * cell_w
        y = (index // columns) * cell_h
        preview.alpha_composite(frame, (x, y + 18))
        draw.text((x + 6, y + 3), labels[index], fill=(226, 236, 204, 255))

    preview.save(out)


def main() -> None:
    sheet = Image.open(SOURCE).convert("RGBA")

    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)

    (OUT_DIR / "source").mkdir(parents=True)
    sheet.crop((0, 730, sheet.width, sheet.height)).save(OUT_DIR / "source" / "moss_golem_source_region.png")

    reference, _ = remove_white_and_trim(sheet.crop((28, 804, 154, 982)))
    reference.save(OUT_DIR / "source" / "moss_golem_reference.png")

    all_preview_frames: list[Image.Image] = []
    all_preview_labels: list[str] = []
    manifest: dict[str, object] = {
        "monster": "moss_golem",
        "source": str(SOURCE),
        "frameWidth": FRAME_W,
        "frameHeight": FRAME_H,
        "anchor": ANCHOR,
        "directions": list(DIRECTIONS),
        "animations": {},
    }

    for animation in ("idle", "walk", "run", "attack"):
        anim_dir = OUT_DIR / animation
        frames_dir = anim_dir / "frames"
        frames_dir.mkdir(parents=True)

        animation_frames: list[Image.Image] = []
        animation_labels: list[str] = []
        animation_meta: dict[str, list[dict[str, object]]] = {}
        frame_count = max(len(SOURCE_WINDOWS[direction][animation]) for direction in DIRECTIONS)

        sheet_image = Image.new("RGBA", (FRAME_W * frame_count, FRAME_H * len(DIRECTIONS)), (0, 0, 0, 0))

        for row, direction in enumerate(DIRECTIONS):
            entries: list[dict[str, object]] = []
            for frame_index, source_rect in enumerate(SOURCE_WINDOWS[direction][animation], start=1):
                sx, sy, sw, sh = source_rect
                trimmed, trim_box = remove_white_and_trim(sheet.crop((sx, sy, sx + sw, sy + sh)))
                frame, placement = normalize_frame(trimmed)
                filename = f"{animation}_{direction}_{frame_index:02d}.png"
                frame.save(frames_dir / filename)
                sheet_image.alpha_composite(frame, ((frame_index - 1) * FRAME_W, row * FRAME_H))

                meta = {
                    "frame": frame_index - 1,
                    "file": f"frames/{filename}",
                    "sourceRect": [sx, sy, sw, sh],
                    "trimBox": list(trim_box),
                    "placement": placement,
                }
                entries.append(meta)
                animation_frames.append(frame)
                animation_labels.append(f"{direction} {frame_index}")
                all_preview_frames.append(frame)
                all_preview_labels.append(f"{animation} {direction} {frame_index}")

            animation_meta[direction] = entries

        sheet_name = f"moss_golem_{animation}_4dir_{FRAME_W}x{FRAME_H}.png"
        sheet_image.save(anim_dir / sheet_name)
        render_preview(animation_frames, animation_labels, anim_dir / f"moss_golem_{animation}_preview.png", frame_count)

        data = {
            "monster": "moss_golem",
            "animation": animation,
            "image": sheet_name,
            "frameWidth": FRAME_W,
            "frameHeight": FRAME_H,
            "sheetWidth": sheet_image.width,
            "sheetHeight": sheet_image.height,
            "columns": frame_count,
            "rows": len(DIRECTIONS),
            "directions": list(DIRECTIONS),
            "rowOrder": {direction: index for index, direction in enumerate(DIRECTIONS)},
            "source": str(SOURCE),
            "anchor": ANCHOR,
            "normalization": {
                "background": "white source sheet pixels above rgb(242,242,242) converted to alpha",
                "placement": "trimmed content centered horizontally and bottom-aligned to anchor.y",
                "monsterScale": "exported on 192x128 frames so Moss Golem remains larger than player sprites",
            },
            "frames": animation_meta,
        }
        (anim_dir / f"moss_golem_{animation}_4dir_{FRAME_W}x{FRAME_H}.json").write_text(
            json.dumps(data, indent=2),
            encoding="utf-8",
        )
        manifest["animations"][animation] = {
            "sheet": f"{animation}/{sheet_name}",
            "metadata": f"{animation}/moss_golem_{animation}_4dir_{FRAME_W}x{FRAME_H}.json",
            "frames": sum(len(items) for items in animation_meta.values()),
        }

    render_preview(all_preview_frames, all_preview_labels, OUT_DIR / "moss_golem_all_preview.png", 8)
    (OUT_DIR / "moss_golem_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()

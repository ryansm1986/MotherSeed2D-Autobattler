from __future__ import annotations

import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
IDLE_SOURCE = ROOT / "assets" / "characters" / "green_mage" / "source" / "green_mage_idle_source_magenta.png"
SPELLCAST_SOURCE = ROOT / "assets" / "characters" / "green_mage" / "source" / "green_mage_spellcast_source_magenta.png"
SPECIAL_SPELLCAST_SOURCE = ROOT / "assets" / "characters" / "green_mage" / "source" / "green_mage_special_spellcast_source_magenta.png"
WALK_SOURCE = ROOT / "assets" / "characters" / "green_mage" / "source" / "green_mage_walk_source_magenta.png"
SPRINT_SOURCE = ROOT / "assets" / "characters" / "green_mage" / "source" / "green_mage_sprint_source_magenta.png"
CHAR_DIR = ROOT / "assets" / "characters" / "green_mage"

FRAME = 64
SHEET = 1024
COLUMNS = 16
ROWS = 16
DIRECTIONS = ["south", "west", "east", "north"]
FRAME_SOURCE_ORDER = [0, 1, 2, 3, 2]


def is_magenta_bg(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a == 0 or (r > 185 and g < 115 and b > 170)


def source_components(img: Image.Image, expected_cols: int) -> list[tuple[int, int, int, int]]:
    w, h = img.size
    pix = img.load()
    mask = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            if not is_magenta_bg(pix[x, y]):
                mask[y * w + x] = 1

    def projection_intervals(counts: list[int], threshold: int, min_gap: int, min_width: int) -> list[tuple[int, int]]:
        raw: list[tuple[int, int]] = []
        start: int | None = None
        for index, count in enumerate(counts):
            if count > threshold and start is None:
                start = index
            elif count <= threshold and start is not None:
                raw.append((start, index))
                start = None
        if start is not None:
            raw.append((start, len(counts)))

        merged: list[tuple[int, int]] = []
        for start, end in raw:
            if end - start < min_width:
                continue
            if merged and start - merged[-1][1] <= min_gap:
                merged[-1] = (merged[-1][0], end)
            else:
                merged.append((start, end))
        return merged

    row_counts = [sum(mask[y * w + x] for x in range(w)) for y in range(h)]
    row_intervals = projection_intervals(row_counts, threshold=12, min_gap=28, min_width=38)
    if len(row_intervals) >= 4:
        row_intervals = sorted(row_intervals, key=lambda interval: interval[0])[:4]
        boxes: list[tuple[int, int, int, int]] = []
        for y0, y1 in row_intervals:
            x_counts = [sum(mask[y * w + x] for y in range(y0, y1)) for x in range(w)]
            col_intervals = projection_intervals(x_counts, threshold=6, min_gap=22, min_width=28)
            if len(col_intervals) < expected_cols:
                break
            col_intervals = sorted(col_intervals, key=lambda interval: interval[0])[:expected_cols]
            for x0, x1 in col_intervals:
                xs: list[int] = []
                ys: list[int] = []
                for yy in range(y0, y1):
                    for xx in range(x0, x1):
                        if mask[yy * w + xx]:
                            xs.append(xx)
                            ys.append(yy)
                if xs and ys:
                    boxes.append((min(xs), min(ys), max(xs) + 1, max(ys) + 1))
        if len(boxes) == expected_cols * 4:
            return boxes

    seen = bytearray(w * h)
    boxes: list[tuple[int, int, int, int, int]] = []
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if not mask[i] or seen[i]:
                continue
            queue = deque([(x, y)])
            seen[i] = 1
            min_x = max_x = x
            min_y = max_y = y
            count = 0
            while queue:
                cx, cy = queue.pop()
                count += 1
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        ni = ny * w + nx
                        if mask[ni] and not seen[ni]:
                            seen[ni] = 1
                            queue.append((nx, ny))
            if count > 100:
                boxes.append((min_x, min_y, max_x + 1, max_y + 1, count))

    expected = expected_cols * 4
    if len(boxes) < expected:
        raise RuntimeError(f"Expected at least {expected} mage sprites, found {len(boxes)}")

    boxes = sorted(boxes, key=lambda box: (box[1], box[0]))[:expected]
    rows = [sorted(boxes[i : i + expected_cols], key=lambda box: box[0]) for i in range(0, expected, expected_cols)]
    return [(x0, y0, x1, y1) for row in rows for x0, y0, x1, y1, _ in row]


def transparent_crop(img: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    pad = 3
    x0, y0, x1, y1 = box
    crop = img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad))).convert("RGBA")
    pix = crop.load()
    for y in range(crop.height):
        for x in range(crop.width):
            if is_magenta_bg(pix[x, y]):
                pix[x, y] = (0, 0, 0, 0)
    return crop


def normalize_sprite(sprite: Image.Image) -> Image.Image:
    bbox = sprite.getbbox()
    if bbox is None:
        return Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    sprite = sprite.crop(bbox)
    scale = min(54 / sprite.width, 58 / sprite.height)
    size = (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale)))
    sprite = sprite.resize(size, Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    x = (FRAME - sprite.width) // 2
    y = 60 - sprite.height
    frame.alpha_composite(sprite, (x, y))
    return frame


def alpha_bbox(img: Image.Image) -> tuple[int, int, int, int]:
    bbox = img.getchannel("A").getbbox()
    if bbox is None:
        return (0, 0, 0, 0)
    return bbox


def staff_side(direction: str) -> str:
    return "right" if direction == "east" else "left"


def find_crystal(img: Image.Image, direction: str) -> tuple[int, int, int, int]:
    pix = img.load()
    candidates: list[tuple[int, int]] = []
    side = staff_side(direction)
    for y in range(0, 38):
        for x in range(FRAME):
            r, g, b, a = pix[x, y]
            if a > 0 and g > 175 and b > 70 and r < 180 and g > r + 40 and g > b + 20:
                if (side == "left" and x < 34) or (side == "right" and x > 30):
                    candidates.append((x, y))
    if not candidates:
        x0, y0, x1, _ = alpha_bbox(img)
        return (x0, y0, min(x0 + 10, FRAME), min(y0 + 14, FRAME))
    xs = [x for x, _ in candidates]
    ys = [y for _, y in candidates]
    return (min(xs), min(ys), max(xs) + 1, max(ys) + 1)


def is_staff_pixel(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a == 0:
        return False
    crystal = g > 175 and b > 70 and r < 200 and g > r + 35 and g > b + 20
    wood_or_purple = (45 <= r <= 170 and g < 115 and 30 <= b <= 155 and (r > g + 15 or b > g + 15))
    staff_outline = r < 55 and g < 55 and b < 80
    hand = r > 175 and 105 <= g <= 190 and 55 <= b <= 145
    return crystal or wood_or_purple or staff_outline or hand


def extract_staff(img: Image.Image, direction: str) -> tuple[Image.Image, tuple[int, int]]:
    crystal = find_crystal(img, direction)
    bbox = alpha_bbox(img)
    side = staff_side(direction)
    if side == "left":
        x0 = max(0, crystal[0] - 8)
        x1 = min(FRAME, crystal[2] + 8)
    else:
        x0 = max(0, crystal[0] - 8)
        x1 = min(FRAME, crystal[2] + 8)
    y0 = max(0, crystal[1] - 4)
    y1 = min(FRAME, bbox[3])
    staff = img.crop((x0, y0, x1, y1)).copy()
    pix = staff.load()
    for y in range(staff.height):
        for x in range(staff.width):
            if not is_staff_pixel(pix[x, y]):
                pix[x, y] = (0, 0, 0, 0)
    return staff, (x0, y0)


def erase_staff(img: Image.Image, staff: Image.Image, origin: tuple[int, int]) -> None:
    pix = img.load()
    spix = staff.load()
    ox, oy = origin
    for y in range(staff.height):
        for x in range(staff.width):
            if spix[x, y][3] > 0:
                tx = ox + x
                ty = oy + y
                if 0 <= tx < FRAME and 0 <= ty < FRAME:
                    pix[tx, ty] = (0, 0, 0, 0)


def nudge_body(img: Image.Image, direction: str, frame_index: int) -> Image.Image:
    offsets = {
        "south": [(0, 0), (0, 0), (1, 0), (1, 0), (0, 0)],
        "west": [(0, 0), (1, 0), (-1, 0), (-1, 0), (0, 0)],
        "east": [(0, 0), (-1, 0), (1, 0), (1, 0), (0, 0)],
        "north": [(0, 0), (0, 0), (0, -1), (0, -1), (0, 0)],
    }
    dx, dy = offsets[direction][frame_index]
    moved = Image.new("RGBA", img.size, (0, 0, 0, 0))
    moved.alpha_composite(img, (dx, dy))
    return moved


def make_spellcast_frame(idle: Image.Image, direction: str, frame_index: int) -> Image.Image:
    staff, origin = extract_staff(idle, direction)
    base = idle.copy()
    erase_staff(base, staff, origin)
    base = nudge_body(base, direction, frame_index)

    side = staff_side(direction)
    outward = -1 if side == "left" else 1
    lift = [0, -4, -9, -5, -1][frame_index]
    reach_by_direction = {
        "south": [0, -1, -2, -1, 0],
        "west": [0, -2, -5, -3, -1],
        "east": [0, 2, 5, 3, 1],
        "north": [0, -1, -2, -1, 0],
    }
    dx = reach_by_direction[direction][frame_index]
    dy = lift
    angle = 0

    staff_variant = staff.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True, fillcolor=(0, 0, 0, 0))
    spix = staff_variant.load()
    for y in range(staff_variant.height):
        for x in range(staff_variant.width):
            r, g, b, a = spix[x, y]
            if a < 18:
                spix[x, y] = (0, 0, 0, 0)
    px = origin[0] + dx - (staff_variant.width - staff.width) // 2
    py = origin[1] + dy - (staff_variant.height - staff.height) // 2
    base.alpha_composite(staff_variant, (px, py))

    draw = ImageDraw.Draw(base)
    hand_y = min(55, max(34, origin[1] + staff.height // 2 + lift // 2))
    if side == "left":
        hand_x = max(2, origin[0] + staff.width - 7 + dx)
    else:
        hand_x = min(58, origin[0] + 3 + dx)
    # A tiny reused-palette hand cue makes the cast read without adding spell VFX.
    draw.rectangle((hand_x, hand_y, hand_x + 4, hand_y + 4), fill=(37, 24, 22, 255))
    draw.rectangle((hand_x + 1, hand_y + 1, hand_x + 3, hand_y + 3), fill=(235, 190, 123, 255))

    return base


def make_preview(frames: dict[str, list[Image.Image]], out: Path) -> None:
    scale = 3
    gap = 6
    preview = Image.new("RGBA", (5 * FRAME * scale + 4 * gap, 4 * FRAME * scale + 3 * gap), (28, 31, 33, 255))
    for row, direction in enumerate(DIRECTIONS):
        for col, frame in enumerate(frames[direction]):
            tile = frame.resize((FRAME * scale, FRAME * scale), Image.Resampling.NEAREST)
            x = col * (FRAME * scale + gap)
            y = row * (FRAME * scale + gap)
            checker = Image.new("RGBA", tile.size, (0, 0, 0, 0))
            cd = ImageDraw.Draw(checker)
            for yy in range(0, tile.height, 8):
                for xx in range(0, tile.width, 8):
                    color = (72, 76, 80, 255) if (xx // 8 + yy // 8) % 2 == 0 else (54, 58, 62, 255)
                    cd.rectangle((xx, yy, xx + 7, yy + 7), fill=color)
            preview.alpha_composite(checker, (x, y))
            preview.alpha_composite(tile, (x, y))
    out.parent.mkdir(parents=True, exist_ok=True)
    preview.save(out)


def write_animation(animation: str, frames: dict[str, list[Image.Image]], note: str, source: Path, source_frame_order: list[int]) -> None:
    out_dir = CHAR_DIR / animation
    frames_dir = out_dir / "frames"
    out_dir.mkdir(parents=True, exist_ok=True)
    frames_dir.mkdir(parents=True, exist_ok=True)
    sheet = Image.new("RGBA", (SHEET, SHEET), (0, 0, 0, 0))

    manifest: dict[str, object] = {
        "character": "green_mage",
        "animation": animation,
        "image": f"green_mage_{animation}_4dir_64.png",
        "frameWidth": FRAME,
        "frameHeight": FRAME,
        "sheetWidth": SHEET,
        "sheetHeight": SHEET,
        "columns": COLUMNS,
        "rows": ROWS,
        "directions": DIRECTIONS,
        "rowOrder": {direction: index for index, direction in enumerate(DIRECTIONS)},
        "source": str(source),
        "anchor": {"x": 32, "y": 60, "type": "bottom-center"},
        "normalization": {
            "sourceBackground": "magenta chroma key removed",
            "sourceFrameOrder": source_frame_order,
            "emptySlots": "transparent",
            "note": note,
        },
        "animations": {},
    }

    for row, direction in enumerate(DIRECTIONS):
        entries = []
        for col, frame in enumerate(frames[direction]):
            x = col * FRAME
            y = row * FRAME
            sheet.alpha_composite(frame, (x, y))
            frame_name = f"{animation}_{direction}_{col + 1:02}.png"
            frame.save(frames_dir / frame_name)
            entries.append({"frame": col, "x": x, "y": y, "w": FRAME, "h": FRAME, "file": f"frames/{frame_name}"})
        manifest["animations"][f"{animation}_{direction}"] = entries

    sheet.save(out_dir / f"green_mage_{animation}_4dir_64.png")
    make_preview(frames, out_dir / f"green_mage_{animation}_4dir_64_preview.png")
    with (out_dir / f"green_mage_{animation}_4dir_64.json").open("w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
        fh.write("\n")


def main() -> None:
    src = Image.open(IDLE_SOURCE).convert("RGBA")
    boxes = source_components(src, expected_cols=4)
    idle_frames: dict[str, list[Image.Image]] = {}
    for direction_index, direction in enumerate(DIRECTIONS):
        row_frames = []
        for col in FRAME_SOURCE_ORDER:
            box = boxes[direction_index * 4 + col]
            row_frames.append(normalize_sprite(transparent_crop(src, box)))
        idle_frames[direction] = row_frames

    write_animation("idle", idle_frames, "extracted from approved magenta-background mage sheet", IDLE_SOURCE, FRAME_SOURCE_ORDER)

    walk_src = Image.open(WALK_SOURCE).convert("RGBA")
    walk_boxes = source_components(walk_src, expected_cols=5)
    walk: dict[str, list[Image.Image]] = {}
    for direction_index, direction in enumerate(DIRECTIONS):
        row_frames = []
        for col in range(5):
            box = walk_boxes[direction_index * 5 + col]
            row_frames.append(normalize_sprite(transparent_crop(walk_src, box)))
        walk[direction] = row_frames
    write_animation(
        "walk",
        walk,
        "generated from the approved mage reference as a 5-frame walking loop",
        WALK_SOURCE,
        [0, 1, 2, 3, 4],
    )

    sprint_src = Image.open(SPRINT_SOURCE).convert("RGBA")
    sprint_boxes = source_components(sprint_src, expected_cols=5)
    sprint: dict[str, list[Image.Image]] = {}
    for direction_index, direction in enumerate(DIRECTIONS):
        row_frames = []
        for col in range(5):
            box = sprint_boxes[direction_index * 5 + col]
            row_frames.append(normalize_sprite(transparent_crop(sprint_src, box)))
        sprint[direction] = row_frames
    write_animation(
        "sprint",
        sprint,
        "generated from the approved mage reference as a 5-frame sprint loop",
        SPRINT_SOURCE,
        [0, 1, 2, 3, 4],
    )

    cast_src = Image.open(SPELLCAST_SOURCE).convert("RGBA")
    cast_boxes = source_components(cast_src, expected_cols=5)
    spellcast: dict[str, list[Image.Image]] = {}
    for direction_index, direction in enumerate(DIRECTIONS):
        row_frames = []
        for col in range(5):
            box = cast_boxes[direction_index * 5 + col]
            row_frames.append(normalize_sprite(transparent_crop(cast_src, box)))
        spellcast[direction] = row_frames
    write_animation("spellcast", spellcast, "generated from the approved mage reference; no projectile or spell effect", SPELLCAST_SOURCE, [0, 1, 2, 3, 4])

    special_src = Image.open(SPECIAL_SPELLCAST_SOURCE).convert("RGBA")
    special_boxes = source_components(special_src, expected_cols=5)
    special_spellcast: dict[str, list[Image.Image]] = {}
    for direction_index, direction in enumerate(DIRECTIONS):
        row_frames = []
        for col in range(5):
            box = special_boxes[direction_index * 5 + col]
            row_frames.append(normalize_sprite(transparent_crop(special_src, box)))
        special_spellcast[direction] = row_frames
    write_animation(
        "special_spellcast",
        special_spellcast,
        "generated from the approved mage reference with glow and power-up; no projectile",
        SPECIAL_SPELLCAST_SOURCE,
        [0, 1, 2, 3, 4],
    )


if __name__ == "__main__":
    main()

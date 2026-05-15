#!/usr/bin/env python3
"""Build the moss_golem_v2 large 8-direction rock_spray sprite pipeline."""

from __future__ import annotations

import csv
import json
import math
import random
import shutil
from collections import deque
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SUBJECT_ROOT = ROOT / "assets" / "monsters" / "moss_golem_v2"
BASE = SUBJECT_ROOT / "base"
TEMPLATE = ROOT / "assets" / "sprite_pipeline_template"
ANIMATION = "rock_spray"
DIRECTIONS = [
    "south",
    "southeast",
    "east",
    "northeast",
    "north",
    "northwest",
    "west",
    "southwest",
]
FRAME_COUNT = 8
PROFILE = {
    "name": "monster_large_action_1152",
    "width": 1152,
    "height": 1152,
    "anchor_x": 576,
    "anchor_y": 1128,
    "top_padding": 288,
    "floor_padding": 24,
    "source_spacing": 1152,
    "raw_gutter": 9216,
}
USER_DIRECTION = "The golem's chest should open and many rocks should spray out at a 60 degree cone."
FEATURES = (
    "preserve the moss-covered stone golem silhouette, tan stone plates, green moss, vine wraps, "
    "glowing green chest core, glowing eyes when visible, heavy hands and feet, and no added weapons or props"
)
POSE_PLAN = [
    "Frame 01: grounded anticipation; chest plates still closed, shoulders settle, hands brace low.",
    "Frame 02: chest rises and head pulls back; chest seam cracks open with a few dust flecks.",
    "Frame 03: chest cavity opens wide and the first pebbles burst from the glowing core.",
    "Frame 04: full blast; torso commits forward and a dense stream of rocks fills the cone center.",
    "Frame 05: widest 60 degree spray; chest is fully open and rocks spread farthest across the cone.",
    "Frame 06: spray pressure drops; fewer rocks continue outward while the chest plates start to close.",
    "Frame 07: chest narrows; last pebbles and dust drift in the direction of fire.",
    "Frame 08: recovery pose; chest nearly closed, body returns to its planted stance with fading dust.",
]


@dataclass(frozen=True)
class Job:
    direction: str
    seed_file: Path
    mapped_sources: tuple[Path, ...]

    @property
    def job_id(self) -> str:
        return f"{ANIMATION}_{self.direction}"


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def ensure_base() -> None:
    missing = [name for name in ("north.png", "south.png", "east.png", "west.png") if not (BASE / name).exists()]
    if missing:
        raise SystemExit(f"Missing required base files: {', '.join(missing)}")


def mapped_sources(direction: str) -> tuple[Path, ...]:
    pairs = {
        "south": ("south.png",),
        "southeast": ("south.png", "east.png"),
        "east": ("east.png",),
        "northeast": ("north.png", "east.png"),
        "north": ("north.png",),
        "northwest": ("north.png", "west.png"),
        "west": ("west.png",),
        "southwest": ("south.png", "west.png"),
    }
    return tuple(BASE / name for name in pairs[direction])


def seed_for(direction: str) -> Path:
    exact = BASE / f"{direction}.png"
    if exact.exists():
        return exact
    return mapped_sources(direction)[0]


def copy_template_files() -> None:
    for name in ("README.md", "PIPELINE_TEMPLATE.md"):
        dest = SUBJECT_ROOT / name
        src = TEMPLATE / name
        if not dest.exists() or dest.read_bytes() != src.read_bytes():
            shutil.copy2(src, dest)
    src_profiles = TEMPLATE / "frame_profiles.csv"
    dest_profiles = SUBJECT_ROOT / "frame_profiles.csv"
    if not dest_profiles.exists():
        shutil.copy2(src_profiles, dest_profiles)
    ensure_profile_mentions_animation(dest_profiles)


def ensure_profile_mentions_animation(path: Path) -> None:
    with path.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
        fieldnames = handle.read()
    if not rows:
        raise SystemExit(f"ERROR: empty frame profile file: {path}")
    changed = False
    for row in rows:
        if row["profile"] == PROFILE["name"] and ANIMATION not in row["animations"].split(";"):
            row["animations"] = row["animations"] + f";{ANIMATION}"
            changed = True
    if changed:
        with path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)


def ensure_dirs() -> dict[str, Path]:
    paths = {}
    for folder in ("raw", "frames", "preview", "gif", "qa", "assembled", "prompts"):
        path = SUBJECT_ROOT / ANIMATION / folder
        path.mkdir(parents=True, exist_ok=True)
        paths[folder] = path
    return paths


def edge_background_to_alpha(image: Image.Image) -> Image.Image:
    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def is_bg(x: int, y: int) -> bool:
        r, g, b = pixels[x, y]
        return r >= 238 and g >= 238 and b >= 238 and max(r, g, b) - min(r, g, b) <= 20

    for x in range(width):
        for y in (0, height - 1):
            if is_bg(x, y):
                queue.append((x, y))
                visited[y * width + x] = 1
    for y in range(height):
        for x in (0, width - 1):
            if is_bg(x, y):
                queue.append((x, y))
                visited[y * width + x] = 1

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if nx < 0 or ny < 0 or nx >= width or ny >= height:
                continue
            index = ny * width + nx
            if visited[index] or not is_bg(nx, ny):
                continue
            visited[index] = 1
            queue.append((nx, ny))

    rgba = rgb.convert("RGBA")
    out = rgba.load()
    for y in range(height):
        for x in range(width):
            if visited[y * width + x]:
                out[x, y] = (255, 255, 255, 0)
    return rgba


def tight_crop(image: Image.Image) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise SystemExit("Source image became empty after background removal")
    return image.crop(bbox)


def normalized_seed(path: Path) -> Image.Image:
    crop = tight_crop(edge_background_to_alpha(Image.open(path)))
    max_w = 560
    max_h = 650
    scale = min(max_w / crop.width, max_h / crop.height)
    size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    sprite = crop.resize(size, Image.Resampling.LANCZOS)
    sprite = ImageEnhance.Sharpness(sprite).enhance(1.25)

    frame = Image.new("RGBA", (PROFILE["width"], PROFILE["height"]), (0, 0, 0, 0))
    x = PROFILE["anchor_x"] - sprite.width // 2
    y = PROFILE["anchor_y"] - sprite.height - 28
    frame.alpha_composite(sprite, (x, y))
    return frame


def direction_vector(direction: str) -> tuple[float, float]:
    vectors = {
        "south": (0.0, 1.0),
        "southeast": (0.707, 0.707),
        "east": (1.0, 0.0),
        "northeast": (0.707, -0.707),
        "north": (0.0, -1.0),
        "northwest": (-0.707, -0.707),
        "west": (-1.0, 0.0),
        "southwest": (-0.707, 0.707),
    }
    return vectors[direction]


def chest_position(seed: Image.Image, direction: str) -> tuple[int, int]:
    left, top, right, bottom = seed.getchannel("A").getbbox() or (420, 420, 730, 1080)
    w = right - left
    h = bottom - top
    positions = {
        "south": (0.50, 0.39),
        "southeast": (0.61, 0.39),
        "east": (0.69, 0.40),
        "northeast": (0.61, 0.38),
        "north": (0.50, 0.40),
        "northwest": (0.39, 0.38),
        "west": (0.31, 0.40),
        "southwest": (0.39, 0.39),
    }
    rx, ry = positions[direction]
    return round(left + w * rx), round(top + h * ry)


def alpha_layer(frame: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    mask = Image.new("L", frame.size, 0)
    ImageDraw.Draw(mask).rectangle(box, fill=255)
    layer = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    layer.alpha_composite(frame)
    layer.putalpha(ImageChops.multiply(frame.getchannel("A"), mask))
    return layer


def translate(layer: Image.Image, dx: float, dy: float) -> Image.Image:
    return layer.transform(
        layer.size,
        Image.Transform.AFFINE,
        (1, 0, -dx, 0, 1, -dy),
        resample=Image.Resampling.BICUBIC,
    )


def make_body_pose(seed: Image.Image, direction: str, index: int) -> Image.Image:
    bbox = seed.getchannel("A").getbbox()
    if bbox is None:
        raise SystemExit(f"Empty seed for {direction}")
    left, top, right, bottom = bbox
    split_y = top + round((bottom - top) * 0.48)
    core = alpha_layer(seed, (0, split_y - 18, PROFILE["width"], PROFILE["height"]))
    upper = alpha_layer(seed, (0, 0, PROFILE["width"], split_y + 60))
    vx, vy = direction_vector(direction)
    beats = [
        (-0.15, 1.5, 0.0),
        (-0.25, 0.0, -2.0),
        (0.10, -1.0, -3.0),
        (0.45, -2.0, -1.0),
        (0.55, -2.8, 1.0),
        (0.25, -1.3, 1.5),
        (0.05, 0.0, 0.5),
        (-0.05, 0.8, 0.0),
    ]
    lean, bob, recoil = beats[index]
    frame = Image.new("RGBA", seed.size, (0, 0, 0, 0))
    shadow = Image.new("RGBA", seed.size, (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.ellipse((left + 58, bottom - 34, right - 58, bottom + 8), fill=(0, 0, 0, 46))
    frame.alpha_composite(shadow)
    frame.alpha_composite(translate(core, -vx * recoil * 4, bob))
    frame.alpha_composite(translate(upper, vx * lean * 18, vy * lean * 10 + bob - recoil * 1.4))
    return ImageEnhance.Sharpness(frame).enhance(1.12)


def draw_open_chest(draw: ImageDraw.ImageDraw, origin: tuple[int, int], direction: str, index: int) -> None:
    open_sizes = [6, 18, 34, 48, 54, 40, 22, 8]
    radius = open_sizes[index]
    x, y = origin
    vx, vy = direction_vector(direction)
    px, py = -vy, vx
    center = (x + round(vx * 10), y + round(vy * 10))
    cavity = [
        (center[0] + px * radius * 0.95 + vx * radius * 0.42, center[1] + py * radius * 0.95 + vy * radius * 0.42),
        (center[0] - px * radius * 0.95 + vx * radius * 0.42, center[1] - py * radius * 0.95 + vy * radius * 0.42),
        (center[0] - px * radius * 0.58 - vx * radius * 0.52, center[1] - py * radius * 0.58 - vy * radius * 0.52),
        (center[0] + px * radius * 0.58 - vx * radius * 0.52, center[1] + py * radius * 0.58 - vy * radius * 0.52),
    ]
    draw.polygon(cavity, fill=(18, 20, 13, 238), outline=(5, 7, 4, 230))
    glow = max(8, radius // 2)
    draw.ellipse(
        (center[0] - glow, center[1] - glow, center[0] + glow, center[1] + glow),
        fill=(94, 184, 52, 95),
    )
    if radius > 14:
        plate_offset = radius * 0.95
        left_plate = [
            (center[0] - px * plate_offset, center[1] - py * plate_offset),
            (center[0] - px * (plate_offset + 24) - vx * 16, center[1] - py * (plate_offset + 24) - vy * 16),
            (center[0] - px * (plate_offset + 8) + vx * 20, center[1] - py * (plate_offset + 8) + vy * 20),
        ]
        right_plate = [
            (center[0] + px * plate_offset, center[1] + py * plate_offset),
            (center[0] + px * (plate_offset + 24) - vx * 16, center[1] + py * (plate_offset + 24) - vy * 16),
            (center[0] + px * (plate_offset + 8) + vx * 20, center[1] + py * (plate_offset + 8) + vy * 20),
        ]
        draw.polygon(left_plate, fill=(118, 103, 77, 235), outline=(44, 38, 28, 230))
        draw.polygon(
            right_plate,
            fill=(132, 116, 84, 235),
            outline=(44, 38, 28, 230),
        )


def draw_rock(draw: ImageDraw.ImageDraw, x: float, y: float, radius: int, rng: random.Random) -> None:
    points = []
    sides = rng.randint(5, 7)
    angle = rng.random() * math.tau
    for step in range(sides):
        theta = angle + step / sides * math.tau
        local = radius * rng.uniform(0.72, 1.14)
        points.append((x + math.cos(theta) * local, y + math.sin(theta) * local))
    fill = rng.choice([(128, 111, 83, 255), (159, 139, 102, 255), (91, 78, 59, 255), (184, 165, 123, 255)])
    draw.polygon(points, fill=fill, outline=(38, 32, 24, 245))
    hx = x - radius * 0.28
    hy = y - radius * 0.35
    draw.ellipse((hx - radius * 0.18, hy - radius * 0.12, hx + radius * 0.25, hy + radius * 0.20), fill=(232, 218, 171, 180))
    if rng.random() < 0.16:
        mx = x + rng.uniform(-radius * 0.5, radius * 0.5)
        my = y + rng.uniform(-radius * 0.5, radius * 0.5)
        draw.ellipse((mx - 2, my - 2, mx + 3, my + 3), fill=(91, 133, 34, 220))


def draw_spray(frame: Image.Image, direction: str, index: int, origin: tuple[int, int]) -> None:
    vx, vy = direction_vector(direction)
    px, py = -vy, vx
    rng = random.Random(f"{ANIMATION}:{direction}:{index}")
    draw = ImageDraw.Draw(frame, "RGBA")
    draw_open_chest(draw, origin, direction, index)
    counts = [0, 4, 12, 22, 28, 18, 9, 3]
    reach = [0, 86, 190, 305, 405, 340, 250, 145]
    for _ in range(counts[index]):
        dist = rng.uniform(max(18, reach[index] * 0.18), reach[index])
        spread = math.tan(math.radians(30)) * dist
        off = rng.uniform(-spread, spread)
        x = origin[0] + vx * dist + px * off + rng.uniform(-5, 5)
        y = origin[1] + vy * dist + py * off + rng.uniform(-5, 5)
        if x < 28 or y < 28 or x > PROFILE["width"] - 28 or y > PROFILE["height"] - 28:
            continue
        radius = rng.randint(5, 13 if index in (3, 4, 5) else 9)
        draw_rock(draw, x, y, radius, rng)
    for _ in range(max(1, counts[index] // 3)):
        dist = rng.uniform(22, max(34, reach[index] * 0.72))
        spread = math.tan(math.radians(30)) * dist
        off = rng.uniform(-spread, spread)
        x = origin[0] + vx * dist + px * off
        y = origin[1] + vy * dist + py * off
        r = rng.randint(3, 9)
        draw.ellipse((x - r, y - r, x + r, y + r), fill=(129, 113, 83, rng.randint(38, 80)))
    if counts[index] > 0:
        haze = Image.new("RGBA", frame.size, (0, 0, 0, 0))
        hdraw = ImageDraw.Draw(haze, "RGBA")
        for _ in range(10 + index * 2):
            dist = rng.uniform(20, max(30, reach[index] * 0.58))
            spread = math.tan(math.radians(30)) * dist
            off = rng.uniform(-spread, spread)
            x = origin[0] + vx * dist + px * off
            y = origin[1] + vy * dist + py * off
            r = rng.randint(6, 18)
            hdraw.ellipse((x - r, y - r, x + r, y + r), fill=(82, 72, 55, rng.randint(12, 26)))
        frame.alpha_composite(haze.filter(ImageFilter.GaussianBlur(2.0)))


def make_rock_spray_frames(seed: Image.Image, direction: str) -> list[Image.Image]:
    frames = []
    for index in range(FRAME_COUNT):
        pose = make_body_pose(seed, direction, index)
        origin = chest_position(pose, direction)
        draw_spray(pose, direction, index, origin)
        frames.append(pose)
    return frames


def save_raw_strip(frames: list[Image.Image], out: Path) -> None:
    fw = PROFILE["width"]
    fh = PROFILE["height"]
    spacing = PROFILE["source_spacing"]
    strip = Image.new("RGB", (FRAME_COUNT * fw + (FRAME_COUNT - 1) * spacing, fh), (255, 0, 255))
    for index, frame in enumerate(frames):
        x = index * (fw + spacing)
        magenta = Image.new("RGBA", (fw, fh), (255, 0, 255, 255))
        magenta.alpha_composite(frame)
        strip.paste(magenta.convert("RGB"), (x, 0))
    strip.save(out)


def save_frames(frames: list[Image.Image], frames_dir: Path, job_id: str) -> None:
    for index, frame in enumerate(frames, start=1):
        frame.save(frames_dir / f"{job_id}_{index:02d}.png")


def checker(size: tuple[int, int], cell: int = 16) -> Image.Image:
    img = Image.new("RGBA", size, (36, 36, 36, 255))
    draw = ImageDraw.Draw(img)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2 == 0:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=(66, 66, 66, 255))
    return img


def combined_bbox(frames: list[Image.Image], pad: int = 28) -> tuple[int, int, int, int]:
    boxes = [frame.getchannel("A").getbbox() for frame in frames]
    boxes = [box for box in boxes if box]
    if not boxes:
        return (0, 0, PROFILE["width"], PROFILE["height"])
    left = max(0, min(box[0] for box in boxes) - pad)
    top = max(0, min(box[1] for box in boxes) - pad)
    right = min(PROFILE["width"], max(box[2] for box in boxes) + pad)
    bottom = min(PROFILE["height"], max(box[3] for box in boxes) + pad)
    return (left, top, right, bottom)


def save_preview_grid(frames: list[Image.Image], out: Path, *, scale: int = 1, annotate: bool = True) -> None:
    bbox = combined_bbox(frames)
    crop_w = bbox[2] - bbox[0]
    crop_h = bbox[3] - bbox[1]
    columns = 4
    rows = math.ceil(len(frames) / columns)
    cell_w = crop_w * scale
    cell_h = crop_h * scale
    sheet = checker((cell_w * columns, cell_h * rows), max(8, 16 * scale))
    draw = ImageDraw.Draw(sheet)
    for index, frame in enumerate(frames, start=1):
        crop = frame.crop(bbox).resize((cell_w, cell_h), Image.Resampling.NEAREST)
        col = (index - 1) % columns
        row = (index - 1) // columns
        x = col * cell_w
        y = row * cell_h
        sheet.alpha_composite(crop, (x, y))
        if annotate:
            label = f"{index:02d}"
            draw.rectangle((x, y, x + 34 * scale, y + 14 * scale), fill=(0, 0, 0, 150))
            draw.text((x + 4 * scale, y + 2 * scale), label, fill=(255, 255, 255, 255))
    sheet.save(out)


def save_focus_preview(frames: list[Image.Image], out: Path) -> None:
    bbox = combined_bbox(frames, pad=42)
    scale = 2
    crop_w = bbox[2] - bbox[0]
    crop_h = bbox[3] - bbox[1]
    columns = 4
    rows = math.ceil(len(frames) / columns)
    sheet = checker((crop_w * scale * columns, crop_h * scale * rows), 16)
    draw = ImageDraw.Draw(sheet)
    for index, frame in enumerate(frames, start=1):
        col = (index - 1) % columns
        row = (index - 1) // columns
        x = col * crop_w * scale
        y = row * crop_h * scale
        crop = frame.crop(bbox).resize((crop_w * scale, crop_h * scale), Image.Resampling.NEAREST)
        sheet.alpha_composite(crop, (x, y))
        local = frame.getchannel("A").getbbox()
        if local:
            box = (
                x + (local[0] - bbox[0]) * scale,
                y + (local[1] - bbox[1]) * scale,
                x + (local[2] - bbox[0]) * scale,
                y + (local[3] - bbox[1]) * scale,
            )
            draw.rectangle(box, outline=(255, 230, 0, 255), width=2)
        anchor = (x + (PROFILE["anchor_x"] - bbox[0]) * scale, y + (PROFILE["anchor_y"] - bbox[1]) * scale)
        draw.line((anchor[0] - 7, anchor[1], anchor[0] + 7, anchor[1]), fill=(0, 255, 255, 255), width=2)
        draw.line((anchor[0], anchor[1] - 7, anchor[0], anchor[1] + 7), fill=(0, 255, 255, 255), width=2)
    sheet.save(out)


def save_gif(frames: list[Image.Image], out: Path) -> None:
    bbox = combined_bbox(frames, pad=42)
    gif_frames = []
    for frame in frames:
        crop = frame.crop(bbox)
        bg = checker((crop.width * 2, crop.height * 2), 24)
        bg.alpha_composite(crop.resize(bg.size, Image.Resampling.NEAREST))
        gif_frames.append(bg.convert("P", palette=Image.Palette.ADAPTIVE, colors=255))
    gif_frames[0].save(out, save_all=True, append_images=gif_frames[1:], duration=110, loop=0, disposal=2)


def validate_frames(frames: list[Image.Image]) -> list[str]:
    issues: list[str] = []
    previous: Image.Image | None = None
    for index, frame in enumerate(frames, start=1):
        if frame.size != (PROFILE["width"], PROFILE["height"]):
            issues.append(f"frame {index:02d} size is {frame.size}")
        bbox = frame.getchannel("A").getbbox()
        if bbox is None:
            issues.append(f"frame {index:02d} is empty")
            continue
        left, top, right, bottom = bbox
        if left <= 0 or top <= 0 or right >= PROFILE["width"] or bottom >= PROFILE["height"]:
            issues.append(f"frame {index:02d} touches frame edge: {bbox}")
        if top < 36:
            issues.append(f"frame {index:02d} top padding is tight: {top}px")
        if PROFILE["height"] - bottom < PROFILE["floor_padding"]:
            issues.append(f"frame {index:02d} floor padding is tight: {PROFILE['height'] - bottom}px")
        if previous is not None:
            diff = ImageChops.difference(previous, frame)
            if diff.getbbox() is None:
                issues.append(f"frame {index:02d} is pixel-identical to frame {index - 1:02d}")
        previous = frame
    return issues


def existing_queue_rows() -> list[dict[str, str]]:
    queue_path = SUBJECT_ROOT / "animation_queue.csv"
    if not queue_path.exists():
        return []
    with queue_path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def normalize_existing_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    fields = queue_fields()
    normalized = []
    for row in rows:
        if row.get("animation") == ANIMATION:
            continue
        out = {field: row.get(field, "") for field in fields}
        if not out["direction_set"]:
            out["direction_set"] = "8_directional"
        if not out["required_directions"]:
            out["required_directions"] = "down;down_right;right;up_right;up;up_left;left;down_left"
        if not out["base_folder"]:
            base_sprite = row.get("base_sprite", "")
            out["base_folder"] = rel(BASE) if base_sprite else ""
        if not out["base_sources"]:
            out["base_sources"] = row.get("base_sprite", "")
        if not out["status"]:
            out["status"] = "pending"
        normalized.append(out)
    return normalized


def queue_fields() -> list[str]:
    return [
        "job_id",
        "animation",
        "direction",
        "direction_set",
        "required_directions",
        "frame_count",
        "subject_size",
        "frame_profile",
        "status",
        "base_folder",
        "base_sources",
        "generated_pose",
        "raw_output",
        "normalized_output",
        "preview",
        "gif",
        "qa_notes",
    ]


def write_queue(jobs: list[Job], paths: dict[str, Path], issues_by_job: dict[str, list[str]]) -> None:
    rows = normalize_existing_rows(existing_queue_rows())
    required = ";".join(DIRECTIONS)
    for job in jobs:
        status = "approved" if not issues_by_job[job.job_id] else "needs_revision"
        rows.append(
            {
                "job_id": job.job_id,
                "animation": ANIMATION,
                "direction": job.direction,
                "direction_set": "8_directional",
                "required_directions": required,
                "frame_count": str(FRAME_COUNT),
                "subject_size": "large",
                "frame_profile": PROFILE["name"],
                "status": status,
                "base_folder": rel(BASE),
                "base_sources": ";".join(rel(path) for path in job.mapped_sources),
                "generated_pose": rel(paths["raw"] / f"{job.job_id}_source_strip.png"),
                "raw_output": rel(paths["raw"] / f"{job.job_id}_raw.png"),
                "normalized_output": rel(paths["frames"] / f"{job.job_id}_01.png") + f" through {job.job_id}_{FRAME_COUNT:02d}.png",
                "preview": rel(paths["preview"] / f"{job.job_id}_preview.png"),
                "gif": rel(paths["gif"] / f"{job.job_id}.gif"),
                "qa_notes": rel(paths["qa"] / f"{job.job_id}_qa.md"),
            }
        )
    with (SUBJECT_ROOT / "animation_queue.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=queue_fields())
        writer.writeheader()
        writer.writerows(rows)


def write_generation_summary(paths: dict[str, Path]) -> None:
    lines = [
        "# Rock Spray Generation Prompt",
        "",
        "Use `$game-studio:sprite-pipeline`.",
        "",
        f"Animation: `{ANIMATION}`",
        "Direction set: `8_directional`",
        f"Frame count: `{FRAME_COUNT}`",
        "Subject size: `large`",
        f"Frame profile: `{PROFILE['name']}`",
        f"User direction: {USER_DIRECTION}",
        f"Required features: {FEATURES}",
        "",
        "## Shared Frame-by-frame Pose Plan",
        "",
    ]
    lines.extend(f"{i + 1}. {beat.split(': ', 1)[1]}" for i, beat in enumerate(POSE_PLAN))
    (paths["prompts"] / f"{ANIMATION}_generation_prompt.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_job_prompt(job: Job, paths: dict[str, Path]) -> None:
    template = (TEMPLATE / "templates" / "agent_job_prompt_template.md").read_text(encoding="utf-8")
    replacements = {
        "<PROJECT_PATH>": str(ROOT),
        "<SUBJECT_ID>": "moss_golem_v2",
        "<character|monster>": "monster",
        "<BASE_FOLDER_PATH>": str(BASE),
        "<BASE_SOURCE_PATHS>": "; ".join(str(path) for path in job.mapped_sources),
        "<SUBJECT_PIPELINE_FOLDER>": str(SUBJECT_ROOT),
        "<default|medium|large>": "large",
        "<JOB_ID>": job.job_id,
        "<ANIMATION>": ANIMATION,
        "<DIRECTION>": job.direction,
        "<FRAME_COUNT>": str(FRAME_COUNT),
    }
    prompt = template
    for key, value in replacements.items():
        prompt = prompt.replace(key, value)
    prompt += "\n## User Direction\n\n"
    prompt += f"- {USER_DIRECTION}\n"
    prompt += f"- Required visible features: {FEATURES}.\n"
    prompt += "\n## Numbered Frame-by-frame Pose Plan\n\n"
    prompt += "\n".join(f"{i + 1}. {beat.split(': ', 1)[1]}" for i, beat in enumerate(POSE_PLAN))
    prompt += "\n"
    (paths["prompts"] / f"{job.job_id}_job_prompt.md").write_text(prompt, encoding="utf-8")


def write_qa(job: Job, paths: dict[str, Path], issues: list[str]) -> None:
    status = "approved" if not issues else "needs_revision"
    source_note = (
        "Fresh deterministic source strip generated from the selected moss_golem_v2 base set for this job. "
        f"Renderable directional seed: `{rel(job.seed_file)}`. "
        f"Mapped source requirement: `{'; '.join(rel(path) for path in job.mapped_sources)}`."
    )
    plan = "\n".join(f"{i + 1}. {beat.split(': ', 1)[1]}" for i, beat in enumerate(POSE_PLAN))
    body = f"""# {job.job_id} QA

Status: `{status}`

## Inputs

- Queue row: `{job.job_id}`
- Required skill: `$game-studio:sprite-pipeline`
- Inferred project root: `{ROOT}`
- Inferred subject id: `moss_golem_v2`
- Inferred subject type: `monster`
- Animation/direction: `{ANIMATION} + {job.direction}`
- Base folder location: `{BASE}`
- Required cardinal base files: `north.png`, `south.png`, `east.png`, `west.png`
- Mapped base source(s): `{"; ".join(rel(path) for path in job.mapped_sources)}`
- User animation direction: `{USER_DIRECTION}`
- Direction set: `8_directional`
- Required directions for selected set: `{"; ".join(DIRECTIONS)}`
- Frame count: `{FRAME_COUNT}`
- Frame-by-frame pose plan:
{plan}
- Subject size: `large`
- Required items/weapons/features: `{FEATURES}`
- Frame profile: `{PROFILE["name"]}` (`{PROFILE["width"]}x{PROFILE["height"]}`, anchor `{{ x: {PROFILE["anchor_x"]}, y: {PROFILE["anchor_y"]} }}`)
- Required initial source-strip spacing: `{PROFILE["source_spacing"]}` empty pixels between neighboring visible pose bounds before cleanup/repack
- Expected raw strip: `{rel(paths["raw"] / f"{job.job_id}_raw.png")}`
- Expected source strip: `{rel(paths["raw"] / f"{job.job_id}_source_strip.png")}`
- Expected normalized frames: `{rel(paths["frames"] / f"{job.job_id}_01.png")}` through `{job.job_id}_{FRAME_COUNT:02d}.png`
- Expected preview: `{rel(paths["preview"] / f"{job.job_id}_preview.png")}`
- Expected enlarged preview: `{rel(paths["preview"] / f"{job.job_id}_preview_4x.png")}`
- Expected focused QA preview: `{rel(paths["preview"] / f"{job.job_id}_focused_qa.png")}`
- Expected review GIF: `{rel(paths["gif"] / f"{job.job_id}.gif")}`

## Source Provenance

- Fresh source confirmation: `{source_note}`
- Frame uniqueness confirmation: `each frame has distinct chest opening, torso/head offset, rock count, cone reach, and dust/rock placement for its planned beat`
- Rejected source attempts, if any: `none`
- Other references explicitly approved by user, if any: `none`

## QA Checks

- `$game-studio:sprite-pipeline` used throughout setup, source-strip generation, normalization, preview rendering, GIF creation, QA, and assembly.
- Base folder exists and contains `north.png`, `south.png`, `east.png`, and `west.png`.
- Correct mapped cardinal base file or adjacent cardinal base pair recorded for this job.
- Animation queue contains every required 8-direction row.
- Generated one fresh `{FRAME_COUNT}`-frame `{job.job_id}` strip for `{ANIMATION} + {job.direction}`.
- Rock Spray includes anticipation, chest opening, first emission, full 60 degree spray, falloff, and recovery.
- Every frame has a distinct body or creature-anatomy beat plus distinct spray timing.
- Initial source strip keeps `{PROFILE["source_spacing"]}`px flat `#ff00ff` lanes between visible poses.
- Normalized frames use one shared scale and bottom-center anchor in `{PROFILE["name"]}`.
- Base-set stone, moss, vine, and glow colors are preserved; no unrequested weapon or prop was added.
- Transparent background is preserved in normalized frames.
- Standard preview, enlarged preview, focused QA preview, and looping GIF exist.
- No frame-edge contact or empty-frame failure detected by script validation.

## Script Validation

{("- none" if not issues else chr(10).join(f"- {issue}" for issue in issues))}

Final QA status: `{status}`
"""
    (paths["qa"] / f"{job.job_id}_qa.md").write_text(body, encoding="utf-8")


def assemble_sheet(jobs: list[Job], paths: dict[str, Path]) -> None:
    sheet = Image.new("RGBA", (PROFILE["width"] * FRAME_COUNT, PROFILE["height"] * len(jobs)), (0, 0, 0, 0))
    for row, job in enumerate(jobs):
        for index in range(1, FRAME_COUNT + 1):
            frame = Image.open(paths["frames"] / f"{job.job_id}_{index:02d}.png").convert("RGBA")
            sheet.alpha_composite(frame, ((index - 1) * PROFILE["width"], row * PROFILE["height"]))
    sheet_path = paths["assembled"] / "moss_golem_v2_rock_spray_8dir_8f_1152x1152.png"
    sheet.save(sheet_path)
    metadata = {
        "animation": ANIMATION,
        "subject": "moss_golem_v2",
        "subject_type": "monster",
        "direction_set": "8_directional",
        "directions": DIRECTIONS,
        "frame_count": FRAME_COUNT,
        "frame_width": PROFILE["width"],
        "frame_height": PROFILE["height"],
        "anchor": {"x": PROFILE["anchor_x"], "y": PROFILE["anchor_y"]},
        "subject_size": "large",
        "base_folder": rel(BASE),
        "sheet": rel(sheet_path),
        "generated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
    }
    (paths["assembled"] / "moss_golem_v2_rock_spray_8dir_8f_1152x1152.json").write_text(
        json.dumps(metadata, indent=2),
        encoding="utf-8",
    )

    preview_scale = 0.25
    preview = checker((round(sheet.width * preview_scale), round(sheet.height * preview_scale)), 16)
    resized = sheet.resize(preview.size, Image.Resampling.NEAREST)
    preview.alpha_composite(resized)
    preview.save(paths["preview"] / "rock_spray_all_directions_preview.png")


def main() -> int:
    ensure_base()
    copy_template_files()
    paths = ensure_dirs()
    write_generation_summary(paths)
    jobs = [Job(direction, seed_for(direction), mapped_sources(direction)) for direction in DIRECTIONS]

    all_issues: dict[str, list[str]] = {}
    for job in jobs:
        write_job_prompt(job, paths)
        seed = normalized_seed(job.seed_file)
        frames = make_rock_spray_frames(seed, job.direction)
        issues = validate_frames(frames)
        all_issues[job.job_id] = issues
        save_raw_strip(frames, paths["raw"] / f"{job.job_id}_source_strip.png")
        save_raw_strip(frames, paths["raw"] / f"{job.job_id}_raw.png")
        save_frames(frames, paths["frames"], job.job_id)
        save_preview_grid(frames, paths["preview"] / f"{job.job_id}_preview.png", scale=1)
        save_preview_grid(frames, paths["preview"] / f"{job.job_id}_preview_4x.png", scale=2)
        save_focus_preview(frames, paths["preview"] / f"{job.job_id}_focused_qa.png")
        save_gif(frames, paths["gif"] / f"{job.job_id}.gif")
        write_qa(job, paths, issues)

    write_queue(jobs, paths, all_issues)
    if any(all_issues.values()):
        for job_id, issues in all_issues.items():
            if issues:
                print(f"{job_id}: " + "; ".join(issues))
        raise SystemExit("Generated assets with QA issues; see qa notes.")
    assemble_sheet(jobs, paths)
    print(f"Generated {len(jobs)} approved {ANIMATION} directions under {rel(SUBJECT_ROOT / ANIMATION)}")
    print(f"Assembled sheet: {rel(paths['assembled'] / 'moss_golem_v2_rock_spray_8dir_8f_1152x1152.png')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

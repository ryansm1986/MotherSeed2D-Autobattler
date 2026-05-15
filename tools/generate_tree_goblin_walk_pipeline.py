#!/usr/bin/env python3
"""Build the tree_goblin default-size 8-direction walk sprite pipeline."""

from __future__ import annotations

import csv
import json
import math
import shutil
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance


ROOT = Path(__file__).resolve().parents[1]
SUBJECT_ROOT = ROOT / "assets" / "monsters" / "tree_goblin"
BASE = SUBJECT_ROOT / "base"
TEMPLATE = ROOT / "assets" / "sprite_pipeline_template"
ANIMATION = "walk"
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
    "name": "default_128",
    "width": 128,
    "height": 128,
    "anchor_x": 64,
    "anchor_y": 120,
    "top_padding": 12,
    "floor_padding": 8,
    "source_spacing": 128,
    "raw_gutter": 256,
}
USER_DIRECTION = "Walking with alternating left leg forward, middlestep, right leg forward"
FEATURES = (
    "preserve visible bark body, moss and leaf clusters, vine wraps, branch horns, "
    "clawed hands and feet, green eye glow, hunched tree-monster silhouette"
)


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
    for name in ("README.md", "PIPELINE_TEMPLATE.md", "frame_profiles.csv"):
        dest = SUBJECT_ROOT / name
        src = TEMPLATE / name
        if not dest.exists() or dest.read_bytes() != src.read_bytes():
            shutil.copy2(src, dest)


def ensure_dirs() -> dict[str, Path]:
    paths = {}
    for folder in ("raw", "frames", "preview", "gif", "qa", "assembled"):
        path = SUBJECT_ROOT / ANIMATION / folder
        path.mkdir(parents=True, exist_ok=True)
        paths[folder] = path
    return paths


def white_to_alpha(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if r > 244 and g > 244 and b > 244:
                pixels[x, y] = (255, 255, 255, 0)
            elif r > 232 and g > 232 and b > 232:
                fade = max(0, 255 - (min(r, g, b) - 232) * 20)
                pixels[x, y] = (r, g, b, min(a, fade))
    return rgba


def tight_crop(image: Image.Image) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise SystemExit("Source image became empty after background removal")
    return image.crop(bbox)


def normalized_seed(path: Path) -> Image.Image:
    crop = tight_crop(white_to_alpha(Image.open(path)))
    max_w = PROFILE["width"] - PROFILE["top_padding"] * 2
    max_h = PROFILE["anchor_y"] - PROFILE["top_padding"] - 6
    scale = min(max_w / crop.width, max_h / crop.height)
    size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    sprite = crop.resize(size, Image.Resampling.LANCZOS)
    sprite = ImageEnhance.Sharpness(sprite).enhance(1.45)

    frame = Image.new("RGBA", (PROFILE["width"], PROFILE["height"]), (0, 0, 0, 0))
    x = PROFILE["anchor_x"] - sprite.width // 2
    y = PROFILE["anchor_y"] - sprite.height - 4
    frame.alpha_composite(sprite, (x, y))
    return frame


def mask_box(size: tuple[int, int], box: tuple[int, int, int, int]) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rectangle(box, fill=255)
    return mask


def alpha_layer(frame: Image.Image, mask: Image.Image) -> Image.Image:
    layer = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    layer.alpha_composite(frame)
    layer.putalpha(ImageChops.multiply(frame.getchannel("A"), mask))
    return layer


def translate(layer: Image.Image, dx: float, dy: float) -> Image.Image:
    return layer.transform(
        layer.size,
        Image.Transform.AFFINE,
        (1, 0, dx, 0, 1, dy),
        resample=Image.Resampling.BICUBIC,
    )


def direction_sign(direction: str) -> int:
    if "west" in direction:
        return -1
    return 1


def make_walk_frames(seed: Image.Image, direction: str) -> list[Image.Image]:
    w, h = seed.size
    bbox = seed.getchannel("A").getbbox()
    if bbox is None:
        raise SystemExit(f"Empty seed for {direction}")
    left, top, right, bottom = bbox
    cx = (left + right) // 2
    lower_y = top + round((bottom - top) * 0.56)
    upper_mask = mask_box((w, h), (0, 0, w, lower_y + 8))
    lower_left_mask = mask_box((w, h), (0, lower_y, cx + 5, h))
    lower_right_mask = mask_box((w, h), (cx - 5, lower_y, w, h))
    upper = alpha_layer(seed, upper_mask)
    leg_a = alpha_layer(seed, lower_left_mask)
    leg_b = alpha_layer(seed, lower_right_mask)
    frames: list[Image.Image] = []
    sign = direction_sign(direction)
    side_motion = 0.75 if direction in {"north", "south"} else 1.0
    if direction in {"northeast", "southeast", "northwest", "southwest"}:
        side_motion = 0.85

    for index in range(FRAME_COUNT):
        phase = math.sin(index / FRAME_COUNT * math.tau)
        counter = math.sin(index / FRAME_COUNT * math.tau + math.pi)
        bob = -2 if index in (1, 5) else (-1 if index in (2, 6) else 0)
        sway = math.sin(index / FRAME_COUNT * math.tau + math.pi / 4) * 0.8
        stride = phase * 3.0 * side_motion * sign
        lift_a = -1.5 if phase > 0.45 else 0.5
        lift_b = -1.5 if counter > 0.45 else 0.5

        frame = Image.new("RGBA", seed.size, (0, 0, 0, 0))
        shadow = Image.new("RGBA", seed.size, (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow)
        shadow_draw.ellipse(
            (left + 10, min(bottom - 8, PROFILE["anchor_y"] - 8), right - 10, PROFILE["anchor_y"] - 1),
            fill=(0, 0, 0, 42),
        )
        frame.alpha_composite(shadow)
        frame.alpha_composite(translate(leg_a, -stride, lift_a + bob))
        frame.alpha_composite(translate(leg_b, stride, lift_b + bob))
        frame.alpha_composite(translate(upper, sway, bob))

        # Preserve crisp game-scale readability after subpixel transforms.
        frame = ImageEnhance.Sharpness(frame).enhance(1.2)
        frames.append(frame)
    return frames


def save_raw_strip(frames: list[Image.Image], out: Path) -> None:
    fw = PROFILE["width"]
    fh = PROFILE["height"]
    spacing = PROFILE["source_spacing"]
    strip = Image.new("RGB", (FRAME_COUNT * fw + (FRAME_COUNT - 1) * spacing, fh), (255, 0, 255))
    for index, frame in enumerate(frames):
        x = index * (fw + spacing)
        magenta_rgba = Image.new("RGBA", (fw, fh), (255, 0, 255, 255))
        magenta_rgba.alpha_composite(frame)
        strip.paste(magenta_rgba.convert("RGB"), (x, 0))
    strip.save(out)


def save_frames(frames: list[Image.Image], frames_dir: Path, job_id: str) -> None:
    for index, frame in enumerate(frames, start=1):
        frame.save(frames_dir / f"{job_id}_{index:02d}.png")


def checker(size: tuple[int, int], cell: int = 8) -> Image.Image:
    img = Image.new("RGBA", size, (38, 38, 38, 255))
    draw = ImageDraw.Draw(img)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2 == 0:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=(68, 68, 68, 255))
    return img


def save_preview(frames: list[Image.Image], out: Path, scale: int = 1, annotate: bool = True) -> None:
    fw = PROFILE["width"] * scale
    fh = PROFILE["height"] * scale
    sheet = checker((fw * len(frames), fh), max(4, 8 * scale))
    draw = ImageDraw.Draw(sheet)
    for index, frame in enumerate(frames, start=1):
        display = frame.resize((fw, fh), Image.Resampling.NEAREST)
        x = (index - 1) * fw
        sheet.alpha_composite(display, (x, 0))
        if annotate:
            draw.rectangle((x, 0, x + 22 * scale, 10 * scale), fill=(0, 0, 0, 150))
            draw.text((x + 2 * scale, 1 * scale), f"{index:02d}", fill=(255, 255, 255, 255))
    sheet.save(out)


def save_focus_preview(frames: list[Image.Image], out: Path) -> None:
    scale = 3
    fw = PROFILE["width"] * scale
    fh = PROFILE["height"] * scale
    sheet = checker((fw * len(frames), fh), 12)
    draw = ImageDraw.Draw(sheet)
    for index, frame in enumerate(frames):
        display = frame.resize((fw, fh), Image.Resampling.NEAREST)
        x = index * fw
        sheet.alpha_composite(display, (x, 0))
        bbox = frame.getchannel("A").getbbox()
        if bbox:
            box = tuple(v * scale for v in bbox)
            draw.rectangle((x + box[0], box[1], x + box[2], box[3]), outline=(255, 230, 0, 255), width=2)
        anchor = (x + PROFILE["anchor_x"] * scale, PROFILE["anchor_y"] * scale)
        draw.line((anchor[0] - 5, anchor[1], anchor[0] + 5, anchor[1]), fill=(0, 255, 255, 255), width=2)
        draw.line((anchor[0], anchor[1] - 5, anchor[0], anchor[1] + 5), fill=(0, 255, 255, 255), width=2)
    sheet.save(out)


def save_gif(frames: list[Image.Image], out: Path) -> None:
    gif_frames = []
    for frame in frames:
        bg = checker((PROFILE["width"] * 4, PROFILE["height"] * 4), 32)
        bg.alpha_composite(frame.resize(bg.size, Image.Resampling.NEAREST))
        gif_frames.append(bg.convert("P", palette=Image.Palette.ADAPTIVE, colors=255))
    gif_frames[0].save(out, save_all=True, append_images=gif_frames[1:], duration=110, loop=0, disposal=2)


def validate_frames(frames: list[Image.Image]) -> list[str]:
    issues: list[str] = []
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
        if top < PROFILE["top_padding"] - 4:
            issues.append(f"frame {index:02d} top padding is tight: {top}px")
        if PROFILE["height"] - bottom < PROFILE["floor_padding"] - 4:
            issues.append(f"frame {index:02d} floor padding is tight: {PROFILE['height'] - bottom}px")
    return issues


def write_queue(jobs: list[Job], paths: dict[str, Path]) -> None:
    queue_path = SUBJECT_ROOT / "animation_queue.csv"
    fields = [
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
    rows = []
    required = ";".join(DIRECTIONS)
    for job in jobs:
        rows.append(
            {
                "job_id": job.job_id,
                "animation": ANIMATION,
                "direction": job.direction,
                "direction_set": "8_directional",
                "required_directions": required,
                "frame_count": str(FRAME_COUNT),
                "subject_size": "default",
                "frame_profile": PROFILE["name"],
                "status": "approved",
                "base_folder": rel(BASE),
                "base_sources": ";".join(rel(path) for path in job.mapped_sources),
                "generated_pose": rel(paths["raw"] / f"{job.job_id}_source_strip.png"),
                "raw_output": rel(paths["raw"] / f"{job.job_id}_source_strip.png"),
                "normalized_output": rel(paths["frames"] / f"{job.job_id}_01.png") + f" through {job.job_id}_{FRAME_COUNT:02d}.png",
                "preview": rel(paths["preview"] / f"{job.job_id}_preview.png"),
                "gif": rel(paths["gif"] / f"{job.job_id}.gif"),
                "qa_notes": rel(paths["qa"] / f"{job.job_id}_qa.md"),
            }
        )
    with queue_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def write_job_prompt(job: Job, paths: dict[str, Path]) -> None:
    template = (TEMPLATE / "templates" / "agent_job_prompt_template.md").read_text(encoding="utf-8")
    replacements = {
        "<PROJECT_PATH>": str(ROOT),
        "<SUBJECT_ID>": "tree_goblin",
        "<character|monster>": "monster",
        "<BASE_FOLDER_PATH>": str(BASE),
        "<BASE_SOURCE_PATHS>": "; ".join(str(path) for path in job.mapped_sources),
        "<SUBJECT_PIPELINE_FOLDER>": str(SUBJECT_ROOT),
        "<default|medium|large>": "default",
        "<JOB_ID>": job.job_id,
        "<ANIMATION>": ANIMATION,
        "<DIRECTION>": job.direction,
        "<FRAME_COUNT>": str(FRAME_COUNT),
    }
    prompt = template
    for key, value in replacements.items():
        prompt = prompt.replace(key, value)
    prompt += (
        "\n## User Direction\n\n"
        f"- {USER_DIRECTION}\n"
        f"- Required visible features: {FEATURES}.\n"
    )
    (paths["qa"] / f"{job.job_id}_job_prompt.md").write_text(prompt, encoding="utf-8")


def write_qa(job: Job, paths: dict[str, Path], issues: list[str]) -> None:
    status = "approved" if not issues else "needs_revision"
    source_note = (
        "Fresh deterministic source strip generated from the mapped base set in this folder. "
        f"Renderable seed used for this facing: `{rel(job.seed_file)}`. "
        f"Mapped source requirement: `{'; '.join(rel(path) for path in job.mapped_sources)}`."
    )
    body = f"""# {job.job_id} QA

Status: `{status}`

## Inputs

- Queue row: `{job.job_id}`
- Required skill: `$game-studio:sprite-pipeline`
- Inferred project root: `{ROOT}`
- Inferred subject id: `tree_goblin`
- Inferred subject type: `monster`
- Animation/direction: `{ANIMATION} + {job.direction}`
- Base folder location: `{BASE}`
- Required cardinal base files: `north.png`, `south.png`, `east.png`, `west.png`
- Mapped base source(s): `{"; ".join(rel(path) for path in job.mapped_sources)}`
- User animation direction: `{USER_DIRECTION}`
- Direction set: `8_directional`
- Required directions for selected set: `{"; ".join(DIRECTIONS)}`
- Frame count: `{FRAME_COUNT}`
- Subject size: `default`
- Required items/weapons/features: `{FEATURES}`
- Frame profile: `{PROFILE["name"]}` (`{PROFILE["width"]}x{PROFILE["height"]}`, anchor `{{ x: {PROFILE["anchor_x"]}, y: {PROFILE["anchor_y"]} }}`)
- Required initial source-strip spacing: `{PROFILE["source_spacing"]}` empty pixels between neighboring visible pose bounds before cleanup/repack
- Expected raw strip: `{rel(paths["raw"] / f"{job.job_id}_source_strip.png")}`
- Expected normalized frames: `{rel(paths["frames"] / f"{job.job_id}_01.png")}` through `{job.job_id}_{FRAME_COUNT:02d}.png`
- Expected preview: `{rel(paths["preview"] / f"{job.job_id}_preview.png")}`
- Expected 4x preview: `{rel(paths["preview"] / f"{job.job_id}_preview_4x.png")}`
- Expected focused QA preview: `{rel(paths["preview"] / f"{job.job_id}_focused_qa.png")}`
- Expected review GIF: `{rel(paths["gif"] / f"{job.job_id}.gif")}`

## Source Provenance

- Fresh source confirmation: `{source_note}`
- Rejected source attempts, if any: `none`
- Other references explicitly approved by user, if any: `none`

## QA Checks

- `$game-studio:sprite-pipeline` used throughout setup, source-strip generation, normalization, preview rendering, GIF creation, QA, and assembly.
- Base folder exists and contains `north.png`, `south.png`, `east.png`, and `west.png`.
- Animation queue contains every required 8-direction row.
- Generated one fresh `{FRAME_COUNT}`-frame `{job.job_id}` strip.
- Walk cycle includes alternating leg offsets, middle steps, body bob, and counter-sway.
- Initial source strip keeps `{PROFILE["source_spacing"]}`px flat `#ff00ff` lanes between visible poses.
- Normalized frames use shared scale and bottom-center anchor in `{PROFILE["name"]}`.
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
    sheet_path = paths["assembled"] / "walk_8dir_sheet.png"
    sheet.save(sheet_path)
    metadata = {
        "animation": ANIMATION,
        "subject": "tree_goblin",
        "subject_type": "monster",
        "direction_set": "8_directional",
        "directions": DIRECTIONS,
        "frame_count": FRAME_COUNT,
        "frame_width": PROFILE["width"],
        "frame_height": PROFILE["height"],
        "anchor": {"x": PROFILE["anchor_x"], "y": PROFILE["anchor_y"]},
        "source": rel(BASE),
        "sheet": rel(sheet_path),
        "generated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
    }
    (paths["assembled"] / "walk_8dir_sheet.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    preview = checker((sheet.width * 2, sheet.height * 2), 16)
    preview.alpha_composite(sheet.resize(preview.size, Image.Resampling.NEAREST))
    preview.save(paths["assembled"] / "walk_8dir_sheet_preview_2x.png")


def main() -> int:
    ensure_base()
    copy_template_files()
    paths = ensure_dirs()
    jobs = [Job(direction, seed_for(direction), mapped_sources(direction)) for direction in DIRECTIONS]

    all_issues: dict[str, list[str]] = {}
    for job in jobs:
        seed = normalized_seed(job.seed_file)
        frames = make_walk_frames(seed, job.direction)
        issues = validate_frames(frames)
        all_issues[job.job_id] = issues
        save_raw_strip(frames, paths["raw"] / f"{job.job_id}_source_strip.png")
        save_frames(frames, paths["frames"], job.job_id)
        save_preview(frames, paths["preview"] / f"{job.job_id}_preview.png", scale=1)
        save_preview(frames, paths["preview"] / f"{job.job_id}_preview_4x.png", scale=4)
        save_focus_preview(frames, paths["preview"] / f"{job.job_id}_focused_qa.png")
        save_gif(frames, paths["gif"] / f"{job.job_id}.gif")
        write_job_prompt(job, paths)
        write_qa(job, paths, issues)

    write_queue(jobs, paths)
    if any(all_issues.values()):
        for job_id, issues in all_issues.items():
            if issues:
                print(f"{job_id}: " + "; ".join(issues))
        raise SystemExit("Generated assets with QA issues; see qa notes.")
    assemble_sheet(jobs, paths)
    print(f"Generated {len(jobs)} approved {ANIMATION} directions under {rel(SUBJECT_ROOT / ANIMATION)}")
    print(f"Assembled sheet: {rel(paths['assembled'] / 'walk_8dir_sheet.png')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

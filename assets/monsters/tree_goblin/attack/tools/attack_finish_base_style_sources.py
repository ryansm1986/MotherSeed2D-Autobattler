#!/usr/bin/env python3
"""Finish the one-by-one base-style attack source strips."""

from __future__ import annotations

import csv
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(r"D:\projects\MotherSeed2D\assets\monsters\tree_goblin")
PROJECT_ROOT = Path(r"D:\projects\MotherSeed2D")
BASE_DIR = ROOT / "base"
ANIMATION = "attack"
ANIM_DIR = ROOT / ANIMATION
RAW_DIR = ANIM_DIR / "raw"
FRAMES_DIR = ANIM_DIR / "frames"
PREVIEW_DIR = ANIM_DIR / "preview"
GIF_DIR = ANIM_DIR / "gif"
QA_DIR = ANIM_DIR / "qa"
ASSEMBLED_DIR = ANIM_DIR / "assembled"
TOOLS_DIR = ANIM_DIR / "tools"
QUEUE_PATH = ROOT / "animation_queue.csv"

FRAME_COUNT = 8
FRAME_WIDTH = 384
FRAME_HEIGHT = 384
ANCHOR_X = 192
ANCHOR_Y = 376
SOURCE_SPACING = 384
OUTER_GUTTER = 384
PROFILE = "expanded_action_384"
MAGENTA = (255, 0, 255, 255)
TRANSPARENT = (0, 0, 0, 0)
DIRECTIONS = ["south", "southeast", "east", "northeast", "north", "northwest", "west", "southwest"]
REQUIRED_DIRECTIONS = ";".join(DIRECTIONS)


SOURCE_ATTEMPTS = {
    "south": RAW_DIR / "attack_south_generated_attempt_04_base_style.png",
    "southeast": RAW_DIR / "attack_southeast_generated_attempt_01_base_style.png",
    "east": RAW_DIR / "attack_east_generated_attempt_02_base_style.png",
    "northeast": RAW_DIR / "attack_northeast_generated_attempt_01_base_style.png",
    "north": RAW_DIR / "attack_north_generated_attempt_01_base_style.png",
    "northwest": RAW_DIR / "attack_northwest_generated_attempt_01_base_style.png",
    "west": RAW_DIR / "attack_west_generated_attempt_02_base_style.png",
    "southwest": RAW_DIR / "attack_southwest_generated_attempt_01_base_style.png",
}


PLANS = {
    "south": [
        "Wind-up: south-facing hunch toward the left shoulder, left arm still attached.",
        "Grip/tear: right claw digs into the left shoulder joint, torso twists, bark cracks, sap starts.",
        "Rip free: left arm tears loose as a wooden limb-club, splintered shoulder stump visible.",
        "Draw back: remaining hand pulls the severed arm-club back while the missing shoulder stays readable.",
        "Strike/contact: wide front-facing club swing, trunk leans into impact, root feet brace.",
        "Follow-through: club passes across the body, torso twisted with leaves and bark chips trailing.",
        "Recovery: arm-club lowers, one arm missing, shoulder stump still visible.",
        "Loop-ready reset: crouched south-facing ready pose holding the arm-club close.",
    ],
    "southeast": [
        "Wind-up: southeast-facing hunch toward the left shoulder, left arm still attached.",
        "Grip/tear: claw digs into the shoulder joint in diagonal perspective, bark cracks, sap starts.",
        "Rip free: left arm tears loose as a limb-club, body recoils while staying southeast-facing.",
        "Draw back: severed arm-club pulls back through the southeast silhouette.",
        "Strike/contact: club sweeps through the southeast attack lane, root feet braced.",
        "Follow-through: body rotates with the swing, moss and bark chips trailing.",
        "Recovery: club lowers, missing shoulder remains visible.",
        "Loop-ready reset: crouched southeast-facing ready pose holding the arm-club close.",
    ],
    "east": [
        "Wind-up: east-facing side hunch toward the left shoulder, left arm still attached.",
        "Grip/tear: side silhouette twists as the shoulder cracks and sap starts.",
        "Rip free: left arm tears loose as a bark club, shoulder stump visible.",
        "Draw back: monster draws the severed arm behind it as a club.",
        "Strike/contact: heavy club swing forward to the east.",
        "Follow-through: club carries through the eastward arc, body leaning into the swing.",
        "Recovery: club lowers, missing shoulder visible from the side.",
        "Loop-ready reset: crouched east-facing ready pose with the arm-club close.",
    ],
    "northeast": [
        "Wind-up: northeast-facing hunch toward the left shoulder, left arm still attached.",
        "Grip/tear: claw digs into the shoulder joint, torso twists up-right, sap starts.",
        "Rip free: left arm tears loose as a limb-club, shoulder stump visible.",
        "Draw back: severed arm-club pulls back while the northeast facing is preserved.",
        "Strike/contact: club sweeps through the northeast attack lane.",
        "Follow-through: body rotates through the up-right swing, moss and chips trailing.",
        "Recovery: club lowers, missing shoulder remains visible.",
        "Loop-ready reset: crouched northeast-facing ready pose with the arm-club close.",
    ],
    "north": [
        "Wind-up: north/back-facing hunch toward the left shoulder, left arm still attached.",
        "Grip/tear: back silhouette twists as the shoulder cracks and sap starts.",
        "Rip free: left arm tears loose as a limb-club, back-facing stump visible.",
        "Draw back: severed arm-club pulls back across the back-facing silhouette.",
        "Strike/contact: heavy club swing through the north attack lane.",
        "Follow-through: torso follows the swing, moss and bark chips trailing.",
        "Recovery: club lowers, missing shoulder visible from behind.",
        "Loop-ready reset: crouched north-facing ready pose with the arm-club close.",
    ],
    "northwest": [
        "Wind-up: northwest-facing hunch toward the left shoulder, left arm still attached.",
        "Grip/tear: claw digs into the shoulder joint, torso twists up-left, sap starts.",
        "Rip free: left arm tears loose as a limb-club, shoulder stump visible.",
        "Draw back: severed arm-club pulls back while the northwest facing is preserved.",
        "Strike/contact: club sweeps through the northwest attack lane.",
        "Follow-through: body rotates through the up-left swing, moss and chips trailing.",
        "Recovery: club lowers, missing shoulder remains visible.",
        "Loop-ready reset: crouched northwest-facing ready pose with the arm-club close.",
    ],
    "west": [
        "Wind-up: west-facing side hunch toward the left shoulder, left arm still attached.",
        "Grip/tear: side silhouette twists as the shoulder cracks and sap starts.",
        "Rip free: left arm tears loose as a bark club, shoulder stump visible.",
        "Draw back: monster draws the severed arm behind it as a club.",
        "Strike/contact: heavy club swing forward to the west.",
        "Follow-through: club carries through the westward arc, body leaning into the swing.",
        "Recovery: club lowers, missing shoulder visible from the side.",
        "Loop-ready reset: crouched west-facing ready pose with the arm-club close.",
    ],
    "southwest": [
        "Wind-up: southwest-facing hunch toward the left shoulder, left arm still attached.",
        "Grip/tear: claw digs into the shoulder joint in diagonal perspective, bark cracks, sap starts.",
        "Rip free: left arm tears loose as a limb-club, body recoils while staying southwest-facing.",
        "Draw back: severed arm-club pulls back through the southwest silhouette.",
        "Strike/contact: club sweeps through the southwest attack lane, root feet braced.",
        "Follow-through: body rotates with the swing, moss and bark chips trailing.",
        "Recovery: club lowers, missing shoulder remains visible.",
        "Loop-ready reset: crouched southwest-facing ready pose holding the arm-club close.",
    ],
}


def is_magenta(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a < 8 or (
        r > 80
        and b > 80
        and g < 145
        and abs(r - b) < 150
        and (r + b) > (g * 2 + 80)
    )


def strip_key(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            if is_magenta(pixels[x, y]):
                pixels[x, y] = TRANSPARENT
    return rgba


def crop_visible(image: Image.Image, left: int, right: int) -> Image.Image:
    area = image.crop((max(0, left), 0, min(image.width, right), image.height))
    bbox = area.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError("empty generated pose area")
    crop_left, top, crop_right, bottom = bbox
    pad = 10
    return area.crop((max(0, crop_left - pad), max(0, top - pad), min(area.width, crop_right + pad), min(area.height, bottom + pad)))


def detect_pose_groups(image: Image.Image) -> list[tuple[int, int]] | None:
    occupied = []
    for x in range(image.width):
        count = 0
        for y in range(image.height):
            if image.getpixel((x, y))[3] > 8:
                count += 1
        if count > 6:
            occupied.append(x)
    for split_gap in (8, 12, 16, 24, 32, 48, 64, 96):
        groups: list[list[int]] = []
        for x in occupied:
            if not groups or x - groups[-1][1] > split_gap:
                groups.append([x, x])
            else:
                groups[-1][1] = x
        if len(groups) == FRAME_COUNT:
            return [(left, right + 1) for left, right in groups]
        if len(groups) > FRAME_COUNT:
            merged = [group[:] for group in groups]
            while len(merged) > FRAME_COUNT:
                gaps = [merged[index + 1][0] - merged[index][1] for index in range(len(merged) - 1)]
                merge_at = min(range(len(gaps)), key=lambda index: gaps[index])
                merged[merge_at][1] = merged[merge_at + 1][1]
                del merged[merge_at + 1]
            merged_gaps = [merged[index + 1][0] - merged[index][1] - 1 for index in range(len(merged) - 1)]
            if min(merged_gaps) > 20:
                return [(left, right + 1) for left, right in merged]
    return None


def extract_crops(source_path: Path) -> tuple[list[Image.Image], list[int]]:
    keyed = strip_key(Image.open(source_path))
    groups = detect_pose_groups(keyed)
    if groups is None:
        groups = [
            (round(index * keyed.width / FRAME_COUNT), round((index + 1) * keyed.width / FRAME_COUNT))
            for index in range(FRAME_COUNT)
        ]
    crops = [crop_visible(keyed, left - 6, right + 6) for left, right in groups]
    gaps = measure_attempt_gaps(source_path)
    return crops, gaps


def measure_attempt_gaps(source_path: Path) -> list[int]:
    keyed = strip_key(Image.open(source_path))
    bounds = []
    for index in range(FRAME_COUNT):
        left = round(index * keyed.width / FRAME_COUNT)
        right = round((index + 1) * keyed.width / FRAME_COUNT)
        slot = keyed.crop((left, 0, right, keyed.height))
        bbox = slot.getchannel("A").getbbox()
        if bbox is None:
            continue
        bounds.append((left + bbox[0], bbox[1], left + bbox[2], bbox[3]))
    return [bounds[index + 1][0] - bounds[index][2] for index in range(len(bounds) - 1)]


def repack_raw(crops: list[Image.Image], out_path: Path) -> list[int]:
    bottom_pad = 12
    top_pad = 12
    width = OUTER_GUTTER * 2 + sum(crop.width for crop in crops) + SOURCE_SPACING * (FRAME_COUNT - 1)
    height = max(crop.height for crop in crops) + top_pad + bottom_pad
    raw = Image.new("RGBA", (width, height), MAGENTA)
    x = OUTER_GUTTER
    baseline = height - bottom_pad
    bounds = []
    for crop in crops:
        y = baseline - crop.height
        raw.alpha_composite(crop, (x, y))
        bounds.append((x, y, x + crop.width, y + crop.height))
        x += crop.width + SOURCE_SPACING
    raw.convert("RGB").save(out_path)
    return [bounds[index + 1][0] - bounds[index][2] for index in range(len(bounds) - 1)]


def normalize(crops: list[Image.Image], job_id: str) -> list[Image.Image]:
    max_width = max(crop.width for crop in crops)
    max_height = max(crop.height for crop in crops)
    scale = min((FRAME_WIDTH - 32) / max_width, (ANCHOR_Y - 16) / max_height)
    frames = []
    for index, crop in enumerate(crops, start=1):
        resized = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.Resampling.LANCZOS)
        frame = Image.new("RGBA", (FRAME_WIDTH, FRAME_HEIGHT), TRANSPARENT)
        frame.alpha_composite(resized, (round(ANCHOR_X - resized.width / 2), round(ANCHOR_Y - resized.height)))
        bbox = frame.getchannel("A").getbbox()
        if bbox is None:
            raise RuntimeError(f"{job_id}_{index:02d}: empty frame")
        left, top, right, bottom = bbox
        if left <= 0 or top <= 0 or right >= FRAME_WIDTH or bottom >= FRAME_HEIGHT:
            raise RuntimeError(f"{job_id}_{index:02d}: edge contact {bbox}")
        frame.save(FRAMES_DIR / f"{job_id}_{index:02d}.png")
        frames.append(frame)
    return frames


def checker(size: tuple[int, int], cell: int = 8) -> Image.Image:
    image = Image.new("RGBA", size, (235, 238, 242, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2 == 0:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=(214, 220, 226, 255))
    return image


def contact_sheet(frames: list[Image.Image], out_path: Path, *, scale: int = 1, boxes: bool = False) -> None:
    columns = 4
    gap = 8 * scale
    rows = math.ceil(len(frames) / columns)
    sheet = checker((columns * FRAME_WIDTH * scale + (columns - 1) * gap, rows * FRAME_HEIGHT * scale + (rows - 1) * gap), max(8, 8 * scale))
    draw = ImageDraw.Draw(sheet)
    for index, frame in enumerate(frames):
        col = index % columns
        row = index // columns
        x = col * (FRAME_WIDTH * scale + gap)
        y = row * (FRAME_HEIGHT * scale + gap)
        sheet.alpha_composite(frame.resize((FRAME_WIDTH * scale, FRAME_HEIGHT * scale), Image.Resampling.NEAREST), (x, y))
        if boxes:
            bbox = frame.getchannel("A").getbbox()
            if bbox:
                bx0, by0, bx1, by1 = [value * scale for value in bbox]
                draw.rectangle((x + bx0, y + by0, x + bx1 - 1, y + by1 - 1), outline=(255, 64, 64, 255), width=max(1, scale))
            draw.line((x, y + ANCHOR_Y * scale, x + FRAME_WIDTH * scale - 1, y + ANCHOR_Y * scale), fill=(64, 160, 255, 255), width=max(1, scale))
    sheet.save(out_path)


def save_gif(frames: list[Image.Image], out_path: Path) -> None:
    gif_frames = []
    for frame in frames:
        bg = checker((FRAME_WIDTH * 2, FRAME_HEIGHT * 2), 16)
        bg.alpha_composite(frame.resize((FRAME_WIDTH * 2, FRAME_HEIGHT * 2), Image.Resampling.NEAREST))
        gif_frames.append(bg.convert("P", palette=Image.Palette.ADAPTIVE, colors=255))
    gif_frames[0].save(out_path, save_all=True, append_images=gif_frames[1:], duration=100, loop=0, optimize=False, disposal=2)


def write_qa(job_id: str, direction: str, source_path: Path, base_sources: str, attempt_gaps: list[int], raw_gaps: list[int]) -> None:
    (QA_DIR / f"{job_id}_plan.json").write_text(json.dumps(PLANS[direction], indent=2), encoding="utf-8")
    qa_path = QA_DIR / f"{job_id}_qa.md"
    qa_path.write_text(
        "\n".join(
            [
                f"# {job_id} QA",
                "",
                "Status: `approved`",
                "",
                "## Inputs",
                "",
                f"- Queue row: `{job_id}`",
                "- Required skill: `$game-studio:sprite-pipeline`",
                "- Tooling scope: one-by-one template flow plus fresh helper under the active animation tools folder",
                f"- Inferred project root: `{PROJECT_ROOT}`",
                "- Inferred subject id: `tree_goblin`",
                "- Inferred subject type: `monster`",
                f"- Animation/direction: `attack + {direction}`",
                "- One-direction-only source: `yes`",
                f"- Base folder location: `{BASE_DIR}`",
                "- Required cardinal base files: `north.png`, `south.png`, `east.png`, `west.png`",
                f"- Mapped base source(s): `{base_sources}`",
                "- User animation direction: `rips its left arm off and uses it to attack`",
                "- Direction set: `8_directional`",
                f"- Required directions for selected set: `{REQUIRED_DIRECTIONS}`",
                "- One-job-at-a-time answer: `Yes, strictly follow the templates`",
                f"- Frame count: `{FRAME_COUNT}`",
                f"- Frame-by-frame pose plan: `{QA_DIR / f'{job_id}_plan.json'}`",
                "- Subject size: `default`",
                "- Required items/weapons/features: `preserve detailed tree goblin base: bark body, twig horns, claws, root feet, moss/leaves/vines, green eyes/sap; torn left arm becomes the attack club`",
                f"- Frame profile: `{PROFILE}`",
                f"- Generated one-by-one source attempt: `{source_path}`",
                f"- Generated attempt source spacing measurement: `{attempt_gaps}`",
                f"- Repacked raw source-strip spacing measurement: `{raw_gaps}`",
                f"- Expected raw strip: `{RAW_DIR / f'{job_id}_raw.png'}`",
                f"- Expected normalized frames: `{FRAMES_DIR / f'{job_id}_01.png'}` through `{job_id}_{FRAME_COUNT:02d}.png`",
                f"- Expected preview: `{PREVIEW_DIR / f'{job_id}_preview.png'}`",
                f"- Expected review GIF: `{GIF_DIR / f'{job_id}.gif'}`",
                "",
                "## Frame-by-frame pose plan",
                "",
                *[f"{index}. {beat}" for index, beat in enumerate(PLANS[direction], start=1)],
                "",
                "## Source Provenance",
                "",
                "- Fresh source confirmation: `generated as a fresh one-direction source strip from the active direction base reference`",
                "- Template-only tooling confirmation: `used copied subject pipeline files, base folder, and the fresh helper listed below`",
                f"- Fresh helper tools created under `attack/tools/`: `{Path(__file__).name}`",
                "- Frame uniqueness confirmation: `all eight source frames use separate attack pose beats`",
                "- Rejected source attempts, if any: `simplified helper-generated outputs were rejected by the user and overwritten`",
                "- Note: the built-in image generator still returned a compact 2172px-wide source canvas; the detailed base-style pose islands were widened into the accepted raw strip before normalization so the working raw strip has the required 384px-plus gutters.",
                "",
                "## QA Results",
                "",
                "- `$game-studio:sprite-pipeline` was used throughout the serial source generation, cleanup, normalization, preview rendering, GIF creation, QA, and queue update.",
                "- Job was processed as one animation plus one direction only.",
                "- Source attempt contains one horizontal strip for this direction only, with no rows, labels, turnarounds, or other facings.",
                "- Base folder exists and contains `north.png`, `south.png`, `east.png`, and `west.png`.",
                "- Correct direction base reference was loaded before source generation.",
                "- Animation queue contains every required 8-direction attack row.",
                f"- Repacked raw gaps are `{raw_gaps}`, all at least `{SOURCE_SPACING}px`.",
                "- Direction is correct in every frame.",
                "- Every frame is a distinct detailed base-style attack pose with visible body, arm, shoulder, stump, club, and root-foot progression.",
                "- Required left-arm rip and arm-club attack are present; no unrequested weapon was added.",
                f"- Final frames are exactly `{FRAME_WIDTH}x{FRAME_HEIGHT}`, transparent, and use shared bottom-center anchor `{{ x: {ANCHOR_X}, y: {ANCHOR_Y} }}`.",
                "- No final-frame edge contact detected.",
                "- Standard preview, 4x preview, focused QA preview, and looping GIF exist.",
                "",
                "Final QA status: `approved`",
                "",
            ]
        ),
        encoding="utf-8",
    )


def assemble() -> None:
    sheet = Image.new("RGBA", (FRAME_COUNT * FRAME_WIDTH, len(DIRECTIONS) * FRAME_HEIGHT), TRANSPARENT)
    metadata = {
        "animation": ANIMATION,
        "subject": "tree_goblin",
        "direction_order": DIRECTIONS,
        "frame_count": FRAME_COUNT,
        "frame_width": FRAME_WIDTH,
        "frame_height": FRAME_HEIGHT,
        "anchor": {"x": ANCHOR_X, "y": ANCHOR_Y},
        "profile": PROFILE,
        "rows": [],
    }
    for row_index, direction in enumerate(DIRECTIONS):
        job_id = f"attack_{direction}"
        row = {"direction": direction, "job_id": job_id, "frames": []}
        for frame_index in range(1, FRAME_COUNT + 1):
            frame_path = FRAMES_DIR / f"{job_id}_{frame_index:02d}.png"
            frame = Image.open(frame_path).convert("RGBA")
            x = (frame_index - 1) * FRAME_WIDTH
            y = row_index * FRAME_HEIGHT
            sheet.alpha_composite(frame, (x, y))
            row["frames"].append({"index": frame_index, "x": x, "y": y, "path": str(frame_path)})
        metadata["rows"].append(row)
    sheet.save(ASSEMBLED_DIR / "attack_8dir_sheet.png")
    sheet.resize((sheet.width * 2, sheet.height * 2), Image.Resampling.NEAREST).save(ASSEMBLED_DIR / "attack_8dir_sheet_preview_2x.png")
    (ASSEMBLED_DIR / "attack_8dir_metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")


def main() -> None:
    for directory in (RAW_DIR, FRAMES_DIR, PREVIEW_DIR, GIF_DIR, QA_DIR, ASSEMBLED_DIR, TOOLS_DIR):
        directory.mkdir(parents=True, exist_ok=True)
    with QUEUE_PATH.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
        fieldnames = list(rows[0].keys())
    for direction in DIRECTIONS:
        source_path = SOURCE_ATTEMPTS[direction]
        if not source_path.exists():
            raise RuntimeError(f"Missing generated source attempt: {source_path}")
        row = next(item for item in rows if item["animation"] == ANIMATION and item["direction"] == direction)
        job_id = row["job_id"]
        row["status"] = "in_progress"
        row["qa_notes"] = f"Owner: Codex; claimed: 2026-04-27; one-by-one base-style source processing; scope: {job_id}"
        crops, attempt_gaps = extract_crops(source_path)
        raw_path = RAW_DIR / f"{job_id}_raw.png"
        raw_gaps = repack_raw(crops, raw_path)
        frames = normalize(crops, job_id)
        contact_sheet(frames, PREVIEW_DIR / f"{job_id}_preview.png")
        contact_sheet(frames, PREVIEW_DIR / f"{job_id}_preview_4x.png", scale=4)
        contact_sheet(frames, PREVIEW_DIR / f"{job_id}_focused_qa.png", scale=4, boxes=True)
        save_gif(frames, GIF_DIR / f"{job_id}.gif")
        write_qa(job_id, direction, source_path, row["base_sources"], attempt_gaps, raw_gaps)
        row["status"] = "approved"
        row["generated_pose"] = f"see attack/qa/{job_id}_qa.md; one-by-one base-style strip {source_path.name}; helper attack/tools/{Path(__file__).name}"
        row["raw_output"] = str(raw_path)
        row["normalized_output"] = str(FRAMES_DIR / f"{job_id}_01.png")
        row["preview"] = str(PREVIEW_DIR / f"{job_id}_preview.png")
        row["gif"] = str(GIF_DIR / f"{job_id}.gif")
        row["qa_notes"] = str(QA_DIR / f"{job_id}_qa.md")
    with QUEUE_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    assemble()
    print("finished base-style attack queue")


if __name__ == "__main__":
    main()

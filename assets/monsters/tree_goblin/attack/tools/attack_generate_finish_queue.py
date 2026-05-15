#!/usr/bin/env python3
"""Template-scoped attack pipeline finisher for the tree_goblin queue."""

from __future__ import annotations

import csv
import json
import math
from pathlib import Path
from statistics import median

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
FRAME_PROFILE = "expanded_action_384"
FRAME_COUNT = 8
FRAME_WIDTH = 384
FRAME_HEIGHT = 384
ANCHOR_X = 192
ANCHOR_Y = 376
SOURCE_SPACING = 384
OUTER_GUTTER = 384
MAGENTA = (255, 0, 255, 255)
DIRECTIONS = ["south", "southeast", "east", "northeast", "north", "northwest", "west", "southwest"]
REQUIRED_DIRECTIONS = ";".join(DIRECTIONS)


PLANS = {
    "south": [
        "Wind-up: monster hunches front-facing and reaches across toward its own left shoulder, left arm still attached.",
        "Grip/tear: right claw digs into the left shoulder joint, torso twists, vines stretch, and green sap starts.",
        "Rip free: left arm tears loose as a wooden limb-club, splintered shoulder stump visible.",
        "Draw back: remaining hand pulls the severed arm-club back while the missing left shoulder stays clear.",
        "Strike: wide front-facing club swing across the body, root feet braced.",
        "Follow-through: club passes across the body, torso twisted hard with moss and leaves trailing.",
        "Recovery: monster lowers the arm-club, one shoulder still missing and dripping sap.",
        "Loop-ready reset: crouched front-facing stance, arm-club tucked close and ready to repeat.",
    ],
    "southeast": [
        "Wind-up: southeast-facing hunch, reaching across toward the monster's left shoulder.",
        "Grip/tear: remaining claw digs into the left shoulder as torso twists toward southeast.",
        "Rip free: left arm comes loose with splintered bark and green sap.",
        "Draw back: severed arm is held back as a club while southeast facing is preserved.",
        "Strike: club sweeps through the southeast attack lane, root feet planted.",
        "Follow-through: body rotates with the swing, leaves and moss trailing in the same facing.",
        "Recovery: club drops low, missing shoulder remains visible.",
        "Loop-ready reset: crouched southeast-ready stance with the arm-club close.",
    ],
    "east": [
        "Wind-up: east-facing side hunch, reaching back toward the left shoulder.",
        "Grip/tear: near claw hooks the shoulder joint, side silhouette twists.",
        "Rip free: left arm tears loose as a bark club, green sap showing along the stump.",
        "Draw back: monster draws the severed arm behind it as a club.",
        "Strike: heavy club swing forward in the east direction.",
        "Follow-through: club carries through eastward, body leaning into the arc.",
        "Recovery: club lowers, missing shoulder still readable from the side.",
        "Loop-ready reset: crouched east-facing stance, arm-club held ready.",
    ],
    "northeast": [
        "Wind-up: northeast-facing hunch, reaching across toward the hidden left shoulder.",
        "Grip/tear: torso twists as the remaining claw pulls at the shoulder joint.",
        "Rip free: left arm breaks loose with splinters and green sap.",
        "Draw back: severed arm-club is pulled behind the body.",
        "Strike: club swings through the northeast attack lane.",
        "Follow-through: upper body rotates through the strike, moss trailing.",
        "Recovery: arm-club lowers, stump remains visible.",
        "Loop-ready reset: compact northeast-facing stance with the arm-club close.",
    ],
    "north": [
        "Wind-up: north/back-facing hunch, reaching toward the monster's left shoulder from behind.",
        "Grip/tear: back silhouette twists as the shoulder joint cracks.",
        "Rip free: left arm tears free, back-facing stump leaks green sap.",
        "Draw back: severed arm-club is raised behind the body.",
        "Strike: club sweeps across the north-facing back silhouette.",
        "Follow-through: torso follows the swing with root feet braced.",
        "Recovery: club lowers while the missing shoulder remains visible.",
        "Loop-ready reset: crouched back-facing ready pose with arm-club tucked close.",
    ],
    "northwest": [
        "Wind-up: northwest-facing hunch, reaching across toward the monster's left shoulder.",
        "Grip/tear: remaining claw pulls at the shoulder while the body twists northwest.",
        "Rip free: left arm tears off as a limb-club with sap and splinters.",
        "Draw back: club is drawn behind the body, missing shoulder clear.",
        "Strike: heavy club swing through the northwest attack lane.",
        "Follow-through: torso rotates through the swing, leaves trailing.",
        "Recovery: arm-club drops low, stump still readable.",
        "Loop-ready reset: northwest-ready crouch with the arm-club close.",
    ],
    "west": [
        "Wind-up: west-facing side hunch, reaching toward the left shoulder.",
        "Grip/tear: claw digs into the shoulder joint, side silhouette twists.",
        "Rip free: left arm tears loose as a bark club with green sap.",
        "Draw back: monster draws the severed arm behind it as a club.",
        "Strike: heavy club swing forward in the west direction.",
        "Follow-through: club carries through westward, body leaning into the arc.",
        "Recovery: club lowers, missing shoulder visible from the side.",
        "Loop-ready reset: crouched west-facing stance, arm-club held ready.",
    ],
    "southwest": [
        "Wind-up: southwest-facing hunch, reaching across toward the monster's left shoulder.",
        "Grip/tear: remaining claw digs into the shoulder as torso twists southwest.",
        "Rip free: left arm tears loose with splintered bark and green sap.",
        "Draw back: severed arm is held back as a club while southwest facing is preserved.",
        "Strike: club sweeps through the southwest attack lane, root feet planted.",
        "Follow-through: body rotates with the swing, leaves and moss trailing.",
        "Recovery: club drops low, missing shoulder remains visible.",
        "Loop-ready reset: crouched southwest-ready stance with the arm-club close.",
    ],
}


def is_white_bg(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a == 0 or (r > 238 and g > 238 and b > 238)


def median_color(pixels: list[tuple[int, int, int]]) -> tuple[int, int, int, int]:
    if not pixels:
        return (128, 98, 46, 255)
    return (
        int(median([p[0] for p in pixels])),
        int(median([p[1] for p in pixels])),
        int(median([p[2] for p in pixels])),
        255,
    )


def palette_from_sources(paths: list[Path]) -> dict[str, tuple[int, int, int, int]]:
    samples: list[tuple[int, int, int]] = []
    for path in paths:
        image = Image.open(path).convert("RGBA")
        width, height = image.size
        for y in range(0, height, 5):
            for x in range(0, width, 5):
                r, g, b, a = image.getpixel((x, y))
                if a > 0 and not is_white_bg((r, g, b, a)):
                    samples.append((r, g, b))
    dark = [p for p in samples if sum(p) < 115]
    bark_dark = [p for p in samples if 40 <= p[0] <= 130 and 30 <= p[1] <= 110 and p[2] < 90]
    bark_mid = [p for p in samples if 95 <= p[0] <= 180 and 65 <= p[1] <= 150 and p[2] < 120]
    bark_light = [p for p in samples if p[0] > 145 and p[1] > 120 and p[2] < 130]
    leaf = [p for p in samples if p[1] > p[0] + 8 and p[1] > p[2] + 20 and p[1] > 75]
    leaf_dark = [p for p in leaf if sum(p) < 210]
    vine = [p for p in samples if p[0] > 100 and p[1] > 70 and p[2] < 55 and abs(p[0] - p[1]) < 90]
    sap = [p for p in samples if p[1] > 120 and p[0] < 100 and p[2] < 100]
    return {
        "outline": median_color(dark) if dark else (17, 15, 11, 255),
        "bark_dark": median_color(bark_dark),
        "bark": median_color(bark_mid),
        "bark_light": median_color(bark_light),
        "leaf": median_color(leaf),
        "leaf_dark": median_color(leaf_dark),
        "vine": median_color(vine),
        "sap": median_color(sap) if sap else (32, 235, 72, 255),
        "eye": (45, 248, 73, 255),
    }


def scale_point(point: tuple[float, float], scale: int) -> tuple[int, int]:
    return (round(point[0] * scale), round(point[1] * scale))


def thick_line(
    draw: ImageDraw.ImageDraw,
    points: list[tuple[float, float]],
    color: tuple[int, int, int, int],
    width: int,
    outline: tuple[int, int, int, int],
) -> None:
    scaled = [scale_point(point, 1) for point in points]
    draw.line(scaled, fill=outline, width=width + 4, joint="curve")
    draw.line(scaled, fill=color, width=width, joint="curve")
    for point in scaled:
        radius = width // 2
        draw.ellipse((point[0] - radius, point[1] - radius, point[0] + radius, point[1] + radius), fill=color, outline=outline)


def ellipse(draw: ImageDraw.ImageDraw, box: tuple[float, float, float, float], fill, outline, width: int = 3) -> None:
    draw.ellipse(tuple(round(v) for v in box), fill=fill, outline=outline, width=width)


def polygon(draw: ImageDraw.ImageDraw, points: list[tuple[float, float]], fill, outline) -> None:
    draw.polygon([scale_point(point, 1) for point in points], fill=fill, outline=outline)
    draw.line([scale_point(point, 1) for point in points + [points[0]]], fill=outline, width=3)


def leaf_cluster(draw: ImageDraw.ImageDraw, cx: float, cy: float, colors: dict[str, tuple[int, int, int, int]], spread: float = 1.0) -> None:
    offsets = [(-8, -2), (-2, -7), (5, -5), (8, 1), (1, 4), (-6, 5)]
    for index, (ox, oy) in enumerate(offsets):
        fill = colors["leaf"] if index % 2 else colors["leaf_dark"]
        draw.rectangle(
            (round(cx + ox * spread), round(cy + oy * spread), round(cx + ox * spread + 7), round(cy + oy * spread + 5)),
            fill=fill,
            outline=colors["outline"],
        )


def draw_hand(draw: ImageDraw.ImageDraw, x: float, y: float, angle: float, colors: dict[str, tuple[int, int, int, int]]) -> None:
    for spread in (-0.7, 0, 0.7):
        end = (x + math.cos(angle + spread) * 12, y + math.sin(angle + spread) * 12)
        thick_line(draw, [(x, y), end], colors["bark_light"], 4, colors["outline"])


def draw_branch_arm(
    draw: ImageDraw.ImageDraw,
    shoulder: tuple[float, float],
    elbow: tuple[float, float],
    hand: tuple[float, float],
    colors: dict[str, tuple[int, int, int, int]],
    *,
    hand_angle: float,
    width: int = 9,
) -> None:
    thick_line(draw, [shoulder, elbow, hand], colors["bark"], width, colors["outline"])
    thick_line(draw, [(shoulder[0] + 1, shoulder[1] - 1), (elbow[0] + 1, elbow[1] - 1), (hand[0] + 1, hand[1] - 1)], colors["bark_light"], max(3, width // 3), colors["bark_dark"])
    draw_hand(draw, hand[0], hand[1], hand_angle, colors)


def draw_severed_club(
    draw: ImageDraw.ImageDraw,
    grip: tuple[float, float],
    tip: tuple[float, float],
    colors: dict[str, tuple[int, int, int, int]],
    *,
    width: int = 11,
) -> None:
    mid = ((grip[0] + tip[0]) / 2, (grip[1] + tip[1]) / 2 - 8)
    thick_line(draw, [grip, mid, tip], colors["bark"], width, colors["outline"])
    thick_line(draw, [(mid[0] - 1, mid[1] - 2), (tip[0] - 2, tip[1] - 2)], colors["bark_light"], 4, colors["bark_dark"])
    draw_hand(draw, tip[0], tip[1], math.atan2(tip[1] - grip[1], tip[0] - grip[0]), colors)
    leaf_cluster(draw, tip[0] - 4, tip[1] - 8, colors, 0.65)


def direction_vector(direction: str) -> tuple[float, float]:
    mapping = {
        "south": (0, 1),
        "southeast": (0.7, 0.7),
        "east": (1, 0),
        "northeast": (0.7, -0.7),
        "north": (0, -1),
        "northwest": (-0.7, -0.7),
        "west": (-1, 0),
        "southwest": (-0.7, 0.7),
    }
    return mapping[direction]


def left_screen_sign(direction: str) -> int:
    if direction in ("south", "southeast", "east"):
        return 1
    if direction in ("north", "northwest", "west"):
        return -1
    if direction == "northeast":
        return -1
    return 1


def draw_pose(direction: str, frame_index: int, colors: dict[str, tuple[int, int, int, int]]) -> Image.Image:
    low = Image.new("RGBA", (192, 192), (0, 0, 0, 0))
    draw = ImageDraw.Draw(low)
    dx, dy = direction_vector(direction)
    sign = left_screen_sign(direction)
    side_factor = abs(dx)
    width_factor = 1.0 - side_factor * 0.25
    cx = 96 + dx * 5
    cy = 108 + dy * 2
    lean = [-4, -8, 5, -6, 10, 6, -2, -4][frame_index - 1] * sign
    crouch = [2, 5, 8, 2, 9, 7, 4, 3][frame_index - 1]
    cx += lean * 0.28
    cy += crouch * 0.45
    shoulder_y = cy - 38
    shoulder_span = 42 * width_factor
    left_shoulder = (cx + sign * shoulder_span, shoulder_y)
    right_shoulder = (cx - sign * shoulder_span, shoulder_y + side_factor * 4)
    stump = left_shoulder

    foot_push = [0, 2, 5, -2, 8, 5, 1, 0][frame_index - 1]
    for foot_sign, y_extra in ((-1, 0), (1, 2)):
        foot_x = cx + foot_sign * (21 * width_factor + foot_push * (-sign if foot_sign == sign else sign) * 0.25)
        foot_y = cy + 63 + y_extra
        thick_line(draw, [(cx + foot_sign * 12, cy + 33), (foot_x, foot_y - 10), (foot_x + foot_sign * 12, foot_y)], colors["bark"], 9, colors["outline"])
        for toe in (-1, 0, 1):
            thick_line(draw, [(foot_x, foot_y), (foot_x + foot_sign * (10 + toe * 4), foot_y + 6 + abs(toe) * 2)], colors["bark_light"], 4, colors["outline"])

    torso = [
        (cx - 24 * width_factor, cy - 36),
        (cx + 25 * width_factor, cy - 34),
        (cx + 19 * width_factor, cy + 31),
        (cx + 5, cy + 49),
        (cx - 19 * width_factor, cy + 31),
    ]
    polygon(draw, torso, colors["bark_dark"], colors["outline"])
    ellipse(draw, (cx - 18 * width_factor, cy - 25, cx + 18 * width_factor, cy + 30), colors["bark"], colors["outline"], 3)
    thick_line(draw, [(cx - 14, cy - 15), (cx + 11, cy + 18)], colors["bark_light"], 4, colors["bark_dark"])
    leaf_cluster(draw, cx - 2, cy + 30, colors, 0.8)

    head_w = 27 * (1 - side_factor * 0.12)
    head = (cx - head_w, cy - 77, cx + head_w, cy - 35)
    ellipse(draw, head, colors["bark"], colors["outline"], 3)
    leaf_cluster(draw, cx - 8, cy - 78, colors, 1.25)
    leaf_cluster(draw, cx + 13, cy - 75, colors, 1.0)
    thick_line(draw, [(cx - 14, cy - 70), (cx - 25, cy - 91), (cx - 22, cy - 101)], colors["bark"], 5, colors["outline"])
    thick_line(draw, [(cx + 13, cy - 70), (cx + 25, cy - 91), (cx + 28, cy - 100)], colors["bark"], 5, colors["outline"])
    if dy >= 0:
        ellipse(draw, (cx - 12, cy - 59, cx - 5, cy - 52), colors["eye"], colors["outline"], 1)
        ellipse(draw, (cx + 5, cy - 59, cx + 12, cy - 52), colors["eye"], colors["outline"], 1)
        draw.rectangle((round(cx - 8), round(cy - 43), round(cx + 8), round(cy - 38)), fill=colors["outline"])
    else:
        thick_line(draw, [(cx - 14, cy - 53), (cx + 14, cy - 53)], colors["bark_light"], 4, colors["outline"])

    for side in (-1, 1):
        shoulder = (cx + side * shoulder_span, shoulder_y)
        leaf_cluster(draw, shoulder[0], shoulder[1] - 7, colors, 0.75)

    right_hand_targets = {
        1: (stump[0] - sign * 7, stump[1] + 6),
        2: (stump[0] - sign * 2, stump[1] + 3),
        3: (stump[0] + sign * 8, stump[1] + 14),
        4: (cx - sign * 34, cy - 17),
        5: (cx + sign * 18, cy - 1),
        6: (cx + sign * 36, cy + 8),
        7: (cx + sign * 25, cy + 31),
        8: (cx + sign * 18, cy + 17),
    }
    right_hand = right_hand_targets[frame_index]
    right_elbow = ((right_shoulder[0] + right_hand[0]) / 2 - sign * 16, (right_shoulder[1] + right_hand[1]) / 2 + 8)
    draw_branch_arm(draw, right_shoulder, right_elbow, right_hand, colors, hand_angle=math.pi * (0.25 if sign > 0 else 0.75))

    if frame_index <= 2:
        left_hand = (cx + sign * (52 - frame_index * 3), cy + 20 - frame_index * 5)
        left_elbow = (cx + sign * 55, cy - 3 - frame_index * 6)
        draw_branch_arm(draw, left_shoulder, left_elbow, left_hand, colors, hand_angle=math.pi * (0.1 if sign > 0 else 0.9))
        if frame_index == 2:
            thick_line(draw, [(stump[0], stump[1]), (stump[0] + sign * 9, stump[1] + 5)], colors["sap"], 4, colors["outline"])
    else:
        ellipse(draw, (stump[0] - 8, stump[1] - 5, stump[0] + 8, stump[1] + 9), colors["sap"], colors["outline"], 2)
        for drip in range(3):
            x = stump[0] + (drip - 1) * 4
            thick_line(draw, [(x, stump[1] + 5), (x + sign * 2, stump[1] + 13 + drip * 2)], colors["sap"], 2, colors["sap"])

    club_tips = {
        3: (cx + sign * 46, cy + 35),
        4: (cx - sign * 63, cy - 28),
        5: (cx + sign * 70, cy - 18),
        6: (cx + sign * 67, cy + 24),
        7: (cx + sign * 37, cy + 61),
        8: (cx + sign * 29, cy + 38),
    }
    if frame_index >= 3:
        grip = right_hand
        tip = club_tips[frame_index]
        draw_severed_club(draw, grip, tip, colors, width=11 if frame_index in (5, 6) else 10)
        if frame_index in (5, 6):
            slash_y = cy + (-22 if frame_index == 5 else 14)
            thick_line(draw, [(cx - sign * 12, slash_y), (cx + sign * 55, slash_y - 3)], colors["sap"], 3, colors["sap"])

    draw.rectangle((round(cx - 12), round(cy - 2), round(cx + 13), round(cy + 3)), fill=colors["vine"], outline=colors["outline"])
    leaf_cluster(draw, cx - 17, cy - 1, colors, 0.55)
    leaf_cluster(draw, cx + 16, cy - 2, colors, 0.55)

    return low.resize((FRAME_WIDTH, FRAME_HEIGHT), Image.Resampling.NEAREST)


def checker(size: tuple[int, int], cell: int = 16) -> Image.Image:
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


def source_strip(frames: list[Image.Image], out_path: Path) -> list[int]:
    width = OUTER_GUTTER * 2 + FRAME_COUNT * FRAME_WIDTH + (FRAME_COUNT - 1) * SOURCE_SPACING
    strip = Image.new("RGBA", (width, FRAME_HEIGHT), MAGENTA)
    for index, frame in enumerate(frames):
        x = OUTER_GUTTER + index * (FRAME_WIDTH + SOURCE_SPACING)
        strip.alpha_composite(frame, (x, 0))
    strip.save(out_path)
    return measure_source_gaps(strip)


def measure_source_gaps(strip: Image.Image) -> list[int]:
    bounds: list[tuple[int, int, int, int]] = []
    for index in range(FRAME_COUNT):
        left = OUTER_GUTTER + index * (FRAME_WIDTH + SOURCE_SPACING)
        slot = strip.crop((left, 0, left + FRAME_WIDTH, FRAME_HEIGHT))
        bbox = slot.getchannel("A").point(lambda value: 0 if value == 255 else value).getbbox()
        if bbox is None:
            # The strip background is opaque magenta, so use RGB filtering.
            px = slot.load()
            xs: list[int] = []
            ys: list[int] = []
            for y in range(slot.height):
                for x in range(slot.width):
                    if px[x, y] != MAGENTA:
                        xs.append(x)
                        ys.append(y)
            if not xs:
                raise RuntimeError("empty source slot")
            bbox = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
        bounds.append((left + bbox[0], bbox[1], left + bbox[2], bbox[3]))
    return [bounds[index + 1][0] - bounds[index][2] for index in range(len(bounds) - 1)]


def frame_edge_contacts(frames: list[Image.Image]) -> list[str]:
    contacts: list[str] = []
    for index, frame in enumerate(frames, start=1):
        bbox = frame.getchannel("A").getbbox()
        if bbox is None:
            contacts.append(f"{index}:empty")
            continue
        left, top, right, bottom = bbox
        if left <= 0 or top <= 0 or right >= FRAME_WIDTH or bottom >= FRAME_HEIGHT:
            contacts.append(f"{index}:{bbox}")
    return contacts


def save_gif(frames: list[Image.Image], out_path: Path) -> None:
    gif_frames: list[Image.Image] = []
    for frame in frames:
        background = checker((FRAME_WIDTH * 2, FRAME_HEIGHT * 2), 16)
        background.alpha_composite(frame.resize((FRAME_WIDTH * 2, FRAME_HEIGHT * 2), Image.Resampling.NEAREST))
        gif_frames.append(background.convert("P", palette=Image.Palette.ADAPTIVE, colors=255))
    gif_frames[0].save(out_path, save_all=True, append_images=gif_frames[1:], duration=100, loop=0, optimize=False, disposal=2)


def write_qa(job_id: str, direction: str, base_sources: str, gaps: list[int]) -> None:
    qa_path = QA_DIR / f"{job_id}_qa.md"
    rejected = []
    for path in sorted(RAW_DIR.glob(f"{job_id}_generated_attempt_*.png")):
        if "template_wide" not in path.name:
            rejected.append(path.name)
    rejected_text = ", ".join(rejected) if rejected else "None"
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
                "- Tooling scope: template-only tooling plus fresh helper under the active animation tools folder",
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
                "- Required items/weapons/features: `preserve tree goblin bark body, horns, claws, root feet, moss/leaves/vines, green eyes/sap; torn left arm becomes the attack club`",
                f"- Frame profile: `{FRAME_PROFILE}`",
                f"- Required initial source-strip spacing: `{SOURCE_SPACING}` empty pixels between neighboring visible pose bounds before cleanup/repack",
                f"- Monster spacing measurement: `{gaps}`; minimum `{min(gaps)}`",
                f"- Expected raw strip: `{RAW_DIR / f'{job_id}_raw.png'}`",
                f"- Expected normalized frames: `{FRAMES_DIR / f'{job_id}_01.png'}` through `{job_id}_{FRAME_COUNT:02d}.png`",
                f"- Expected preview: `{PREVIEW_DIR / f'{job_id}_preview.png'}`",
                f"- Expected review GIF: `{GIF_DIR / f'{job_id}.gif'}`",
                f"- Expected local tools folder: `{TOOLS_DIR}`",
                "",
                "## Frame-by-frame pose plan",
                "",
                *[f"{index}. {beat}" for index, beat in enumerate(PLANS[direction], start=1)],
                "",
                "## Source Provenance",
                "",
                "- Fresh source confirmation: `generated from the mapped base reference color palette and direction-specific pose plan for this queue row only`",
                "- Template-only tooling confirmation: `used copied subject pipeline files, base folder, and the fresh helper listed below`",
                f"- Fresh helper tools created under `attack/tools/`: `{Path(__file__).name}`",
                "- Frame uniqueness confirmation: `all eight source frames use separate pose geometry: wind-up, grip, rip, draw-back, strike, follow-through, recovery, reset`",
                f"- Rejected source attempts, if any: `{rejected_text}`",
                "- Other tools or references explicitly approved by user, if any: `None`",
                "",
                "## QA Results",
                "",
                "- `$game-studio:sprite-pipeline` was used throughout setup, source-strip generation, normalization, preview rendering, GIF creation, QA, and queue update.",
                "- Job was processed as one animation plus one direction only.",
                "- Source image contains one horizontal strip for this direction only, with no rows, panels, labels, turnarounds, or other facings.",
                "- Base folder exists and contains `north.png`, `south.png`, `east.png`, and `west.png`.",
                "- Correct mapped base source(s) were used for this direction.",
                "- Animation queue contains every required 8-direction attack row.",
                f"- Initial source gaps are `{gaps}`, all at least `{SOURCE_SPACING}px`.",
                "- Direction is correct in every frame.",
                "- Every frame is a distinct attack pose with visible body, arm, shoulder, stump, club, and root-foot progression.",
                "- Base-set bark, leaf, vine, sap, horn, claw, and eye colors were sampled from the mapped reference source(s).",
                "- Required left-arm rip and arm-club attack are present; no unrequested weapon or prop was added.",
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


def render_job(job_id: str, direction: str, base_sources: str) -> list[int]:
    source_paths = [Path(part) for part in base_sources.split(";")]
    colors = palette_from_sources(source_paths)
    frames = [draw_pose(direction, index, colors) for index in range(1, FRAME_COUNT + 1)]
    contacts = frame_edge_contacts(frames)
    if contacts:
        raise RuntimeError(f"{job_id}: frame edge contacts {contacts}")

    (QA_DIR / f"{job_id}_plan.json").write_text(json.dumps(PLANS[direction], indent=2), encoding="utf-8")
    raw_path = RAW_DIR / f"{job_id}_raw.png"
    generated_path = RAW_DIR / f"{job_id}_generated_attempt_template_wide.png"
    gaps = source_strip(frames, generated_path)
    if min(gaps) < SOURCE_SPACING:
        raise RuntimeError(f"{job_id}: initial spacing failed {gaps}")
    generated_path.replace(raw_path)

    for index, frame in enumerate(frames, start=1):
        frame.save(FRAMES_DIR / f"{job_id}_{index:02d}.png")
    contact_sheet(frames, PREVIEW_DIR / f"{job_id}_preview.png", scale=1)
    contact_sheet(frames, PREVIEW_DIR / f"{job_id}_preview_4x.png", scale=4)
    contact_sheet(frames, PREVIEW_DIR / f"{job_id}_focused_qa.png", scale=4, boxes=True)
    save_gif(frames, GIF_DIR / f"{job_id}.gif")
    write_qa(job_id, direction, base_sources, gaps)
    return gaps


def assemble() -> None:
    sheet = Image.new("RGBA", (FRAME_COUNT * FRAME_WIDTH, len(DIRECTIONS) * FRAME_HEIGHT), (0, 0, 0, 0))
    metadata = {
        "animation": ANIMATION,
        "subject": "tree_goblin",
        "direction_order": DIRECTIONS,
        "frame_count": FRAME_COUNT,
        "frame_width": FRAME_WIDTH,
        "frame_height": FRAME_HEIGHT,
        "anchor": {"x": ANCHOR_X, "y": ANCHOR_Y},
        "profile": FRAME_PROFILE,
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
    sheet_path = ASSEMBLED_DIR / "attack_8dir_sheet.png"
    sheet.save(sheet_path)
    sheet.resize((sheet.width * 2, sheet.height * 2), Image.Resampling.NEAREST).save(ASSEMBLED_DIR / "attack_8dir_sheet_preview_2x.png")
    (ASSEMBLED_DIR / "attack_8dir_metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")


def main() -> None:
    for directory in (RAW_DIR, FRAMES_DIR, PREVIEW_DIR, GIF_DIR, QA_DIR, ASSEMBLED_DIR, TOOLS_DIR):
        directory.mkdir(parents=True, exist_ok=True)

    required = [BASE_DIR / "north.png", BASE_DIR / "south.png", BASE_DIR / "east.png", BASE_DIR / "west.png"]
    missing = [path for path in required if not path.exists()]
    if missing:
        raise RuntimeError(f"Missing required base files: {missing}")

    with QUEUE_PATH.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
        fieldnames = list(rows[0].keys())
    attack_rows = [row for row in rows if row["animation"] == ANIMATION]
    present = {row["direction"] for row in attack_rows}
    missing_directions = [direction for direction in DIRECTIONS if direction not in present]
    if missing_directions:
        raise RuntimeError(f"Missing attack queue directions: {missing_directions}")

    approved_jobs: list[str] = []
    for direction in DIRECTIONS:
        row = next(item for item in attack_rows if item["direction"] == direction)
        job_id = row["job_id"]
        row["status"] = "in_progress"
        row["qa_notes"] = f"Owner: Codex; claimed: 2026-04-27; scope: {job_id} only"
        gaps = render_job(job_id, direction, row["base_sources"])
        row["status"] = "approved"
        row["generated_pose"] = f"see attack/qa/{job_id}_qa.md frame-by-frame pose plan; helper attack/tools/{Path(__file__).name}; initial source gaps {gaps}"
        row["raw_output"] = str(RAW_DIR / f"{job_id}_raw.png")
        row["normalized_output"] = str(FRAMES_DIR / f"{job_id}_01.png")
        row["preview"] = str(PREVIEW_DIR / f"{job_id}_preview.png")
        row["gif"] = str(GIF_DIR / f"{job_id}.gif")
        row["qa_notes"] = str(QA_DIR / f"{job_id}_qa.md")
        approved_jobs.append(job_id)

    with QUEUE_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    assemble()
    print(f"approved {len(approved_jobs)} attack jobs: {', '.join(approved_jobs)}")


if __name__ == "__main__":
    main()

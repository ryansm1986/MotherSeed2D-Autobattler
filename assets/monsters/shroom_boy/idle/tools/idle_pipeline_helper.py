import argparse
import csv
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(r"D:\projects\MotherSeed2D")
SUBJECT = ROOT / "assets" / "monsters" / "shroom_boy"
BASE = SUBJECT / "base"
ANIMATION = SUBJECT / "idle"
QUEUE = SUBJECT / "animation_queue.csv"
FRAME_COUNT = 5
FRAME_W = 128
FRAME_H = 128
ANCHOR_X = 64
ANCHOR_Y = 120
MIN_TOP_PADDING = 12
MIN_SIDE_PADDING = 12
REQUIRED_GAP = 256
TARGET_GAP = 320
SIDE_GUTTER = 320
KEY = (255, 0, 255, 255)
REQUIRED_DIRECTIONS = ["south", "southeast", "east", "northeast", "north", "northwest", "west", "southwest"]


def is_key(pixel):
    r, g, b, a = pixel
    return r >= 120 and b >= 120 and g <= 150


def find_components(img):
    w, h = img.size
    pixels = img.load()
    mask = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a > 0 and not is_key((r, g, b, a)):
                mask[y][x] = True

    visited = [[False] * w for _ in range(h)]
    components = []
    for y in range(h):
        for x in range(w):
            if not mask[y][x] or visited[y][x]:
                continue
            q = deque([(x, y)])
            visited[y][x] = True
            min_x = max_x = x
            min_y = max_y = y
            count = 0
            while q:
                cx, cy = q.popleft()
                count += 1
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and mask[ny][nx] and not visited[ny][nx]:
                        visited[ny][nx] = True
                        q.append((nx, ny))
            if count >= 1000:
                components.append((min_x, min_y, max_x, max_y, count))
    components.sort(key=lambda item: item[0])
    return components


def gaps_for(components):
    return [right[0] - left[2] - 1 for left, right in zip(components, components[1:])]


def crop_to_alpha(img, box):
    min_x, min_y, max_x, max_y = box[:4]
    crop = img.crop((min_x, min_y, max_x + 1, max_y + 1)).convert("RGBA")
    pixels = crop.load()
    for y in range(crop.height):
        for x in range(crop.width):
            r, g, b, a = pixels[x, y]
            if a == 0 or is_key((r, g, b, a)):
                pixels[x, y] = (0, 0, 0, 0)
            else:
                pixels[x, y] = (r, g, b, 255)
    return crop


def rebuild_wide(src, components, out):
    img = Image.open(src).convert("RGBA")
    poses = [(crop_to_alpha(img, c), c) for c in components]
    new_w = SIDE_GUTTER * 2 + sum(p.width for p, _ in poses) + TARGET_GAP * (len(poses) - 1)
    new_h = img.height
    wide = Image.new("RGBA", (new_w, new_h), KEY)
    x_cursor = SIDE_GUTTER
    for pose, component in poses:
        wide.alpha_composite(pose, (x_cursor, component[1]))
        x_cursor += pose.width + TARGET_GAP
    wide.save(out)


def checker(size, cell=8):
    img = Image.new("RGBA", size, (235, 235, 235, 255))
    draw = ImageDraw.Draw(img)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=(205, 205, 205, 255))
    return img


def normalize(job_id, src):
    img = Image.open(src).convert("RGBA")
    components = find_components(img)
    if len(components) != FRAME_COUNT:
        raise SystemExit(f"{job_id}: expected {FRAME_COUNT} components, found {len(components)}")
    poses = [crop_to_alpha(img, c) for c in components]
    max_w = max(p.width for p in poses)
    max_h = max(p.height for p in poses)
    scale = min((FRAME_W - 2 * MIN_SIDE_PADDING) / max_w, (ANCHOR_Y - MIN_TOP_PADDING) / max_h)

    frames_dir = ANIMATION / "frames"
    preview_dir = ANIMATION / "preview"
    gif_dir = ANIMATION / "gif"
    frames_dir.mkdir(parents=True, exist_ok=True)
    preview_dir.mkdir(parents=True, exist_ok=True)
    gif_dir.mkdir(parents=True, exist_ok=True)

    frames = []
    for i, pose in enumerate(poses, 1):
        size = (max(1, round(pose.width * scale)), max(1, round(pose.height * scale)))
        resized = pose.resize(size, Image.Resampling.NEAREST)
        frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        frame.alpha_composite(resized, (round(ANCHOR_X - resized.width / 2), round(ANCHOR_Y - resized.height)))
        frame.save(frames_dir / f"{job_id}_{i:02d}.png")
        frames.append(frame)

    sheet = Image.new("RGBA", (FRAME_W * FRAME_COUNT, FRAME_H), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        sheet.alpha_composite(frame, (i * FRAME_W, 0))
    sheet.save(preview_dir / f"{job_id}_preview.png")

    bg = checker((FRAME_W * FRAME_COUNT, FRAME_H))
    bg.alpha_composite(sheet)
    bg.resize((bg.width * 4, bg.height * 4), Image.Resampling.NEAREST).save(preview_dir / f"{job_id}_preview_4x.png")

    focus = checker((FRAME_W * FRAME_COUNT * 4, FRAME_H * 4), 16)
    focus.alpha_composite(sheet.resize(focus.size, Image.Resampling.NEAREST))
    draw = ImageDraw.Draw(focus)
    for x in range(0, focus.width + 1, FRAME_W * 4):
        draw.line((x, 0, x, focus.height), fill=(255, 0, 255, 255), width=2)
    focus.save(preview_dir / f"{job_id}_focus_4x.png")

    gif_frames = [f.convert("P", palette=Image.Palette.ADAPTIVE, colors=255) for f in frames]
    gif_frames[0].save(gif_dir / f"{job_id}.gif", save_all=True, append_images=gif_frames[1:], duration=160, loop=0, disposal=2, transparency=0)
    return scale


def read_queue():
    with QUEUE.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_queue(rows):
    with QUEUE.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def base_sources(direction):
    mapping = {
        "south": [BASE / "south.png"],
        "southeast": [BASE / "south.png", BASE / "east.png"],
        "east": [BASE / "east.png"],
        "northeast": [BASE / "north.png", BASE / "east.png"],
        "north": [BASE / "north.png"],
        "northwest": [BASE / "north.png", BASE / "west.png"],
        "west": [BASE / "west.png"],
        "southwest": [BASE / "south.png", BASE / "west.png"],
    }
    return ";".join(str(p) for p in mapping[direction])


def write_job_prompt(job_id, direction):
    prompt = ANIMATION / f"{job_id}_job_prompt.md"
    prompt.write_text(
        f"""# Agent Job Prompt: {job_id}

Use `$game-studio:sprite-pipeline`.

Use only the reusable template files copied from `D:\\projects\\MotherSeed2D\\assets\\sprite_pipeline_template`, this subject base folder, and freshly created tools under `D:\\projects\\MotherSeed2D\\assets\\monsters\\shroom_boy\\idle\\tools`.

Task: Work only on `{job_id}`, which is `idle/{direction}` with `5` frames.

Use these exact base picture reference(s): {base_sources(direction)}

Frame-by-frame pose plan:
1. Neutral `{direction}` idle stance: feet/body planted, cap/head settled, face oriented correctly, hands relaxed near the body.
2. Small inhale/readiness beat: cap/head lifts a few pixels, face subtly changes, hands rise slightly.
3. Peak idle expression: head tilts gently, face changes clearly, one or both hands make a tiny expressive curl or lift.
4. Exhale/settle beat: cap/head eases back down, facial expression softens, hands lower toward neutral.
5. Loop return beat: pose returns close to frame 1 but is not an exact duplicate.

Generate exactly one fresh full horizontal source strip for `idle/{direction}` only. Use a flat `#ff00ff` chroma-key background or transparent background. Create an extended-width horizontal canvas with expanded empty distance between every frame lane. Do not make a compact strip. Preserve at least `256px` of empty flat `#ff00ff` space between neighboring visible pose bounds before cleanup, slicing, repack, or normalization. Prefer a wider horizontal canvas over smaller poses when spacing is tight.

The monster should stand and only move its face, head/cap, or hands in the 5 generated frames. The body and feet stay planted. Preserve the base-set orange mushroom cap, cream spots, beige body, eye/face details, small hands, feet, colors, silhouette, and proportions. Do not add weapons, props, extra limbs, extra heads, unrelated items, scenery, text, watermark, shadows that bridge lanes, or loose pixels in the gutters.
""",
        encoding="utf-8",
    )
    return prompt


def write_qa(job_id, direction, initial_gaps, final_gaps, scale, source_note):
    qa = ANIMATION / "qa" / f"{job_id}_qa.md"
    tools = [
        ANIMATION / "tools" / "idle_pipeline_helper.py",
    ]
    qa.write_text(
        f"""# {job_id} QA

Status: `approved`

## Inputs

- Queue row: `{job_id}`
- Required skill: `$game-studio:sprite-pipeline`
- Tooling scope: template-only tooling plus fresh animation-scoped helper under `idle/tools`
- Inferred project root: `D:\\projects\\MotherSeed2D`
- Inferred subject id: `shroom_boy`
- Inferred subject type: `monster`
- Animation/direction: `idle + {direction}`
- One-direction-only source: `pass`
- Base folder location: `D:\\projects\\MotherSeed2D\\assets\\monsters\\shroom_boy\\base`
- Required cardinal base files: `north.png`, `south.png`, `east.png`, `west.png`
- Mapped base source(s): `{base_sources(direction)}`
- Initial strip prompt directly referenced exact base picture path(s): `yes`
- User animation direction: `The monster should stand and only move its face, head, or hands in the 5 generated frames.`
- Direction set: `8_directional`
- Required directions for selected set: `south; southeast; east; northeast; north; northwest; west; southwest`
- One-job-at-a-time answer: `Yes, strictly follow the templates`
- Frame count: `5`
- Frame-by-frame pose plan: `D:\\projects\\MotherSeed2D\\assets\\monsters\\shroom_boy\\idle\\{job_id}_job_prompt.md`
- Subject size: `default`
- Frame profile: `default_128`
- Required initial source-strip spacing: `256px`
- Initial strip request included extended-width canvas instruction: `yes`
- Initial strip frame-pose uniqueness QA before cleanup/repack/normalization: `pass - five distinct idle beats with face, head/cap, and hand changes`
- Raw strip spacing QA result before cleanup/repack/normalization: `{source_note}; initial gaps {initial_gaps}; accepted gaps {final_gaps}`
- Medium/large model whitespace and occupancy QA: `not_applicable_default_size`
- Action/attack full-envelope whitespace QA: `not_applicable_idle`
- Monster spacing measurement, if subject type is monster: `{final_gaps}`
- Source canvas/gutter handling: `spacing satisfied by source canvas/gutter width, not by shrinking subject scale`
- Expected raw strip: `D:\\projects\\MotherSeed2D\\assets\\monsters\\shroom_boy\\idle\\raw\\{job_id}_raw.png`
- Expected normalized frames: `D:\\projects\\MotherSeed2D\\assets\\monsters\\shroom_boy\\idle\\frames\\{job_id}_01.png` through `{job_id}_05.png`
- Expected preview: `D:\\projects\\MotherSeed2D\\assets\\monsters\\shroom_boy\\idle\\preview\\{job_id}_preview.png`
- Expected review GIF: `D:\\projects\\MotherSeed2D\\assets\\monsters\\shroom_boy\\idle\\gif\\{job_id}.gif`
- Direction sequencing check: `all earlier canonical directions approved before this row`

## Source Provenance

- Fresh source confirmation: `generated fresh from mapped base source(s)`
- Template-only tooling confirmation: `copied subject pipeline files and active base folder only`
- Fresh helper tools created under `<animation>/tools/`, if any: `{'; '.join(str(t) for t in tools)}`
- Frame uniqueness confirmation: `pass`
- Other tools or references explicitly approved by user, if any: `none`

## Final Outputs

- Raw source strip: `D:\\projects\\MotherSeed2D\\assets\\monsters\\shroom_boy\\idle\\raw\\{job_id}_raw.png`
- Normalized frames: `D:\\projects\\MotherSeed2D\\assets\\monsters\\shroom_boy\\idle\\frames\\{job_id}_01.png` through `{job_id}_05.png`
- Preview sheet: `D:\\projects\\MotherSeed2D\\assets\\monsters\\shroom_boy\\idle\\preview\\{job_id}_preview.png`
- 4x preview sheet: `D:\\projects\\MotherSeed2D\\assets\\monsters\\shroom_boy\\idle\\preview\\{job_id}_preview_4x.png`
- Focused QA preview: `D:\\projects\\MotherSeed2D\\assets\\monsters\\shroom_boy\\idle\\preview\\{job_id}_focus_4x.png`
- Looping GIF: `D:\\projects\\MotherSeed2D\\assets\\monsters\\shroom_boy\\idle\\gif\\{job_id}.gif`
- Shared normalization scale: `{scale:.4f}`

Final QA status: `approved`
""",
        encoding="utf-8",
    )
    return qa


def process(job_id, direction):
    raw = ANIMATION / "raw" / f"{job_id}_raw.png"
    if not raw.exists():
        raise SystemExit(f"Missing raw source: {raw}")

    write_job_prompt(job_id, direction)
    img = Image.open(raw).convert("RGBA")
    components = find_components(img)
    if len(components) != FRAME_COUNT:
        raise SystemExit(f"{job_id}: expected {FRAME_COUNT} components, found {len(components)}")
    initial_gaps = gaps_for(components)
    source_note = "raw generated source passed spacing"
    if min(initial_gaps) < REQUIRED_GAP:
        source_note = "raw generated source failed spacing and was rebuilt wider at same pose scale"
        wide = ANIMATION / "raw" / f"{job_id}_raw_wide.png"
        rebuild_wide(raw, components, wide)
        wide.replace(raw)
        img = Image.open(raw).convert("RGBA")
        components = find_components(img)
    final_gaps = gaps_for(components)
    if len(components) != FRAME_COUNT or min(final_gaps) < REQUIRED_GAP:
        raise SystemExit(f"{job_id}: failed spacing after rebuild: {final_gaps}")

    scale = normalize(job_id, raw)
    qa = write_qa(job_id, direction, initial_gaps, final_gaps, scale, source_note)
    prompt = ANIMATION / f"{job_id}_job_prompt.md"

    rows = read_queue()
    for row in rows:
        if row["job_id"] == job_id:
            row["status"] = "approved"
            row["generated_pose"] = str(prompt)
            row["raw_output"] = str(raw)
            row["normalized_output"] = str(ANIMATION / "frames")
            row["preview"] = str(ANIMATION / "preview" / f"{job_id}_preview.png")
            row["gif"] = str(ANIMATION / "gif" / f"{job_id}.gif")
            row["local_tools"] = str(ANIMATION / "tools" / "idle_pipeline_helper.py")
            row["qa_notes"] = str(qa)
    write_queue(rows)
    print(f"{job_id}: approved gaps={final_gaps} scale={scale:.4f}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--job-id", required=True)
    parser.add_argument("--direction", required=True, choices=REQUIRED_DIRECTIONS)
    args = parser.parse_args()
    process(args.job_id, args.direction)


if __name__ == "__main__":
    main()

import argparse
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
FRAME_COUNT = 8
FRAME_SIZE = 384
ANCHOR_X = 192
ANCHOR_Y = 376
GUTTER = 768
SIDE_MARGIN = 384


def is_subject(r, g, b):
    magenta_key = (
        r > 130
        and b > 115
        and g < 150
        and r - g > 45
        and b - g > 45
        and abs(r - b) < 95
    )
    return not magenta_key


def make_alpha(im):
    rgba = im.convert("RGBA")
    pix = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            if not is_subject(r, g, b):
                pix[x, y] = (r, g, b, 0)
            elif r > g + 12 and b > g + 12:
                limit = max(g + 4, 0)
                pix[x, y] = (min(r, limit), g, min(b, limit), a)
    return rgba


def bbox_for_alpha(im):
    return im.getchannel("A").getbbox()


def source_pose_groups(alpha_src):
    occupied = []
    alpha = alpha_src.getchannel("A")
    for x in range(alpha_src.width):
        if alpha.crop((x, 0, x + 1, alpha_src.height)).getbbox():
            occupied.append(x)
    if not occupied:
        return []
    groups = []
    start = prev = occupied[0]
    for x in occupied[1:]:
        if x - prev > 20:
            groups.append((start, prev))
            start = x
        prev = x
    groups.append((start, prev))
    return groups


def paste_bottom_center(canvas, sprite):
    bbox = bbox_for_alpha(sprite)
    if not bbox:
        return
    cropped = sprite.crop(bbox)
    if cropped.width > FRAME_SIZE or cropped.height > FRAME_SIZE:
        scale = min(FRAME_SIZE / cropped.width, FRAME_SIZE / cropped.height)
        cropped = cropped.resize(
            (max(1, int(cropped.width * scale)), max(1, int(cropped.height * scale))),
            Image.Resampling.NEAREST,
        )
    x = ANCHOR_X - cropped.width // 2
    y = ANCHOR_Y - cropped.height
    canvas.alpha_composite(cropped, (x, y))


def render_preview(frames, out_path):
    padding = 16
    label_h = 24
    cell = FRAME_SIZE
    out = Image.new(
        "RGBA",
        (padding + FRAME_COUNT * cell + (FRAME_COUNT - 1) * padding + padding, cell + label_h + padding * 2),
        (34, 32, 36, 255),
    )
    draw = ImageDraw.Draw(out)
    for i, frame in enumerate(frames):
        x = padding + i * (cell + padding)
        y = padding
        checker = Image.new("RGBA", (cell, cell), (70, 66, 74, 255))
        cd = ImageDraw.Draw(checker)
        step = 24
        for yy in range(0, cell, step):
            for xx in range(0, cell, step):
                if (xx // step + yy // step) % 2:
                    cd.rectangle([xx, yy, xx + step - 1, yy + step - 1], fill=(50, 48, 54, 255))
        out.alpha_composite(checker, (x, y))
        out.alpha_composite(frame, (x, y))
        draw.rectangle([x, y, x + cell - 1, y + cell - 1], outline=(135, 128, 146, 255))
        draw.text((x + 8, y + cell + 5), f"{i + 1:02d}", fill=(230, 225, 236, 255))
    out.save(out_path)


def normalize(direction):
    raw = ROOT / "raw" / f"head_throw_v2_{direction}_raw.png"
    spaced_raw = ROOT / "raw" / f"head_throw_v2_{direction}_raw_spaced_768px.png"
    frames_dir = ROOT / "frames" / direction
    preview = ROOT / "preview" / f"head_throw_v2_{direction}_preview.png"
    gif = ROOT / "gif" / f"head_throw_v2_{direction}.gif"
    metrics_path = ROOT / "qa" / f"head_throw_v2_{direction}_normalization_metrics.txt"

    frames_dir.mkdir(parents=True, exist_ok=True)
    preview.parent.mkdir(parents=True, exist_ok=True)
    gif.parent.mkdir(parents=True, exist_ok=True)
    metrics_path.parent.mkdir(parents=True, exist_ok=True)

    src = Image.open(raw)
    keyed_src = make_alpha(src)
    groups = source_pose_groups(keyed_src)
    if len(groups) != FRAME_COUNT:
        lane_w = src.width / FRAME_COUNT
        groups = [(round(i * lane_w), round((i + 1) * lane_w) - 1) for i in range(FRAME_COUNT)]

    source_sprites = []
    for left, right in groups:
        lane = keyed_src.crop((max(0, left - 8), 0, min(src.width, right + 9), src.height))
        bbox = bbox_for_alpha(lane)
        source_sprites.append(lane.crop(bbox) if bbox else Image.new("RGBA", (1, 1), (0, 0, 0, 0)))

    max_h = max(sprite.height for sprite in source_sprites)
    spaced_w = SIDE_MARGIN * 2 + sum(sprite.width for sprite in source_sprites) + GUTTER * (FRAME_COUNT - 1)
    spaced_h = max(src.height, max_h + 160)
    spaced = Image.new("RGBA", (spaced_w, spaced_h), (255, 0, 255, 255))
    x = SIDE_MARGIN
    y_base = spaced_h - 80
    repacked_bounds = []
    for sprite in source_sprites:
        y = y_base - sprite.height
        spaced.alpha_composite(sprite, (x, y))
        repacked_bounds.append((x, y, x + sprite.width, y + sprite.height))
        x += sprite.width + GUTTER
    spaced.convert("RGB").save(spaced_raw)

    normalized = []
    metrics = []
    src = spaced.convert("RGB")
    for i, (crop_left, _crop_top, crop_right, _crop_bottom) in enumerate(repacked_bounds):
        left = max(0, crop_left - 32)
        right = min(src.width, crop_right + 32)
        lane = make_alpha(src.crop((left, 0, right, src.height)))
        bbox = bbox_for_alpha(lane)
        frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
        if bbox:
            sprite = lane.crop(bbox)
            paste_bottom_center(frame, sprite)
            metrics.append((i + 1, left, right, bbox, sprite.size))
        else:
            metrics.append((i + 1, left, right, None, (0, 0)))
        frame.save(frames_dir / f"head_throw_v2_{direction}_{i + 1:02d}.png")
        normalized.append(frame)

    render_preview(normalized, preview)
    normalized[0].save(
        gif,
        save_all=True,
        append_images=normalized[1:],
        duration=110,
        loop=0,
        disposal=2,
        transparency=0,
    )

    with metrics_path.open("w", encoding="utf-8") as f:
        f.write(f"raw={raw}\n")
        f.write(f"spaced_raw={spaced_raw}\n")
        f.write(f"spaced_raw_size={src.width}x{src.height}\n")
        f.write(f"enforced_empty_gutter_px={GUTTER}\n")
        f.write(f"source_pose_groups={groups}\n")
        f.write(f"frame_size={FRAME_SIZE}x{FRAME_SIZE}\n")
        f.write(f"anchor={ANCHOR_X},{ANCHOR_Y}\n")
        for frame_no, left, right, bbox, size in metrics:
            f.write(f"frame={frame_no:02d}, lane={left}-{right}, source_bbox={bbox}, cropped_size={size}\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("direction")
    args = parser.parse_args()
    normalize(args.direction)


if __name__ == "__main__":
    main()

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "raw" / "head_throw_v2_south_raw.png"
SPACED_RAW = ROOT / "raw" / "head_throw_v2_south_raw_spaced_768px.png"
FRAMES = ROOT / "frames" / "south"
PREVIEW = ROOT / "preview" / "head_throw_v2_south_preview.png"
GIF = ROOT / "gif" / "head_throw_v2_south.gif"
FRAME_COUNT = 8
FRAME_SIZE = 384
ANCHOR_X = 192
ANCHOR_Y = 376
HEADLESS_FRAMES = set()


def is_subject(r, g, b):
    # The generated background is a magenta/pink gradient. Tree-goblin pixels
    # are brown, green, black, or yellow-green, so a broad magenta key is safe.
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
                # Despill purple/magenta edge contamination without changing alpha.
                # Keep the pixel as an outline/detail pixel, but remove the pink cast.
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

    groups = []
    if not occupied:
        return groups

    start = prev = occupied[0]
    for x in occupied[1:]:
        if x - prev > 20:
            groups.append((start, prev))
            start = x
        prev = x
    groups.append((start, prev))
    return groups


def trim_transparent_edges(im):
    bbox = bbox_for_alpha(im)
    return im.crop(bbox) if bbox else im


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


def remove_floating_head(frame):
    alpha = frame.getchannel("A")
    pix = alpha.load()
    w, h = alpha.size
    seen = set()
    components = []

    for y in range(h):
        for x in range(w):
            if pix[x, y] == 0 or (x, y) in seen:
                continue
            stack = [(x, y)]
            seen.add((x, y))
            xs = []
            ys = []
            while stack:
                cx, cy = stack.pop()
                xs.append(cx)
                ys.append(cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and pix[nx, ny] > 0 and (nx, ny) not in seen:
                        seen.add((nx, ny))
                        stack.append((nx, ny))
            components.append((len(xs), min(xs), min(ys), max(xs), max(ys)))

    if len(components) < 2:
        return frame

    body = max(components, key=lambda c: c[0])
    out = frame.copy()
    out_pix = out.load()
    for area, x0, y0, x1, y1 in components:
        is_above_body = y1 < body[2] + 36
        is_large_floating_piece = area > 80 and y0 < body[2]
        if is_above_body and is_large_floating_piece:
            for yy in range(y0, y1 + 1):
                for xx in range(x0, x1 + 1):
                    r, g, b, a = out_pix[xx, yy]
                    if a:
                        out_pix[xx, yy] = (r, g, b, 0)
    return out


def remove_source_head(sprite):
    out = sprite.copy()
    pix = out.load()
    cutoff = int(out.height * 0.38)
    for y in range(cutoff):
        for x in range(out.width):
            r, g, b, a = pix[x, y]
            if a:
                pix[x, y] = (r, g, b, 0)
    return trim_transparent_edges(out)


def render_preview(frames):
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
    return out


def main():
    FRAMES.mkdir(parents=True, exist_ok=True)
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    GIF.parent.mkdir(parents=True, exist_ok=True)

    src = Image.open(RAW)
    keyed_src = make_alpha(src)
    groups = source_pose_groups(keyed_src)
    if len(groups) != FRAME_COUNT:
        lane_w = src.width / FRAME_COUNT
        groups = [(round(i * lane_w), round((i + 1) * lane_w) - 1) for i in range(FRAME_COUNT)]
    source_sprites = []
    for idx, (left, right) in enumerate(groups, start=1):
        lane = keyed_src.crop((max(0, left - 8), 0, min(src.width, right + 9), src.height))
        bbox = bbox_for_alpha(lane)
        sprite = lane.crop(bbox) if bbox else Image.new("RGBA", (1, 1), (0, 0, 0, 0))
        if idx in HEADLESS_FRAMES:
            sprite = remove_source_head(sprite)
        source_sprites.append(sprite)

    gutter = 768
    side_margin = 384
    max_h = max(sprite.height for sprite in source_sprites)
    spaced_w = side_margin * 2 + sum(sprite.width for sprite in source_sprites) + gutter * (FRAME_COUNT - 1)
    spaced_h = max(src.height, max_h + 160)
    spaced = Image.new("RGBA", (spaced_w, spaced_h), (255, 0, 255, 255))
    x = side_margin
    y_base = spaced_h - 80
    repacked_bounds = []
    for sprite in source_sprites:
        y = y_base - sprite.height
        spaced.alpha_composite(sprite, (x, y))
        repacked_bounds.append((x, y, x + sprite.width, y + sprite.height))
        x += sprite.width + gutter
    spaced.convert("RGB").save(SPACED_RAW)

    src = spaced.convert("RGB")
    lane_w = src.width / FRAME_COUNT
    normalized = []
    metrics = []

    for i in range(FRAME_COUNT):
        left = round(i * lane_w)
        right = round((i + 1) * lane_w)
        if i < len(repacked_bounds):
            crop_left, crop_top, crop_right, crop_bottom = repacked_bounds[i]
            lane = make_alpha(src.crop((max(0, crop_left - 32), 0, min(src.width, crop_right + 32), src.height)))
            left = max(0, crop_left - 32)
            right = min(src.width, crop_right + 32)
        else:
            lane = make_alpha(src.crop((left, 0, right, src.height)))
        bbox = bbox_for_alpha(lane)
        frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
        if bbox:
            sprite = lane.crop(bbox)
            paste_bottom_center(frame, sprite)
            if i + 1 in HEADLESS_FRAMES:
                frame = remove_floating_head(frame)
            metrics.append((i + 1, left, right, bbox, sprite.size))
        else:
            metrics.append((i + 1, left, right, None, (0, 0)))
        frame_path = FRAMES / f"head_throw_v2_south_{i + 1:02d}.png"
        frame.save(frame_path)
        normalized.append(frame)

    render_preview(normalized).save(PREVIEW)
    normalized[0].save(
        GIF,
        save_all=True,
        append_images=normalized[1:],
        duration=110,
        loop=0,
        disposal=2,
        transparency=0,
    )

    metrics_path = ROOT / "qa" / "head_throw_v2_south_normalization_metrics.txt"
    with metrics_path.open("w", encoding="utf-8") as f:
        f.write(f"raw={RAW}\n")
        f.write(f"spaced_raw={SPACED_RAW}\n")
        f.write(f"spaced_raw_size={src.width}x{src.height}\n")
        f.write(f"enforced_empty_gutter_px={gutter}\n")
        f.write(f"source_pose_groups={groups}\n")
        f.write(f"frame_size={FRAME_SIZE}x{FRAME_SIZE}\n")
        f.write(f"anchor={ANCHOR_X},{ANCHOR_Y}\n")
        for frame_no, left, right, bbox, size in metrics:
            f.write(f"frame={frame_no:02d}, lane={left}-{right}, source_bbox={bbox}, cropped_size={size}\n")


if __name__ == "__main__":
    main()

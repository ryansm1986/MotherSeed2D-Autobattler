from pathlib import Path

from PIL import Image, ImageChops


ROOT = Path(r"D:\projects\MotherSeed2D\assets\monsters\tree_goblin")
ANIM = ROOT / "idle"
JOB_ID = "idle_south"
SOURCE = ANIM / "raw" / "idle_south_generated_candidate_03_base_locked.png"
RAW = ANIM / "raw" / "idle_south_raw.png"
RAW_ALPHA = ANIM / "raw" / "idle_south_raw_transparent.png"
FRAMES = ANIM / "frames"
PREVIEW = ANIM / "preview"
GIF = ANIM / "gif" / "idle_south.gif"

FRAME_W = 128
FRAME_H = 128
ANCHOR_X = 64
ANCHOR_Y = 120
MIN_TOP_SIDE_PADDING = 12
MIN_SOURCE_SPACING = 384
PREFERRED_SOURCE_SPACING = 768
SIDE_GUTTER = 768
TOP_BOTTOM_GUTTER = 256
MAGENTA = (255, 0, 255, 255)


def is_magenta(px):
    r, g, b, a = px
    return r > 180 and g < 80 and b > 180 and abs(r - b) < 80


def extract_pose_groups(img):
    w, h = img.size
    visible_columns = []
    for x in range(w):
        for y in range(h):
            if not is_magenta(img.getpixel((x, y))):
                visible_columns.append(x)
                break

    groups = []
    start = prev = None
    for x in visible_columns:
        if start is None:
            start = prev = x
        elif x - prev <= 20:
            prev = x
        else:
            if prev - start > 30:
                groups.append((start, prev))
            start = prev = x
    if start is not None and prev - start > 30:
        groups.append((start, prev))

    poses = []
    for x0, x1 in groups:
        col_crop = img.crop((x0, 0, x1 + 1, h))
        alpha = Image.new("RGBA", col_crop.size, (0, 0, 0, 0))
        pix = col_crop.load()
        out = alpha.load()
        for y in range(col_crop.height):
            for x in range(col_crop.width):
                px = pix[x, y]
                if not is_magenta(px):
                    out[x, y] = px
        bbox = alpha.getbbox()
        if bbox:
            poses.append(alpha.crop(bbox))
    if len(poses) != 5:
        raise RuntimeError(f"Expected 5 pose groups, found {len(poses)}")
    return poses


def repack_raw(poses):
    width = (SIDE_GUTTER * 2) + sum(p.width for p in poses) + PREFERRED_SOURCE_SPACING * (len(poses) - 1)
    height = max(p.height for p in poses) + TOP_BOTTOM_GUTTER * 2
    y_floor = height - TOP_BOTTOM_GUTTER
    raw = Image.new("RGBA", (width, height), MAGENTA)
    alpha = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    bboxes = []
    x = SIDE_GUTTER
    for pose in poses:
        y = y_floor - pose.height
        raw.alpha_composite(pose, (x, y))
        alpha.alpha_composite(pose, (x, y))
        bboxes.append((x, y, x + pose.width, y + pose.height))
        x += pose.width + PREFERRED_SOURCE_SPACING
    RAW.parent.mkdir(parents=True, exist_ok=True)
    raw.convert("RGB").save(RAW)
    alpha.save(RAW_ALPHA)
    gaps = [bboxes[i + 1][0] - bboxes[i][2] for i in range(len(bboxes) - 1)]
    return gaps, raw.size


def normalize(poses):
    FRAMES.mkdir(parents=True, exist_ok=True)
    max_w = max(p.width for p in poses)
    max_h = max(p.height for p in poses)
    scale = min((FRAME_W - MIN_TOP_SIDE_PADDING * 2) / max_w, (ANCHOR_Y - MIN_TOP_SIDE_PADDING) / max_h)
    paths = []
    bounds = []
    for i, pose in enumerate(poses, start=1):
        resized = pose.resize(
            (max(1, round(pose.width * scale)), max(1, round(pose.height * scale))),
            Image.Resampling.LANCZOS,
        )
        frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        x = ANCHOR_X - resized.width // 2
        y = ANCHOR_Y - resized.height
        frame.alpha_composite(resized, (x, y))
        out = FRAMES / f"{JOB_ID}_{i:02d}.png"
        frame.save(out)
        paths.append(out)
        bounds.append(frame.getbbox())
    return paths, bounds, scale


def previews(frame_paths):
    PREVIEW.mkdir(parents=True, exist_ok=True)
    frames = [Image.open(p).convert("RGBA") for p in frame_paths]
    sheet = Image.new("RGBA", (FRAME_W * len(frames), FRAME_H), (0, 0, 0, 0))
    focused = Image.new("RGBA", sheet.size, MAGENTA)
    for i, frame in enumerate(frames):
        sheet.alpha_composite(frame, (i * FRAME_W, 0))
        focused.alpha_composite(frame, (i * FRAME_W, 0))
    sheet.save(PREVIEW / f"{JOB_ID}_preview.png")
    sheet.resize((sheet.width * 4, sheet.height * 4), Image.Resampling.NEAREST).save(
        PREVIEW / f"{JOB_ID}_preview_4x.png"
    )
    focused.resize((focused.width * 4, focused.height * 4), Image.Resampling.NEAREST).save(
        PREVIEW / f"{JOB_ID}_focused_qa_4x.png"
    )
    gif_frames = [
        Image.alpha_composite(Image.new("RGBA", frame.size, MAGENTA), frame).convert("P", palette=Image.Palette.ADAPTIVE)
        for frame in frames
    ]
    GIF.parent.mkdir(parents=True, exist_ok=True)
    gif_frames[0].save(GIF, save_all=True, append_images=gif_frames[1:], duration=160, loop=0, disposal=2)


def main():
    img = Image.open(SOURCE).convert("RGBA")
    poses = extract_pose_groups(img)
    gaps, raw_size = repack_raw(poses)
    paths, bounds, scale = normalize(poses)
    previews(paths)
    if any(g < MIN_SOURCE_SPACING for g in gaps):
        raise RuntimeError(f"Repacked source gaps failed: {gaps}")
    print(f"accepted_source={SOURCE}")
    print(f"raw={RAW}")
    print(f"raw_transparent={RAW_ALPHA}")
    print(f"raw_size={raw_size[0]}x{raw_size[1]}")
    print(f"repacked_source_gaps={','.join(str(g) for g in gaps)}")
    print(f"normalize_scale={scale:.6f}")
    print("frame_bounds=" + ";".join(str(b) for b in bounds))
    print(f"preview={PREVIEW / f'{JOB_ID}_preview.png'}")
    print(f"preview_4x={PREVIEW / f'{JOB_ID}_preview_4x.png'}")
    print(f"focused_qa_4x={PREVIEW / f'{JOB_ID}_focused_qa_4x.png'}")
    print(f"gif={GIF}")


if __name__ == "__main__":
    main()

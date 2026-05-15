from argparse import ArgumentParser
from pathlib import Path

from PIL import Image


ROOT = Path(r"D:\projects\MotherSeed2D\assets\monsters\tree_goblin")
ANIM = ROOT / "idle"
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


def is_key(px):
    r, g, b, a = px
    return r > 175 and g < 90 and b > 175 and abs(r - b) < 95


def extract_pose_groups(img):
    w, h = img.size
    cols = []
    for x in range(w):
        for y in range(h):
            if not is_key(img.getpixel((x, y))):
                cols.append(x)
                break
    groups = []
    start = prev = None
    for x in cols:
        if start is None:
            start = prev = x
        elif x - prev <= 24:
            prev = x
        else:
            if prev - start > 30:
                groups.append((start, prev))
            start = prev = x
    if start is not None and prev - start > 30:
        groups.append((start, prev))
    if len(groups) != 5:
        raise RuntimeError(f"Expected 5 pose column groups, found {len(groups)}: {groups}")

    poses = []
    for x0, x1 in groups:
        crop = img.crop((x0, 0, x1 + 1, h))
        alpha = Image.new("RGBA", crop.size, (0, 0, 0, 0))
        src = crop.load()
        dst = alpha.load()
        for y in range(crop.height):
            for x in range(crop.width):
                px = src[x, y]
                if not is_key(px):
                    dst[x, y] = px
        bbox = alpha.getbbox()
        if bbox is None:
            raise RuntimeError("Encountered empty pose after chroma-key removal.")
        poses.append(alpha.crop(bbox))
    return poses, groups


def repack(job_id, poses):
    raw_path = ANIM / "raw" / f"{job_id}_raw.png"
    alpha_path = ANIM / "raw" / f"{job_id}_raw_transparent.png"
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
    raw.convert("RGB").save(raw_path)
    alpha.save(alpha_path)
    gaps = [bboxes[i + 1][0] - bboxes[i][2] for i in range(len(bboxes) - 1)]
    return raw_path, alpha_path, raw.size, gaps


def normalize(job_id, poses):
    frames_dir = ANIM / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)
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
        frame.alpha_composite(resized, (ANCHOR_X - resized.width // 2, ANCHOR_Y - resized.height))
        out = frames_dir / f"{job_id}_{i:02d}.png"
        frame.save(out)
        paths.append(out)
        bounds.append(frame.getbbox())
    return paths, bounds, scale


def render(job_id, frame_paths):
    preview_dir = ANIM / "preview"
    gif_path = ANIM / "gif" / f"{job_id}.gif"
    preview_dir.mkdir(parents=True, exist_ok=True)
    gif_path.parent.mkdir(parents=True, exist_ok=True)
    frames = [Image.open(p).convert("RGBA") for p in frame_paths]
    sheet = Image.new("RGBA", (FRAME_W * len(frames), FRAME_H), (0, 0, 0, 0))
    focused = Image.new("RGBA", sheet.size, MAGENTA)
    for i, frame in enumerate(frames):
        sheet.alpha_composite(frame, (i * FRAME_W, 0))
        focused.alpha_composite(frame, (i * FRAME_W, 0))
    preview = preview_dir / f"{job_id}_preview.png"
    preview_4x = preview_dir / f"{job_id}_preview_4x.png"
    focused_4x = preview_dir / f"{job_id}_focused_qa_4x.png"
    sheet.save(preview)
    sheet.resize((sheet.width * 4, sheet.height * 4), Image.Resampling.NEAREST).save(preview_4x)
    focused.resize((focused.width * 4, focused.height * 4), Image.Resampling.NEAREST).save(focused_4x)
    gif_frames = [
        Image.alpha_composite(Image.new("RGBA", frame.size, MAGENTA), frame).convert("P", palette=Image.Palette.ADAPTIVE)
        for frame in frames
    ]
    gif_frames[0].save(gif_path, save_all=True, append_images=gif_frames[1:], duration=160, loop=0, disposal=2)
    return preview, preview_4x, focused_4x, gif_path


def main():
    parser = ArgumentParser()
    parser.add_argument("--job-id", required=True)
    parser.add_argument("--source", required=True)
    args = parser.parse_args()
    source = Path(args.source)
    poses, source_groups = extract_pose_groups(Image.open(source).convert("RGBA"))
    raw, raw_alpha, raw_size, gaps = repack(args.job_id, poses)
    if any(g < MIN_SOURCE_SPACING for g in gaps):
        raise RuntimeError(f"Repacked gaps failed: {gaps}")
    frame_paths, bounds, scale = normalize(args.job_id, poses)
    preview, preview_4x, focused_4x, gif = render(args.job_id, frame_paths)
    print(f"job_id={args.job_id}")
    print(f"accepted_source={source}")
    print(f"source_groups={source_groups}")
    print(f"raw={raw}")
    print(f"raw_transparent={raw_alpha}")
    print(f"raw_size={raw_size[0]}x{raw_size[1]}")
    print(f"repacked_source_gaps={','.join(str(g) for g in gaps)}")
    print(f"normalize_scale={scale:.6f}")
    print("frame_bounds=" + ";".join(str(b) for b in bounds))
    print(f"preview={preview}")
    print(f"preview_4x={preview_4x}")
    print(f"focused_qa_4x={focused_4x}")
    print(f"gif={gif}")


if __name__ == "__main__":
    main()

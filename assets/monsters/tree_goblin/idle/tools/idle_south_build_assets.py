from pathlib import Path
import math

from PIL import Image, ImageChops


ROOT = Path(r"D:\projects\MotherSeed2D\assets\monsters\tree_goblin")
BASE = ROOT / "base" / "south.png"
ANIM = ROOT / "idle"
RAW = ANIM / "raw" / "idle_south_raw.png"
RAW_TRANSPARENT = ANIM / "raw" / "idle_south_raw_transparent.png"
FRAMES = ANIM / "frames"
PREVIEW = ANIM / "preview"
GIF = ANIM / "gif" / "idle_south.gif"

JOB_ID = "idle_south"
FRAME_COUNT = 5
FRAME_W = 128
FRAME_H = 128
ANCHOR_X = 64
ANCHOR_Y = 120
MIN_TOP_SIDE_PADDING = 12
MIN_SOURCE_SPACING = 384
RAW_GUTTER = 512
MAGENTA = (255, 0, 255, 255)


def alpha_from_white(source: Image.Image) -> Image.Image:
    rgba = source.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            near_white = r >= 244 and g >= 244 and b >= 244 and max(r, g, b) - min(r, g, b) <= 14
            if near_white:
                pixels[x, y] = (r, g, b, 0)
    bbox = rgba.getbbox()
    if bbox is None:
        raise RuntimeError("Base image did not produce a visible alpha mask.")
    return rgba.crop(bbox)


def horizontal_warp(img: Image.Image, amplitude: float, lift: int, breathe: float) -> Image.Image:
    w, h = img.size
    scaled_h = max(1, int(round(h * breathe)))
    scaled_w = max(1, int(round(w * (1.0 + (breathe - 1.0) * 0.18))))
    scaled = img.resize((scaled_w, scaled_h), Image.Resampling.BICUBIC)
    canvas = Image.new("RGBA", (w + 80, h + 80), (0, 0, 0, 0))
    paste_x = (canvas.width - scaled.width) // 2
    paste_y = canvas.height - 40 - scaled.height + lift
    canvas.alpha_composite(scaled, (paste_x, paste_y))

    warped = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    max_y = max(1, canvas.height - 1)
    for y in range(canvas.height):
        top_weight = 1.0 - (y / max_y)
        offset = int(round(amplitude * (top_weight ** 1.7) * math.sin((y / max_y) * math.pi)))
        row = canvas.crop((0, y, canvas.width, y + 1))
        warped.alpha_composite(row, (offset, y))
    bbox = warped.getbbox()
    if bbox is None:
        raise RuntimeError("Warp produced an empty frame.")
    return warped.crop(bbox)


def visible_bbox_on_magenta(img: Image.Image):
    rgba = img.convert("RGBA")
    bg = Image.new("RGBA", rgba.size, MAGENTA)
    diff = ImageChops.difference(rgba, bg)
    return diff.getbbox()


def save_raw_strip(poses):
    widths = [p.width for p in poses]
    height = max(p.height for p in poses) + (RAW_GUTTER * 2)
    width = (RAW_GUTTER * 2) + sum(widths) + (MIN_SOURCE_SPACING * (len(poses) - 1))
    strip = Image.new("RGBA", (width, height), MAGENTA)
    strip_alpha = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    x = RAW_GUTTER
    y_floor = height - RAW_GUTTER
    bboxes = []
    for pose in poses:
        y = y_floor - pose.height
        strip.alpha_composite(pose, (x, y))
        strip_alpha.alpha_composite(pose, (x, y))
        bboxes.append((x, y, x + pose.width, y + pose.height))
        x += pose.width + MIN_SOURCE_SPACING
    RAW.parent.mkdir(parents=True, exist_ok=True)
    strip.convert("RGB").save(RAW)
    strip_alpha.save(RAW_TRANSPARENT)
    return bboxes, strip.size


def normalize_frames(poses):
    FRAMES.mkdir(parents=True, exist_ok=True)
    max_w = max(p.width for p in poses)
    max_h = max(p.height for p in poses)
    scale = min(
        (FRAME_W - (MIN_TOP_SIDE_PADDING * 2)) / max_w,
        (ANCHOR_Y - MIN_TOP_SIDE_PADDING) / max_h,
    )
    out_paths = []
    for i, pose in enumerate(poses, start=1):
        resized = pose.resize(
            (max(1, int(round(pose.width * scale))), max(1, int(round(pose.height * scale)))),
            Image.Resampling.LANCZOS,
        )
        frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        x = ANCHOR_X - resized.width // 2
        y = ANCHOR_Y - resized.height
        frame.alpha_composite(resized, (x, y))
        out = FRAMES / f"{JOB_ID}_{i:02d}.png"
        frame.save(out)
        out_paths.append(out)
    return out_paths, scale


def render_previews(frame_paths):
    PREVIEW.mkdir(parents=True, exist_ok=True)
    frames = [Image.open(p).convert("RGBA") for p in frame_paths]
    sheet = Image.new("RGBA", (FRAME_W * len(frames), FRAME_H), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        sheet.alpha_composite(frame, (i * FRAME_W, 0))
    sheet.save(PREVIEW / "idle_south_preview.png")

    scale = 4
    enlarged = sheet.resize((sheet.width * scale, sheet.height * scale), Image.Resampling.NEAREST)
    enlarged.save(PREVIEW / "idle_south_preview_4x.png")

    focused = Image.new("RGBA", (FRAME_W * len(frames), FRAME_H), (255, 0, 255, 255))
    for i, frame in enumerate(frames):
        focused.alpha_composite(frame, (i * FRAME_W, 0))
    focused.resize((focused.width * scale, focused.height * scale), Image.Resampling.NEAREST).save(
        PREVIEW / "idle_south_focused_qa_4x.png"
    )

    gif_frames = [
        Image.alpha_composite(Image.new("RGBA", frame.size, (255, 0, 255, 255)), frame).convert("P", palette=Image.Palette.ADAPTIVE)
        for frame in frames
    ]
    GIF.parent.mkdir(parents=True, exist_ok=True)
    gif_frames[0].save(GIF, save_all=True, append_images=gif_frames[1:], duration=160, loop=0, disposal=2)


def main():
    base = alpha_from_white(Image.open(BASE))
    poses = [
        horizontal_warp(base, amplitude=0, lift=0, breathe=1.000),
        horizontal_warp(base, amplitude=4, lift=-10, breathe=1.012),
        horizontal_warp(base, amplitude=-12, lift=-4, breathe=1.006),
        horizontal_warp(base, amplitude=-3, lift=5, breathe=0.992),
        horizontal_warp(base, amplitude=12, lift=-2, breathe=1.004),
    ]
    bboxes, raw_size = save_raw_strip(poses)
    frame_paths, scale = normalize_frames(poses)
    render_previews(frame_paths)

    gaps = [bboxes[i + 1][0] - bboxes[i][2] for i in range(len(bboxes) - 1)]
    print(f"raw={RAW}")
    print(f"raw_transparent={RAW_TRANSPARENT}")
    print(f"raw_size={raw_size[0]}x{raw_size[1]}")
    print(f"source_gaps={','.join(str(g) for g in gaps)}")
    print(f"normalize_scale={scale:.6f}")
    print(f"frames={';'.join(str(p) for p in frame_paths)}")
    print(f"preview={PREVIEW / 'idle_south_preview.png'}")
    print(f"preview_4x={PREVIEW / 'idle_south_preview_4x.png'}")
    print(f"focused_qa_4x={PREVIEW / 'idle_south_focused_qa_4x.png'}")
    print(f"gif={GIF}")


if __name__ == "__main__":
    main()

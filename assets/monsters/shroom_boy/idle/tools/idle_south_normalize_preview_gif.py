from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw


SRC = Path(r"D:\projects\MotherSeed2D\assets\monsters\shroom_boy\idle\raw\idle_south_raw.png")
FRAMES_DIR = Path(r"D:\projects\MotherSeed2D\assets\monsters\shroom_boy\idle\frames")
PREVIEW_DIR = Path(r"D:\projects\MotherSeed2D\assets\monsters\shroom_boy\idle\preview")
GIF_DIR = Path(r"D:\projects\MotherSeed2D\assets\monsters\shroom_boy\idle\gif")
JOB_ID = "idle_south"
FRAME_COUNT = 5
FRAME_W = 128
FRAME_H = 128
ANCHOR_X = 64
ANCHOR_Y = 120
MIN_TOP_PADDING = 12
MIN_SIDE_PADDING = 12
KEY = (255, 0, 255, 255)


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
                components.append((min_x, min_y, max_x, max_y))
    components.sort(key=lambda item: item[0])
    return components


def crop_to_alpha(img, box):
    min_x, min_y, max_x, max_y = box
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


def checker(size, cell=8):
    img = Image.new("RGBA", size, (235, 235, 235, 255))
    draw = ImageDraw.Draw(img)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=(205, 205, 205, 255))
    return img


src = Image.open(SRC).convert("RGBA")
components = find_components(src)
if len(components) != FRAME_COUNT:
    raise SystemExit(f"Expected {FRAME_COUNT} source poses, found {len(components)}")

poses = [crop_to_alpha(src, box) for box in components]
max_w = max(p.width for p in poses)
max_h = max(p.height for p in poses)
scale = min(
    (FRAME_W - 2 * MIN_SIDE_PADDING) / max_w,
    (ANCHOR_Y - MIN_TOP_PADDING) / max_h,
)

FRAMES_DIR.mkdir(parents=True, exist_ok=True)
PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
GIF_DIR.mkdir(parents=True, exist_ok=True)

frames = []
for i, pose in enumerate(poses, 1):
    new_size = (max(1, round(pose.width * scale)), max(1, round(pose.height * scale)))
    resized = pose.resize(new_size, Image.Resampling.NEAREST)
    frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    x = round(ANCHOR_X - resized.width / 2)
    y = round(ANCHOR_Y - resized.height)
    frame.alpha_composite(resized, (x, y))
    out_path = FRAMES_DIR / f"{JOB_ID}_{i:02d}.png"
    frame.save(out_path)
    frames.append(frame)

sheet = Image.new("RGBA", (FRAME_W * FRAME_COUNT, FRAME_H), (0, 0, 0, 0))
for i, frame in enumerate(frames):
    sheet.alpha_composite(frame, (i * FRAME_W, 0))
sheet.save(PREVIEW_DIR / f"{JOB_ID}_preview.png")

sheet_bg = checker((FRAME_W * FRAME_COUNT, FRAME_H))
sheet_bg.alpha_composite(sheet)
sheet_bg.resize((sheet_bg.width * 4, sheet_bg.height * 4), Image.Resampling.NEAREST).save(
    PREVIEW_DIR / f"{JOB_ID}_preview_4x.png"
)

focus_w = FRAME_W * FRAME_COUNT * 4
focus_h = FRAME_H * 4
focus = checker((focus_w, focus_h), cell=16)
focus.alpha_composite(sheet.resize((focus_w, focus_h), Image.Resampling.NEAREST))
draw = ImageDraw.Draw(focus)
for x in range(0, focus_w + 1, FRAME_W * 4):
    draw.line((x, 0, x, focus_h), fill=(255, 0, 255, 255), width=2)
focus.save(PREVIEW_DIR / f"{JOB_ID}_focus_4x.png")

gif_frames = [f.convert("P", palette=Image.Palette.ADAPTIVE, colors=255) for f in frames]
gif_frames[0].save(
    GIF_DIR / f"{JOB_ID}.gif",
    save_all=True,
    append_images=gif_frames[1:],
    duration=160,
    loop=0,
    disposal=2,
    transparency=0,
)

print(f"scale={scale:.4f}")
print(f"frames={len(frames)}")
print(f"frame_size={FRAME_W}x{FRAME_H}")
print(f"preview={PREVIEW_DIR / (JOB_ID + '_preview.png')}")
print(f"gif={GIF_DIR / (JOB_ID + '.gif')}")

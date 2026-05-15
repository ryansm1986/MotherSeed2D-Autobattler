from collections import deque
from pathlib import Path
from PIL import Image


SRC = Path(r"D:\projects\MotherSeed2D\assets\monsters\shroom_boy\idle\raw\idle_south_raw.png")
OUT = Path(r"D:\projects\MotherSeed2D\assets\monsters\shroom_boy\idle\raw\idle_south_raw_wide.png")
KEY = (255, 0, 255, 255)
TARGET_GAP = 320
SIDE_GUTTER = 320


def is_key(pixel):
    r, g, b, a = pixel
    return r >= 180 and b >= 180 and g <= 120


img = Image.open(SRC).convert("RGBA")
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
if len(components) != 5:
    raise SystemExit(f"Expected 5 source poses, found {len(components)}")

pose_images = []
for box in components:
    min_x, min_y, max_x, max_y = box
    crop = img.crop((min_x, min_y, max_x + 1, max_y + 1))
    alpha = Image.new("L", crop.size, 0)
    crop_pixels = crop.load()
    alpha_pixels = alpha.load()
    for y in range(crop.height):
        for x in range(crop.width):
            r, g, b, a = crop_pixels[x, y]
            if a > 0 and not is_key((r, g, b, a)):
                alpha_pixels[x, y] = 255
            else:
                crop_pixels[x, y] = KEY
    crop.putalpha(alpha)
    pose_images.append((crop, box))

new_w = SIDE_GUTTER * 2 + sum(p.width for p, _ in pose_images) + TARGET_GAP * (len(pose_images) - 1)
new_h = h
out = Image.new("RGBA", (new_w, new_h), KEY)
x_cursor = SIDE_GUTTER
for pose, box in pose_images:
    _, min_y, _, _ = box
    out.alpha_composite(pose, (x_cursor, min_y))
    x_cursor += pose.width + TARGET_GAP

OUT.parent.mkdir(parents=True, exist_ok=True)
out.save(OUT)
print(f"wrote={OUT}")
print(f"size={new_w}x{new_h}")
print(f"target_gap={TARGET_GAP}")

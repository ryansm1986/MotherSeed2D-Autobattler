from collections import deque
from pathlib import Path
from PIL import Image


IMAGE = Path(r"D:\projects\MotherSeed2D\assets\monsters\shroom_boy\idle\raw\idle_south_raw.png")


def is_key(pixel):
    r, g, b, *rest = pixel
    return r >= 180 and b >= 180 and g <= 120


img = Image.open(IMAGE).convert("RGBA")
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
gaps = []
for left, right in zip(components, components[1:]):
    gaps.append(right[0] - left[2] - 1)

top = min((c[1] for c in components), default=None)
bottom = max((c[3] for c in components), default=None)
left_edge = min((c[0] for c in components), default=None)
right_edge = max((c[2] for c in components), default=None)

print(f"image={IMAGE}")
print(f"size={w}x{h}")
print(f"components={len(components)}")
for i, component in enumerate(components, 1):
    min_x, min_y, max_x, max_y, count = component
    print(f"component_{i}=x:{min_x}-{max_x} y:{min_y}-{max_y} w:{max_x-min_x+1} h:{max_y-min_y+1} pixels:{count}")
print(f"gaps={gaps}")
print(f"edge_margins=left:{left_edge} right:{w - right_edge - 1 if right_edge is not None else None} top:{top} bottom:{h - bottom - 1 if bottom is not None else None}")

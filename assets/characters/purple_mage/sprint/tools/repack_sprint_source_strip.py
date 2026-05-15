from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


KEY = np.array([0, 255, 0, 255], dtype=np.uint8)


def make_background_mask(arr: np.ndarray) -> np.ndarray:
    r = arr[..., 0].astype(np.int16)
    g = arr[..., 1].astype(np.int16)
    b = arr[..., 2].astype(np.int16)
    a = arr[..., 3]
    return (
        (a == 0)
        | (
            (g > 115)
            & (r < 105)
            & (b < 105)
            & ((g - r) > 65)
            & ((g - b) > 65)
        )
    )


def detect_runs(fg: np.ndarray, frame_count: int) -> list[tuple[int, int]]:
    cols = np.where(fg.any(axis=0))[0]
    if len(cols) == 0:
        raise SystemExit("No foreground detected")

    runs: list[tuple[int, int]] = []
    start = int(cols[0])
    prev = int(cols[0])
    for raw_x in cols[1:]:
        x = int(raw_x)
        if x - prev > 8:
            runs.append((start, prev))
            start = x
        prev = x
    runs.append((start, prev))

    primary = [run for run in runs if run[1] - run[0] + 1 > 40]
    if len(primary) != frame_count:
        raise SystemExit(f"Expected {frame_count} pose runs, found {len(primary)}: {primary}")
    return primary


def repack(source: Path, out: Path, frame_count: int, gap: int, margin_x: int) -> dict[str, object]:
    img = Image.open(source).convert("RGBA")
    arr = np.array(img)
    bg = make_background_mask(arr)
    fg = ~bg
    runs = detect_runs(fg, frame_count)

    crops: list[Image.Image] = []
    for x0, x1 in runs:
        sub = fg[:, x0 : x1 + 1]
        ys, _xs = np.where(sub)
        y0 = int(ys.min())
        y1 = int(ys.max())
        pad = 5
        x0p = max(0, x0 - pad)
        x1p = min(img.width - 1, x1 + pad)
        y0p = max(0, y0 - pad)
        y1p = min(img.height - 1, y1 + pad)
        crop = arr[y0p : y1p + 1, x0p : x1p + 1].copy()
        crop_bg = bg[y0p : y1p + 1, x0p : x1p + 1]
        crop[crop_bg] = KEY

        rr = crop[..., 0].astype(np.int16)
        gg = crop[..., 1].astype(np.int16)
        bb = crop[..., 2].astype(np.int16)
        fringe = (gg > 125) & (rr < 110) & (bb < 110) & ((gg - rr) > 45) & ((gg - bb) > 45)
        crop[fringe] = KEY
        crops.append(Image.fromarray(crop, "RGBA"))

    margin_top = 112
    margin_bottom = 112
    max_h = max(crop.height for crop in crops)
    canvas_w = margin_x * 2 + sum(crop.width for crop in crops) + gap * (len(crops) - 1)
    canvas_h = margin_top + max_h + margin_bottom
    canvas = Image.new("RGBA", (canvas_w, canvas_h), tuple(int(v) for v in KEY))
    baseline = margin_top + max_h

    bounds: list[tuple[int, int, int, int]] = []
    x = margin_x
    for crop in crops:
        y = baseline - crop.height
        canvas.alpha_composite(crop, (x, y))
        bounds.append((x, y, x + crop.width - 1, y + crop.height - 1))
        x += crop.width + gap

    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out)
    return {
        "out": str(out),
        "size": canvas.size,
        "runs": runs,
        "crop_sizes": [crop.size for crop in crops],
        "gaps": [b2[0] - b1[2] - 1 for b1, b2 in zip(bounds, bounds[1:])],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--frames", default=8, type=int)
    parser.add_argument("--gap", default=256, type=int)
    parser.add_argument("--margin-x", default=128, type=int)
    args = parser.parse_args()

    result = repack(args.source, args.out, args.frames, args.gap, args.margin_x)
    for key, value in result.items():
        print(f"{key}={value}")


if __name__ == "__main__":
    main()

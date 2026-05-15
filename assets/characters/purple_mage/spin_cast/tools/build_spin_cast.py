from __future__ import annotations

import csv
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[5]
ASSET_DIR = ROOT / "assets" / "characters" / "purple_mage" / "spin_cast"
PROCESSED_DIRS = {
    "south": ASSET_DIR / "raw" / "generated_processed",
    "east": ASSET_DIR / "raw" / "generated_east_padded",
    "north": ASSET_DIR / "raw" / "generated_north_padded",
    "west": ASSET_DIR / "raw" / "generated_west_padded",
}
LABEL_PREFIXES = {
    "south": "spin_cast_generated",
    "east": "east_generated",
    "north": "north_generated",
    "west": "west_generated",
}
RAW_REFERENCES = {
    "south": ASSET_DIR / "raw" / "spin_cast_generated_raw.png",
    "east": ASSET_DIR / "raw" / "spin_cast_east_generated_raw_v2_gutter.png",
    "north": ASSET_DIR / "raw" / "spin_cast_north_generated_raw_v2_gutter.png",
    "west": ASSET_DIR / "raw" / "spin_cast_west_generated_raw_v2_gutter.png",
}

CARDINAL_DIRECTIONS = ["south", "east", "north", "west"]
FRAME_SIZE = 320
PADDED_CELL_SIZE = 832
FRAME_COUNT = 8


def ensure_dirs() -> None:
    for name in ["frames", "gif", "preview", "raw", "assembled", "qa"]:
        (ASSET_DIR / name).mkdir(parents=True, exist_ok=True)


def load_generated_frames(direction: str) -> list[Image.Image]:
    processed_dir = PROCESSED_DIRS[direction]
    label_prefix = LABEL_PREFIXES[direction]
    frames = []
    for index in range(FRAME_COUNT):
        path = processed_dir / f"{label_prefix}-{index + 1}.png"
        if not path.exists():
            raise FileNotFoundError(path)
        frame = Image.open(path).convert("RGBA")
        if frame.size != (FRAME_SIZE, FRAME_SIZE):
            raise ValueError(f"{path} is {frame.size}, expected {FRAME_SIZE}x{FRAME_SIZE}")
        frames.append(frame)
    return frames


def compose_sheet(frames: list[Image.Image], rows: int, cols: int) -> Image.Image:
    sheet = Image.new("RGBA", (cols * FRAME_SIZE, rows * FRAME_SIZE), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        row, col = divmod(index, cols)
        sheet.alpha_composite(frame, (col * FRAME_SIZE, row * FRAME_SIZE))
    return sheet


def green_preview(sheet: Image.Image) -> Image.Image:
    bg = Image.new("RGBA", sheet.size, (0, 255, 0, 255))
    bg.alpha_composite(sheet)
    return bg.convert("RGB")


def compose_padded_extraction_strip(frames: list[Image.Image]) -> Image.Image:
    sheet = Image.new("RGBA", (FRAME_COUNT * PADDED_CELL_SIZE, PADDED_CELL_SIZE), (255, 0, 255, 255))
    for index, frame in enumerate(frames):
        x = index * PADDED_CELL_SIZE + (PADDED_CELL_SIZE - FRAME_SIZE) // 2
        y = (PADDED_CELL_SIZE - FRAME_SIZE) // 2
        sheet.alpha_composite(frame, (x, y))
    return sheet


def save_gif(frames: list[Image.Image], path: Path) -> None:
    rgb_frames = []
    for frame in frames:
        bg = Image.new("RGBA", frame.size, (0, 255, 0, 255))
        bg.alpha_composite(frame)
        rgb_frames.append(bg.convert("P", palette=Image.Palette.ADAPTIVE, colors=256))
    rgb_frames[0].save(path, save_all=True, append_images=rgb_frames[1:], duration=105, loop=0, disposal=2)


def remove_stale_direction_files() -> None:
    valid_prefixes = tuple(f"spin_cast_{direction}_" for direction in CARDINAL_DIRECTIONS)
    for path in (ASSET_DIR / "frames").glob("spin_cast_*_*.png"):
        if not path.name.startswith(valid_prefixes):
            path.unlink()
    for folder in ["gif", "preview"]:
        for path in (ASSET_DIR / folder).glob("spin_cast_*"):
            if not path.name.startswith(valid_prefixes):
                path.unlink()
    for path in (ASSET_DIR / "raw").glob("spin_cast_*_strip_8f_320.png"):
        if not path.name.startswith(valid_prefixes):
            path.unlink()


def main() -> None:
    ensure_dirs()
    remove_stale_direction_files()
    all_frames: list[Image.Image] = []
    manifest: dict[str, object] = {
        "character": "purple_mage",
        "animation": "spin_cast",
        "directions": CARDINAL_DIRECTIONS,
        "framesPerDirection": FRAME_COUNT,
        "frameWidth": FRAME_SIZE,
        "frameHeight": FRAME_SIZE,
        "sourceAnimation": "image_generated_directional_spin_cast",
        "generatedReferences": {direction: str(path) for direction, path in RAW_REFERENCES.items()},
        "processedSources": {direction: str(path) for direction, path in PROCESSED_DIRS.items()},
        "rows": [],
    }

    for direction in CARDINAL_DIRECTIONS:
        frames = load_generated_frames(direction)
        for index, frame in enumerate(frames):
            frame_path = ASSET_DIR / "frames" / f"spin_cast_{direction}_{index + 1:02d}.png"
            frame.save(frame_path)
            all_frames.append(frame)

        strip = compose_sheet(frames, 1, FRAME_COUNT)
        strip.save(ASSET_DIR / "raw" / f"spin_cast_{direction}_strip_8f_320.png")
        compose_padded_extraction_strip(frames).save(
            ASSET_DIR / "raw" / f"spin_cast_{direction}_padded_extraction_strip_8f_832.png"
        )
        green_preview(strip).save(ASSET_DIR / "preview" / f"spin_cast_{direction}_preview.png")
        green_preview(strip.resize((strip.width * 2, strip.height * 2), Image.Resampling.NEAREST)).save(
            ASSET_DIR / "preview" / f"spin_cast_{direction}_preview_2x.png"
        )
        save_gif(frames, ASSET_DIR / "gif" / f"spin_cast_{direction}.gif")
        manifest["rows"].append(
            {
                "direction": direction,
                "rawReference": str(RAW_REFERENCES[direction]),
                "source": str(PROCESSED_DIRS[direction]),
                "frames": [
                    str(ASSET_DIR / "frames" / f"spin_cast_{direction}_{index + 1:02d}.png")
                    for index in range(FRAME_COUNT)
                ],
            }
        )

    assembled = compose_sheet(all_frames, len(CARDINAL_DIRECTIONS), FRAME_COUNT)
    assembled_path = ASSET_DIR / "assembled" / "purple_mage_spin_cast_4dir_8f_320.png"
    assembled.save(assembled_path)
    green_preview(assembled).save(ASSET_DIR / "assembled" / "purple_mage_spin_cast_4dir_8f_320_preview.png")
    manifest["sheet"] = str(assembled_path)
    (ASSET_DIR / "assembled" / "purple_mage_spin_cast_4dir_8f_320.json").write_text(
        json.dumps(manifest, indent=2),
        encoding="utf-8",
    )

    with (ASSET_DIR / "animation_queue.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["character", "animation", "direction", "frames", "frame_width", "frame_height", "sheet"])
        for direction in CARDINAL_DIRECTIONS:
            writer.writerow(["purple_mage", "spin_cast", direction, FRAME_COUNT, FRAME_SIZE, FRAME_SIZE, assembled_path])

    (ASSET_DIR / "qa" / "spin_cast_qa.md").write_text(
        "\n".join(
            [
                "# Purple Mage Spin Cast QA",
                "",
                "- Runtime frames: `assets/characters/purple_mage/spin_cast/frames/spin_cast_{south|east|north|west}_NN.png`",
                f"- Assembled sheet: `{assembled_path}`",
                "- Frame count: 8 frames for each of 4 image-generated directions.",
                "- Frame size: 320x320, matching the existing special_cast runtime profile.",
                "- Padded extraction strips: `assets/characters/purple_mage/spin_cast/raw/spin_cast_*_padded_extraction_strip_8f_832.png`.",
                "- South source frames: `assets/characters/purple_mage/spin_cast/raw/generated_processed/spin_cast_generated-N.png`.",
                "- East source frames: `assets/characters/purple_mage/spin_cast/raw/generated_east_padded/east_generated-N.png`.",
                "- North source frames: `assets/characters/purple_mage/spin_cast/raw/generated_north_padded/north_generated-N.png`.",
                "- West source frames: `assets/characters/purple_mage/spin_cast/raw/generated_west_padded/west_generated-N.png`.",
                "- Generated references: `spin_cast_generated_raw.png`, `spin_cast_east_generated_raw_v2_gutter.png`, `spin_cast_north_generated_raw_v2_gutter.png`, and `spin_cast_west_generated_raw_v2_gutter.png`.",
                "- Diagonal runtime directions fall back to nearest cardinal spin_cast frames in `character-sprites.ts`.",
                "- No special_cast frames are used as spin_cast source material.",
            ]
        ),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()

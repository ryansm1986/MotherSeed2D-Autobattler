from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[6]
ASSET_DIR = ROOT / "assets" / "characters" / "purple_mage" / "special_effects" / "moonwell"
FRAME_SIZE = 768
FRAME_COUNT = 8
ANIMATIONS = {
    "beam": {
        "prefix": "moonwell_beam",
        "processed": ASSET_DIR / "beam" / "processed",
        "description": "Floor splits into a crescent moonwell and a lunar beam erupts upward.",
        "phases": [
            "faint crescent crack",
            "moon rune opens",
            "deep moonwell aperture",
            "narrow beam rises",
            "full lunar beam eruption",
            "peak beam and crescent shards",
            "beam collapses into mist",
            "fading moon rune",
        ],
    },
    "aftershock": {
        "prefix": "moonwell_aftershock",
        "processed": ASSET_DIR / "aftershock" / "processed",
        "description": "Opened moonwell pulses with crescent shockwaves, moonwater mist, and star motes.",
        "phases": [
            "open moonwell glow",
            "first crescent shockwave",
            "moonwater rises",
            "lunar sigil flash",
            "violet-cyan mist curl",
            "star motes rain inward",
            "rune ring dims",
            "final crescent glimmer",
        ],
    },
}


def ensure_dirs() -> None:
    (ASSET_DIR / "preview").mkdir(parents=True, exist_ok=True)
    for animation in ANIMATIONS:
        (ASSET_DIR / animation / "frames").mkdir(parents=True, exist_ok=True)
        (ASSET_DIR / animation / "preview").mkdir(parents=True, exist_ok=True)


def load_processed_frame(processed: Path, prefix: str, index: int) -> Image.Image:
    path = processed / f"{prefix}-{index}.png"
    if not path.exists():
        raise FileNotFoundError(path)
    frame = Image.open(path).convert("RGBA")
    if frame.size != (FRAME_SIZE, FRAME_SIZE):
        raise ValueError(f"{path} is {frame.size}, expected {FRAME_SIZE}x{FRAME_SIZE}")
    return frame


def compose_contact_sheet(frames: list[Image.Image], cols: int = 4) -> Image.Image:
    rows = (len(frames) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * FRAME_SIZE, rows * FRAME_SIZE), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        row, col = divmod(index, cols)
        sheet.alpha_composite(frame, (col * FRAME_SIZE, row * FRAME_SIZE))
    return sheet


def checker_preview(sheet: Image.Image) -> Image.Image:
    tile = 32
    bg = Image.new("RGBA", sheet.size, (35, 31, 46, 255))
    for y in range(0, sheet.height, tile):
        for x in range(0, sheet.width, tile):
            if (x // tile + y // tile) % 2 == 0:
                for yy in range(y, min(y + tile, sheet.height)):
                    for xx in range(x, min(x + tile, sheet.width)):
                        bg.putpixel((xx, yy), (54, 47, 70, 255))
    bg.alpha_composite(sheet)
    return bg.convert("RGB")


def save_gif(frames: list[Image.Image], path: Path) -> None:
    gif_frames = []
    for frame in frames:
        bg = Image.new("RGBA", frame.size, (20, 18, 30, 255))
        bg.alpha_composite(frame)
        gif_frames.append(bg.convert("P", palette=Image.Palette.ADAPTIVE, colors=256))
    gif_frames[0].save(path, save_all=True, append_images=gif_frames[1:], duration=90, loop=0, disposal=2)


def main() -> None:
    ensure_dirs()
    manifest: dict[str, object] = {
        "id": "motherload.moonwell",
        "name": "Moonwell",
        "purpose": "Purple mage Mother Load special effect: the floor opens and a lunar beam erupts.",
        "frameSize": [FRAME_SIZE, FRAME_SIZE],
        "frameCount": FRAME_COUNT,
        "anchor": "center",
        "animations": {},
    }

    combined_frames: list[Image.Image] = []
    for animation, config in ANIMATIONS.items():
        prefix = str(config["prefix"])
        processed = Path(config["processed"])
        frames = [load_processed_frame(processed, prefix, index + 1) for index in range(FRAME_COUNT)]

        frame_paths = []
        for index, frame in enumerate(frames):
            frame_path = ASSET_DIR / animation / "frames" / f"{prefix}_{index + 1:02d}.png"
            frame.save(frame_path)
            frame_paths.append(str(frame_path.relative_to(ASSET_DIR)))

        sheet = compose_contact_sheet(frames, cols=4)
        sheet_path = ASSET_DIR / animation / "preview" / f"{prefix}_contact_sheet.png"
        checker_path = ASSET_DIR / animation / "preview" / f"{prefix}_checker_preview.png"
        gif_path = ASSET_DIR / animation / "preview" / f"{prefix}_anim.gif"
        sheet.save(sheet_path)
        checker_preview(sheet).save(checker_path)
        save_gif(frames, gif_path)

        manifest["animations"][animation] = {
            "description": config["description"],
            "phases": config["phases"],
            "processedSource": str(processed.relative_to(ASSET_DIR)),
            "runtimeFrames": frame_paths,
            "contactSheet": str(sheet_path.relative_to(ASSET_DIR)),
            "checkerPreview": str(checker_path.relative_to(ASSET_DIR)),
            "gif": str(gif_path.relative_to(ASSET_DIR)),
        }
        combined_frames.extend(frames)

    combined = compose_contact_sheet(combined_frames, cols=8)
    combined.save(ASSET_DIR / "preview" / "moonwell_combined_contact_sheet.png")
    checker_preview(combined).save(ASSET_DIR / "preview" / "moonwell_combined_checker_preview.png")

    (ASSET_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    (ASSET_DIR / "qa.md").write_text(
        "\n".join(
            [
                "# Moonwell Motherload QA",
                "",
                "- Created two image-generated FX animations: `beam` and `aftershock`.",
                "- Runtime frames are 768x768 transparent PNGs.",
                "- Beam reads as floor crack, moonwell aperture, lunar beam eruption, and fading rune.",
                "- Aftershock reads as crescent shockwave, moonwater mist, star motes, and final glimmer.",
                "- Source strips are preserved under each animation's `raw/` folder.",
                "- Processed sheets, GIFs, and checker previews are preserved for review.",
            ]
        ),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()

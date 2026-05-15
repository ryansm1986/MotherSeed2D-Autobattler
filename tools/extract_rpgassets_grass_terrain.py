#!/usr/bin/env python3
"""Extract grass terrain assets from the RPGAssets source sheet."""

from __future__ import annotations

import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "RPGAssets.png"
OUT_DIR = ROOT / "assets" / "world" / "terrain" / "rpg_grass_source"
TILES_DIR = OUT_DIR / "tiles"
BASE_TILES_DIR = OUT_DIR / "base_tiles_opaque"
PROPS_DIR = OUT_DIR / "props"

TILE_SIZE = 48


TILES = {
    "grass_plain": {"box": (17, 70, 65, 118), "tags": ["base", "grass"]},
    "grass_dirt_transition": {"box": (72, 70, 120, 118), "tags": ["transition", "grass", "dirt"]},
    "moss_grass_plain": {"box": (182, 70, 230, 118), "tags": ["base", "grass", "moss"]},
    "grass_cliff_front": {"box": (17, 126, 65, 174), "tags": ["cliff", "grass", "front"]},
    "dirt_path_grass_edges": {"box": (72, 126, 120, 174), "tags": ["path", "grass", "dirt"]},
    "moss_stone_cliff": {"box": (182, 126, 230, 174), "tags": ["cliff", "stone", "moss"]},
    "grass_cliff_tall": {"box": (17, 182, 65, 230), "tags": ["cliff", "grass", "tall"]},
    "stone_waterfall_grass": {"box": (72, 182, 120, 230), "tags": ["waterfall", "stone", "grass"]},
    "grass_rock_column": {"box": (127, 182, 175, 230), "tags": ["cliff", "grass", "rock"]},
}


PROPS = {
    "large_grass_cliff": {"box": (13, 864, 168, 958), "anchor": (78, 92), "tags": ["cliff", "large", "grass"]},
    "narrow_grass_cliff_column": {"box": (174, 868, 214, 943), "anchor": (20, 73), "tags": ["cliff", "column", "grass"]},
    "grass_stone_cliff_corner": {"box": (221, 868, 291, 941), "anchor": (35, 71), "tags": ["cliff", "corner", "stone", "grass"]},
    "hanging_vines": {"box": (298, 865, 371, 945), "anchor": (36, 4), "tags": ["vines", "overlay", "grass"]},
    "flat_grass_patch": {"box": (19, 961, 76, 984), "anchor": (28, 18), "tags": ["ground", "overlay", "grass"]},
    "small_grass_rock_patch": {"box": (128, 953, 175, 984), "anchor": (24, 26), "tags": ["ground", "rock", "grass"]},
    "small_rock_cluster": {"box": (84, 965, 115, 983), "anchor": (16, 14), "tags": ["rock", "ground"]},
    "mini_grass_stone_platform": {"box": (221, 946, 266, 981), "anchor": (23, 31), "tags": ["platform", "stone", "grass"]},
    "round_boulder": {"box": (182, 956, 210, 984), "anchor": (14, 24), "tags": ["rock"]},
    "white_wildflower": {"box": (279, 942, 320, 982), "anchor": (20, 36), "tags": ["flower", "grass", "white"]},
    "yellow_wildflower": {"box": (332, 950, 365, 982), "anchor": (16, 28), "tags": ["flower", "grass", "yellow"]},
}


def is_sheet_background(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a == 0 or (r >= 225 and g >= 225 and b >= 210)


def remove_border_background(image: Image.Image) -> Image.Image:
    """Remove only near-white pixels connected to the crop border."""

    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    seen: set[tuple[int, int]] = set()
    queue: deque[tuple[int, int]] = deque()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or x < 0 or y < 0 or x >= width or y >= height:
            continue
        if not is_sheet_background(pixels[x, y]):
            continue
        seen.add((x, y))
        pixels[x, y] = (255, 255, 255, 0)
        queue.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))

    return rgba


def crop_source(source: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    return remove_border_background(source.crop(box))


def make_opaque_base_tile(image: Image.Image) -> Image.Image:
    """Fill transparent crop edges by extending nearest source pixels."""

    source = image.convert("RGBA")
    width, height = source.size
    src_pixels = source.load()
    out = Image.new("RGBA", (width, height), (0, 0, 0, 255))
    out_pixels = out.load()
    queue: deque[tuple[int, int]] = deque()
    seen: set[tuple[int, int]] = set()

    for y in range(height):
        for x in range(width):
            r, g, b, a = src_pixels[x, y]
            if a > 0:
                out_pixels[x, y] = (r, g, b, 255)
                queue.append((x, y))
                seen.add((x, y))

    while queue:
        x, y = queue.popleft()
        color = out_pixels[x, y]
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if nx < 0 or ny < 0 or nx >= width or ny >= height or (nx, ny) in seen:
                continue
            out_pixels[nx, ny] = color
            seen.add((nx, ny))
            queue.append((nx, ny))

    return out


def compose_on_opaque_underlay(image: Image.Image, underlay: Image.Image) -> Image.Image:
    out = underlay.copy().convert("RGBA")
    out.alpha_composite(image.convert("RGBA"))
    pixels = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, _a = pixels[x, y]
            pixels[x, y] = (r, g, b, 255)
    return out


def save_tile_atlas(tiles: dict[str, Image.Image]) -> None:
    columns = 3
    rows = (len(tiles) + columns - 1) // columns
    atlas = Image.new("RGBA", (columns * TILE_SIZE, rows * TILE_SIZE), (0, 0, 0, 0))
    for index, image in enumerate(tiles.values()):
        x = (index % columns) * TILE_SIZE
        y = (index // columns) * TILE_SIZE
        atlas.alpha_composite(image, (x, y))
    atlas.save(OUT_DIR / "rpg_grass_tiles_48.png")


def save_base_tile_atlas(tiles: dict[str, Image.Image]) -> None:
    columns = 3
    rows = (len(tiles) + columns - 1) // columns
    atlas = Image.new("RGBA", (columns * TILE_SIZE, rows * TILE_SIZE), (0, 0, 0, 255))
    for index, image in enumerate(tiles.values()):
        x = (index % columns) * TILE_SIZE
        y = (index // columns) * TILE_SIZE
        atlas.alpha_composite(image, (x, y))
    atlas.save(OUT_DIR / "rpg_grass_base_tiles_opaque_48.png")


def paint_checkerboard(image: Image.Image, tile: int = 12) -> None:
    draw = ImageDraw.Draw(image)
    colors = ((236, 239, 232, 255), (214, 222, 208, 255))
    for y in range(0, image.height, tile):
        for x in range(0, image.width, tile):
            draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill=colors[((x // tile) + (y // tile)) % 2])


def save_tile_preview(tiles: dict[str, Image.Image]) -> None:
    columns = 3
    rows = (len(tiles) + columns - 1) // columns
    cell = 78
    preview = Image.new("RGBA", (columns * cell, rows * cell), (255, 255, 255, 255))
    paint_checkerboard(preview)
    draw = ImageDraw.Draw(preview)
    font = ImageFont.load_default()

    for index, (name, image) in enumerate(tiles.items()):
        x = (index % columns) * cell
        y = (index // columns) * cell
        preview.alpha_composite(image, (x + 15, y + 6))
        draw.text((x + 4, y + 58), name.replace("_", " ")[:18], fill=(31, 54, 30, 255), font=font)

    preview.save(OUT_DIR / "rpg_grass_tiles_preview.png")


def save_prop_preview(props: dict[str, Image.Image]) -> None:
    columns = 4
    cell_w = 116
    cell_h = 112
    rows = (len(props) + columns - 1) // columns
    preview = Image.new("RGBA", (columns * cell_w, rows * cell_h), (255, 255, 255, 255))
    paint_checkerboard(preview)
    draw = ImageDraw.Draw(preview)
    font = ImageFont.load_default()

    for index, (name, image) in enumerate(props.items()):
        x = (index % columns) * cell_w
        y = (index // columns) * cell_h
        scale = min(1.0, 96 / max(image.width, image.height))
        shown = image
        if scale < 1:
            shown = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.NEAREST)
        preview.alpha_composite(shown, (x + (cell_w - shown.width) // 2, y + 5))
        draw.text((x + 4, y + 94), name.replace("_", " ")[:22], fill=(31, 54, 30, 255), font=font)

    preview.save(OUT_DIR / "rpg_grass_props_preview.png")


def save_sample_map(tiles: dict[str, Image.Image], props: dict[str, Image.Image]) -> None:
    layout = [
        ["grass_plain", "grass_plain", "moss_grass_plain", "grass_plain", "grass_dirt_transition", "grass_plain"],
        ["grass_plain", "dirt_path_grass_edges", "grass_plain", "moss_grass_plain", "grass_plain", "grass_plain"],
        ["moss_grass_plain", "grass_plain", "grass_plain", "grass_plain", "grass_plain", "grass_dirt_transition"],
        ["grass_plain", "grass_plain", "grass_dirt_transition", "moss_grass_plain", "grass_plain", "grass_plain"],
    ]
    sample = Image.new("RGBA", (len(layout[0]) * TILE_SIZE, len(layout) * TILE_SIZE), (30, 62, 35, 255))
    for row_index, row in enumerate(layout):
        for col_index, name in enumerate(row):
            sample.alpha_composite(tiles[name], (col_index * TILE_SIZE, row_index * TILE_SIZE))

    sample.alpha_composite(props["flat_grass_patch"], (18, 148))
    sample.alpha_composite(props["small_grass_rock_patch"], (194, 126))
    sample.alpha_composite(props["white_wildflower"], (118, 112))
    sample.alpha_composite(props["yellow_wildflower"], (239, 70))
    sample.alpha_composite(props["mini_grass_stone_platform"], (21, 17))
    sample.save(OUT_DIR / "rpg_grass_sample_map.png")


def save_manifest() -> None:
    manifest = {
        "name": "rpg_grass_source",
        "type": "source_extracted_grass_terrain",
        "source": "assets/RPGAssets.png",
        "tileSize": {"w": TILE_SIZE, "h": TILE_SIZE},
        "atlas": "rpg_grass_tiles_48.png",
        "opaqueBaseAtlas": "rpg_grass_base_tiles_opaque_48.png",
        "tilesDirectory": "tiles",
        "opaqueBaseTilesDirectory": "base_tiles_opaque",
        "propsDirectory": "props",
        "tiles": {
            name: {
                "file": f"tiles/{name}.png",
                "opaqueBaseFile": f"base_tiles_opaque/{name}.png",
                "sourceRect": list(data["box"]),
                "tags": data["tags"],
            }
            for name, data in TILES.items()
        },
        "props": {
            name: {
                "file": f"props/{name}.png",
                "sourceRect": list(data["box"]),
                "anchor": {"x": data["anchor"][0], "y": data["anchor"][1]},
                "tags": data["tags"],
            }
            for name, data in PROPS.items()
        },
        "usage": {
            "baseTiles": ["grass_plain", "moss_grass_plain"],
            "transitions": ["grass_dirt_transition", "dirt_path_grass_edges"],
            "cliffs": ["grass_cliff_front", "grass_cliff_tall", "grass_rock_column", "moss_stone_cliff"],
            "decorativeProps": list(PROPS.keys()),
            "backgroundRemoved": "near-white pixels connected to each crop border are transparent",
            "opaqueBaseTiles": "edge-dilated from the same source crops to prevent grid seams on base map layers",
        },
    }
    (OUT_DIR / "rpg_grass_source_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    TILES_DIR.mkdir(parents=True, exist_ok=True)
    BASE_TILES_DIR.mkdir(parents=True, exist_ok=True)
    PROPS_DIR.mkdir(parents=True, exist_ok=True)

    tile_images: dict[str, Image.Image] = {}
    opaque_tile_images: dict[str, Image.Image] = {}
    for name, data in TILES.items():
        image = crop_source(source, data["box"])
        image.save(TILES_DIR / f"{name}.png")
        tile_images[name] = image

    grass_underlay = make_opaque_base_tile(tile_images["grass_plain"])
    for name, image in tile_images.items():
        opaque = compose_on_opaque_underlay(image, grass_underlay)
        opaque.save(BASE_TILES_DIR / f"{name}.png")
        opaque_tile_images[name] = opaque

    prop_images: dict[str, Image.Image] = {}
    for name, data in PROPS.items():
        image = crop_source(source, data["box"])
        image.save(PROPS_DIR / f"{name}.png")
        prop_images[name] = image

    save_tile_atlas(tile_images)
    save_base_tile_atlas(opaque_tile_images)
    save_tile_preview(tile_images)
    save_prop_preview(prop_images)
    save_sample_map(opaque_tile_images, prop_images)
    save_manifest()


if __name__ == "__main__":
    main()

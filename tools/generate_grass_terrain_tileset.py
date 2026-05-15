#!/usr/bin/env python3
"""Generate a 48px grass terrain tileset for map bases."""

from __future__ import annotations

import json
import random
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "world" / "terrain" / "grass_base"
TILES_DIR = OUT_DIR / "tiles"

TILE = 48
COLS = 6

PALETTE = {
    "deep": (22, 49, 32, 255),
    "base": (43, 91, 47, 255),
    "base_2": (48, 103, 53, 255),
    "mid": (66, 128, 58, 255),
    "light": (100, 157, 71, 255),
    "tip": (146, 190, 88, 255),
    "moss": (74, 122, 78, 255),
    "moss_light": (116, 161, 94, 255),
    "shadow": (25, 61, 38, 255),
    "soil": (72, 61, 42, 255),
    "soil_light": (115, 92, 57, 255),
    "flower": (226, 214, 126, 255),
}

TILE_ORDER = [
    "grass_plain_a",
    "grass_plain_b",
    "grass_plain_c",
    "grass_plain_d",
    "grass_flowers",
    "grass_moss",
    "edge_north",
    "edge_east",
    "edge_south",
    "edge_west",
    "corner_outer_ne",
    "corner_outer_nw",
    "corner_outer_se",
    "corner_outer_sw",
    "corner_inner_ne",
    "corner_inner_nw",
    "corner_inner_se",
    "corner_inner_sw",
    "moss_blend_a",
    "moss_blend_b",
    "shadow_dapple_a",
    "shadow_dapple_b",
    "worn_path_blend",
    "sprout_detail",
]


def stable_seed(name: str) -> int:
    return sum((index + 1) * ord(char) for index, char in enumerate(name))


def draw_noise_floor(draw: ImageDraw.ImageDraw, rng: random.Random, variant: int = 0) -> None:
    draw.rectangle((0, 0, TILE, TILE), fill=PALETTE["base"])

    for y in range(0, TILE, 4):
        for x in range(0, TILE, 4):
            roll = (x * 11 + y * 17 + variant * 23) % 10
            color = PALETTE["base_2"] if roll < 4 else PALETTE["base"]
            draw.rectangle((x, y, x + 3, y + 3), fill=color)

    for _ in range(34):
        x = rng.randrange(2, TILE - 4)
        y = rng.randrange(2, TILE - 4)
        color = rng.choice([PALETTE["mid"], PALETTE["light"], PALETTE["shadow"]])
        if rng.random() < 0.72:
            draw.line((x, y + 3, x + rng.choice((-2, -1, 1, 2)), y), fill=color, width=1)
        else:
            draw.rectangle((x, y, x + 1, y + 1), fill=color)

    # Shared edge pixels keep all center variants from popping at tile seams.
    for x in range(0, TILE, 6):
        top_color = PALETTE["mid"] if (x // 6) % 2 else PALETTE["base_2"]
        bottom_color = PALETTE["shadow"] if (x // 6) % 3 == 0 else PALETTE["base_2"]
        draw.rectangle((x, 0, x + 3, 1), fill=top_color)
        draw.rectangle((x + 1, TILE - 2, x + 4, TILE - 1), fill=bottom_color)
    for y in range(0, TILE, 6):
        side_color = PALETTE["base_2"] if (y // 6) % 2 else PALETTE["mid"]
        draw.rectangle((0, y + 1, 1, y + 4), fill=side_color)
        draw.rectangle((TILE - 2, y, TILE - 1, y + 3), fill=side_color)


def add_clump(draw: ImageDraw.ImageDraw, x: int, y: int, scale: int = 1, moss: bool = False) -> None:
    colors = [PALETTE["mid"], PALETTE["light"], PALETTE["tip"]]
    if moss:
        colors = [PALETTE["moss"], PALETTE["moss_light"], PALETTE["light"]]
    for offset, height in [(-3, 7), (0, 10), (3, 8), (6, 6)]:
        color = colors[(offset + 3) % len(colors)]
        draw.line((x + offset, y + 2, x + offset + scale, y - height), fill=color, width=scale)


def add_detail(draw: ImageDraw.ImageDraw, name: str, rng: random.Random) -> None:
    if name == "grass_plain_b":
        for point in [(10, 15), (31, 12), (35, 34), (16, 37)]:
            add_clump(draw, *point)
    elif name == "grass_plain_c":
        for point in [(8, 32), (22, 18), (39, 25)]:
            add_clump(draw, *point, moss=True)
    elif name == "grass_plain_d":
        for _ in range(8):
            x, y = rng.randrange(6, 42), rng.randrange(9, 41)
            draw.rectangle((x, y, x + 2, y + 1), fill=PALETTE["shadow"])
    elif name == "grass_flowers":
        for point in [(12, 14), (29, 20), (39, 35), (18, 34)]:
            x, y = point
            draw.point((x, y), fill=PALETTE["flower"])
            draw.point((x + 1, y), fill=PALETTE["flower"])
            draw.point((x, y + 1), fill=PALETTE["tip"])
    elif name in {"grass_moss", "moss_blend_a", "moss_blend_b"}:
        for _ in range(9 if name == "grass_moss" else 14):
            x, y = rng.randrange(4, 40), rng.randrange(5, 40)
            draw.ellipse((x, y, x + rng.randrange(4, 10), y + rng.randrange(2, 5)), fill=PALETTE["moss"])
        for _ in range(7):
            add_clump(draw, rng.randrange(7, 42), rng.randrange(16, 42), moss=True)
    elif name.startswith("shadow_dapple"):
        for _ in range(11):
            x, y = rng.randrange(0, 41), rng.randrange(0, 42)
            draw.rectangle((x, y, x + rng.randrange(4, 10), y + rng.randrange(2, 5)), fill=PALETTE["shadow"])
    elif name == "sprout_detail":
        for point in [(9, 20), (21, 31), (34, 17), (38, 36)]:
            add_clump(draw, *point, scale=2)
    elif name == "worn_path_blend":
        draw.polygon(((0, 34), (13, 29), (28, 31), (48, 25), (48, 48), (0, 48)), fill=PALETTE["soil"])
        for _ in range(18):
            x, y = rng.randrange(1, 47), rng.randrange(28, 47)
            draw.rectangle((x, y, x + 1, y + 1), fill=rng.choice([PALETTE["soil_light"], PALETTE["shadow"]]))
        for point in [(8, 29), (31, 28), (42, 24)]:
            add_clump(draw, *point)


def draw_edge(draw: ImageDraw.ImageDraw, edge: str) -> None:
    bands = {
        "edge_north": (0, 0, TILE, 13),
        "edge_south": (0, 35, TILE, TILE),
        "edge_west": (0, 0, 13, TILE),
        "edge_east": (35, 0, TILE, TILE),
    }
    draw.rectangle(bands[edge], fill=PALETTE["deep"])
    if edge == "edge_north":
        for x in range(0, TILE, 5):
            add_clump(draw, x + 2, 16)
    elif edge == "edge_south":
        for x in range(0, TILE, 5):
            draw.line((x, 34, x + 2, 39), fill=PALETTE["shadow"], width=1)
    elif edge == "edge_west":
        for y in range(4, TILE, 6):
            draw.line((12, y, 18, y - 2), fill=PALETTE["mid"], width=1)
    elif edge == "edge_east":
        for y in range(4, TILE, 6):
            draw.line((35, y, 29, y - 2), fill=PALETTE["mid"], width=1)


def draw_corner(draw: ImageDraw.ImageDraw, name: str) -> None:
    outer = "outer" in name
    north = name.endswith("ne") or name.endswith("nw")
    east = name.endswith("ne") or name.endswith("se")

    if outer:
        if north:
            draw.rectangle((0, 0, TILE, 14), fill=PALETTE["deep"])
        else:
            draw.rectangle((0, 34, TILE, TILE), fill=PALETTE["deep"])
        if east:
            draw.rectangle((34, 0, TILE, TILE), fill=PALETTE["deep"])
            add_clump(draw, 31, 23)
            add_clump(draw, 33, 37)
        else:
            draw.rectangle((0, 0, 14, TILE), fill=PALETTE["deep"])
            add_clump(draw, 16, 23)
            add_clump(draw, 14, 37)
    else:
        corner_box = (31, 0, TILE, 17) if name.endswith("ne") else (0, 0, 17, 17)
        if name.endswith("se"):
            corner_box = (31, 31, TILE, TILE)
        elif name.endswith("sw"):
            corner_box = (0, 31, 17, TILE)
        draw.rectangle(corner_box, fill=PALETTE["deep"])
        add_clump(draw, 24, 26)


def make_tile(name: str) -> Image.Image:
    rng = random.Random(stable_seed(name))
    image = Image.new("RGBA", (TILE, TILE), PALETTE["base"])
    draw = ImageDraw.Draw(image)
    draw_noise_floor(draw, rng, stable_seed(name) % 7)

    if name.startswith("edge_"):
        draw_edge(draw, name)
    elif name.startswith("corner_"):
        draw_corner(draw, name)
    else:
        add_detail(draw, name, rng)

    return image


def save_atlas(tiles: dict[str, Image.Image]) -> None:
    rows = (len(TILE_ORDER) + COLS - 1) // COLS
    atlas = Image.new("RGBA", (COLS * TILE, rows * TILE), (0, 0, 0, 0))
    for index, name in enumerate(TILE_ORDER):
        x = (index % COLS) * TILE
        y = (index // COLS) * TILE
        atlas.alpha_composite(tiles[name], (x, y))
    atlas.save(OUT_DIR / "classic_grass_terrain_48.png")


def save_preview(tiles: dict[str, Image.Image]) -> None:
    map_names = [
        ["corner_outer_nw", "edge_north", "edge_north", "edge_north", "edge_north", "edge_north", "corner_outer_ne"],
        ["edge_west", "grass_plain_a", "grass_plain_b", "grass_moss", "grass_plain_c", "grass_flowers", "edge_east"],
        ["edge_west", "grass_plain_c", "shadow_dapple_a", "grass_plain_a", "grass_plain_d", "grass_plain_b", "edge_east"],
        ["edge_west", "grass_plain_b", "grass_plain_a", "sprout_detail", "moss_blend_a", "grass_plain_c", "edge_east"],
        ["edge_west", "grass_flowers", "grass_plain_d", "worn_path_blend", "grass_plain_b", "moss_blend_b", "edge_east"],
        ["corner_outer_sw", "edge_south", "edge_south", "edge_south", "edge_south", "edge_south", "corner_outer_se"],
    ]
    preview = Image.new("RGBA", (len(map_names[0]) * TILE, len(map_names) * TILE), PALETTE["deep"])
    for row_index, row in enumerate(map_names):
        for col_index, name in enumerate(row):
            preview.alpha_composite(tiles[name], (col_index * TILE, row_index * TILE))
    preview.save(OUT_DIR / "classic_grass_terrain_preview_map.png")


def save_metadata() -> None:
    tiles = {}
    for index, name in enumerate(TILE_ORDER):
        tiles[name] = {
            "x": (index % COLS) * TILE,
            "y": (index // COLS) * TILE,
            "w": TILE,
            "h": TILE,
            "tags": tile_tags(name),
        }
    metadata = {
        "name": "classic_grass_terrain",
        "type": "terrain_tileset",
        "style": "classic 16-bit JRPG-inspired pixel terrain",
        "image": "classic_grass_terrain_48.png",
        "tileSize": {"w": TILE, "h": TILE},
        "columns": COLS,
        "tiles": tiles,
        "usage": {
            "baseTiles": ["grass_plain_a", "grass_plain_b", "grass_plain_c", "grass_plain_d"],
            "decorativeVariants": ["grass_flowers", "grass_moss", "moss_blend_a", "moss_blend_b", "shadow_dapple_a", "shadow_dapple_b", "sprout_detail"],
            "edges": ["edge_north", "edge_east", "edge_south", "edge_west"],
            "corners": ["corner_outer_ne", "corner_outer_nw", "corner_outer_se", "corner_outer_sw", "corner_inner_ne", "corner_inner_nw", "corner_inner_se", "corner_inner_sw"],
            "collision": "none",
        },
    }
    (OUT_DIR / "classic_grass_terrain_48.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")


def tile_tags(name: str) -> list[str]:
    tags = ["grass"]
    if name.startswith("edge_"):
        tags.extend(["edge", name.removeprefix("edge_")])
    if name.startswith("corner_"):
        tags.append("corner")
        tags.extend(name.split("_")[1:])
    if "moss" in name:
        tags.append("moss")
    if "flower" in name:
        tags.append("flowers")
    if "shadow" in name:
        tags.append("shadow")
    if "path" in name:
        tags.append("path")
    if "plain" in name:
        tags.append("base")
    return tags


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    TILES_DIR.mkdir(parents=True, exist_ok=True)
    tiles = {name: make_tile(name) for name in TILE_ORDER}

    for name, tile in tiles.items():
        tile.save(TILES_DIR / f"{name}.png")

    save_atlas(tiles)
    save_preview(tiles)
    save_metadata()


if __name__ == "__main__":
    main()

from pathlib import Path
from PIL import Image


ROOT = Path(r"D:\projects\MotherSeed2D\assets\monsters\tree_goblin\idle")
FRAMES = ROOT / "frames"
ASSEMBLED = ROOT / "assembled"
PREVIEW = ROOT / "preview"
MAGENTA = (255, 0, 255, 255)
DIRECTIONS = [
    "south",
    "southeast",
    "east",
    "northeast",
    "north",
    "northwest",
    "west",
    "southwest",
]
FRAME_W = 128
FRAME_H = 128
FRAME_COUNT = 5


def main():
    ASSEMBLED.mkdir(parents=True, exist_ok=True)
    sheet = Image.new("RGBA", (FRAME_W * FRAME_COUNT, FRAME_H * len(DIRECTIONS)), (0, 0, 0, 0))
    for row, direction in enumerate(DIRECTIONS):
        for col in range(FRAME_COUNT):
            frame = Image.open(FRAMES / f"idle_{direction}_{col + 1:02d}.png").convert("RGBA")
            sheet.alpha_composite(frame, (col * FRAME_W, row * FRAME_H))
    out = ASSEMBLED / "idle_8dir.png"
    sheet.save(out)
    keyed = Image.new("RGBA", sheet.size, MAGENTA)
    keyed.alpha_composite(sheet, (0, 0))
    keyed.save(ASSEMBLED / "idle_8dir_magenta_preview.png")
    keyed.resize((keyed.width * 2, keyed.height * 2), Image.Resampling.NEAREST).save(
        PREVIEW / "idle_8dir_assembled_preview_2x.png"
    )
    (ASSEMBLED / "idle_8dir_metadata.txt").write_text(
        "animation=idle\n"
        "subject=tree_goblin\n"
        "directions=south,southeast,east,northeast,north,northwest,west,southwest\n"
        "frame_count=5\n"
        "frame_width=128\n"
        "frame_height=128\n"
        "row_order=south,southeast,east,northeast,north,northwest,west,southwest\n",
        encoding="utf-8",
    )
    print(out)
    print(ASSEMBLED / "idle_8dir_magenta_preview.png")
    print(PREVIEW / "idle_8dir_assembled_preview_2x.png")


if __name__ == "__main__":
    main()

from pathlib import Path
from PIL import Image


ANIMATION = Path(r"D:\projects\MotherSeed2D\assets\monsters\shroom_boy\idle")
JOB_IDS = [
    "idle_south",
    "idle_southeast",
    "idle_east",
    "idle_northeast",
    "idle_north",
    "idle_northwest",
    "idle_west",
    "idle_southwest",
]
FRAME_W = 128
FRAME_H = 128
FRAME_COUNT = 5


frames_dir = ANIMATION / "frames"
assembled_dir = ANIMATION / "assembled"
assembled_dir.mkdir(parents=True, exist_ok=True)

sheet = Image.new("RGBA", (FRAME_W * FRAME_COUNT, FRAME_H * len(JOB_IDS)), (0, 0, 0, 0))
for row, job_id in enumerate(JOB_IDS):
    for frame_index in range(1, FRAME_COUNT + 1):
        path = frames_dir / f"{job_id}_{frame_index:02d}.png"
        if not path.exists():
            raise SystemExit(f"Missing frame: {path}")
        frame = Image.open(path).convert("RGBA")
        if frame.size != (FRAME_W, FRAME_H):
            raise SystemExit(f"Bad frame size for {path}: {frame.size}")
        sheet.alpha_composite(frame, ((frame_index - 1) * FRAME_W, row * FRAME_H))

sheet_path = assembled_dir / "idle_8dir_sheet.png"
sheet.save(sheet_path)

preview = Image.new("RGBA", sheet.size, (235, 235, 235, 255))
preview.alpha_composite(sheet)
preview.resize((sheet.width * 2, sheet.height * 2), Image.Resampling.NEAREST).save(assembled_dir / "idle_8dir_sheet_2x_preview.png")

metadata = assembled_dir / "idle_8dir_sheet.csv"
metadata.write_text(
    "row,direction,job_id,frames,frame_width,frame_height\n"
    + "\n".join(
        f"{i},{job_id.removeprefix('idle_')},{job_id},{FRAME_COUNT},{FRAME_W},{FRAME_H}"
        for i, job_id in enumerate(JOB_IDS)
    )
    + "\n",
    encoding="utf-8",
)

print(f"sheet={sheet_path}")
print(f"preview={assembled_dir / 'idle_8dir_sheet_2x_preview.png'}")
print(f"metadata={metadata}")

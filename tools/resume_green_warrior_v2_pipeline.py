#!/usr/bin/env python3
"""Resume helper for the green_warrior_v2 pipeline handoff.

Validates queue ownership and writes a QA stub for the active row.
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "assets" / "characters" / "green_warrior_v2"
QUEUE_PATH = ASSET_ROOT / "animation_queue.csv"
RESUME_PATH = ASSET_ROOT / "PIPELINE_RESUME.md"


def load_queue() -> list[dict[str, str]]:
    with QUEUE_PATH.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def active_row(rows: list[dict[str, str]]) -> dict[str, str]:
    in_progress = [row for row in rows if row["status"] == "in_progress"]
    if len(in_progress) != 1:
        raise SystemExit(f"ERROR: expected exactly one in_progress row, found {len(in_progress)}")
    return in_progress[0]


def build_expected_paths(row: dict[str, str]) -> dict[str, str]:
    animation = row["animation"]
    direction = row["direction"]
    frame_count = int(row["frame_count"])
    anim_root = ASSET_ROOT / animation

    return {
        "base": "assets/characters/green_warrior_v2/base/warrior_base_v2_transparent.png",
        "pose": f"assets/characters/green_warrior_v2/{animation}/raw/{animation}_{direction}_pose.png",
        "raw": f"assets/characters/green_warrior_v2/{animation}/raw/{animation}_{direction}_raw.png",
        "frames": f"assets/characters/green_warrior_v2/{animation}/frames/{animation}_{direction}_01.png through {animation}_{direction}_{frame_count:02d}.png",
        "preview": f"assets/characters/green_warrior_v2/{animation}/preview/{animation}_{direction}_preview.png",
        "qa_path": str((anim_root / "qa" / f"{animation}_{direction}_qa.md").relative_to(ROOT)).replace("\\", "/"),
    }


def write_qa_stub(row: dict[str, str]) -> Path:
    expected = build_expected_paths(row)
    animation = row["animation"]
    direction = row["direction"]
    job_id = row["job_id"]

    qa_path = ROOT / expected["qa_path"]
    qa_path.parent.mkdir(parents=True, exist_ok=True)
    qa_path.write_text(
        f"""# {job_id} QA

Status: `in_progress` (active queue row from `PIPELINE_RESUME.md` flow)

## Inputs
- Queue row: `{job_id}`
- Base sprite: `{expected['base']}`
- Expected pose output: `{expected['pose']}`
- Expected raw strip: `{expected['raw']}`
- Expected normalized frames: `{expected['frames']}`
- Expected preview: `{expected['preview']}`

## Required Before Approval
- Generate one `{row['frame_count']}`-frame `{animation}_{direction}` strip from the canonical `green_warrior_v2` base only.
- Repack with transparent padding wide enough for sword poses.
- Normalize to `64x64` with shared bottom-center anchoring.
- Export standard preview and enlarged `4x` preview.
- Run focused late-frame sword visibility check before approval.

Final QA status: `pending_generation`
""",
        encoding="utf-8",
    )
    return qa_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Resume green_warrior_v2 pipeline checks")
    parser.add_argument("--write-qa-stub", action="store_true", help="Create/update QA stub for the active queue row")
    args = parser.parse_args()

    if not RESUME_PATH.exists():
        raise SystemExit(f"Missing resume notes: {RESUME_PATH}")

    rows = load_queue()
    current = active_row(rows)

    print(f"Resume notes: {RESUME_PATH.relative_to(ROOT)}")
    print(f"Queue file:   {QUEUE_PATH.relative_to(ROOT)}")
    print(f"Active row:   {current['job_id']} ({current['animation']}/{current['direction']})")

    if args.write_qa_stub:
        qa_path = write_qa_stub(current)
        print(f"Wrote QA stub: {qa_path.relative_to(ROOT)}")

    print("Next step: generate the active row assets, then complete preview + QA before approval.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

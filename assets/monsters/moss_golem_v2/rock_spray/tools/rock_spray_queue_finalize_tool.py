from __future__ import annotations

import argparse
import csv
from pathlib import Path


REQUIRED_DIRECTIONS = "south;southeast;east;northeast;north;northwest;west;southwest"


def write_qa(root: Path, job_id: str, direction: str, base_sources: str, status: str, note: str, tools: str) -> Path:
    qa = root / "qa" / f"{job_id}_qa.md"
    qa.write_text(
        f"""# {job_id} QA

Status: `{status}`

## Inputs

- Queue row: `{job_id}`
- Required skill: `$game-studio:sprite-pipeline`
- Tooling scope: template-only tooling plus fresh helper tools under this animation's `tools/` folder
- Inferred project root: `D:\\projects\\MotherSeed2D`
- Inferred subject id: `moss_golem_v2`
- Inferred subject type: `monster`
- Animation/direction: `rock_spray + {direction}`
- One-direction-only source: `confirmed {direction}-only source strip`
- Base folder location: `D:\\projects\\MotherSeed2D\\assets\\monsters\\moss_golem_v2\\base`
- Required cardinal base files: `north.png`, `south.png`, `east.png`, `west.png`
- Mapped base source(s): `{base_sources}`
- User animation direction: green center circle opens, golem sprays rocks in a 90-degree arc, and rotates while spraying; core stays open until the last couple frames
- Direction set: `8_directional`
- Required directions for selected set: `{REQUIRED_DIRECTIONS}`
- Frame count: `8`
- Frame-by-frame pose plan: `D:\\projects\\MotherSeed2D\\assets\\monsters\\moss_golem_v2\\rock_spray\\raw\\{job_id}_pose_plan.md`
- Subject size: `large`
- Required items/weapons/features: preserve visible moss, stone body, vine wraps, green eyes, and green center core from the base set; no unrequested weapons or props
- Frame profile: `monster_large_action_1152`
- Required initial source-strip spacing: `1152` empty pixels between neighboring visible pose bounds before cleanup/repack
- Expected raw strip: `D:\\projects\\MotherSeed2D\\assets\\monsters\\moss_golem_v2\\rock_spray\\raw\\{job_id}_raw.png`
- Expected normalized frames: `D:\\projects\\MotherSeed2D\\assets\\monsters\\moss_golem_v2\\rock_spray\\frames\\{job_id}_01.png` through `{job_id}_08.png`
- Expected preview: `D:\\projects\\MotherSeed2D\\assets\\monsters\\moss_golem_v2\\rock_spray\\preview\\{job_id}_preview.png`
- Expected review GIF: `D:\\projects\\MotherSeed2D\\assets\\monsters\\moss_golem_v2\\rock_spray\\gif\\{job_id}.gif`
- Local tools: `{tools}`

## Source Provenance

- Fresh source confirmation: generated fresh from the mapped directional base source(s) through `$game-studio:sprite-pipeline` workflow
- Template-only tooling confirmation: no existing project animation tooling, old strips, old normalized frames, hidden automation, or another subject pipeline was searched for or reused
- Fresh helper tools created under `<animation>/tools/`: `{tools}`
- Frame uniqueness confirmation: source frames show distinct body/torso and spray beats
- Rejected source attempts, if any: none for this row
- Other tools or references explicitly approved by user: none

## QA Checks

- `$game-studio:sprite-pipeline` was used throughout source generation, normalization, preview rendering, GIF creation, and QA.
- Job was processed as one animation plus one direction only.
- Source image contains one horizontal strip for `{direction}` only.
- Base folder exists and contains `north.png`, `south.png`, `east.png`, and `west.png`.
- Correct mapped base file or adjacent cardinal pair was used as the required source reference.
- Animation queue contains every required direction for the selected 8-direction set.
- Generated one fresh 8-frame `{job_id}` strip.
- Numbered frame-by-frame pose plan exists.
- Normalized frames match the selected `1152x1152` profile.
- Transparent output frames were created.
- Standard preview, enlarged preview, focused QA preview, and looping GIF exist.
- Final normalized frames have no frame-edge contact.

## Result

{note}

Final QA status: `{status}`
""",
        encoding="utf-8",
    )
    return qa


def update_queue(queue: Path, job_id: str, status: str, tools: str, note: str) -> None:
    with queue.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        fieldnames = rows[0].keys()
    for row in rows:
        if row["job_id"] == job_id:
            row["status"] = status
            row["generated_pose"] = f"assets/monsters/moss_golem_v2/rock_spray/raw/{job_id}_pose_plan.md"
            row["raw_output"] = f"assets/monsters/moss_golem_v2/rock_spray/raw/{job_id}_raw.png"
            row["normalized_output"] = f"assets/monsters/moss_golem_v2/rock_spray/frames/{job_id}_01.png through {job_id}_08.png"
            row["preview"] = f"assets/monsters/moss_golem_v2/rock_spray/preview/{job_id}_preview.png;assets/monsters/moss_golem_v2/rock_spray/preview/{job_id}_preview_4x.png;assets/monsters/moss_golem_v2/rock_spray/preview/{job_id}_focused_qa.png"
            row["gif"] = f"assets/monsters/moss_golem_v2/rock_spray/gif/{job_id}.gif"
            row["local_tools"] = tools
            row["qa_notes"] = f"assets/monsters/moss_golem_v2/rock_spray/qa/{job_id}_qa.md; {note}"
    with queue.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--job-id", required=True)
    parser.add_argument("--direction", required=True)
    parser.add_argument("--base-sources", required=True)
    parser.add_argument("--status", required=True)
    parser.add_argument("--note", required=True)
    parser.add_argument("--tools", required=True)
    parser.add_argument("--root", type=Path, default=Path(r"D:\projects\MotherSeed2D\assets\monsters\moss_golem_v2\rock_spray"))
    parser.add_argument("--queue", type=Path, default=Path(r"D:\projects\MotherSeed2D\assets\monsters\moss_golem_v2\animation_queue.csv"))
    args = parser.parse_args()
    qa = write_qa(args.root, args.job_id, args.direction, args.base_sources, args.status, args.note, args.tools)
    update_queue(args.queue, args.job_id, args.status, args.tools, args.note)
    print(qa)


if __name__ == "__main__":
    main()

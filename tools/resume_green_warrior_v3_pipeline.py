#!/usr/bin/env python3
"""Resume helper for the green_warrior_v3 128-frame sprite pipeline."""

from __future__ import annotations

import argparse
import csv
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "assets" / "characters" / "green_warrior_v3"
QUEUE_PATH = ASSET_ROOT / "animation_queue.csv"
RESUME_PATH = ASSET_ROOT / "PIPELINE_RESUME.md"
PROFILES_PATH = ASSET_ROOT / "frame_profiles.csv"

ACTION_ANIMATIONS = {"attack", "special"}


def slash(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def load_queue() -> list[dict[str, str]]:
    with QUEUE_PATH.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def write_queue(rows: list[dict[str, str]]) -> None:
    if not rows:
        raise SystemExit("ERROR: queue is empty")
    with QUEUE_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def profile_for(animation: str) -> dict[str, str]:
    profile_name = "expanded_action_384" if animation in ACTION_ANIMATIONS else "default_128"
    with PROFILES_PATH.open("r", encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            if row["profile"] == profile_name:
                return row
    raise SystemExit(f"ERROR: missing profile {profile_name} in {slash(PROFILES_PATH)}")


def find_row(rows: list[dict[str, str]], job_id: str) -> dict[str, str]:
    matches = [row for row in rows if row["job_id"] == job_id]
    if len(matches) != 1:
        raise SystemExit(f"ERROR: expected exactly one row for {job_id}, found {len(matches)}")
    return matches[0]


def expected_paths(row: dict[str, str]) -> dict[str, str]:
    animation = row["animation"]
    job_id = row["job_id"]
    frame_count = int(row["frame_count"])

    return {
        "base": "assets/characters/green_warrior_v3/base/warrior_base_v3_transparent.png",
        "seed": "assets/characters/green_warrior_v3/base/warrior_base_v3_seed_128.png",
        "pose": f"assets/characters/green_warrior_v3/{animation}/raw/{job_id}_pose.png",
        "raw": f"assets/characters/green_warrior_v3/{animation}/raw/{job_id}_raw.png",
        "frames": f"assets/characters/green_warrior_v3/{animation}/frames/{job_id}_01.png through {job_id}_{frame_count:02d}.png",
        "preview": f"assets/characters/green_warrior_v3/{animation}/preview/{job_id}_preview.png",
        "gif": f"assets/characters/green_warrior_v3/{animation}/gif/{job_id}.gif",
        "qa_path": slash(ASSET_ROOT / animation / "qa" / f"{job_id}_qa.md"),
    }


def write_qa_stub(row: dict[str, str]) -> Path:
    paths = expected_paths(row)
    profile = profile_for(row["animation"])
    job_id = row["job_id"]
    full_frame_spacing = int(profile["frame_width"])
    qa_path = ROOT / paths["qa_path"]
    qa_path.parent.mkdir(parents=True, exist_ok=True)
    qa_path.write_text(
        f"""# {job_id} QA

Status: `in_progress`

## Inputs

- Queue row: `{job_id}`
- Base sprite: `{paths['base']}`
- 128 seed: `{paths['seed']}`
- Current-pipeline references used: `none yet`
- Fresh source confirmation: `pending; no older animation strip may be used as source`
- Frame profile: `{profile['profile']}` (`{profile['frame_width']}x{profile['frame_height']}`, anchor `{{ x: {profile['anchor_x']}, y: {profile['anchor_y']} }}`)
- Expected pose output: `{paths['pose']}`
- Expected raw strip: `{paths['raw']}`
- Required initial source-strip spacing: `{full_frame_spacing}px` empty flat `#ff00ff` between neighboring visible pose bounds before cleanup/repack
- Expected normalized frames: `{paths['frames']}`
- Expected preview: `{paths['preview']}`
- Expected review GIF: `{paths['gif']}`

## Required Before Approval

- Generate one fresh `{row['frame_count']}`-frame `{job_id}` strip from the canonical `green_warrior_v3` base/seed and approved current-pipeline v3 references only.
- Confirm no older animation strip, normalized frame set, repaired frame, or raw sheet was used as source.
- Confirm the initial generated source strip has at least `{full_frame_spacing}px` empty flat `#ff00ff` between neighboring visible poses before cleanup/repack.
- Repack with enough transparent padding to prevent body, sword, scarf, shadow, glow, or effect bleed.
- Normalize to `{profile['frame_width']}x{profile['frame_height']}` with shared bottom-center anchoring.
- Export standard, 4x, focused weapon/no-shield QA previews, and a looping review GIF under the animation's `gif/` folder.
- Confirm no frame-edge contact, no inter-frame bleed, and no cropped weapon/effect pixels.

Final QA status: `pending_generation`
""",
        encoding="utf-8",
    )
    return qa_path


def claim_row(row: dict[str, str], owner: str) -> None:
    if row["status"] == "in_progress" and owner not in row.get("qa_notes", ""):
        raise SystemExit(f"ERROR: {row['job_id']} is already in_progress: {row.get('qa_notes', '')}")
    if row["status"] not in {"pending", "needs_revision", "in_progress"}:
        raise SystemExit(f"ERROR: {row['job_id']} has status={row['status']}; not claimable")
    claimed = datetime.now().astimezone().strftime("%Y-%m-%d %H:%M %Z")
    row["status"] = "in_progress"
    row["qa_notes"] = f"Owner: {owner}; claimed: {claimed}; scope: {row['job_id']} only"


def main() -> int:
    parser = argparse.ArgumentParser(description="Resume green_warrior_v3 128-frame pipeline checks")
    parser.add_argument("--job-id", help="Queue job_id to inspect or claim")
    parser.add_argument("--claim", action="store_true", help="Claim --job-id by marking it in_progress")
    parser.add_argument("--owner", default="Codex sprite thread", help="Owner label for --claim")
    parser.add_argument("--write-qa-stub", action="store_true", help="Create/update QA stub for --job-id")
    args = parser.parse_args()

    for required in (RESUME_PATH, QUEUE_PATH, PROFILES_PATH):
        if not required.exists():
            raise SystemExit(f"ERROR: missing {required}")

    rows = load_queue()
    print(f"Resume notes: {slash(RESUME_PATH)}")
    print(f"Queue file:   {slash(QUEUE_PATH)}")
    print(f"Profiles:     {slash(PROFILES_PATH)}")

    if not args.job_id:
        counts: dict[str, int] = {}
        for row in rows:
            counts[row["status"]] = counts.get(row["status"], 0) + 1
        print("Queue status: " + ", ".join(f"{key}={counts[key]}" for key in sorted(counts)))
        print("Next step: pass --job-id <JOB_ID> to inspect or claim a row.")
        return 0

    row = find_row(rows, args.job_id)
    profile = profile_for(row["animation"])

    if args.claim:
        claim_row(row, args.owner)
        write_queue(rows)
        print(f"Claimed:      {row['job_id']} as {args.owner}")

    if args.write_qa_stub:
        qa_path = write_qa_stub(row)
        print(f"Wrote QA:     {slash(qa_path)}")

    print(f"Active row:   {row['job_id']} ({row['animation']}/{row['direction']}, {row['frame_count']} frames)")
    print(f"Profile:      {profile['profile']} {profile['frame_width']}x{profile['frame_height']} anchor=({profile['anchor_x']},{profile['anchor_y']})")
    print("Next step: generate the active row assets, then complete preview + QA before approval.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

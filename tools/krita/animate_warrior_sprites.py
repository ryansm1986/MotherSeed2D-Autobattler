import json
import os
import shutil
import subprocess
import sys


SCRIPT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
WORKING_ROOT = os.getcwd()
ROOT = WORKING_ROOT if os.path.exists(os.path.join(WORKING_ROOT, "package.json")) else SCRIPT_ROOT
KRITA_BIN = r"C:\Program Files\Krita (x64)\bin"
FFMPEG = os.path.join(KRITA_BIN, "ffmpeg.exe")

SOURCE_DIR = os.path.join(ROOT, "assets", "characters", "green_warrior")
OUTPUT_DIR = os.path.join(ROOT, "dist", "sprite-previews", "warrior")
GAME_OUTPUT_DIR = os.path.join(OUTPUT_DIR, "runtime_frames")
LOG_PATH = os.path.join(ROOT, "dist", "sprite-previews", "kritarunner.log")

DIRECTIONS = ("down", "left", "right", "up")
GAME_ANIMATIONS = ("idle", "walk", "run", "sprint", "dodge_roll", "attack1", "attack2")
SOURCE_ANIMATION_FOR_GAME = {
    "idle": "idle",
    "walk": "walk",
    "run": "sprint",
    "sprint": "sprint",
    "dodge_roll": "dodge_roll",
    "attack1": "attack",
    "attack2": "special_attack",
}
FRAME_RATE = {
    "idle": 5,
    "walk": 9,
    "run": 13,
    "sprint": 13,
    "dodge_roll": 21,
    "attack1": 13,
    "attack2": 11,
}


def normalize_relpath(path):
    return os.path.relpath(path, ROOT).replace(os.sep, "/")


def log(message):
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    with open(LOG_PATH, "a", encoding="utf-8") as log_file:
        log_file.write(f"{message}\n")


log("loaded animate_warrior_sprites")


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def clear_png_frames(path):
    ensure_dir(path)
    for name in os.listdir(path):
        if name.endswith(".png"):
            os.remove(os.path.join(path, name))


def load_manifest():
    manifest_path = os.path.join(SOURCE_DIR, "green_warrior_manifest.json")
    with open(manifest_path, "r", encoding="utf-8") as manifest_file:
        return json.load(manifest_file)


def resolve_ffmpeg():
    ffmpeg_override = os.environ.get("MOTHERSEED_FFMPEG")
    if ffmpeg_override:
        return ffmpeg_override

    if os.path.exists(FFMPEG):
        return FFMPEG

    return shutil.which("ffmpeg")


def source_frame_paths(source_animation, direction):
    frame_dir = os.path.join(SOURCE_DIR, source_animation, "frames")
    prefix = f"{source_animation}_{direction}_"
    paths = [
        os.path.join(frame_dir, name)
        for name in sorted(os.listdir(frame_dir))
        if name.startswith(prefix) and name.endswith(".png")
    ]

    if not paths:
        raise RuntimeError(f"Missing green_warrior frames for {source_animation}/{direction}")

    return paths


def sync_game_frames(game_animation, direction):
    source_animation = SOURCE_ANIMATION_FOR_GAME[game_animation]
    source_paths = source_frame_paths(source_animation, direction)
    game_frame_dir = os.path.join(GAME_OUTPUT_DIR, direction, game_animation)
    preview_frame_dir = os.path.join(OUTPUT_DIR, direction, game_animation, "frames")
    clear_png_frames(game_frame_dir)
    clear_png_frames(preview_frame_dir)

    preview_paths = []
    for index, source_path in enumerate(source_paths):
        frame_name = f"frame_{index:03d}.png"
        game_path = os.path.join(game_frame_dir, frame_name)
        preview_path = os.path.join(preview_frame_dir, frame_name)
        shutil.copyfile(source_path, game_path)
        shutil.copyfile(source_path, preview_path)
        preview_paths.append(preview_path)

    return preview_frame_dir, preview_paths


def export_animation(ffmpeg_bin, frame_dir, direction, animation):
    animation_dir = os.path.join(OUTPUT_DIR, direction)
    ensure_dir(animation_dir)
    apng_path = os.path.join(animation_dir, f"{animation}.png")
    gif_path = os.path.join(animation_dir, f"{animation}.gif")
    fps = str(FRAME_RATE[animation])
    pattern = os.path.join(frame_dir, "frame_%03d.png")

    subprocess.check_call(
        [
            ffmpeg_bin,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-framerate",
            fps,
            "-i",
            pattern,
            "-plays",
            "0",
            "-f",
            "apng",
            apng_path,
        ]
    )
    subprocess.check_call(
        [
            ffmpeg_bin,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-framerate",
            fps,
            "-i",
            pattern,
            "-filter_complex",
            "[0:v]split[a][b];[a]palettegen=reserve_transparent=1[p];[b][p]paletteuse=alpha_threshold=128",
            "-loop",
            "0",
            gif_path,
        ]
    )
    return apng_path, gif_path


def write_manifest(source_manifest, written):
    manifest_path = os.path.join(OUTPUT_DIR, "manifest.txt")
    with open(manifest_path, "w", encoding="utf-8") as manifest:
        manifest.write("# green_warrior runtime animation export\n")
        manifest.write(f"source: {normalize_relpath(SOURCE_DIR)}\n")
        manifest.write(f"frame: {source_manifest['frameWidth']}x{source_manifest['frameHeight']}\n")
        manifest.write(f"anchor: {source_manifest['anchor']}\n")
        manifest.write("\n")
        manifest.write("\n".join(normalize_relpath(path) for path in written))
        manifest.write("\n")
    return manifest_path


def main():
    log("running main")
    ensure_dir(OUTPUT_DIR)
    ensure_dir(GAME_OUTPUT_DIR)
    source_manifest = load_manifest()
    ffmpeg_bin = resolve_ffmpeg()
    preview_export_enabled = ffmpeg_bin is not None
    if not preview_export_enabled:
        warning = (
            "Could not find ffmpeg. Runtime frames will still be synced, "
            "but preview GIF/APNG exports are skipped."
        )
        print(warning, file=sys.stderr)
        log(warning)

    written = []

    for direction in DIRECTIONS:
        for animation in GAME_ANIMATIONS:
            frame_dir, _preview_paths = sync_game_frames(animation, direction)
            if preview_export_enabled:
                written.extend(export_animation(ffmpeg_bin, frame_dir, direction, animation))

    manifest_path = write_manifest(source_manifest, written)
    if preview_export_enabled:
        print(f"Wrote {len(written)} preview animations to {OUTPUT_DIR}")
    else:
        print("Skipped preview animation export because ffmpeg was unavailable")
    print(f"Wrote preview frame copies to {GAME_OUTPUT_DIR}")
    print(f"Manifest: {manifest_path}")
    log(f"wrote {len(written)} preview animations from green_warrior")


def __main__(*args):
    log(f"running __main__ args={args}")
    main()


if __name__ == "__main__":
    main()

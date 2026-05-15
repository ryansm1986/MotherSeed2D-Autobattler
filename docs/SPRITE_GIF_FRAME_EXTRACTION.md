# Sprite GIF Frame Extraction

Use `tools/extract_gif_frames.py` when an animation arrives as `.gif` files and needs to become runtime PNG frames.

The game should load PNG frame sequences, not GIFs. PNG frames let the game loop control timing, facing, attack windows, scaling, and baseline alignment.

## Quick Start

Extract Purple Mage-style idle GIFs into normalized runtime frames:

```powershell
python tools/extract_gif_frames.py `
  --input "assets/characters/purple_mage/idle/*-idle.gif" `
  --out-dir assets/characters/purple_mage/idle/frames `
  --animation idle `
  --frame-size 128 `
  --target-visible-height 124 `
  --direction-map "down=south,up=north,left=west,right=east" `
  --manifest assets/characters/purple_mage/idle/frames/idle_manifest.json `
  --overwrite
```

Preview the outputs before writing by adding `--dry-run` and removing `--overwrite`:

```powershell
python tools/extract_gif_frames.py `
  --input "assets/characters/purple_mage/idle/*-idle.gif" `
  --out-dir assets/characters/purple_mage/idle/frames `
  --animation idle `
  --frame-size 128 `
  --target-visible-height 124 `
  --direction-map "down=south,up=north,left=west,right=east" `
  --dry-run
```

## Naming

By default, output files use:

```text
{animation}_{direction}_{index:02d}.png
```

Examples:

```text
idle_south_01.png
idle_south_02.png
attack_east_01.png
```

The tool infers animation and direction from common GIF names:

```text
down-idle.gif      -> animation=idle, direction=down
walk_east.gif      -> animation=walk, direction=east
sprint_south.gif   -> animation=sprint, direction=south
```

Use `--animation` or `--direction` when a file name is ambiguous. Use `--direction-map` when source directions differ from runtime naming.

## Normalization

Pass `--frame-size` to place each frame into a fixed transparent canvas.

Useful defaults for regular 128px character frames:

```powershell
--frame-size 128 --target-visible-height 124
```

Useful defaults for wider casting or attack frames:

```powershell
--frame-size 192x160 --target-visible-height 124 --anchor-x 96 --baseline-y 148
```

Normalization uses one shared scale per GIF. The source anchor is the union bounding box center, and the source baseline is the union bounding box bottom. This keeps animation offsets stable while placing the character on a predictable runtime ground point.

## Safe Defaults

- The tool refuses to overwrite existing files unless `--overwrite` is passed.
- `--dry-run` prints planned outputs without writing.
- `--manifest` writes source paths, frame paths, GIF frame durations, and normalization metadata.
- Output frames are always RGBA PNGs with transparency preserved.

## Runtime Checklist

After extracting frames:

1. Confirm frame names match the Vite glob in `src/render/canvas2d/character-sprites.ts` or `src/render/canvas2d/monster-sprites.ts`.
2. Confirm every cardinal direction needed by the loader exists or has an explicit fallback.
3. Run `npm run build`.
4. Test the character in the browser and watch for missing frame warnings.
5. Tune the draw profile in `src/render/canvas2d/renderer.ts` if the canvas size or baseline changed.

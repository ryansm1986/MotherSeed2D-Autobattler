# Nightbloom Matriarch Encounter Pass

## Encounter Summary

Nightbloom Matriarch is the fourth-room solo boss encounter. It is a corrupted blossom-root caster that pressures the player with line shots, fan projectiles, delayed ground snares, and an expanding nova. Phase 2 begins once health drops below 50% and increases projectile/root density without removing safe spaces.

## Reusable Method

1. Define the fight first: monster id, health, radius, preferred range, ability timings, damage, telegraph shapes, cooldowns, and phase rules.
2. Generate fresh art per encounter with `generate2dsprite`; keep raw sheets, processed transparent sheets, frames, GIF previews, prompt text, and metadata in `assets/monsters/<monster_id>/`.
3. Add authored content in `src/game/content/monster-fights/<monster-id>.fight.ts`; keep reusable runtime helpers in `src/game/combat/monster-fights/`.
4. Keep state serializable: projectiles, delayed hazards, nova waves, and phase flags are plain objects in `GameState`.
5. Add smoke tests for spawn placement, phase transitions, each ability spawn path, active-window damage, and cleanup.

## Ability Table

| Ability | Role | Timing | Damage | Counterplay |
| --- | --- | --- | --- | --- |
| `thorn_lance` | Narrow line projectile | 0.72s windup, 0.08s active, 0.42s recovery | 18 | Sidestep the line after the cast locks direction. |
| `petal_fan` | Projectile spread | 0.92s windup, 0.10s active, 0.56s recovery | 11 per petal | Dodge through a gap; phase 2 widens to 7 petals. |
| `root_snare` | Delayed ground hazards | 1.05s windup, delayed burst hits | 16 | Move out of locked circles before roots erupt. |
| `nightbloom_nova` | Expanding donut/ring | 1.18s windup, 0.16s active, 0.86s recovery | 28 | Stay inside the initial safe center or leave the ring. |
| `phase_bloom` | Phase transition | One-time below 50% health | 0 | Clears active boss hazards and announces phase 2. |

## Asset Manifest

All art in `assets/monsters/nightbloom_matriarch/` was generated fresh for this encounter.

- 4-direction boss actions: `idle`, `walk`, `cast`, `thorn_lance`, `petal_fan`, `root_snare`, `nova`
- Down-facing one-shots: `phase_bloom`, `death`
- FX/projectiles: `thorn_lance_projectile`, `petal_shard_projectile`, `root_burst_effect`, `nightbloom_nova_effect`, `petal_impact_effect`
- Each folder keeps `raw/imagegen-raw.png`, `raw-sheet.png`, `raw-sheet-clean.png`, `sheet-transparent.png`, frame PNGs, `animation.gif`, `prompt-used.txt`, and `pipeline-meta.json`.

## QA Notes

- The image generation pass produced some raw boss sheets with processor edge-touch warnings. The transparent normalized frame output is used by runtime; inspect in browser before final art approval.
- Four-direction monster animation is the current standard. Diagonal facing maps to the nearest cardinal Nightbloom frame.
- Verify telegraphs remain visible over root/nova FX; if the FX feels too loud, reduce Canvas alpha/scale rather than changing combat timing first.

## Acceptance Checklist

- Room 4 spawns only Nightbloom Matriarch.
- Phase 2 triggers once below 50% health and emits `nightbloomPhase`.
- Every ability has readable windup, active, recovery, and cleanup behavior.
- Boss projectiles and hazards clear on player death, boss death, and room transition.
- `npm run test:simulation` and `npm run build` pass.

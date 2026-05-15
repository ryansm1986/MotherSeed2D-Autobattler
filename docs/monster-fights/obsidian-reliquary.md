# Obsidian Reliquary Encounter Pass

## Encounter Summary

Obsidian Reliquary is the fifth-room solo boss encounter. It is a slow shrine-knight caster that fights like a Path of Exile map boss: narrow line checks, wide shard fans, delayed ground smites, and an expanding hollow wheel that rewards either staying close or cleanly crossing the rim. Phase 2 begins below 45% health and increases shard/smite density without removing readable gaps.

## Ability Table

| Ability | Role | Timing | Damage | Counterplay |
| --- | --- | --- | --- | --- |
| `glass_lance` | Narrow line projectile | 0.68s windup, 0.08s active, 0.42s recovery | 20 | Sidestep the locked line after the cast turns toward you. |
| `shard_spiral` | Wide projectile fan | 0.96s windup, 0.12s active, 0.58s recovery | 12 per shard | Read the fan arc and dodge through a gap; phase 2 fires 12 shards. |
| `reliquary_smite` | Delayed ground eruptions | 1.08s windup, delayed burst hits | 22 | Leave the locked sigils before the black glass erupts. |
| `penitent_wheel` | Expanding donut/ring | 1.22s windup, 0.14s active, 0.90s recovery | 30 | Stay inside the safe center or dodge across the rim once. |
| `phase_rupture` | Phase transition | One-time below 45% health | 0 | Clears active boss hazards and announces the denser pattern. |

## Asset Manifest

All art in `assets/monsters/obsidian_reliquary/` was generated fresh for this encounter with `generate2dsprite`.

- 4-direction boss actions: `idle`, `walk`, `cast`
- Down-facing one-shots: `phase_rupture`, `death`
- FX/projectiles: `glass_lance_projectile`, `spiral_shard_projectile`, `smite_impact_effect`, `wheel_nova_effect`
- Each generated folder keeps raw source, processed transparent sheet output, prompt text, metadata, and runtime `frames/` PNGs.

## QA Notes

- The runtime maps all Obsidian attacks to the custom `cast` animation, with `phase_rupture` and `death` using their generated down-facing one-shots.
- The boss enters the room roster after Nightbloom, so existing room 4 Nightbloom expectations stay unchanged and Obsidian appears in room 5.
- Telegraph colors intentionally lean ember/red-orange to separate the fight from Nightbloom's green/petal palette.

## Acceptance Checklist

- Room 5 spawns only Obsidian Reliquary.
- Phase 2 triggers once below 45% health and emits `Reliquary rupture`.
- Every ability has readable windup, active, recovery, and cleanup behavior.
- Boss projectiles and hazards clear on player death, boss death, and room transition.
- `npm run test:simulation` and `npm run build` pass.

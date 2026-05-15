# Abyssal Bellwraith Encounter Pass

## Encounter Summary

Abyssal Bellwraith is the sixth-room solo boss encounter. It is a cracked cathedral-bell spirit built around narrow line checks, wide fan shards with readable gaps, delayed grave circles, and an expanding hollow nova. Phase 2 begins below 50% health and adds denser fans plus a second delayed nova ring.

## Ability Table

| Ability | Role | Timing | Damage | Counterplay |
| --- | --- | --- | --- | --- |
| `bell_shard` | Narrow line projectile | 0.74s windup, 0.08s active, 0.46s recovery | 22 | Sidestep after the boss locks its facing. |
| `tolling_fan` | Wide projectile fan | 1.02s windup, 0.12s active, 0.62s recovery | 12 per shard | Leaves a readable gap; phase 2 fires 11 shards. |
| `grave_mark` | Delayed ground bursts | 1.16s windup, delayed burst hits | 24 | Leave the locked circles before the toll erupts. |
| `dirge_nova` | Expanding hollow ring | 1.28s windup, 0.14s active, 0.94s recovery | 32 | Stay in the safe center or cross the rim cleanly. |
| `phase_toll` | Phase transition | One-time below 50% health | 0 | Clears active Bellwraith hazards and starts the denser rhythm. |

## Asset Manifest

All art in `assets/monsters/abyssal_bellwraith/` was generated fresh for this encounter with `generate2dsprite`.

- Boss actions: `idle`, `cast`, `death`
- FX/projectiles: `bell_shard_projectile`, `bell_toll_impact`, `bell_toll_nova`
- Each generated folder keeps raw source, processed transparent sheet output, prompt text, metadata, frame PNGs, and GIF preview.

## Acceptance Checklist

- Room 6 spawns only Abyssal Bellwraith.
- Phase 2 triggers once below 50% health and emits `Abyssal toll`.
- Every ability has readable windup, active, recovery, and cleanup behavior.
- Boss projectiles and hazards clear on player death, boss death, and room transition.
- `npm run test:simulation` and `npm run build` pass.

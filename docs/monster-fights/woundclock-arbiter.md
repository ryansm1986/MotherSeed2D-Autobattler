# Woundclock Arbiter Encounter Pass

## Encounter Summary

Woundclock Arbiter is a large clockwork time-magic boss built to feel different from the prior plant, reliquary, and bell fights. It fights like a Dark Souls / Path of Exile arena boss: it strafes at mid-range, fires locked chrono lances, releases orbiting gear hazards that later cut loose, sweeps a rotating clock hand across the floor, and marks delayed time rifts under the player's last position. Phase 2 begins below 50% health, clears active hazards, and increases orb and rift density.

## Ability Table

| Ability | Role | Timing | Damage | Counterplay |
| --- | --- | --- | --- | --- |
| `chrono_lance` | Fast locked line projectile | 0.66s windup, 0.08s active, 0.42s recovery | 23 | Sidestep the line after the boss locks its facing; phase 2 fires three narrow lances. |
| `gear_orbit` | Orbiting delayed projectiles | 0.92s windup, 0.12s active, 0.68s recovery | 14 per gear | Watch the orbit, then dodge the release vector as gears fling toward you. |
| `clockhand_sweep` | Rotating radial blade | 0.96s windup, 0.10s active, 0.70s recovery | 30 | Move inside or outside the sweeping hand rather than only side-stepping. |
| `time_rift` | Delayed position traps | 1.08s windup, delayed burst hits | 25 | Leave your marked position before the rifts snap shut. |
| `hour_zero` | Phase transition | One-time below 50% health | 0 | Clears active time hazards and begins denser second-phase patterns. |

## Asset Manifest

All art in `assets/monsters/woundclock_arbiter/` was generated fresh with `generate2dsprite`.

- High-resolution boss actions: `idle`, `cast`, `phase_zero`, `death`
- FX/projectiles: `chrono_bolt_projectile`, `gear_orb_projectile`, `clock_impact_effect`, `time_rift_effect`
- Boss runtime frames were processed at 256px cells so the larger model is not stretched from low-resolution source frames.

## Acceptance Checklist

- Woundclock Arbiter appears as the next solo boss after Briarheart Sovereign.
- Phase 2 triggers once below 50% health and emits `Hour Zero`.
- Rotating sweeps, orbiting gear releases, chrono lances, and delayed rifts all clean up on boss death, player death, and room transition.
- `npm run test:simulation` and `npm run build` pass.

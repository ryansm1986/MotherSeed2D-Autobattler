# Briarheart Sovereign Encounter Pass

## Encounter Summary

Briarheart Sovereign is the next solo boss encounter after Abyssal Bellwraith. It is a large bramble-crowned plant sovereign that fights like a Path of Exile map boss: locked thorn line checks, a wide seed-pod barrage, delayed vine eruptions, and an expanding hollow pollen ring. Phase 2 begins below 45% health and increases seed and vine density while preserving readable gaps.

## Ability Table

| Ability | Role | Timing | Damage | Counterplay |
| --- | --- | --- | --- | --- |
| `briar_skewer` | Narrow line projectile | 0.74s windup, 0.08s active, 0.44s recovery | 22 | Sidestep the locked thorn line after the cast faces you. |
| `seed_barrage` | Projectile fan | 1.00s windup, 0.12s active, 0.62s recovery | 13 per seed | Read the spread and dodge through a gap; phase 2 fires 11 seeds. |
| `strangler_grove` | Delayed ground eruptions | 1.12s windup, delayed burst hits | 24 | Leave the locked vine circles before the ground erupts. |
| `pollen_nova` | Expanding hollow ring | 1.28s windup, 0.16s active, 0.94s recovery | 32 | Stay inside the hollow center or cross the rim cleanly. |
| `sovereign_bloom` | Phase transition | One-time below 45% health | 0 | Clears active boss hazards and announces denser phase 2 patterns. |

## Asset Manifest

All art in `assets/monsters/briarheart_sovereign/` was generated fresh for this encounter with `generate2dsprite`.

- 4-direction boss actions: `idle`, `walk`, `cast`, regenerated as 256px runtime frames for cleaner boss-scale rendering.
- Down-facing one-shots: `phase_bloom`, `death`, regenerated as 256px runtime frames for cleaner boss-scale rendering.
- FX/projectiles: `briar_skewer_projectile`, `cursed_seed_projectile`, `vine_eruption_effect`, `pollen_nova_effect`, `seed_impact_effect`
- Each generated folder keeps raw source, processed transparent sheet output, prompt text, metadata, and runtime frame PNGs.

## QA Notes

- The boss body sheets were regenerated at higher runtime resolution after the first pass looked soft at in-game scale.
- The cast raw sheet still reports a few source-edge warnings from tall antlers/vines, but the transparent runtime frames are normalized at 256px.
- The boss appears as the next solo room after Abyssal Bellwraith.
- Telegraph colors use amber, yellow-green, and pollen tones to separate the fight from Nightbloom and Obsidian.

## Acceptance Checklist

- Briarheart Sovereign spawns as a solo boss room.
- Phase 2 triggers once below 45% health and emits `Sovereign bloom`.
- Every ability has readable windup, active, recovery, and cleanup behavior.
- Boss projectiles and hazards clear on player death, boss death, and room transition.
- `npm run test:simulation` and `npm run build` pass.

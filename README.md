# MotherSeed 2D Autobattler

This repository is the hard-fork target for taking MotherSeed 2D in a new auto battler direction.

The intended trajectory is party management plus AI-resolved battles: player characters fight under AI control, victory awards gold, gold buys gear in shops, and later phases add CPU/player-party battles.

See the implementation plan in GitHub issue #1:

https://github.com/ryansm1986/MotherSeed2D-Autobattler/issues/1

## Seeding Note

A literal GitHub fork under `ryansm1986` is not available because the source repository is already owned by that account. A full hard-fork push of the current source was also blocked by repository size: the source is about 2.8 GB, mostly generated art/audio/archive assets.

Recommended next step: seed this repository with a slimmer runtime-focused copy of the codebase, leaving archived/generated asset churn behind or moving heavyweight assets to Git LFS/release artifacts.

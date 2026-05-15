# Monster Fight Intake Prompt

Use this prompt when starting a monster attack, monster ability, or boss-pattern implementation.

```text
Use the reusable monster fight template at assets/monster_fight_template/.

Before implementing, ask me the monster fight intake questions. Start with these, and add any follow-up questions that matter for implementation:

1. What monster and ability do you want to work on?
2. Is this a new ability, a replacement, or a tuning pass on an existing ability?
3. What kind of ability should it be? For example: melee slam, cone breath, projectile volley, ground hazard, summon, buff, teleport, phase attack, or combo.
4. Are there existing animations for it? If yes, where are the animation assets?
5. Are there existing VFX, projectile, telegraph, impact, or ground-hazard assets? If yes, where are those assets?
6. What kind of area should the ability affect? For example: circle, cone, line, donut, ring, ground hazard, projectile path, or multi-zone pattern.
7. Should the area be aimed at the player's current position, predicted position, the monster's facing direction, or a fixed arena location?
8. Should the area follow, track, or lock in place during windup and active frames?
9. Should the ability do damage? If yes, how much, what type, and can it hit the same target more than once?
10. Are projectiles created? If yes, what projectile should be used, how many spawn, where do they spawn, how fast do they move, and how long do they live?
11. Should additional effects happen? For example: status effects, chain tags, knockback, stagger, slow, root, shield, summon, ground hazard, camera shake, hit stop, or sound cue.
12. Where are the assets for those additional effects?
13. What are the windup, active, recovery, and cooldown timings?
14. What should the player see first, and what is the intended counterplay?
15. Is the attack interruptible, dodgeable with invulnerability, blockable, outrangeable, or avoidable only by positioning?
16. When should the monster choose this ability? Include minimum range, maximum range, preferred range, health phase, cooldown, combo rules, and random weight if known.
17. Are there any phase changes, enrage rules, or fight-specific restrictions tied to this ability?
18. What should count as a successful implementation during playtest?

After the answers, propose the implementation files using this convention:

- Shared runtime logic: src/game/combat/monster-fights/
- Authored fight data: src/game/content/monster-fights/<monster_id>.fight.ts
- Monster ability assets: assets/monsters/<monster_id>/<ability_id>/

Use kebab-case for monster ids and ability ids in content. Preserve existing asset folder names when they already exist, and map them from the content id if needed.
```

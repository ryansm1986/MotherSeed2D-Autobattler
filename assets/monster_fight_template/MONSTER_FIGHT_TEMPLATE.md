# Monster Fight Ability Template

Use this template for one monster ability, one monster attack pattern, or a focused pass on an existing monster fight.

## 1. Ability Identity

- Monster id:
- Ability id:
- Display name:
- Fight role:
- Is this ability new or replacing an existing one?
- Which fight phase or health band can use it?

## 2. Existing Assets

- Is there an existing monster animation for the ability?
- Existing animation asset folder:
- Animation directions required:
- Are there existing VFX, projectile, telegraph, impact, or ground hazard assets?
- Additional asset paths:
- Missing assets:

## 3. Timing

- Windup duration:
- Telegraph appears at:
- Active duration:
- Hit timing:
- Recovery duration:
- Cooldown or reuse delay:
- Can the monster turn or track the target during windup?
- Can the monster move during windup, active, or recovery?

## 4. Area And Targeting

- Targeting style:
- Area shape:
- Area size:
- Range:
- Offset from monster or target:
- Direction rules:
- Does the area follow the monster, lock at cast start, or lock at active start?
- Can the player dodge through it with invulnerability?
- Can obstacles block or alter the ability?

Common area shapes:

- Circle
- Cone
- Line
- Donut
- Expanding ring
- Ground hazard
- Projectile path
- Multi-zone pattern

## 5. Damage

- Should it do damage?
- Damage amount:
- Damage type:
- Hit frequency:
- Can it hit the same target more than once per cast?
- Does damage scale by phase, difficulty, or monster health?
- Does it apply knockback, stagger, meter loss, or stamina pressure?

## 6. Projectiles

- Are projectiles created?
- Projectile asset id or path:
- Projectile count:
- Spawn point:
- Speed:
- Lifetime:
- Collision radius:
- Pattern:
- Homing, arcing, bouncing, piercing, or splitting rules:
- Impact effect:
- Cleanup rule:

## 7. Additional Effects

- Should additional effects happen?
- Status effects applied:
- Chain tags applied, extended, or detonated:
- Ground hazards spawned:
- Summons spawned:
- Buffs or shields applied to the monster:
- Debuffs applied to the player:
- Screen shake, hit stop, camera behavior, or sound cues:
- Asset paths for these effects:

## 8. Counterplay And Readability

- What should the player see first?
- What is the intended dodge or positioning answer?
- Is the attack interruptible?
- Can the player outrange it?
- Can the player stay close safely?
- What makes the attack fair?
- What should debug overlays show?

## 9. AI Selection Rules

- Minimum range to choose this ability:
- Maximum range to choose this ability:
- Preferred range:
- Health or phase requirements:
- Cooldown priority:
- Combos or preceding abilities:
- Abilities that should not be chosen immediately before or after this:
- Random weight:
- Enrage or phase-change behavior:

## 10. Implementation Notes

- Runtime helper needed:
- Authored fight file:
- Asset manifest updates:
- Renderer updates:
- HUD or event-log updates:
- Placeholder behavior allowed:
- Known risks:

## 11. Acceptance Checklist

- Ability has stable `monster_id` and `ability_id`.
- Existing assets are referenced by stable paths or missing assets are listed.
- Windup, active, recovery, and cooldown timing are defined.
- Telegraph shape and active hit shape are defined.
- Damage and status behavior are defined, including repeat-hit rules.
- Projectile behavior is defined or explicitly not used.
- Counterplay is clear enough to playtest.
- AI selection rules are specific enough to implement.
- Debug or QA notes identify what must be visually checked.

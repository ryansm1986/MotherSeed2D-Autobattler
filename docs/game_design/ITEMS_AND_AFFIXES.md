# Items And Affixes Design

## Purpose

Gear is the main way the player shapes the party between automatic fights. Each item should answer at least one useful question:

1. Who is this party member trying to be: frontline, striker, caster, support, controller, or hybrid?
2. What does this item add to the Branch Lattice auto-loop?
3. Does this item change the active Special bar or Mother Load timing?
4. Does it create a party-wide MMO-style interaction, such as shielding, healing, debuffing, taunting, haste, or target focus?
5. Does it give the player a readable reason to buy, equip, bench, or replace it before the next fight?

The first implementation should stay small and match the current prototype: eight item slot types, nine equip positions because rings have two positions, four core stats, item rarity, stat rolls, gear-granted Specials, Branch Lattice Ability options, and Branch Lattice Modifier options.

## Research Takeaways

References checked on May 15, 2026:

- [Teamfight Tactics Patch 14.5 Items Update](https://teamfighttactics.leagueoflegends.com/en-us/news/game-updates/patch-14-5-items-update/): Riot describes item reworks in terms of clearer item fantasy, broader core use cases, and moving narrow effects into more special item spaces.
- [Hearthstone Battlegrounds Trinkets](https://www.hsbattlegrounds.help/en/mechanics/trinkets): timed shop offerings create permanent passive commitments at key turns, with cheaper early options and stronger mid-game identity picks.
- [Dota Underlords items](https://dotaunderlords.fandom.com/wiki/Items): item offers are staged by round, sorted into functional categories, and constrained by what a hero can equip.
- [Super Auto Pets gameplay](https://en.wikipedia.org/wiki/Super_Auto_Pets): the preparation phase is where players buy, buff, order, and reshape the team; the battle phase resolves automatically.

MotherSeed should borrow the principles, not the exact systems:

| Principle | MotherSeed version |
| --- | --- |
| Clear item fantasy beats raw math. | Each item advertises a role, Special hook, Branch card, or party interaction. |
| Broad items belong in the core pool. | Common and Uncommon gear should be useful on more than one class or party slot. |
| Narrow fantasies need rarity or authored placement. | Rare gear can carry class-specific Specials, Mother Load hooks, or unusual Branch interactions. |
| Timed offers create strategy. | Shops and victory rewards should ask the player to commit before the next fight, not solve everything with infinite rerolls. |
| Automatic combat needs readable setup. | Items should make the pre-fight plan obvious enough to understand once the fight starts. |

## MotherSeed Itemization Pillars

MotherSeed combat is closer to a small MMO party fight than a board-only auto chess game. The player manages a party, gear, Branch Lattice sequencing, target focus, and Specials; the units execute positioning and basic combat automatically.

Itemization therefore needs five parallel lanes:

| Lane | What it changes | Example |
| --- | --- | --- |
| Personal Stats | A member's damage and survival. | `+4 Strength`, `+5 Vitality`. |
| Branch Loop | Automatic rotation actions and adjacent modifiers. | `Grants Thorn Jab`, `Quickroot modifies adjacent Abilities`. |
| Specials | Active meter-spending buttons and Mother Load chains. | `Grants Mother Spin`, `Moonfall opens Mother Load`. |
| Party Utility | MMO-style roles, auras, protection, healing, target focus, and debuffs. | `First ally below 40% HP gains a barrier`. |
| Economy And Tempo | Shop pressure, reward timing, rerolls, and item commitment. | `Cheaper support item that stabilizes early rounds`. |

The first playable version does not need every lane on every item. A good item can be simple. A great item should make the player imagine a party plan.

## Party And MMO Combat Roles

Use role tags to guide item generation, UI sorting, and future shop filtering. These are design tags first; they do not need to become code tags until a system consumes them.

| Role tag | Combat job | Good item hooks |
| --- | --- | --- |
| Frontline | Holds enemy attention and survives contact. | Vitality, barrier, taunt, pull, damage reduction, self-heal Specials. |
| Striker | Deals weapon or physical burst. | Strength or Dexterity, attack cadence, bleed, execute, cleave Specials. |
| Caster | Deals spell damage or area pressure. | Intelligence, meter gain, ranged casts, shred, delayed burst Specials. |
| Support | Keeps allies alive or stronger. | Healing, shields, cleanse, haste, meter donation, targeted Specials. |
| Controller | Shapes enemy movement and timing. | Root, slow, silence, vulnerability, target priority effects. |
| Tempo | Changes when things happen. | Haste, recovery reduction, opener bonuses, Special cooldown compression. |

Party composition should matter. An item that is mediocre on one hero can become excellent if another hero already supplies the missing piece, such as a Cleric making a Warrior's barrier item stronger or a Ranger making a target-marking helmet valuable.

## Equipment Slots

The item slot type describes what kind of thing the object is. The equip state can still expose two ring positions.

| Slot | Count | Primary design role |
| --- | ---: | --- |
| Helmet | 1 | Targeting, focus, cast timing, opener effects, and class-flavored utility. |
| Body Armour | 1 | Frontline survival, mitigation, barriers, taunts, and ally-protection hooks. |
| Gloves | 1 | Attack cadence, on-hit effects, combo hooks, and physical Branch actions. |
| Ring | 2 | Flexible stat fixing, small build hooks, conditional party utility, and narrow modifiers. |
| Amulet | 1 | High-impact identity piece, rare modifiers, party auras, and class scaling. |
| Weapon | 1 | Primary source of Specials and basic attack identity. Weapons do not grant Branch Lattice Abilities. |
| Pants | 1 | Formation tempo, vitality, recovery timing, and support/controller utility. |
| Boots | 1 | Positioning logic, haste, opener timing, and target-acquisition utility. |

Implementation note: the current inventory UI can use internal labels such as `bodyArmour`, `pants`, `ringOne`, and `ringTwo`. Player-facing copy should prefer `Body Armour`, `Pants`, and `Ring`.

## Core Stats

For now, stats are intentionally direct and easy to tune.

| Stat | Current effect | Associated classes | Party role flavor |
| --- | --- | --- | --- |
| Strength | Increases associated class damage. | Warrior | Frontline and physical striker scaling. |
| Intelligence | Increases associated class damage. | Mage, Cleric | Caster and support scaling. |
| Dexterity | Increases associated class damage. | Ranger, Thief | Striker, ranged, cadence, and precision scaling. |
| Vitality | Increases maximum HP. | All classes | Frontline, survival, and stabilizing support scaling. |

Prototype tuning:

| Rule | Starting value |
| --- | ---: |
| Associated damage stat | +1% damage per point |
| Vitality | +5 maximum HP per point |
| Off-stat damage | 0% until hybrid scaling is needed |

Do not add more core stats yet. If the design needs Spirit, Wisdom, Haste, Armor, or Resistance, express them first as affix effects or derived labels so the tuning surface stays small.

## Item Data Model

Every generated item should be serializable and independent from Canvas or DOM objects.

Suggested long-term shape:

```ts
type GearSlot =
  | "helmet"
  | "bodyArmour"
  | "gloves"
  | "ring"
  | "amulet"
  | "weapon"
  | "pants"
  | "boots";

type GearEquipSlot =
  | "helmet"
  | "bodyArmour"
  | "gloves"
  | "ringOne"
  | "ringTwo"
  | "amulet"
  | "weapon"
  | "pants"
  | "boots";

type CoreStat = "strength" | "intelligence" | "dexterity" | "vitality";

type GearRoleTag = "frontline" | "striker" | "caster" | "support" | "controller" | "tempo";

type GearItem = {
  id: string;
  name: string;
  slot: GearSlot;
  rarity: GearRarity;
  itemLevel: number;
  iconId: string;
  roleTags: GearRoleTag[];
  stats: Partial<Record<CoreStat, number>>;
  affixes: GearAffix[];
  specials?: WeaponSpecialDefinition[];
};
```

`ringOne` and `ringTwo` are equip positions. The item itself should keep slot type `ring`; equip state decides which ring position holds it.

Weapon items use `specials` for active meter-spending skills. Non-weapon gear can contribute Branch Lattice Abilities, Modifiers, party utility, and in rare authored cases Specials.

## Affix Types

Affixes are the rolled properties on an item. They are grouped by what they feed.

| Affix type | Example | Gameplay result |
| --- | --- | --- |
| Stat Affix | `+4 Strength` | Raises derived damage or HP. |
| Ability Affix | `Grants Branch Ability: Thorn Jab` | Adds a draggable Ability card to the Branch Lattice. |
| Modifier Affix | `Grants Branch Modifier: Quickroot` | Adds a draggable Modifier card to the Branch Lattice. |
| Special Affix | `Grants Special: Moonfall` | Adds or replaces an active numbered Special. |
| Party Utility Affix | `First ally below 40% HP gains a barrier` | Adds automatic MMO-style support behavior. |
| Targeting Affix | `Marked enemies take more ranged damage` | Gives party focus and role synergy. |
| Economy Affix | `Shop discount after elite wins` | Future run-level strategy hook. |

The first pass should prioritize Stat, Ability, Modifier, and existing gear-granted Special affixes. Party Utility and Targeting affixes should be authored carefully once the party AI and target-selection rules are ready to consume them.

## Branch Lattice Relationship

The Branch Lattice is the loadout editor for automatic gear behavior. Inventory owns item placement; Branch Lattice owns how class baseline Abilities and equipped item effects are sequenced.

The lattice is assembled from two pools:

1. Available Abilities.
   These are action nodes from class baseline and non-weapon gear affixes. They can be placed into Ability sockets. They have no independent cooldowns. The auto-loop runs slotted Abilities from top to bottom, then restarts after the loop delay.

2. Available Modifiers.
   These are effect nodes from non-weapon gear affixes. They can be placed into Modifier sockets. A Modifier changes adjacent Abilities in the chain.

General socket rule: `N` Ability sockets use `N + 1` Modifier sockets. The prototype starts with four Ability sockets and five Modifier sockets:

```text
Modifier 0 -> Ability 1 -> Modifier 1 -> Ability 2 -> Modifier 2 -> Ability 3 -> Modifier 3 -> Ability 4 -> Modifier 4
```

| Socket | Behavior |
| --- | --- |
| Modifier 0 | Sits before Ability 1 and affects Ability 1 only. |
| Modifier 1 | Sits between Ability 1 and Ability 2 and affects both. |
| Modifier 2 | Sits between Ability 2 and Ability 3 and affects both. |
| Modifier 3 | Sits between Ability 3 and Ability 4 and affects both. |
| Modifier 4 | Sits after Ability 4 and affects Ability 4 only. |

Each Ability can therefore receive up to two Modifiers:

| Ability | Previous Modifier | Next Modifier |
| --- | --- | --- |
| Ability 1 | Modifier 0 | Modifier 1 |
| Ability 2 | Modifier 1 | Modifier 2 |
| Ability 3 | Modifier 2 | Modifier 3 |
| Ability 4 | Modifier 3 | Modifier 4 |

If a shared Modifier is incompatible with one neighbor but compatible with the other, it only affects the compatible Ability. If a Modifier has no adjacent Ability, it is dormant.

## Specials Relationship

Specials are not Branch Lattice actions. They are deliberate meter-spending buttons, usually sourced from weapons and rare authored gear.

Special design rules:

- The numbered Special bar should be readable as the player's active MMO hotbar.
- Gear-granted Specials should carry clear role tags: damage, heal, shield, control, summon, reposition, or Mother Load.
- Weapons are the cleanest place to grant Specials because they define combat identity.
- Rare amulets and class relics can grant Specials when the item is meant to be an identity piece.
- Specials tagged `MotherLoad` open a Mother Load window when cast. A back-to-back `MotherLoad` Special consumes the window for a bonus effect and opens the next one.
- Support, heal, shield, and buff Specials should usually stay untagged unless they are deliberately part of a Mother Load chain.
- The first three equipped Specials fill the numbered bar; if no gear grants Specials, class baseline Specials fill the bar.

The best Special item changes both the decision before the fight and the moment-to-moment button plan during the fight.

## Ability Affixes

Ability affixes add new auto-loop actions. They should be understandable at a glance and should not replace weapon Specials. Specials are deliberate meter spends; Branch Abilities are automatic sequence pieces.

Ability design rules:

- Ability affixes are uncommon-to-rare rolls and an item can have at most one Ability affix.
- An Ability should have a range, sequence time, class tags, role tags, and a short effect.
- An Ability should not have an independent cooldown. Its timing comes from its position in the auto-loop.
- It should be useful without the perfect Modifier.
- It should create a visible combat beat: hit, bolt, pulse, ward, trap, burst, heal tick, mark, or taunt.
- It should be safe to run automatically once the target or ally condition is valid.
- Branch Lattice Abilities tagged `Finisher` provide starter identity attacks and auto-slotting hooks, but do not open Mother Load.
- Weapons do not grant Branch Lattice Abilities.

Starter Ability pool:

| Ability | Suggested source slots | Role | Effect |
| --- | --- | --- | --- |
| Basic Attack 1 | Class baseline | Striker | Default auto strike using the equipped weapon profile. Feeds combo effects. |
| Panache Slash | Warrior starter amulet | Striker | Finisher front flip slash for Branch Lattice identity and auto-slotting. |
| Combo Attack | Gloves, Amulet | Striker | Extra weapon hit if the previous Ability was an attack. |
| Haste | Boots, Pants, Amulet | Tempo | Speeds the rest of the auto sequence for a short time. |
| Thorn Jab | Gloves, Ring | Striker | Short melee hit that can apply physical modifiers. |
| Ember Seed | Ring, Amulet, Helmet | Caster | Small ranged fire hit against the current target. |
| Ward Pulse | Body Armour, Amulet | Frontline / Support | Brief self-barrier and small radiant pulse. |
| Root Snare | Boots, Pants, Ring | Controller | Small bind or slow pulse near the target. |
| Focused Shot | Helmet, Gloves, Ring | Striker | Long-range hit favored by Dexterity classes. |
| Mendbeat | Amulet, Ring, Body Armour | Support | Small automatic heal for the lowest-health nearby ally. |
| Rally Mark | Helmet, Gloves, Amulet | Support / Tempo | Marks the target so allies gain meter when hitting it. |

## Modifier Affixes

Modifier affixes alter adjacent Abilities in the Branch Lattice chain. Modifiers are where most item personality should live.

Modifier design rules:

- A Modifier should change how adjacent compatible Abilities behave, not simply add invisible damage.
- The best Modifiers should create sequencing questions because shared sockets affect both the previous and next Ability.
- Modifiers should name the effect clearly enough for a tooltip to carry the rules.
- Early Modifiers can be mostly additive. Later ones can transform shape, condition, target rules, role tags, or chain tags.
- MMO-style support Modifiers should be visible in combat: a shield ring, heal pulse, target mark, taunt flare, or cast-speed flash.

Starter Modifier pool:

| Modifier | Suggested source slots | Role | Effect |
| --- | --- | --- | --- |
| Fire Modifier | Ring, Gloves, Amulet | Caster | Adjacent compatible Abilities add a small fire hit. |
| Bleed Edge | Gloves, Ring | Striker | Adjacent physical Abilities apply a short bleed. |
| Quickroot | Boots, Pants, Gloves | Tempo | Adjacent compatible Abilities have reduced recovery or sequence time. |
| Sap Fed | Body Armour, Ring | Support | Adjacent compatible Abilities grant a little extra meter. |
| Amber Vein | Amulet, Ring | Striker / Caster | Adjacent compatible Abilities have higher burst damage. |
| Wardwoven | Helmet, Body Armour | Frontline / Support | Adjacent compatible Abilities grant a small barrier on hit. |
| Star Bloom | Amulet, Helmet | Caster | Adjacent compatible area Abilities gain radius. |
| Motherseed Echo | Amulet, Rare Ring | Tempo | Adjacent compatible Abilities repeat a portion of their effect after a delay. |
| Rallying | Helmet, Amulet | Support | Adjacent target-marking or attack Abilities grant nearby allies meter. |
| Protector's Wake | Body Armour, Pants | Frontline | Adjacent defensive Abilities also shield the lowest-health ally. |

## Rarity And Roll Budget

Current generated gear uses `Common`, `Uncommon`, and `Rare`. Keep that ladder while the systems are still compact.

| Rarity | Color target | Affix budget | Allowed affix types | Ability affix limit | Special access | Design role |
| --- | --- | ---: | --- | --- | --- | --- |
| Common | Green | 1 | Stat, simple role text, or starter modifier hook | 0 | Weapon baseline only | Readable upgrades and early role sorting. |
| Uncommon | Blue | 2 | Stat, Modifier, or simple Ability | Max 1 | Occasional weapon Special upgrade | First build-shaping choices. |
| Rare | Purple | 3 | Stat, Modifier, Ability, or authored utility | Max 1 | Weapons and rare identity pieces | High-impact items that can define a party member. |
| Epic | Gold, future | 4 | Any, with stricter authored pools | Max 1 | Strong identity Specials | Future capstone items, not needed for the first pass. |

Ability affixes should be uncommon within the affix pool even when the rarity has enough budget. They are build-defining and should not stack on a single item.

Weapon rarity spends its item budget on Specials and basic attack identity instead of Branch cards. Weapons can roll stats and Specials, but they do not add Branch Lattice Ability or Modifier cards.

## Offer And Reward Pacing

Autobattler itemization works best when the player makes imperfect commitments.

Guidelines:

- Shops should offer a small set of readable items, not a giant catalogue.
- At least one offer should usually be broadly useful, such as Vitality, a support hook, or a class-stat upgrade.
- At least one offer can be build-directional, such as a Branch Modifier, role tag, or Special hook.
- Victory rewards can be more specific than shop items because they are earned from authored encounters.
- Elite and boss rewards are good places for rare Specials, party utility, and Mother Load interactions.
- Avoid making every item equally flexible. Some narrow items are healthy if the player has enough sell, bench, or reroll options.
- Do not require a perfect item recipe before the party can function. The core loop should survive bad rolls.

## Slot Identity

Each slot should have a preferred affix personality. This keeps loot readable and makes it easier to author tables.

| Slot | Stat tendencies | Ability tendencies | Modifier tendencies | Special / party tendencies |
| --- | --- | --- | --- | --- |
| Helmet | Intelligence, Dexterity, Vitality | Focused Shot, Rally Mark, utility pulses | Wardwoven, targeting, timing | Target focus, opener tempo, caster support. |
| Body Armour | Vitality, Strength | Ward Pulse | Sap Fed, Wardwoven, Protector's Wake | Barriers, taunts, frontline stabilization. |
| Gloves | Strength, Dexterity | Combo Attack, Thorn Jab | Bleed Edge, Quickroot, on-hit effects | Striker burst and attack cadence. |
| Ring | Any single stat | Ember Seed, Mendbeat, small pulses | Fire Modifier, Amber Vein, Sap Fed | Narrow build hooks, utility toggles, small party effects. |
| Amulet | Associated class stat, Vitality | Haste, Ward Pulse, rare identity abilities | Motherseed Echo, Star Bloom, Amber Vein | Party auras, class identity, rare non-weapon Specials. |
| Weapon | Associated class stat | None | None | Primary Special packages and basic attack identity. |
| Pants | Vitality, Dexterity | Root Snare, Haste | Formation tempo, Protector's Wake | Support tempo, survival, control setup. |
| Boots | Dexterity, Vitality | Haste, Root Snare | Quickroot, opener timing | Positioning AI, target acquisition, tempo support. |

## Item Naming

Use names to surface the most important affix. The player should often understand the item before opening the details panel.

Naming pattern:

```text
[Material/Theme Prefix] [Base Item] of [Signature Affix]
```

Examples:

| Item | Slot | Rarity | Rolls |
| --- | --- | --- | --- |
| Rootguard Body Armour | Body Armour | Common | +5 Vitality |
| Ambervein Ring of Sparks | Ring | Uncommon | +3 Intelligence, Fire Modifier |
| Oathroot Cleaver of Motherslash | Weapon | Rare | +5 Strength, weapon Special package |
| Thornlit Gloves of Quickroot | Gloves | Rare | +4 Dexterity, Thorn Jab, Quickroot |
| Star-Bloom Amulet of Rallying | Amulet | Rare | +3 Intelligence, Haste, Rallying |
| Moonweave Pants of Protector's Wake | Pants | Uncommon | +4 Vitality, Protector's Wake |

## Example Party Gear Plan

A Warrior, Cleric, and Ranger party equips:

| Party member | Equipped item | Contribution |
| --- | --- | --- |
| Warrior | Oathroot Cleaver of Motherslash | Weapon Specials and frontline damage identity. |
| Warrior | Rootguard Body Armour | Wardwoven barrier hook. |
| Cleric | Star-Bloom Amulet of Rallying | Haste, Rallying, and support meter flow. |
| Cleric | Moonweave Pants of Protector's Wake | Defensive support modifier. |
| Ranger | Thornlit Gloves of Quickroot | Combo Attack and Quickroot sequence speed. |
| Ranger | Ambervein Ring of Sparks | Fire Modifier and ranged damage scaling. |

Warrior Branch Lattice:

| Chain position | Slotted card | Result |
| --- | --- | --- |
| Modifier 0 | Wardwoven | Affects Basic Attack 1 only. |
| Ability 1 | Basic Attack 1 | Receives Wardwoven and Quickroot. |
| Modifier 1 | Quickroot | Shared by Basic Attack 1 and Panache Slash. |
| Ability 2 | Panache Slash | Receives Quickroot and Sap Fed. |
| Modifier 2 | Sap Fed | Shared by Panache Slash and Thorn Jab. |
| Ability 3 | Thorn Jab | Receives Sap Fed and Fire Modifier. |
| Modifier 3 | Fire Modifier | Shared by Thorn Jab and Haste. |
| Ability 4 | Haste | Receives Fire Modifier only if compatible; otherwise Fire Modifier is dormant for Haste. |
| Modifier 4 | Empty | No effect. |

This turns gear into an automatic party rotation while leaving Specials as the player's active fight buttons.

## Derived Power

Derived stats should be computed from equipped items and class data, not stored as hand-mutated permanent values.

Prototype formulas:

```text
damageMultiplier = 1 + associatedDamageStat * 0.01
maxHealth = classBaseHealth + vitality * 5
```

Examples:

| Class | Associated stat | Example |
| --- | --- | --- |
| Warrior | Strength | 12 Strength means +12% damage. |
| Mage | Intelligence | 10 Intelligence means +10% damage. |
| Cleric | Intelligence | 8 Intelligence means +8% damage. |
| Ranger | Dexterity | 11 Dexterity means +11% damage. |
| Thief | Dexterity | 14 Dexterity means +14% damage. |

Vitality always applies to maximum HP regardless of class.

## UI Requirements

Inventory screen:

- Shows the nine equipment positions.
- Allows rings to occupy either ring position.
- Shows item stat affixes, role tags, Branch contributions, and Special contributions in the details panel.
- Shows whether the item is mostly personal, party utility, Branch, or Special focused.
- Keeps item movement separate from Branch Lattice sequencing.

Branch Lattice screen:

- Shows the currently equipped gear summary.
- Shows total Strength, Intelligence, Dexterity, and Vitality.
- Shows available Ability cards from class baseline and equipped non-weapon items.
- Shows available Modifier cards from equipped non-weapon items.
- Shows active numbered Specials from equipped gear, falling back to class baseline Specials.
- Shows the item source on each card, such as `from Thornlit Gloves`.
- Shows dormant Modifier feedback when it has no adjacent compatible Ability.
- Keeps the current drag-to-socket interaction.

Party and shop screens:

- Show which party member can use an item before purchase.
- Show role tags compactly enough for quick comparison.
- Make Special-granting items obvious.
- Distinguish a personal upgrade from a party utility upgrade.
- Keep reroll, buy, equip, and start-fight decisions fast.

## Implementation Ownership

Keep the feature within the current architecture:

| Concern | Owner |
| --- | --- |
| Item, stat, affix, equipment types | `src/game/types.ts` |
| Gear table data and affix pools | `src/game/content/gear-tables.ts` |
| Gear generation, equip logic, derived stat aggregation | `src/game/combat/gear.ts` |
| Serializable equipment state | `src/game/state.ts` |
| Branch Lattice auto-loop execution | `src/game/combat/abilities.ts` |
| Party targeting and positioning interpretation | `src/game/combat/party-ai.ts` |
| Inventory DOM rendering and item details | `src/ui/inventory.ts` |
| Branch Lattice DOM rendering and source labels | `src/ui/branch-lattice.ts` |
| HUD summaries for damage/HP/gear/Specials | `src/ui/hud.ts` |

Do not store DOM nodes, Canvas objects, images, or sprite frames in gear state. Gear state should be plain JSON-compatible data.

## First Implementation Slice

The smallest useful version:

1. Keep equipment state with the eight item slot types and nine equip positions.
2. Keep `strength`, `intelligence`, `dexterity`, and `vitality` rolls.
3. Compute associated damage multiplier and max HP from equipped stats.
4. Let class baseline and equipped non-weapon gear aggregate Branch Lattice Ability options.
5. Let equipped non-weapon gear aggregate Branch Lattice Modifier options.
6. Keep Basic Attack 1 as the class baseline, then use Haste, Combo Attack, and starter Modifiers as the first affix pool.
7. Show item source labels in the Branch Lattice card lists.
8. Show gear-granted Specials in the active numbered bar, falling back to class Specials when no gear Specials are equipped.
9. Add role-tag copy to item details before building deeper role systems.
10. Keep shop offers small, readable, and biased toward one broad item plus one build-directional item.

This gives the game a real itemization spine without requiring a full crafting system, component recipe grid, or endgame rarity ladder yet.

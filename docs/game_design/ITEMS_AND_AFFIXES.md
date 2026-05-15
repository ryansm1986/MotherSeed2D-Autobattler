# Items And Affixes Design

## Purpose

Gear should do more than raise numbers. Each item is a build object with three jobs:

1. Add simple character power through stats.
2. Contribute Abilities or Modifiers to the Branch Lattice screen.
3. Give the player a readable reason to change their auto-loop between fights.

The first implementation should stay small: nine equipment slots, four core stats, item rarity, stat affixes, Branch Lattice ability affixes, and Branch Lattice modifier affixes.

## Equipment Slots

The player has nine equipped item positions:

| Slot | Count | Primary design role |
| --- | ---: | --- |
| Helmet | 1 | Utility, targeting, timing, class-flavored stats. |
| Body Armour | 1 | Vitality, mitigation, defensive modifiers. |
| Gloves | 1 | Attack cadence, on-hit effects, dexterity or strength rolls. |
| Ring | 2 | Flexible stat fixing, unusual modifiers, narrow build hooks. |
| Amulet | 1 | High-impact identity piece, rare modifiers, class scaling. |
| Weapon | 1 | Primary source of Specials. Weapons do not grant Branch Lattice Abilities. |
| Pants | 1 | Mobility, stamina, vitality, dodge-adjacent modifiers. |
| Boots | 1 | Movement, dodge recovery, haste, positional effects. |

Implementation note: the current inventory UI labels body and pants as `chest` and `legs`. That can remain as internal UI wording during the prototype, but item data should use a stable slot model that can display `Body Armour` and `Pants` to the player.

## Core Stats

For now, stats are intentionally direct and easy to tune.

| Stat | Current effect | Associated classes |
| --- | --- | --- |
| Strength | Increases associated class damage. | Warrior |
| Intelligence | Increases associated class damage. | Mage, Cleric |
| Dexterity | Increases associated class damage. | Ranger, Thief |
| Vitality | Increases maximum HP. | All classes |

Prototype tuning:

| Rule | Starting value |
| --- | ---: |
| Associated damage stat | +1% damage per point |
| Vitality | +5 maximum HP per point |
| Off-stat damage | 0% until hybrid scaling is needed |

This keeps early balance legible. A Warrior wants Strength and Vitality, a Mage wants Intelligence and Vitality, and a Thief or Ranger wants Dexterity and Vitality. Cleric uses Intelligence for now so the four-stat model can support all current classes without adding Spirit or Wisdom yet.

## Item Data Model

Every generated item should be serializable and independent from Canvas or DOM objects.

Suggested fields:

```ts
type GearSlot =
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

type GearItem = {
  id: string;
  name: string;
  slot: GearSlot;
  rarity: GearRarity;
  itemLevel: number;
  iconId: string;
  stats: Partial<Record<CoreStat, number>>;
  affixes: GearAffix[];
  specials?: WeaponSpecialDefinition[];
};
```

`ringOne` and `ringTwo` are equip positions. The item itself can still have slot type `ring`; the equip state decides which ring position holds it.

Weapon items use `specials` for their active meter-spending skills. Non-weapon gear can contribute Branch Lattice Abilities and Modifiers through affixes.

## Affix Types

Affixes are the rolled properties on an item. They are grouped by what they feed.

| Affix type | Example | Gameplay result |
| --- | --- | --- |
| Stat Affix | `+4 Strength` | Raises derived damage or HP. |
| Ability Affix | `Grants Branch Ability: Thorn Jab` | Adds a draggable Ability card to the Branch Lattice. |
| Modifier Affix | `Grants Branch Modifier: Quickroot` | Adds a draggable Modifier card to the Branch Lattice. |
| Future Conditional Affix | `After dodging, gain +Dexterity` | Later hook for stateful effects. |

The first pass should only implement Stat, Ability, and Modifier affixes.

## Branch Lattice Relationship

The Branch Lattice is the loadout editor for gear behavior. Inventory owns item placement; Branch Lattice owns how class baseline Abilities and equipped item effects are sequenced.

The lattice is assembled from two pools:

1. Available Abilities.
   These are action nodes from class baseline and non-weapon gear affixes. They can be placed into Ability sockets. They have no independent cooldowns. The auto-attack loop runs slotted Abilities from top to bottom, then restarts after the loop delay.

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

## Ability Affixes

Ability affixes add new auto-loop actions. They should be understandable at a glance and should not replace weapon Specials. Specials are deliberate meter spends; Branch Abilities are automatic sequence pieces.

Ability design rules:

- Ability affixes are rare rolls and an item can have at most one Ability affix.
- An Ability should have a range, sequence time, class tags, and a short effect.
- An Ability should not have an independent cooldown. Its timing comes from its position in the auto-attack loop.
- It should be useful without the perfect Modifier.
- It should create a visible combat beat: hit, bolt, pulse, dash, ward, trap, or burst.
- It should be safe to run automatically once the target is valid.
- Branch Lattice Abilities tagged `Finisher` provide starter identity attacks and auto-slotting hooks, but do not open Mother Load.
- Gear-granted Specials tagged `MotherLoad` open a Mother Load window when cast. A back-to-back `MotherLoad` Special consumes the window for a bonus effect and opens the next one; support, heal, or buff Specials should stay untagged and clear an active window without triggering it.
- Weapons do not grant Branch Lattice Abilities. Any equipped gear piece can grant Specials, with the first three equipped Specials filling the numbered bar.

Starter Ability pool:

| Ability | Suggested source slots | Effect |
| --- | --- | --- |
| Basic Attack 1 | Class baseline | Default auto strike using the equipped weapon profile. Feeds combo effects. |
| Panache Slash | Warrior starter amulet | Finisher front flip slash for Branch Lattice identity and auto-slotting. |
| Combo Attack | Gloves, Amulet | Extra weapon hit if the previous Ability was an attack. |
| Haste | Boots, Pants, Amulet | Speeds the rest of the auto sequence for a short time. |
| Thorn Jab | Gloves, Ring | Short melee hit that can apply physical modifiers. |
| Ember Seed | Ring, Amulet, Helmet | Small ranged fire hit against the current target. |
| Ward Pulse | Body Armour, Amulet | Brief self-barrier and small radiant pulse. |
| Root Snare | Boots, Pants, Ring | Small bind or slow pulse near the target. |
| Focused Shot | Helmet, Gloves, Ring | Long-range hit favored by Dexterity classes. |

## Modifier Affixes

Modifier affixes alter adjacent Abilities in the Branch Lattice chain. Modifiers are where most item personality should live.

Modifier design rules:

- A Modifier should change how adjacent compatible Abilities behave, not simply add invisible damage.
- The best Modifiers should create sequencing questions because shared sockets affect both the previous and next Ability.
- Modifiers should name the effect clearly enough for a tooltip to carry the rules.
- Early Modifiers can be mostly additive. Later ones can transform shape, condition, or chain tags.

Starter Modifier pool:

| Modifier | Suggested source slots | Effect |
| --- | --- | --- |
| Fire Modifier | Ring, Gloves, Amulet | Adjacent compatible Abilities add a small fire hit. |
| Bleed Edge | Gloves, Ring | Adjacent physical Abilities apply a short bleed. |
| Quickroot | Boots, Pants, Gloves | Adjacent compatible Abilities have reduced recovery or sequence time. |
| Sap Fed | Body Armour, Ring | Adjacent compatible Abilities grant a little extra meter. |
| Amber Vein | Amulet, Ring | Adjacent compatible Abilities have higher burst damage. |
| Wardwoven | Helmet, Body Armour | Adjacent compatible Abilities grant a small barrier on hit. |
| Star Bloom | Amulet, Helmet | Adjacent compatible area Abilities gain radius. |
| Motherseed Echo | Amulet, Rare Ring | Adjacent compatible Abilities repeat a portion of their effect after a delay. |

## Rarity And Roll Budget

Rarity controls exactly how many affixes an item rolls. An affix can be a Stat affix, an Ability affix, or a Modifier affix.

| Rarity | Color | Affix count | Allowed affix types | Ability affix limit | Design role |
| --- | --- | ---: | --- | --- | --- |
| Magic | Green | 1 | Stat or Modifier; Ability only on rare roll | Max 1 | Simple single-hook upgrades. |
| Rare | Blue | 2 | Stat, Modifier, or Ability | Max 1 | First real build-shaping items. |
| Epic | Purple | 3 | Stat, Modifier, or Ability | Max 1 | Best early items; can combine stat, Ability, and Modifier. |

Ability affixes should be uncommon within the affix pool even when the rarity has enough affix budget. They are build-defining and should not stack on a single item.

Weapon rarity spends its item budget on Specials instead of Branch cards. Weapons can roll stats and Specials, but they do not add Branch Lattice Ability or Modifier cards. Other gear can also grant Specials for authored identity pieces, such as debug or starter gear.

## Slot Identity

Each slot should have a preferred affix personality. This keeps loot readable and makes it easier to author tables.

| Slot | Stat tendencies | Ability tendencies | Modifier tendencies |
| --- | --- | --- | --- |
| Helmet | Intelligence, Dexterity, Vitality | Focused Shot, utility pulses | Wardwoven, targeting, timing. |
| Body Armour | Vitality, Strength | Ward Pulse | Sap Fed, Wardwoven, defensive conversions. |
| Gloves | Strength, Dexterity | Combo Attack, Thorn Jab | Bleed Edge, Quickroot, on-hit effects. |
| Ring | Any single stat | Ember Seed, small pulses | Fire Modifier, Amber Vein, Sap Fed. |
| Amulet | Associated class stat, Vitality | Haste, Ward Pulse, rare identity abilities | Motherseed Echo, Star Bloom, Amber Vein. |
| Weapon | Associated class stat | None | None. Weapons provide Specials instead. |
| Pants | Vitality, Dexterity | Root Snare, Haste | Dodge and stamina-adjacent modifiers. |
| Boots | Dexterity, Vitality | Haste, Root Snare | Quickroot, movement-triggered modifiers. |

## Item Naming

Use names to surface the most important affix. The player should often understand the item before opening the details panel.

Naming pattern:

```text
[Material/Theme Prefix] [Base Item] of [Signature Affix]
```

Examples:

| Item | Slot | Rarity | Rolls |
| --- | --- | --- | --- |
| Rootguard Body Armour | Body Armour | Magic / Green | +5 Vitality |
| Ambervein Ring of Sparks | Ring | Rare / Blue | +3 Intelligence, Fire Modifier |
| Oathroot Cleaver of Motherslash | Weapon | Rare / Blue | +5 Strength, weapon Special package |
| Thornlit Gloves of Quickroot | Gloves | Epic / Purple | +4 Dexterity, Thorn Jab, Quickroot |
| Star-Bloom Amulet | Amulet | Epic / Purple | +3 Intelligence, Haste, Star Bloom |

## Example Branch Lattice Loadout

A Warrior equips:

| Equipped item | Contribution |
| --- | --- |
| Oathroot Cleaver of Motherslash | Weapon Specials only |
| Class baseline | Basic Attack 1 |
| Thornlit Gloves of Quickroot | Thorn Jab, Quickroot |
| Ironbark Grips of Bleeding | Combo Attack, Bleed Edge |
| Ambervein Ring of Sparks | Fire Modifier |
| Rootguard Body Armour | Wardwoven |
| Star-Bloom Amulet | Haste, Star Bloom, Sap Fed |

They slot:

| Chain position | Slotted card | Result |
| --- | --- | --- |
| Modifier 0 | Bleed Edge | Affects Basic Attack 1 only. |
| Ability 1 | Basic Attack 1 | Receives Bleed Edge and Quickroot. |
| Modifier 1 | Quickroot | Shared by Basic Attack 1 and Haste. |
| Ability 2 | Haste | Receives Quickroot and Sap Fed. |
| Modifier 2 | Sap Fed | Shared by Haste and Combo Attack. |
| Ability 3 | Combo Attack | Receives Sap Fed and Wardwoven. |
| Modifier 3 | Wardwoven | Shared by Combo Attack and Thorn Jab. |
| Ability 4 | Thorn Jab | Receives Wardwoven and Fire Modifier. |
| Modifier 4 | Fire Modifier | Affects Thorn Jab only. |

This turns gear into a mini rotation without making the player manually press every action.

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

- Shows the nine equipment slots.
- Allows rings to occupy either ring position.
- Shows item stat affixes and Branch contributions in the details panel.
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

## Implementation Ownership

Keep the feature within the current architecture:

| Concern | Owner |
| --- | --- |
| Item, stat, affix, equipment types | `src/game/types.ts` |
| Gear table data and affix pools | `src/game/content/gear-tables.ts` |
| Gear generation, equip logic, derived stat aggregation | `src/game/combat/gear.ts` |
| Serializable equipment state | `src/game/state.ts` |
| Branch Lattice auto-loop execution | `src/game/combat/abilities.ts` |
| Inventory DOM rendering and item details | `src/ui/inventory.ts` |
| Branch Lattice DOM rendering and source labels | `src/ui/branch-lattice.ts` |
| HUD summaries for damage/HP/gear | `src/ui/hud.ts` |

Do not store DOM nodes, Canvas objects, images, or sprite frames in gear state. Gear state should be plain JSON-compatible data.

## First Implementation Slice

The smallest useful version:

1. Add equipment state with the nine slots.
2. Add `strength`, `intelligence`, `dexterity`, and `vitality` rolls.
3. Compute associated damage multiplier and max HP from equipped stats.
4. Let class baseline and equipped non-weapon gear aggregate Branch Lattice Ability options.
5. Let equipped non-weapon gear aggregate Branch Lattice Modifier options.
6. Change the Branch Lattice from four one-to-one Modifier sockets to five between-Ability Modifier sockets.
7. Show item source labels in the Branch Lattice card lists.
8. Keep Basic Attack 1 as the class baseline, then use Haste, Combo Attack, and starter Modifiers as the first affix pool.
9. Generate one dropped item at a time and equip it into the correct slot.

This gives the game a real itemization spine without requiring a full inventory economy, crafting system, or endgame rarity ladder yet.

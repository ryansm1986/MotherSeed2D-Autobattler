export type Vec2 = { x: number; y: number };
export type FrameRect = { x: number; y: number; w: number; h: number };

export type DirectionName = "down" | "down_right" | "right" | "up_right" | "up" | "up_left" | "left" | "down_left";
export type CardinalDirectionName = "down" | "left" | "right" | "up";
export type AnimationName =
  | "idle"
  | "walk"
  | "run"
  | "sprint"
  | "dodge_roll"
  | "attack1"
  | "attack1_side_slash"
  | "front_flip_slash"
  | "rootbreaker_cleave"
  | "thornwall_counter"
  | "motherload_breaker"
  | "verdant_guillotine"
  | "attack2"
  | "damage"
  | "victory";
export type MonsterAnimationName =
  | "idle"
  | "walk"
  | "run"
  | "rock_slam"
  | "rock_spray"
  | "rock_throw"
  | "bite"
  | "cast"
  | "thorn_lance"
  | "petal_fan"
  | "root_snare"
  | "nova"
  | "phase_bloom"
  | "phase_rupture"
  | "phase_toll"
  | "death";
export type MonsterId =
  | "moss_golem"
  | "tree_goblin"
  | "shroom_boy"
  | "nightbloom_matriarch"
  | "obsidian_reliquary"
  | "abyssal_bellwraith"
  | "briarheart_sovereign"
  | "woundclock_arbiter";
export type TelegraphKind =
  | "rock_slam"
  | "rock_spray"
  | "rock_throw"
  | "spore_cloud"
  | "shroom_toss"
  | "bite"
  | "head_throw"
  | "arm_attack"
  | "thorn_lance"
  | "petal_fan"
  | "root_snare"
  | "nightbloom_nova"
  | "phase_bloom"
  | "glass_lance"
  | "shard_spiral"
  | "reliquary_smite"
  | "penitent_wheel"
  | "phase_rupture"
  | "bell_shard"
  | "tolling_fan"
  | "grave_mark"
  | "dirge_nova"
  | "phase_toll"
  | "briar_skewer"
  | "seed_barrage"
  | "strangler_grove"
  | "pollen_nova"
  | "sovereign_bloom"
  | "chrono_lance"
  | "gear_orbit"
  | "clockhand_sweep"
  | "time_rift"
  | "hour_zero";
export type CombatState = "idle" | "windup" | "active" | "recovery" | "dead";
export type PlayerLifeState = "alive" | "dead";

export type WorldAssetName =
  | "grassTile"
  | "mossTile"
  | "stoneTile"
  | "waterTile"
  | "oakTree"
  | "pineTree"
  | "bush"
  | "flowers"
  | "log"
  | "stump"
  | "rock"
  | "banner"
  | "tent"
  | "house"
  | "treeHouse"
  | "chest"
  | "barrel"
  | "crate"
  | "coin";

export type GearSlot = "weapon" | "helmet" | "bodyArmour" | "gloves" | "ring" | "amulet" | "pants" | "boots";
export type GearEquipSlot = "weapon" | "helmet" | "bodyArmour" | "gloves" | "ringOne" | "ringTwo" | "amulet" | "pants" | "boots";

export type GearDrop = {
  name: string;
  slot: GearSlot;
  rarity: "Common" | "Uncommon" | "Rare";
  power: number;
  ability: string;
  frame: FrameGear;
};

export type SpecialAbility = {
  key: string;
  id: string;
  name: string;
  cost: number;
  cooldown: number;
  range: number;
  tags?: SpecialAbilityTag[];
};

export type SpecialAbilityTag = "MotherLoad";

export type LatticeAbilityKind =
  | "basic_attack_1"
  | "combo_attack"
  | "haste"
  | "front_flip_slash"
  | "moonveil_flourish"
  | "rootbreaker_cleave"
  | "thornwall_counter"
  | "verdant_guillotine";
export type LatticeAbilitySource = "class" | "gear";
export type LatticeAbilityTag = "Finisher";

export type LatticeAbilityOption = {
  id: string;
  kind: LatticeAbilityKind;
  name: string;
  detail: string;
  glyph: string;
  range: number;
  baseCooldown: number;
  duration?: number;
  source?: LatticeAbilitySource;
  tags?: LatticeAbilityTag[];
};

export type FrameModifierOption = {
  id: string;
  name: string;
  detail: string;
  glyph: string;
  tone: "common" | "uncommon" | "rare";
};

export type FrameGear = {
  weaponSpecials: SpecialAbility[];
  latticeAbilityOptions: LatticeAbilityOption[];
  modifierOptions: FrameModifierOption[];
};

export type BranchLatticeState = {
  abilitySlotIds: Array<string | null>;
  modifierSlotIds: Array<string | null>;
  selectedAbilitySlot: number | null;
  selectedModifierSlot: number | null;
  isPreviewOpen: boolean;
};

export type AutoAttackLoopState = {
  currentSlotIndex: number;
  slotTimer: number;
  restartTimer: number;
  hasteTimer: number;
  hasteMultiplier: number;
  lastResolvedKind: LatticeAbilityKind | null;
};

export type ClassId = "warrior" | "ranger" | "mage" | "thief" | "cleric";

export type CharacterClass = {
  id: ClassId;
  name: string;
  title: string;
  weapon: string;
  role: string;
  status: "Implemented" | "Planned";
  implemented: boolean;
  accent: string;
  portraitUrl?: string;
  glyph: string;
  stats: {
    health: number;
    stamina: number;
    meter: number;
  };
  abilities: SpecialAbility[];
};

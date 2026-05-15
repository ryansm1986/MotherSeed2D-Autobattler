import { characterClasses } from "../content/classes";
import type { GameEvent, GameState, InventoryBagItem, PartyMemberState } from "../state";
import {
  branchLatticeAbilitySlotCount,
  branchLatticeModifierSlotCount,
  branchLatticeFrame,
  assignStartingLatticeAbilities,
  createFrameGear,
  createMotherLoadWindowState,
  createStartingAmulet,
  createStartingWeapon,
  inventoryColumnCount,
  inventoryRowCount,
  logEvent,
  syncActiveMemberFromCombat,
} from "../state";
import type { ClassId, CoreStat, GearDrop, GearEquipSlot, GearSlot, GearStatBlock, SpecialAbility } from "../types";

const gearSlots: GearSlot[] = ["weapon", "helmet", "bodyArmour", "gloves", "ring", "amulet", "pants", "boots"];
export const coreStatLabels: Record<CoreStat, string> = {
  strength: "Strength",
  intelligence: "Intelligence",
  dexterity: "Dexterity",
  vitality: "Vitality",
};

const gearSlotLabels: Record<GearSlot, string> = {
  weapon: "Weapon",
  helmet: "Helmet",
  bodyArmour: "Body Armour",
  gloves: "Gloves",
  ring: "Ring",
  amulet: "Amulet",
  pants: "Pants",
  boots: "Boots",
};

const gearSlotBaseNames: Record<GearSlot, string[]> = {
  weapon: ["Greatsword", "Staff", "Bow", "Daggers", "Charm"],
  helmet: ["Leaf-Etched Helm", "Crescent Star Helm", "Rootguard Crown"],
  bodyArmour: ["Rootguard Body Armour", "Moonweave Armour", "Barkmail Vest"],
  gloves: ["Thornlit Gloves", "Starthread Gloves", "Ambergrip Wraps"],
  ring: ["Ambervein Ring", "Seedglass Band", "Star-Bloom Ring"],
  amulet: ["Star-Bloom Amulet", "Motherseed Pendant", "Moonlit Charm"],
  pants: ["Scout Pants", "Moonweave Pants", "Rootrunner Legwraps"],
  boots: ["Quickroot Boots", "Moonstep Boots", "Mossbound Sandals"],
};

const gearSlotAbilities: Record<GearSlot, Record<GearDrop["rarity"], string>> = {
  weapon: {
    Common: "Every third auto-attack deals +5 damage.",
    Uncommon: "Every third auto-attack applies Bleed.",
    Rare: "Every third auto-attack applies Bleed and grants +8 Bloom Meter.",
  },
  helmet: {
    Common: "Adds a small targeting and focus roll.",
    Uncommon: "Adds timing utility for Branch Lattice setup.",
    Rare: "Adds strong focus rolls and rare targeting utility.",
  },
  bodyArmour: {
    Common: "Adds vitality and simple mitigation.",
    Uncommon: "Adds defensive stats and a Wardwoven modifier hook.",
    Rare: "Adds high vitality and defensive Branch personality.",
  },
  gloves: {
    Common: "Adds attack cadence and on-hit stat rolls.",
    Uncommon: "Adds a Quickroot or Bleed Edge style combat hook.",
    Rare: "Adds strong attack cadence with a build-shaping Branch hook.",
  },
  ring: {
    Common: "Adds a flexible stat-fixing roll.",
    Uncommon: "Adds a narrow modifier hook for Branch Lattice builds.",
    Rare: "Adds an unusual build hook and stronger stat fixing.",
  },
  amulet: {
    Common: "Adds a high-impact class stat roll.",
    Uncommon: "Adds identity stats and a rare modifier angle.",
    Rare: "Adds a high-impact Branch identity hook.",
  },
  pants: {
    Common: "Adds stamina, vitality, and mobility-adjacent rolls.",
    Uncommon: "Adds Root Snare or Haste-flavored mobility hooks.",
    Rare: "Adds strong mobility rolls and a Branch timing hook.",
  },
  boots: {
    Common: "Adds movement and dodge-adjacent rolls.",
    Uncommon: "Adds Quickroot movement timing.",
    Rare: "Adds strong movement and Haste-flavored Branch hooks.",
  },
};

export function gearDisplaySlot(slot: GearSlot) {
  return gearSlotLabels[slot];
}

export function gearInventorySize(gear: GearDrop) {
  if (gear.slot === "ring" || gear.slot === "amulet") return { width: 1, height: 1 };
  return { width: 2, height: 2 };
}

function weaponBaseName(classId: ClassId) {
  if (classId === "mage") return "Staff";
  if (classId === "ranger") return "Bow";
  if (classId === "thief") return "Daggers";
  if (classId === "cleric") return "Charm";
  return "Greatsword";
}

function createEmptyWeapon(classId: ClassId): GearDrop {
  const frame = createFrameGear(classId, "Common");
  frame.weaponSpecials = [];
  frame.latticeAbilityOptions = [];
  frame.modifierOptions = [];

  return {
    name: "Empty Weapon Slot",
    slot: "weapon",
    rarity: "Common",
    power: 0,
    stats: {},
    ability: "No weapon equipped.",
    frame,
  };
}

function associatedDamageStat(classId: ClassId): CoreStat {
  if (classId === "mage" || classId === "cleric") return "intelligence";
  if (classId === "ranger" || classId === "thief") return "dexterity";
  return "strength";
}

function primaryStatForSlot(classId: ClassId, slot: GearSlot): CoreStat {
  if (slot === "bodyArmour" || slot === "pants") return "vitality";
  if (slot === "helmet" && (classId === "mage" || classId === "cleric")) return "intelligence";
  if (slot === "gloves" && (classId === "ranger" || classId === "thief")) return "dexterity";
  if (slot === "boots") return classId === "warrior" ? "strength" : "dexterity";
  return associatedDamageStat(classId);
}

function statBlockForGear(classId: ClassId, slot: GearSlot, rarity: GearDrop["rarity"], power: number): GearStatBlock {
  const stats: GearStatBlock = {};
  const primary = primaryStatForSlot(classId, slot);
  stats[primary] = (stats[primary] ?? 0) + power;

  if (rarity !== "Common") {
    const secondary: CoreStat = primary === "vitality" ? associatedDamageStat(classId) : "vitality";
    stats[secondary] = (stats[secondary] ?? 0) + Math.max(1, Math.floor(power / 2));
  }
  if (rarity === "Rare") {
    const flex: CoreStat = classId === "warrior" ? "dexterity" : "strength";
    stats[flex] = (stats[flex] ?? 0) + 1;
  }

  return stats;
}

export function aggregateEquippedStats(member: PartyMemberState): Record<CoreStat, number> {
  const totals: Record<CoreStat, number> = {
    strength: 0,
    intelligence: 0,
    dexterity: 0,
    vitality: 0,
  };
  Object.values(member.equippedItems).forEach((gear) => {
    Object.entries(gear?.stats ?? {}).forEach(([stat, value]) => {
      if (stat in totals && Number.isFinite(value)) {
        totals[stat as CoreStat] += value;
      }
    });
  });
  return totals;
}

export function gearDamageMultiplier(member: PartyMemberState) {
  const stats = aggregateEquippedStats(member);
  return 1 + stats[associatedDamageStat(member.classId)] * 0.01;
}

export function scaleGearDamage(member: PartyMemberState, amount: number) {
  return Math.max(1, Math.round(amount * gearDamageMultiplier(member)));
}

export function refreshDerivedGearStats(member: PartyMemberState) {
  const previousMaxHealth = member.maxHealth;
  const nextMaxHealth = characterClasses[member.classId].stats.health + aggregateEquippedStats(member).vitality * 5;
  member.maxHealth = Math.max(1, nextMaxHealth);
  if (member.lifeState === "dead") {
    member.health = 0;
  } else if (previousMaxHealth !== member.maxHealth) {
    member.health = Math.min(member.maxHealth, Math.max(1, member.health + (member.maxHealth - previousMaxHealth)));
  }
}

export function generateGear(classId: ClassId = "warrior"): GearDrop {
  const roll = Math.random();
  const rarity: GearDrop["rarity"] = roll > 0.78 ? "Rare" : roll > 0.36 ? "Uncommon" : "Common";
  const slot = gearSlots[Math.floor(Math.random() * gearSlots.length)];
  const prefix = rarity === "Rare" ? "Oathroot" : rarity === "Uncommon" ? "Thornlit" : "Verdant";
  const baseNames = slot === "weapon" ? [weaponBaseName(classId)] : gearSlotBaseNames[slot];
  const baseName = baseNames[Math.floor(Math.random() * baseNames.length)];
  const power = rarity === "Rare" ? 8 : rarity === "Uncommon" ? 4 : 2;
  const frame = createFrameGear(classId, rarity);
  if (slot === "weapon") {
    frame.latticeAbilityOptions = [];
    frame.modifierOptions = [];
  } else {
    frame.weaponSpecials = [];
    frame.latticeAbilityOptions = frame.latticeAbilityOptions.filter((option) => option.source !== "class");
  }

  return {
    name: slot === "weapon" ? `${prefix} ${baseName}` : `${baseName} of ${prefix}`,
    slot,
    rarity,
    power,
    stats: statBlockForGear(classId, slot, rarity, power),
    ability: gearSlotAbilities[slot][rarity],
    frame,
  };
}

function createStarterDebugGear(classId: ClassId, slot: GearSlot, label = gearDisplaySlot(slot)): GearDrop {
  if (slot === "weapon") return createStartingWeapon(classId);
  if (slot === "amulet") return createDebugStarterAmulet(classId);

  const frame = createFrameGear(classId, "Common");
  frame.weaponSpecials = [];
  frame.latticeAbilityOptions = frame.latticeAbilityOptions.filter((option) => option.source !== "class");

  return {
    name: `Starter ${label}`,
    slot,
    rarity: "Common",
    power: 1,
    stats: statBlockForGear(classId, slot, "Common", 1),
    ability: gearSlotAbilities[slot].Common,
    frame,
  };
}

function createDebugStarterAmulet(classId: ClassId): GearDrop {
  if (classId !== "warrior") return createStartingAmulet(classId);

  const motherspin: SpecialAbility = {
    key: "2",
    id: "motherspin",
    name: "Mother Spin",
    cost: 45,
    cooldown: 7.5,
    range: 220,
    tags: ["MotherLoad"],
  };

  return {
    name: "Warrior Debug Amulet",
    slot: "amulet",
    rarity: "Common",
    power: 1,
    stats: statBlockForGear(classId, "amulet", "Common", 1),
    ability: "Grants Mother Spin, the original Bloom Special spin from the green warrior.",
    frame: {
      weaponSpecials: [motherspin],
      latticeAbilityOptions: [],
      modifierOptions: [],
    },
  };
}

export function grantFullStarterGear(state: GameState): GameEvent[] {
  if (state.player.lifeState !== "alive") return [];

  const weapon = createStartingWeapon(state.selectedClassId);
  state.combat.equippedItems = {
    weapon,
    helmet: createStarterDebugGear(state.selectedClassId, "helmet"),
    bodyArmour: createStarterDebugGear(state.selectedClassId, "bodyArmour"),
    gloves: createStarterDebugGear(state.selectedClassId, "gloves"),
    ringOne: createStarterDebugGear(state.selectedClassId, "ring", "Ring I"),
    ringTwo: createStarterDebugGear(state.selectedClassId, "ring", "Ring II"),
    amulet: createStarterDebugGear(state.selectedClassId, "amulet"),
    pants: createStarterDebugGear(state.selectedClassId, "pants"),
    boots: createStarterDebugGear(state.selectedClassId, "boots"),
  };
  state.combat.equippedGear = weapon;
  clearLootDrop(state);
  normalizeBranchLattice(state);
  syncActiveMemberFromCombat(state);

  return [logEvent("Debug gear equipped", "Full common starter set equipped")];
}

export function equipDrop(state: GameState): GameEvent[] {
  if (state.player.lifeState !== "alive") return [];
  if (!state.combat.droppedGear) return [];
  if (state.combat.droppedGear.slot !== "weapon") {
    return [logEvent("Cannot equip item", "Open the inventory and equip armour into its matching slot")];
  }
  state.combat.equippedGear = state.combat.droppedGear;
  state.combat.equippedItems.weapon = state.combat.droppedGear;
  state.combat.droppedGear = null;
  state.combat.lootCorpseId = null;
  state.combat.hoveredLootCorpseId = null;
  normalizeBranchLattice(state);
  syncActiveMemberFromCombat(state);
  return [logEvent(`Equipped ${state.combat.equippedGear.name}`, state.combat.equippedGear.ability)];
}

function itemCells(slot: number, width: number, height: number) {
  const startCol = slot % inventoryColumnCount;
  const startRow = Math.floor(slot / inventoryColumnCount);
  const cells: number[] = [];

  for (let row = startRow; row < startRow + height; row += 1) {
    for (let col = startCol; col < startCol + width; col += 1) {
      cells.push(row * inventoryColumnCount + col);
    }
  }

  return cells;
}

export function canPlaceInventoryItem(
  state: GameState,
  width: number,
  height: number,
  slot: number,
  ignoreItemId: string | null = null,
) {
  const col = slot % inventoryColumnCount;
  const row = Math.floor(slot / inventoryColumnCount);
  if (slot < 0 || col + width > inventoryColumnCount || row + height > inventoryRowCount) return false;

  const targetCells = new Set(itemCells(slot, width, height));
  return state.combat.inventoryItems.every((item) => {
    if (item.id === ignoreItemId) return true;
    return itemCells(item.slot, item.width, item.height).every((cell) => !targetCells.has(cell));
  });
}

export function firstOpenInventorySlot(state: GameState, width: number, height: number, ignoreItemId: string | null = null) {
  const totalSlots = inventoryColumnCount * inventoryRowCount;
  for (let slot = 0; slot < totalSlots; slot += 1) {
    if (canPlaceInventoryItem(state, width, height, slot, ignoreItemId)) return slot;
  }
  return null;
}

function createInventoryItem(state: GameState, gear: GearDrop, slot: number): InventoryBagItem {
  const size = gearInventorySize(gear);
  const id = `bag-${state.combat.nextInventoryItemId}`;
  state.combat.nextInventoryItemId += 1;
  return {
    id,
    gear,
    classId: state.selectedClassId,
    slot,
    width: size.width,
    height: size.height,
  };
}

function clearLootDrop(state: GameState) {
  state.combat.droppedGear = null;
  state.combat.droppedGearSourceLabel = null;
  state.combat.lootCorpseId = null;
  state.combat.hoveredLootCorpseId = null;
}

export function takeDropToInventory(state: GameState, targetSlot: number | null = null): GameEvent[] {
  if (state.player.lifeState !== "alive") return [];
  if (!state.combat.droppedGear) return [];

  const size = gearInventorySize(state.combat.droppedGear);
  const slot = targetSlot !== null && canPlaceInventoryItem(state, size.width, size.height, targetSlot)
    ? targetSlot
    : firstOpenInventorySlot(state, size.width, size.height);
  if (slot === null) return [logEvent("Inventory full", "Make room before taking this item")];

  const item = createInventoryItem(state, state.combat.droppedGear, slot);
  state.combat.inventoryItems.push(item);
  clearLootDrop(state);
  return [logEvent(`Stowed ${item.gear.name}`, "Added to inventory")];
}

function equipSlotForGear(state: GameState, gear: GearDrop): GearEquipSlot {
  if (gear.slot === "bodyArmour") return "bodyArmour";
  if (gear.slot === "pants") return "pants";
  if (gear.slot !== "ring") return gear.slot;
  if (!state.combat.equippedItems.ringOne) return "ringOne";
  if (!state.combat.equippedItems.ringTwo) return "ringTwo";
  return "ringOne";
}

export function canEquipGearToSlot(gear: GearDrop, equipSlot: GearEquipSlot) {
  if (gear.slot === "ring") return equipSlot === "ringOne" || equipSlot === "ringTwo";
  return gear.slot === equipSlot;
}

export function canEquipInventoryItemToSlot(state: GameState, itemId: string, equipSlot: GearEquipSlot) {
  const item = state.combat.inventoryItems.find((candidate) => candidate.id === itemId);
  if (!item) return false;
  if (item.classId !== state.selectedClassId) return false;
  return canEquipGearToSlot(item.gear, equipSlot);
}

export function canEquipDropToSlot(state: GameState, equipSlot: GearEquipSlot) {
  if (state.player.lifeState !== "alive") return false;
  if (!state.combat.droppedGear) return false;
  return canEquipGearToSlot(state.combat.droppedGear, equipSlot);
}

export function moveInventoryItem(state: GameState, itemId: string, targetSlot: number): GameEvent[] {
  const item = state.combat.inventoryItems.find((candidate) => candidate.id === itemId);
  if (!item) return [];
  if (!canPlaceInventoryItem(state, item.width, item.height, targetSlot, item.id)) return [];

  item.slot = targetSlot;
  return [];
}

export function equipInventoryItem(state: GameState, itemId: string, targetEquipSlot: GearEquipSlot | null = null): GameEvent[] {
  if (state.player.lifeState !== "alive") return [];

  const itemIndex = state.combat.inventoryItems.findIndex((candidate) => candidate.id === itemId);
  if (itemIndex < 0) return [];

  const item = state.combat.inventoryItems[itemIndex];
  if (item.classId !== state.selectedClassId) {
    return [logEvent("Cannot equip item", "This item belongs to another class")];
  }

  if (targetEquipSlot && !canEquipGearToSlot(item.gear, targetEquipSlot)) {
    return [logEvent("Cannot equip item", `${gearDisplaySlot(item.gear.slot)} does not fit that slot`)];
  }

  const equipSlot = targetEquipSlot ?? equipSlotForGear(state, item.gear);
  const previousGear = equipSlot === "weapon" ? state.combat.equippedItems.weapon ?? null : state.combat.equippedItems[equipSlot] ?? null;
  const previousSlot = previousGear
    ? canPlaceInventoryItem(state, gearInventorySize(previousGear).width, gearInventorySize(previousGear).height, item.slot, item.id)
      ? item.slot
      : firstOpenInventorySlot(state, gearInventorySize(previousGear).width, gearInventorySize(previousGear).height, item.id)
    : null;
  if (previousGear && previousSlot === null) {
    return [logEvent("Inventory full", "Make room before swapping equipped gear")];
  }

  state.combat.inventoryItems.splice(itemIndex, 1);
  state.combat.equippedItems[equipSlot] = item.gear;

  if (equipSlot === "weapon") {
    state.combat.equippedGear = item.gear;
  }
  normalizeBranchLattice(state);
  if (equipSlot === "amulet") assignStartingLatticeAbilities(state.combat.branchLattice, item.gear);

  if (previousGear && previousSlot !== null) {
    state.combat.inventoryItems.push(createInventoryItem(state, previousGear, previousSlot));
  }

  syncActiveMemberFromCombat(state);
  return [logEvent(`Equipped ${item.gear.name}`, `${gearDisplaySlot(item.gear.slot)} slot updated`)];
}

export function equipDropToSlot(state: GameState, targetEquipSlot: GearEquipSlot | null = null): GameEvent[] {
  if (state.player.lifeState !== "alive") return [];
  if (!state.combat.droppedGear) return [];

  const gear = state.combat.droppedGear;
  if (targetEquipSlot && !canEquipGearToSlot(gear, targetEquipSlot)) {
    return [logEvent("Cannot equip item", `${gearDisplaySlot(gear.slot)} does not fit that slot`)];
  }

  const equipSlot = targetEquipSlot ?? equipSlotForGear(state, gear);
  const previousGear = state.combat.equippedItems[equipSlot] ?? null;
  const previousSize = previousGear ? gearInventorySize(previousGear) : null;
  const previousSlot = previousSize ? firstOpenInventorySlot(state, previousSize.width, previousSize.height) : null;
  if (previousGear && previousSlot === null) {
    return [logEvent("Inventory full", "Make room before swapping equipped gear")];
  }

  state.combat.equippedItems[equipSlot] = gear;
  if (equipSlot === "weapon") {
    state.combat.equippedGear = gear;
  }
  clearLootDrop(state);
  normalizeBranchLattice(state);
  if (equipSlot === "amulet") assignStartingLatticeAbilities(state.combat.branchLattice, gear);

  if (previousGear && previousSlot !== null) {
    state.combat.inventoryItems.push(createInventoryItem(state, previousGear, previousSlot));
  }

  syncActiveMemberFromCombat(state);
  return [logEvent(`Equipped ${gear.name}`, `${gearDisplaySlot(gear.slot)} slot updated`)];
}

export function unequipGearSlot(state: GameState, equipSlot: GearEquipSlot, targetSlot: number | null = null): GameEvent[] {
  if (state.player.lifeState !== "alive") return [];

  const gear = state.combat.equippedItems[equipSlot];
  if (!gear) return [];

  const size = gearInventorySize(gear);
  const slot = targetSlot !== null && canPlaceInventoryItem(state, size.width, size.height, targetSlot)
    ? targetSlot
    : firstOpenInventorySlot(state, size.width, size.height);
  if (slot === null) return [logEvent("Inventory full", "Make room before unequipping this item")];

  state.combat.inventoryItems.push(createInventoryItem(state, gear, slot));
  delete state.combat.equippedItems[equipSlot];
  if (equipSlot === "weapon") {
    state.combat.equippedGear = createEmptyWeapon(state.selectedClassId);
  }
  normalizeBranchLattice(state);
  syncActiveMemberFromCombat(state);

  return [logEvent(`Unequipped ${gear.name}`, "Moved to inventory")];
}

export function normalizeBranchLattice(state: GameState) {
  const frame = branchLatticeFrame(state);
  const abilityOptionIds = new Set(frame.latticeAbilityOptions.map((option) => option.id));
  const modifierOptionIds = new Set(frame.modifierOptions.map((option) => option.id));
  const usedAbilityIds = new Set<string>();
  const usedModifierIds = new Set<string>();

  const abilitySlots = Array.from(
    { length: branchLatticeAbilitySlotCount },
    (_, index) => state.combat.branchLattice.abilitySlotIds[index] ?? null,
  );
  const modifierSlots = Array.from(
    { length: branchLatticeModifierSlotCount },
    (_, index) => state.combat.branchLattice.modifierSlotIds[index] ?? null,
  );

  state.combat.branchLattice.abilitySlotIds = abilitySlots.map((optionId) => {
    if (!optionId || !abilityOptionIds.has(optionId) || usedAbilityIds.has(optionId)) return null;
    usedAbilityIds.add(optionId);
    return optionId;
  });
  state.combat.branchLattice.modifierSlotIds = modifierSlots.map((optionId) => {
    if (!optionId || !modifierOptionIds.has(optionId) || usedModifierIds.has(optionId)) return null;
    usedModifierIds.add(optionId);
    return optionId;
  });

  if (!state.combat.branchLattice.abilitySlotIds.some(Boolean)) {
    state.combat.branchLattice.abilitySlotIds[0] = frame.latticeAbilityOptions[0]?.id ?? null;
  }
  state.combat.autoLoop.currentSlotIndex = 0;
  state.combat.autoLoop.slotTimer = 0;
  state.combat.autoLoop.restartTimer = 0;
  state.combat.autoLoop.hasteTimer = 0;
  state.combat.autoLoop.hasteMultiplier = 1;
  state.combat.autoLoop.lastResolvedKind = null;
  state.combat.motherLoadWindow = createMotherLoadWindowState();
  state.party.motherLoadWindow = createMotherLoadWindowState();
  assignStartingLatticeAbilities(state.combat.branchLattice, state.combat.equippedItems.amulet ?? null);
  if (
    state.combat.branchLattice.selectedAbilitySlot !== null &&
    !state.combat.branchLattice.abilitySlotIds[state.combat.branchLattice.selectedAbilitySlot]
  ) {
    state.combat.branchLattice.selectedAbilitySlot = 0;
  }
  if (
    state.combat.branchLattice.selectedModifierSlot !== null &&
    state.combat.branchLattice.selectedModifierSlot >= state.combat.branchLattice.modifierSlotIds.length
  ) {
    state.combat.branchLattice.selectedModifierSlot = 0;
  }
  syncActiveMemberFromCombat(state);
  refreshDerivedGearStats(state.player);
}

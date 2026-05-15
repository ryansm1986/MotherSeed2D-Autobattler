import { normalizeBranchLattice } from "./combat/gear";
import { characterClasses } from "./content/classes";
import {
  createAutoAttackLoopState,
  createInitialGameState,
  createMotherLoadWindowState,
  createPartyMember,
  createStartingAmulet,
  bindActiveMemberAliases,
  skillBarSlotCount,
  type GameState,
  type IntroRoomState,
  type InventoryBagItem,
  type PartyMemberState,
} from "./state";
import type { BranchLatticeState, ClassId, GearDrop, GearEquipSlot } from "./types";
import { world } from "./world/arena";
import { spawnRoomEnemy } from "./world/rooms";

const saveStorageKey = "motherseed-save-v1";
const saveVersion = 2;
const equipSlots: GearEquipSlot[] = [
  "weapon",
  "helmet",
  "bodyArmour",
  "gloves",
  "ringOne",
  "ringTwo",
  "amulet",
  "pants",
  "boots",
];

type SavedPlayerState = {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  meter: number;
  maxMeter: number;
};

type SavedGameData = {
  version: typeof saveVersion;
  savedAt: string;
  selectedClassId: ClassId;
  player: SavedPlayerState;
  party: SavedPartyMemberState[];
  activeMemberId: string;
  selectedInventoryMemberId: string;
  selectedLatticeMemberId: string;
  roomIndex: number;
  intro: IntroRoomState;
  inventoryItems: InventoryBagItem[];
  nextInventoryItemId: number;
  equippedItems: Partial<Record<GearEquipSlot, GearDrop>>;
  equippedGear: GearDrop;
  branchLattice: BranchLatticeState;
};

type SavedLegacyGameData = Omit<SavedGameData, "version" | "party" | "activeMemberId" | "selectedInventoryMemberId" | "selectedLatticeMemberId"> & {
  version: 1;
};

type SavedPartyMemberState = SavedPlayerState & {
  id: string;
  classId: ClassId;
  partyIndex: number;
  equippedItems: Partial<Record<GearEquipSlot, GearDrop>>;
  equippedGear: GearDrop;
  branchLattice: BranchLatticeState;
};

export type SaveGameResult =
  | { ok: true; savedAt: string }
  | { ok: false; reason: string };

export function hasSavedGame() {
  try {
    return localStorage.getItem(saveStorageKey) !== null;
  } catch {
    return false;
  }
}

export function saveGame(state: GameState): SaveGameResult {
  const data: SavedGameData = {
    version: saveVersion,
    savedAt: new Date().toISOString(),
    selectedClassId: state.selectedClassId,
    player: {
      health: state.player.health,
      maxHealth: state.player.maxHealth,
      stamina: state.player.stamina,
      maxStamina: state.player.maxStamina,
      meter: state.player.meter,
      maxMeter: state.player.maxMeter,
    },
    party: state.party.members.map((member) => ({
      id: member.id,
      classId: member.classId,
      partyIndex: member.partyIndex,
      health: member.health,
      maxHealth: member.maxHealth,
      stamina: member.stamina,
      maxStamina: member.maxStamina,
      meter: member.meter,
      maxMeter: member.maxMeter,
      equippedItems: cloneJson(member.equippedItems),
      equippedGear: cloneJson(member.equippedGear),
      branchLattice: cloneJson(member.branchLattice),
    })),
    activeMemberId: state.party.activeMemberId,
    selectedInventoryMemberId: state.party.selectedInventoryMemberId,
    selectedLatticeMemberId: state.party.selectedLatticeMemberId,
    roomIndex: state.combat.roomIndex,
    intro: cloneJson(state.intro),
    inventoryItems: cloneJson(state.combat.inventoryItems),
    nextInventoryItemId: state.combat.nextInventoryItemId,
    equippedItems: cloneJson(state.combat.equippedItems),
    equippedGear: cloneJson(state.combat.equippedGear),
    branchLattice: cloneJson(state.combat.branchLattice),
  };

  try {
    localStorage.setItem(saveStorageKey, JSON.stringify(data));
    return { ok: true, savedAt: data.savedAt };
  } catch {
    return { ok: false, reason: "Browser storage is unavailable or full." };
  }
}

export function loadSavedGame(): GameState | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(saveStorageKey);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed = parseSavedGameData(JSON.parse(raw));
    if (!parsed) {
      localStorage.removeItem(saveStorageKey);
      return null;
    }
    return restoreSavedGame(parsed);
  } catch {
    try {
      localStorage.removeItem(saveStorageKey);
    } catch {
      // Ignore storage cleanup failures; loading already failed.
    }
    return null;
  }
}

function restoreSavedGame(saved: SavedGameData): GameState {
  const state = createInitialGameState(saved.selectedClassId);
  state.party.members = saved.party.map((savedMember, index) => restorePartyMember(savedMember, index));
  state.party.activeMemberId = state.party.members.some((member) => member.id === saved.activeMemberId)
    ? saved.activeMemberId
    : state.party.members[0].id;
  state.party.selectedInventoryMemberId = state.party.members.some((member) => member.id === saved.selectedInventoryMemberId)
    ? saved.selectedInventoryMemberId
    : state.party.activeMemberId;
  state.party.selectedLatticeMemberId = state.party.members.some((member) => member.id === saved.selectedLatticeMemberId)
    ? saved.selectedLatticeMemberId
    : state.party.activeMemberId;
  bindActiveMemberAliases(state);

  state.intro = cloneJson(saved.intro);
  state.combat.roomIndex = Math.max(0, Math.floor(saved.roomIndex));
  state.combat.inventoryItems = cloneJson(saved.inventoryItems);
  state.combat.nextInventoryItemId = Math.max(saved.nextInventoryItemId, nextInventoryId(saved.inventoryItems));
  state.combat.equippedItems = state.player.equippedItems;
  state.combat.equippedGear = state.player.equippedGear;
  state.combat.branchLattice = state.player.branchLattice;
  state.player.cooldowns = {};
  state.player.autoLoop = createAutoAttackLoopState();
  state.player.motherLoadWindow = createMotherLoadWindowState();
  state.combat.cooldowns = state.player.cooldowns;
  state.combat.autoLoop = state.player.autoLoop;
  state.combat.motherLoadWindow = state.player.motherLoadWindow;
  state.combat.targetLocked = state.combat.roomIndex > 0;
  state.combat.droppedGear = null;
  state.combat.droppedGearSourceLabel = null;
  state.combat.lootCorpseId = null;
  state.combat.hoveredLootCorpseId = null;
  state.combat.roomTransitionCooldown = 0;

  if (state.combat.roomIndex > 0) {
    spawnRoomEnemy(state);
  } else if (state.intro.tutorial.step === "equipAmulet" && state.combat.equippedItems.amulet?.frame.latticeAbilityOptions.some((option) => option.tags?.includes("Finisher"))) {
    state.intro.tutorial.step = "amuletEquippedChoice";
  } else if (state.intro.codger.phase === "giftOffered" && state.intro.tutorial.step === "equipAmulet") {
    state.combat.droppedGear = createStartingAmulet(state.selectedClassId);
    state.combat.droppedGearSourceLabel = "Codger's Gift";
  }

  state.ui = {
    isTitleActive: false,
    isCharacterSelectActive: false,
    isPaused: false,
    isInventoryOpen: false,
    isLootOpen: false,
    isBranchLatticeOpen: false,
    pauseMenuSource: null,
    showPartyHealthBars: true,
    skillBarBindings: Array.from({ length: skillBarSlotCount }, () => null),
    openSkillBarSlot: null,
  };
  normalizeBranchLattice(state);
  return state;
}

function restorePartyMember(savedMember: SavedPartyMemberState, index: number): PartyMemberState {
  const member = createPartyMember(savedMember.classId, index, world.playerSpawn.x + index * 42, world.playerSpawn.y + index * 36);
  member.id = savedMember.id;
  member.maxHealth = savedMember.maxHealth;
  member.health = clamp(savedMember.health, 1, member.maxHealth);
  member.maxStamina = savedMember.maxStamina;
  member.stamina = clamp(savedMember.stamina, 0, member.maxStamina);
  member.maxMeter = savedMember.maxMeter;
  member.meter = clamp(savedMember.meter, 0, member.maxMeter);
  member.equippedItems = cloneJson(savedMember.equippedItems);
  member.equippedGear = cloneJson(savedMember.equippedItems.weapon ?? savedMember.equippedGear);
  member.branchLattice = cloneJson(savedMember.branchLattice);
  member.cooldowns = {};
  member.autoLoop = createAutoAttackLoopState();
  member.motherLoadWindow = createMotherLoadWindowState();
  return member;
}

function parseSavedGameData(value: unknown): SavedGameData | null {
  if (!isRecord(value) || (value.version !== saveVersion && value.version !== 1) || !isClassId(value.selectedClassId)) return null;
  const player = parseSavedPlayerState(value.player);
  const intro = parseIntroRoomState(value.intro);
  const inventoryItems = parseInventoryItems(value.inventoryItems, value.selectedClassId);
  const equippedItems = parseEquippedItems(value.equippedItems);
  const equippedGear = parseGearDrop(value.equippedGear) ?? equippedItems.weapon;
  const branchLattice = parseBranchLatticeState(value.branchLattice);
  const party = value.version === saveVersion
    ? parseSavedParty(value.party)
    : null;
  const roomIndex = asFiniteNumber(value.roomIndex);
  const nextInventoryItemId = asFiniteNumber(value.nextInventoryItemId);
  if (!player || !intro || !inventoryItems || !equippedGear || !branchLattice || roomIndex === null || nextInventoryItemId === null) {
    return null;
  }
  const legacyParty: SavedPartyMemberState[] = [{
    id: `party-${value.selectedClassId}`,
    classId: value.selectedClassId,
    partyIndex: 0,
    ...player,
    equippedItems,
    equippedGear,
    branchLattice,
  }];
  const restoredParty = party && party.length > 0 ? party : legacyParty;
  const activeMemberId = typeof value.activeMemberId === "string" ? value.activeMemberId : restoredParty[0].id;

  return {
    version: saveVersion,
    savedAt: typeof value.savedAt === "string" ? value.savedAt : new Date().toISOString(),
    selectedClassId: value.selectedClassId,
    player,
    party: restoredParty,
    activeMemberId,
    selectedInventoryMemberId: typeof value.selectedInventoryMemberId === "string" ? value.selectedInventoryMemberId : activeMemberId,
    selectedLatticeMemberId: typeof value.selectedLatticeMemberId === "string" ? value.selectedLatticeMemberId : activeMemberId,
    roomIndex,
    intro,
    inventoryItems,
    nextInventoryItemId,
    equippedItems,
    equippedGear,
    branchLattice,
  };
}

function parseSavedParty(value: unknown): SavedPartyMemberState[] | null {
  if (!Array.isArray(value)) return null;
  const members: SavedPartyMemberState[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "string" || !isClassId(item.classId)) return null;
    const player = parseSavedPlayerState(item);
    const equippedItems = parseEquippedItems(item.equippedItems);
    const equippedGear = parseGearDrop(item.equippedGear) ?? equippedItems.weapon;
    const branchLattice = parseBranchLatticeState(item.branchLattice);
    const partyIndex = asFiniteNumber(item.partyIndex);
    if (!player || !equippedGear || !branchLattice || partyIndex === null) return null;
    members.push({
      id: item.id,
      classId: item.classId,
      partyIndex: Math.max(0, Math.floor(partyIndex)),
      ...player,
      equippedItems,
      equippedGear,
      branchLattice,
    });
  }
  return members;
}

function parseSavedPlayerState(value: unknown): SavedPlayerState | null {
  if (!isRecord(value)) return null;
  const health = asFiniteNumber(value.health);
  const maxHealth = asFiniteNumber(value.maxHealth);
  const stamina = asFiniteNumber(value.stamina);
  const maxStamina = asFiniteNumber(value.maxStamina);
  const meter = asFiniteNumber(value.meter);
  const maxMeter = asFiniteNumber(value.maxMeter);
  if (health === null || maxHealth === null || stamina === null || maxStamina === null || meter === null || maxMeter === null) {
    return null;
  }
  return {
    health,
    maxHealth: Math.max(1, maxHealth),
    stamina,
    maxStamina: Math.max(1, maxStamina),
    meter,
    maxMeter: Math.max(1, maxMeter),
  };
}

function parseIntroRoomState(value: unknown): IntroRoomState | null {
  if (!isRecord(value) || !isRecord(value.codger)) return null;
  const { codger } = value;
  const x = asFiniteNumber(codger.x);
  const y = asFiniteNumber(codger.y);
  const radius = asFiniteNumber(codger.radius);
  const interactRadius = asFiniteNumber(codger.interactRadius);
  const animTimer = asFiniteNumber(codger.animTimer);
  const animFrame = asFiniteNumber(codger.animFrame);
  if (
    x === null ||
    y === null ||
    radius === null ||
    interactRadius === null ||
    animTimer === null ||
    animFrame === null ||
    !isCodgerPhase(codger.phase)
  ) {
    return null;
  }
  return {
    codger: {
      x,
      y,
      radius,
      interactRadius,
      phase: codger.phase,
      dialogueText: typeof codger.dialogueText === "string" ? codger.dialogueText : null,
      animTimer,
      animFrame,
    },
    tutorial: parseCodgerTutorialState(value.tutorial, codger.phase),
  };
}

function parseCodgerTutorialState(value: unknown, codgerPhase: IntroRoomState["codger"]["phase"]): IntroRoomState["tutorial"] {
  if (!isRecord(value)) {
    return codgerPhase === "readyForStairs"
      ? { step: "readyForStairs", completionReason: "completed" }
      : { step: codgerPhase === "giftOffered" ? "equipAmulet" : "waiting", completionReason: null };
  }

  const step = isCodgerTutorialStep(value.step) ? value.step : codgerPhase === "readyForStairs" ? "readyForStairs" : "waiting";
  const completionReason = isCodgerTutorialCompletionReason(value.completionReason)
    ? value.completionReason
    : step === "readyForStairs"
      ? "completed"
      : null;
  return { step, completionReason };
}

function parseInventoryItems(value: unknown, classId: ClassId): InventoryBagItem[] | null {
  if (!Array.isArray(value)) return null;
  const items: InventoryBagItem[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "string") return null;
    const gear = parseGearDrop(item.gear);
    const slot = asFiniteNumber(item.slot);
    const width = asFiniteNumber(item.width);
    const height = asFiniteNumber(item.height);
    if (!gear || !isClassId(item.classId) || slot === null || width === null || height === null) return null;
    items.push({
      id: item.id,
      gear,
      classId: item.classId === classId ? item.classId : classId,
      slot: Math.max(0, Math.floor(slot)),
      width: Math.max(1, Math.floor(width)),
      height: Math.max(1, Math.floor(height)),
    });
  }
  return items;
}

function parseEquippedItems(value: unknown): Partial<Record<GearEquipSlot, GearDrop>> {
  if (!isRecord(value)) return {};
  const equippedItems: Partial<Record<GearEquipSlot, GearDrop>> = {};
  equipSlots.forEach((slot) => {
    const gear = parseGearDrop(value[slot]);
    if (gear) equippedItems[slot] = gear;
  });
  return equippedItems;
}

function parseGearDrop(value: unknown): GearDrop | null {
  if (!isRecord(value) || !isRecord(value.frame)) return null;
  const power = asFiniteNumber(value.power);
  if (
    typeof value.name !== "string" ||
    !isGearSlot(value.slot) ||
    !isRarity(value.rarity) ||
    power === null ||
    typeof value.ability !== "string" ||
    !Array.isArray(value.frame.weaponSpecials) ||
    !Array.isArray(value.frame.latticeAbilityOptions) ||
    !Array.isArray(value.frame.modifierOptions)
  ) {
    return null;
  }
  return cloneJson(value) as GearDrop;
}

function parseBranchLatticeState(value: unknown): BranchLatticeState | null {
  if (!isRecord(value) || !Array.isArray(value.abilitySlotIds) || !Array.isArray(value.modifierSlotIds)) return null;
  const selectedAbilitySlot = parseNullableSlot(value.selectedAbilitySlot);
  const selectedModifierSlot = parseNullableSlot(value.selectedModifierSlot);
  if (selectedAbilitySlot === undefined || selectedModifierSlot === undefined) return null;
  return {
    abilitySlotIds: value.abilitySlotIds.map((slot) => typeof slot === "string" ? slot : null),
    modifierSlotIds: value.modifierSlotIds.map((slot) => typeof slot === "string" ? slot : null),
    selectedAbilitySlot,
    selectedModifierSlot,
    isPreviewOpen: Boolean(value.isPreviewOpen),
  };
}

function parseNullableSlot(value: unknown) {
  if (value === null) return null;
  const slot = asFiniteNumber(value);
  if (slot === null) return undefined;
  return Math.max(0, Math.floor(slot));
}

function nextInventoryId(items: InventoryBagItem[]) {
  return items.reduce((maxId, item) => {
    const match = /^bag-(\d+)$/.exec(item.id);
    return match ? Math.max(maxId, Number(match[1]) + 1) : maxId;
  }, 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function asFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isClassId(value: unknown): value is ClassId {
  return typeof value === "string" && value in characterClasses;
}

function isCodgerPhase(value: unknown): value is IntroRoomState["codger"]["phase"] {
  return value === "waiting" || value === "giftOffered" || value === "readyForStairs";
}

function isCodgerTutorialStep(value: unknown): value is IntroRoomState["tutorial"]["step"] {
  return (
    value === "waiting" ||
    value === "equipAmulet" ||
    value === "amuletEquippedChoice" ||
    value === "openLattice" ||
    value === "latticeTourAbilities" ||
    value === "latticeTourModifiers" ||
    value === "latticeTourLoop" ||
    value === "autoAttackExplain" ||
    value === "bloomMeterExplain" ||
    value === "motherLoadExplain" ||
    value === "readyForStairs"
  );
}

function isCodgerTutorialCompletionReason(value: unknown): value is IntroRoomState["tutorial"]["completionReason"] {
  return value === "completed" || value === "skipped";
}

function isGearSlot(value: unknown): value is GearDrop["slot"] {
  return (
    value === "weapon" ||
    value === "helmet" ||
    value === "bodyArmour" ||
    value === "gloves" ||
    value === "ring" ||
    value === "amulet" ||
    value === "pants" ||
    value === "boots"
  );
}

function isRarity(value: unknown): value is GearDrop["rarity"] {
  return value === "Common" || value === "Uncommon" || value === "Rare";
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

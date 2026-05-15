import "./style.css";
import { createAudioManager } from "./app/audio";
import { castPartySpecial, castPendingPartyTargetedSpecial, castSpecial } from "./game/combat/abilities";
import {
  canEquipDropToSlot,
  canEquipInventoryItemToSlot,
  canPlaceInventoryItem,
  equipDropToSlot,
  equipInventoryItem,
  grantFullStarterGear,
  moveInventoryItem,
  takeDropToInventory,
  unequipGearSlot,
} from "./game/combat/gear";
import { clearTarget, isEnemyAtWorldPoint, lockTarget, partyMemberAtWorldPoint } from "./game/combat/player";
import { characterClasses, characterOrder } from "./game/content/classes";
import { debugEncounterOptions, teleportToDebugEncounter } from "./game/debug";
import { clearInputState, createInputState, gameplayActionForCode } from "./game/input-actions";
import { hasSavedGame, loadSavedGame, saveGame } from "./game/save";
import { buyShopItem, rerollShop } from "./game/shop";
import { updateSimulation } from "./game/simulation";
import {
  advanceCodgerLatticeTutorial,
  canPlayerTalkToCodger,
  canSkipCodgerTutorial,
  continueCodgerTutorial,
  interactWithCodger,
  isCodgerLatticeTourStep,
  maybeFinishCodgerGift,
  maybeAdvanceCodgerAmuletEquipped,
  skipCodgerTutorial,
} from "./game/world/intro-room";
import { startNextAutobattleRound } from "./game/world/rooms";
import {
  applySelectedClass,
  allEnemies,
  branchLatticeFrame,
  createAutoAttackLoopState,
  createInitialGameState,
  isGameplayActive,
  isGameplayVisible,
  logEvent,
  normalizeSkillBarBindings,
  partySkillBarOptions,
  selectInventoryPartyMember,
  selectLatticePartyMember,
  setActivePartyMember,
  selectedClass,
  selectedInventoryPartyMember,
  selectedLatticePartyMember,
  syncActiveMemberFromCombat,
  togglePartyClassSelection,
  type GameEvent,
  withPartyMemberAliases,
} from "./game/state";
import type { ClassId, GearEquipSlot } from "./game/types";
import type { Vec2 } from "./game/types";
import { screenToWorld } from "./render/canvas2d/camera";
import { createCanvasRenderer } from "./render/canvas2d/renderer";
import { createAnimationFrameLookup, loadRenderAssets, type RenderAssetLoadOptions } from "./render/canvas2d/sprite-loader";
import type { AnimationFrameLookup, CanvasRenderer } from "./render/canvas2d/types";
import { createAppShell } from "./ui/app-shell";
import { applyBranchLattice, renderBranchLattice } from "./ui/branch-lattice";
import { applyCharacterSelect, renderCharacterSelect } from "./ui/character-select";
import { applyCodgerTutorial, renderCodgerTutorial } from "./ui/codger-tutorial";
import { applyDebugEncounterOptions, setDebugMenuStatus } from "./ui/debug-menu";
import { loadDisplaySettings, saveDisplaySettings } from "./ui/display-settings";
import { initializeCombatLog, pushGameEvents, pushLog } from "./ui/event-log";
import { createGameCursor } from "./ui/game-cursor";
import { initializeHudLayoutEditor } from "./ui/hud-layout-editor";
import { applyHud, renderHud } from "./ui/hud";
import { applyInventory, renderInventory } from "./ui/inventory";
import { applyLootScreen, renderLootScreen } from "./ui/loot";
import { createMobileControls } from "./ui/mobile-controls";
import { initializePauseTabs, selectPauseTab, setPauseMenuCopy } from "./ui/pause-menu";
import { createSaveToastController } from "./ui/save-toast";
import { applyShop, renderShop } from "./ui/shop";
import { createTitleIntroController } from "./ui/title-screen";

const shell = createAppShell();
initializeCombatLog(shell.combatLog);
const hudLayoutEditor = initializeHudLayoutEditor({
  hud: shell.hud,
  pauseMenu: shell.pauseMenu,
  toolbar: shell.hudEditToolbar,
  doneButton: shell.hudEditDoneButton,
  resetButton: shell.hudEditResetButton,
  pieces: [
    { id: "player-panel", label: "Vitals", element: shell.playerPanel },
    { id: "target-panel", label: "Target", element: shell.targetPanel },
    { id: "skill-bar", label: "Skill Bar", element: shell.abilityPanel.closest<HTMLElement>(".action-bar") ?? shell.abilityPanel },
    { id: "combat-log", label: "Combat Log", element: shell.combatLog, resizable: true },
  ],
});
const gameCursor = createGameCursor(shell.cursor);
const titleIntro = createTitleIntroController({
  titleScreen: shell.titleScreen,
  titleBackgroundImage: shell.titleBackgroundImage,
  titleLogoImage: shell.titleLogoImage,
});
const displaySettings = loadDisplaySettings();
const state = createInitialGameState("warrior");
state.ui.showPartyHealthBars = displaySettings.showPartyHealthBars;
const saveToast = createSaveToastController(shell.saveToast);
const inputState = createInputState();
const debugOptions = debugEncounterOptions();
const audio = createAudioManager({
  musicVolumeInput: shell.musicVolumeInput,
  sfxVolumeInput: shell.sfxVolumeInput,
  musicVolumeValue: shell.musicVolumeValue,
  sfxVolumeValue: shell.sfxVolumeValue,
});
const mobileControls = createMobileControls({
  elements: {
    root: shell.mobileControls,
    targetButton: shell.mobileTargetButton,
    specialButtons: shell.mobileSpecialButtons,
    equipButton: shell.mobileEquipButton,
    inventoryButton: shell.mobileInventoryButton,
    branchLatticeButton: shell.mobileBranchLatticeButton,
    pauseButton: shell.mobilePauseButton,
    rotatePrompt: shell.mobileRotatePrompt,
  },
  canUseGameplayInput: () => isGameplayActive(state),
  onTarget: () => {
    if (state.round.phase !== "battle") handleEvents(lockTarget(state));
  },
  onSpecial: (index) => {
    if (state.round.phase !== "battle") handleEvents(castSpecial(state, index));
  },
  onEquip: () => openLootOrEquip(),
  onInventory: () => toggleInventory(),
  onBranchLattice: () => toggleBranchLattice(),
  onPause: () => togglePauseMenu(),
});

let renderer: CanvasRenderer | null = null;
let frameLookup: AnimationFrameLookup | undefined;
let renderAssetsReady: Promise<void> | null = null;
let lastFrame = performance.now();
let isStartingGame = false;
const branchDragMime = "application/x-motherseed-branch-lattice";

type BranchDragKind = "ability" | "modifier";
type BranchDragPayload = {
  kind: BranchDragKind;
  optionId: string;
  source: "option" | "slot";
  fromSlot: number | null;
};

let activeBranchDrag: BranchDragPayload | null = null;
let branchDragImageElement: HTMLElement | null = null;
let suppressBranchClick = false;

function handleEvents(events: readonly GameEvent[]) {
  pushGameEvents(shell.eventLog, events, (event) => {
    if (event.kind === "sound") audio.playEventSound(event.id);
  });
}

function clearAllInput() {
  clearInputState(inputState);
  mobileControls.clear();
}

function syncMobileControls() {
  mobileControls.setActive(isGameplayVisible(state));
  mobileControls.setGameplayInputActive(isGameplayActive(state));
  mobileControls.setGameplayVisible(isGameplayVisible(state));
}

function updateHud() {
  normalizeSkillBarBindings(state);
  applyHud({
    playerPanel: shell.playerPanel,
    targetPanel: shell.targetPanel,
    abilityPanel: shell.abilityPanel,
  }, renderHud(state));
  updateCodgerTutorial();
}

applyDebugEncounterOptions({
  encounterSelect: shell.debugEncounterSelect,
  status: shell.debugStatus,
}, debugOptions);

function updateInventory() {
  const inventoryMemberId = selectedInventoryPartyMember(state).id;
  applyInventory({
    hero: shell.inventoryHero,
    equipment: shell.inventoryEquipment,
    pack: shell.inventoryPack,
  }, renderInventory(state), {
    canPlaceItem: (payload, slot) =>
      canPlaceInventoryItem(state, payload.width, payload.height, slot, payload.kind === "inventory" ? payload.itemId : null),
    canEquipItem: (itemId, equipSlot) => withPartyMemberAliases(state, inventoryMemberId, () => canEquipInventoryItemToSlot(state, itemId, equipSlot)),
    canEquipLoot: (equipSlot) => withPartyMemberAliases(state, inventoryMemberId, () => canEquipDropToSlot(state, equipSlot)),
    onMoveInventoryItem: (itemId, slot) => {
      handleEvents(moveInventoryItem(state, itemId, slot));
      updateInventory();
    },
    onTakeLoot: (slot) => {
      handleEvents(takeDropToInventory(state, slot));
      updateInventory();
      updateLootScreen();
      updateHud();
      if (!state.combat.droppedGear) closeLootMenu();
    },
    onEquipInventoryItem: (itemId, equipSlot = null) => {
      handleEvents(withPartyMemberAliases(state, inventoryMemberId, () => equipInventoryItem(state, itemId, equipSlot)));
      syncCodgerAmuletTutorial();
      updateInventory();
      updateHud();
      if (state.ui.isBranchLatticeOpen) updateBranchLattice();
    },
    onEquipLoot: (equipSlot) => {
      handleEvents(withPartyMemberAliases(state, inventoryMemberId, () => equipDropToSlot(state, equipSlot)));
      syncCodgerAmuletTutorial();
      updateInventory();
      updateLootScreen();
      updateHud();
      if (state.ui.isBranchLatticeOpen) updateBranchLattice();
      if (!state.combat.droppedGear) closeLootMenu();
    },
    onUnequipItem: (equipSlot, slot) => {
      handleEvents(withPartyMemberAliases(state, inventoryMemberId, () => unequipGearSlot(state, equipSlot, slot ?? null)));
      updateInventory();
      updateHud();
      if (state.ui.isBranchLatticeOpen) updateBranchLattice();
    },
  });
}

function handleInventoryClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  const tab = target.closest<HTMLElement>("[data-party-inventory-member]");
  if (!tab?.dataset.partyInventoryMember) return;
  selectInventoryPartyMember(state, tab.dataset.partyInventoryMember);
  updateInventory();
}

function handleInventoryChange(event: Event) {
  const target = event.target as HTMLElement;
  const select = target.closest<HTMLSelectElement>("[data-party-inventory-member-select]");
  if (!select?.value) return;
  selectInventoryPartyMember(state, select.value);
  updateInventory();
}

function updateLootScreen() {
  applyLootScreen({
    source: shell.lootSource,
    grid: shell.lootGrid,
    takeAllButton: shell.lootTakeAllButton,
  }, renderLootScreen(state), {
    onTakeLootToInventory: () => {
      handleEvents(takeDropToInventory(state));
      updateInventory();
      updateLootScreen();
      updateHud();
      if (!state.combat.droppedGear) closeLootMenu();
    },
  });
}

function updateShop() {
  if (state.round.phase !== "shop") {
    shell.shopMenu.classList.add("is-hidden");
    return;
  }
  applyShop(shell.shopFrame, renderShop(state));
  shell.shopMenu.classList.remove("is-hidden");
}

function updateBranchLattice() {
  applyBranchLattice({
    abilities: shell.branchLatticeAbilities,
    modifiers: shell.branchLatticeModifiers,
    lattice: shell.branchLatticeSockets,
    details: shell.branchLatticeDetails,
  }, renderBranchLattice(state));
  updateCodgerTutorial();
}

function handleBranchLatticeTabClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  const tab = target.closest<HTMLElement>("[data-party-lattice-member]");
  if (!tab?.dataset.partyLatticeMember) return false;
  selectLatticePartyMember(state, tab.dataset.partyLatticeMember);
  updateBranchLattice();
  return true;
}

function updateCodgerTutorial() {
  const view = renderCodgerTutorial(state);
  applyCodgerTutorial({
    root: shell.codgerTutorial,
    title: shell.codgerTutorialTitle,
    copy: shell.codgerTutorialCopy,
    hint: shell.codgerTutorialHint,
    primaryButton: shell.codgerTutorialPrimaryButton,
    secondaryButton: shell.codgerTutorialSecondaryButton,
  }, view);
  applyCodgerTutorialHighlights(view.target);
}

function applyCodgerTutorialHighlights(target: ReturnType<typeof renderCodgerTutorial>["target"]) {
  [
    shell.mobileBranchLatticeButton,
    shell.branchLatticeAbilities.closest<HTMLElement>(".branch-abilities-panel"),
    shell.branchLatticeModifiers.closest<HTMLElement>(".branch-modifiers-panel"),
    shell.branchLatticeSockets,
    shell.branchLatticeDetails,
    shell.targetPanel,
    shell.playerPanel,
  ].forEach((element) => element?.classList.remove("codger-tutorial-highlight"));

  if (target === "latticeButton") shell.mobileBranchLatticeButton.classList.add("codger-tutorial-highlight");
  if (target === "latticeAbilities") shell.branchLatticeAbilities.closest<HTMLElement>(".branch-abilities-panel")?.classList.add("codger-tutorial-highlight");
  if (target === "latticeModifiers") shell.branchLatticeModifiers.closest<HTMLElement>(".branch-modifiers-panel")?.classList.add("codger-tutorial-highlight");
  if (target === "latticeSockets") shell.branchLatticeSockets.classList.add("codger-tutorial-highlight");
  if (target === "latticeDetails") shell.branchLatticeDetails.classList.add("codger-tutorial-highlight");
  if (target === "hudAuto") shell.targetPanel.classList.add("codger-tutorial-highlight");
  if (target === "hudBloomMeter") shell.playerPanel.classList.add("codger-tutorial-highlight");
  if (target === "hudMotherLoad") shell.targetPanel.classList.add("codger-tutorial-highlight");
}

function renderCharacterSelectScreen() {
  applyCharacterSelect({
    characterGrid: shell.characterGrid,
    characterDetail: shell.characterDetail,
    continueButton: shell.continueButton,
  }, renderCharacterSelect(state));
}

function handleHudClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  const skillSlot = target.closest<HTMLElement>("[data-skill-slot-index]");
  if (skillSlot?.dataset.skillSlotIndex) {
    const slotIndex = Number(skillSlot.dataset.skillSlotIndex);
    if (Number.isInteger(slotIndex)) castSkillBarSlot(slotIndex);
    return;
  }

  if (state.ui.openSkillBarSlot !== null) {
    state.ui.openSkillBarSlot = null;
    updateHud();
  }

  const partySwitch = target.closest<HTMLElement>("[data-party-switch-member]");
  if (partySwitch?.dataset.partySwitchMember) {
    if (state.party.pendingTargetedSpecial) {
      handleEvents(castPendingPartyTargetedSpecial(state, partySwitch.dataset.partySwitchMember));
    } else {
      handleEvents(setActivePartyMember(state, partySwitch.dataset.partySwitchMember));
    }
    updateHud();
    return;
  }

  const partySpecial = target.closest<HTMLElement>("[data-party-special-member]");
  const memberId = partySpecial?.dataset.partySpecialMember;
  const specialIndex = Number(partySpecial?.dataset.partySpecialIndex);
  if (!memberId || !Number.isFinite(specialIndex)) return;
  if (state.round.phase === "battle") return;
  handleEvents(castPartySpecial(state, memberId, specialIndex));
  updateHud();
}

function assignSkillBarPick(skillPick: HTMLElement) {
  if (skillPick.dataset.skillPickSlot === undefined || !skillPick.dataset.skillOptionId) return false;
  const slotIndex = Number(skillPick.dataset.skillPickSlot);
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= state.ui.skillBarBindings.length) return false;
  const option = partySkillBarOptions(state).find((candidate) => candidate.id === skillPick.dataset.skillOptionId);
  if (!option) return false;

  state.ui.skillBarBindings[slotIndex] = option.id;
  state.ui.openSkillBarSlot = null;
  updateHud();
  return true;
}

function handleHudPointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement;
  const skillPick = target.closest<HTMLElement>("[data-skill-pick-slot]");
  if (!skillPick) return;
  event.preventDefault();
  event.stopPropagation();
  assignSkillBarPick(skillPick);
}

function handleHudContextMenu(event: MouseEvent) {
  const target = event.target as HTMLElement;
  const skillSlot = target.closest<HTMLElement>("[data-skill-slot-index]");
  if (!skillSlot?.dataset.skillSlotIndex) return;
  event.preventDefault();
  const slotIndex = Number(skillSlot.dataset.skillSlotIndex);
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= state.ui.skillBarBindings.length) return;
  state.ui.openSkillBarSlot = state.ui.openSkillBarSlot === slotIndex ? null : slotIndex;
  updateHud();
}

function handleShopClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  const buyButton = target.closest<HTMLElement>("[data-shop-buy-id]");
  if (buyButton?.dataset.shopBuyId) {
    handleEvents(buyShopItem(state, buyButton.dataset.shopBuyId));
    updateShop();
    updateHud();
    if (state.ui.isInventoryOpen) updateInventory();
    return;
  }

  if (target.closest<HTMLElement>("[data-shop-reroll]")) {
    handleEvents(rerollShop(state));
    updateShop();
    updateHud();
    return;
  }

  if (target.closest<HTMLElement>("[data-shop-start-fight]")) {
    state.ui.isInventoryOpen = false;
    state.ui.isLootOpen = false;
    state.ui.isBranchLatticeOpen = false;
    shell.inventoryMenu.classList.add("is-hidden");
    shell.lootMenu.classList.add("is-hidden");
    shell.branchLatticeMenu.classList.add("is-hidden");
    handleEvents(startNextAutobattleRound(state, "Shop complete"));
    updateShop();
    updateHud();
    syncMobileControls();
  }
}

function castSkillBarSlot(slotIndex: number) {
  if (!isGameplayActive(state)) return false;
  if (state.round.phase === "battle") return false;
  normalizeSkillBarBindings(state);
  const binding = state.ui.skillBarBindings[slotIndex];
  const option = partySkillBarOptions(state).find((candidate) => candidate.id === binding);
  if (!option) return false;
  state.ui.openSkillBarSlot = null;
  handleEvents(castPartySpecial(state, option.memberId, option.abilityIndex));
  updateHud();
  return true;
}

function refreshSaveControls() {
  shell.titleLoadButton.disabled = !hasSavedGame();
}

function showGameplayShell() {
  state.ui.isTitleActive = false;
  state.ui.isCharacterSelectActive = false;
  state.ui.isPaused = false;
  state.ui.isInventoryOpen = false;
  state.ui.isLootOpen = false;
  state.ui.isBranchLatticeOpen = false;
  state.ui.pauseMenuSource = null;
  clearAllInput();
  audio.stopTitleMusic();
  audio.playGameplayMusic();
  shell.inventoryMenu.classList.add("is-hidden");
  shell.lootMenu.classList.add("is-hidden");
  shell.shopMenu.classList.add("is-hidden");
  shell.branchLatticeMenu.classList.add("is-hidden");
  shell.characterSelect.classList.add("is-hidden");
  shell.loadingScreen.classList.add("is-hidden");
  shell.pauseMenu.classList.add("is-hidden");
  shell.titleScreen.classList.add("is-hidden");
  shell.hud.classList.remove("is-hidden");
  updateHud();
}

function showCharacterSelect() {
  if (!state.ui.isTitleActive) return;
  titleIntro.reset();
  state.ui.isTitleActive = false;
  state.ui.isCharacterSelectActive = true;
  state.ui.isPaused = false;
  state.ui.isInventoryOpen = false;
  state.ui.isLootOpen = false;
  state.ui.isBranchLatticeOpen = false;
  state.ui.pauseMenuSource = null;
  clearAllInput();
  audio.stopGameplayMusic();
  audio.playTitleMusic();
  shell.inventoryMenu.classList.add("is-hidden");
  shell.lootMenu.classList.add("is-hidden");
  shell.shopMenu.classList.add("is-hidden");
  shell.branchLatticeMenu.classList.add("is-hidden");
  shell.pauseMenu.classList.add("is-hidden");
  shell.loadingScreen.classList.add("is-hidden");
  shell.titleScreen.classList.add("is-hidden");
  shell.characterSelect.classList.remove("is-hidden");
  renderCharacterSelectScreen();
  updateCodgerTutorial();
}

function showTitleScreen() {
  state.ui.isTitleActive = true;
  state.ui.isCharacterSelectActive = false;
  state.ui.isPaused = false;
  state.ui.isInventoryOpen = false;
  state.ui.isLootOpen = false;
  state.ui.isBranchLatticeOpen = false;
  state.ui.pauseMenuSource = null;
  clearAllInput();
  audio.stopGameplayMusic();
  audio.playTitleMusic();
  shell.inventoryMenu.classList.add("is-hidden");
  shell.lootMenu.classList.add("is-hidden");
  shell.shopMenu.classList.add("is-hidden");
  shell.branchLatticeMenu.classList.add("is-hidden");
  shell.pauseMenu.classList.add("is-hidden");
  shell.loadingScreen.classList.add("is-hidden");
  shell.hud.classList.add("is-hidden");
  shell.characterSelect.classList.add("is-hidden");
  shell.titleScreen.classList.remove("is-hidden");
  refreshSaveControls();
  updateCodgerTutorial();
  void titleIntro.start();
}

function quitToTitleScreen() {
  if (state.ui.pauseMenuSource !== "gameplay") return;
  const selectedClassId = state.selectedClassId;
  Object.assign(state, createInitialGameState(selectedClassId));
  showTitleScreen();
}

function openPauseMenu(tabName = "controls", source: "gameplay" | "title" = "gameplay") {
  if (source === "gameplay" && (!isGameplayVisible(state) || state.ui.isPaused)) return;
  if (source === "title" && !state.ui.isTitleActive) return;
  state.ui.isPaused = source === "gameplay";
  state.ui.isInventoryOpen = false;
  state.ui.isLootOpen = false;
  state.ui.isBranchLatticeOpen = false;
  state.ui.pauseMenuSource = source;
  clearAllInput();
  setPauseMenuCopy(shell, source);
  audio.updateAudioSettingsUi();
  syncDisplaySettingsUi();
  selectPauseTab(shell, tabName);
  shell.inventoryMenu.classList.add("is-hidden");
  shell.lootMenu.classList.add("is-hidden");
  shell.shopMenu.classList.add("is-hidden");
  shell.branchLatticeMenu.classList.add("is-hidden");
  shell.pauseMenu.classList.remove("is-hidden");
  updateCodgerTutorial();
  requestAnimationFrame(() => shell.pauseFrame.focus());
}

function openHudLayoutEditor() {
  if (state.ui.pauseMenuSource !== "gameplay") return;
  state.ui.isPaused = true;
  shell.hud.classList.remove("is-hidden");
  hudLayoutEditor.enter();
}

function closePauseMenu() {
  if (hudLayoutEditor.isActive()) hudLayoutEditor.exit();
  if (!state.ui.pauseMenuSource) return;
  state.ui.isPaused = false;
  state.ui.pauseMenuSource = null;
  clearAllInput();
  shell.pauseMenu.classList.add("is-hidden");
  updateCodgerTutorial();
}

function togglePauseMenu() {
  if (state.ui.isPaused) {
    closePauseMenu();
  } else {
    openPauseMenu();
  }
}

function teleportToSelectedDebugEncounter() {
  const encounterIndex = Number(shell.debugEncounterSelect.value);
  handleEvents(teleportToDebugEncounter(state, Number.isFinite(encounterIndex) ? encounterIndex : 0));
  setDebugMenuStatus({
    encounterSelect: shell.debugEncounterSelect,
    status: shell.debugStatus,
  }, "Teleported");
  closePauseMenu();
  updateHud();
  syncMobileControls();
}

function equipDebugStarterGear() {
  handleEvents(grantFullStarterGear(state));
  setDebugMenuStatus({
    encounterSelect: shell.debugEncounterSelect,
    status: shell.debugStatus,
  }, "Starter gear equipped");
  if (state.ui.isInventoryOpen) updateInventory();
  if (state.ui.isBranchLatticeOpen) updateBranchLattice();
  updateHud();
}

function openInventory() {
  if (!isGameplayVisible(state) || state.ui.isPaused || state.ui.pauseMenuSource) return;
  state.ui.isInventoryOpen = true;
  clearAllInput();
  updateInventory();
  updateCodgerTutorial();
  shell.inventoryMenu.classList.remove("is-hidden");
  if (!state.ui.isLootOpen) requestAnimationFrame(() => shell.inventoryFrame.focus());
}

function closeInventory() {
  if (!state.ui.isInventoryOpen) return;
  state.ui.isInventoryOpen = false;
  state.ui.isLootOpen = false;
  clearAllInput();
  shell.inventoryMenu.classList.add("is-hidden");
  shell.lootMenu.classList.add("is-hidden");
  shell.shopMenu.classList.add("is-hidden");
  finishCodgerGiftIfMenusClosed();
  updateCodgerTutorial();
}

function openLootMenu() {
  if (!isGameplayVisible(state) || state.ui.isPaused || state.ui.pauseMenuSource || state.ui.isBranchLatticeOpen) {
    return false;
  }
  if (!state.combat.droppedGear) return false;

  state.ui.isInventoryOpen = true;
  state.ui.isLootOpen = true;
  clearAllInput();
  updateInventory();
  updateLootScreen();
  updateCodgerTutorial();
  shell.inventoryMenu.classList.remove("is-hidden");
  shell.lootMenu.classList.remove("is-hidden");
  requestAnimationFrame(() => shell.lootFrame.focus());
  return true;
}

function closeLootMenu() {
  if (!state.ui.isLootOpen) return;
  state.ui.isLootOpen = false;
  clearAllInput();
  shell.lootMenu.classList.add("is-hidden");
  finishCodgerGiftIfMenusClosed();
  updateCodgerTutorial();
}

function takeAllLoot() {
  if (!state.ui.isLootOpen || !state.combat.droppedGear) return;
  handleEvents(takeDropToInventory(state));
  updateInventory();
  updateLootScreen();
  if (!state.combat.droppedGear) closeLootMenu();
  updateHud();
}

function openLootOrEquip() {
  if (talkToCodgerOrOpenGift()) return;
  openLootMenu();
}

function talkToCodgerOrOpenGift() {
  if (!isGameplayVisible(state) || state.ui.isPaused || state.ui.pauseMenuSource || state.ui.isBranchLatticeOpen) {
    return false;
  }
  if (!canPlayerTalkToCodger(state)) return false;

  if (state.intro.codger.phase === "giftOffered" && state.combat.droppedGear) {
    openLootMenu();
    return true;
  }

  handleEvents(interactWithCodger(state));
  updateHud();
  updateCodgerTutorial();
  if (state.intro.codger.phase === "giftOffered" && state.combat.droppedGear) {
    openLootMenu();
  }
  return true;
}

function finishCodgerGiftIfMenusClosed() {
  if (state.ui.isInventoryOpen || state.ui.isLootOpen) return;
  handleEvents(maybeFinishCodgerGift(state));
  updateHud();
}

function syncCodgerAmuletTutorial() {
  handleEvents(maybeAdvanceCodgerAmuletEquipped(state));
  updateHud();
  updateCodgerTutorial();
}

function toggleInventory() {
  if (state.ui.isInventoryOpen) {
    closeInventory();
  } else {
    openInventory();
  }
}

function openBranchLattice() {
  if (!isGameplayVisible(state) || state.ui.pauseMenuSource === "title") return;
  state.ui.isBranchLatticeOpen = true;
  state.ui.isPaused = false;
  state.ui.isLootOpen = false;
  state.ui.pauseMenuSource = null;
  clearAllInput();
  if (state.ui.isInventoryOpen) updateInventory();
  updateBranchLattice();
  shell.lootMenu.classList.add("is-hidden");
  shell.pauseMenu.classList.add("is-hidden");
  if (state.ui.isInventoryOpen) shell.inventoryMenu.classList.remove("is-hidden");
  shell.branchLatticeMenu.classList.remove("is-hidden");
  if (state.intro.tutorial.step === "openLattice") {
    handleEvents(advanceCodgerLatticeTutorial(state));
    updateBranchLattice();
  } else {
    updateCodgerTutorial();
  }
  requestAnimationFrame(() => shell.branchLatticeFrame.focus());
}

function canCloseBranchLattice() {
  if (!isCodgerLatticeTourStep(state)) return true;
  handleEvents([logEvent("Codger", "Finish this lattice step first")]);
  return false;
}

function closeBranchLattice(force = false) {
  if (!state.ui.isBranchLatticeOpen) return;
  if (!force && !canCloseBranchLattice()) return;
  state.ui.isBranchLatticeOpen = false;
  clearAllInput();
  shell.branchLatticeMenu.classList.add("is-hidden");
  updateHud();
}

function toggleBranchLattice() {
  if (state.ui.isBranchLatticeOpen) {
    closeBranchLattice();
  } else {
    openBranchLattice();
  }
}

function advanceCodgerTutorialPrimary() {
  if (state.intro.tutorial.step === "openLattice") {
    openBranchLattice();
    return;
  }

  if (isCodgerLatticeTourStep(state)) {
    const wasFinalLatticeStep = state.intro.tutorial.step === "latticeTourLoop";
    handleEvents(advanceCodgerLatticeTutorial(state));
    if (wasFinalLatticeStep) closeBranchLattice(true);
    updateBranchLattice();
    updateHud();
    return;
  }

  handleEvents(continueCodgerTutorial(state));
  updateHud();
}

function skipCurrentCodgerTutorial() {
  if (!canSkipCodgerTutorial(state)) return;
  handleEvents(skipCodgerTutorial(state));
  if (state.ui.isBranchLatticeOpen) closeBranchLattice(true);
  updateHud();
}

function firstOpenSlot(slots: Array<string | null>) {
  const index = slots.findIndex((slot) => !slot);
  return index >= 0 ? index : 0;
}

function branchSlots(kind: BranchDragKind) {
  const member = selectedLatticePartyMember(state);
  return kind === "ability"
    ? member.branchLattice.abilitySlotIds
    : member.branchLattice.modifierSlotIds;
}

function hasBranchOption(kind: BranchDragKind, optionId: string) {
  const frame = branchLatticeFrame(state, selectedLatticePartyMember(state).id);
  return kind === "ability"
    ? frame.latticeAbilityOptions.some((option) => option.id === optionId)
    : frame.modifierOptions.some((option) => option.id === optionId);
}

function selectBranchSlot(kind: BranchDragKind, slotIndex: number) {
  const branchLattice = selectedLatticePartyMember(state).branchLattice;
  if (kind === "ability") {
    branchLattice.selectedAbilitySlot = slotIndex;
    branchLattice.selectedModifierSlot = null;
  } else {
    branchLattice.selectedModifierSlot = slotIndex;
    branchLattice.selectedAbilitySlot = null;
  }
}

function commitBranchLatticeChange() {
  selectedLatticePartyMember(state).autoLoop = createAutoAttackLoopState();
  syncActiveMemberFromCombat(state);
  updateBranchLattice();
  updateHud();
}

function assignBranchOption(kind: BranchDragKind, optionId: string, targetSlot?: number) {
  if (!hasBranchOption(kind, optionId)) return;
  const branchLattice = selectedLatticePartyMember(state).branchLattice;
  const slots = branchSlots(kind);
  const selectedSlot = kind === "ability"
    ? branchLattice.selectedAbilitySlot
    : branchLattice.selectedModifierSlot;
  const slotIndex = targetSlot ?? selectedSlot ?? firstOpenSlot(slots);
  slots.forEach((slotOptionId, index) => {
    if (index !== slotIndex && slotOptionId === optionId) slots[index] = null;
  });
  slots[slotIndex] = optionId;
  selectBranchSlot(kind, slotIndex);
  commitBranchLatticeChange();
}

function moveBranchSlot(kind: BranchDragKind, fromSlot: number, toSlot: number) {
  const slots = branchSlots(kind);
  if (!slots[fromSlot]) return;
  if (fromSlot !== toSlot) {
    const heldOptionId = slots[fromSlot];
    slots[fromSlot] = slots[toSlot];
    slots[toSlot] = heldOptionId;
  }
  selectBranchSlot(kind, toSlot);
  commitBranchLatticeChange();
}

function clearBranchSlot(kind: BranchDragKind, slotIndex: number) {
  const slots = branchSlots(kind);
  if (!slots[slotIndex]) return;
  slots[slotIndex] = null;
  selectBranchSlot(kind, slotIndex);
  commitBranchLatticeChange();
}

function assignBranchAbility(optionId: string) {
  assignBranchOption("ability", optionId);
}

function assignBranchModifier(optionId: string) {
  assignBranchOption("modifier", optionId);
}

function clearSelectedBranchModifier() {
  const selectedSlot = selectedLatticePartyMember(state).branchLattice.selectedModifierSlot;
  if (selectedSlot === null) return;
  clearBranchSlot("modifier", selectedSlot);
}

function clearBranchLatticeAssignments() {
  const member = selectedLatticePartyMember(state);
  member.branchLattice.abilitySlotIds = member.branchLattice.abilitySlotIds.map(() => null);
  member.branchLattice.modifierSlotIds = member.branchLattice.modifierSlotIds.map(() => null);
  member.autoLoop = createAutoAttackLoopState();
  syncActiveMemberFromCombat(state);
  updateBranchLattice();
  updateHud();
}

function moveCharacterSelection(direction: number) {
  const currentIndex = characterOrder.indexOf(state.selectedClassId);
  const nextIndex = (currentIndex + direction + characterOrder.length) % characterOrder.length;
  state.selectedClassId = characterOrder[nextIndex];
  renderCharacterSelectScreen();
}

async function startGame() {
  if (isStartingGame || !state.ui.isCharacterSelectActive || !applySelectedClass(state)) return;
  isStartingGame = true;
  shell.loadingScreen.classList.remove("is-hidden");
  shell.characterSelect.classList.add("is-hidden");
  await Promise.all([
    ensureRenderAssetsReady(state),
    new Promise((resolve) => window.setTimeout(resolve, 650)),
  ]);

  showGameplayShell();
  handleEvents([logEvent(`${selectedClass(state).name} enters the grove`, selectedClass(state).weapon)]);
  isStartingGame = false;
}

async function loadGameFromTitle() {
  if (isStartingGame || !state.ui.isTitleActive || !hasSavedGame()) return;
  const loadedState = loadSavedGame();
  if (!loadedState) {
    refreshSaveControls();
    return;
  }

  isStartingGame = true;
  titleIntro.reset();
  shell.loadingScreen.classList.remove("is-hidden");
  shell.titleScreen.classList.add("is-hidden");
  await Promise.all([
    ensureRenderAssetsReady(loadedState),
    new Promise((resolve) => window.setTimeout(resolve, 450)),
  ]);

  Object.assign(state, loadedState);
  state.ui.showPartyHealthBars = displaySettings.showPartyHealthBars;
  showGameplayShell();
  handleEvents([logEvent("Save loaded", `${selectedClass(state).name} returns to the grove`)]);
  isStartingGame = false;
}

function saveCurrentGame() {
  if (!isGameplayVisible(state)) return;
  saveToast.showSaving();
  const result = saveGame(state);
  refreshSaveControls();
  if (result.ok) {
    saveToast.showComplete();
  } else {
    saveToast.showFailed();
  }
  handleEvents([
    result.ok
      ? logEvent("Game saved", new Date(result.savedAt).toLocaleString())
      : logEvent("Save failed", result.reason),
  ]);
}

function syncDisplaySettingsUi() {
  shell.displayHealthBarsToggle.checked = state.ui.showPartyHealthBars;
}

function animate(now: number) {
  const delta = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;

  if (isGameplayActive(state)) {
    handleEvents(updateSimulation(state, inputState, delta, frameLookup));
    updateHud();
  }
  updateShop();
  syncMobileControls();

  renderer?.draw(state, delta);

  requestAnimationFrame(animate);
}

function handleClassCardClick(event: Event) {
  const card = (event.target as HTMLElement).closest<HTMLButtonElement>(".character-card");
  const classId = card?.dataset.classId as ClassId | undefined;
  if (!classId || !characterClasses[classId]) return;
  togglePartyClassSelection(state, classId);
  renderCharacterSelectScreen();
}

function handleKeyDown(event: KeyboardEvent) {
  if (hudLayoutEditor.isActive()) {
    if (event.code === "Escape") {
      event.preventDefault();
      if (!event.repeat) hudLayoutEditor.exit();
    }
    return;
  }

  if (state.ui.isBranchLatticeOpen) {
    if ((event.code === "Enter" || event.code === "Space") && isCodgerLatticeTourStep(state)) {
      event.preventDefault();
      if (!event.repeat) advanceCodgerTutorialPrimary();
      return;
    }
    if (event.code === "KeyI") {
      event.preventDefault();
      if (!event.repeat) toggleInventory();
      return;
    }
    if (event.code === "Escape" || event.code === "KeyO") {
      event.preventDefault();
      if (!event.repeat) closeBranchLattice();
      return;
    }
    if (event.code === "KeyR") {
      event.preventDefault();
      if (!event.repeat) clearSelectedBranchModifier();
      return;
    }
    if (event.code === "KeyC") {
      event.preventDefault();
      if (!event.repeat) clearBranchLatticeAssignments();
      return;
    }
    if (event.code === "KeyP") {
      event.preventDefault();
      if (!event.repeat) {
        const branchLattice = selectedLatticePartyMember(state).branchLattice;
        branchLattice.isPreviewOpen = !branchLattice.isPreviewOpen;
        updateBranchLattice();
      }
      return;
    }
    return;
  }

  if (state.ui.isLootOpen) {
    if (event.code === "Escape") {
      event.preventDefault();
      if (!event.repeat) closeLootMenu();
    }
    if (event.code === "Enter" || event.code === "KeyE") {
      event.preventDefault();
      if (!event.repeat) takeAllLoot();
    }
    return;
  }

  if (state.ui.isInventoryOpen) {
    if (event.code === "KeyO") {
      event.preventDefault();
      if (!event.repeat) toggleBranchLattice();
      return;
    }
    if (event.code === "Escape" || event.code === "KeyI") {
      event.preventDefault();
      if (!event.repeat) closeInventory();
      return;
    }
    return;
  }

  if (event.code === "Escape" && state.ui.pauseMenuSource === "title") {
    event.preventDefault();
    closePauseMenu();
    return;
  }

  if (state.ui.pauseMenuSource === "title") return;

  if (event.code === "Escape" && isGameplayVisible(state)) {
    event.preventDefault();
    togglePauseMenu();
    return;
  }

  if (event.code === "KeyO" && isGameplayVisible(state)) {
    event.preventDefault();
    if (!event.repeat) toggleBranchLattice();
    return;
  }

  if (state.ui.isTitleActive) {
    if (event.code === "Enter" || event.code === "Space") {
      event.preventDefault();
      if (shell.titleScreen.classList.contains("is-title-menu-ready")) showCharacterSelect();
    }
    return;
  }

  if (state.ui.isCharacterSelectActive) {
    if (event.code === "ArrowRight" || event.code === "ArrowDown") {
      event.preventDefault();
      moveCharacterSelection(1);
    }
    if (event.code === "ArrowLeft" || event.code === "ArrowUp") {
      event.preventDefault();
      moveCharacterSelection(-1);
    }
    if (event.code === "Enter" || event.code === "Space") {
      event.preventDefault();
      void startGame();
    }
    if (event.code === "Escape") {
      event.preventDefault();
      showTitleScreen();
    }
    return;
  }

  if (state.ui.isPaused) return;

  if (/^F[1-4]$/.test(event.code) && isGameplayVisible(state)) {
    event.preventDefault();
    if (state.round.phase === "battle") return;
    const index = Number(event.code.slice(1)) - 1;
    const member = state.party.members[index];
    if (member) {
      handleEvents(setActivePartyMember(state, member.id));
      updateHud();
    }
    return;
  }

  if (event.code === "KeyI" && isGameplayVisible(state)) {
    event.preventDefault();
    if (!event.repeat) toggleInventory();
    return;
  }

  if (/^Digit[1-9]$/.test(event.code) && isGameplayActive(state)) {
    event.preventDefault();
    if (!event.repeat) castSkillBarSlot(Number(event.code.slice(5)) - 1);
    return;
  }

  const action = gameplayActionForCode(event.code);
  if (!action) return;

  inputState.pressedActions.add(action);

  if (action === "target-next") {
    event.preventDefault();
    if (state.round.phase !== "battle") handleEvents(lockTarget(state));
  }
  if (action === "equip") {
    event.preventDefault();
    if (!event.repeat) openLootOrEquip();
  }
}

function handleKeyUp(event: KeyboardEvent) {
  const action = gameplayActionForCode(event.code);
  if (action) {
    inputState.pressedActions.delete(action);
  }
}

function branchDragPayloadFromEvent(event: DragEvent): BranchDragPayload | null {
  if (activeBranchDrag) return activeBranchDrag;
  const rawPayload = event.dataTransfer?.getData(branchDragMime);
  if (!rawPayload) return null;
  try {
    const payload = JSON.parse(rawPayload) as BranchDragPayload;
    if ((payload.kind === "ability" || payload.kind === "modifier") && payload.optionId) return payload;
  } catch {
    return null;
  }
  return null;
}

function setBranchDragPayload(event: DragEvent, payload: BranchDragPayload) {
  activeBranchDrag = payload;
  event.dataTransfer?.setData(branchDragMime, JSON.stringify(payload));
  event.dataTransfer?.setData("text/plain", payload.optionId);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
}

function clearBranchDragImage() {
  branchDragImageElement?.remove();
  branchDragImageElement = null;
}

function setBranchDragImage(event: DragEvent, source: HTMLElement) {
  if (!event.dataTransfer) return;
  const sourceImage = source.querySelector<HTMLImageElement>(".branch-icon img");
  if (!sourceImage) return;

  clearBranchDragImage();
  const dragImage = document.createElement("div");
  const image = sourceImage.cloneNode(false) as HTMLImageElement;
  const size = source.classList.contains("ability-socket")
    ? 104
    : source.classList.contains("modifier-socket")
      ? 62
      : 68;

  dragImage.className = "branch-drag-image";
  image.style.width = `${size}px`;
  image.style.height = `${size}px`;
  dragImage.append(image);
  document.body.append(dragImage);
  event.dataTransfer.setDragImage(dragImage, size / 2, size / 2);
  branchDragImageElement = dragImage;
}

function branchDropTarget(target: HTMLElement) {
  const abilitySlot = target.closest<HTMLElement>("[data-branch-ability-slot]");
  if (abilitySlot?.dataset.branchAbilitySlot) {
    return { kind: "ability" as const, slot: Number(abilitySlot.dataset.branchAbilitySlot), element: abilitySlot };
  }
  const modifierSlot = target.closest<HTMLElement>("[data-branch-modifier-slot]");
  if (modifierSlot?.dataset.branchModifierSlot) {
    return { kind: "modifier" as const, slot: Number(modifierSlot.dataset.branchModifierSlot), element: modifierSlot };
  }
  const abilityPane = target.closest<HTMLElement>(".branch-abilities-panel, .branch-ability-list");
  if (abilityPane) return { kind: "ability" as const, slot: null, element: abilityPane };
  const modifierPane = target.closest<HTMLElement>(".branch-modifiers-panel, .branch-modifier-list");
  if (modifierPane) return { kind: "modifier" as const, slot: null, element: modifierPane };
  return null;
}

function clearBranchDragStyles() {
  shell.branchLatticeMenu.querySelectorAll(".is-dragging, .is-drag-target").forEach((element) => {
    element.classList.remove("is-dragging", "is-drag-target");
  });
}

function clearBranchDropTargets() {
  shell.branchLatticeMenu.querySelectorAll(".is-drag-target").forEach((element) => {
    element.classList.remove("is-drag-target");
  });
}

function handleBranchDragStart(event: DragEvent) {
  const target = event.target as HTMLElement;
  const abilityOption = target.closest<HTMLElement>("[data-branch-ability-option]");
  if (abilityOption?.dataset.branchAbilityOption) {
    setBranchDragPayload(event, {
      kind: "ability",
      optionId: abilityOption.dataset.branchAbilityOption,
      source: "option",
      fromSlot: null,
    });
    setBranchDragImage(event, abilityOption);
    abilityOption.classList.add("is-dragging");
    return;
  }

  const modifierOption = target.closest<HTMLElement>("[data-branch-modifier-option]");
  if (modifierOption?.dataset.branchModifierOption) {
    setBranchDragPayload(event, {
      kind: "modifier",
      optionId: modifierOption.dataset.branchModifierOption,
      source: "option",
      fromSlot: null,
    });
    setBranchDragImage(event, modifierOption);
    modifierOption.classList.add("is-dragging");
    return;
  }

  const abilitySlot = target.closest<HTMLElement>("[data-branch-ability-slot]");
  if (abilitySlot?.dataset.branchAbilitySlot) {
    const fromSlot = Number(abilitySlot.dataset.branchAbilitySlot);
    const optionId = selectedLatticePartyMember(state).branchLattice.abilitySlotIds[fromSlot];
    if (!optionId) return;
    setBranchDragPayload(event, { kind: "ability", optionId, source: "slot", fromSlot });
    setBranchDragImage(event, abilitySlot);
    abilitySlot.classList.add("is-dragging");
    return;
  }

  const modifierSlot = target.closest<HTMLElement>("[data-branch-modifier-slot]");
  if (modifierSlot?.dataset.branchModifierSlot) {
    const fromSlot = Number(modifierSlot.dataset.branchModifierSlot);
    const optionId = selectedLatticePartyMember(state).branchLattice.modifierSlotIds[fromSlot];
    if (!optionId) return;
    setBranchDragPayload(event, { kind: "modifier", optionId, source: "slot", fromSlot });
    setBranchDragImage(event, modifierSlot);
    modifierSlot.classList.add("is-dragging");
  }
}

function handleBranchDragOver(event: DragEvent) {
  const payload = branchDragPayloadFromEvent(event);
  if (!payload) return;
  const target = branchDropTarget(event.target as HTMLElement);
  if (!target || target.kind !== payload.kind) return;
  if (target.slot === null && payload.source !== "slot") return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  if (!target.element.classList.contains("is-drag-target")) {
    clearBranchDropTargets();
    target.element.classList.add("is-drag-target");
  }
}

function handleBranchDrop(event: DragEvent) {
  const payload = branchDragPayloadFromEvent(event);
  if (!payload) return;
  const target = branchDropTarget(event.target as HTMLElement);
  if (!target || target.kind !== payload.kind) return;
  event.preventDefault();

  if (target.slot === null) {
    if (payload.source === "slot" && payload.fromSlot !== null) clearBranchSlot(payload.kind, payload.fromSlot);
  } else if (payload.source === "slot" && payload.fromSlot !== null) {
    moveBranchSlot(payload.kind, payload.fromSlot, target.slot);
  } else {
    assignBranchOption(payload.kind, payload.optionId, target.slot);
  }

  activeBranchDrag = null;
  clearBranchDragImage();
  suppressBranchClick = true;
  clearBranchDragStyles();
  window.setTimeout(() => {
    suppressBranchClick = false;
  }, 0);
}

function handleBranchDragEnd() {
  activeBranchDrag = null;
  clearBranchDragImage();
  suppressBranchClick = true;
  clearBranchDragStyles();
  window.setTimeout(() => {
    suppressBranchClick = false;
  }, 0);
}

function lootCorpseAtWorldPoint(point: Vec2) {
  if (!state.combat.droppedGear || !state.combat.lootCorpseId) return null;
  return allEnemies(state).find((enemy) => {
    if (enemy.instanceId !== state.combat.lootCorpseId || !enemy.visible || enemy.state !== "dead") return false;
    const dx = (point.x - enemy.x) / Math.max(72, enemy.radius * 2.5);
    const dy = (point.y - (enemy.y + 18)) / Math.max(34, enemy.radius * 1.25);
    return dx * dx + dy * dy <= 1;
  }) ?? null;
}

function updateLootCorpseHover(clientX: number, clientY: number) {
  if (!renderer || !isGameplayActive(state)) {
    state.combat.hoveredLootCorpseId = null;
    gameCursor.setCanvasState(null);
    return;
  }

  const worldPoint = screenToWorld(shell.canvas, renderer.camera, clientX, clientY);
  const hoveredCorpse = lootCorpseAtWorldPoint(worldPoint);
  const hoveredEnemy = state.round.phase === "battle" ? false : isEnemyAtWorldPoint(state, worldPoint);
  state.combat.hoveredLootCorpseId = hoveredCorpse?.instanceId ?? null;
  gameCursor.setCanvasState(hoveredCorpse || hoveredEnemy ? "clickable" : null);
}

shell.startButton.addEventListener("click", showCharacterSelect);
shell.titleLoadButton.addEventListener("click", () => void loadGameFromTitle());
shell.titleControlsButton.addEventListener("click", () => openPauseMenu("controls", "title"));
shell.titleSoundButton.addEventListener("click", () => openPauseMenu("sound", "title"));
shell.titleScreen.addEventListener("pointerdown", audio.playTitleMusic);
audio.playTitleMusic();
refreshSaveControls();
void titleIntro.start();
shell.backButton.addEventListener("click", showTitleScreen);
shell.continueButton.addEventListener("click", () => void startGame());
shell.resumeButton.addEventListener("click", closePauseMenu);
shell.quitToTitleButton.addEventListener("click", quitToTitleScreen);
shell.saveGameButton.addEventListener("click", saveCurrentGame);
shell.editUiButton.addEventListener("click", openHudLayoutEditor);
shell.debugTeleportButton.addEventListener("click", teleportToSelectedDebugEncounter);
shell.debugStarterGearButton.addEventListener("click", equipDebugStarterGear);
shell.displayHealthBarsToggle.addEventListener("change", () => {
  state.ui.showPartyHealthBars = shell.displayHealthBarsToggle.checked;
  displaySettings.showPartyHealthBars = state.ui.showPartyHealthBars;
  saveDisplaySettings(displaySettings);
});
shell.inventoryCloseButton.addEventListener("click", closeInventory);
shell.inventoryMenu.addEventListener("click", handleInventoryClick);
shell.inventoryMenu.addEventListener("change", handleInventoryChange);
shell.lootCloseButton.addEventListener("click", closeLootMenu);
shell.lootTakeAllButton.addEventListener("click", takeAllLoot);
shell.shopMenu.addEventListener("click", handleShopClick);
shell.branchLatticeCloseButton.addEventListener("click", () => closeBranchLattice());
shell.codgerTutorialPrimaryButton.addEventListener("click", advanceCodgerTutorialPrimary);
shell.codgerTutorialSecondaryButton.addEventListener("click", skipCurrentCodgerTutorial);
initializePauseTabs(shell, (tabName) => selectPauseTab(shell, tabName));
shell.characterGrid.addEventListener("click", handleClassCardClick);
shell.hud.addEventListener("pointerdown", handleHudPointerDown);
shell.hud.addEventListener("click", handleHudClick);
shell.hud.addEventListener("contextmenu", handleHudContextMenu);
shell.branchLatticeMenu.addEventListener("dragstart", handleBranchDragStart);
shell.branchLatticeMenu.addEventListener("dragover", handleBranchDragOver);
shell.branchLatticeMenu.addEventListener("dragleave", (event) => {
  if (!(event.relatedTarget instanceof Node) || !shell.branchLatticeMenu.contains(event.relatedTarget)) clearBranchDropTargets();
});
shell.branchLatticeMenu.addEventListener("drop", handleBranchDrop);
shell.branchLatticeMenu.addEventListener("dragend", handleBranchDragEnd);
shell.branchLatticeMenu.addEventListener("click", (event) => {
  if (handleBranchLatticeTabClick(event)) return;
  if (suppressBranchClick) {
    event.preventDefault();
    return;
  }
  const target = event.target as HTMLElement;
  const abilityOption = target.closest<HTMLElement>("[data-branch-ability-option]");
  if (abilityOption?.dataset.branchAbilityOption) {
    assignBranchAbility(abilityOption.dataset.branchAbilityOption);
    return;
  }
  const modifierOption = target.closest<HTMLElement>("[data-branch-modifier-option]");
  if (modifierOption?.dataset.branchModifierOption) {
    assignBranchModifier(modifierOption.dataset.branchModifierOption);
    return;
  }
  const abilitySlot = target.closest<HTMLElement>("[data-branch-ability-slot]");
  if (abilitySlot?.dataset.branchAbilitySlot) {
    const branchLattice = selectedLatticePartyMember(state).branchLattice;
    branchLattice.selectedAbilitySlot = Number(abilitySlot.dataset.branchAbilitySlot);
    branchLattice.selectedModifierSlot = null;
    updateBranchLattice();
    return;
  }
  const modifierSlot = target.closest<HTMLElement>("[data-branch-modifier-slot]");
  if (modifierSlot?.dataset.branchModifierSlot) {
    const branchLattice = selectedLatticePartyMember(state).branchLattice;
    branchLattice.selectedModifierSlot = Number(modifierSlot.dataset.branchModifierSlot);
    branchLattice.selectedAbilitySlot = null;
    updateBranchLattice();
  }
});
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);

function renderAssetLoadOptions(sourceState: typeof state): RenderAssetLoadOptions {
  const startupOnly = navigator.maxTouchPoints > 0 && window.matchMedia("(max-width: 900px)").matches;
  return {
    startupOnly,
    playerClassIds: characterOrder.filter((classId) => characterClasses[classId].implemented),
    monsterIds: startupOnly ? allEnemies(sourceState).map((enemy) => enemy.monsterId) : undefined,
  };
}

function ensureRenderAssetsReady(sourceState: typeof state) {
  renderAssetsReady ??= loadRenderAssets(renderAssetLoadOptions(sourceState)).then((assets) => {
    renderer = createCanvasRenderer(shell.canvas, assets);
    frameLookup = createAnimationFrameLookup(assets);
    renderer.resize();
    window.addEventListener("resize", () => renderer?.resize());

    shell.canvas.addEventListener("click", (event) => {
      if (event.button !== 0 || !renderer || !isGameplayActive(state)) return;
      const worldPoint = screenToWorld(shell.canvas, renderer.camera, event.clientX, event.clientY);
      if (lootCorpseAtWorldPoint(worldPoint)) {
        openLootMenu();
        return;
      }
      if (state.party.pendingTargetedSpecial) {
        const clickedMember = partyMemberAtWorldPoint(state, worldPoint);
        if (clickedMember) {
          handleEvents(castPendingPartyTargetedSpecial(state, clickedMember.id));
          updateHud();
          return;
        }
      }
      if (state.round.phase !== "battle") {
        handleEvents(isEnemyAtWorldPoint(state, worldPoint) ? lockTarget(state) : clearTarget(state));
      }
    });
    shell.canvas.addEventListener("pointermove", (event) => {
      updateLootCorpseHover(event.clientX, event.clientY);
    });
    shell.canvas.addEventListener("pointerleave", () => {
      state.combat.hoveredLootCorpseId = null;
      gameCursor.setCanvasState(null);
    });

    pushLog(shell.eventLog, "MotherSeed autobattler ready", "Draft the party, tune gear, and let the loop fight");
    requestAnimationFrame((now) => {
      lastFrame = now;
      animate(now);
    });
  });
  return renderAssetsReady;
}

import { distance } from "../math";
import {
  createStartingAmulet,
  logEvent,
  soundEvent,
  type GameEvent,
  type GameState,
} from "../state";

export const codgerTrialBeginText =
  "Ah, there you are. The Mother Tree has been waiting. Take this trial amulet, and do not pretend it is jewelry.";
export const codgerAmuletLatticeText =
  "That amulet adds a Finisher to your Branch Lattice. A Finisher is the knot at the end of a good little bit of violence.";
export const codgerPressLatticeText =
  "Press O. Open the Branch Lattice. That is where your gear decides what your hands do when panic starts.";
export const codgerLatticeAbilitiesText =
  "These are Auto Abilities. Slot them into the vine, and they fire from top to bottom.";
export const codgerLatticeModifiersText =
  "Modifiers sit beside abilities. Some add bite, some add speed, some make a plain swing into a problem.";
export const codgerLatticeLoopText =
  "When the last slotted ability resolves, the loop rests for three seconds, then begins again. The tree likes rhythm.";
export const codgerAutoAttackText =
  "In battle, lock a target and your lattice begins working. Your party positions itself while the auto-loop handles the steady strikes.";
export const codgerMeterText = "Those strikes build Bloom Meter. Bloom Meter feeds your numbered Specials.";
export const codgerMotherLoadText =
  "Some Specials carry the Mother Load mark. Cast one to prime Mother Load, then cast another marked Special back to back to wake it up meaner.";
export const codgerGoUpStairsText =
  "Good. Up the stairs with you. Lock a target, let the lattice turn, and chain marked Specials when Mother Load blooms.";
export const codgerTutorialSkippedText =
  "Tutorial skipped. Branch Lattice opens with O. Auto abilities run top to bottom. Marked Specials prime and trigger Mother Load. Auto strikes build Bloom Meter.";

export function updateIntroRoom(state: GameState, delta: number, codgerFrameCount = 1) {
  const codger = state.intro.codger;
  codger.animTimer += delta;
  if (codger.animTimer < 0.28) return;

  codger.animTimer = 0;
  codger.animFrame = (codger.animFrame + 1) % Math.max(1, codgerFrameCount);
}

export function isIntroRoom(state: GameState) {
  return state.combat.roomIndex === 0;
}

export function canPlayerTalkToCodger(state: GameState) {
  if (!isIntroRoom(state)) return false;
  return distance(state.player, state.intro.codger) <= state.intro.codger.interactRadius;
}

export function interactWithCodger(state: GameState): GameEvent[] {
  if (!canPlayerTalkToCodger(state)) return [];

  if (state.intro.tutorial.step === "waiting") {
    state.intro.codger.phase = "giftOffered";
    state.intro.tutorial.step = "equipAmulet";
    state.intro.codger.dialogueText = codgerTrialBeginText;
    state.combat.droppedGear = createStartingAmulet(state.selectedClassId);
    state.combat.droppedGearSourceLabel = "Codger's Gift";
    state.combat.lootCorpseId = null;
    state.combat.hoveredLootCorpseId = null;
    return [
      soundEvent("codgerTutorialTrialBegin"),
      logEvent("Codger", codgerTrialBeginText),
    ];
  }

  if (state.intro.tutorial.step === "equipAmulet") {
    state.intro.codger.dialogueText = "Equip the amulet before you head upstairs.";
    return [logEvent("Codger", "Equip the amulet before you head upstairs")];
  }

  if (state.intro.tutorial.step === "amuletEquippedChoice") {
    state.intro.codger.dialogueText = codgerAmuletLatticeText;
    return [logEvent("Codger", "Choose Continue Tutorial or Skip Tutorial")];
  }

  if (!isCodgerTutorialComplete(state)) {
    return [logEvent("Codger", "Finish the tutorial or skip it before heading upstairs")];
  }

  state.intro.codger.dialogueText = codgerGoUpStairsText;
  return [
    soundEvent("codgerTutorialGoUpstairs"),
    logEvent("Codger", codgerGoUpStairsText),
  ];
}

export function maybeFinishCodgerGift(state: GameState): GameEvent[] {
  const events = maybeAdvanceCodgerAmuletEquipped(state);
  if (events.length > 0) return events;

  if (state.intro.codger.phase !== "giftOffered" || state.combat.droppedGear) return [];
  if (!isCodgerTutorialComplete(state)) {
    if (state.intro.tutorial.step === "equipAmulet") {
      state.intro.codger.dialogueText = "Equip the amulet before you head upstairs.";
    }
    return [];
  }

  state.intro.codger.phase = "readyForStairs";
  state.intro.codger.dialogueText = codgerGoUpStairsText;
  return [
    soundEvent("codgerTutorialGoUpstairs"),
    logEvent("Codger", codgerGoUpStairsText),
  ];
}

export function canUseIntroStairs(state: GameState) {
  return !isIntroRoom(state) || isCodgerTutorialComplete(state) || state.intro.codger.phase === "readyForStairs";
}

export function maybeAdvanceCodgerAmuletEquipped(state: GameState): GameEvent[] {
  if (state.intro.tutorial.step !== "equipAmulet" || !isStarterAmuletEquipped(state)) return [];

  state.intro.tutorial.step = "amuletEquippedChoice";
  state.intro.codger.dialogueText = codgerAmuletLatticeText;
  return [
    soundEvent("codgerTutorialAmuletLattice"),
    logEvent("Codger", codgerAmuletLatticeText),
  ];
}

export function continueCodgerTutorial(state: GameState): GameEvent[] {
  if (state.intro.tutorial.step === "amuletEquippedChoice") {
    state.intro.tutorial.step = "openLattice";
    state.intro.codger.dialogueText = codgerPressLatticeText;
    return [
      soundEvent("codgerTutorialPressO"),
      logEvent("Codger", codgerPressLatticeText),
    ];
  }

  if (state.intro.tutorial.step === "autoAttackExplain") {
    state.intro.tutorial.step = "bloomMeterExplain";
    state.intro.codger.dialogueText = codgerMeterText;
    return [
      soundEvent("codgerTutorialMeter"),
      logEvent("Codger", codgerMeterText),
    ];
  }

  if (state.intro.tutorial.step === "bloomMeterExplain") {
    state.intro.tutorial.step = "motherLoadExplain";
    state.intro.codger.dialogueText = codgerMotherLoadText;
    return [
      soundEvent("codgerTutorialMotherLoad"),
      logEvent("Codger", codgerMotherLoadText),
    ];
  }

  if (state.intro.tutorial.step === "motherLoadExplain") {
    return completeCodgerTutorial(state, "completed");
  }

  return [];
}

export function skipCodgerTutorial(state: GameState): GameEvent[] {
  if (!canSkipCodgerTutorial(state)) return [];
  state.intro.codger.dialogueText = codgerTutorialSkippedText;
  const events = [
    soundEvent("codgerTutorialSkipped"),
    logEvent("Codger", codgerTutorialSkippedText),
    ...completeCodgerTutorial(state, "skipped", false),
  ];
  return events;
}

export function advanceCodgerLatticeTutorial(state: GameState): GameEvent[] {
  if (state.intro.tutorial.step === "openLattice") {
    state.intro.tutorial.step = "latticeTourAbilities";
    state.intro.codger.dialogueText = codgerLatticeAbilitiesText;
    return [
      soundEvent("codgerTutorialLatticeAbilities"),
      logEvent("Codger", codgerLatticeAbilitiesText),
    ];
  }

  if (state.intro.tutorial.step === "latticeTourAbilities") {
    state.intro.tutorial.step = "latticeTourModifiers";
    state.intro.codger.dialogueText = codgerLatticeModifiersText;
    return [
      soundEvent("codgerTutorialLatticeModifiers"),
      logEvent("Codger", codgerLatticeModifiersText),
    ];
  }

  if (state.intro.tutorial.step === "latticeTourModifiers") {
    state.intro.tutorial.step = "latticeTourLoop";
    state.intro.codger.dialogueText = codgerLatticeLoopText;
    return [
      soundEvent("codgerTutorialLatticeLoop"),
      logEvent("Codger", codgerLatticeLoopText),
    ];
  }

  if (state.intro.tutorial.step === "latticeTourLoop") {
    state.intro.tutorial.step = "autoAttackExplain";
    state.intro.codger.dialogueText = codgerAutoAttackText;
    return [
      soundEvent("codgerTutorialAutoAttack"),
      logEvent("Codger", codgerAutoAttackText),
    ];
  }

  return [];
}

export function canSkipCodgerTutorial(state: GameState) {
  return isIntroRoom(state)
    && state.intro.tutorial.completionReason === null
    && state.intro.tutorial.step !== "waiting"
    && state.intro.tutorial.step !== "equipAmulet";
}

export function isCodgerTutorialComplete(state: GameState) {
  return state.intro.tutorial.completionReason !== null || state.intro.tutorial.step === "readyForStairs";
}

export function isCodgerLatticeTourStep(state: GameState) {
  return (
    state.intro.tutorial.step === "latticeTourAbilities" ||
    state.intro.tutorial.step === "latticeTourModifiers" ||
    state.intro.tutorial.step === "latticeTourLoop"
  );
}

function completeCodgerTutorial(state: GameState, reason: "completed" | "skipped", playVoice = true): GameEvent[] {
  state.intro.tutorial.step = "readyForStairs";
  state.intro.tutorial.completionReason = reason;
  state.intro.codger.phase = "readyForStairs";
  state.intro.codger.dialogueText = codgerGoUpStairsText;
  return playVoice
    ? [
      soundEvent("codgerTutorialGoUpstairs"),
      logEvent("Codger", codgerGoUpStairsText),
    ]
    : [logEvent("Codger", codgerGoUpStairsText)];
}

function isStarterAmuletEquipped(state: GameState) {
  const amulet = state.combat.equippedItems.amulet;
  return !!amulet?.frame.latticeAbilityOptions.some((option) => option.tags?.includes("Finisher"));
}

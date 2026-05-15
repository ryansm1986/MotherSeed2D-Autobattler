import { isIntroRoom } from "../game/world/intro-room";
import type { GameState } from "../game/state";

export type CodgerTutorialViewModel = {
  isVisible: boolean;
  title: string;
  copy: string;
  hint: string;
  primaryLabel: string | null;
  secondaryLabel: string | null;
  target: "none" | "latticeButton" | "latticeAbilities" | "latticeModifiers" | "latticeSockets" | "latticeDetails" | "hudAuto" | "hudBloomMeter" | "hudMotherLoad";
};

export type CodgerTutorialTargets = {
  root: HTMLElement;
  title: HTMLElement;
  copy: HTMLElement;
  hint: HTMLElement;
  primaryButton: HTMLButtonElement;
  secondaryButton: HTMLButtonElement;
};

export function renderCodgerTutorial(state: GameState): CodgerTutorialViewModel {
  if (!isIntroRoom(state) || state.ui.isTitleActive || state.ui.isCharacterSelectActive) {
    return hiddenView();
  }

  const isMobile = window.matchMedia("(max-width: 760px)").matches;
  const latticePrompt = isMobile ? "Tap Lattice." : "Press O.";

  switch (state.intro.tutorial.step) {
    case "equipAmulet":
      return {
        isVisible: true,
        title: "Equip The Amulet",
        copy: "Codger's gift grants your starter Finisher. Equip it into the amulet slot before heading upstairs.",
        hint: "Use E to take the gift, then equip it from the inventory.",
        primaryLabel: null,
        secondaryLabel: null,
        target: "none",
      };
    case "amuletEquippedChoice":
      return {
        isVisible: true,
        title: "Branch Lattice Lesson",
        copy: "The amulet added a Finisher to your lattice. Continue for the guided tour, or skip and head upstairs.",
        hint: "Skipping keeps the amulet equipped and unlocks the stairs.",
        primaryLabel: "Continue Tutorial",
        secondaryLabel: "Skip Tutorial",
        target: "none",
      };
    case "openLattice":
      return {
        isVisible: true,
        title: "Open Branch Lattice",
        copy: "The Branch Lattice controls your automatic attack sequence and gear-driven behavior.",
        hint: latticePrompt,
        primaryLabel: isMobile ? "Open Lattice" : null,
        secondaryLabel: "Skip Tutorial",
        target: "latticeButton",
      };
    case "latticeTourAbilities":
      return {
        isVisible: true,
        title: "Auto Abilities",
        copy: "These are Auto Abilities. Slot them into the vine, and they fire from top to bottom.",
        hint: "Press Enter or click Next.",
        primaryLabel: "Next",
        secondaryLabel: "Skip Tutorial",
        target: "latticeAbilities",
      };
    case "latticeTourModifiers":
      return {
        isVisible: true,
        title: "Modifiers",
        copy: "Modifiers sit beside abilities. Some add bite, some add speed, some make a plain swing into a problem.",
        hint: "Modifiers shape adjacent Branch abilities.",
        primaryLabel: "Next",
        secondaryLabel: "Skip Tutorial",
        target: "latticeModifiers",
      };
    case "latticeTourLoop":
      return {
        isVisible: true,
        title: "Auto Loop",
        copy: "When the last slotted ability resolves, the loop rests for three seconds, then begins again. The tree likes rhythm.",
        hint: "Next closes the lattice and returns to the grove.",
        primaryLabel: "Next",
        secondaryLabel: "Skip Tutorial",
        target: "latticeDetails",
      };
    case "autoAttackExplain":
      return {
        isVisible: true,
        title: "Auto Attacks",
        copy: "In battle, lock a target and your lattice begins working. Your party positions itself while the auto-loop handles the steady strikes.",
        hint: "Watch Auto Loop in the HUD during combat.",
        primaryLabel: "Next",
        secondaryLabel: "Skip Tutorial",
        target: "hudAuto",
      };
    case "bloomMeterExplain":
      return {
        isVisible: true,
        title: "Bloom Meter",
        copy: "Those strikes build Bloom Meter. Bloom Meter feeds your numbered Specials.",
        hint: "Spend Bloom Meter on Specials when your moment opens.",
        primaryLabel: "Next",
        secondaryLabel: "Skip Tutorial",
        target: "hudBloomMeter",
      };
    case "motherLoadExplain":
      return {
        isVisible: true,
        title: "Mother Load",
        copy: "Marked Specials prime Mother Load. Cast another marked Special back to back, and Mother Load wakes that Special up meaner.",
        hint: "Finish to unlock the stairs.",
        primaryLabel: "Finish",
        secondaryLabel: "Skip Tutorial",
        target: "hudMotherLoad",
      };
    default:
      return hiddenView();
  }
}

export function applyCodgerTutorial(targets: CodgerTutorialTargets, view: CodgerTutorialViewModel) {
  targets.root.classList.toggle("is-hidden", !view.isVisible);
  targets.root.dataset.tutorialTarget = view.target;
  targets.title.textContent = view.title;
  targets.copy.textContent = view.copy;
  targets.hint.textContent = view.hint;

  targets.primaryButton.classList.toggle("is-hidden", !view.primaryLabel);
  targets.primaryButton.textContent = view.primaryLabel ?? "";
  targets.secondaryButton.classList.toggle("is-hidden", !view.secondaryLabel);
  targets.secondaryButton.textContent = view.secondaryLabel ?? "";
}

function hiddenView(): CodgerTutorialViewModel {
  return {
    isVisible: false,
    title: "",
    copy: "",
    hint: "",
    primaryLabel: null,
    secondaryLabel: null,
    target: "none",
  };
}

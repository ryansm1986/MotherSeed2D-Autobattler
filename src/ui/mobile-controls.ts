export type MobileControlElements = {
  root: HTMLElement;
  targetButton: HTMLButtonElement;
  specialButtons: HTMLButtonElement[];
  equipButton: HTMLButtonElement;
  inventoryButton: HTMLButtonElement;
  branchLatticeButton: HTMLButtonElement;
  pauseButton: HTMLButtonElement;
  rotatePrompt: HTMLElement;
};

export type MobileControls = {
  clear(): void;
  setActive(active: boolean): void;
  setGameplayInputActive(active: boolean): void;
  setGameplayVisible(visible: boolean): void;
};

type MobileControlOptions = {
  elements: MobileControlElements;
  canUseGameplayInput(): boolean;
  onTarget(): void;
  onSpecial(index: number): void;
  onEquip(): void;
  onInventory(): void;
  onBranchLattice(): void;
  onPause(): void;
};

export function createMobileControls(options: MobileControlOptions): MobileControls {
  const { elements } = options;

  const clear = () => {
    elements.root.querySelectorAll(".mobile-button.is-pressed").forEach((button) => button.classList.remove("is-pressed"));
  };

  bindCommandButton(elements.targetButton, options.onTarget, options.canUseGameplayInput);
  bindCommandButton(elements.equipButton, options.onEquip, options.canUseGameplayInput);
  bindCommandButton(elements.inventoryButton, options.onInventory);
  bindCommandButton(elements.branchLatticeButton, options.onBranchLattice);
  bindCommandButton(elements.pauseButton, options.onPause);
  elements.specialButtons.forEach((button, index) => {
    bindCommandButton(button, () => options.onSpecial(index), options.canUseGameplayInput);
  });

  window.addEventListener("orientationchange", clear);
  window.addEventListener("blur", clear);

  return {
    clear,
    setActive(active) {
      elements.root.classList.toggle("is-active", active);
      if (!active) clear();
    },
    setGameplayInputActive(active) {
      elements.root.classList.toggle("is-gameplay-active", active);
      if (!active) clear();
    },
    setGameplayVisible(visible) {
      elements.rotatePrompt.classList.toggle("is-active", visible);
    },
  };
}

function bindCommandButton(button: HTMLButtonElement, command: () => void, canRun: () => boolean = () => true) {
  const release = () => button.classList.remove("is-pressed");

  button.addEventListener("pointerdown", (event) => {
    if (!canRun()) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    button.classList.add("is-pressed");
    command();
  });
  button.addEventListener("pointerup", (event) => {
    event.preventDefault();
    release();
  });
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
}

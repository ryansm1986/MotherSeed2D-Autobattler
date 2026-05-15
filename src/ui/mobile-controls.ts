import type { GameplayAction, InputState } from "../game/input-actions";

export type MobileControlElements = {
  root: HTMLElement;
  movePad: HTMLElement;
  moveThumb: HTMLElement;
  dodgeButton: HTMLButtonElement;
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
  inputState: InputState;
  canUseGameplayInput(): boolean;
  onTarget(): void;
  onSpecial(index: number): void;
  onEquip(): void;
  onInventory(): void;
  onBranchLattice(): void;
  onPause(): void;
};

const movementActions: GameplayAction[] = ["move-up", "move-down", "move-left", "move-right", "sprint"];

export function createMobileControls(options: MobileControlOptions): MobileControls {
  const { elements, inputState } = options;
  let activeMovePointer: number | null = null;
  let dodgeReleaseTimer: number | null = null;

  const releaseDodge = () => {
    inputState.pressedActions.delete("dodge");
    elements.dodgeButton.classList.remove("is-pressed");
    if (dodgeReleaseTimer !== null) {
      window.clearTimeout(dodgeReleaseTimer);
      dodgeReleaseTimer = null;
    }
  };

  const clearMovement = () => {
    movementActions.forEach((action) => inputState.pressedActions.delete(action));
    inputState.sprintExhaustedUntilRelease = false;
    elements.moveThumb.style.transform = "translate(-50%, -50%)";
    elements.movePad.classList.remove("is-pressed", "is-sprinting");
  };

  const clear = () => {
    activeMovePointer = null;
    clearMovement();
    releaseDodge();
  };

  const setPressedMovement = (event: PointerEvent) => {
    if (!options.canUseGameplayInput()) {
      clearMovement();
      return;
    }

    const rect = elements.movePad.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = Math.max(1, Math.min(rect.width, rect.height) / 2);
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const distance = Math.min(Math.hypot(dx, dy), radius);
    const unitX = distance > 0 ? dx / radius : 0;
    const unitY = distance > 0 ? dy / radius : 0;
    const deadzone = 0.22;
    const directionalThreshold = 0.28;
    const sprinting = distance / radius > 0.72;

    clearMovement();
    elements.movePad.classList.add("is-pressed");
    elements.movePad.classList.toggle("is-sprinting", sprinting);
    elements.moveThumb.style.transform = `translate(calc(-50% + ${unitX * 44}px), calc(-50% + ${unitY * 44}px))`;

    if (Math.abs(unitX) < deadzone && Math.abs(unitY) < deadzone) return;
    if (unitY < -directionalThreshold) inputState.pressedActions.add("move-up");
    if (unitY > directionalThreshold) inputState.pressedActions.add("move-down");
    if (unitX < -directionalThreshold) inputState.pressedActions.add("move-left");
    if (unitX > directionalThreshold) inputState.pressedActions.add("move-right");
    if (sprinting) inputState.pressedActions.add("sprint");
  };

  elements.movePad.addEventListener("pointerdown", (event) => {
    if (!options.canUseGameplayInput()) return;
    event.preventDefault();
    activeMovePointer = event.pointerId;
    elements.movePad.setPointerCapture(event.pointerId);
    setPressedMovement(event);
  });

  elements.movePad.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activeMovePointer) return;
    event.preventDefault();
    setPressedMovement(event);
  });

  const releaseMovePointer = (event: PointerEvent) => {
    if (event.pointerId !== activeMovePointer) return;
    event.preventDefault();
    activeMovePointer = null;
    clearMovement();
  };

  elements.movePad.addEventListener("pointerup", releaseMovePointer);
  elements.movePad.addEventListener("pointercancel", releaseMovePointer);
  elements.movePad.addEventListener("lostpointercapture", clearMovement);

  elements.dodgeButton.addEventListener("pointerdown", (event) => {
    if (!options.canUseGameplayInput()) return;
    event.preventDefault();
    elements.dodgeButton.setPointerCapture(event.pointerId);
    elements.dodgeButton.classList.add("is-pressed");
    inputState.pressedActions.add("dodge");
    if (dodgeReleaseTimer !== null) window.clearTimeout(dodgeReleaseTimer);
    dodgeReleaseTimer = window.setTimeout(releaseDodge, 140);
  });
  elements.dodgeButton.addEventListener("pointerup", (event) => {
    event.preventDefault();
    releaseDodge();
  });
  elements.dodgeButton.addEventListener("pointercancel", releaseDodge);
  elements.dodgeButton.addEventListener("lostpointercapture", releaseDodge);

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

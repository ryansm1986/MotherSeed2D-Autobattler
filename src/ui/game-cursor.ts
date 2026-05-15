export type GameCursorState = "default" | "clickable" | "blocked" | "open";

export type GameCursorController = {
  setCanvasState: (state: GameCursorState | null) => void;
};

const blockedSelector = [
  "button:disabled",
  "input:disabled",
  "select:disabled",
  "textarea:disabled",
  "[aria-disabled='true']",
  "[disabled]",
].join(", ");

const clickableSelector = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "[role='button']",
  "[draggable='true']",
  "[data-branch-ability-option]",
  "[data-branch-modifier-option]",
  "[data-branch-ability-slot]",
  "[data-branch-modifier-slot]",
  ".inventory-slot",
  ".inventory-item",
  ".loot-slot",
].join(", ");

export function createGameCursor(cursor: HTMLElement): GameCursorController {
  const canUseCustomCursor = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let targetState: GameCursorState = "default";
  let canvasState: GameCursorState | null = null;
  let isPressing = false;
  let isDragging = false;
  let isVisible = false;

  if (!canUseCustomCursor) {
    cursor.classList.add("is-hidden");
    return { setCanvasState: () => undefined };
  }

  document.body.classList.add("motherseed-cursor-enabled");
  setCursorState("default");

  function inferTargetState(target: EventTarget | null): GameCursorState {
    if (!(target instanceof HTMLElement)) return "default";
    if (target.closest(blockedSelector)) return "blocked";
    if (target.closest(clickableSelector)) return "clickable";
    return "default";
  }

  function currentState(): GameCursorState {
    if (canvasState === "blocked" || targetState === "blocked") return "blocked";
    if (isDragging || isPressing) return "open";
    return canvasState ?? targetState;
  }

  function setCursorState(state: GameCursorState) {
    cursor.dataset.cursorState = state;
  }

  function syncState() {
    setCursorState(currentState());
  }

  function show() {
    if (isVisible) return;
    isVisible = true;
    cursor.classList.add("is-visible");
  }

  window.addEventListener("pointermove", (event) => {
    show();
    targetState = inferTargetState(event.target);
    cursor.style.transform = `translate3d(${event.clientX - 6}px, ${event.clientY - 8}px, 0)`;
    syncState();
  }, { passive: true });

  window.addEventListener("pointerdown", () => {
    isPressing = true;
    syncState();
  }, { passive: true });

  window.addEventListener("pointerup", () => {
    isPressing = false;
    syncState();
  }, { passive: true });

  window.addEventListener("pointercancel", () => {
    isPressing = false;
    syncState();
  }, { passive: true });

  window.addEventListener("dragstart", () => {
    isDragging = true;
    syncState();
  });

  window.addEventListener("dragend", () => {
    isDragging = false;
    syncState();
  });

  document.addEventListener("mouseleave", () => {
    isVisible = false;
    cursor.classList.remove("is-visible");
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) return;
    isPressing = false;
    isDragging = false;
    isVisible = false;
    cursor.classList.remove("is-visible");
    syncState();
  });

  return {
    setCanvasState: (state) => {
      canvasState = state;
      syncState();
    },
  };
}

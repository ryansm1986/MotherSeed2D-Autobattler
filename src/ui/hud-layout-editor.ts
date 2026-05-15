type HudLayoutPieceId = "player-panel" | "target-panel" | "skill-bar" | "combat-log";

type HudLayoutPiece = {
  id: HudLayoutPieceId;
  element: HTMLElement;
  label: string;
  resizable?: boolean;
};

type HudPieceLayout = {
  x: number;
  y: number;
  width?: number;
  feedHeight?: number;
};

type HudLayoutState = Partial<Record<HudLayoutPieceId, HudPieceLayout>>;

export type HudLayoutEditorTargets = {
  hud: HTMLElement;
  pauseMenu: HTMLElement;
  toolbar: HTMLElement;
  doneButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  pieces: HudLayoutPiece[];
};

const hudLayoutStorageKey = "motherseed.hudLayout";
const legacyCombatLogStorageKey = "motherseed.combatLog";
const minCombatLogWidth = 300;
const minCombatLogFeedHeight = 74;
const layoutMargin = 10;

function readLayout(): HudLayoutState {
  try {
    const raw = window.localStorage.getItem(hudLayoutStorageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as HudLayoutState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveLayout(layout: HudLayoutState) {
  try {
    window.localStorage.setItem(hudLayoutStorageKey, JSON.stringify(layout));
  } catch {
    // HUD editing remains usable even when local storage is unavailable.
  }
}

function clearLayout() {
  try {
    window.localStorage.removeItem(hudLayoutStorageKey);
    window.localStorage.removeItem(legacyCombatLogStorageKey);
  } catch {
    // Nothing to do.
  }
}

function clampRect(element: HTMLElement, x: number, y: number, width = element.getBoundingClientRect().width, height = element.getBoundingClientRect().height) {
  const maxX = Math.max(layoutMargin, window.innerWidth - width - layoutMargin);
  const maxY = Math.max(layoutMargin, window.innerHeight - height - layoutMargin);
  return {
    x: Math.min(maxX, Math.max(layoutMargin, x)),
    y: Math.min(maxY, Math.max(layoutMargin, y)),
  };
}

function combatLogNonFeedHeight(piece: HudLayoutPiece, fallbackFeedHeight = minCombatLogFeedHeight) {
  const feed = piece.element.querySelector<HTMLElement>(".event-log");
  const rect = piece.element.getBoundingClientRect();
  const feedHeight = feed?.getBoundingClientRect().height ?? fallbackFeedHeight;
  return Math.max(42, rect.height - feedHeight);
}

function applyPieceLayout(piece: HudLayoutPiece, layout: HudPieceLayout | undefined) {
  if (!layout) {
    piece.element.classList.remove("is-ui-layout-floating");
    piece.element.style.removeProperty("--ui-layout-x");
    piece.element.style.removeProperty("--ui-layout-y");
    piece.element.style.removeProperty("--ui-layout-width");
    piece.element.style.removeProperty("--combat-log-feed-height");
    if (piece.id === "combat-log") piece.element.classList.remove("is-floating");
    return;
  }

  const rect = piece.element.getBoundingClientRect();
  const width = layout.width ?? rect.width;
  const feedHeight = layout.feedHeight;
  const clamped = clampRect(piece.element, layout.x, layout.y, width, rect.height);
  piece.element.classList.add("is-ui-layout-floating");
  piece.element.style.setProperty("--ui-layout-x", `${clamped.x}px`);
  piece.element.style.setProperty("--ui-layout-y", `${clamped.y}px`);
  if (layout.width) piece.element.style.setProperty("--ui-layout-width", `${Math.max(minCombatLogWidth, layout.width)}px`);
  if (feedHeight) piece.element.style.setProperty("--combat-log-feed-height", `${Math.max(minCombatLogFeedHeight, feedHeight)}px`);
}

function currentPieceLayout(piece: HudLayoutPiece): HudPieceLayout {
  const rect = piece.element.getBoundingClientRect();
  const layout: HudPieceLayout = { x: rect.left, y: rect.top };
  if (piece.resizable) {
    layout.width = rect.width;
    const feed = piece.element.querySelector<HTMLElement>(".event-log");
    if (feed) layout.feedHeight = feed.getBoundingClientRect().height;
  }
  return layout;
}

export function initializeHudLayoutEditor(targets: HudLayoutEditorTargets) {
  const layout = readLayout();
  let active = false;
  let dragState: {
    piece: HudLayoutPiece;
    offsetX: number;
    offsetY: number;
  } | null = null;
  let resizeState: {
    piece: HudLayoutPiece;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    startWidth: number;
    startFeedHeight: number;
    nonFeedHeight: number;
  } | null = null;

  targets.pieces.forEach((piece) => {
    piece.element.dataset.uiLayoutPiece = piece.id;
    piece.element.dataset.uiLayoutLabel = piece.label;
    applyPieceLayout(piece, layout[piece.id]);
  });

  function persistPiece(piece: HudLayoutPiece) {
    const next = readLayout();
    next[piece.id] = currentPieceLayout(piece);
    saveLayout(next);
  }

  function enter() {
    active = true;
    targets.hud.classList.add("is-editing-ui");
    targets.pauseMenu.classList.add("is-hidden");
    targets.toolbar.classList.remove("is-hidden");
  }

  function exit() {
    active = false;
    dragState = null;
    resizeState = null;
    targets.hud.classList.remove("is-editing-ui");
    targets.toolbar.classList.add("is-hidden");
    targets.pauseMenu.classList.remove("is-hidden");
    targets.pieces.forEach((piece) => piece.element.classList.remove("is-ui-layout-dragging", "is-ui-layout-resizing"));
  }

  function reset() {
    clearLayout();
    targets.pieces.forEach((piece) => applyPieceLayout(piece, undefined));
  }

  targets.hud.addEventListener("pointerdown", (event) => {
    if (!active) return;
    const target = event.target as HTMLElement;
    const pieceElement = target.closest<HTMLElement>("[data-ui-layout-piece]");
    if (!pieceElement) return;
    const piece = targets.pieces.find((candidate) => candidate.element === pieceElement);
    if (!piece) return;

    const resizeHandle = target.closest<HTMLElement>("[data-ui-layout-resize]");
    if (resizeHandle && piece.resizable) {
      const rect = piece.element.getBoundingClientRect();
      const feed = piece.element.querySelector<HTMLElement>(".event-log");
      resizeState = {
        piece,
        startX: event.clientX,
        startY: event.clientY,
        startLeft: rect.left,
        startTop: rect.top,
        startWidth: rect.width,
        startFeedHeight: feed?.getBoundingClientRect().height ?? minCombatLogFeedHeight,
        nonFeedHeight: combatLogNonFeedHeight(piece, feed?.getBoundingClientRect().height ?? minCombatLogFeedHeight),
      };
      piece.element.classList.add("is-ui-layout-resizing");
    } else {
      const rect = piece.element.getBoundingClientRect();
      dragState = {
        piece,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
      };
      piece.element.classList.add("is-ui-layout-floating", "is-ui-layout-dragging");
      piece.element.style.setProperty("--ui-layout-width", `${rect.width}px`);
    }

    pieceElement.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }, true);

  targets.hud.addEventListener("pointermove", (event) => {
    if (!active) return;

    if (dragState) {
      const rect = dragState.piece.element.getBoundingClientRect();
      const next = clampRect(dragState.piece.element, event.clientX - dragState.offsetX, event.clientY - dragState.offsetY, rect.width, rect.height);
      dragState.piece.element.style.setProperty("--ui-layout-x", `${next.x}px`);
      dragState.piece.element.style.setProperty("--ui-layout-y", `${next.y}px`);
      event.preventDefault();
      return;
    }

    if (resizeState) {
      const width = Math.min(window.innerWidth - 20, Math.max(minCombatLogWidth, resizeState.startWidth + event.clientX - resizeState.startX));
      const maxFeedHeight = Math.max(
        minCombatLogFeedHeight,
        window.innerHeight - layoutMargin * 2 - resizeState.nonFeedHeight,
      );
      const feedHeight = Math.min(maxFeedHeight, Math.max(minCombatLogFeedHeight, resizeState.startFeedHeight + event.clientY - resizeState.startY));
      const totalHeight = resizeState.nonFeedHeight + feedHeight;
      const y = Math.max(layoutMargin, Math.min(resizeState.startTop, window.innerHeight - totalHeight - layoutMargin));
      resizeState.piece.element.classList.add("is-ui-layout-floating");
      resizeState.piece.element.style.setProperty("--ui-layout-width", `${width}px`);
      resizeState.piece.element.style.setProperty("--ui-layout-x", `${resizeState.startLeft}px`);
      resizeState.piece.element.style.setProperty("--ui-layout-y", `${y}px`);
      resizeState.piece.element.style.setProperty("--combat-log-feed-height", `${feedHeight}px`);
      event.preventDefault();
    }
  }, true);

  function finishGesture() {
    const piece = dragState?.piece ?? resizeState?.piece;
    if (!piece) return;
    piece.element.classList.remove("is-ui-layout-dragging", "is-ui-layout-resizing");
    persistPiece(piece);
    dragState = null;
    resizeState = null;
  }

  targets.hud.addEventListener("pointerup", finishGesture, true);
  targets.hud.addEventListener("pointercancel", finishGesture, true);
  targets.doneButton.addEventListener("click", exit);
  targets.resetButton.addEventListener("click", reset);
  window.addEventListener("resize", () => {
    const next = readLayout();
    targets.pieces.forEach((piece) => applyPieceLayout(piece, next[piece.id]));
  });

  return {
    enter,
    exit,
    reset,
    isActive: () => active,
  };
}

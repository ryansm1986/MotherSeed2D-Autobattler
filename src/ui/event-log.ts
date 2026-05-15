import type { GameEvent } from "../game/state";

const maxLogLines = 80;
const combatLogStorageKey = "motherseed.combatLog";

type CombatLogPlacement = {
  x: number;
  y: number;
  floating: boolean;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readPlacement(): CombatLogPlacement | null {
  try {
    const raw = window.localStorage.getItem(combatLogStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CombatLogPlacement>;
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number" || parsed.floating !== true) return null;
    return { x: parsed.x, y: parsed.y, floating: true };
  } catch {
    return null;
  }
}

function savePlacement(placement: CombatLogPlacement | null) {
  try {
    if (!placement) {
      window.localStorage.removeItem(combatLogStorageKey);
      return;
    }
    window.localStorage.setItem(combatLogStorageKey, JSON.stringify(placement));
  } catch {
    // Local storage can be disabled; the log still works without persistence.
  }
}

function clampPlacement(combatLog: HTMLElement, x: number, y: number) {
  const rect = combatLog.getBoundingClientRect();
  const margin = 10;
  const maxX = Math.max(margin, window.innerWidth - rect.width - margin);
  const maxY = Math.max(margin, window.innerHeight - rect.height - margin);
  return {
    x: Math.min(maxX, Math.max(margin, x)),
    y: Math.min(maxY, Math.max(margin, y)),
  };
}

function applyPlacement(combatLog: HTMLElement, placement: CombatLogPlacement | null) {
  if (!placement?.floating) {
    combatLog.classList.remove("is-floating");
    combatLog.style.removeProperty("--combat-log-x");
    combatLog.style.removeProperty("--combat-log-y");
    return;
  }

  const clamped = clampPlacement(combatLog, placement.x, placement.y);
  combatLog.classList.add("is-floating");
  combatLog.style.setProperty("--combat-log-x", `${clamped.x}px`);
  combatLog.style.setProperty("--combat-log-y", `${clamped.y}px`);
  savePlacement({ ...clamped, floating: true });
}

export function pushLog(eventLog: HTMLElement, message: string, detail: string) {
  const line = document.createElement("div");
  line.className = "event-log-line";
  line.innerHTML = detail
    ? `<strong>${escapeHtml(message)}</strong> <span>${escapeHtml(detail)}</span>`
    : `<strong>${escapeHtml(message)}</strong>`;
  eventLog.prepend(line);
  while (eventLog.children.length > maxLogLines) {
    eventLog.lastElementChild?.remove();
  }
}

export function pushGameEvents(eventLog: HTMLElement, events: readonly GameEvent[], playSound: (event: GameEvent) => void) {
  events.forEach((event) => {
    if (event.kind === "log") pushLog(eventLog, event.message, event.detail);
    if (event.kind === "sound") playSound(event);
  });
}

export function initializeCombatLog(combatLog: HTMLElement) {
  const eventLog = combatLog.querySelector<HTMLElement>(".event-log");
  const dragHandle = combatLog.querySelector<HTMLElement>("[data-combat-log-drag-handle]");
  const expandButton = combatLog.querySelector<HTMLButtonElement>("[data-combat-log-expand]");
  const resetButton = combatLog.querySelector<HTMLButtonElement>("[data-combat-log-reset]");
  const clearButton = combatLog.querySelector<HTMLButtonElement>("[data-combat-log-clear]");

  applyPlacement(combatLog, readPlacement());

  expandButton?.addEventListener("click", () => {
    const expanded = combatLog.classList.toggle("is-expanded");
    expandButton.setAttribute("aria-expanded", String(expanded));
    expandButton.setAttribute("aria-label", expanded ? "Collapse combat log" : "Expand combat log");
    expandButton.textContent = expanded ? "-" : "+";
    applyPlacement(combatLog, readPlacement());
  });

  resetButton?.addEventListener("click", () => {
    savePlacement(null);
    applyPlacement(combatLog, null);
  });

  clearButton?.addEventListener("click", () => {
    if (eventLog) eventLog.innerHTML = "";
  });

  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let isDragging = false;

  dragHandle?.addEventListener("pointerdown", (event) => {
    if ((event.target as HTMLElement).closest("button")) return;
    const rect = combatLog.getBoundingClientRect();
    isDragging = true;
    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;
    combatLog.classList.add("is-dragging", "is-floating");
    dragHandle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  dragHandle?.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    const next = clampPlacement(combatLog, event.clientX - dragOffsetX, event.clientY - dragOffsetY);
    combatLog.style.setProperty("--combat-log-x", `${next.x}px`);
    combatLog.style.setProperty("--combat-log-y", `${next.y}px`);
    event.preventDefault();
  });

  function finishDrag() {
    if (!isDragging) return;
    isDragging = false;
    combatLog.classList.remove("is-dragging");
    const rect = combatLog.getBoundingClientRect();
    savePlacement({ x: rect.left, y: rect.top, floating: true });
  }

  dragHandle?.addEventListener("pointerup", finishDrag);
  dragHandle?.addEventListener("pointercancel", finishDrag);
  window.addEventListener("resize", () => applyPlacement(combatLog, readPlacement()));
}

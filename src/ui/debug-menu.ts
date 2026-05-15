import type { DebugEncounterOption } from "../game/debug";

export type DebugMenuTargets = {
  encounterSelect: HTMLSelectElement;
  status: HTMLElement;
};

export function applyDebugEncounterOptions(targets: DebugMenuTargets, options: DebugEncounterOption[]) {
  targets.encounterSelect.replaceChildren(
    ...options.map((option) => {
      const element = document.createElement("option");
      element.value = String(option.encounterIndex);
      element.textContent = option.label;
      element.title = option.detail;
      return element;
    }),
  );
}

export function setDebugMenuStatus(targets: DebugMenuTargets, message: string) {
  targets.status.textContent = message;
}

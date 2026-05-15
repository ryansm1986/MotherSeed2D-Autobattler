export type PauseMenuTargets = {
  pauseTabs: HTMLButtonElement[];
  pausePanels: HTMLElement[];
  pauseKicker: HTMLElement;
  pauseTitle: HTMLElement;
  saveGameButton: HTMLButtonElement;
  editUiButton: HTMLButtonElement;
  resumeButton: HTMLButtonElement;
  quitToTitleButton: HTMLButtonElement;
};

export function initializePauseTabs(targets: PauseMenuTargets, onSelect: (tabName: string) => void) {
  targets.pauseTabs.forEach((tab) => {
    tab.setAttribute("role", "tab");
    tab.addEventListener("click", () => onSelect(tab.dataset.pauseTab ?? "controls"));
  });
}

export function selectPauseTab(targets: PauseMenuTargets, tabName: string) {
  targets.pauseTabs.forEach((tab) => {
    const active = tab.dataset.pauseTab === tabName;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  targets.pausePanels.forEach((panel) => {
    panel.classList.toggle("is-hidden", panel.dataset.pausePanel !== tabName);
  });
}

export function setPauseMenuCopy(targets: PauseMenuTargets, source: "gameplay" | "title") {
  const isTitleMenu = source === "title";
  targets.pauseKicker.textContent = isTitleMenu ? "Motherseed" : "Grove suspended";
  targets.pauseTitle.textContent = isTitleMenu ? "Menu" : "Paused";
  targets.resumeButton.textContent = isTitleMenu ? "Back" : "Resume";
  targets.saveGameButton.classList.toggle("is-hidden", isTitleMenu);
  targets.editUiButton.classList.toggle("is-hidden", isTitleMenu);
  targets.quitToTitleButton.classList.toggle("is-hidden", isTitleMenu);
  targets.pauseTabs
    .find((tab) => tab.dataset.pauseTab === "debug")
    ?.classList.toggle("is-hidden", isTitleMenu);
  targets.pauseTabs
    .find((tab) => tab.dataset.pauseTab === "display")
    ?.classList.toggle("is-hidden", isTitleMenu);
}

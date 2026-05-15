export type SaveToastController = {
  showSaving: () => void;
  showComplete: () => void;
  showFailed: () => void;
};

export function createSaveToastController(saveToast: HTMLElement): SaveToastController {
  let resultTimer = 0;
  let hideTimer = 0;

  function clearTimers() {
    window.clearTimeout(resultTimer);
    window.clearTimeout(hideTimer);
    resultTimer = 0;
    hideTimer = 0;
  }

  function show(message: string, tone: "saving" | "complete" | "failed") {
    saveToast.textContent = message;
    saveToast.dataset.saveToastTone = tone;
    saveToast.classList.remove("is-hidden");
    saveToast.classList.remove("is-complete", "is-failed", "is-saving");
    saveToast.classList.add(`is-${tone}`);
  }

  function showResult(message: string, tone: "complete" | "failed") {
    resultTimer = window.setTimeout(() => {
      show(message, tone);
      hideTimer = window.setTimeout(() => {
        saveToast.classList.add("is-hidden");
      }, 1450);
    }, 320);
  }

  return {
    showSaving: () => {
      clearTimers();
      show("Saving...", "saving");
    },
    showComplete: () => {
      showResult("Save complete", "complete");
    },
    showFailed: () => {
      showResult("Save failed", "failed");
    },
  };
}

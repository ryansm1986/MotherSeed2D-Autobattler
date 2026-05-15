export type TitleIntroController = {
  start: () => Promise<void>;
  reset: () => void;
};

type TitleIntroElements = {
  titleScreen: HTMLElement;
  titleBackgroundImage: HTMLImageElement;
  titleLogoImage: HTMLImageElement;
};

const TITLE_LOGO_DELAY_MS = 1000;
const TITLE_MENU_DELAY_MS = 3000;

function waitForImage(image: HTMLImageElement) {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve();
  return image.decode().catch(() => undefined);
}

export function createTitleIntroController(elements: TitleIntroElements): TitleIntroController {
  let introRun = 0;
  let logoTimer: number | null = null;
  let menuTimer: number | null = null;

  function clearLogoTimer() {
    if (logoTimer === null) return;
    window.clearTimeout(logoTimer);
    logoTimer = null;
  }

  function clearMenuTimer() {
    if (menuTimer === null) return;
    window.clearTimeout(menuTimer);
    menuTimer = null;
  }

  function reset() {
    introRun += 1;
    clearLogoTimer();
    clearMenuTimer();
    elements.titleScreen.classList.remove("is-title-intro-ready", "is-title-menu-ready");
  }

  async function start() {
    reset();
    const currentRun = introRun;
    await Promise.all([
      waitForImage(elements.titleBackgroundImage),
      waitForImage(elements.titleLogoImage),
    ]);
    if (currentRun !== introRun) return;

    logoTimer = window.setTimeout(() => {
      if (currentRun !== introRun) return;
      elements.titleScreen.classList.add("is-title-intro-ready");
      menuTimer = window.setTimeout(() => {
        if (currentRun === introRun) elements.titleScreen.classList.add("is-title-menu-ready");
      }, TITLE_MENU_DELAY_MS);
    }, TITLE_LOGO_DELAY_MS);
  }

  return { start, reset };
}

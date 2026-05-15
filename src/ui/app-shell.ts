import titleImageUrl from "../../assets/Title.png?url";
import titleNoTextAnimationUrl from "../../assets/ui/title/background.webp?url";
import titleTextAnimationUrl from "../../assets/ui/title/logo.webp?url";
import inventoryPanelUrl from "../../assets/ui/inventory-drawer/panel/background-fill.png?url";
import inventoryBorderUrl from "../../assets/ui/inventory-drawer/panel/border-frame.png?url";
import inventorySlotUrl from "../../assets/ui/inventory-drawer/equipment/2.9_INVENTORY_CELL.png?url";
import inventoryHeaderUrl from "../../assets/ui/inventory-drawer/title-divider-glow/1.2_INVENTORY_HEADER.png?url";
import inventoryCloseUrl from "../../assets/ui/inventory-drawer/panel/close.png?url";
import inventoryDividerUrl from "../../assets/ui/inventory-drawer/title-divider-glow/1.6_SECTION_DIVIDER.png?url";
import inventoryGlowUrl from "../../assets/ui/inventory-drawer/title-divider-glow/1.9_AMBIENT_GLOW_OVERLAY.png?url";
import branchLatticeBackgroundUrl from "../../assets/ui/branch-lattice-background.png?url";
import branchLatticeCloseUrl from "../../assets/ui/branch-lattice-close/sheet-transparent.png?url";

export type AppShell = {
  shell: HTMLDivElement;
  titleScreen: HTMLElement;
  titleBackgroundImage: HTMLImageElement;
  titleLogoImage: HTMLImageElement;
  startButton: HTMLButtonElement;
  titleLoadButton: HTMLButtonElement;
  titleControlsButton: HTMLButtonElement;
  titleSoundButton: HTMLButtonElement;
  characterSelect: HTMLElement;
  characterGrid: HTMLDivElement;
  characterDetail: HTMLElement;
  backButton: HTMLButtonElement;
  continueButton: HTMLButtonElement;
  loadingScreen: HTMLElement;
  saveToast: HTMLElement;
  codgerTutorial: HTMLElement;
  codgerTutorialTitle: HTMLElement;
  codgerTutorialCopy: HTMLElement;
  codgerTutorialHint: HTMLElement;
  codgerTutorialPrimaryButton: HTMLButtonElement;
  codgerTutorialSecondaryButton: HTMLButtonElement;
  hud: HTMLDivElement;
  playerPanel: HTMLDivElement;
  targetPanel: HTMLDivElement;
  abilityPanel: HTMLDivElement;
  combatLog: HTMLElement;
  eventLog: HTMLDivElement;
  inventoryMenu: HTMLElement;
  inventoryFrame: HTMLDivElement;
  inventoryCloseButton: HTMLButtonElement;
  inventoryHero: HTMLElement;
  inventoryEquipment: HTMLElement;
  inventoryPack: HTMLElement;
  lootMenu: HTMLElement;
  lootFrame: HTMLDivElement;
  lootCloseButton: HTMLButtonElement;
  lootSource: HTMLElement;
  lootGrid: HTMLElement;
  lootTakeAllButton: HTMLButtonElement;
  branchLatticeMenu: HTMLElement;
  branchLatticeFrame: HTMLDivElement;
  branchLatticeCloseButton: HTMLButtonElement;
  branchLatticeAbilities: HTMLElement;
  branchLatticeModifiers: HTMLElement;
  branchLatticeSockets: HTMLElement;
  branchLatticeDetails: HTMLElement;
  pauseMenu: HTMLElement;
  pauseFrame: HTMLDivElement;
  pauseKicker: HTMLElement;
  pauseTitle: HTMLElement;
  saveGameButton: HTMLButtonElement;
  editUiButton: HTMLButtonElement;
  resumeButton: HTMLButtonElement;
  quitToTitleButton: HTMLButtonElement;
  pauseTabs: HTMLButtonElement[];
  pausePanels: HTMLElement[];
  debugEncounterSelect: HTMLSelectElement;
  debugTeleportButton: HTMLButtonElement;
  debugStarterGearButton: HTMLButtonElement;
  debugStatus: HTMLElement;
  displayHealthBarsToggle: HTMLInputElement;
  musicVolumeInput: HTMLInputElement;
  sfxVolumeInput: HTMLInputElement;
  musicVolumeValue: HTMLElement;
  sfxVolumeValue: HTMLElement;
  mobileControls: HTMLElement;
  mobileMovePad: HTMLElement;
  mobileMoveThumb: HTMLElement;
  mobileDodgeButton: HTMLButtonElement;
  mobileTargetButton: HTMLButtonElement;
  mobileSpecialButtons: HTMLButtonElement[];
  mobileEquipButton: HTMLButtonElement;
  mobileInventoryButton: HTMLButtonElement;
  mobileBranchLatticeButton: HTMLButtonElement;
  mobilePauseButton: HTMLButtonElement;
  mobileRotatePrompt: HTMLElement;
  hudEditToolbar: HTMLElement;
  hudEditDoneButton: HTMLButtonElement;
  hudEditResetButton: HTMLButtonElement;
  cursor: HTMLDivElement;
  canvas: HTMLCanvasElement;
};

export function createAppShell(): AppShell {
  const app = document.querySelector<HTMLDivElement>("#app");

  if (!app) {
    throw new Error("Missing #app root");
  }

  app.innerHTML = `
    <div class="game-shell"></div>
    <section class="title-screen" style="--title-image: url('${titleNoTextAnimationUrl}')">
      <img class="title-background-preload" src="${titleNoTextAnimationUrl}" alt="" aria-hidden="true" decoding="async" fetchpriority="high" />
      <img class="title-logo-animation" src="${titleTextAnimationUrl}" alt="MotherSeed" decoding="async" fetchpriority="high" />
      <nav class="title-menu" aria-label="Main menu">
        <button class="title-menu-option start-button" type="button">Start</button>
        <button class="title-menu-option title-load-button" type="button">Load</button>
        <button class="title-menu-option title-controls-button" type="button">Controls</button>
        <button class="title-menu-option title-sound-button" type="button">Sound</button>
      </nav>
    </section>
    <section class="character-select is-hidden" aria-labelledby="character-select-title" style="--title-image: url('${titleImageUrl}')">
      <div class="select-frame">
        <div class="select-header">
          <div>
            <p class="select-kicker">Choose your seedbound path</p>
            <h1 id="character-select-title">Character Select</h1>
          </div>
          <button class="menu-button back-button" type="button">Back</button>
        </div>
        <div class="character-layout">
          <div class="character-grid" id="character-grid"></div>
          <aside class="character-detail" id="character-detail"></aside>
        </div>
        <div class="select-footer">
          <div class="select-hint">Five paths. Three awaken in this build.</div>
          <button class="menu-button continue-button" type="button">Enter Grove</button>
        </div>
      </div>
    </section>
    <section class="loading-screen is-hidden" aria-live="polite" aria-label="Loading">
      <div class="loading-frame">
        <p>Loading</p>
        <strong>Root chamber waking</strong>
        <div class="loading-bar"><span></span></div>
      </div>
    </section>
    <div class="save-toast is-hidden" role="status" aria-live="polite">Saving...</div>
    <section class="codger-tutorial is-hidden" aria-live="polite" aria-label="Codger tutorial">
      <div class="codger-tutorial-frame">
        <p class="codger-tutorial-kicker">Codger</p>
        <h2 id="codger-tutorial-title">Mother Tree Trial</h2>
        <p id="codger-tutorial-copy"></p>
        <p class="codger-tutorial-hint" id="codger-tutorial-hint"></p>
        <div class="codger-tutorial-actions">
          <button class="menu-button codger-tutorial-primary" type="button">Continue</button>
          <button class="menu-button codger-tutorial-secondary" type="button">Skip Tutorial</button>
        </div>
      </div>
    </section>
    <div class="hud is-hidden">
      <div class="hud-top">
        <section class="hud-panel vitals-panel" id="player-panel" data-ui-layout-piece="player-panel"></section>
        <section class="hud-panel target-panel" id="target-panel" data-ui-layout-piece="target-panel"></section>
      </div>
      <div class="hud-bottom">
        <section class="combat-log" id="combat-log" aria-label="Combat log" data-ui-layout-piece="combat-log">
          <header class="combat-log-header" data-combat-log-drag-handle>
            <span>Combat Log</span>
            <div class="combat-log-actions">
              <button class="combat-log-button" type="button" data-combat-log-expand aria-label="Expand combat log" aria-expanded="false">+</button>
              <button class="combat-log-button" type="button" data-combat-log-reset aria-label="Reset combat log position">Reset</button>
              <button class="combat-log-button" type="button" data-combat-log-clear aria-label="Clear combat log">Clear</button>
            </div>
          </header>
          <div class="event-log" id="event-log" role="log" aria-live="polite" aria-relevant="additions"></div>
          <span class="combat-log-resize-handle" data-ui-layout-resize aria-hidden="true"></span>
        </section>
        <section class="action-bar" data-ui-layout-piece="skill-bar">
          <div class="ability-row" id="abilities"></div>
        </section>
      </div>
    </div>
    <section class="inventory-menu is-hidden" role="dialog" aria-modal="false" aria-labelledby="inventory-title" style="--inventory-art: url('${inventoryPanelUrl}'); --inventory-border-art: url('${inventoryBorderUrl}'); --inventory-slot-art: url('${inventorySlotUrl}'); --inventory-header-art: url('${inventoryHeaderUrl}'); --inventory-close-art: url('${inventoryCloseUrl}'); --inventory-divider-art: url('${inventoryDividerUrl}'); --inventory-glow-art: url('${inventoryGlowUrl}')">
      <div class="inventory-frame" tabindex="-1">
        <header class="inventory-header">
          <div>
            <p class="inventory-kicker">Motherseed reliquary</p>
            <h1 id="inventory-title">Inventory</h1>
          </div>
          <button class="inventory-close-button" type="button" aria-label="Close inventory">Close</button>
        </header>
        <div class="inventory-content">
          <aside class="inventory-hero" id="inventory-hero"></aside>
          <section class="inventory-equipment" id="inventory-equipment" aria-label="Equipment"></section>
          <section class="inventory-pack" id="inventory-pack" aria-label="Backpack"></section>
        </div>
      </div>
    </section>
    <section class="loot-menu is-hidden" role="dialog" aria-modal="false" aria-labelledby="loot-title" style="--inventory-art: url('${inventoryPanelUrl}'); --inventory-border-art: url('${inventoryBorderUrl}'); --inventory-slot-art: url('${inventorySlotUrl}'); --inventory-header-art: url('${inventoryHeaderUrl}'); --inventory-close-art: url('${inventoryCloseUrl}'); --inventory-divider-art: url('${inventoryDividerUrl}'); --inventory-glow-art: url('${inventoryGlowUrl}')">
      <div class="loot-frame" tabindex="-1">
        <header class="loot-header">
          <h1 id="loot-title">Loot</h1>
          <button class="loot-close-button" type="button" aria-label="Close loot">Close</button>
        </header>
        <p class="loot-source" id="loot-source">Loot Cache</p>
        <div class="loot-content">
          <section class="loot-grid-panel" id="loot-grid-panel" aria-label="Loot items"></section>
        </div>
        <footer class="loot-footer">
          <button class="loot-take-all-button" type="button">Take All</button>
        </footer>
      </div>
    </section>
    <section class="branch-lattice-menu is-hidden" role="dialog" aria-modal="false" aria-labelledby="branch-lattice-title" style="--branch-lattice-art: url('${branchLatticeBackgroundUrl}')">
      <div class="branch-lattice-frame" tabindex="-1">
        <header class="branch-lattice-header">
          <div class="branch-title-ornament"></div>
          <h1 id="branch-lattice-title">Branch Lattice</h1>
          <button class="branch-lattice-close-button" type="button" aria-label="Close Branch Lattice" style="--branch-lattice-close-art: url('${branchLatticeCloseUrl}')">
            <span class="branch-lattice-close-label">Close</span>
          </button>
        </header>
        <div class="branch-lattice-content">
          <aside class="branch-panel branch-abilities-panel" aria-label="Frame auto abilities">
            <h2>Auto Abilities</h2>
            <div class="branch-ability-list" id="branch-ability-list"></div>
          </aside>
          <section class="branch-lattice-column" aria-label="Lattice sockets">
            <div class="branch-vines" id="branch-sockets"></div>
          </section>
          <aside class="branch-panel branch-modifiers-panel" aria-label="Frame modifiers">
            <h2>Modifiers</h2>
            <div class="branch-modifier-list" id="branch-modifier-list"></div>
          </aside>
        </div>
        <aside class="branch-lattice-details" id="branch-lattice-details"></aside>
        <footer class="branch-lattice-footer">
          <div><kbd>Mouse</kbd><span>Slot option</span></div>
          <div><kbd>R</kbd><span>Remove modifier</span></div>
          <div><kbd>C</kbd><span>Clear branch</span></div>
          <div><kbd>P</kbd><span>Preview</span></div>
          <div><kbd>Esc</kbd><span>Back</span></div>
        </footer>
      </div>
    </section>
    <section class="pause-menu is-hidden" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <div class="pause-frame" tabindex="-1">
        <header class="pause-header">
          <div>
            <p class="pause-kicker">Grove suspended</p>
            <h1 id="pause-title">Paused</h1>
          </div>
          <div class="pause-header-actions">
            <button class="menu-button save-game-button" type="button">Save Game</button>
            <button class="menu-button edit-ui-button" type="button">Edit UI</button>
            <button class="menu-button quit-to-title-button" type="button">Quit to Main Menu</button>
            <button class="menu-button resume-button" type="button">Resume</button>
          </div>
        </header>
        <div class="pause-layout">
          <nav class="pause-tabs" aria-label="Pause menu">
            <button class="pause-tab is-active" type="button" data-pause-tab="controls">Controls</button>
            <button class="pause-tab" type="button" data-pause-tab="display">Display</button>
            <button class="pause-tab" type="button" data-pause-tab="sound">Sound</button>
            <button class="pause-tab" type="button" data-pause-tab="debug">Debug</button>
          </nav>
          <div class="pause-content">
            <section class="pause-panel" data-pause-panel="controls" aria-label="Controls">
              <div class="control-list desktop-control-list">
                <div><kbd>WASD</kbd><span>Move</span></div>
                <div><kbd>Shift</kbd><span>Sprint</span></div>
                <div><kbd>Space</kbd><span>Dodge</span></div>
                <div><kbd>Mouse</kbd><span>Target</span></div>
                <div><kbd>Tab</kbd><span>Lock target</span></div>
                <div><kbd>1</kbd><span>First special</span></div>
                <div><kbd>2</kbd><span>Second special</span></div>
                <div><kbd>3</kbd><span>Third special</span></div>
                <div><kbd>E</kbd><span>Talk / loot</span></div>
                <div><kbd>I</kbd><span>Inventory</span></div>
                <div><kbd>O</kbd><span>Branch Lattice</span></div>
                <div><kbd>Esc</kbd><span>Pause</span></div>
              </div>
              <div class="control-list mobile-control-list" aria-label="Phone controls">
                <div><kbd>Pad</kbd><span>Move</span></div>
                <div><kbd>Edge</kbd><span>Sprint</span></div>
                <div><kbd>Dodge</kbd><span>Roll through danger</span></div>
                <div><kbd>Target</kbd><span>Lock nearest enemy</span></div>
                <div><kbd>1-3</kbd><span>Specials</span></div>
                <div><kbd>Talk</kbd><span>Talk / loot</span></div>
                <div><kbd>Bag</kbd><span>Inventory</span></div>
                <div><kbd>Menu</kbd><span>Pause</span></div>
              </div>
            </section>
            <section class="pause-panel is-hidden" data-pause-panel="sound" aria-label="Sound">
              <div class="sound-controls">
                <label class="sound-control" for="music-volume">
                  <span>Music</span>
                  <input id="music-volume" type="range" min="0" max="100" step="1" />
                  <strong id="music-volume-value">80%</strong>
                </label>
                <label class="sound-control" for="sfx-volume">
                  <span>Sound effects</span>
                  <input id="sfx-volume" type="range" min="0" max="100" step="1" />
                  <strong id="sfx-volume-value">80%</strong>
                </label>
              </div>
            </section>
            <section class="pause-panel is-hidden" data-pause-panel="display" aria-label="Display">
              <div class="display-controls">
                <label class="display-toggle" for="display-party-health-bars">
                  <span>
                    <strong>Character Health Bars</strong>
                    <em>Show party health above characters in play.</em>
                  </span>
                  <input id="display-party-health-bars" class="display-health-bars-toggle" type="checkbox" />
                </label>
              </div>
            </section>
            <section class="pause-panel is-hidden" data-pause-panel="debug" aria-label="Debug">
              <div class="debug-controls">
                <label class="debug-control" for="debug-encounter-select">
                  <span>Encounter</span>
                  <select id="debug-encounter-select" class="debug-encounter-select"></select>
                </label>
                <div class="debug-action-row">
                  <button class="menu-button debug-teleport-button" type="button">Teleport</button>
                  <button class="menu-button debug-starter-gear-button" type="button">Full Starter Gear</button>
                </div>
                <p class="debug-status" aria-live="polite"></p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
    <div class="hud-edit-toolbar is-hidden" role="dialog" aria-label="HUD edit mode">
      <strong>HUD Edit</strong>
      <span>Drag panels. Resize the combat log from its lower-right grip.</span>
      <button class="hud-edit-button hud-edit-reset-button" type="button">Reset Layout</button>
      <button class="hud-edit-button hud-edit-done-button" type="button">Done</button>
    </div>
    <section class="mobile-controls" aria-label="Phone gameplay controls">
      <div class="mobile-top-actions" aria-label="Phone menu controls">
        <button class="mobile-button mobile-inventory-button" type="button" aria-label="Open inventory">Bag</button>
        <button class="mobile-button mobile-branch-lattice-button" type="button" aria-label="Open Branch Lattice">Lattice</button>
        <button class="mobile-button mobile-pause-button" type="button" aria-label="Pause game">Menu</button>
      </div>
      <div class="mobile-move-pad" role="application" aria-label="Move">
        <div class="mobile-move-ring">
          <div class="mobile-move-thumb"></div>
        </div>
        <span>Move</span>
      </div>
      <div class="mobile-action-cluster" aria-label="Phone action controls">
        <button class="mobile-button mobile-target-button" type="button" aria-label="Lock target">Target</button>
        <button class="mobile-button mobile-dodge-button" type="button" aria-label="Dodge">Dodge</button>
        <button class="mobile-button mobile-special-button" type="button" data-mobile-special="0" aria-label="Use special 1">1</button>
        <button class="mobile-button mobile-special-button" type="button" data-mobile-special="1" aria-label="Use special 2">2</button>
        <button class="mobile-button mobile-special-button" type="button" data-mobile-special="2" aria-label="Use special 3">3</button>
        <button class="mobile-button mobile-equip-button" type="button" aria-label="Talk or loot">Talk</button>
      </div>
    </section>
    <section class="mobile-rotate-prompt" aria-label="Rotate phone">
      <div>
        <strong>Rotate phone</strong>
        <span>Landscape mode keeps the grove and controls playable.</span>
      </div>
    </section>
  `;

  const shell = document.querySelector<HTMLDivElement>(".game-shell")!;
  const canvas = document.createElement("canvas");
  const cursor = document.createElement("div");
  cursor.className = "game-cursor";
  cursor.setAttribute("aria-hidden", "true");
  shell.appendChild(canvas);
  app.appendChild(cursor);

  return {
    shell,
    titleScreen: document.querySelector<HTMLElement>(".title-screen")!,
    titleBackgroundImage: document.querySelector<HTMLImageElement>(".title-background-preload")!,
    titleLogoImage: document.querySelector<HTMLImageElement>(".title-logo-animation")!,
    startButton: document.querySelector<HTMLButtonElement>(".start-button")!,
    titleLoadButton: document.querySelector<HTMLButtonElement>(".title-load-button")!,
    titleControlsButton: document.querySelector<HTMLButtonElement>(".title-controls-button")!,
    titleSoundButton: document.querySelector<HTMLButtonElement>(".title-sound-button")!,
    characterSelect: document.querySelector<HTMLElement>(".character-select")!,
    characterGrid: document.querySelector<HTMLDivElement>("#character-grid")!,
    characterDetail: document.querySelector<HTMLElement>("#character-detail")!,
    backButton: document.querySelector<HTMLButtonElement>(".back-button")!,
    continueButton: document.querySelector<HTMLButtonElement>(".continue-button")!,
    loadingScreen: document.querySelector<HTMLElement>(".loading-screen")!,
    saveToast: document.querySelector<HTMLElement>(".save-toast")!,
    codgerTutorial: document.querySelector<HTMLElement>(".codger-tutorial")!,
    codgerTutorialTitle: document.querySelector<HTMLElement>("#codger-tutorial-title")!,
    codgerTutorialCopy: document.querySelector<HTMLElement>("#codger-tutorial-copy")!,
    codgerTutorialHint: document.querySelector<HTMLElement>("#codger-tutorial-hint")!,
    codgerTutorialPrimaryButton: document.querySelector<HTMLButtonElement>(".codger-tutorial-primary")!,
    codgerTutorialSecondaryButton: document.querySelector<HTMLButtonElement>(".codger-tutorial-secondary")!,
    hud: document.querySelector<HTMLDivElement>(".hud")!,
    playerPanel: document.querySelector<HTMLDivElement>("#player-panel")!,
    targetPanel: document.querySelector<HTMLDivElement>("#target-panel")!,
    abilityPanel: document.querySelector<HTMLDivElement>("#abilities")!,
    combatLog: document.querySelector<HTMLElement>("#combat-log")!,
    eventLog: document.querySelector<HTMLDivElement>("#event-log")!,
    inventoryMenu: document.querySelector<HTMLElement>(".inventory-menu")!,
    inventoryFrame: document.querySelector<HTMLDivElement>(".inventory-frame")!,
    inventoryCloseButton: document.querySelector<HTMLButtonElement>(".inventory-close-button")!,
    inventoryHero: document.querySelector<HTMLElement>("#inventory-hero")!,
    inventoryEquipment: document.querySelector<HTMLElement>("#inventory-equipment")!,
    inventoryPack: document.querySelector<HTMLElement>("#inventory-pack")!,
    lootMenu: document.querySelector<HTMLElement>(".loot-menu")!,
    lootFrame: document.querySelector<HTMLDivElement>(".loot-frame")!,
    lootCloseButton: document.querySelector<HTMLButtonElement>(".loot-close-button")!,
    lootSource: document.querySelector<HTMLElement>("#loot-source")!,
    lootGrid: document.querySelector<HTMLElement>("#loot-grid-panel")!,
    lootTakeAllButton: document.querySelector<HTMLButtonElement>(".loot-take-all-button")!,
    branchLatticeMenu: document.querySelector<HTMLElement>(".branch-lattice-menu")!,
    branchLatticeFrame: document.querySelector<HTMLDivElement>(".branch-lattice-frame")!,
    branchLatticeCloseButton: document.querySelector<HTMLButtonElement>(".branch-lattice-close-button")!,
    branchLatticeAbilities: document.querySelector<HTMLElement>("#branch-ability-list")!,
    branchLatticeModifiers: document.querySelector<HTMLElement>("#branch-modifier-list")!,
    branchLatticeSockets: document.querySelector<HTMLElement>("#branch-sockets")!,
    branchLatticeDetails: document.querySelector<HTMLElement>("#branch-lattice-details")!,
    pauseMenu: document.querySelector<HTMLElement>(".pause-menu")!,
    pauseFrame: document.querySelector<HTMLDivElement>(".pause-frame")!,
    pauseKicker: document.querySelector<HTMLElement>(".pause-kicker")!,
    pauseTitle: document.querySelector<HTMLElement>("#pause-title")!,
    saveGameButton: document.querySelector<HTMLButtonElement>(".save-game-button")!,
    editUiButton: document.querySelector<HTMLButtonElement>(".edit-ui-button")!,
    resumeButton: document.querySelector<HTMLButtonElement>(".resume-button")!,
    quitToTitleButton: document.querySelector<HTMLButtonElement>(".quit-to-title-button")!,
    pauseTabs: Array.from(document.querySelectorAll<HTMLButtonElement>(".pause-tab")),
    pausePanels: Array.from(document.querySelectorAll<HTMLElement>(".pause-panel")),
    debugEncounterSelect: document.querySelector<HTMLSelectElement>(".debug-encounter-select")!,
    debugTeleportButton: document.querySelector<HTMLButtonElement>(".debug-teleport-button")!,
    debugStarterGearButton: document.querySelector<HTMLButtonElement>(".debug-starter-gear-button")!,
    debugStatus: document.querySelector<HTMLElement>(".debug-status")!,
    displayHealthBarsToggle: document.querySelector<HTMLInputElement>(".display-health-bars-toggle")!,
    musicVolumeInput: document.querySelector<HTMLInputElement>("#music-volume")!,
    sfxVolumeInput: document.querySelector<HTMLInputElement>("#sfx-volume")!,
    musicVolumeValue: document.querySelector<HTMLElement>("#music-volume-value")!,
    sfxVolumeValue: document.querySelector<HTMLElement>("#sfx-volume-value")!,
    mobileControls: document.querySelector<HTMLElement>(".mobile-controls")!,
    mobileMovePad: document.querySelector<HTMLElement>(".mobile-move-pad")!,
    mobileMoveThumb: document.querySelector<HTMLElement>(".mobile-move-thumb")!,
    mobileDodgeButton: document.querySelector<HTMLButtonElement>(".mobile-dodge-button")!,
    mobileTargetButton: document.querySelector<HTMLButtonElement>(".mobile-target-button")!,
    mobileSpecialButtons: Array.from(document.querySelectorAll<HTMLButtonElement>(".mobile-special-button")),
    mobileEquipButton: document.querySelector<HTMLButtonElement>(".mobile-equip-button")!,
    mobileInventoryButton: document.querySelector<HTMLButtonElement>(".mobile-inventory-button")!,
    mobileBranchLatticeButton: document.querySelector<HTMLButtonElement>(".mobile-branch-lattice-button")!,
    mobilePauseButton: document.querySelector<HTMLButtonElement>(".mobile-pause-button")!,
    mobileRotatePrompt: document.querySelector<HTMLElement>(".mobile-rotate-prompt")!,
    hudEditToolbar: document.querySelector<HTMLElement>(".hud-edit-toolbar")!,
    hudEditDoneButton: document.querySelector<HTMLButtonElement>(".hud-edit-done-button")!,
    hudEditResetButton: document.querySelector<HTMLButtonElement>(".hud-edit-reset-button")!,
    cursor,
    canvas,
  };
}

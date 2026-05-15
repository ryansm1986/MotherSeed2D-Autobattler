const displaySettingsKey = "motherseed.displaySettings";

export type DisplaySettings = {
  showPartyHealthBars: boolean;
};

export function loadDisplaySettings(): DisplaySettings {
  try {
    const raw = window.localStorage.getItem(displaySettingsKey);
    if (!raw) return { showPartyHealthBars: true };
    const parsed = JSON.parse(raw) as Partial<DisplaySettings>;
    return {
      showPartyHealthBars: parsed.showPartyHealthBars !== false,
    };
  } catch {
    return { showPartyHealthBars: true };
  }
}

export function saveDisplaySettings(settings: DisplaySettings) {
  try {
    window.localStorage.setItem(displaySettingsKey, JSON.stringify(settings));
  } catch {
    // Display settings are nice-to-have; failing storage should not interrupt play.
  }
}

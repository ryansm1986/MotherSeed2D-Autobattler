export type GameplayAction =
  | "target-next"
  | "special-1"
  | "special-2"
  | "special-3"
  | "equip"
  | "confirm"
  | "cancel"
  | "pause";

export type InputState = {
  pressedActions: Set<GameplayAction>;
};

const gameplayKeyBindings: Record<string, GameplayAction> = {
  Tab: "target-next",
  Digit1: "special-1",
  Digit2: "special-2",
  Digit3: "special-3",
  KeyE: "equip",
  Enter: "confirm",
  Escape: "pause",
};

export function gameplayActionForCode(code: string): GameplayAction | null {
  return gameplayKeyBindings[code] ?? null;
}

export function createInputState(): InputState {
  return {
    pressedActions: new Set<GameplayAction>(),
  };
}

export function clearInputState(input: InputState) {
  input.pressedActions.clear();
}

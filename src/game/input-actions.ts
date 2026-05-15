import type { Vec2 } from "./types";

export type GameplayAction =
  | "move-up"
  | "move-down"
  | "move-left"
  | "move-right"
  | "sprint"
  | "dodge"
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
  sprintExhaustedUntilRelease: boolean;
};

const gameplayKeyBindings: Record<string, GameplayAction> = {
  KeyW: "move-up",
  KeyS: "move-down",
  KeyA: "move-left",
  KeyD: "move-right",
  ShiftLeft: "sprint",
  ShiftRight: "sprint",
  Space: "dodge",
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

export function movementFromActions(actions: ReadonlySet<GameplayAction>): Vec2 {
  const input = { x: 0, y: 0 };
  if (actions.has("move-up")) input.y -= 1;
  if (actions.has("move-down")) input.y += 1;
  if (actions.has("move-left")) input.x -= 1;
  if (actions.has("move-right")) input.x += 1;
  return input;
}

export function createInputState(): InputState {
  return {
    pressedActions: new Set<GameplayAction>(),
    sprintExhaustedUntilRelease: false,
  };
}

export function clearInputState(input: InputState) {
  input.pressedActions.clear();
  input.sprintExhaustedUntilRelease = false;
}

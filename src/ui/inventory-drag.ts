export const inventoryDragMime = "application/x-motherseed-item";

export type InventoryDropPayload =
  | { kind: "inventory"; itemId: string; width: number; height: number }
  | { kind: "equipment"; equipSlot: string; width: number; height: number }
  | { kind: "loot"; width: number; height: number };

let activeInventoryDragPayload: InventoryDropPayload | null = null;

export function setInventoryDragPayload(payload: InventoryDropPayload) {
  activeInventoryDragPayload = payload;
}

export function clearInventoryDragPayload() {
  activeInventoryDragPayload = null;
}

export function currentInventoryDragPayload() {
  return activeInventoryDragPayload;
}

export function parseInventoryDragPayload(rawPayload: string | undefined) {
  if (!rawPayload) return null;

  try {
    const payload = JSON.parse(rawPayload) as InventoryDropPayload;
    if (payload.kind === "loot" && payload.width > 0 && payload.height > 0) return payload;
    if (payload.kind === "inventory" && payload.itemId && payload.width > 0 && payload.height > 0) return payload;
    if (payload.kind === "equipment" && payload.equipSlot && payload.width > 0 && payload.height > 0) return payload;
  } catch {
    return null;
  }

  return null;
}

import type { GameState, InventoryBagItem } from "../game/state";
import { inventoryColumnCount, inventoryRowCount, partyMemberClass, selectedInventoryPartyMember } from "../game/state";
import { gearDisplaySlot, gearInventorySize } from "../game/combat/gear";
import {
  clearInventoryDragPayload,
  currentInventoryDragPayload,
  inventoryDragMime,
  parseInventoryDragPayload,
  setInventoryDragPayload,
  type InventoryDropPayload,
} from "./inventory-drag";
import { itemIconForGear } from "./item-icons";
import type { GearDrop, GearEquipSlot } from "../game/types";
import weaponSlotUrl from "../../assets/ui/inventory-drawer/equipment/2.1_SLOT_WEAPON_VERTICAL.png?url";
import helmetSlotUrl from "../../assets/ui/inventory-drawer/equipment/2.2_SLOT_HELMET.png?url";
import amuletSlotUrl from "../../assets/ui/inventory-drawer/equipment/2.3_SLOT_AMULET.png?url";
import chestSlotUrl from "../../assets/ui/inventory-drawer/equipment/2.4_SLOT_CHEST.png?url";
import glovesSlotUrl from "../../assets/ui/inventory-drawer/equipment/2.5_SLOT_GLOVES.png?url";
import ringSlotUrl from "../../assets/ui/inventory-drawer/equipment/2.6_SLOT_RING.png?url";
import legsSlotUrl from "../../assets/ui/inventory-drawer/equipment/2.7_SLOT_LEGS.png?url";
import bootsSlotUrl from "../../assets/ui/inventory-drawer/equipment/2.8_SLOT_BOOTS.png?url";

export type InventoryViewModel = {
  heroHtml: string;
  equipmentHtml: string;
  packHtml: string;
};

export type InventoryInteractionHandlers = {
  canPlaceItem(payload: InventoryDropPayload, slot: number): boolean;
  canEquipItem(itemId: string, equipSlot: GearEquipSlot): boolean;
  canEquipLoot(equipSlot: GearEquipSlot): boolean;
  onMoveInventoryItem(itemId: string, slot: number): void;
  onTakeLoot(slot: number): void;
  onEquipInventoryItem(itemId: string, equipSlot?: GearEquipSlot | null): void;
  onEquipLoot(equipSlot: GearEquipSlot): void;
  onUnequipItem(equipSlot: GearEquipSlot, slot?: number): void;
};

const inventoryColumns = inventoryColumnCount;
const inventoryRows = inventoryRowCount;

const equipmentSlots = [
  { id: "weapon", equipSlot: "weapon" as const, label: "Weapon", imageUrl: weaponSlotUrl },
  { id: "helmet", equipSlot: "helmet" as const, label: "Helmet", imageUrl: helmetSlotUrl },
  { id: "amulet", equipSlot: "amulet" as const, label: "Amulet", imageUrl: amuletSlotUrl },
  { id: "chest", equipSlot: "bodyArmour" as const, label: "Body Armour", imageUrl: chestSlotUrl },
  { id: "gloves", equipSlot: "gloves" as const, label: "Gloves", imageUrl: glovesSlotUrl },
  { id: "ring-one", equipSlot: "ringOne" as const, label: "Ring", imageUrl: ringSlotUrl },
  { id: "ring-two", equipSlot: "ringTwo" as const, label: "Ring", imageUrl: ringSlotUrl },
  { id: "legs", equipSlot: "pants" as const, label: "Pants", imageUrl: legsSlotUrl },
  { id: "boots", equipSlot: "boots" as const, label: "Boots", imageUrl: bootsSlotUrl },
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rarityClass(item: InventoryBagItem) {
  return item.gear.rarity.toLowerCase();
}

function itemPositionVars(item: InventoryBagItem) {
  const row = Math.floor(item.slot / inventoryColumns) + 1;
  const col = (item.slot % inventoryColumns) + 1;

  return `--item-col:${col}; --item-row:${row}; --item-w:${item.width}; --item-h:${item.height}`;
}

function slotPositionVars(slot: number) {
  const row = Math.floor(slot / inventoryColumns) + 1;
  const col = (slot % inventoryColumns) + 1;

  return `--slot-col:${col}; --slot-row:${row}`;
}

function renderGearPreview(gear: GearDrop, iconLabel: string, title: string) {
  const specials = gear.frame.weaponSpecials.length > 0
    ? gear.frame.weaponSpecials.map((special) => `<li><strong>${escapeHtml(special.name)}</strong><span>${special.cost} Bloom Meter, ${special.cooldown}s cooldown</span></li>`).join("")
    : `<li><strong>Class defaults</strong><span>Uses the character's base weapon specials.</span></li>`;
  const abilities = gear.frame.latticeAbilityOptions.length > 0 ? gear.frame.latticeAbilityOptions.map((ability) => `
    <li>
      <strong>${escapeHtml(ability.name)}</strong>
      <span>${escapeHtml(ability.detail)}</span>
    </li>
  `).join("") : `<li><strong>None</strong><span>No Branch ability rolls on this item.</span></li>`;
  const modifiers = gear.frame.modifierOptions.length > 0 ? gear.frame.modifierOptions.map((modifier) => `
    <li>
      <strong>${escapeHtml(modifier.name)}</strong>
      <span>${escapeHtml(modifier.detail)}</span>
    </li>
  `).join("") : `<li><strong>None</strong><span>No Branch modifier rolls on this item.</span></li>`;

  return `
    <span class="inventory-item-preview" role="tooltip">
      <em>${escapeHtml(title)}</em>
      <strong>${escapeHtml(gear.name)}</strong>
      <span>${escapeHtml(gear.rarity)} ${escapeHtml(iconLabel)} - ${escapeHtml(gearDisplaySlot(gear.slot))}</span>
      <p>${escapeHtml(gear.ability)}</p>
      <dl>
        <div><dt>Power</dt><dd>+${gear.power}</dd></div>
      </dl>
      <section>
        <h3>Abilities</h3>
        <ul>${abilities}</ul>
      </section>
      <section>
        <h3>Modifiers</h3>
        <ul>${modifiers}</ul>
      </section>
      <section>
        <h3>Specials</h3>
        <ul>${specials}</ul>
      </section>
    </span>
  `;
}

function renderInventoryItem(item: InventoryBagItem) {
  const icon = itemIconForGear(item.gear, item.classId);

  return `
    <button
      class="inventory-item inventory-item-gear ${rarityClass(item)}"
      type="button"
      draggable="true"
      data-inventory-item="${escapeHtml(item.id)}"
      data-item-w="${item.width}"
      data-item-h="${item.height}"
      aria-label="${escapeHtml(item.gear.name)}, ${item.width} by ${item.height} inventory item"
      style="${itemPositionVars(item)}"
    >
      <img src="${icon.imageUrl}" alt="" />
      ${renderGearPreview(item.gear, icon.label, "Inventory")}
    </button>
  `;
}

function renderEmptyPack(items: readonly InventoryBagItem[]) {
  const slots = Array.from({ length: inventoryColumns * inventoryRows }, (_, index) => `
    <button
      class="inventory-slot"
      type="button"
      data-inventory-slot="${index}"
      aria-label="Inventory slot ${index + 1}"
      style="${slotPositionVars(index)}"
    ></button>
  `).join("");

  return `
    <div class="inventory-grid" data-inventory-grid style="--inventory-columns:${inventoryColumns}; --inventory-rows:${inventoryRows}">
      ${slots}
      ${items.map(renderInventoryItem).join("")}
    </div>
  `;
}

function renderEquipmentSlots(state: GameState) {
  const member = selectedInventoryPartyMember(state);
  return equipmentSlots.map((slot) => {
    const equippedGear = equippedGearForSlot(state, slot.equipSlot);
    const equippedIcon = equippedGear ? itemIconForGear(equippedGear, member.classId) : null;
    const itemSize = equippedGear ? gearInventorySize(equippedGear) : null;
    const canDrag = !!equippedGear;
    return `
    <button
      class="equipment-slot equipment-slot-${slot.id}${equippedGear ? " is-equipped" : ""}"
      type="button"
      draggable="${canDrag ? "true" : "false"}"
      aria-label="${slot.label} slot"
      data-equipment-slot="${slot.equipSlot}"
      data-item-w="${itemSize?.width ?? 1}"
      data-item-h="${itemSize?.height ?? 1}"
      data-equipment-label="${escapeHtml(slot.label)}"
      style="--slot-art: url('${slot.imageUrl}')"
    >
      ${equippedGear && equippedIcon ? `
        <img class="equipment-item-art" src="${equippedIcon.imageUrl}" alt="" />
        ${renderGearPreview(equippedGear, equippedIcon.label, "Equipped")}
      ` : ""}
      <span class="equipment-slot-label">${escapeHtml(slot.label)}</span>
    </button>
  `;
  }).join("");
}

function equippedGearForSlot(state: GameState, slot: GearEquipSlot) {
  const member = selectedInventoryPartyMember(state);
  if (slot === "weapon") return member.equippedItems.weapon ?? null;
  return member.equippedItems[slot] ?? null;
}

export function renderInventory(state: GameState): InventoryViewModel {
  const selectedMember = selectedInventoryPartyMember(state);
  const selectedClass = partyMemberClass(state, selectedMember.id);
  const partySelectHtml = `
    <div class="inventory-party-select" style="--class-accent:${selectedClass.accent}" role="tablist" aria-label="Character equipment">
      <span>Equipment</span>
      <div class="inventory-party-portraits">
      ${state.party.members.map((member, index) => {
        const currentClass = partyMemberClass(state, member.id);
        const healthRatio = Math.max(0, Math.min(1, member.health / member.maxHealth));
        return `
          <button
            class="inventory-party-portrait${member.id === selectedMember.id ? " is-selected" : ""}${member.lifeState === "dead" ? " is-downed" : ""}"
            type="button"
            role="tab"
            aria-selected="${member.id === selectedMember.id ? "true" : "false"}"
            aria-label="Show ${escapeHtml(currentClass.name)} equipment"
            title="${escapeHtml(currentClass.name)}"
            data-party-inventory-member="${escapeHtml(member.id)}"
            style="--class-accent:${currentClass.accent}; --health-ratio:${healthRatio}"
          >
            <span class="inventory-party-portrait-frame">
              ${currentClass.portraitUrl ? `<img src="${currentClass.portraitUrl}" alt="" />` : `<span>${escapeHtml(currentClass.glyph)}</span>`}
            </span>
            <em>${index + 1}</em>
            <i aria-hidden="true"></i>
          </button>
        `;
      }).join("")}
      </div>
    </div>
  `;
  const heroHtml = "";
  const equipmentHtml = `${partySelectHtml}${renderEquipmentSlots(state)}`;
  const packHtml = renderEmptyPack(state.combat.inventoryItems);

  return { heroHtml, equipmentHtml, packHtml };
}

function bindInventoryInteractions(targets: { equipment: HTMLElement; pack: HTMLElement }, handlers: InventoryInteractionHandlers) {
  const grid = targets.pack.querySelector<HTMLElement>("[data-inventory-grid]");
  if (!grid) return;
  let suppressEquipClick = false;
  let suppressUnequipClick = false;

  const updatePreviewPlacement = (host: HTMLElement, preferredSide: "left" | "right") => {
    const preview = host.querySelector<HTMLElement>(".inventory-item-preview");
    if (!preview) return;

    host.classList.remove("preview-to-left", "preview-to-right");

    const gap = 10;
    const hostRect = host.getBoundingClientRect();
    const previewWidth = preview.getBoundingClientRect().width;
    const roomLeft = hostRect.left;
    const roomRight = window.innerWidth - hostRect.right;
    const side = preferredSide === "right"
      ? roomRight >= previewWidth + gap || roomRight >= roomLeft ? "right" : "left"
      : roomLeft >= previewWidth + gap || roomLeft >= roomRight ? "left" : "right";

    host.classList.add(side === "right" ? "preview-to-right" : "preview-to-left");
  };

  const clearEquipmentDropTargets = () => {
    targets.equipment.querySelectorAll(".equipment-slot.is-drop-target").forEach((slot) => slot.classList.remove("is-drop-target"));
  };

  const setItemDragImage = (event: DragEvent, item: HTMLElement) => {
    const dragImage = item.querySelector<HTMLElement>("img") ?? item;
    event.dataTransfer?.setDragImage(
      dragImage,
      Math.min(dragImage.clientWidth / 2, 72),
      Math.min(dragImage.clientHeight / 2, 72),
    );
  };

  targets.equipment.querySelectorAll<HTMLElement>("[data-equipment-slot]").forEach((slot) => {
    const equipSlot = slot.dataset.equipmentSlot as GearEquipSlot | undefined;
    if (!equipSlot) return;

    slot.addEventListener("click", () => {
      if (suppressUnequipClick) return;
      handlers.onUnequipItem(equipSlot);
    });
    slot.addEventListener("keydown", (event) => {
      if (event.code !== "Enter" && event.code !== "Space") return;
      event.preventDefault();
      handlers.onUnequipItem(equipSlot);
    });
    slot.addEventListener("pointerenter", () => updatePreviewPlacement(slot, "right"));
    slot.addEventListener("focus", () => updatePreviewPlacement(slot, "right"));
    slot.addEventListener("dragstart", (event) => {
      if (!slot.classList.contains("is-equipped")) return;
      const payload: InventoryDropPayload = {
        kind: "equipment",
        equipSlot,
        width: Number(slot.dataset.itemW ?? 1),
        height: Number(slot.dataset.itemH ?? 1),
      };
      suppressUnequipClick = true;
      setInventoryDragPayload(payload);
      event.dataTransfer?.setData(inventoryDragMime, JSON.stringify(payload));
      event.dataTransfer?.setData("text/plain", slot.getAttribute("aria-label") ?? "Equipped item");
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      setItemDragImage(event, slot);
      slot.classList.add("is-dragging");
    });
    slot.addEventListener("dragend", () => {
      slot.classList.remove("is-dragging");
      clearInventoryDragPayload();
      clearDropTargets();
      clearEquipmentDropTargets();
      window.setTimeout(() => {
        suppressUnequipClick = false;
      }, 0);
    });
    slot.addEventListener("dragover", (event) => {
      const payload = currentInventoryDragPayload()
        ?? parseInventoryDragPayload(event.dataTransfer?.getData(inventoryDragMime));
      const canDrop = payload?.kind === "inventory"
        ? handlers.canEquipItem(payload.itemId, equipSlot)
        : payload?.kind === "loot" && handlers.canEquipLoot(equipSlot);
      if (!canDrop) {
        slot.classList.remove("is-drop-target");
        return;
      }

      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      clearEquipmentDropTargets();
      slot.classList.add("is-drop-target");
    });
    slot.addEventListener("dragleave", () => {
      slot.classList.remove("is-drop-target");
    });
    slot.addEventListener("drop", (event) => {
      const payload = currentInventoryDragPayload()
        ?? parseInventoryDragPayload(event.dataTransfer?.getData(inventoryDragMime));
      const canDrop = payload?.kind === "inventory"
        ? handlers.canEquipItem(payload.itemId, equipSlot)
        : payload?.kind === "loot" && handlers.canEquipLoot(equipSlot);
      if (!payload || !canDrop) return;

      event.preventDefault();
      clearInventoryDragPayload();
      clearDropTargets();
      clearEquipmentDropTargets();
      if (payload.kind === "loot") {
        handlers.onEquipLoot(equipSlot);
      } else if (payload.kind === "inventory") {
        handlers.onEquipInventoryItem(payload.itemId, equipSlot);
      }
    });
  });

  const slotFromPoint = (event: DragEvent | PointerEvent | MouseEvent) => {
    const rect = grid.getBoundingClientRect();
    if (
      event.clientX < rect.left
      || event.clientX > rect.right
      || event.clientY < rect.top
      || event.clientY > rect.bottom
    ) {
      return null;
    }

    const col = Math.min(inventoryColumns - 1, Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * inventoryColumns)));
    const row = Math.min(inventoryRows - 1, Math.max(0, Math.floor(((event.clientY - rect.top) / rect.height) * inventoryRows)));

    return row * inventoryColumns + col;
  };

  const clearDropTargets = () => {
    grid.querySelectorAll(".inventory-slot.is-drop-target").forEach((slot) => slot.classList.remove("is-drop-target"));
  };

  const markDropTarget = (payload: InventoryDropPayload, slot: number) => {
    clearDropTargets();
    if (!handlers.canPlaceItem(payload, slot)) return;

    const startCol = slot % inventoryColumns;
    const startRow = Math.floor(slot / inventoryColumns);
    for (let row = startRow; row < startRow + payload.height; row += 1) {
      for (let col = startCol; col < startCol + payload.width; col += 1) {
        grid.querySelector<HTMLElement>(`[data-inventory-slot="${row * inventoryColumns + col}"]`)?.classList.add("is-drop-target");
      }
    }
  };

  grid.querySelectorAll<HTMLElement>("[data-inventory-item]").forEach((item) => {
    const itemId = item.dataset.inventoryItem ?? "";

    item.addEventListener("click", () => {
      if (suppressEquipClick) return;
      if (!itemId) return;
      handlers.onEquipInventoryItem(itemId);
    });
    item.addEventListener("keydown", (event) => {
      if (!itemId || (event.code !== "Enter" && event.code !== "Space")) return;
      event.preventDefault();
      handlers.onEquipInventoryItem(itemId);
    });
    item.addEventListener("pointerenter", () => updatePreviewPlacement(item, "left"));
    item.addEventListener("focus", () => updatePreviewPlacement(item, "left"));
    item.addEventListener("dragstart", (event) => {
      const payload: InventoryDropPayload = {
        kind: "inventory",
        itemId,
        width: Number(item.dataset.itemW ?? 1),
        height: Number(item.dataset.itemH ?? 1),
      };
      suppressEquipClick = true;
      setInventoryDragPayload(payload);
      event.dataTransfer?.setData(inventoryDragMime, JSON.stringify(payload));
      event.dataTransfer?.setData("text/plain", item.getAttribute("aria-label") ?? "Inventory item");
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      setItemDragImage(event, item);
      item.classList.add("is-dragging");
    });
    item.addEventListener("dragend", () => {
      item.classList.remove("is-dragging");
      clearInventoryDragPayload();
      clearDropTargets();
      clearEquipmentDropTargets();
      window.setTimeout(() => {
        suppressEquipClick = false;
      }, 0);
    });
  });

  grid.addEventListener("dragover", (event) => {
    const payload = currentInventoryDragPayload();
    const targetSlot = slotFromPoint(event);
    if (!payload || targetSlot === null || !handlers.canPlaceItem(payload, targetSlot)) {
      clearDropTargets();
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    markDropTarget(payload, targetSlot);
  });

  grid.addEventListener("dragleave", () => {
    clearDropTargets();
  });

  grid.addEventListener("drop", (event) => {
    const payload = currentInventoryDragPayload()
      ?? parseInventoryDragPayload(event.dataTransfer?.getData(inventoryDragMime));
    const targetSlot = slotFromPoint(event);
    if (!payload || targetSlot === null || !handlers.canPlaceItem(payload, targetSlot)) return;

    event.preventDefault();
    clearInventoryDragPayload();
    clearDropTargets();
    if (payload.kind === "loot") {
      handlers.onTakeLoot(targetSlot);
    } else if (payload.kind === "equipment") {
      handlers.onUnequipItem(payload.equipSlot as GearEquipSlot, targetSlot);
    } else {
      handlers.onMoveInventoryItem(payload.itemId, targetSlot);
    }
  });
}

export function applyInventory(
  targets: {
    hero: HTMLElement;
    equipment: HTMLElement;
    pack: HTMLElement;
  },
  view: InventoryViewModel,
  handlers: InventoryInteractionHandlers,
) {
  targets.hero.innerHTML = view.heroHtml;
  targets.equipment.innerHTML = view.equipmentHtml;
  targets.pack.innerHTML = view.packHtml;
  bindInventoryInteractions(targets, handlers);
}

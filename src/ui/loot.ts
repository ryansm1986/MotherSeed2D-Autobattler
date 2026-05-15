import type { GameState } from "../game/state";
import { lootCorpse } from "../game/state";
import { coreStatLabels, gearDisplaySlot, gearInventorySize } from "../game/combat/gear";
import type { GearDrop } from "../game/types";
import { clearInventoryDragPayload, inventoryDragMime, setInventoryDragPayload } from "./inventory-drag";
import { itemIconForGear } from "./item-icons";

export type LootScreenViewModel = {
  gridHtml: string;
  sourceLabel: string;
  hasLoot: boolean;
};

export type LootInteractionHandlers = {
  onTakeLootToInventory(): void;
};

const lootColumns = 5;
const lootRows = 5;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rarityClass(rarity: GearDrop["rarity"]) {
  return rarity.toLowerCase();
}

function slotPositionVars(slot: number) {
  const row = Math.floor(slot / lootColumns) + 1;
  const col = (slot % lootColumns) + 1;

  return `--slot-col:${col}; --slot-row:${row}`;
}

function itemPositionVars(width: number, height: number) {
  return `--item-col:1; --item-row:1; --item-w:${width}; --item-h:${height}`;
}

function renderLootSlots() {
  return Array.from({ length: lootColumns * lootRows }, (_, index) => `
    <button
      class="loot-slot"
      type="button"
      data-loot-slot="${index}"
      aria-label="Loot slot ${index + 1}"
      style="${slotPositionVars(index)}"
    ></button>
  `).join("");
}

function renderLootItem(state: GameState, gear: GearDrop) {
  const icon = itemIconForGear(gear, state.selectedClassId);
  const size = gearInventorySize(gear);

  return `
    <button
      class="loot-item ${rarityClass(gear.rarity)}"
      type="button"
      draggable="true"
      data-loot-item="drop"
      data-item-w="${size.width}"
      data-item-h="${size.height}"
      aria-label="${escapeHtml(gear.name)}, ${escapeHtml(gear.rarity)} ${escapeHtml(icon.label)}"
      style="${itemPositionVars(size.width, size.height)}"
    >
      <img src="${icon.imageUrl}" alt="" />
      ${renderGearPreview(gear, icon.label)}
    </button>
  `;
}

function renderGearPreview(gear: GearDrop, iconLabel: string) {
  const statRows = Object.entries(gear.stats ?? {})
    .filter(([, value]) => Number.isFinite(value) && value > 0)
    .map(([stat, value]) => `<div><dt>${coreStatLabels[stat as keyof typeof coreStatLabels]}</dt><dd>+${value}</dd></div>`)
    .join("");
  const specials = gear.frame.weaponSpecials.length > 0
    ? gear.frame.weaponSpecials.map((special) => `
      <li>
        <strong>${escapeHtml(special.name)}</strong>
        <span>${special.cost} Bloom Meter, ${special.cooldown}s cooldown</span>
      </li>
    `).join("")
    : `<li><strong>None</strong><span>No weapon special rolls on this item.</span></li>`;
  const abilities = gear.frame.latticeAbilityOptions.length > 0
    ? gear.frame.latticeAbilityOptions.map((ability) => `
      <li>
        <strong>${escapeHtml(ability.name)}</strong>
        <span>${escapeHtml(ability.detail)}</span>
      </li>
    `).join("")
    : `<li><strong>None</strong><span>No Branch ability rolls on this item.</span></li>`;
  const modifiers = gear.frame.modifierOptions.length > 0
    ? gear.frame.modifierOptions.map((modifier) => `
      <li>
        <strong>${escapeHtml(modifier.name)}</strong>
        <span>${escapeHtml(modifier.detail)}</span>
      </li>
    `).join("")
    : `<li><strong>None</strong><span>No Branch modifier rolls on this item.</span></li>`;

  return `
    <span class="inventory-item-preview" role="tooltip">
      <em>Loot</em>
      <strong>${escapeHtml(gear.name)}</strong>
      <span>${escapeHtml(gear.rarity)} ${escapeHtml(iconLabel)} - ${escapeHtml(gearDisplaySlot(gear.slot))}</span>
      <p>${escapeHtml(gear.ability)}</p>
      <dl>
        <div><dt>Power</dt><dd>+${gear.power}</dd></div>
        ${statRows}
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

export function renderLootScreen(state: GameState): LootScreenViewModel {
  const gear = state.combat.droppedGear;
  const corpse = lootCorpse(state);
  const sourceLabel = state.combat.droppedGearSourceLabel ?? (corpse ? `${corpse.name} Remains` : "Loot Cache");

  return {
    sourceLabel,
    hasLoot: !!gear,
    gridHtml: `
      <div class="loot-grid" style="--loot-columns:${lootColumns}; --loot-rows:${lootRows}">
        ${renderLootSlots()}
        ${gear ? renderLootItem(state, gear) : ""}
      </div>
    `,
  };
}

export function applyLootScreen(
  targets: {
    source: HTMLElement;
    grid: HTMLElement;
    takeAllButton: HTMLButtonElement;
  },
  view: LootScreenViewModel,
  handlers: LootInteractionHandlers,
) {
  targets.source.textContent = view.sourceLabel;
  targets.grid.innerHTML = view.gridHtml;
  targets.takeAllButton.disabled = !view.hasLoot;

  targets.grid.querySelectorAll<HTMLElement>("[data-loot-item]").forEach((item) => {
    item.addEventListener("click", (event) => {
      if (!event.ctrlKey || event.button !== 0) return;
      event.preventDefault();
      handlers.onTakeLootToInventory();
    });
    item.addEventListener("dragstart", (event) => {
      const payload = {
        kind: "loot",
        width: Number(item.dataset.itemW ?? 1),
        height: Number(item.dataset.itemH ?? 1),
      } as const;
      setInventoryDragPayload(payload);
      event.dataTransfer?.setData(inventoryDragMime, JSON.stringify(payload));
      event.dataTransfer?.setData("text/plain", item.getAttribute("aria-label") ?? "Loot item");
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      const dragImage = item.querySelector<HTMLElement>("img") ?? item;
      event.dataTransfer?.setDragImage(
        dragImage,
        Math.min(dragImage.clientWidth / 2, 72),
        Math.min(dragImage.clientHeight / 2, 72),
      );
      item.classList.add("is-dragging");
    });
    item.addEventListener("dragend", () => {
      item.classList.remove("is-dragging");
      clearInventoryDragPayload();
    });
  });
}

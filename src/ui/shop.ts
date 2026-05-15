import { coreStatLabels, gearDisplaySlot } from "../game/combat/gear";
import { characterClasses } from "../game/content/classes";
import type { GameState, ShopItemState } from "../game/state";
import type { CoreStat } from "../game/types";

export type ShopViewModel = {
  html: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderShop(state: GameState): ShopViewModel {
  const shop = state.round.shop;
  return {
    html: `
      <header class="shop-header">
        <div>
          <p class="shop-kicker">Round ${Math.max(1, state.round.roundIndex)} shop</p>
          <h1 id="shop-title">Grove Market</h1>
        </div>
        <div class="shop-gold" aria-label="Current gold">
          <span>Gold</span>
          <strong>${state.round.gold}</strong>
        </div>
      </header>
      <div class="shop-status">${escapeHtml(shop.message)}</div>
      <section class="shop-grid" aria-label="Shop offers">
        ${shop.inventory.length > 0
          ? shop.inventory.map((item) => renderShopItem(state, item)).join("")
          : `<div class="shop-empty"><strong>Sold out</strong><span>Reroll for new offers or start the next fight.</span></div>`}
      </section>
      <footer class="shop-actions">
        <button class="shop-button" type="button" data-shop-reroll ${state.round.gold < shop.rerollCost ? "disabled" : ""}>
          Reroll ${shop.rerollCost}g
        </button>
        <button class="shop-button is-primary" type="button" data-shop-start-fight>
          Start Fight ${state.round.roundIndex + 1}
        </button>
      </footer>
    `,
  };
}

export function applyShop(target: HTMLElement, view: ShopViewModel) {
  if (target.innerHTML === view.html) return;
  target.innerHTML = view.html;
}

function renderShopItem(state: GameState, item: ShopItemState) {
  const gear = item.gear;
  const classData = characterClasses[item.classId];
  const affordable = state.round.gold >= item.price;
  return `
    <article class="shop-item ${gear.rarity.toLowerCase()}" style="--class-accent:${classData.accent}">
      <div class="shop-item-topline">
        <span>${escapeHtml(classData.name)}</span>
        <strong>${item.price}g</strong>
      </div>
      <h2>${escapeHtml(gear.name)}</h2>
      <p>${escapeHtml(gearDisplaySlot(gear.slot))} - ${escapeHtml(gear.rarity)} - Power ${gear.power}</p>
      ${renderStats(gear.stats)}
      <em>${escapeHtml(gear.ability)}</em>
      <button class="shop-buy-button" type="button" data-shop-buy-id="${escapeHtml(item.id)}" ${affordable ? "" : "disabled"}>
        ${affordable ? "Buy" : "Need Gold"}
      </button>
    </article>
  `;
}

function renderStats(stats: Partial<Record<CoreStat, number>>) {
  const entries = Object.entries(stats).filter((entry): entry is [CoreStat, number] => Number.isFinite(entry[1]) && entry[1] > 0);
  if (entries.length === 0) return "";
  return `
    <dl class="shop-stat-list">
      ${entries.map(([stat, value]) => `
        <div>
          <dt>${escapeHtml(coreStatLabels[stat])}</dt>
          <dd>+${value}</dd>
        </div>
      `).join("")}
    </dl>
  `;
}

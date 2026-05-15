import { addGearToInventory, gearDisplaySlot, generateGear } from "./combat/gear";
import { characterClasses } from "./content/classes";
import { encounterRerollCost, encounterShopOfferCount } from "./content/encounters";
import { ensureRoundState, logEvent, type GameEvent, type GameState, type ShopItemState } from "./state";
import type { ClassId, GearDrop } from "./types";

export function gearShopPrice(gear: GearDrop) {
  const rarityBase = gear.rarity === "Rare" ? 22 : gear.rarity === "Uncommon" ? 12 : 7;
  const rarityMultiplier = gear.rarity === "Rare" ? 3 : gear.rarity === "Uncommon" ? 2 : 1;
  return rarityBase + gear.power * rarityMultiplier;
}

export function rollShopInventory(state: GameState): GameEvent[] {
  ensureRoundState(state);
  const shop = state.round.shop;
  shop.inventorySize = encounterShopOfferCount(Math.max(1, state.combat.roomIndex));
  shop.rerollCost = rerollCostForRound(state);
  const partyClassIds = shopClassIds(state);
  const itemCount = Math.max(3, Math.min(5, Math.floor(shop.inventorySize)));
  shop.inventory = Array.from({ length: itemCount }, (_, index) => {
    const classId = partyClassIds[index % partyClassIds.length];
    const gear = generateGear(classId);
    return createShopItem(state, gear, classId);
  });
  shop.message = "Fresh gear has rooted into the shop.";
  return [logEvent("Shop refreshed", `${itemCount} offers available`)];
}

export function ensureShopInventory(state: GameState) {
  ensureRoundState(state);
  if (state.round.phase !== "shop" || state.round.shop.inventory.length > 0) return [];
  return rollShopInventory(state);
}

export function buyShopItem(state: GameState, itemId: string): GameEvent[] {
  ensureRoundState(state);
  if (state.round.phase !== "shop") return [];
  const itemIndex = state.round.shop.inventory.findIndex((item) => item.id === itemId);
  if (itemIndex < 0) return [];
  const item = state.round.shop.inventory[itemIndex];
  if (state.round.gold < item.price) {
    return [logEvent("Not enough gold", `${item.gear.name} costs ${item.price} gold`)];
  }

  const inventoryItem = addGearToInventory(state, item.gear, item.classId);
  if (!inventoryItem) return [logEvent("Inventory full", "Make room before buying gear")];

  state.round.gold -= item.price;
  state.round.shop.inventory.splice(itemIndex, 1);
  state.round.shop.message = `${item.gear.name} moved to the backpack.`;
  return [
    logEvent(
      `Bought ${item.gear.name}`,
      `${characterClasses[item.classId].name} ${gearDisplaySlot(item.gear.slot)} stowed for ${item.price} gold`,
    ),
  ];
}

export function rerollShop(state: GameState): GameEvent[] {
  ensureRoundState(state);
  if (state.round.phase !== "shop") return [];
  const cost = state.round.shop.rerollCost;
  if (state.round.gold < cost) return [logEvent("Not enough gold", `Reroll costs ${cost} gold`)];
  state.round.gold -= cost;
  return rollShopInventory(state);
}

function createShopItem(state: GameState, gear: GearDrop, classId: ClassId): ShopItemState {
  const id = `shop-${state.round.shop.nextItemId}`;
  state.round.shop.nextItemId += 1;
  return {
    id,
    gear,
    classId,
    price: gearShopPrice(gear),
  };
}

function shopClassIds(state: GameState): ClassId[] {
  const classIds = state.party.members
    .map((member) => member.classId)
    .filter((classId, index, all) => all.indexOf(classId) === index && characterClasses[classId]?.implemented);
  return classIds.length > 0 ? classIds : [state.selectedClassId];
}

function rerollCostForRound(state: GameState) {
  return encounterRerollCost(Math.max(1, state.combat.roomIndex));
}

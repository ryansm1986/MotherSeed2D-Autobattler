import type { ClassId, GearDrop, GearSlot } from "../game/types";
import verdantGreatswordUrl from "../../assets/items/placeholders/verdant-greatsword.png?url";
import crescentStaffUrl from "../../assets/items/placeholders/crescent-staff.png?url";
import rangerBowUrl from "../../assets/items/placeholders/ranger-bow.png?url";
import twinDaggersUrl from "../../assets/items/placeholders/twin-daggers.png?url";
import motherseedCharmUrl from "../../assets/items/placeholders/motherseed-charm.png?url";
import amberveinRingUrl from "../../assets/items/placeholders/ambervein-ring.png?url";
import leafEtchedHelmetUrl from "../../assets/items/placeholders/leaf-etched-helmet.png?url";
import quickrootBootsUrl from "../../assets/items/placeholders/quickroot-boots.png?url";
import rootguardBodyArmourUrl from "../../assets/items/placeholders/rootguard-body-armour.png?url";
import scoutPantsUrl from "../../assets/items/placeholders/scout-pants.png?url";
import starBloomAmuletUrl from "../../assets/items/placeholders/star-bloom-amulet.png?url";
import thornlitGlovesUrl from "../../assets/items/placeholders/thornlit-gloves.png?url";
import crescentStarHelmUrl from "../../assets/items/purple-mage/crescent-star-helm.png?url";
import moonstepBootsUrl from "../../assets/items/purple-mage/moonstep-boots.png?url";
import moonweaveArmourUrl from "../../assets/items/purple-mage/moonweave-armour.png?url";
import moonweavePantsUrl from "../../assets/items/purple-mage/moonweave-pants.png?url";
import starthreadGlovesUrl from "../../assets/items/purple-mage/starthread-gloves.png?url";

export type ItemIconView = {
  imageUrl: string;
  label: string;
};

const classLootIcons: Record<ClassId, ItemIconView> = {
  warrior: { imageUrl: verdantGreatswordUrl, label: "Weapon" },
  mage: { imageUrl: crescentStaffUrl, label: "Staff" },
  ranger: { imageUrl: rangerBowUrl, label: "Bow" },
  thief: { imageUrl: twinDaggersUrl, label: "Daggers" },
  cleric: { imageUrl: motherseedCharmUrl, label: "Charm" },
};

const slotIcons: Record<GearSlot, ItemIconView> = {
  weapon: classLootIcons.warrior,
  helmet: { imageUrl: leafEtchedHelmetUrl, label: "Helmet" },
  bodyArmour: { imageUrl: rootguardBodyArmourUrl, label: "Body Armour" },
  gloves: { imageUrl: thornlitGlovesUrl, label: "Gloves" },
  ring: { imageUrl: amberveinRingUrl, label: "Ring" },
  amulet: { imageUrl: starBloomAmuletUrl, label: "Amulet" },
  pants: { imageUrl: scoutPantsUrl, label: "Pants" },
  boots: { imageUrl: quickrootBootsUrl, label: "Boots" },
};

const purpleMageSlotIcons: Partial<Record<GearSlot, ItemIconView>> = {
  helmet: { imageUrl: crescentStarHelmUrl, label: "Helmet" },
  bodyArmour: { imageUrl: moonweaveArmourUrl, label: "Body Armour" },
  gloves: { imageUrl: starthreadGlovesUrl, label: "Gloves" },
  pants: { imageUrl: moonweavePantsUrl, label: "Pants" },
  boots: { imageUrl: moonstepBootsUrl, label: "Boots" },
};

export function itemIconForClass(classId: ClassId) {
  return classLootIcons[classId];
}

export function itemIconForGear(gear: GearDrop, classId: ClassId) {
  if (gear.slot === "weapon") return itemIconForClass(classId);
  return classId === "mage" ? purpleMageSlotIcons[gear.slot] ?? slotIcons[gear.slot] : slotIcons[gear.slot];
}

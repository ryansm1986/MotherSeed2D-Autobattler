import comboAttackUrl from "../../assets/ui/ability_icons/extracted/r1c3-claw.png?url";
import hasteUrl from "../../assets/ui/ability_icons/extracted/r2c1-haste-swirl.png?url";
import fireModifierUrl from "../../assets/ui/ability_icons/extracted/r2c4-starburst.png?url";
import quickrootModifierUrl from "../../assets/ui/ability_icons/extracted/r3c4-grass-blade.png?url";
import starBloomModifierUrl from "../../assets/ui/ability_icons/extracted/r1c4-bloom.png?url";
import sapFedModifierUrl from "../../assets/ui/ability_icons/extracted/r4c2-twin-leaves.png?url";
import basicAttackUrl from "../../assets/ui/ability_icons/extracted/r4c3-sword.png?url";
import rootbreakerCleaveUrl from "../../assets/ui/ability_icons/warrior_fresh_skills/rootbreaker_cleave.png?url";
import thornwallCounterUrl from "../../assets/ui/ability_icons/warrior_fresh_skills/thornwall_counter.png?url";
import motherseedEchoModifierUrl from "../../assets/ui/ability_icons/extracted/r4c4-staff.png?url";
import amberVeinModifierUrl from "../../assets/ui/ability_icons/extracted/r3c1-water-drop.png?url";
import verdantGuillotineUrl from "../../assets/ui/ability_icons/warrior_fresh_skills/verdant_guillotine.png?url";

const branchOptionIcons: Record<string, string> = {
  "lattice:basic-attack-1": basicAttackUrl,
  "lattice:warrior:rootbreaker-cleave": rootbreakerCleaveUrl,
  "lattice:warrior:thornwall-counter": thornwallCounterUrl,
  "lattice:warrior:front-flip-slash": comboAttackUrl,
  "lattice:warrior:verdant-guillotine": verdantGuillotineUrl,
  "lattice:ranger:greenwood-flourish": comboAttackUrl,
  "lattice:mage:moonveil-flourish": comboAttackUrl,
  "lattice:thief:shadowglass-flourish": comboAttackUrl,
  "lattice:cleric:dawnroot-flourish": comboAttackUrl,
  "lattice:haste-1s": hasteUrl,
  "lattice:combo-attack": comboAttackUrl,
  "mod:fire": fireModifierUrl,
  "mod:sap-fed": sapFedModifierUrl,
  "mod:quickroot": quickrootModifierUrl,
  "mod:amber-vein": amberVeinModifierUrl,
  "mod:motherseed-echo": motherseedEchoModifierUrl,
  "mod:star-bloom": starBloomModifierUrl,
};

export function branchOptionIconUrl(optionId: string) {
  return branchOptionIcons[optionId] ?? null;
}

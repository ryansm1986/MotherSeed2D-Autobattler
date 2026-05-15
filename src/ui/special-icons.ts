import motherSlashUrl from "../../assets/ui/ability_icons/extracted/r1c2-leaf-whirl.png?url";
import moonfallUrl from "../../assets/ui/ability_icons/extracted/r4c4-staff.png?url";
import mothersHealingUrl from "../../assets/ui/ability_icons/extracted/r3c1-water-drop.png?url";
import radiantBrandUrl from "../../assets/ui/ability_icons/extracted/r3c3-sunburst.png?url";
import wardPulseUrl from "../../assets/ui/ability_icons/extracted/r4c1-shield.png?url";
import judgmentUrl from "../../assets/ui/ability_icons/extracted/r2c4-starburst.png?url";
import rootbreakerCleaveUrl from "../../assets/ui/ability_icons/warrior_fresh_skills/rootbreaker_cleave.png?url";
import thornwallCounterUrl from "../../assets/ui/ability_icons/warrior_fresh_skills/thornwall_counter.png?url";
import motherloadBreakerUrl from "../../assets/ui/ability_icons/warrior_fresh_skills/motherload_breaker.png?url";

const specialIconUrls: Record<string, string> = {
  motherslash: motherSlashUrl,
  motherspin: motherSlashUrl,
  moonfall: moonfallUrl,
  "mothers-healing": mothersHealingUrl,
  "radiant-brand": radiantBrandUrl,
  "ward-pulse": wardPulseUrl,
  judgment: judgmentUrl,
  "rootbreaker-cleave": rootbreakerCleaveUrl,
  "thornwall-counter": thornwallCounterUrl,
  "motherload-breaker": motherloadBreakerUrl,
};

export function specialIconUrl(specialId: string) {
  return specialIconUrls[specialId] ?? null;
}

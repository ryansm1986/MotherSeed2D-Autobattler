import { castPartySpecial, castPendingPartyTargetedSpecial, castSpecial, updateAutoAttack } from "../src/game/combat/abilities";
import { updatePartyCompanions } from "../src/game/combat/party-ai";
import {
  canEquipDropToSlot,
  canEquipInventoryItemToSlot,
  equipDrop,
  equipDropToSlot,
  equipInventoryItem,
  gearDamageMultiplier,
  gearInventorySize,
  generateGear,
  grantFullStarterGear,
  unequipGearSlot,
} from "../src/game/combat/gear";
import { debugEncounterOptions, teleportToDebugEncounter } from "../src/game/debug";
import { dealEnemyDamage, dealPartyMemberDamage, defeatPlayer } from "../src/game/combat/damage";
import { clampToArena } from "../src/game/world/collision";
import { world } from "../src/game/world/arena";
import { distance } from "../src/game/math";
import { createInputState } from "../src/game/input-actions";
import { buyShopItem, rerollShop } from "../src/game/shop";
import { updateSimulation } from "../src/game/simulation";
import { clearRoomProjectiles, spawnRoomEnemy, startNextAutobattleRound } from "../src/game/world/rooms";
import {
  advanceCodgerLatticeTutorial,
  canUseIntroStairs,
  continueCodgerTutorial,
  interactWithCodger,
  maybeAdvanceCodgerAmuletEquipped,
  skipCodgerTutorial,
} from "../src/game/world/intro-room";
import {
  activeLatticeSequence,
  activeWeaponSpecials,
  applySelectedClass,
  assignStartingLatticeAbilities,
  branchLatticeFrame,
  branchLatticeAbilitySlotCount,
  branchLatticeModifierSlotCount,
  createFrameGear,
  createInitialGameState,
  createStartingAmulet,
  setActivePartyMember,
  togglePartyClassSelection,
  withPartyMemberAliases,
  type GameEvent,
} from "../src/game/state";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const state = createInitialGameState("warrior");
const serializedState = JSON.stringify(state);
assert(serializedState.includes("Recruit's Greatsword"), "initial state should be JSON serializable");
assert(serializedState.includes("branchLattice"), "initial state should include Branch Lattice data");
assert(state.combat.equippedGear.frame.weaponSpecials.length > 0, "initial gear should include weapon specials");
assert(state.combat.equippedGear.frame.latticeAbilityOptions.length === 0, "initial weapon should not grant lattice abilities");
assert(!state.combat.equippedItems.amulet, "warrior should start before receiving the codger amulet");
state.combat.equippedItems.amulet = createStartingAmulet("warrior");
assert(
  branchLatticeFrame(state).latticeAbilityOptions.some((option) => option.kind === "verdant_guillotine" && option.tags?.includes("Finisher")),
  "warrior codger amulet should grant Verdant Guillotine as a Finisher",
);
grantFullStarterGear(state);
assert(state.combat.equippedItems.helmet, "debug starter gear should equip a helmet");
assert(state.combat.equippedItems.ringOne && state.combat.equippedItems.ringTwo, "debug starter gear should equip both rings");
assert(state.combat.equippedItems.amulet?.frame.weaponSpecials.some((special) => special.id === "motherspin"), "debug starter gear amulet should grant Motherspin as a special");
assert(activeWeaponSpecials(state).some((special) => special.id === "motherspin"), "active specials should include specials granted by non-weapon gear");
assert(state.player.maxHealth > 140, "equipped starter gear vitality should raise derived max health");
assert(gearDamageMultiplier(state.player) > 1, "equipped associated stats should raise derived damage multiplier");

const partyState = createInitialGameState("warrior");
assert(togglePartyClassSelection(partyState, "mage"), "implemented mage should be addable to the party");
assert(togglePartyClassSelection(partyState, "cleric"), "implemented cleric should be addable to the party");
assert(!togglePartyClassSelection(partyState, "ranger"), "planned ranger should not be addable to the v1 party");
assert(partyState.party.members.length === 3, "party picker should keep implemented unique members");
const mageMember = partyState.party.members.find((member) => member.classId === "mage");
const clericMember = partyState.party.members.find((member) => member.classId === "cleric");
assert(mageMember && clericMember, "party should contain mage and cleric members");
setActivePartyMember(partyState, mageMember.id);
assert(partyState.player.classId === "mage", "switching party members should update the active player alias");
withPartyMemberAliases(partyState, clericMember.id, () => {
  grantFullStarterGear(partyState);
});
assert(clericMember.equippedItems.weapon?.name.includes("Charm"), "gear edits through member aliases should apply to that member");
partyState.enemy.visible = true;
partyState.enemy.state = "idle";
partyState.enemy.health = partyState.enemy.maxHealth;
partyState.enemy.x = partyState.player.x + 120;
partyState.enemy.y = partyState.player.y;
partyState.combat.targetLocked = true;
partyState.player.meter = partyState.player.maxMeter;
castSpecial(partyState, 0);
assert(partyState.party.motherLoadWindow.isActive, "active member special should prime party Mother Load");
clericMember.meter = clericMember.maxMeter;
clericMember.x = partyState.enemy.x - 80;
clericMember.y = partyState.enemy.y;
mageMember.health = Math.max(1, mageMember.maxHealth - 44);
const mageHealthBeforeClericHeal = mageMember.health;
const clericReadiedEvents = withPartyMemberAliases(partyState, clericMember.id, () => castSpecial(partyState, 0));
assert(partyState.party.pendingTargetedSpecial?.casterMemberId === clericMember.id, "cleric special should open a pending party-target window");
assert(clericReadiedEvents.some((event) => event.kind === "log" && event.message === "Mother's Healing readied"), "first cleric heal tap should ask for a party target");
const clericAutoHealEvents = withPartyMemberAliases(partyState, clericMember.id, () => castSpecial(partyState, 0));
assert(mageMember.health > mageHealthBeforeClericHeal, "double-tapped cleric heal should restore the lowest-percent party member");
assert(!partyState.party.pendingTargetedSpecial, "double-tapped cleric heal should clear the pending target window");
assert(!partyState.party.motherLoadWindow.isActive, "cleric support healing should clear a primed Mother Load without triggering it");
assert(clericAutoHealEvents.some((event) => event.kind === "log" && event.message === "Mother's Healing"), "cleric heal should emit a heal log");
setActivePartyMember(partyState, mageMember.id);
defeatPlayer(partyState, []);
assert(partyState.player.lifeState === "alive", "downing the active member should auto-swap to another living party member");
assert(partyState.party.members.some((member) => member.lifeState === "dead"), "the downed party member should remain down until combat recovery");

const crossMemberMotherLoadState = createInitialGameState("warrior");
assert(togglePartyClassSelection(crossMemberMotherLoadState, "mage"), "cross-member Mother Load smoke should create a mage companion");
const crossMageMember = crossMemberMotherLoadState.party.members.find((member) => member.classId === "mage");
assert(crossMageMember, "cross-member Mother Load smoke should find the mage companion");
crossMemberMotherLoadState.enemy.visible = true;
crossMemberMotherLoadState.enemy.state = "idle";
crossMemberMotherLoadState.enemy.health = crossMemberMotherLoadState.enemy.maxHealth;
crossMemberMotherLoadState.enemy.x = crossMemberMotherLoadState.player.x + 120;
crossMemberMotherLoadState.enemy.y = crossMemberMotherLoadState.player.y;
crossMemberMotherLoadState.combat.targetLocked = true;
crossMemberMotherLoadState.player.meter = crossMemberMotherLoadState.player.maxMeter;
castPartySpecial(crossMemberMotherLoadState, crossMemberMotherLoadState.player.id, 0);
assert(crossMemberMotherLoadState.party.motherLoadWindow.isActive, "first character should prime a party-wide Mother Load");
crossMageMember.x = crossMemberMotherLoadState.enemy.x - 92;
crossMageMember.y = crossMemberMotherLoadState.enemy.y;
crossMageMember.meter = crossMageMember.maxMeter;
const moonfallBaseDamage = 48 + Math.ceil(crossMageMember.equippedGear.power * 0.75);
const crossMoonfallEvents = castPartySpecial(crossMemberMotherLoadState, crossMageMember.id, 0);
assert(
  crossMoonfallEvents.some((event) => event.kind === "log" && event.message === "Mother Load triggered" && event.detail.includes("Moonfall")),
  "second character's MotherLoad-tagged special should consume the party window",
);
assert(crossMemberMotherLoadState.combat.moonwellBeams.length === 1, "cross-character Moonfall should trigger the mage Mother Load moonwell");
assert(crossMemberMotherLoadState.combat.verdantExplosions.length === 0, "cross-character Moonfall should not trigger the first character's warrior Mother Load visual");
assert(crossMemberMotherLoadState.combat.pendingMoonfallCast?.ownerMemberId === crossMageMember.id, "cross-character Moonfall should be owned by the second caster");
assert(crossMemberMotherLoadState.combat.pendingMoonfallCast.damage > moonfallBaseDamage, "cross-character Moonfall should receive its own Mother Load damage");
assert(crossMemberMotherLoadState.party.motherLoadWindow.sourceAbilityName === "Moonfall", "second character's special should open the next Mother Load window");

const partyAnimState = createInitialGameState("warrior");
assert(togglePartyClassSelection(partyAnimState, "cleric"), "party animation smoke should create a companion");
const aiClericMember = partyAnimState.party.members.find((member) => member.classId === "cleric");
assert(aiClericMember, "party animation smoke should find the AI companion");
aiClericMember.attackFlash = 0.4;
aiClericMember.anim = "idle";
updatePartyCompanions(partyAnimState, 0.016, []);
assert(aiClericMember.anim === "attack1", "AI party members should resolve attack flashes into visible attack animations");
updateSimulation(partyAnimState, createInputState(), 0.25, {
  playerFrameCount: () => 4,
  monsterFrameCount: () => 4,
  moonfallFrameCount: () => 4,
  codgerFrameCount: () => 4,
});
assert(aiClericMember.animFrame > 0, "AI party member animation frames should advance");

const clericAiLatticeState = createInitialGameState("warrior");
assert(togglePartyClassSelection(clericAiLatticeState, "cleric"), "cleric lattice AI smoke should create a companion");
const latticeClericMember = clericAiLatticeState.party.members.find((member) => member.classId === "cleric");
assert(latticeClericMember, "cleric lattice AI smoke should find the cleric companion");
const clericBasicSlot = activeLatticeSequence(clericAiLatticeState, latticeClericMember.id)[0];
assert(clericBasicSlot?.kind === "basic_attack_1", "cleric AI should default to the Basic Attack lattice slot");
assert(clericBasicSlot.range >= 500, "cleric Basic Attack lattice slot should use ranged fireball distance");
clericAiLatticeState.enemy.visible = true;
clericAiLatticeState.enemy.state = "idle";
clericAiLatticeState.enemy.health = clericAiLatticeState.enemy.maxHealth;
clericAiLatticeState.combat.targetLocked = true;
clericAiLatticeState.enemy.x = latticeClericMember.x + 360;
clericAiLatticeState.enemy.y = latticeClericMember.y;
const clericAiLatticeEvents: GameEvent[] = [];
updatePartyCompanions(clericAiLatticeState, 0.016, clericAiLatticeEvents);
assert(
  clericAiLatticeState.combat.pendingMagicMissileCast?.ownerMemberId === latticeClericMember.id,
  "cleric AI should execute its auto-ability lattice chain and queue a fireball",
);
assert(
  clericAiLatticeState.combat.pendingMagicMissileCast?.visual === "clericFireball",
  "cleric AI lattice attack should use the cleric fireball visual",
);

const mageAiRangeState = createInitialGameState("warrior");
assert(togglePartyClassSelection(mageAiRangeState, "mage"), "mage range AI smoke should create a companion");
const rangeMageMember = mageAiRangeState.party.members.find((member) => member.classId === "mage");
assert(rangeMageMember, "mage range AI smoke should find the mage companion");
rangeMageMember.equippedItems.amulet = createStartingAmulet("mage");
assignStartingLatticeAbilities(rangeMageMember.branchLattice, rangeMageMember.equippedItems.amulet);
rangeMageMember.autoLoop.currentSlotIndex = 1;
assert(activeLatticeSequence(mageAiRangeState, rangeMageMember.id)[1]?.kind === "moonveil_flourish", "mage range AI smoke should slot Moonveil Flourish");
mageAiRangeState.enemy.visible = true;
mageAiRangeState.enemy.state = "idle";
mageAiRangeState.enemy.health = mageAiRangeState.enemy.maxHealth;
mageAiRangeState.combat.targetLocked = true;
rangeMageMember.x = mageAiRangeState.player.x + 40;
rangeMageMember.y = mageAiRangeState.player.y;
mageAiRangeState.enemy.x = rangeMageMember.x + 430;
mageAiRangeState.enemy.y = rangeMageMember.y;
const mageRangeStart = distance(rangeMageMember, mageAiRangeState.enemy);
for (let tick = 0; tick < 96; tick += 1) {
  updatePartyCompanions(mageAiRangeState, 0.016, []);
}
assert(distance(rangeMageMember, mageAiRangeState.enemy) < mageRangeStart - 24, "mage companion should close toward shorter-range lattice attacks");
assert(mageAiRangeState.combat.moonBurstEffects.length > 0, "mage companion should get in range and fire Moonveil Flourish");

const mageProjectileState = createInitialGameState("mage");
mageProjectileState.selectedClassId = "warrior";
mageProjectileState.enemy.visible = true;
mageProjectileState.enemy.state = "idle";
mageProjectileState.enemy.health = mageProjectileState.enemy.maxHealth;
mageProjectileState.combat.targetLocked = true;
mageProjectileState.enemy.x = mageProjectileState.player.x + 360;
mageProjectileState.enemy.y = mageProjectileState.player.y;
let sawMagePendingMissile = false;
let sawMageMissileInFlight = false;
for (let tick = 0; tick < 28; tick += 1) {
  updateSimulation(mageProjectileState, createInputState(), 0.016);
  sawMagePendingMissile ||= !!mageProjectileState.combat.pendingMagicMissileCast;
  sawMageMissileInFlight ||= mageProjectileState.combat.magicMissiles.length > 0;
}
assert(sawMagePendingMissile, "active mage basic attack should queue a magic missile cast");
assert(sawMageMissileInFlight, "active mage basic attack should leave a magic missile visible in flight");

const mageOpeningRangeState = createInitialGameState("mage");
mageOpeningRangeState.ui.isTitleActive = false;
mageOpeningRangeState.enemy.visible = true;
mageOpeningRangeState.enemy.state = "idle";
mageOpeningRangeState.enemy.health = mageOpeningRangeState.enemy.maxHealth;
mageOpeningRangeState.enemy.x = world.enemySpawn.x;
mageOpeningRangeState.enemy.y = world.enemySpawn.y;
mageOpeningRangeState.combat.targetLocked = true;
const mageOpeningBasicSlot = activeLatticeSequence(mageOpeningRangeState)[0];
assert(mageOpeningBasicSlot?.kind === "basic_attack_1", "mage opening smoke should use Basic Attack 1");
assert(
  mageOpeningBasicSlot.range >= distance(mageOpeningRangeState.player, mageOpeningRangeState.enemy),
  "mage Basic Attack should cover the opening encounter distance",
);
updateSimulation(mageOpeningRangeState, createInputState(), 0.016);
assert(
  mageOpeningRangeState.combat.pendingMagicMissileCast?.visual === "magicMissile",
  "mage opening basic attack should immediately queue Magic Missile from spawn range",
);

const mageAttackAnimationState = createInitialGameState("mage");
mageAttackAnimationState.enemy.visible = true;
mageAttackAnimationState.enemy.state = "idle";
mageAttackAnimationState.enemy.health = mageAttackAnimationState.enemy.maxHealth;
mageAttackAnimationState.enemy.x = mageAttackAnimationState.player.x + 360;
mageAttackAnimationState.enemy.y = mageAttackAnimationState.player.y;
mageAttackAnimationState.combat.targetLocked = true;
mageAttackAnimationState.player.autoCount = 1;
let sawMageAttackFolderAnimation = false;
let sawMageSideSlashAnimation = false;
let sawMageOnlyMagicMissileVisual = false;
for (let tick = 0; tick < 8; tick += 1) {
  updateSimulation(mageAttackAnimationState, createInputState(), 0.016);
  sawMageAttackFolderAnimation ||= mageAttackAnimationState.player.anim === "attack1";
  sawMageSideSlashAnimation ||= mageAttackAnimationState.player.anim === "attack1_side_slash";
  sawMageOnlyMagicMissileVisual ||= mageAttackAnimationState.combat.pendingMagicMissileCast?.visual === "magicMissile";
}
assert(sawMageAttackFolderAnimation, "mage basic attack should use the attack folder animation");
assert(!sawMageSideSlashAnimation, "mage basic attack should not use alternate side-slash casts");
assert(sawMageOnlyMagicMissileVisual, "mage basic attack should only queue the Magic Missile projectile visual");

const partyWipeState = createInitialGameState("warrior");
assert(togglePartyClassSelection(partyWipeState, "mage"), "party wipe smoke should create a two-member party");
const partyWipeCompanion = partyWipeState.party.members.find((member) => member.id !== partyWipeState.player.id);
assert(partyWipeCompanion, "party wipe smoke should have a companion");
partyWipeCompanion.lifeState = "dead";
partyWipeCompanion.health = 0;
dealPartyMemberDamage(partyWipeState, partyWipeState.player, partyWipeState.player.maxHealth, "Smoke wipe", []);
assert(partyWipeState.combat.playerRespawnTimer > 0, "damage helper should trigger the party wipe respawn flow when all members are downed");

const debugOptions = debugEncounterOptions();
assert(debugOptions.length >= 5, "debug menu should expose authored encounters");
const debugTeleportState = createInitialGameState("warrior");
teleportToDebugEncounter(debugTeleportState, debugOptions[2].encounterIndex);
assert(debugTeleportState.combat.roomIndex === debugOptions[2].roomIndex, "debug teleport should set the target room");
assert(debugTeleportState.enemy.visible && debugTeleportState.combat.targetLocked, "debug teleport should spawn and lock the encounter");
assert(debugTeleportState.round.phase === "battle", "debug teleport should enter the autobattler battle phase");

const autobattleRoundState = createInitialGameState("warrior");
teleportToDebugEncounter(autobattleRoundState, debugOptions[0].encounterIndex);
autobattleRoundState.extraEnemies.length = 0;
autobattleRoundState.enemy.health = 1;
const startingGold = autobattleRoundState.round.gold;
dealEnemyDamage(autobattleRoundState, 1, "Smoke victory", []);
updateSimulation(autobattleRoundState, createInputState(), 0.016);
assert(autobattleRoundState.round.phase === "victory", "defeating the encounter should enter victory phase");
assert(autobattleRoundState.round.gold > startingGold, "victory should award gold");
const awardedGold = autobattleRoundState.round.gold;
updateSimulation(autobattleRoundState, createInputState(), 0.016);
assert(autobattleRoundState.round.gold === awardedGold, "victory gold should only be awarded once");
for (let tick = 0; tick < 90; tick += 1) {
  updateSimulation(autobattleRoundState, createInputState(), 0.016);
}
assert(autobattleRoundState.round.phase === "shop", "victory should settle into the shop phase");
assert(autobattleRoundState.round.shop.inventory.length >= 3, "shop phase should roll gear offers");
const firstShopItem = autobattleRoundState.round.shop.inventory[0];
autobattleRoundState.round.gold = firstShopItem.price;
const inventoryCountBeforeShopBuy = autobattleRoundState.combat.inventoryItems.length;
const shopBuyEvents = buyShopItem(autobattleRoundState, firstShopItem.id);
assert(autobattleRoundState.round.gold === 0, "shop purchases should subtract gold");
assert(autobattleRoundState.combat.inventoryItems.length === inventoryCountBeforeShopBuy + 1, "shop purchases should add gear to inventory");
assert(
  shopBuyEvents.some((event) => event.kind === "log" && event.message.includes("Bought")),
  "shop purchases should emit a buy log",
);
autobattleRoundState.round.gold = autobattleRoundState.round.shop.rerollCost;
const previousShopIds = autobattleRoundState.round.shop.inventory.map((item) => item.id).join(",");
rerollShop(autobattleRoundState);
assert(autobattleRoundState.round.gold === 0, "shop reroll should subtract its cost");
assert(autobattleRoundState.round.shop.inventory.length >= 3, "shop reroll should create new offers");
assert(autobattleRoundState.round.shop.inventory.map((item) => item.id).join(",") !== previousShopIds, "shop reroll should replace offers");
const roomBeforeShopStart = autobattleRoundState.combat.roomIndex;
startNextAutobattleRound(autobattleRoundState);
assert(autobattleRoundState.round.phase === "battle", "shop start should enter battle phase");
assert(autobattleRoundState.combat.roomIndex === roomBeforeShopStart + 1, "shop start should advance to the next encounter");

debugOptions.forEach((option) => {
  const debugDeathState = createInitialGameState("warrior");
  grantFullStarterGear(debugDeathState);
  teleportToDebugEncounter(debugDeathState, option.encounterIndex);
  defeatPlayer(debugDeathState, []);
  for (let tick = 0; tick < 260; tick += 1) {
    updateSimulation(debugDeathState, createInputState(), 0.016);
  }
  assert(debugDeathState.player.lifeState === "alive", `debug teleport room ${option.roomIndex} should recover after player death`);
  assert(debugDeathState.combat.roomIndex === option.roomIndex, `debug teleport room ${option.roomIndex} should not change rooms while dead`);
});
const legacyDebugState = createInitialGameState("warrior");
const legacyCombat = legacyDebugState.combat as Partial<typeof legacyDebugState.combat>;
delete legacyCombat.briarheartSkewers;
delete legacyCombat.briarheartSeeds;
delete legacyCombat.woundclockBolts;
delete legacyCombat.woundclockRifts;
teleportToDebugEncounter(legacyDebugState, debugOptions[debugOptions.length - 1].encounterIndex);
defeatPlayer(legacyDebugState, []);
updateSimulation(legacyDebugState, createInputState(), 0.016);
assert(Array.isArray(legacyDebugState.combat.briarheartSkewers), "debug teleport should hydrate missing Briarheart arrays");
assert(Array.isArray(legacyDebugState.combat.woundclockBolts), "debug teleport should hydrate missing Woundclock arrays");

const tutorialState = createInitialGameState("warrior");
tutorialState.player.x = tutorialState.intro.codger.x;
tutorialState.player.y = tutorialState.intro.codger.y;
const codgerGiftEvents = interactWithCodger(tutorialState);
assert(tutorialState.intro.tutorial.step === "equipAmulet", "talking to Codger should start the amulet tutorial");
assert(tutorialState.combat.droppedGear?.slot === "amulet", "Codger should offer the starter amulet as loot");
assert(!canUseIntroStairs(tutorialState), "intro stairs should stay gated before tutorial completion");
assert(codgerGiftEvents.some((event) => event.kind === "sound" && event.id === "codgerTutorialTrialBegin"), "Codger tutorial should emit the first voice hook");
equipDropToSlot(tutorialState, "amulet");
maybeAdvanceCodgerAmuletEquipped(tutorialState);
assert(tutorialState.intro.tutorial.step === "amuletEquippedChoice", "equipping the amulet should reveal tutorial continue or skip");
skipCodgerTutorial(tutorialState);
assert(tutorialState.intro.tutorial.completionReason === "skipped", "skip should persist a skipped tutorial completion reason");
assert(canUseIntroStairs(tutorialState), "skipping after the amulet should unlock the stairs");

const guidedTutorialState = createInitialGameState("warrior");
guidedTutorialState.player.x = guidedTutorialState.intro.codger.x;
guidedTutorialState.player.y = guidedTutorialState.intro.codger.y;
interactWithCodger(guidedTutorialState);
equipDropToSlot(guidedTutorialState, "amulet");
maybeAdvanceCodgerAmuletEquipped(guidedTutorialState);
continueCodgerTutorial(guidedTutorialState);
assert(guidedTutorialState.intro.tutorial.step === "openLattice", "continuing should ask the player to open the Branch Lattice");
advanceCodgerLatticeTutorial(guidedTutorialState);
advanceCodgerLatticeTutorial(guidedTutorialState);
advanceCodgerLatticeTutorial(guidedTutorialState);
advanceCodgerLatticeTutorial(guidedTutorialState);
assert(guidedTutorialState.intro.tutorial.step === "autoAttackExplain", "lattice tour should end on the auto attack explanation");
continueCodgerTutorial(guidedTutorialState);
assert(guidedTutorialState.intro.tutorial.step === "bloomMeterExplain", "auto attack explanation should advance to Bloom Meter");
continueCodgerTutorial(guidedTutorialState);
assert(guidedTutorialState.intro.tutorial.step === "motherLoadExplain", "Bloom Meter explanation should advance to Mother Load");
continueCodgerTutorial(guidedTutorialState);
assert(guidedTutorialState.intro.tutorial.completionReason === "completed", "guided tutorial should persist completed tutorial state");
assert(canUseIntroStairs(guidedTutorialState), "completing the guided tutorial should unlock the stairs");

assert(applySelectedClass(state, "mage"), "implemented mage class should apply");
assert(state.player.maxHealth === 95, "mage health should be copied into player state");
assert(!state.combat.equippedItems.amulet, "switching to mage should remove the warrior starter amulet");

const farPoint = { x: world.center.x + 5000, y: world.center.y + 5000 };
clampToArena(farPoint);
assert(distance(farPoint, world.center) < world.safeRadius * 1.1, "arena clamp should pull far point near safe radius");

state.player.stamina = 100;
const input = createInputState();
input.pressedActions.add("dodge");
const dodgeEvents = updateSimulation(state, input, 0.016);
assert(state.player.invulnerableTime > 0, "dodge should grant invulnerability time");
assert(dodgeEvents.some((event) => event.kind === "log" && event.message === "Dodge window"), "dodge should emit a log event");

const noTargetFacingState = createInitialGameState("warrior");
noTargetFacingState.player.direction = "up";
noTargetFacingState.enemy.state = "idle";
noTargetFacingState.enemy.visible = true;
noTargetFacingState.enemy.health = noTargetFacingState.enemy.maxHealth;
noTargetFacingState.enemy.x = noTargetFacingState.player.x + 80;
noTargetFacingState.enemy.y = noTargetFacingState.player.y + 80;
noTargetFacingState.combat.targetLocked = false;
updateSimulation(noTargetFacingState, createInputState(), 0.016);
assert(noTargetFacingState.player.direction === "up", "cleared target should leave idle facing controlled by movement");

const nightbloomState = createInitialGameState("warrior");
nightbloomState.combat.roomIndex = 4;
spawnRoomEnemy(nightbloomState);
assert(nightbloomState.enemy.monsterId === "nightbloom_matriarch", "room 4 should spawn Nightbloom Matriarch");
assert(nightbloomState.extraEnemies.length === 0, "Nightbloom Matriarch room should be a solo boss encounter");
assert(JSON.stringify(nightbloomState).includes("nightbloomThorns"), "nightbloom state should remain JSON serializable");

nightbloomState.player.x = nightbloomState.enemy.x + 260;
nightbloomState.player.y = nightbloomState.enemy.y;
nightbloomState.enemy.health = Math.floor(nightbloomState.enemy.maxHealth * 0.5) - 1;
const phaseEvents = updateSimulation(nightbloomState, createInputState(), 0.016);
assert(nightbloomState.enemy.phaseBloomed, "Nightbloom should phase bloom once below half health");
assert(nightbloomState.enemy.currentAttack === "phase_bloom", "Nightbloom phase change should use the phase_bloom attack");
assert(phaseEvents.some((event) => event.kind === "sound" && event.id === "nightbloomPhase"), "Nightbloom phase change should emit a phase sound hook");

function primeNightbloomAttack(attack: typeof nightbloomState.enemy.currentAttack) {
  nightbloomState.enemy.phaseBloomed = true;
  nightbloomState.enemy.state = "windup";
  nightbloomState.enemy.currentAttack = attack;
  nightbloomState.enemy.stateTimer = 0.001;
  nightbloomState.enemy.attackForward = { x: 1, y: 0 };
  nightbloomState.enemy.attackTarget = { x: nightbloomState.player.x, y: nightbloomState.player.y };
  nightbloomState.enemy.visible = true;
  nightbloomState.enemy.health = nightbloomState.enemy.maxHealth;
  nightbloomState.player.lifeState = "alive";
  nightbloomState.player.health = nightbloomState.player.maxHealth;
  nightbloomState.player.invulnerableTime = 0;
  clearRoomProjectiles(nightbloomState);
}

primeNightbloomAttack("thorn_lance");
updateSimulation(nightbloomState, createInputState(), 0.016);
assert(nightbloomState.combat.nightbloomThorns.length === 1, "thorn_lance should spawn a thorn projectile");

primeNightbloomAttack("petal_fan");
updateSimulation(nightbloomState, createInputState(), 0.016);
assert(nightbloomState.combat.nightbloomPetals.length === 7, "phase two petal_fan should spawn seven petals");

primeNightbloomAttack("root_snare");
updateSimulation(nightbloomState, createInputState(), 0.016);
assert(nightbloomState.combat.nightbloomRootBursts.length === 5, "phase two root_snare should spawn five root bursts");
const rootHealthBeforeHit = nightbloomState.player.health;
updateSimulation(nightbloomState, createInputState(), 0.5);
assert(nightbloomState.player.health < rootHealthBeforeHit, "root bursts should damage only after their delayed active window");

primeNightbloomAttack("nightbloom_nova");
updateSimulation(nightbloomState, createInputState(), 0.016);
assert(nightbloomState.combat.nightbloomNovaWaves.length === 1, "nightbloom_nova should spawn one expanding nova wave");

nightbloomState.combat.nightbloomThorns.push({ x: 0, y: 0, vx: 0, vy: 0, rotation: 0, radius: 1, damage: 1, timer: 0, duration: 1 });
nightbloomState.combat.nightbloomPetals.push({ x: 0, y: 0, vx: 0, vy: 0, rotation: 0, radius: 1, damage: 1, timer: 0, duration: 1 });
defeatPlayer(nightbloomState, []);
assert(nightbloomState.combat.nightbloomThorns.length === 0, "player death should clear Nightbloom thorns");
assert(nightbloomState.combat.nightbloomPetals.length === 0, "player death should clear Nightbloom petals");

const obsidianState = createInitialGameState("warrior");
obsidianState.combat.roomIndex = 5;
spawnRoomEnemy(obsidianState);
assert(obsidianState.enemy.monsterId === "obsidian_reliquary", "room 5 should spawn Obsidian Reliquary");
assert(obsidianState.extraEnemies.length === 0, "Obsidian Reliquary room should be a solo boss encounter");
assert(JSON.stringify(obsidianState).includes("obsidianLances"), "obsidian state should remain JSON serializable");

obsidianState.player.x = obsidianState.enemy.x + 250;
obsidianState.player.y = obsidianState.enemy.y;
obsidianState.enemy.health = Math.floor(obsidianState.enemy.maxHealth * 0.45) - 1;
const obsidianPhaseEvents = updateSimulation(obsidianState, createInputState(), 0.016);
assert(obsidianState.enemy.phaseBloomed, "Obsidian Reliquary should phase rupture once below its health gate");
assert(obsidianState.enemy.currentAttack === "phase_rupture", "Obsidian phase change should use the phase_rupture attack");
assert(obsidianPhaseEvents.some((event) => event.kind === "log" && event.message === "Reliquary rupture"), "Obsidian phase change should emit a readable log");

function primeObsidianAttack(attack: typeof obsidianState.enemy.currentAttack) {
  obsidianState.enemy.phaseBloomed = true;
  obsidianState.enemy.state = "windup";
  obsidianState.enemy.currentAttack = attack;
  obsidianState.enemy.stateTimer = 0.001;
  obsidianState.enemy.attackForward = { x: 1, y: 0 };
  obsidianState.enemy.attackTarget = { x: obsidianState.player.x, y: obsidianState.player.y };
  obsidianState.enemy.visible = true;
  obsidianState.enemy.health = obsidianState.enemy.maxHealth;
  obsidianState.player.lifeState = "alive";
  obsidianState.player.health = obsidianState.player.maxHealth;
  obsidianState.player.invulnerableTime = 0;
  clearRoomProjectiles(obsidianState);
}

primeObsidianAttack("glass_lance");
updateSimulation(obsidianState, createInputState(), 0.016);
assert(obsidianState.combat.obsidianLances.length === 1, "glass_lance should spawn one lance projectile");

primeObsidianAttack("shard_spiral");
updateSimulation(obsidianState, createInputState(), 0.016);
assert(obsidianState.combat.obsidianShards.length === 12, "phase two shard_spiral should spawn twelve shards");

primeObsidianAttack("reliquary_smite");
updateSimulation(obsidianState, createInputState(), 0.016);
assert(obsidianState.combat.obsidianSmites.length === 5, "phase two reliquary_smite should spawn five smite hazards");
const obsidianSmiteHealthBeforeHit = obsidianState.player.health;
updateSimulation(obsidianState, createInputState(), 0.5);
assert(obsidianState.player.health < obsidianSmiteHealthBeforeHit, "smite hazards should damage after their delayed active window");

primeObsidianAttack("penitent_wheel");
updateSimulation(obsidianState, createInputState(), 0.016);
assert(obsidianState.combat.obsidianWheels.length === 1, "penitent_wheel should spawn one expanding wheel");

obsidianState.combat.obsidianLances.push({ x: 0, y: 0, vx: 0, vy: 0, rotation: 0, radius: 1, damage: 1, timer: 0, duration: 1 });
obsidianState.combat.obsidianShards.push({ x: 0, y: 0, vx: 0, vy: 0, rotation: 0, radius: 1, damage: 1, timer: 0, duration: 1 });
defeatPlayer(obsidianState, []);
assert(obsidianState.combat.obsidianLances.length === 0, "player death should clear Obsidian lances");
assert(obsidianState.combat.obsidianShards.length === 0, "player death should clear Obsidian shards");

const abyssalState = createInitialGameState("warrior");
abyssalState.combat.roomIndex = 6;
spawnRoomEnemy(abyssalState);
assert(abyssalState.enemy.monsterId === "abyssal_bellwraith", "room 6 should spawn Abyssal Bellwraith");
assert(abyssalState.extraEnemies.length === 0, "Abyssal Bellwraith room should be a solo boss encounter");
assert(JSON.stringify(abyssalState).includes("abyssalBellShards"), "abyssal state should remain JSON serializable");

abyssalState.player.x = abyssalState.enemy.x + 250;
abyssalState.player.y = abyssalState.enemy.y;
abyssalState.enemy.health = Math.floor(abyssalState.enemy.maxHealth * 0.5) - 1;
const abyssalPhaseEvents = updateSimulation(abyssalState, createInputState(), 0.016);
assert(abyssalState.enemy.phaseBloomed, "Abyssal Bellwraith should phase toll once below its health gate");
assert(abyssalState.enemy.currentAttack === "phase_toll", "Abyssal phase change should use the phase_toll attack");
assert(abyssalPhaseEvents.some((event) => event.kind === "log" && event.message === "Abyssal toll"), "Abyssal phase change should emit a readable log");

function primeAbyssalAttack(attack: typeof abyssalState.enemy.currentAttack) {
  abyssalState.enemy.phaseBloomed = true;
  abyssalState.enemy.state = "windup";
  abyssalState.enemy.currentAttack = attack;
  abyssalState.enemy.stateTimer = 0.001;
  abyssalState.enemy.attackForward = { x: 1, y: 0 };
  abyssalState.enemy.attackTarget = { x: abyssalState.player.x, y: abyssalState.player.y };
  abyssalState.enemy.visible = true;
  abyssalState.enemy.health = abyssalState.enemy.maxHealth;
  abyssalState.player.lifeState = "alive";
  abyssalState.player.health = abyssalState.player.maxHealth;
  abyssalState.player.invulnerableTime = 0;
  clearRoomProjectiles(abyssalState);
}

primeAbyssalAttack("bell_shard");
updateSimulation(abyssalState, createInputState(), 0.016);
assert(abyssalState.combat.abyssalBellShards.length === 1, "bell_shard should spawn one shard projectile");

primeAbyssalAttack("tolling_fan");
updateSimulation(abyssalState, createInputState(), 0.016);
assert(abyssalState.combat.abyssalFanShards.length === 11, "phase two tolling_fan should spawn eleven shards");

primeAbyssalAttack("grave_mark");
updateSimulation(abyssalState, createInputState(), 0.016);
assert(abyssalState.combat.abyssalGraveMarks.length === 5, "phase two grave_mark should spawn five toll hazards");
const abyssalMarkHealthBeforeHit = abyssalState.player.health;
updateSimulation(abyssalState, createInputState(), 0.52);
assert(abyssalState.player.health < abyssalMarkHealthBeforeHit, "grave marks should damage after their delayed active window");

primeAbyssalAttack("dirge_nova");
updateSimulation(abyssalState, createInputState(), 0.016);
assert(abyssalState.combat.abyssalNovas.length === 2, "phase two dirge_nova should spawn two expanding rings");

abyssalState.combat.abyssalBellShards.push({ x: 0, y: 0, vx: 0, vy: 0, rotation: 0, radius: 1, damage: 1, timer: 0, duration: 1 });
abyssalState.combat.abyssalFanShards.push({ x: 0, y: 0, vx: 0, vy: 0, rotation: 0, radius: 1, damage: 1, timer: 0, duration: 1 });
defeatPlayer(abyssalState, []);
assert(abyssalState.combat.abyssalBellShards.length === 0, "player death should clear Abyssal bell shards");
assert(abyssalState.combat.abyssalFanShards.length === 0, "player death should clear Abyssal fan shards");

const briarheartState = createInitialGameState("warrior");
briarheartState.combat.roomIndex = 7;
spawnRoomEnemy(briarheartState);
assert(briarheartState.enemy.monsterId === "briarheart_sovereign", "room 7 should spawn Briarheart Sovereign");
assert(briarheartState.extraEnemies.length === 0, "Briarheart Sovereign room should be a solo boss encounter");
assert(JSON.stringify(briarheartState).includes("briarheartSkewers"), "briarheart state should remain JSON serializable");

briarheartState.player.x = briarheartState.enemy.x + 250;
briarheartState.player.y = briarheartState.enemy.y;
briarheartState.enemy.health = Math.floor(briarheartState.enemy.maxHealth * 0.45) - 1;
const briarheartPhaseEvents = updateSimulation(briarheartState, createInputState(), 0.016);
assert(briarheartState.enemy.phaseBloomed, "Briarheart Sovereign should bloom once below its health gate");
assert(briarheartState.enemy.currentAttack === "sovereign_bloom", "Briarheart phase change should use the sovereign_bloom attack");
assert(briarheartPhaseEvents.some((event) => event.kind === "log" && event.message === "Sovereign bloom"), "Briarheart phase change should emit a readable log");

function primeBriarheartAttack(attack: typeof briarheartState.enemy.currentAttack) {
  briarheartState.enemy.phaseBloomed = true;
  briarheartState.enemy.state = "windup";
  briarheartState.enemy.currentAttack = attack;
  briarheartState.enemy.stateTimer = 0.001;
  briarheartState.enemy.attackForward = { x: 1, y: 0 };
  briarheartState.enemy.attackTarget = { x: briarheartState.player.x, y: briarheartState.player.y };
  briarheartState.enemy.visible = true;
  briarheartState.enemy.health = briarheartState.enemy.maxHealth;
  briarheartState.player.lifeState = "alive";
  briarheartState.player.health = briarheartState.player.maxHealth;
  briarheartState.player.invulnerableTime = 0;
  clearRoomProjectiles(briarheartState);
}

primeBriarheartAttack("briar_skewer");
updateSimulation(briarheartState, createInputState(), 0.016);
assert(briarheartState.combat.briarheartSkewers.length === 1, "briar_skewer should spawn one skewer projectile");

primeBriarheartAttack("seed_barrage");
updateSimulation(briarheartState, createInputState(), 0.016);
assert(briarheartState.combat.briarheartSeeds.length === 11, "phase two seed_barrage should spawn eleven seeds");

primeBriarheartAttack("strangler_grove");
updateSimulation(briarheartState, createInputState(), 0.016);
assert(briarheartState.combat.briarheartVineEruptions.length === 6, "phase two strangler_grove should spawn six vine hazards");
const briarheartVineHealthBeforeHit = briarheartState.player.health;
updateSimulation(briarheartState, createInputState(), 0.54);
assert(briarheartState.player.health < briarheartVineHealthBeforeHit, "vine eruptions should damage after their delayed active window");

primeBriarheartAttack("pollen_nova");
updateSimulation(briarheartState, createInputState(), 0.016);
assert(briarheartState.combat.briarheartPollenNovas.length === 1, "pollen_nova should spawn one expanding ring");

briarheartState.combat.briarheartSkewers.push({ x: 0, y: 0, vx: 0, vy: 0, rotation: 0, radius: 1, damage: 1, timer: 0, duration: 1 });
briarheartState.combat.briarheartSeeds.push({ x: 0, y: 0, vx: 0, vy: 0, rotation: 0, radius: 1, damage: 1, timer: 0, duration: 1 });
defeatPlayer(briarheartState, []);
assert(briarheartState.combat.briarheartSkewers.length === 0, "player death should clear Briarheart skewers");
assert(briarheartState.combat.briarheartSeeds.length === 0, "player death should clear Briarheart seeds");

state.selectedClassId = "mage";
state.player.lifeState = "alive";
state.player.meter = 120;
state.enemy.state = "idle";
state.enemy.visible = true;
state.enemy.health = state.enemy.maxHealth;
state.enemy.x = state.player.x + 80;
state.enemy.y = state.player.y;
const specialEvents = castSpecial(state, 0);
assert(activeWeaponSpecials(state)[0].id === "moonfall", "mage starting weapon special should be Moonfall");
assert(state.combat.cooldowns.moonfall > 0, "moonfall should set a cooldown");
assert(state.combat.pendingMoonfallCast, "moonfall should queue a pending cast");
assert(specialEvents.some((event) => event.kind === "sound" && event.id === "moonfallVoice"), "moonfall should emit sound events");

const mageMissileState = createInitialGameState("mage");
mageMissileState.ui.isTitleActive = false;
mageMissileState.enemy.visible = true;
mageMissileState.enemy.state = "idle";
mageMissileState.enemy.health = mageMissileState.enemy.maxHealth;
mageMissileState.enemy.x = mageMissileState.player.x + 480;
mageMissileState.enemy.y = mageMissileState.player.y;
mageMissileState.combat.targetLocked = true;
let mageMissileCast = false;
let mageMissileImpact = false;
const mageMissileHealthBefore = mageMissileState.enemy.health;
for (let frame = 0; frame < 120; frame += 1) {
  const missileEvents = updateSimulation(mageMissileState, createInputState(), 0.016);
  mageMissileCast ||= missileEvents.some((event) => event.kind === "sound" && event.id === "magicMissileCast");
  mageMissileImpact ||= missileEvents.some((event) => event.kind === "sound" && event.id === "magicMissileImpact");
}
assert(mageMissileCast, "mage basic attack should queue a Magic Missile cast sound");
assert(mageMissileImpact, "mage Magic Missile should emit an impact sound when it lands");
assert(mageMissileState.enemy.health < mageMissileHealthBefore, "mage Magic Missile should damage the locked target");
assert(mageMissileState.player.meter > 0, "mage Magic Missile hit should grant Bloom Meter");

state.player.invulnerableTime = 0;
state.enemy.state = "active";
state.enemy.currentAttack = "rock_slam";
state.enemy.stateTimer = 0.2;
state.enemy.x = state.player.x;
state.enemy.y = state.player.y;
const healthBeforeHit = state.player.health;
updateSimulation(state, createInputState(), 0.016);
assert(state.player.health < healthBeforeHit, "active rock slam should damage a nearby non-invulnerable player");

state.player.health = state.player.maxHealth;
state.player.invulnerableTime = 0;
state.enemy.state = "windup";
state.enemy.currentAttack = "rock_slam";
state.enemy.anim = "rock_slam";
state.enemy.animFrame = 0;
state.enemy.animTimer = 0;
state.enemy.stateTimer = 0.01;
state.enemy.hasHitPlayer = false;
state.enemy.rockSlamCrashPlayed = false;
state.enemy.x = state.player.x;
state.enemy.y = state.player.y;
const healthBeforeSyncedSlam = state.player.health;
const syncedSlamEvents = updateSimulation(state, createInputState(), 0.016, {
  playerFrameCount: () => 1,
  monsterFrameCount: () => 8,
  moonfallFrameCount: () => 1,
  codgerFrameCount: () => 1,
});
assert(state.enemy.state === "active", "rock slam should become active after windup expires");
assert(state.enemy.animFrame === 7, "rock slam should reach its final frame when damage is dealt");
assert(state.player.health < healthBeforeSyncedSlam, "rock slam should deal damage on the final frame transition");
assert(syncedSlamEvents.some((event) => event.kind === "sound" && event.id === "golemRockSlamCrash"), "rock slam final frame should emit crash sound");

state.player.health = state.player.maxHealth;
state.player.invulnerableTime = 0;
state.enemy.state = "windup";
state.enemy.currentAttack = "rock_spray";
state.enemy.anim = "rock_spray";
state.enemy.animFrame = 0;
state.enemy.animTimer = 0;
state.enemy.stateTimer = 0.01;
state.enemy.hasHitPlayer = false;
state.enemy.attackForward = { x: 1, y: 0 };
state.enemy.x = state.player.x - 80;
state.enemy.y = state.player.y;
const healthBeforeSyncedSpray = state.player.health;
updateSimulation(state, createInputState(), 0.016, {
  playerFrameCount: () => 1,
  monsterFrameCount: () => 8,
  moonfallFrameCount: () => 1,
  codgerFrameCount: () => 1,
});
assert(state.enemy.state === "active", "rock spray should become active after windup expires");
assert(state.enemy.animFrame === 7, "rock spray should reach its final frame when damage is dealt");
assert(state.player.health < healthBeforeSyncedSpray, "rock spray should deal damage on the final frame transition");

const combatTextState = createInitialGameState("warrior");
combatTextState.enemy.visible = true;
combatTextState.enemy.state = "idle";
dealEnemyDamage(combatTextState, 13, "Smoke Test", []);
assert(combatTextState.combat.floatingCombatTexts[0]?.value === 13, "dealing damage should spawn floating combat text");
updateSimulation(combatTextState, createInputState(), 1);
assert(combatTextState.combat.floatingCombatTexts.length === 0, "floating combat text should expire after its duration");

for (let index = 0; index < 25; index += 1) {
  const gear = generateGear(state.selectedClassId);
  assert(["Common", "Uncommon", "Rare"].includes(gear.rarity), "gear rarity should be known");
  assert(
    ["weapon", "helmet", "bodyArmour", "gloves", "ring", "amulet", "pants", "boots"].includes(gear.slot),
    "gear slot should be known",
  );
  assert(gear.power >= 2 && gear.power <= 8, "gear power should stay in expected bounds");
  assert(Object.values(gear.stats).some((value) => value > 0), "generated gear should include at least one core stat roll");
  assert(
    gear.slot === "weapon" ? gear.frame.weaponSpecials.length > 0 : gear.frame.weaponSpecials.length === 0,
    "only generated weapons should include weapon specials",
  );
  assert(
    gear.slot === "weapon" ? gear.frame.latticeAbilityOptions.length === 0 : gear.frame.latticeAbilityOptions.length > 0,
    "only generated non-weapons should include lattice ability options",
  );
  assert(
    gear.slot === "weapon" ? gear.frame.modifierOptions.length === 0 : gear.frame.modifierOptions.length > 0,
    "only generated non-weapons should include frame modifier options",
  );
  const size = gearInventorySize(gear);
  assert(
    gear.slot === "ring" || gear.slot === "amulet" ? size.width === 1 && size.height === 1 : size.width === 2 && size.height === 2,
    "inventory size should be 1x1 for rings and amulets, 2x2 for everything else",
  );
}

const latticeState = createInitialGameState("warrior");
let bodyArmourDrop = generateGear("warrior");
for (let index = 0; index < 50 && bodyArmourDrop.slot !== "bodyArmour"; index += 1) {
  bodyArmourDrop = generateGear("warrior");
}
assert(bodyArmourDrop.slot === "bodyArmour", "test setup should generate body armour");
const bodyArmourSize = gearInventorySize(bodyArmourDrop);
latticeState.combat.inventoryItems.push({
  id: "test-body-armour",
  gear: bodyArmourDrop,
  classId: "warrior",
  slot: 0,
  width: bodyArmourSize.width,
  height: bodyArmourSize.height,
});
assert(
  !canEquipInventoryItemToSlot(latticeState, "test-body-armour", "helmet"),
  "body armour should not be accepted by the helmet slot",
);
equipInventoryItem(latticeState, "test-body-armour");
assert(latticeState.combat.equippedItems.bodyArmour === bodyArmourDrop, "body armour should equip into its slot");
assert(
  latticeState.combat.branchLattice.abilitySlotIds.length === branchLatticeAbilitySlotCount,
  "Branch Lattice should initialize configured ability slots",
);
assert(
  latticeState.combat.branchLattice.modifierSlotIds.length === branchLatticeModifierSlotCount,
  "Branch Lattice should initialize configured modifier slots",
);
const equippedBranchFrame = branchLatticeFrame(latticeState);
const basic = equippedBranchFrame.latticeAbilityOptions.find((option) => option.kind === "basic_attack_1");
const rootbreaker = equippedBranchFrame.latticeAbilityOptions.find((option) => option.kind === "rootbreaker_cleave");
const thornwall = equippedBranchFrame.latticeAbilityOptions.find((option) => option.kind === "thornwall_counter");
const haste = equippedBranchFrame.latticeAbilityOptions.find((option) => option.kind === "haste");
const combo = equippedBranchFrame.latticeAbilityOptions.find((option) => option.kind === "combo_attack");
const fire = equippedBranchFrame.modifierOptions.find((option) => option.id === "mod:fire");
assert(basic && rootbreaker && thornwall && haste && combo && fire, "equipped Warrior armour should expose basic, gear auto branches, haste, combo, and fire options");
assert(rootbreaker.source === "gear" && thornwall.source === "gear", "Rootbreaker and Thornwall should be inherited from gear, not class defaults");
assert(
  !latticeState.combat.branchLattice.abilitySlotIds.includes(rootbreaker.id)
    && !latticeState.combat.branchLattice.abilitySlotIds.includes(thornwall.id),
  "Warrior auto branches should be available in the Branch Lattice ability panel until slotted",
);
latticeState.combat.branchLattice.abilitySlotIds = [haste.id, basic.id, combo.id, null, ...Array(branchLatticeAbilitySlotCount).fill(null)]
  .slice(0, branchLatticeAbilitySlotCount);
latticeState.combat.branchLattice.modifierSlotIds = [null, fire.id, fire.id, null, ...Array(branchLatticeModifierSlotCount).fill(null)]
  .slice(0, branchLatticeModifierSlotCount);
latticeState.player.lifeState = "alive";
latticeState.enemy.state = "idle";
latticeState.enemy.visible = true;
latticeState.combat.targetLocked = true;
latticeState.enemy.health = latticeState.enemy.maxHealth;
latticeState.enemy.x = latticeState.player.x + 80;
latticeState.enemy.y = latticeState.player.y;
const loopEvents: GameEvent[] = [];
updateAutoAttack(latticeState, 0.016, loopEvents);
assert(latticeState.combat.autoLoop.hasteTimer > 0, "haste should apply a temporary speed buff");
assert(latticeState.combat.autoLoop.currentSlotIndex === 1, "auto loop should advance from haste to the next filled slot");
const hastedSlotTimer = latticeState.combat.autoLoop.slotTimer;
updateAutoAttack(latticeState, 0.1, loopEvents);
assert(latticeState.combat.autoLoop.slotTimer < hastedSlotTimer - 0.1, "haste should speed up subsequent sequence timing");
updateAutoAttack(latticeState, 1, loopEvents);
assert(latticeState.combat.autoLoop.currentSlotIndex === 2, "auto loop should execute Basic Attack before Combo Attack");
updateAutoAttack(latticeState, 1, loopEvents);
assert(latticeState.combat.autoLoop.restartTimer > 0, "auto loop should wait before restarting after the last filled slot");
assert(loopEvents.some((event) => event.kind === "log" && event.message.includes("Combo Attack")), "Combo Attack should execute after Basic Attack");
assert(activeLatticeSequence(latticeState).filter(Boolean).length === 3, "active lattice sequence should expose slotted auto abilities");

const warriorBranchState = createInitialGameState("warrior");
const warriorBranchFrame = branchLatticeFrame(warriorBranchState);
assert(
  !warriorBranchFrame.latticeAbilityOptions.some((option) => option.kind === "rootbreaker_cleave" || option.kind === "thornwall_counter"),
  "Rootbreaker and Thornwall should not appear in the default Warrior lattice",
);
assert(
  activeWeaponSpecials(warriorBranchState).every((special) => special.id !== "rootbreaker-cleave" && special.id !== "thornwall-counter"),
  "Rootbreaker and Thornwall should not be Bloom specials",
);
const warriorBranchGearFrame = createFrameGear("warrior", "Common");
warriorBranchGearFrame.weaponSpecials = [];
warriorBranchGearFrame.modifierOptions = [];
warriorBranchGearFrame.latticeAbilityOptions = warriorBranchGearFrame.latticeAbilityOptions.filter((option) => option.source !== "class");
warriorBranchState.combat.equippedItems.bodyArmour = {
  name: "Rootbreaker Test Harness",
  slot: "bodyArmour",
  rarity: "Common",
  power: 1,
  stats: { strength: 1 },
  ability: "Grants Warrior gear auto branches.",
  frame: warriorBranchGearFrame,
};
const warriorGearBranchFrame = branchLatticeFrame(warriorBranchState);
const warriorRootbreaker = warriorGearBranchFrame.latticeAbilityOptions.find((option) => option.kind === "rootbreaker_cleave");
const warriorThornwall = warriorGearBranchFrame.latticeAbilityOptions.find((option) => option.kind === "thornwall_counter");
assert(
  warriorRootbreaker?.source === "gear" && warriorThornwall?.source === "gear",
  "Warrior gear should expose Rootbreaker and Thornwall as gear-granted auto abilities",
);
warriorBranchState.combat.branchLattice.abilitySlotIds = [warriorRootbreaker.id, warriorThornwall.id, null, null, null];
warriorBranchState.player.lifeState = "alive";
warriorBranchState.enemy.state = "idle";
warriorBranchState.enemy.visible = true;
warriorBranchState.combat.targetLocked = true;
warriorBranchState.enemy.health = warriorBranchState.enemy.maxHealth;
warriorBranchState.enemy.x = warriorBranchState.player.x + 80;
warriorBranchState.enemy.y = warriorBranchState.player.y;
const warriorBranchEvents: GameEvent[] = [];
updateAutoAttack(warriorBranchState, 0.016, warriorBranchEvents);
assert(warriorBranchState.combat.rootbreakerShockwaves.length === 1, "Rootbreaker Cleave should execute from the auto loop");
updateAutoAttack(warriorBranchState, 2, warriorBranchEvents);
assert(warriorBranchState.combat.thornwallCounters.length === 1, "Thornwall Counter should execute from the auto loop");

const legacySpecialState = createInitialGameState("warrior");
legacySpecialState.combat.equippedGear.frame.weaponSpecials = [
  { key: "1", id: "motherload-breaker", name: "Motherload Breaker", cost: 55, cooldown: 9.5, range: 190 },
];
assert(
  activeWeaponSpecials(legacySpecialState)[0].tags?.includes("MotherLoad"),
  "legacy weapon specials should hydrate MotherLoad metadata from class defaults",
);

const motherspinState = createInitialGameState("warrior");
grantFullStarterGear(motherspinState);
motherspinState.player.lifeState = "alive";
motherspinState.player.meter = motherspinState.player.maxMeter;
motherspinState.enemy.state = "idle";
motherspinState.enemy.visible = true;
motherspinState.combat.targetLocked = true;
motherspinState.enemy.health = motherspinState.enemy.maxHealth;
motherspinState.enemy.x = motherspinState.player.x + 80;
motherspinState.enemy.y = motherspinState.player.y;
const motherspinIndex = activeWeaponSpecials(motherspinState).findIndex((special) => special.id === "motherspin");
assert(motherspinIndex >= 0, "debug starter amulet should add Motherspin to active specials");
const motherspinEvents = castSpecial(motherspinState, motherspinIndex);
assert(motherspinState.combat.motherslashWaves.length === 3, "Motherspin should spawn the original spin wave effect");
assert(motherspinState.player.specialAnim === null, "Motherspin should use the default attack2 special animation from green_warrior special frames");
assert(motherspinState.combat.motherLoadWindow.isActive, "Motherspin should prime Mother Load as a tagged damaging special");
assert(
  motherspinEvents.some((event) => event.kind === "log" && event.message === "Mother Spin"),
  "Mother Spin should emit a readable log event",
);

const motherLoadState = createInitialGameState("warrior");
motherLoadState.combat.equippedItems.amulet = createStartingAmulet("warrior");
const motherLoadFrame = branchLatticeFrame(motherLoadState);
const verdantGuillotine = motherLoadFrame.latticeAbilityOptions.find((option) => option.kind === "verdant_guillotine");
assert(verdantGuillotine, "warrior should expose Verdant Guillotine");
assert(activeWeaponSpecials(motherLoadState).length === 1 && activeWeaponSpecials(motherLoadState)[0].id === "motherspin", "warrior Bloom specials should only include Mother Spin");
motherLoadState.combat.branchLattice.abilitySlotIds = [verdantGuillotine.id, null, null, null, null];
motherLoadState.player.lifeState = "alive";
motherLoadState.player.meter = motherLoadState.player.maxMeter;
motherLoadState.enemy.state = "idle";
motherLoadState.enemy.visible = true;
motherLoadState.combat.targetLocked = true;
motherLoadState.enemy.health = motherLoadState.enemy.maxHealth;
motherLoadState.enemy.x = motherLoadState.player.x + 80;
motherLoadState.enemy.y = motherLoadState.player.y;
const verdantGuillotineStart = { x: motherLoadState.player.x, y: motherLoadState.player.y };
const motherLoadEvents: GameEvent[] = [];
updateAutoAttack(motherLoadState, 0.016, motherLoadEvents);
assert(!motherLoadState.combat.motherLoadWindow.isActive, "Verdant Guillotine should not open a Mother Load window");
assert(
  motherLoadState.player.x === verdantGuillotineStart.x && motherLoadState.player.y === verdantGuillotineStart.y,
  "Verdant Guillotine should not teleport the player to the target",
);
assert(!motherLoadEvents.some((event) => event.kind === "log" && event.message.includes("Mother Load")), "Finisher should not log a Mother Load window");
const firstMotherLoadEvents = castSpecial(motherLoadState, 0);
assert(motherLoadState.combat.motherLoadWindow.isActive, "first MotherLoad-tagged special should prime Mother Load");
assert(motherLoadState.combat.motherslashWaves.length === 3, "first Mother Spin should spawn cyclone waves");
assert(
  firstMotherLoadEvents.some((event) => event.kind === "log" && event.message === "Mother Spin Mother Load"),
  "first MotherLoad-tagged special should log the primed window",
);
motherLoadState.combat.cooldowns["motherspin"] = 0;
motherLoadState.player.meter = motherLoadState.player.maxMeter;
const specialMotherLoadEvents = castSpecial(motherLoadState, 0);
assert(motherLoadState.combat.motherLoadWindow.isActive, "empowered MotherLoad-tagged special should prime the next window");
assert(motherLoadState.combat.motherLoadWindow.sourceAbilityName === "Mother Spin", "continued Mother Load chain should remember the source special");
assert(motherLoadState.combat.verdantExplosions.length === 1, "Mother Load should queue the Warrior verdant explosion visual");
assert(
  specialMotherLoadEvents.some((event) => event.kind === "log" && event.message === "Mother Load triggered"),
  "Mother Load special consumption should emit a log event",
);

const clericHealState = createInitialGameState("cleric");
assert(activeWeaponSpecials(clericHealState).length === 1, "cleric starting weapon should expose Mother's Healing as its default special");
assert(activeWeaponSpecials(clericHealState)[0].id === "mothers-healing", "cleric starting special should be Mother's Healing");
assert(togglePartyClassSelection(clericHealState, "mage"), "cleric heal smoke should create a mage companion");
const clericHealMage = clericHealState.party.members.find((member) => member.classId === "mage");
assert(clericHealMage, "cleric heal smoke should find the mage companion");
clericHealState.player.meter = clericHealState.player.maxMeter;
clericHealMage.health = Math.max(1, clericHealMage.maxHealth - 28);
const clericTargetReadiedEvents = castSpecial(clericHealState, 0);
assert(clericHealState.party.pendingTargetedSpecial?.casterMemberId === clericHealState.player.id, "single-tap Mother's Healing should wait for a selected party target");
assert(clericTargetReadiedEvents.some((event) => event.kind === "log" && event.message === "Mother's Healing readied"), "single-tap Mother's Healing should log the targeting prompt");
const clericMageHealthBeforeTargetedHeal = clericHealMage.health;
const clericTargetedHealEvents = castPendingPartyTargetedSpecial(clericHealState, clericHealMage.id);
assert(clericHealMage.health > clericMageHealthBeforeTargetedHeal, "targeted Mother's Healing should heal the selected party member");
assert(clericHealState.combat.clericHealEffects.some((effect) => effect.targetMemberId === clericHealMage.id), "targeted Mother's Healing should spawn a heal envelope effect");
assert(clericTargetedHealEvents.some((event) => event.kind === "log" && event.message === "Mother's Healing"), "targeted Mother's Healing should emit a heal log");

const ringState = createInitialGameState("warrior");
let ringDrop = generateGear("warrior");
for (let index = 0; index < 80 && ringDrop.slot !== "ring"; index += 1) {
  ringDrop = generateGear("warrior");
}
assert(ringDrop.slot === "ring", "test setup should generate a ring");
const ringSize = gearInventorySize(ringDrop);
ringState.combat.inventoryItems.push({
  id: "test-ring",
  gear: ringDrop,
  classId: "warrior",
  slot: 0,
  width: ringSize.width,
  height: ringSize.height,
});
assert(canEquipInventoryItemToSlot(ringState, "test-ring", "ringTwo"), "rings should be accepted by either ring equipment slot");
equipInventoryItem(ringState, "test-ring", "ringTwo");
assert(ringState.combat.equippedItems.ringTwo === ringDrop, "drag-targeted ring equip should use the requested ring slot");

const lootEquipState = createInitialGameState("warrior");
let helmetDrop = generateGear("warrior");
for (let index = 0; index < 80 && helmetDrop.slot !== "helmet"; index += 1) {
  helmetDrop = generateGear("warrior");
}
assert(helmetDrop.slot === "helmet", "test setup should generate a helmet");
lootEquipState.combat.droppedGear = helmetDrop;
assert(canEquipDropToSlot(lootEquipState, "helmet"), "loot helmet should be accepted by the helmet equipment slot");
assert(!canEquipDropToSlot(lootEquipState, "boots"), "loot helmet should not be accepted by the boots equipment slot");
equipDropToSlot(lootEquipState, "helmet");
assert(lootEquipState.combat.equippedItems.helmet === helmetDrop, "drag-targeted loot equip should use the requested slot");
assert(!lootEquipState.combat.droppedGear, "drag-targeted loot equip should clear the loot drop");

latticeState.combat.branchLattice.abilitySlotIds[1] = "lattice:not-on-frame";
latticeState.combat.branchLattice.abilitySlotIds[2] = haste.id;
latticeState.combat.branchLattice.modifierSlotIds[0] = "mod:not-on-frame";
latticeState.combat.branchLattice.modifierSlotIds[2] = fire.id;
for (let index = 0; index < 200; index += 1) {
  const gear = generateGear("warrior");
  if (gear.slot === "weapon") {
    latticeState.combat.droppedGear = gear;
    break;
  }
}
assert(latticeState.combat.droppedGear?.slot === "weapon", "test setup should generate a weapon drop");
equipDrop(latticeState);
const normalizedBranchFrame = branchLatticeFrame(latticeState);
assert(
  latticeState.combat.branchLattice.abilitySlotIds.every((optionId) =>
    !optionId || normalizedBranchFrame.latticeAbilityOptions.some((option) => option.id === optionId),
  ),
  "equipping gear should clear incompatible lattice ability assignments",
);
assert(
  new Set(latticeState.combat.branchLattice.abilitySlotIds.filter(Boolean)).size ===
    latticeState.combat.branchLattice.abilitySlotIds.filter(Boolean).length,
  "equipping gear should clear duplicate lattice ability assignments",
);
assert(
  latticeState.combat.branchLattice.modifierSlotIds.every((optionId) =>
    !optionId || normalizedBranchFrame.modifierOptions.some((option) => option.id === optionId),
  ),
  "equipping gear should clear incompatible lattice modifier assignments",
);
assert(
  new Set(latticeState.combat.branchLattice.modifierSlotIds.filter(Boolean)).size ===
    latticeState.combat.branchLattice.modifierSlotIds.filter(Boolean).length,
  "equipping gear should clear duplicate lattice modifier assignments",
);
unequipGearSlot(latticeState, "bodyArmour");
assert(!latticeState.combat.equippedItems.bodyArmour, "body armour should unequip from its slot");
assert(
  !branchLatticeFrame(latticeState).modifierOptions.some((option) => option.id === "mod:fire"),
  "unequipping body armour should remove its modifiers from the Branch Lattice pool",
);
unequipGearSlot(latticeState, "weapon");
assert(!latticeState.combat.equippedItems.weapon, "weapon should unequip from its slot");
assert(latticeState.combat.equippedGear.power === 0, "unequipping weapon should leave a harmless fallback weapon");

console.log("simulation smoke passed");

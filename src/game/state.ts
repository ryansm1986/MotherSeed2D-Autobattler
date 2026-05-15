import { characterClasses, characterOrder } from "./content/classes";
import { world } from "./world/arena";
import type {
  AnimationName,
  AutoAttackLoopState,
  BranchLatticeState,
  CardinalDirectionName,
  ClassId,
  CombatState,
  DirectionName,
  FrameGear,
  GearDrop,
  GearEquipSlot,
  LatticeAbilityOption,
  MonsterId,
  MonsterAnimationName,
  PlayerLifeState,
  SpecialAbility,
  TelegraphKind,
  Vec2,
  WorldAssetName,
} from "./types";

export type Obstacle = { x: number; y: number; rx: number; ry: number; asset: WorldAssetName; scale: number };

export const branchLatticeAbilitySlotCount = 5;
export const branchLatticeModifierSlotCount = 6;
export const inventoryColumnCount = 7;
export const inventoryRowCount = 7;

export type PlayerState = Vec2 & {
  lifeState: PlayerLifeState;
  radius: number;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  meter: number;
  maxMeter: number;
  speed: number;
  sprintSpeed: number;
  sprintStaminaCost: number;
  staminaRegen: number;
  dodgeSpeed: number;
  dodgeTime: number;
  dodgeAnimTime: number;
  invulnerableTime: number;
  facing: Vec2;
  anim: AnimationName;
  direction: DirectionName;
  animTimer: number;
  animFrame: number;
  attackFlash: number;
  specialFlash: number;
  specialAnim: AnimationName | null;
  frontFlipSlashTime: number;
  autoTimer: number;
  autoCount: number;
};

export type EnemyState = Vec2 & {
  instanceId: string;
  monsterId: MonsterId;
  name: string;
  radius: number;
  health: number;
  maxHealth: number;
  state: CombatState;
  stateTimer: number;
  attackIndex: number;
  currentAttack: TelegraphKind;
  attackForward: Vec2;
  attackTarget: Vec2;
  attackCooldowns: Record<TelegraphKind, number>;
  hasHitPlayer: boolean;
  rockSlamCrashPlayed: boolean;
  phaseBloomed: boolean;
  chainTag: string;
  chainTimer: number;
  bleedTimer: number;
  bleedTick: number;
  flashTimer: number;
  anim: MonsterAnimationName;
  direction: DirectionName;
  animTimer: number;
  animFrame: number;
  visible: boolean;
};

export type MagicMissileProjectile = Vec2 & {
  ownerMemberId: PartyMemberId | null;
  visual?: "magicMissile" | "clericFireball";
  impactLabel?: string;
  chainTag?: string;
  chainDuration?: number;
  rotation: number;
  speed: number;
  damage: number;
  ttl: number;
};

export type MoonfallStrike = {
  x: number;
  startY: number;
  targetY: number;
  timer: number;
  duration: number;
  damage: number;
  radius: number;
  impacted: boolean;
  crashPlayed: boolean;
};

export type MotherslashWave = Vec2 & {
  timer: number;
  delay: number;
  duration: number;
  maxRadius: number;
  damage: number;
  chainTag: string;
  hitEnemyIds: string[];
};

export type EnemyRockThrowProjectile = Vec2 & {
  ownerMonsterId: MonsterId;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  timer: number;
  duration: number;
  rotation: number;
  spin: number;
};

export type ShroomSporeCloud = Vec2 & {
  radius: number;
  timer: number;
  duration: number;
  damage: number;
  hitTimer: number;
};

export type ShroomlingProjectile = Vec2 & {
  vx: number;
  vy: number;
  direction: CardinalDirectionName;
  radius: number;
  timer: number;
  tossDuration: number;
  duration: number;
  damage: number;
  attackTimer: number;
  chaseChompTimer: number;
};

export type TreeGoblinHeadProjectile = Vec2 & {
  ownerId: string;
  originX: number;
  originY: number;
  baseAngle: number;
  radius: number;
  timer: number;
  duration: number;
  damage: number;
  hitTimer: number;
};

export type NightbloomProjectile = Vec2 & {
  vx: number;
  vy: number;
  rotation: number;
  radius: number;
  damage: number;
  timer: number;
  duration: number;
};

export type NightbloomRootBurst = Vec2 & {
  radius: number;
  timer: number;
  delay: number;
  duration: number;
  damage: number;
  hasHit: boolean;
};

export type NightbloomNovaWave = Vec2 & {
  timer: number;
  duration: number;
  minRadius: number;
  maxRadius: number;
  damage: number;
  hasHit: boolean;
};

export type NightbloomPetalImpact = Vec2 & {
  timer: number;
  duration: number;
  rotation: number;
};

export type ObsidianProjectile = Vec2 & {
  vx: number;
  vy: number;
  rotation: number;
  radius: number;
  damage: number;
  timer: number;
  duration: number;
};

export type ObsidianSmite = Vec2 & {
  radius: number;
  timer: number;
  delay: number;
  duration: number;
  damage: number;
  hasHit: boolean;
};

export type ObsidianWheel = Vec2 & {
  timer: number;
  duration: number;
  minRadius: number;
  maxRadius: number;
  damage: number;
  hasHit: boolean;
};

export type ObsidianImpact = Vec2 & {
  timer: number;
  duration: number;
  rotation: number;
};

export type AbyssalProjectile = Vec2 & {
  vx: number;
  vy: number;
  rotation: number;
  radius: number;
  damage: number;
  timer: number;
  duration: number;
};

export type AbyssalGroundBurst = Vec2 & {
  radius: number;
  timer: number;
  delay: number;
  duration: number;
  damage: number;
  hasHit: boolean;
};

export type AbyssalNovaWave = Vec2 & {
  timer: number;
  delay: number;
  duration: number;
  minRadius: number;
  maxRadius: number;
  damage: number;
  hasHit: boolean;
};

export type AbyssalImpact = Vec2 & {
  timer: number;
  duration: number;
  rotation: number;
};

export type BriarheartProjectile = Vec2 & {
  vx: number;
  vy: number;
  rotation: number;
  radius: number;
  damage: number;
  timer: number;
  duration: number;
};

export type BriarheartVineEruption = Vec2 & {
  radius: number;
  timer: number;
  delay: number;
  duration: number;
  damage: number;
  hasHit: boolean;
};

export type BriarheartPollenNova = Vec2 & {
  timer: number;
  duration: number;
  minRadius: number;
  maxRadius: number;
  damage: number;
  hasHit: boolean;
};

export type BriarheartImpact = Vec2 & {
  timer: number;
  duration: number;
  rotation: number;
};

export type WoundclockProjectile = Vec2 & {
  vx: number;
  vy: number;
  rotation: number;
  radius: number;
  damage: number;
  timer: number;
  duration: number;
};

export type WoundclockGearOrb = Vec2 & {
  centerX: number;
  centerY: number;
  angle: number;
  angularSpeed: number;
  orbitRadius: number;
  vx: number;
  vy: number;
  rotation: number;
  radius: number;
  damage: number;
  timer: number;
  orbitDuration: number;
  duration: number;
  released: boolean;
};

export type WoundclockSweep = Vec2 & {
  startAngle: number;
  endAngle: number;
  length: number;
  width: number;
  timer: number;
  duration: number;
  damage: number;
  hasHit: boolean;
};

export type WoundclockRift = Vec2 & {
  radius: number;
  timer: number;
  delay: number;
  duration: number;
  damage: number;
  hasHit: boolean;
};

export type WoundclockImpact = Vec2 & {
  timer: number;
  duration: number;
  rotation: number;
};

export type PendingMagicMissileCast = {
  ownerMemberId: string | null;
  visual?: "magicMissile" | "clericFireball";
  impactLabel?: string;
  chainTag?: string;
  chainDuration?: number;
  damage: number;
  timer: number;
};

export type PendingMoonfallCast = {
  ownerMemberId: string | null;
  x: number;
  y: number;
  damage: number;
  radius: number;
  timer: number;
};

export type MotherLoadWindowState = {
  isActive: boolean;
  sourceAbilityId: string | null;
  sourceAbilityName: string | null;
};

export type VerdantExplosionEffect = Vec2 & {
  timer: number;
  duration: number;
  soundPlayed: boolean;
};

export type MoonwellBeamEffect = Vec2 & {
  timer: number;
  duration: number;
  soundPlayed: boolean;
};

export type MoonBurstEffect = Vec2 & {
  timer: number;
  duration: number;
  damage: number;
  radius: number;
  hasHit: boolean;
};

export type ClericHealEffect = Vec2 & {
  targetMemberId: PartyMemberId;
  timer: number;
  duration: number;
};

export type WarriorDirectionalEffect = Vec2 & {
  direction: CardinalDirectionName;
  timer: number;
  duration: number;
};

export type RootbreakerShockwave = WarriorDirectionalEffect & {
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  hitEnemyIds: string[];
  impactSoundPlayed: boolean;
};

export type ThornwallCounterEffect = WarriorDirectionalEffect & {
  damage: number;
  radius: number;
  hitEnemyIds: string[];
  bloomSoundPlayed: boolean;
  retaliateSoundPlayed: boolean;
};

export type MotherloadBreakerEffect = WarriorDirectionalEffect & {
  damage: number;
  radius: number;
  empowered: boolean;
  hasHit: boolean;
  hitSoundPlayed: boolean;
};

export type VerdantGuillotineEffect = WarriorDirectionalEffect & {
  damage: number;
  radius: number;
  hasHit: boolean;
  dropSoundPlayed: boolean;
};

export type FloatingCombatText = Vec2 & {
  id: string;
  kind: "enemyDamage";
  value: number;
  timer: number;
  duration: number;
  driftX: number;
};

export type CombatRuntimeState = {
  cooldowns: Record<string, number>;
  magicMissiles: MagicMissileProjectile[];
  moonfallStrikes: MoonfallStrike[];
  motherslashWaves: MotherslashWave[];
  verdantExplosions: VerdantExplosionEffect[];
  moonwellBeams: MoonwellBeamEffect[];
  moonBurstEffects: MoonBurstEffect[];
  clericHealEffects: ClericHealEffect[];
  rootbreakerShockwaves: RootbreakerShockwave[];
  thornwallCounters: ThornwallCounterEffect[];
  motherloadBreakers: MotherloadBreakerEffect[];
  verdantGuillotines: VerdantGuillotineEffect[];
  enemyRockThrows: EnemyRockThrowProjectile[];
  shroomSporeClouds: ShroomSporeCloud[];
  shroomlings: ShroomlingProjectile[];
  treeGoblinHeads: TreeGoblinHeadProjectile[];
  nightbloomThorns: NightbloomProjectile[];
  nightbloomPetals: NightbloomProjectile[];
  nightbloomRootBursts: NightbloomRootBurst[];
  nightbloomNovaWaves: NightbloomNovaWave[];
  nightbloomPetalImpacts: NightbloomPetalImpact[];
  obsidianLances: ObsidianProjectile[];
  obsidianShards: ObsidianProjectile[];
  obsidianSmites: ObsidianSmite[];
  obsidianWheels: ObsidianWheel[];
  obsidianImpacts: ObsidianImpact[];
  abyssalBellShards: AbyssalProjectile[];
  abyssalFanShards: AbyssalProjectile[];
  abyssalGraveMarks: AbyssalGroundBurst[];
  abyssalNovas: AbyssalNovaWave[];
  abyssalImpacts: AbyssalImpact[];
  briarheartSkewers: BriarheartProjectile[];
  briarheartSeeds: BriarheartProjectile[];
  briarheartVineEruptions: BriarheartVineEruption[];
  briarheartPollenNovas: BriarheartPollenNova[];
  briarheartImpacts: BriarheartImpact[];
  woundclockBolts: WoundclockProjectile[];
  woundclockGearOrbs: WoundclockGearOrb[];
  woundclockSweeps: WoundclockSweep[];
  woundclockRifts: WoundclockRift[];
  woundclockImpacts: WoundclockImpact[];
  floatingCombatTexts: FloatingCombatText[];
  nextFloatingCombatTextId: number;
  pendingMagicMissileCast: PendingMagicMissileCast | null;
  pendingMoonfallCast: PendingMoonfallCast | null;
  motherLoadWindow: MotherLoadWindowState;
  targetLocked: boolean;
  droppedGear: GearDrop | null;
  droppedGearSourceLabel: string | null;
  lootCorpseId: string | null;
  hoveredLootCorpseId: string | null;
  inventoryItems: InventoryBagItem[];
  nextInventoryItemId: number;
  equippedItems: Partial<Record<GearEquipSlot, GearDrop>>;
  equippedGear: GearDrop;
  branchLattice: BranchLatticeState;
  autoLoop: AutoAttackLoopState;
  playerRespawnTimer: number;
  respawnTimer: number;
  roomIndex: number;
  roomTransitionCooldown: number;
};

export type InventoryBagItem = {
  id: string;
  gear: GearDrop;
  classId: ClassId;
  slot: number;
  width: number;
  height: number;
};

export type PartyMemberId = string;

export type PartyMemberAiMode = "follow" | "engage" | "downed";

export type PartyMemberState = PlayerState & {
  id: PartyMemberId;
  classId: ClassId;
  partyIndex: number;
  aiMode: PartyMemberAiMode;
  aiThinkTimer: number;
  cooldowns: Record<string, number>;
  equippedItems: Partial<Record<GearEquipSlot, GearDrop>>;
  equippedGear: GearDrop;
  branchLattice: BranchLatticeState;
  autoLoop: AutoAttackLoopState;
  motherLoadWindow: MotherLoadWindowState;
};

export type PartyState = {
  members: PartyMemberState[];
  activeMemberId: PartyMemberId;
  selectedInventoryMemberId: PartyMemberId;
  selectedLatticeMemberId: PartyMemberId;
  motherLoadWindow: MotherLoadWindowState;
  pendingTargetedSpecial: PendingPartyTargetedSpecial | null;
};

export type PendingPartyTargetedSpecial = {
  casterMemberId: PartyMemberId;
  abilityIndex: number;
  abilityId: string;
  timer: number;
};

export const skillBarSlotCount = 9;

export type PartySkillBarOption = {
  id: string;
  memberId: PartyMemberId;
  abilityId: string;
  abilityIndex: number;
  key: string;
  memberName: string;
  memberGlyph: string;
  memberAccent: string;
  ability: SpecialAbility;
};

export type UiFlowState = {
  isTitleActive: boolean;
  isCharacterSelectActive: boolean;
  isPaused: boolean;
  isInventoryOpen: boolean;
  isLootOpen: boolean;
  isBranchLatticeOpen: boolean;
  pauseMenuSource: "gameplay" | "title" | null;
  showPartyHealthBars: boolean;
  skillBarBindings: Array<string | null>;
  openSkillBarSlot: number | null;
};

export type SoundEventId =
  | "moonfallVoice"
  | "moonwellVoice"
  | "moonwellEffect"
  | "mageMoonAwaits"
  | "moonfallPortal"
  | "moonfallCrash"
  | "golemRockSlamCrash"
  | "warriorSwordSwish"
  | "warriorSwordThump"
  | "warriorHyah"
  | "warriorByMothertree"
  | "warriorTimeForMotherload"
  | "warriorVerdantExplosionVoice"
  | "motherslashPulseWave"
  | "verdantExplosion"
  | "rootbreakerCleaveSlam"
  | "rootbreakerShockwaveTravel"
  | "rootbreakerImpact"
  | "thornwallGuard"
  | "thornwallBloom"
  | "thornwallRetaliate"
  | "motherloadBreakerCharge"
  | "motherloadBreakerHit"
  | "motherloadBreakerDetonation"
  | "verdantGuillotineLeap"
  | "verdantGuillotineDrop"
  | "shroomBiteSnap"
  | "shroomPoisonSpray"
  | "shroomSporeCloud"
  | "shroomMouthToss"
  | "shroomlingChomp"
  | "playerDodge"
  | "playerSprint"
  | "magicMissileCast"
  | "magicMissileImpact"
  | "radiantBrand"
  | "wardPulse"
  | "judgment"
  | "treeGoblinArmAttack"
  | "treeGoblinHeadThrow"
  | "treeGoblinHeadHit"
  | "mossGolemRockThrow"
  | "mossGolemRockImpact"
  | "mossGolemRockSpray"
  | "nightbloomCast"
  | "nightbloomThorn"
  | "nightbloomRootBurst"
  | "nightbloomNova"
  | "nightbloomPhase"
  | "nightbloomThornVoice"
  | "nightbloomPetalFanVoice"
  | "nightbloomRootSnareVoice"
  | "nightbloomNovaVoice"
  | "nightbloomPhaseVoice"
  | "codgerTutorialTrialBegin"
  | "codgerTutorialAmuletLattice"
  | "codgerTutorialPressO"
  | "codgerTutorialLatticeAbilities"
  | "codgerTutorialLatticeModifiers"
  | "codgerTutorialLatticeLoop"
  | "codgerTutorialAutoAttack"
  | "codgerTutorialMeter"
  | "codgerTutorialMotherLoad"
  | "codgerTutorialSkipped"
  | "codgerTutorialGoUpstairs"
  | "codgerMotherTrialBegin"
  | "codgerGoUpStairs";

export type GameEvent =
  | { kind: "log"; message: string; detail: string }
  | { kind: "sound"; id: SoundEventId };

export type GameState = {
  selectedClassId: ClassId;
  player: PartyMemberState;
  enemy: EnemyState;
  extraEnemies: EnemyState[];
  obstacles: Obstacle[];
  combat: CombatRuntimeState;
  party: PartyState;
  intro: IntroRoomState;
  ui: UiFlowState;
};

type CombatArrayKey = {
  [K in keyof CombatRuntimeState]: CombatRuntimeState[K] extends unknown[] ? K : never;
}[keyof CombatRuntimeState];

const combatArrayKeys = [
  "magicMissiles",
  "moonfallStrikes",
  "motherslashWaves",
  "verdantExplosions",
  "moonwellBeams",
  "moonBurstEffects",
  "clericHealEffects",
  "rootbreakerShockwaves",
  "thornwallCounters",
  "motherloadBreakers",
  "verdantGuillotines",
  "enemyRockThrows",
  "shroomSporeClouds",
  "shroomlings",
  "treeGoblinHeads",
  "nightbloomThorns",
  "nightbloomPetals",
  "nightbloomRootBursts",
  "nightbloomNovaWaves",
  "nightbloomPetalImpacts",
  "obsidianLances",
  "obsidianShards",
  "obsidianSmites",
  "obsidianWheels",
  "obsidianImpacts",
  "abyssalBellShards",
  "abyssalFanShards",
  "abyssalGraveMarks",
  "abyssalNovas",
  "abyssalImpacts",
  "briarheartSkewers",
  "briarheartSeeds",
  "briarheartVineEruptions",
  "briarheartPollenNovas",
  "briarheartImpacts",
  "woundclockBolts",
  "woundclockGearOrbs",
  "woundclockSweeps",
  "woundclockRifts",
  "woundclockImpacts",
  "floatingCombatTexts",
] as const satisfies readonly CombatArrayKey[];

export function ensureCombatRuntimeState(state: GameState) {
  const combat = state.combat as CombatRuntimeState & Record<CombatArrayKey, unknown>;
  combatArrayKeys.forEach((key) => {
    if (!Array.isArray(combat[key])) combat[key] = [];
  });
  if (!combat.cooldowns || typeof combat.cooldowns !== "object") combat.cooldowns = {};
  if (!combat.motherLoadWindow || typeof combat.motherLoadWindow !== "object") {
    combat.motherLoadWindow = createMotherLoadWindowState();
  }
  if (!combat.autoLoop || typeof combat.autoLoop !== "object") {
    combat.autoLoop = createAutoAttackLoopState();
  }
  if (!Number.isFinite(combat.playerRespawnTimer)) combat.playerRespawnTimer = 0;
  if (!Number.isFinite(combat.respawnTimer)) combat.respawnTimer = 0;
  if (!Number.isFinite(combat.roomTransitionCooldown)) combat.roomTransitionCooldown = 0;
  if (!Array.isArray(state.extraEnemies)) state.extraEnemies = [];
  if (!state.party || !Array.isArray(state.party.members) || state.party.members.length === 0) {
    const member = createPartyMember(state.selectedClassId, 0, state.player.x, state.player.y);
    member.health = state.player.health;
    member.maxHealth = state.player.maxHealth;
    member.stamina = state.player.stamina;
    member.maxStamina = state.player.maxStamina;
    member.meter = state.player.meter;
    member.maxMeter = state.player.maxMeter;
    member.cooldowns = combat.cooldowns;
    member.equippedItems = combat.equippedItems;
    member.equippedGear = combat.equippedGear;
    member.branchLattice = combat.branchLattice;
    member.autoLoop = combat.autoLoop;
    member.motherLoadWindow = combat.motherLoadWindow;
    state.party = {
      members: [member],
      activeMemberId: member.id,
      selectedInventoryMemberId: member.id,
      selectedLatticeMemberId: member.id,
      motherLoadWindow: combat.motherLoadWindow,
      pendingTargetedSpecial: null,
    };
  }
  if (!state.party.motherLoadWindow) state.party.motherLoadWindow = combat.motherLoadWindow ?? createMotherLoadWindowState();
  state.party.pendingTargetedSpecial ??= null;
  state.party.members.forEach((member, index) => {
    member.partyIndex = index;
    if (!member.cooldowns) member.cooldowns = {};
    if (!member.equippedItems) member.equippedItems = {};
    if (!member.equippedGear) member.equippedGear = member.equippedItems.weapon ?? createStartingWeapon(member.classId);
    if (!member.branchLattice) member.branchLattice = createBranchLatticeState(member.classId, member.equippedGear.rarity);
    if (!member.autoLoop) member.autoLoop = createAutoAttackLoopState();
    if (!member.motherLoadWindow) member.motherLoadWindow = createMotherLoadWindowState();
    if (!member.aiMode) member.aiMode = member.lifeState === "dead" ? "downed" : "follow";
    if (!Number.isFinite(member.aiThinkTimer)) member.aiThinkTimer = 0;
  });
  if (!getPartyMember(state, state.party.activeMemberId)) state.party.activeMemberId = state.party.members[0].id;
  if (!getPartyMember(state, state.party.selectedInventoryMemberId)) state.party.selectedInventoryMemberId = state.party.activeMemberId;
  if (!getPartyMember(state, state.party.selectedLatticeMemberId)) state.party.selectedLatticeMemberId = state.party.activeMemberId;
  state.ui.showPartyHealthBars ??= true;
  bindActiveMemberAliases(state);
  normalizeSkillBarBindings(state);
}

export type IntroRoomState = {
  codger: {
    x: number;
    y: number;
    radius: number;
    interactRadius: number;
    phase: "waiting" | "giftOffered" | "readyForStairs";
    dialogueText: string | null;
    animTimer: number;
    animFrame: number;
  };
  tutorial: CodgerTutorialState;
};

export type CodgerTutorialStep =
  | "waiting"
  | "equipAmulet"
  | "amuletEquippedChoice"
  | "openLattice"
  | "latticeTourAbilities"
  | "latticeTourModifiers"
  | "latticeTourLoop"
  | "autoAttackExplain"
  | "bloomMeterExplain"
  | "motherLoadExplain"
  | "readyForStairs";

export type CodgerTutorialCompletionReason = "completed" | "skipped";

export type CodgerTutorialState = {
  step: CodgerTutorialStep;
  completionReason: CodgerTutorialCompletionReason | null;
};

export function createInitialGameState(selectedClassId: ClassId = "warrior"): GameState {
  const initialMember = createPartyMember(selectedClassId, 0, world.playerSpawn.x, world.playerSpawn.y);

  const state: GameState = {
    selectedClassId,
    player: initialMember,
    enemy: {
      instanceId: "room-0-enemy-0",
      monsterId: "shroom_boy",
      name: "Deepcap Sporeling",
      x: world.enemySpawn.x,
      y: world.enemySpawn.y,
      radius: 26,
      health: 145,
      maxHealth: 145,
      state: "idle",
      stateTimer: 1.8,
      attackIndex: 0,
      currentAttack: "rock_spray",
      attackForward: { x: 0, y: 1 },
      attackTarget: { x: world.playerSpawn.x, y: world.playerSpawn.y },
      attackCooldowns: createEnemyAttackCooldowns(),
      hasHitPlayer: false,
      rockSlamCrashPlayed: false,
      phaseBloomed: false,
      chainTag: "",
      chainTimer: 0,
      bleedTimer: 0,
      bleedTick: 0,
      flashTimer: 0,
      anim: "idle",
      direction: "down",
      animTimer: 0,
      animFrame: 0,
      visible: false,
    },
    extraEnemies: [],
    obstacles: [],
    combat: {
      cooldowns: {},
      magicMissiles: [],
      moonfallStrikes: [],
      motherslashWaves: [],
      verdantExplosions: [],
      moonwellBeams: [],
      moonBurstEffects: [],
      clericHealEffects: [],
      rootbreakerShockwaves: [],
      thornwallCounters: [],
      motherloadBreakers: [],
      verdantGuillotines: [],
      enemyRockThrows: [],
      shroomSporeClouds: [],
      shroomlings: [],
      treeGoblinHeads: [],
      nightbloomThorns: [],
      nightbloomPetals: [],
      nightbloomRootBursts: [],
      nightbloomNovaWaves: [],
      nightbloomPetalImpacts: [],
      obsidianLances: [],
      obsidianShards: [],
      obsidianSmites: [],
      obsidianWheels: [],
      obsidianImpacts: [],
      abyssalBellShards: [],
      abyssalFanShards: [],
      abyssalGraveMarks: [],
      abyssalNovas: [],
      abyssalImpacts: [],
      briarheartSkewers: [],
      briarheartSeeds: [],
      briarheartVineEruptions: [],
      briarheartPollenNovas: [],
      briarheartImpacts: [],
      woundclockBolts: [],
      woundclockGearOrbs: [],
      woundclockSweeps: [],
      woundclockRifts: [],
      woundclockImpacts: [],
      floatingCombatTexts: [],
      nextFloatingCombatTextId: 1,
      pendingMagicMissileCast: null,
      pendingMoonfallCast: null,
      motherLoadWindow: initialMember.motherLoadWindow,
      targetLocked: false,
      droppedGear: null,
      droppedGearSourceLabel: null,
      lootCorpseId: null,
      hoveredLootCorpseId: null,
      inventoryItems: [],
      nextInventoryItemId: 1,
      equippedGear: initialMember.equippedGear,
      equippedItems: initialMember.equippedItems,
      branchLattice: initialMember.branchLattice,
      autoLoop: initialMember.autoLoop,
      playerRespawnTimer: 0,
      respawnTimer: 0,
      roomIndex: 0,
      roomTransitionCooldown: 0,
    },
    party: {
      members: [initialMember],
      activeMemberId: initialMember.id,
      selectedInventoryMemberId: initialMember.id,
      selectedLatticeMemberId: initialMember.id,
      motherLoadWindow: initialMember.motherLoadWindow,
      pendingTargetedSpecial: null,
    },
    intro: createIntroRoomState(),
    ui: {
      isTitleActive: true,
      isCharacterSelectActive: false,
      isPaused: false,
      isInventoryOpen: false,
      isLootOpen: false,
      isBranchLatticeOpen: false,
      pauseMenuSource: null,
      showPartyHealthBars: true,
      skillBarBindings: Array.from({ length: skillBarSlotCount }, () => null),
      openSkillBarSlot: null,
    },
  };
  bindActiveMemberAliases(state);
  normalizeSkillBarBindings(state);
  return state;
}

export function createPartyMember(classId: ClassId, partyIndex: number, x: number, y: number): PartyMemberState {
  const currentClass = characterClasses[classId];
  const startingWeapon = createStartingWeapon(classId);
  return {
    id: partyMemberId(classId),
    classId,
    partyIndex,
    aiMode: partyIndex === 0 ? "follow" : "follow",
    aiThinkTimer: 0,
    lifeState: "alive",
    x,
    y,
    radius: 26,
    health: currentClass.stats.health,
    maxHealth: currentClass.stats.health,
    stamina: currentClass.stats.stamina,
    maxStamina: currentClass.stats.stamina,
    meter: 0,
    maxMeter: currentClass.stats.meter,
    speed: 235,
    sprintSpeed: 345,
    sprintStaminaCost: 22,
    staminaRegen: 18,
    dodgeSpeed: 680,
    dodgeTime: 0,
    dodgeAnimTime: 0,
    invulnerableTime: 0,
    facing: { x: 0, y: -1 },
    anim: "idle",
    direction: "down",
    animTimer: 0,
    animFrame: 0,
    attackFlash: 0,
    specialFlash: 0,
    specialAnim: null,
    frontFlipSlashTime: 0,
    autoTimer: 0,
    autoCount: 0,
    cooldowns: {},
    equippedItems: { weapon: startingWeapon },
    equippedGear: startingWeapon,
    branchLattice: createBranchLatticeState(classId, startingWeapon.rarity),
    autoLoop: createAutoAttackLoopState(),
    motherLoadWindow: createMotherLoadWindowState(),
  };
}

function partyMemberId(classId: ClassId): PartyMemberId {
  return `party-${classId}`;
}

export function implementedPartyClassIds() {
  return characterOrder.filter((classId) => characterClasses[classId].implemented);
}

export function getPartyMember(state: GameState, memberId: PartyMemberId | null | undefined) {
  return state.party.members.find((member) => member.id === memberId) ?? null;
}

export function activePartyMember(state: GameState) {
  return getPartyMember(state, state.party.activeMemberId) ?? state.party.members[0];
}

export function selectedInventoryPartyMember(state: GameState) {
  return getPartyMember(state, state.party.selectedInventoryMemberId) ?? activePartyMember(state);
}

export function selectedLatticePartyMember(state: GameState) {
  return getPartyMember(state, state.party.selectedLatticeMemberId) ?? activePartyMember(state);
}

export function livingPartyMembers(state: GameState) {
  return state.party.members.filter((member) => member.lifeState === "alive" && member.health > 0);
}

export function partyMemberClass(state: GameState, memberId: PartyMemberId | null | undefined = state.party.activeMemberId) {
  const member = getPartyMember(state, memberId);
  return characterClasses[member?.classId ?? state.selectedClassId];
}

export function selectedClass(state: GameState) {
  return partyMemberClass(state);
}

export function syncActiveMemberFromCombat(state: GameState) {
  const member = activePartyMember(state);
  if (!member) return;
  member.cooldowns = state.combat.cooldowns;
  member.equippedItems = state.combat.equippedItems;
  member.equippedGear = state.combat.equippedGear;
  member.branchLattice = state.combat.branchLattice;
  member.autoLoop = state.combat.autoLoop;
  state.party.motherLoadWindow = state.combat.motherLoadWindow;
  member.motherLoadWindow = state.party.motherLoadWindow;
}

export function bindActiveMemberAliases(state: GameState) {
  const member = activePartyMember(state);
  state.party.activeMemberId = member.id;
  state.player = member;
  state.selectedClassId = member.classId;
  state.combat.cooldowns = member.cooldowns;
  state.combat.equippedItems = member.equippedItems;
  state.combat.equippedGear = member.equippedGear;
  state.combat.branchLattice = member.branchLattice;
  state.combat.autoLoop = member.autoLoop;
  member.motherLoadWindow = state.party.motherLoadWindow;
  state.combat.motherLoadWindow = state.party.motherLoadWindow;
}

export function setActivePartyMember(state: GameState, memberId: PartyMemberId): GameEvent[] {
  syncActiveMemberFromCombat(state);
  const nextMember = getPartyMember(state, memberId);
  if (!nextMember || nextMember.lifeState !== "alive") return [];
  if (state.party.activeMemberId === nextMember.id) {
    bindActiveMemberAliases(state);
    return [];
  }

  state.party.activeMemberId = nextMember.id;
  bindActiveMemberAliases(state);
  return [logEvent(`${partyMemberClass(state, nextMember.id).name} takes point`, "Party control switched")];
}

export function withPartyMemberAliases<T>(state: GameState, memberId: PartyMemberId, fn: () => T): T {
  syncActiveMemberFromCombat(state);
  const originalMemberId = state.party.activeMemberId;
  const targetMember = getPartyMember(state, memberId);
  if (!targetMember) return fn();
  state.party.activeMemberId = targetMember.id;
  bindActiveMemberAliases(state);
  try {
    return fn();
  } finally {
    syncActiveMemberFromCombat(state);
    state.party.activeMemberId = originalMemberId;
    bindActiveMemberAliases(state);
  }
}

export function selectInventoryPartyMember(state: GameState, memberId: PartyMemberId) {
  if (!getPartyMember(state, memberId)) return;
  state.party.selectedInventoryMemberId = memberId;
}

export function selectLatticePartyMember(state: GameState, memberId: PartyMemberId) {
  if (!getPartyMember(state, memberId)) return;
  state.party.selectedLatticeMemberId = memberId;
}

export function togglePartyClassSelection(state: GameState, classId: ClassId) {
  const currentClass = characterClasses[classId];
  if (!currentClass.implemented) return false;
  const existingIndex = state.party.members.findIndex((member) => member.classId === classId);
  if (existingIndex >= 0) {
    if (state.party.members.length <= 1) return false;
    const [removed] = state.party.members.splice(existingIndex, 1);
    if (state.party.activeMemberId === removed.id) state.party.activeMemberId = state.party.members[0].id;
    if (state.party.selectedInventoryMemberId === removed.id) state.party.selectedInventoryMemberId = state.party.activeMemberId;
    if (state.party.selectedLatticeMemberId === removed.id) state.party.selectedLatticeMemberId = state.party.activeMemberId;
  } else {
    if (state.party.members.length >= 4) return false;
    const index = state.party.members.length;
    const offsetX = (index % 2 === 0 ? -1 : 1) * (44 + index * 10);
    const offsetY = 54 + index * 28;
    state.party.members.push(createPartyMember(classId, index, state.player.x + offsetX, state.player.y + offsetY));
  }
  normalizePartyMemberIndexes(state);
  bindActiveMemberAliases(state);
  return true;
}

export function setPartyFromClassIds(state: GameState, classIds: ClassId[]) {
  const uniqueImplemented = classIds.filter((classId, index) =>
    characterClasses[classId]?.implemented && classIds.indexOf(classId) === index,
  ).slice(0, 4);
  const selected = uniqueImplemented.length > 0 ? uniqueImplemented : [state.selectedClassId];
  state.party.members = selected.map((classId, index) =>
    createPartyMember(classId, index, world.playerSpawn.x + index * 42, world.playerSpawn.y + index * 36),
  );
  state.party.activeMemberId = state.party.members[0].id;
  state.party.selectedInventoryMemberId = state.party.activeMemberId;
  state.party.selectedLatticeMemberId = state.party.activeMemberId;
  state.party.pendingTargetedSpecial = null;
  bindActiveMemberAliases(state);
}

export function normalizePartyMemberIndexes(state: GameState) {
  state.party.members.forEach((member, index) => {
    member.partyIndex = index;
  });
}

const equippedSpecialSlotOrder: GearEquipSlot[] = ["weapon", "helmet", "bodyArmour", "gloves", "ringOne", "ringTwo", "amulet", "pants", "boots"];

export function activeWeaponSpecials(state: GameState, memberId: PartyMemberId = state.party.activeMemberId) {
  const member = getPartyMember(state, memberId) ?? activePartyMember(state);
  const seenSpecialIds = new Set<string>();
  const specials = equippedSpecialSlotOrder
    .flatMap((slot) => member.equippedItems[slot]?.frame.weaponSpecials ?? [])
    .filter((special) => {
      if (seenSpecialIds.has(special.id)) return false;
      seenSpecialIds.add(special.id);
      return true;
    });
  const activeSpecials = specials.length > 0 ? specials : partyMemberClass(state, member.id).abilities;

  return filterBloomSpecials(member.classId, hydrateWeaponSpecials(member.classId, activeSpecials))
    .slice(0, 3)
    .map((special, index) => ({ ...special, key: String(index + 1) }));
}

export function skillBarBindingId(memberId: PartyMemberId, abilityId: string) {
  return `${memberId}::${abilityId}`;
}

export function partySkillBarOptions(state: GameState): PartySkillBarOption[] {
  return state.party.members.flatMap((member) => {
    const memberClass = partyMemberClass(state, member.id);
    return activeWeaponSpecials(state, member.id).map((ability, abilityIndex) => ({
      id: skillBarBindingId(member.id, ability.id),
      memberId: member.id,
      abilityId: ability.id,
      abilityIndex,
      key: ability.key,
      memberName: memberClass.name,
      memberGlyph: memberClass.glyph,
      memberAccent: memberClass.accent,
      ability,
    }));
  });
}

export function normalizeSkillBarBindings(state: GameState) {
  const options = partySkillBarOptions(state);
  const optionIds = new Set(options.map((option) => option.id));
  const incoming = Array.isArray(state.ui.skillBarBindings) ? state.ui.skillBarBindings : [];
  const bindings = Array.from({ length: skillBarSlotCount }, (_, index) => {
    const binding = incoming[index];
    return typeof binding === "string" && optionIds.has(binding) ? binding : null;
  });
  const used = new Set(bindings.filter((binding): binding is string => Boolean(binding)));

  bindings.forEach((binding, index) => {
    if (binding) return;
    const nextOption = options.find((option) => !used.has(option.id));
    if (!nextOption) return;
    bindings[index] = nextOption.id;
    used.add(nextOption.id);
  });

  state.ui.skillBarBindings = bindings;
  if (
    state.ui.openSkillBarSlot !== null
    && (!Number.isInteger(state.ui.openSkillBarSlot) || state.ui.openSkillBarSlot < 0 || state.ui.openSkillBarSlot >= skillBarSlotCount)
  ) {
    state.ui.openSkillBarSlot = null;
  }
  return bindings;
}

export function activeLatticeSequence(state: GameState, memberId: PartyMemberId = state.party.activeMemberId) {
  const member = getPartyMember(state, memberId) ?? activePartyMember(state);
  const options = branchLatticeFrame(state, member.id).latticeAbilityOptions;
  return member.branchLattice.abilitySlotIds.map((optionId) =>
    optionId ? options.find((candidate) => candidate.id === optionId) ?? null : null,
  );
}

export function branchLatticeFrame(state: GameState, memberId: PartyMemberId = state.party.activeMemberId): FrameGear {
  const member = getPartyMember(state, memberId) ?? activePartyMember(state);
  const weaponSpecials = activeWeaponSpecials(state, member.id);
  const baselineFrame = createFrameGear(member.classId, "Common");
  const abilityOptions: FrameGear["latticeAbilityOptions"] = baselineFrame.latticeAbilityOptions.filter(
    (option) => option.source === "class",
  );
  const modifierOptions: FrameGear["modifierOptions"] = [];
  const usedAbilityIds = new Set(abilityOptions.map((option) => option.id));
  const usedModifierIds = new Set<string>();

  Object.entries(member.equippedItems).forEach(([slot, gear]) => {
    if (!gear || slot === "weapon") return;

    gear.frame.latticeAbilityOptions.forEach((option) => {
      if (usedAbilityIds.has(option.id)) return;
      usedAbilityIds.add(option.id);
      abilityOptions.push(option);
    });
    gear.frame.modifierOptions.forEach((option) => {
      if (usedModifierIds.has(option.id)) return;
      usedModifierIds.add(option.id);
      modifierOptions.push(option);
    });
  });

  return {
    weaponSpecials,
    latticeAbilityOptions: abilityOptions,
    modifierOptions,
  };
}

function filterBloomSpecials(classId: ClassId, specials: FrameGear["weaponSpecials"]) {
  if (classId !== "warrior") return specials;
  return specials.filter((special) => special.id !== "rootbreaker-cleave" && special.id !== "thornwall-counter");
}

function hydrateWeaponSpecials(classId: ClassId, specials: FrameGear["weaponSpecials"]) {
  const classSpecials = new Map([
    ...characterClasses[classId].abilities,
    ...legacyWeaponSpecialDefaults(classId),
  ].map((special) => [special.id, special]));
  return specials.map((special) => {
    if (special.tags) return special;
    const classSpecial = classSpecials.get(special.id);
    return classSpecial?.tags ? { ...special, tags: classSpecial.tags } : special;
  });
}

function legacyWeaponSpecialDefaults(classId: ClassId): FrameGear["weaponSpecials"] {
  if (classId !== "warrior") return [];
  return [
    { key: "1", id: "motherload-breaker", name: "Motherload Breaker", cost: 55, cooldown: 9.5, range: 190, tags: ["MotherLoad"] },
  ];
}

export function allEnemies(state: GameState): EnemyState[] {
  return [state.enemy, ...state.extraEnemies];
}

export function livingEnemies(state: GameState): EnemyState[] {
  return allEnemies(state).filter((enemy) => enemy.visible && enemy.state !== "dead" && enemy.health > 0);
}

export function lootCorpse(state: GameState): EnemyState | null {
  if (!state.combat.droppedGear || !state.combat.lootCorpseId) return null;
  return allEnemies(state).find((enemy) => enemy.instanceId === state.combat.lootCorpseId && enemy.visible && enemy.state === "dead") ?? null;
}

export function promoteEnemy(state: GameState, nextTarget: EnemyState) {
  if (state.enemy === nextTarget) return;

  const nextIndex = state.extraEnemies.indexOf(nextTarget);
  if (nextIndex < 0) return;

  const previousTarget = state.enemy;
  state.enemy = nextTarget;
  state.extraEnemies.splice(nextIndex, 1);
  if (previousTarget.visible) {
    state.extraEnemies.unshift(previousTarget);
  }
}

export function createEnemyAttackCooldowns(): Record<TelegraphKind, number> {
  return {
    rock_slam: 0,
    rock_spray: 0,
    rock_throw: 0,
    spore_cloud: 0,
    shroom_toss: 0,
    bite: 0,
    head_throw: 0,
    arm_attack: 0,
    thorn_lance: 0,
    petal_fan: 0,
    root_snare: 0,
    nightbloom_nova: 0,
    phase_bloom: 0,
    glass_lance: 0,
    shard_spiral: 0,
    reliquary_smite: 0,
    penitent_wheel: 0,
    phase_rupture: 0,
    bell_shard: 0,
    tolling_fan: 0,
    grave_mark: 0,
    dirge_nova: 0,
    phase_toll: 0,
    briar_skewer: 0,
    seed_barrage: 0,
    strangler_grove: 0,
    pollen_nova: 0,
    sovereign_bloom: 0,
    chrono_lance: 0,
    gear_orbit: 0,
    clockhand_sweep: 0,
    time_rift: 0,
    hour_zero: 0,
  };
}

export function isGameplayActive(state: GameState) {
  return (
    !state.ui.isTitleActive &&
    !state.ui.isCharacterSelectActive &&
    !state.ui.isPaused &&
    !state.ui.isInventoryOpen &&
    !state.ui.isLootOpen &&
    !state.ui.isBranchLatticeOpen
  );
}

export function isGameplayVisible(state: GameState) {
  return !state.ui.isTitleActive && !state.ui.isCharacterSelectActive;
}

export function applySelectedClass(state: GameState, classId: ClassId = state.selectedClassId) {
  const currentClass = characterClasses[classId];
  if (!currentClass.implemented) return false;
  if (!state.party.members.some((member) => member.classId === classId)) {
    setPartyFromClassIds(state, [classId]);
  }
  state.party.activeMemberId = partyMemberId(classId);
  state.party.selectedInventoryMemberId = state.party.activeMemberId;
  state.party.selectedLatticeMemberId = state.party.activeMemberId;
  bindActiveMemberAliases(state);
  state.player.maxHealth = currentClass.stats.health;
  state.player.health = currentClass.stats.health;
  state.player.maxStamina = currentClass.stats.stamina;
  state.player.stamina = currentClass.stats.stamina;
  state.player.maxMeter = currentClass.stats.meter;
  state.player.meter = 0;
  state.player.attackFlash = 0;
  state.player.specialFlash = 0;
  state.player.specialAnim = null;
  state.player.frontFlipSlashTime = 0;
  syncActiveMemberFromCombat(state);
  return true;
}

export function logEvent(message: string, detail = ""): GameEvent {
  return { kind: "log", message, detail };
}

export function soundEvent(id: SoundEventId): GameEvent {
  return { kind: "sound", id };
}

export function createIntroRoomState(): IntroRoomState {
  return {
    codger: {
      x: world.codgerSpawn.x,
      y: world.codgerSpawn.y,
      radius: 44,
      interactRadius: 190,
      phase: "waiting",
      dialogueText: null,
      animTimer: 0,
      animFrame: 0,
    },
    tutorial: {
      step: "waiting",
      completionReason: null,
    },
  };
}

export function createBranchLatticeState(classId: ClassId, rarity: GearDrop["rarity"]): BranchLatticeState {
  const frame = createFrameGear(classId, rarity);
  return {
    abilitySlotIds: Array.from({ length: branchLatticeAbilitySlotCount }, (_, index) =>
      index === 0 ? frame.latticeAbilityOptions[0]?.id ?? null : null,
    ),
    modifierSlotIds: Array.from({ length: branchLatticeModifierSlotCount }, () => null),
    selectedAbilitySlot: 0,
    selectedModifierSlot: 0,
    isPreviewOpen: false,
  };
}

export function createAutoAttackLoopState(): AutoAttackLoopState {
  return {
    currentSlotIndex: 0,
    slotTimer: 0,
    restartTimer: 0,
    hasteTimer: 0,
    hasteMultiplier: 1,
    lastResolvedKind: null,
  };
}

export function createMotherLoadWindowState(): MotherLoadWindowState {
  return {
    isActive: false,
    sourceAbilityId: null,
    sourceAbilityName: null,
  };
}

export function createStartingWeapon(classId: ClassId): GearDrop {
  const frame = createFrameGear(classId, "Common");
  frame.latticeAbilityOptions = [];
  frame.modifierOptions = [];
  const weaponNames: Record<ClassId, string> = {
    warrior: "Recruit's Greatsword",
    ranger: "Recruit's Bow",
    mage: "Recruit's Staff",
    thief: "Recruit's Daggers",
    cleric: "Recruit's Charm",
  };

  return {
    name: weaponNames[classId],
    slot: "weapon",
    rarity: "Common",
    power: 0,
    ability: "Every third auto-attack deals +5 damage.",
    frame,
  };
}

export function createStartingAmulet(classId: ClassId): GearDrop {
  const finisher = createStarterFinisherAbility(classId);
  return {
    name: `${characterClasses[classId].name} Trial Amulet`,
    slot: "amulet",
    rarity: "Common",
    power: 0,
    ability: `Grants ${finisher.name}, a Branch Lattice Finisher.`,
    frame: {
      weaponSpecials: [],
      latticeAbilityOptions: [finisher],
      modifierOptions: [],
    },
  };
}

export function assignStartingLatticeAbilities(branchLattice: BranchLatticeState, amulet: GearDrop | null) {
  const finisher = amulet?.frame.latticeAbilityOptions.find((option) => option.tags?.includes("Finisher"));
  if (!finisher || branchLattice.abilitySlotIds.includes(finisher.id)) return;
  branchLattice.abilitySlotIds[1] = finisher.id;
}

function createStarterFinisherAbility(classId: ClassId): LatticeAbilityOption {
  const names: Record<ClassId, { id: string; name: string; glyph: string }> = {
    warrior: { id: "lattice:warrior:verdant-guillotine", name: "Verdant Guillotine", glyph: "VG" },
    ranger: { id: "lattice:ranger:greenwood-flourish", name: "Greenwood Flourish", glyph: "GF" },
    mage: { id: "lattice:mage:moonveil-flourish", name: "Moonveil Flourish", glyph: "MF" },
    thief: { id: "lattice:thief:shadowglass-flourish", name: "Shadowglass Flourish", glyph: "SF" },
    cleric: { id: "lattice:cleric:dawnroot-flourish", name: "Dawnroot Flourish", glyph: "DF" },
  };
  const finisher = names[classId];

  return {
    id: finisher.id,
    kind: classId === "mage" ? "moonveil_flourish" : classId === "warrior" ? "verdant_guillotine" : "front_flip_slash",
    name: finisher.name,
    detail: classId === "mage"
      ? "Starter Finisher. Spins through Moonveil Flourish and erupts crescent moons under the target."
      : classId === "warrior"
        ? "Starter Finisher. Leaps into an emerald execution drop."
        : "Starter Finisher. Adds a class identity strike to the Branch Lattice.",
    glyph: finisher.glyph,
    range: classId === "mage" ? 360 : classId === "warrior" ? 300 : classId === "cleric" ? 210 : 172,
    baseCooldown: 0.92,
    source: "gear",
    tags: ["Finisher"],
  };
}

export function createFrameGear(classId: ClassId, rarity: GearDrop["rarity"]) {
  const weaponSpecials = characterClasses[classId].abilities.map((ability, index) => ({ ...ability, key: String(index + 1) }));
  const weaponRange = classId === "mage" ? 760 : classId === "cleric" ? 520 : classId === "warrior" ? 150 : 120;
  const latticeAbilityOptions: FrameGear["latticeAbilityOptions"] = [
    {
      id: "lattice:basic-attack-1",
      kind: "basic_attack_1" as const,
      name: "Basic Attack 1",
      detail: "Weapon auto strike. Feeds later combo abilities.",
      glyph: "A1",
      range: weaponRange,
      baseCooldown: 0.82,
      source: "class" as const,
    },
    ...(classId === "warrior"
      ? [
          {
            id: "lattice:warrior:rootbreaker-cleave",
            kind: "rootbreaker_cleave" as const,
            name: "Rootbreaker Cleave",
            detail: "Gear auto branch. Slams a forward root shockwave that applies Rootbreak on hit.",
            glyph: "RC",
            range: 360,
            baseCooldown: 1.08,
            source: "gear" as const,
          },
          {
            id: "lattice:warrior:thornwall-counter",
            kind: "thornwall_counter" as const,
            name: "Thornwall Counter",
            detail: "Gear auto branch. Plants the blade, guards briefly, then blooms a close thorn retaliation.",
            glyph: "TC",
            range: 190,
            baseCooldown: 1.18,
            source: "gear" as const,
          },
        ]
      : []),
    {
      id: "lattice:haste-1s",
      kind: "haste" as const,
      name: "Haste",
      detail: "Speeds up the rest of the auto sequence for 1 second.",
      glyph: "HS",
      range: 999,
      baseCooldown: 0.28,
      duration: 1,
      source: "gear" as const,
    },
    {
      id: "lattice:combo-attack",
      kind: "combo_attack" as const,
      name: "Combo Attack",
      detail: "Chains after Basic Attack 1 for an extra weapon hit.",
      glyph: "CA",
      range: weaponRange,
      baseCooldown: 0.74,
      source: "gear" as const,
    },
  ];

  const commonModifiers = [
    {
      id: "mod:fire",
      name: "Fire Modifier",
      detail: "Adds a small fire hit to compatible auto abilities.",
      glyph: "FI",
      tone: "common" as const,
    },
    {
      id: "mod:sap-fed",
      name: "Sap Fed",
      detail: "Preview: slightly improves Bloom Meter economy.",
      glyph: "SF",
      tone: "common" as const,
    },
  ];
  const uncommonModifiers = [
    {
      id: "mod:quickroot",
      name: "Quickroot",
      detail: "Preview: trims recovery windows.",
      glyph: "QR",
      tone: "uncommon" as const,
    },
    {
      id: "mod:amber-vein",
      name: "Amber Vein",
      detail: "Preview: increases burst potential.",
      glyph: "AV",
      tone: "uncommon" as const,
    },
  ];
  const rareModifiers = [
    {
      id: "mod:motherseed-echo",
      name: "Motherseed Echo",
      detail: "Preview: repeats a portion of the linked effect.",
      glyph: "ME",
      tone: "rare" as const,
    },
    {
      id: "mod:star-bloom",
      name: "Star Bloom",
      detail: "Preview: widens the linked branch's area.",
      glyph: "SB",
      tone: "rare" as const,
    },
  ];

  const modifierOptions =
    rarity === "Rare"
      ? [...commonModifiers, ...uncommonModifiers, ...rareModifiers]
      : rarity === "Uncommon"
        ? [...commonModifiers, ...uncommonModifiers]
        : commonModifiers;

  return { weaponSpecials, latticeAbilityOptions, modifierOptions };
}

import slotEmptyUrl from "../../assets/ui/motherseed-skill-bar/slots/slot-01.png?url";
import slotGlowUrl from "../../assets/ui/motherseed-skill-bar/slots/slot-08.png?url";
import cooldownRingUrl from "../../assets/ui/motherseed-skill-bar/cooldown-rings/cooldown-ring-04.png?url";
import keybindPlaqueUrl from "../../assets/ui/motherseed-skill-bar/keybind-plaques/keybind-plaque-01.png?url";
import trimBarUrl from "../../assets/ui/motherseed-skill-bar/trim-bars/trim-bar-02.png?url";
import {
  activeLatticeSequence,
  allEnemies,
  livingEnemies,
  partyMemberClass,
  partySkillBarOptions,
  selectedClass,
  type GameState,
  type PartySkillBarOption,
} from "../game/state";
import type { SpecialAbility } from "../game/types";
import { specialIconUrl } from "./special-icons";

export type HudViewModel = {
  playerHtml: string;
  targetHtml: string;
  abilitiesHtml: string;
};

const panelHtmlCache = new WeakMap<HTMLElement, string>();

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function specialDetail(ability: SpecialAbility) {
  if (ability.id === "motherslash" || ability.id === "motherspin") {
    return "Spin out a heavy cyclone wave from the original warrior special. During Mother Load, it releases a bonus wave and refunds Bloom Meter.";
  }
  if (ability.id === "motherload-breaker") {
    return "Rupture the ground with green-gold force. During Mother Load, it detonates for a larger payoff.";
  }
  if (ability.id === "mothers-healing") {
    return "Tap once to choose a party target by portrait or in-world click. Tap again to heal the lowest-percent HP party member.";
  }

  return `Use ${ability.name} against enemies within ${ability.range} range.`;
}

function specialTargetingHint(ability: SpecialAbility) {
  if (ability.id === "mothers-healing") {
    return "Click the slot to ready the heal, then click a party member in the playfield or portrait.";
  }

  return "Click the slot or press its bound key to use this special.";
}

function renderSkillIcon(ability: SpecialAbility) {
  const iconUrl = specialIconUrl(ability.id);
  return iconUrl
    ? `<img class="skill-slot-icon" src="${iconUrl}" alt="" />`
    : `<span class="skill-slot-fallback">${escapeHtml(ability.name.slice(0, 1))}</span>`;
}

function skillStatus(state: GameState, option: PartySkillBarOption) {
  const member = state.party.members.find((candidate) => candidate.id === option.memberId);
  const cooldown = member?.cooldowns[option.ability.id] ?? 0;
  const cooldownRatio = option.ability.cooldown > 0 ? Math.min(1, Math.max(0, cooldown / option.ability.cooldown)) : 0;
  const ready = member?.lifeState === "alive" && cooldown <= 0 && (member?.meter ?? 0) >= option.ability.cost;
  return { member, cooldown, cooldownRatio, ready };
}

function renderSkillPicker(state: GameState, slotIndex: number, options: PartySkillBarOption[]) {
  return `
    <div class="skill-picker" role="menu" aria-label="Choose skill for slot ${slotIndex + 1}">
      ${options.map((option) => {
        const { cooldown, ready } = skillStatus(state, option);
        return `
          <button class="skill-pick ${ready ? "is-ready" : ""}" type="button" role="menuitem" data-skill-pick-slot="${slotIndex}" data-skill-option-id="${escapeHtml(option.id)}" style="--class-accent:${option.memberAccent}">
            <span class="skill-pick-icon">${renderSkillIcon(option.ability)}</span>
            <span>
              <strong>${escapeHtml(option.ability.name)}</strong>
              <em>${escapeHtml(option.memberName)} - ${cooldown > 0 ? `${cooldown.toFixed(1)}s` : `${option.ability.cost} Bloom`}</em>
            </span>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderSkillBar(state: GameState) {
  const options = partySkillBarOptions(state);
  const optionById = new Map(options.map((option) => [option.id, option]));
  const bindings = state.ui.skillBarBindings;

  return `
    <section
      class="skill-bar"
      aria-label="Skill bar"
      style="--skill-slot-empty: url('${slotEmptyUrl}'); --skill-slot-glow: url('${slotGlowUrl}'); --skill-cooldown-ring: url('${cooldownRingUrl}'); --skill-key-plaque: url('${keybindPlaqueUrl}'); --skill-trim: url('${trimBarUrl}')"
    >
      <div class="skill-bar-trim" aria-hidden="true"></div>
      <div class="skill-bar-slots">
        ${Array.from({ length: 9 }, (_, slotIndex) => {
          const key = String(slotIndex + 1);
          const option = optionById.get(bindings[slotIndex] ?? "");
          const status = option ? skillStatus(state, option) : null;
          const isTargeting = !!option
            && state.party.pendingTargetedSpecial?.casterMemberId === option.memberId
            && state.party.pendingTargetedSpecial.abilityId === option.ability.id;
          const cooldownStyle = status && status.cooldown > 0 ? `--cooldown-turn:${status.cooldownRatio.toFixed(3)}turn;` : "";
          const statusText = status
            ? status.cooldown > 0
              ? `${status.cooldown.toFixed(1)}s recovering`
              : status.ready
                ? "Ready now"
                : "Needs Bloom"
            : "";
          const label = option
            ? `Skill slot ${key}, ${option.memberName} ${option.ability.name}, ${status?.cooldown && status.cooldown > 0 ? `${status.cooldown.toFixed(1)} seconds remaining` : `${option.ability.cost} Bloom Meter`}`
            : `Skill slot ${key}, unbound`;
          return `
            <div class="skill-slot-wrap ${state.ui.openSkillBarSlot === slotIndex ? "is-picker-open" : ""}" style="--class-accent:${option?.memberAccent ?? "var(--ui-gold)"}">
              <button
                class="skill-slot ${option ? "is-bound" : "is-empty"} ${status?.ready ? "is-ready" : ""} ${status && status.cooldown > 0 ? "is-cooling" : ""} ${isTargeting ? "is-targeting" : ""}"
                type="button"
                data-skill-slot-index="${slotIndex}"
                ${option ? `data-skill-binding="${escapeHtml(option.id)}"` : ""}
                aria-label="${escapeHtml(label)}"
                style="${cooldownStyle}"
              >
                ${option ? renderSkillIcon(option.ability) : `<span class="skill-slot-fallback">+</span>`}
                <span class="skill-keybind">${key}</span>
                ${status && status.cooldown > 0 ? `<span class="skill-cooldown-ring" aria-hidden="true"></span><span class="skill-cooldown-time" aria-hidden="true">${status.cooldown.toFixed(1)}</span>` : ""}
                ${option ? `
                  <span class="skill-tooltip" role="tooltip">
                    <em>${escapeHtml(option.memberName)} Special</em>
                    <strong>${escapeHtml(option.ability.name)}</strong>
                    <span>${option.ability.cost} Bloom - ${option.ability.cooldown}s cooldown - ${option.ability.range} range</span>
                    <span class="skill-tooltip-state">${escapeHtml(statusText)}</span>
                    <p>${escapeHtml(specialDetail(option.ability))}</p>
                    <p class="skill-tooltip-action">${escapeHtml(specialTargetingHint(option.ability))}</p>
                  </span>
                ` : ""}
              </button>
              ${state.ui.openSkillBarSlot === slotIndex ? renderSkillPicker(state, slotIndex, options) : ""}
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

export function renderHud(state: GameState): HudViewModel {
  const currentClass = selectedClass(state);
  const phaseLabel = state.round.phase[0].toUpperCase() + state.round.phase.slice(1);
  const resultLabel = state.round.lastResult === "victory"
    ? `+${state.round.lastRewardGold} gold`
    : state.round.lastResult === "defeat"
      ? "Regrouping"
      : state.round.phase === "shop"
        ? state.round.shop.message
        : `Round ${state.round.roundIndex || 1}`;
  const healthValue = state.player.health / state.player.maxHealth;
  const meterValue = state.player.meter / state.player.maxMeter;
  const playerHtml = `
    <div class="party-rail" aria-label="Party members">
      ${state.party.members.map((member, index) => {
        const partyClass = partyMemberClass(state, member.id);
        const healthRatio = member.health / member.maxHealth;
        return `
          <button class="party-portrait ${member.id === state.player.id ? "is-active" : ""} ${state.party.pendingTargetedSpecial ? "is-targetable" : ""} ${member.lifeState === "dead" ? "is-downed" : ""}" type="button" data-party-switch-member="${escapeHtml(member.id)}" style="--class-accent:${partyClass.accent}" aria-label="Switch to ${escapeHtml(partyClass.name)}">
            ${partyClass.portraitUrl ? `<img src="${partyClass.portraitUrl}" alt="" />` : `<span>${escapeHtml(partyClass.glyph)}</span>`}
            <em>${index + 1}</em>
            <i style="--value:${healthRatio}"></i>
          </button>
        `;
      }).join("")}
    </div>
    <div class="label-row"><strong>${currentClass.name}</strong><span>${Math.ceil(state.player.health)} / ${state.player.maxHealth}</span></div>
    <div class="bar"><div class="fill health" style="--value:${healthValue}"></div></div>
    <div class="label-row"><span>Gold</span><span>${state.round.gold}</span></div>
    <div class="label-row"><span>Phase</span><span>${escapeHtml(phaseLabel)}</span></div>
    <div class="label-row"><span>Round</span><span>${escapeHtml(resultLabel)}</span></div>
    <div class="label-row"><span>Bloom Meter</span><span>${Math.floor(state.player.meter)}</span></div>
    <div class="bar"><div class="fill meter" style="--value:${meterValue}"></div></div>
  `;

  const targetValue = state.enemy.health / state.enemy.maxHealth;
  const encounterCount = allEnemies(state).length;
  const activeEnemyCount = livingEnemies(state).length;
  const gear = state.combat.equippedGear;
  const droppedGear = state.combat.droppedGear;
  const autoLoop = state.combat.autoLoop;
  const currentAutoAbility = activeLatticeSequence(state)[autoLoop.currentSlotIndex];
  const autoStatus = autoLoop.restartTimer > 0
    ? `Restart ${autoLoop.restartTimer.toFixed(1)}s`
    : currentAutoAbility
      ? `${currentAutoAbility.name}${autoLoop.slotTimer > 0 ? ` ${autoLoop.slotTimer.toFixed(1)}s` : ""}`
      : "No auto";
  const hasteStatus = autoLoop.hasteTimer > 0 ? `Haste ${autoLoop.hasteTimer.toFixed(1)}s` : "Normal";
  const motherLoadStatus = state.party.motherLoadWindow.isActive
    ? `${state.party.motherLoadWindow.sourceAbilityName ?? "Special"} primed`
    : "Closed";
  const targetHtml = state.combat.targetLocked
    ? `
      <div class="label-row"><strong>${state.enemy.name}</strong><span>${state.enemy.state === "dead" ? "Respawning" : `${Math.ceil(state.enemy.health)} / ${state.enemy.maxHealth}`}</span></div>
      <div class="bar"><div class="fill target-health" style="--value:${targetValue}"></div></div>
      <div class="label-row"><span>Chain</span><span>${state.enemy.chainTag || "None"}</span></div>
      <div class="label-row"><span>Encounter</span><span>${activeEnemyCount} / ${encounterCount}</span></div>
      <div class="label-row"><span>Gear</span><span>${gear.rarity}</span></div>
      <div class="label-row"><span>Auto Loop</span><span>${autoStatus}</span></div>
      <div class="label-row"><span>Tempo</span><span>${hasteStatus}</span></div>
      <div class="label-row"><span>Mother Load</span><span>${motherLoadStatus}</span></div>
      <div class="${droppedGear ? "loot" : ""}">${droppedGear ? `${droppedGear.name}: ${droppedGear.ability}` : gear.ability}</div>
    `
    : `
      <div class="label-row"><strong>No Target</strong><span>Free facing</span></div>
      <div class="bar"><div class="fill target-health" style="--value:0"></div></div>
      <div class="label-row"><span>Chain</span><span>None</span></div>
      <div class="label-row"><span>Gear</span><span>${gear.rarity}</span></div>
      <div class="label-row"><span>Auto Loop</span><span>${autoStatus}</span></div>
      <div class="label-row"><span>Mother Load</span><span>${motherLoadStatus}</span></div>
      <div class="${droppedGear ? "loot" : ""}">${droppedGear ? `${droppedGear.name}: ${droppedGear.ability}` : gear.ability}</div>
    `;

  const abilitiesHtml = renderSkillBar(state);

  return { playerHtml, targetHtml, abilitiesHtml };
}

export function applyHud(targets: { playerPanel: HTMLElement; targetPanel: HTMLElement; abilityPanel: HTMLElement }, view: HudViewModel) {
  setPanelHtml(targets.playerPanel, view.playerHtml);
  setPanelHtml(targets.targetPanel, view.targetHtml);
  setPanelHtml(targets.abilityPanel, view.abilitiesHtml);
}

function setPanelHtml(target: HTMLElement, html: string) {
  if (panelHtmlCache.get(target) === html) return;
  target.innerHTML = html;
  panelHtmlCache.set(target, html);
}

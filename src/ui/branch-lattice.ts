import { activeLatticeSequence, branchLatticeFrame, partyMemberClass, selectedLatticePartyMember, type GameState } from "../game/state";
import type { FrameModifierOption, LatticeAbilityOption } from "../game/types";
import { branchOptionIconUrl } from "./branch-lattice-icons";

export type BranchLatticeViewModel = {
  abilityListHtml: string;
  modifierListHtml: string;
  latticeHtml: string;
  detailsHtml: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderAbilityOption(option: LatticeAbilityOption) {
  return `
    <button class="branch-option ability-option" type="button" draggable="true" data-branch-ability-option="${escapeHtml(option.id)}">
      ${renderBranchIcon(option.id, option.glyph)}
      <strong>${escapeHtml(option.name)}</strong>
      <em>${escapeHtml(option.detail)}</em>
    </button>
  `;
}

function renderModifierOption(option: FrameModifierOption) {
  return `
    <button class="branch-option modifier-option ${option.tone}" type="button" draggable="true" data-branch-modifier-option="${escapeHtml(option.id)}">
      ${renderBranchIcon(option.id, option.glyph)}
      <strong>${escapeHtml(option.name)}</strong>
      <em>${escapeHtml(option.detail)}</em>
    </button>
  `;
}

function renderBranchIcon(optionId: string, fallbackGlyph: string) {
  const iconUrl = branchOptionIconUrl(optionId);
  return iconUrl
    ? `<span class="branch-icon"><img src="${iconUrl}" alt="" aria-hidden="true"></span>`
    : `<span>${escapeHtml(fallbackGlyph)}</span>`;
}

function renderSocketPreview(option: LatticeAbilityOption | FrameModifierOption, label: string) {
  return `
    <span class="branch-socket-preview" role="tooltip">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(option.name)}</strong>
      <em>${escapeHtml(option.detail)}</em>
    </span>
  `;
}

type LatticeSocketLayout =
  | { kind: "ability"; index: number; x: number; y: number }
  | { kind: "modifier"; index: number; x: number; y: number };

const latticeSocketLayout: LatticeSocketLayout[] = [
  { kind: "modifier", index: 0, x: 72, y: 6 },
  { kind: "ability", index: 0, x: 31, y: 14 },
  { kind: "modifier", index: 1, x: 72, y: 21 },
  { kind: "ability", index: 1, x: 31, y: 31 },
  { kind: "modifier", index: 2, x: 72, y: 38 },
  { kind: "ability", index: 2, x: 31, y: 48 },
  { kind: "modifier", index: 3, x: 72, y: 55 },
  { kind: "ability", index: 3, x: 31, y: 66 },
  { kind: "modifier", index: 4, x: 72, y: 72 },
  { kind: "ability", index: 4, x: 31, y: 84 },
  { kind: "modifier", index: 5, x: 72, y: 91 },
];

export function renderBranchLattice(state: GameState): BranchLatticeViewModel {
  const member = selectedLatticePartyMember(state);
  const currentClass = partyMemberClass(state, member.id);
  const gear = member.equippedGear;
  const frame = branchLatticeFrame(state, member.id);
  const { branchLattice } = member;
  const abilityOptions = frame.latticeAbilityOptions;
  const modifierOptions = frame.modifierOptions;
  const assignedAbilityIds = new Set(branchLattice.abilitySlotIds.filter(Boolean));
  const assignedModifierIds = new Set(branchLattice.modifierSlotIds.filter(Boolean));
  const availableAbilityOptions = abilityOptions.filter((option) => !assignedAbilityIds.has(option.id));
  const availableModifierOptions = modifierOptions.filter((option) => !assignedModifierIds.has(option.id));

  const abilityListHtml = availableAbilityOptions.length
    ? availableAbilityOptions.map((option) => renderAbilityOption(option)).join("")
    : `<p class="branch-empty-copy">All auto abilities are slotted.</p>`;
  const modifierListHtml = availableModifierOptions.length
    ? availableModifierOptions.map((option) => renderModifierOption(option)).join("")
    : `<p class="branch-empty-copy">All modifiers are slotted.</p>`;

  const rows = latticeSocketLayout.map((socket) => {
    const style = `style="--socket-x:${socket.x}%; --socket-y:${socket.y}%;"`;
    if (socket.kind === "ability") {
      const abilityOptionId = branchLattice.abilitySlotIds[socket.index];
      const abilityOption = abilityOptionId ? abilityOptions.find((option) => option.id === abilityOptionId) : null;
      return `
        <button class="branch-socket ability-socket ${abilityOption ? "is-filled" : ""} ${branchLattice.selectedAbilitySlot === socket.index ? "is-selected" : ""}" type="button" draggable="${abilityOption ? "true" : "false"}" data-branch-ability-slot="${socket.index}" ${style}>
          ${abilityOption ? renderBranchIcon(abilityOption.id, abilityOption.glyph) : ""}
          ${abilityOption ? renderSocketPreview(abilityOption, "Ability") : ""}
        </button>
      `;
    }

    const modifierOptionId = branchLattice.modifierSlotIds[socket.index];
    const modifierOption = modifierOptionId ? modifierOptions.find((option) => option.id === modifierOptionId) : null;
    return `
      <button class="branch-socket modifier-socket ${modifierOption ? `is-filled ${modifierOption.tone}` : ""} ${branchLattice.selectedModifierSlot === socket.index ? "is-selected" : ""}" type="button" draggable="${modifierOption ? "true" : "false"}" data-branch-modifier-slot="${socket.index}" ${style}>
        ${modifierOption ? renderBranchIcon(modifierOption.id, modifierOption.glyph) : ""}
        ${modifierOption ? renderSocketPreview(modifierOption, "Modifier") : ""}
      </button>
    `;
  });

  const latticeHtml = rows.join("");
  const active = activeLatticeSequence(state, member.id).filter((ability): ability is LatticeAbilityOption => Boolean(ability));
  const selectedAbilityId =
    branchLattice.selectedAbilitySlot === null ? null : branchLattice.abilitySlotIds[branchLattice.selectedAbilitySlot];
  const selectedModifierId =
    branchLattice.selectedModifierSlot === null ? null : branchLattice.modifierSlotIds[branchLattice.selectedModifierSlot];
  const selectedAbilityOption = selectedAbilityId
    ? abilityOptions.find((option) => option.id === selectedAbilityId)
    : null;
  const selectedModifierOption = selectedModifierId
    ? modifierOptions.find((option) => option.id === selectedModifierId)
    : null;

  const detailsHtml = `
    <div class="party-tabs" role="tablist" aria-label="Party Branch Lattice">
      ${state.party.members.map((partyMember) => {
        const tabClass = partyMember.id === member.id ? "is-selected" : "";
        const partyClass = partyMemberClass(state, partyMember.id);
        return `<button class="party-tab ${tabClass}" type="button" data-party-lattice-member="${escapeHtml(partyMember.id)}" style="--class-accent:${partyClass.accent}">${escapeHtml(partyClass.name)}</button>`;
      }).join("")}
    </div>
    <span>${escapeHtml(gear.rarity)} Frame Gear</span>
    <strong>${escapeHtml(gear.name)}</strong>
    <p>${escapeHtml(gear.ability)}</p>
    <div class="branch-detail-grid">
      <div><em>Class</em><b>${escapeHtml(currentClass.name)}</b></div>
      <div><em>Auto Loop</em><b>${active.map((ability) => escapeHtml(ability.name)).join(", ") || "None"}</b></div>
      <div><em>Auto Slot</em><b>${selectedAbilityOption ? escapeHtml(selectedAbilityOption.name) : "Empty"}</b></div>
      <div><em>Modifier Slot</em><b>${selectedModifierOption ? escapeHtml(selectedModifierOption.name) : "Empty"}</b></div>
    </div>
    ${branchLattice.isPreviewOpen ? `<p class="branch-preview-copy">Auto abilities run top to bottom, then wait 3 seconds before restarting. Haste speeds sequence timers while active.</p>` : ""}
  `;

  return { abilityListHtml, modifierListHtml, latticeHtml, detailsHtml };
}

export function applyBranchLattice(
  targets: {
    abilities: HTMLElement;
    modifiers: HTMLElement;
    lattice: HTMLElement;
    details: HTMLElement;
  },
  view: BranchLatticeViewModel,
) {
  targets.abilities.innerHTML = view.abilityListHtml;
  targets.modifiers.innerHTML = view.modifierListHtml;
  targets.lattice.innerHTML = view.latticeHtml;
  targets.details.innerHTML = view.detailsHtml;
}

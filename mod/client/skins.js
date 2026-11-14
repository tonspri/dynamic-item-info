// Dynamic Item Info: Equipment, Status and Skill Tree in the same look as the Inventory.
// These windows keep the client's own layout and handlers: slots, stat rows and
// skill cells stay where the client puts them, and only colours, shapes and the
// client's background pictures change. Where a picture carried text (the stat
// names in the Status window), the names are drawn back as text.

const THEME = `
.sw {
    --ink: #47476b; --soft: #7d7fa3; --blue: #4f7fe0; --blue-deep: #3559bd; --gold: #eeb044; --gold-ink: #8a5a12;
    --bg: radial-gradient(ellipse 220px 70px at 85% 4%, rgba(255,255,255,.75), transparent), linear-gradient(160deg, #c9d6f8 0%, #dfd8f6 42%, #f5dfe9 76%, #fdeedd 100%);
    --ring: #8ea3dd; --panel: rgba(255,253,246,.92); --panel-ring: rgba(255,255,255,.95);
    --chip: rgba(255,255,255,.72); --chip-ink: #6b6e98; --chip-hover: #fff;
    --accent: linear-gradient(#6d97ee, #3559bd); --accent-ink: #fff;
    --slot: rgba(120,138,205,.11); --slot-hover: #fff; --up: rgba(79,127,224,.22); --pick: rgba(79,127,224,.28);
    --label: rgba(53,89,189,.96); --label-ink: #fff;
    --title: linear-gradient(90deg, #4f74d6, #7b9cec 55%, #b7a4ec);
    color: var(--ink);
}
.sw.sw-dark {
    --ink: #e6e8ff; --soft: #a9acd6; --blue: #8fb0ff; --blue-deep: #b9cdff; --gold-ink: #f5d58a;
    --bg: radial-gradient(ellipse 220px 70px at 85% 4%, rgba(160,140,255,.22), transparent), linear-gradient(160deg, #1f2550 0%, #2d2a5e 55%, #3d2a52 100%);
    --ring: #4b4f8f; --panel: rgba(255,255,255,.06); --panel-ring: rgba(255,255,255,.08);
    --chip: rgba(255,255,255,.09); --chip-ink: #c3c6ee; --chip-hover: rgba(255,255,255,.16);
    --accent: linear-gradient(#f3c063, #d99a2b); --accent-ink: #3a2604;
    --slot: rgba(255,255,255,.06); --slot-hover: rgba(255,255,255,.14); --up: rgba(238,176,68,.22); --pick: rgba(238,176,68,.3);
    --label: rgba(20,22,52,.96); --label-ink: #f5d58a;
    --title: linear-gradient(90deg, #2b3170, #3d3a80 55%, #5a3f78);
}
@media (prefers-reduced-motion: reduce) { .sw * { transition: none !important; } }
`;

// The title bar every window shares. Height stays the client's where other parts
// are placed from the window's top edge.
const titlebar = (R, height) => `
${R} .titlebar { display: flex; align-items: center; height: ${height}px; padding: 0 6px; box-sizing: border-box; width: auto; background: var(--title) !important; border-radius: 0; }
${R} .titlebar .left, ${R} .titlebar .right { float: none; margin: 0; display: flex; align-items: center; gap: 5px; height: auto; }
${R} .titlebar .left { flex: 1; min-width: 0; }
${R} .titlebar .clear, ${R} .titlebar .left .base, ${R} .titlebar > ui-image { display: none; }
${R} .titlebar .text { width: auto; height: auto; font-size: 12px; font-weight: 600; color: #fff; letter-spacing: .3px; text-shadow: 0 1px 2px rgba(20,30,90,.6); vertical-align: 0; }
${R} .titlebar .right { color: #fff; font-size: 11px; }
${R} .titlebar .right .base { display: inline-block; width: ${Math.min(height - 4, 16)}px; height: ${Math.min(height - 4, 16)}px; border-radius: 50%; border: 0; padding: 0; cursor: pointer;
    background: rgba(255,255,255,.22) !important; color: #fff; font: 600 11px/${Math.min(height - 4, 16)}px "Segoe UI", sans-serif; text-align: center; transition: background .15s ease, transform .15s ease; }
${R} .titlebar .right .base:hover { background: rgba(255,255,255,.4) !important; transform: scale(1.08); }
${R} .titlebar .mini::before { content: "\\2013"; }
${R} .titlebar .close::before { content: "\\00d7"; font-size: 13px; }
${R} .ro-custom-scrollbar { width: 8px !important; }
${R} .ro-custom-scrollbar .btn-up, ${R} .ro-custom-scrollbar .btn-down { height: 6px; background: none !important; }
${R} .ro-custom-scrollbar .track { background: none !important; }
${R} .ro-custom-scrollbar .thumb { background: var(--soft) !important; border: 0 !important; border-radius: 9px; opacity: .55; }
`;

const frame = R => `${R} { background: var(--bg); border-radius: 14px; overflow: hidden; box-shadow: 0 0 0 1px var(--ring), 0 10px 30px rgba(36,44,96,.42); font-family: "Segoe UI", system-ui, sans-serif; }`;

// Empty equipment slots, named the way the game names them.
const SLOTS = { head_top: 'Upper', head_mid: 'Middle', head_bottom: 'Lower', armor: 'Armor', weapon: 'Weapon', shield: 'Shield', garment: 'Garment', shoes: 'Shoes', accessory1: 'Accessory', accessory2: 'Accessory',
    costume_head_top: 'Upper', costume_head_mid: 'Middle', costume_head_bottom: 'Lower', costume_robe: 'Garment', shadow_armor: 'Armor', shadow_weapon: 'Weapon', shadow_shield: 'Shield', shadow_garment: 'Garment', shadow_shoes: 'Shoes', shadow_accessory1: 'Earring', shadow_accessory2: 'Pendant' };

const E = '#EquipmentV4.sw';
export const EQUIPMENT = THEME + frame(E) + titlebar(E, 22) + `
${E} .tab-manager { background: transparent; height: 26px; gap: 4px; padding: 5px 7px 0; box-sizing: border-box; }
${E} .tab-manager > .tab { flex: 0 1 auto; }
${E} .tab a { height: 20px; padding: 0 9px; border: 0; border-radius: 99px; background: var(--chip); color: var(--chip-ink); font: 600 11px "Segoe UI", sans-serif; box-shadow: 0 1px 3px rgba(60,70,150,.15); transition: background .15s ease; }
${E} .tab a:hover { background: var(--chip-hover); }
${E} .tab a.selected { height: 20px; border: 0; background: var(--accent); color: var(--accent-ink); }
${E} .panel { background: transparent; border-top: 0; height: auto; padding: 6px 0 4px; }
${E} table.content { background: transparent !important; }
${E} .content td.col1, ${E} .content td.col3 { position: relative; }
${E} .content .item { display: flex; align-items: center; gap: 4px; height: 24px; margin: 0 3px; padding: 0 4px; box-sizing: border-box; border-radius: 8px; background: var(--chip); box-shadow: inset 0 0 0 1px var(--panel-ring); transition: background .14s ease, box-shadow .14s ease; }
${E} .col3 .item { flex-direction: row-reverse; text-align: right; }
${E} .content .item:hover { background: var(--slot-hover); box-shadow: 0 0 0 1.5px var(--blue), 0 3px 9px rgba(60,70,170,.25); }
${E} .content .item button, ${E} .content .item span { float: none; flex: none; }
${E} .content .item span { width: 68px; height: auto; max-height: 24px; color: var(--ink); text-shadow: none; font-size: 10.5px; line-height: 12px; }
${E} .content .item .itemName { display: flex; align-items: center; }
${E} .col3 .item .itemName { justify-content: flex-end; }
${E} .content td.col1:empty::before, ${E} .content td.col3:empty::before { position: absolute; top: 2px; bottom: 2px; left: 4px; right: 4px; display: flex; align-items: center; padding: 0 8px; border-radius: 8px;
    background: var(--slot); color: var(--soft); font-size: 10.5px; content: attr(data-sw-slot); }
${E} .content td.col3:empty::before { justify-content: flex-end; }
${Object.entries(SLOTS).map(([slot, name]) => `${E} .content td.${slot}:empty::before { content: "${name}"; }`).join('\n')}
${E} .col2.ammo_container { border-radius: 12px; background: radial-gradient(circle at 50% 62%, rgba(255,255,255,.7), transparent 68%); }
${E}.sw-dark .col2.ammo_container { background: radial-gradient(circle at 50% 62%, rgba(160,150,255,.2), transparent 68%); }
${E} .ammo .item { margin: 0; }
${E} .attachment-controls { background: none !important; }
${E} .attachment-control { color: var(--ink); text-shadow: none; }
${E} .footer { background: none !important; border-bottom: 0; height: 24px; color: var(--ink); }
${E} .footer .left label { color: var(--ink); }
${E} .footer .right button { border-radius: 5px; transition: transform .13s ease, filter .13s ease; }
${E} .footer .right button:hover { transform: translateY(-1px); filter: brightness(1.1); }
${E} .overlay { border-radius: 8px; background: var(--label); color: var(--label-ink); text-shadow: none; padding: 5px 8px; box-shadow: 0 4px 14px rgba(20,30,90,.35); }
${E} #title .title-list { background: var(--panel); border: 0; border-radius: 10px; box-sizing: border-box; color: var(--ink); }
${E} .title-option { border-radius: 6px; }
${E} .title-option:hover, ${E} .title-option.selected { background: var(--pick); }
`;

// The Status window places every row from its own top edge, so its title bar
// keeps the client's 17px and the rows stay put.
const S = '#WinStats.sw';
const NAMES = {
    stats: ['str', 'agi', 'vit', 'int', 'dex', 'luk'], statNames: ['Str', 'Agi', 'Vit', 'Int', 'Dex', 'Luk'],
    traits: ['pow', 'sta', 'wis', 'spl', 'con', 'crt'], traitNames: ['Pow', 'Sta', 'Wis', 'Spl', 'Con', 'Crt'],
};
// Labels sit left of each value: "left" counts from the stat's own column,
// "right" puts the label's left edge that many pixels before the value's right edge.
const statLabels = (group, keys, names) => keys.map((key, i) => `${S} .${group} .${key}::before { content: "${names[i]}"; }`).join('\n');
const rowLabels = (selector, names, offset) => names.map((name, i) => `${S} ${selector} > :nth-child(${i + 1})::before { content: "${name}"; position: absolute; right: ${offset}px; transform: translateX(100%); color: var(--soft); font-weight: 400; }`).join('\n');
export const STATUS = THEME + titlebar(S, 17) + `
${S} { background: var(--bg); border-radius: 14px; box-shadow: 0 0 0 1px var(--ring), 0 10px 30px rgba(36,44,96,.42); font-family: "Segoe UI", system-ui, sans-serif; height: 142px; }
${S} .titlebar { border-radius: 14px 14px 0 0; }
${S} .common_stats { background: var(--panel) !important; margin: 3px 4px 0; height: 118px; border-radius: 10px; box-shadow: inset 0 0 0 1px var(--panel-ring); }
${S} .traits_panel { background: var(--bg) !important; border-radius: 0 0 14px 14px; box-shadow: 0 0 0 1px var(--ring), 0 10px 30px rgba(36,44,96,.42); }
${S} .group div, ${S} .trait div { position: relative; }
${S} .group.stats div, ${S} .trait.stats div { font-weight: 600; color: var(--ink); }
${S} .group.stats div::before, ${S} .trait.stats div::before { position: absolute; left: -31px; color: var(--soft); font-weight: 600; }
${statLabels('group.stats', NAMES.stats, NAMES.statNames)}
${statLabels('trait.stats', NAMES.traits, NAMES.traitNames)}
${S} .bonus div { color: var(--blue-deep); font-size: 10.5px; }
${S} .requirements div, ${S} .t_requirements div { color: var(--soft); }
${S} .column1 div, ${S} .column2 div, ${S} .t_column1 div, ${S} .t_column2 div { font-weight: 600; }
${rowLabels('.group.column1', ['Atk', 'Matk', 'Hit', 'Critical'], 83)}
${rowLabels('.group.column2', ['Def', 'Mdef', 'Flee', 'Aspd', 'Points', 'Guild'], 79)}
${rowLabels('.group.t_column1', ['P.Atk', 'S.Matk', 'H.Plus', 'C.Rate'], 83)}
${rowLabels('.group.t_column2', ['Res', 'Mres'], 79)}
${S} .trait_point::before { content: "Points"; position: absolute; right: 79px; transform: translateX(100%); color: var(--soft); font-weight: 400; }
/* The raise buttons: round blue plus signs instead of the client's arrows. */
${S} .up button, ${S} .t_up button { position: relative; border-radius: 50%; background: var(--accent) !important; cursor: pointer; transition: transform .12s ease, filter .12s ease; }
${S} .up button::after, ${S} .t_up button::after { content: "+"; position: absolute; inset: 0; color: var(--accent-ink); font: 700 10px/11px "Segoe UI", sans-serif; text-align: center; }
${S} .up button:hover, ${S} .t_up button:hover { transform: scale(1.18); filter: brightness(1.1); }
${S} .footer .left label, ${S} .trait_text { color: var(--ink); }
${S} .desc .hover { border-radius: 8px; background: var(--label); color: var(--label-ink); text-shadow: none; padding: 6px 9px; box-shadow: 0 4px 14px rgba(20,30,90,.35); }
/* Trait Status toggle: a themed pill and a round icon button, same chip as elsewhere. */
${S} .view_traits { border-radius: 6px; background: var(--chip) !important; background-image: none !important; cursor: pointer; }
${S} .view_traits:hover { background: var(--chip-hover) !important; }
${S} .trait_text { padding: 2px 9px; border-radius: 99px; background: var(--chip); font: 600 10.5px "Segoe UI", sans-serif; cursor: pointer; white-space: nowrap; }
`;

const K = '#SkillListV2.sw';
export const SKILLS = THEME + frame(K) + titlebar(K, 22) + `
${K} { border: 0; line-height: 18px; }
${K} .border { border: 0; margin: 0; border-radius: 14px; }
${K} .titlebar .right input { margin: 0 2px 0 0; accent-color: #fff; }
${K} .content, ${K} .contentbig { border-top: 0; }
/* Tabs: pills along the top instead of the client's sideways labels. */
${K} .tabs, ${K} .tabs-mini { display: flex; gap: 4px; height: 100%; align-items: flex-start; padding-left: 4px; }
${K} .tabs::before, ${K} .tabs::after, ${K} .tabs-mini::before, ${K} .tabs-mini::after { display: none; }
${K} .tab, ${K} .tab-mini { position: static; }
${K} .tab-label, ${K} .tab-label-mini { writing-mode: horizontal-tb; text-orientation: mixed; position: static; display: block; left: 0; width: auto; margin: 4px 0 0; padding: 0 11px; height: 20px; line-height: 20px;
    border: 0; border-radius: 99px; background: var(--chip); color: var(--chip-ink); font: 600 11px/20px "Segoe UI", sans-serif; box-shadow: 0 1px 3px rgba(60,70,150,.15); cursor: pointer; }
${K} .tab-label:hover, ${K} .tab-label-mini:hover { background: var(--chip-hover); }
${K} .tab-switch:checked + .tab-label, ${K} .tab-switch-mini:checked + .tab-label-mini { width: auto; left: 0; background: var(--accent); color: var(--accent-ink); }
${K} .tab-content, ${K} .tab-content-mini { top: 30px; bottom: 2px; left: 2px; right: 2px; width: auto; height: auto; border-top: 0; border-radius: 12px; box-shadow: inset 0 0 0 1px var(--panel-ring); }
${K} .tab-content-mini { background: var(--panel); }
/* The big tree view keeps the game's own sitting character behind it (z-index:0,
   pointer-events:none, drawn by the client itself); the game's own panel here was
   transparent to let it show through. Our panel kept that goal with a lower alpha
   than elsewhere, instead of the near-opaque fill that otherwise washed it out. */
${K} .tab-content { background: rgba(255, 253, 246, .5); }
${K}.sw-dark .tab-content { background: rgba(255, 255, 255, .04); }
/* Skill cells. */
${K} .skillCol { border: 1px solid transparent; border-radius: 9px; background: var(--slot); box-shadow: inset 0 0 0 1px var(--panel-ring); transition: background .14s ease, box-shadow .14s ease; }
${K} .skillCol:hover { background: var(--slot-hover); box-shadow: 0 0 0 1.5px var(--blue), 0 3px 9px rgba(60,70,170,.25); }
${K} .skillCol .name { color: var(--ink); font-size: 10.5px; }
${K} .upgradable { background: var(--up); }
${K} .selected .selectable, ${K} .selected.passive .selectable { background: var(--pick); border-radius: 6px; }
${K} .selected.disabled .selectable { background: var(--slot); }
${K} .content div.name { color: var(--ink); }
${K} .content tr:hover td { background: var(--slot); }
${K} .content .level, ${K} .content .consume { color: var(--soft); }
${K} .footer { background: none !important; color: var(--ink); }
${K} .footer > ui-image { display: none; }
${K} .footer .text { font-weight: 600; }
${K} .footer .skpoints_count { color: var(--gold-ink); font-weight: 700; }
/* Apply and Reset draw their own label into the bitmap; hide it and draw real text,
   the same way the npc shop's Buy/Sell/Cancel do. */
${K} .footer .btn { background-image: none !important; border-radius: 99px; box-shadow: 0 1px 3px rgba(60,70,150,.22); font: 700 11px "Segoe UI", sans-serif; cursor: pointer; transition: transform .12s ease, filter .12s ease; }
${K} .footer .btn::after { content: ""; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font: 700 11px "Segoe UI", sans-serif; }
${K} .footer .btn:hover { transform: translateY(-1px); filter: brightness(1.08); }
${K} .footer .btn.apply { background: var(--accent) !important; }
${K} .footer .btn.apply::after { content: "Apply"; color: var(--accent-ink); }
${K} .footer .btn.reset { background: var(--chip) !important; }
${K} .footer .btn.reset::after { content: "Reset"; color: var(--chip-ink); }
`;

// Party and Friends.
const P = '#PartyFriends.sw';
export const PARTY = THEME + frame(P) + titlebar(P, 22) + `
${P} .titlebar .party, ${P} .titlebar .friend { width: auto; height: auto; color: #fff; font: 600 12px "Segoe UI", sans-serif; text-shadow: 0 1px 2px rgba(20,30,90,.6); vertical-align: 0; }
${P} .titlebar .partyname { margin-left: 6px; font-weight: 400; opacity: .9; }
${P} .content { margin: 6px 6px 0; border-radius: 10px; background: var(--panel) !important; box-shadow: inset 0 0 0 1px var(--panel-ring); }
${P} .content .party.info-v2 .node { margin: 2px 3px; border-radius: 8px; background: transparent; transition: background .14s ease; }
${P} .content .party.info-v2 .node:hover, ${P} .content .node .selection { background: var(--pick); }
${P} .content .party.info-v2 .node.detached { background: var(--slot); }
${P} .content .party.info-v2 .node .name, ${P} .content .friend .node .name { color: var(--ink); }
${P} .content .party.info-v2 .node .level { color: var(--gold-ink); }
${P} .content .party.info-v2 .node .map, ${P} .content .party.info-v2 .node .hp { color: var(--soft); }
${P} .content .party.info-v2 .node .job-icon-container { border: 0; border-radius: 7px; background: var(--chip); box-shadow: inset 0 0 0 1px var(--panel-ring); }
${P} .content .party.info-v2 .node .hp-bar-container { border: 0; border-radius: 9px; background: rgba(60,62,100,.3); }
${P} .content .friend .node { border-radius: 6px; }
${P} .navigation { width: auto; height: 24px; margin: 6px; padding: 2px 4px; box-sizing: border-box; border-radius: 9px; background: var(--chip) !important; box-shadow: inset 0 0 0 1px var(--panel-ring); }
${P} .navigation > ui-image { display: none; }
${P} .navigation ui-button { border-radius: 6px; transition: transform .13s ease, filter .13s ease; }
${P} .navigation ui-button:hover { transform: translateY(-1px); filter: brightness(1.1); }
${P} .navigation ui-button .overlay { top: -28px; height: auto; padding: 4px 8px; border-radius: 8px; background: var(--label); color: var(--label-ink); text-shadow: none; }
${P} .footer { background: none !important; height: 26px; }
${P} .footer > ui-image, ${P} .footer .switchtab ui-image { display: none; }
${P} .footer .party, ${P} .footer .friend { display: flex; align-items: center; gap: 4px; padding: 0 0 0 6px; height: 22px; }
${P} .footer .switchtab { height: 20px; padding: 0 11px; border-radius: 99px; background: var(--chip) !important; color: var(--chip-ink); font: 600 11px "Segoe UI", sans-serif; cursor: pointer; }
${P} .footer .switchtab.on { background: var(--accent) !important; color: var(--accent-ink); }
${P} .footer .member-count-container .footer-label { color: var(--soft); }
${P} .footer .member-count-container .count-box { border-radius: 99px; background: var(--accent) !important; }
`;

// Guild: a fixed 400 by 317 window, so every part keeps its size.
const D = '#Guild.sw';
export const GUILD = THEME + frame(D) + titlebar(D, 17) + `
${D} .titlebar::before { content: "Guild"; flex: 1; color: #fff; font: 600 12px "Segoe UI", sans-serif; text-shadow: 0 1px 2px rgba(20,30,90,.6); }
${D} .tabs { display: flex; gap: 3px; padding: 2px 4px 0; box-sizing: border-box; background: transparent; }
${D} .tabs button { width: 62px; height: 20px; margin: 0; padding: 0 5px; border-radius: 99px; background: var(--chip); color: var(--chip-ink); font: 600 11px "Segoe UI", sans-serif; text-align: center; box-shadow: 0 1px 3px rgba(60,70,150,.15); cursor: pointer; }
${D} .tabs button:hover { background: var(--chip-hover); }
${D} .tabs button.active { background: var(--accent); color: var(--accent-ink); }
${D} .tabs button.denied { opacity: .5; }
${D} .panel { background: var(--panel); box-shadow: inset 0 1px 0 var(--panel-ring); color: var(--ink); }
${D} .content .value, ${D} .content .numMember, ${D} .content .maxMember { font-weight: 600; }
${D} .content th { background: var(--chip); color: var(--soft); font-weight: 600 !important; }
${D} .content th, ${D} .content td, ${D} .content tr { border-color: rgba(120,138,205,.22) !important; }
${D} .content.members tr.online td { background: rgba(95,174,95,.13); }
${D} .content.members tr.active td { background: var(--pick) !important; }
${D} .content input, ${D} .content textarea, ${D} .content select { border: 0; border-radius: 6px; background: var(--chip); color: var(--ink); box-shadow: inset 0 0 0 1px var(--panel-ring); }
${D} .footer { background: none !important; color: var(--ink); }
${D} .footer > ui-image { display: none; }
${D} .footer .skpoints_count { color: var(--gold-ink); font-weight: 700; }
${D} .emblem_drop { border-color: var(--blue); border-radius: 14px; background: var(--panel); }
${D} .ally_list, ${D} .hostile_list, ${D} .emblem_container { border: 0 !important; border-radius: 8px; background: var(--chip) !important; box-shadow: inset 0 0 0 1px var(--panel-ring); }
`;

// The FPS counter: not in GENERIC_WINDOWS. Its "titlebar" is the whole 80x20 window
// (no close button, no separate content row), with the two readouts floated side by
// side onto one cramped line -- the real reason it was hard to read, not just color.
// This is the recommended "compact, clearly readable" option: a small pill, stacked
// rows, enlarged just enough to read at a glance without covering gameplay. (A
// slightly larger panel, or a resizable one, are shown as alternatives in the report
// this shipped with; this is the one built and installed.)
const F = '#FPS.sw';
export const FPS = THEME + `
:host { width: 94px !important; height: 44px !important; }
${F} { position: absolute; inset: 0; background: var(--bg) !important; border-radius: 10px; box-shadow: 0 0 0 1px var(--ring), 0 6px 16px rgba(36,44,96,.35); font-family: "Segoe UI", system-ui, sans-serif; overflow: hidden; }
${F} .titlebar { position: static; width: auto; height: auto; background: none !important; display: flex; flex-direction: column; justify-content: center; gap: 2px; padding: 4px 10px; }
${F} .titlebar .left { float: none; margin: 0; display: block; white-space: nowrap; }
${F} .titlebar .left:first-child { color: var(--ink); font: 700 15px "Segoe UI", sans-serif; }
${F} .titlebar .left:first-child span { color: var(--blue-deep); }
${F} .titlebar .fps-low { color: var(--soft); font: 600 10px "Segoe UI", sans-serif; }
${F} .titlebar .fps-low span { color: var(--soft); }
`;

// The NPC shop: not in GENERIC_WINDOWS, because #NpcStore has no titlebar or close
// button of its own. It holds up to four floating panels (shop list, buy/sell cart,
// a buying store's search and its result), each with its own decorative title bar
// drawn by the game as a plain white strip; this draws them in the shared theme
// instead. Buy, Sell, Cancel and OK draw their label into their own bitmap, so the
// bitmap is hidden and the label is redrawn as real text.
const N = '#NpcStore.sw';
export const NPCSTORE = THEME + `
${N} { font-family: "Segoe UI", system-ui, sans-serif; }
${N} .InputWindow, ${N} .OutputWindow, ${N} .AvailableItemsWindow, ${N} .PurchaseResult { border-radius: 14px; overflow: hidden; box-shadow: 0 0 0 1px var(--ring), 0 10px 30px rgba(36,44,96,.42); }
${N} .titlebar { background: var(--title) !important; }
${N} .titlebar ui-image { display: none; }
${N} .titlebar .text { color: #fff; text-shadow: 0 1px 2px rgba(20,30,90,.6); font: 600 11px "Segoe UI", sans-serif; }
${N} .container { background: var(--panel) !important; }
${N} .container > ui-image { display: none; }
${N} .content { background: none !important; }
${N} .content > ui-image { display: none; }
${N} .content .item { border-radius: 8px; transition: background .14s ease; }
${N} .content .item:hover, ${N} .content .item.selected { background: var(--pick) !important; }
${N} .content .item .name { color: var(--ink); }
${N} .content .item .price { color: var(--blue-deep); font-weight: 600; }
${N} .content .item .amount, ${N} .content .item .amountStock, ${N} .content .item .amountBuying { color: var(--soft); }
${N} .footer { background: var(--chip) !important; }
${N} .footer > ui-image { display: none; }
${N} .footer .total, ${N} .footer .totalP, ${N} .footer .limitZeny, ${N} .footer .cashuser, ${N} .footer .ask_quantity { color: var(--ink); }
${N} .footer .result, ${N} .footer .resultP { color: var(--gold-ink); font-weight: 600; }
${N} .btn { background-image: none !important; border-radius: 99px; font: 700 11px "Segoe UI", sans-serif; color: transparent; cursor: pointer; transition: transform .12s ease, filter .12s ease; }
${N} .btn::after { content: ""; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font: 700 11px "Segoe UI", sans-serif; }
${N} .btn:hover { transform: translateY(-1px); filter: brightness(1.08); }
${N} .btn.buy, ${N} .btn.sell, ${N} .btn.ok { background: var(--accent) !important; }
${N} .btn.buy::after, ${N} .btn.sell::after, ${N} .btn.ok::after { color: var(--accent-ink); }
${N} .btn.buy::after { content: "Buy"; } ${N} .btn.sell::after { content: "Sell"; } ${N} .btn.ok::after { content: "OK"; }
${N} .btn.cancel { background: var(--chip) !important; }
${N} .btn.cancel::after { content: "Cancel"; color: var(--chip-ink); }
`;

// Every other client window: only the frame and title bar, so nothing inside moves.
// Their insides are the game's own pictures, so they stay light in the midnight theme.
export const GENERIC = `
.swg { --title: linear-gradient(90deg, #4f74d6, #7b9cec 55%, #b7a4ec); --ring: #8ea3dd; border-radius: 10px !important; box-shadow: 0 0 0 1px var(--ring), 0 8px 24px rgba(36,44,96,.35) !important; }
.swg.sw-dark { --title: linear-gradient(90deg, #2b3170, #3d3a80 55%, #5a3f78); --ring: #4b4f8f; }
.swg .titlebar { background: var(--title) !important; border-radius: 10px 10px 0 0 !important; color: #fff !important; text-shadow: 0 1px 2px rgba(20,30,90,.6) !important; }
.swg .titlebar > ui-image { display: none; }
.swg .titlebar .text, .swg .titlebar ui-text, .swg .titlebar .left > span { color: #fff !important; text-shadow: 0 1px 2px rgba(20,30,90,.6) !important; }
.swg .titlebar .left .base { visibility: hidden; }
.swg .titlebar .right .base { position: relative; border-radius: 50%; background: rgba(255,255,255,.25) !important; cursor: pointer; }
.swg .titlebar .right .base:hover { background: rgba(255,255,255,.45) !important; }
.swg .titlebar .close::before, .swg .titlebar .mini::before { position: absolute; inset: 0; color: #fff; font: 700 10px/11px "Segoe UI", sans-serif; text-align: center; }
.swg .titlebar .close::before { content: "\\00d7"; }
.swg .titlebar .mini::before { content: "\\2013"; }
.swg .ro-custom-scrollbar { width: 8px !important; }
.swg .ro-custom-scrollbar .btn-up, .swg .ro-custom-scrollbar .btn-down { height: 6px; background: none !important; }
.swg .ro-custom-scrollbar .track { background: none !important; }
.swg .ro-custom-scrollbar .thumb { background: #8a8db8 !important; border: 0 !important; border-radius: 9px; opacity: .6; }
`;

// The client's window roots that get the plain frame. The windows with their own look
// above, the Inventory and Dynamic Item Info's item windows are left out, and so are
// the windows whose titlebar element wraps the whole window (Quest, Quest info,
// attendance, party helper, NPC shop) or that have none at the top.
export const GENERIC_WINDOWS = new Set(`Bank CaptchaAnswer CaptchaPreview CaptchaSelector CaptchaUpload CardIllustration CashShop ChatBoxSettings ChatRoom ChatRoomCreate Clan ConvertItems
    Emoticons Enchant EnchantGrade EquipmentV0 EquipmentV1 EquipmentV2 EquipmentV3 GraphicsOption GuildCompanion InventoryV0 InventoryV1
    InventoryV2 ItemListWindowSelection ItemPreview ItemReform LaphineSys LaphineUpg Mail MakeModelMessage MakeReadBook MemorialDungeon PetEvolution PetInformations
    Pincodewindow ReadMail ReadRodex Refine Reputation Rodex Roulette ShortCutOption ShortCuts SoundOption Storage StorageFilter
    Stylist SwitchEquip Trade VendingModelMessage VendingReport WorldMap WriteRodex cartdecoration cartitems changecart vending vendingshop`.split(/\s+/).filter(Boolean));


// Basic Info: the character panel and its menu, in concept C. The game picks BasicInfoV4
// for any job below 4th class and BasicInfoV5 for a 4th class, regardless of packetver
// (UIVersionManager.selectUIVersionWithJob), so both ids are skinned here. Their large
// mode is almost identical (V4 just has no AP row); their small mode differs, so V4 gets
// its own block below. The game keeps every element, number and handler; windows.js
// copies the numbers into CSS variables (--swb-hp, --swb-sp, --swb-ap, --swb-lv, --swb-job)
// and this sheet draws the bars, the job badge and the chips from them. The window keeps
// the game's 220 by 150 (large) and 220 by 70 (small) size, so its menu still opens where
// the game expects.
const B = ':is(#BasicInfoV4, #BasicInfoV5).sw';
const BAR = () => `border-radius: 9px; background: var(--swb-track); overflow: hidden;`
    + ` box-shadow: inset 0 1px 2px rgba(30,30,70,.18);`;
const FILL = (v, colors) => `content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: var(${v}, 0%); border-radius: 9px;`
    + ` background: ${colors}; transition: width .35s ease, background .35s ease;`;
const HP = 'linear-gradient(#8fe08a, #3fae4f)', SP = 'linear-gradient(#8fb6ff, #3f6fd6)', AP = 'linear-gradient(#f6d08a, #d99a2b)', LOW = 'linear-gradient(#ffb36b, #e0702c)';
const ON_BAR = 'color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,.55); font: 600 10px "Segoe UI", sans-serif;';
export const BASICINFO = THEME + `
${B} { --swb-track: rgba(60,62,100,.3); }
${B}.sw-dark { --swb-track: rgba(255,255,255,.13); }
${B} { background: var(--bg) !important; border-radius: 14px; box-shadow: 0 0 0 1px var(--ring), 0 10px 30px rgba(36,44,96,.42); font-family: "Segoe UI", system-ui, sans-serif; font-weight: 600; color: var(--ink); }
${B}::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 18px; border-radius: 14px 14px 0 0; background: var(--title); }
${B} .topbar .left, ${B} .topbar .right { top: 3px; width: 12px; height: 12px; border-radius: 50%; background: rgba(255,255,255,.28) !important; cursor: pointer; z-index: 1; }
${B} .topbar .left:hover, ${B} .topbar .right:hover { background: rgba(255,255,255,.5) !important; }
${B} .topbar .right { right: 4px; }
${B} .topbar .left::before, ${B} .topbar .right::before { position: absolute; inset: 0; color: #fff; font: 700 10px/12px "Segoe UI", sans-serif; text-align: center; }
${B} .topbar .left::before { content: "\\2261"; }
${B} .topbar .right::before { content: "\\2013"; }
${B}.small .topbar .right::before { content: "+"; }
${B} .large .name { top: 1px; left: 21px; max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #fff; font: 600 12px/16px "Segoe UI", sans-serif; text-shadow: 0 1px 2px rgba(20,30,90,.6); }
/* The small-mode badge sits beside the title row rather than below it (there is no
   room below: V4's compact window is only 53px tall), so line1 starts to its right. */
${B} .small .line1 { top: 1px; left: 50px; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #fff; font: 600 12px/16px "Segoe UI", sans-serif; text-shadow: 0 1px 2px rgba(20,30,90,.6); }
${B} .large .title, ${B} .large .hp_title, ${B} .large .sp_title, ${B} .large .ap_title { display: none; }

/* The job badge with the base level on it, drawn on the large and small panels. */
${B} .large::before, ${B} .small::before { content: ""; position: absolute; left: 10px; top: 25px; width: 44px; height: 44px; border-radius: 12px;
    background: var(--swb-job, none) center / 28px 28px no-repeat, linear-gradient(150deg, #8d82ea, #4b3fb0);
    box-shadow: inset 0 0 0 2px #f3c063, 0 0 0 1px #8a5a12, 0 3px 8px rgba(30,30,70,.3); }
${B}.swb-noicon .large::before, ${B}.swb-noicon .small::before { content: "\\2726"; color: #fff; font: 400 20px/44px "Segoe UI", sans-serif; text-align: center; }
${B} .large::after, ${B} .small::after { content: var(--swb-lv, ""); position: absolute; left: 32px; top: 62px; transform: translateX(-50%); padding: 0 6px; border-radius: 99px;
    background: linear-gradient(#f3c063, #d99a2b); color: #3a2604; font: 700 10px/14px "Segoe UI", sans-serif; box-shadow: 0 1px 3px rgba(0,0,0,.3); white-space: nowrap; }
/* BasicInfoV4's small window is only 53px tall (V5's is 70): the first version of
   this badge was 38px tall starting below the title row (top:22), bottoming out at
   60 and getting clipped by the window. There isn't a shorter stack that still fits
   a separate level chip underneath, so here the level sits as a small tag in the
   badge's own corner instead, and line1 moves aside instead of down (see above). */
${B} .small::before { left: 6px; top: 2px; width: 40px; height: 40px; border-radius: 11px; background-size: 25px 25px, auto; }
${B}.swb-noicon .small::before { line-height: 40px; font-size: 17px; }
${B} .small::after { left: 28px; top: 30px; min-width: 15px; padding: 0 3px; font-size: 8px; line-height: 11px; box-shadow: 0 1px 2px rgba(0,0,0,.35); }

/* Large panel: job, then HP, SP (and AP for 4th classes) beside the badge. */
${B} .large .job { top: 21px; left: 62px; font: 600 11.5px/15px "Segoe UI", sans-serif; color: var(--ink); }
${B} .large .hp_bar, ${B} .large .sp_bar, ${B} .large .ap_bar { left: 62px; width: 148px; border: 0; ${BAR()} }
${B} .large .hp_bar { top: 38px; height: 14px; }
${B} .large .sp_bar { top: 55px; height: 12px; }
${B} .large .ap_bar { top: 70px; height: 10px; display: none; }
${B}.swb-ap .large .ap_bar { display: block; }
${B} .large .hp_bar > div:not(.hp_bar_perc), ${B} .large .sp_bar > div:not(.sp_bar_perc), ${B} .large .ap_bar > div:not(.ap_bar_perc) { display: none !important; }
${B} .large .hp_bar::before { ${FILL('--swb-hp', HP)} }
${B} .large .sp_bar::before { ${FILL('--swb-sp', SP)} }
${B} .large .ap_bar::before { ${FILL('--swb-ap', AP)} }
${B} .large div.hp_bar_perc, ${B} .large div.sp_bar_perc, ${B} .large div.ap_bar_perc { left: 7px; top: 0; width: auto; text-align: left; ${ON_BAR} }
${B} .large div.hp_bar_perc { line-height: 14px; }
${B} .large div.sp_bar_perc { line-height: 12px; font-size: 9.5px; }
${B} .large div.ap_bar_perc { line-height: 10px; font-size: 8.5px; }
${B} .large .hp_perc, ${B} .large .sp_perc, ${B} .large .ap_perc { right: 16px; ${ON_BAR} }
${B} .large .hp_perc { top: 38px; line-height: 14px; }
${B} .large .sp_perc { top: 55px; line-height: 12px; font-size: 9.5px; }
${B} .large .ap_perc { top: 70px; line-height: 10px; font-size: 8.5px; display: none; }
${B}.swb-ap .large .ap_perc { display: block; }

/* Base and job level with their exp bars, then weight and zeny chips. */
${B} .large .blvl, ${B} .large .jlvl { left: 10px; font: 600 10.5px/13px "Segoe UI", sans-serif; color: var(--soft); }
${B} .large .blvl { top: 79px; } ${B} .large .jlvl { top: 94px; }
${B} .large .blvl_value, ${B} .large .jlvl_value { color: var(--gold-ink); }
${B} .large .bexp, ${B} .large .jexp { left: 78px; width: 132px; height: 5px; border: 0; border-radius: 4px; background: var(--swb-track); overflow: hidden; }
${B} .large .bexp { top: 83px; } ${B} .large .jexp { top: 98px; }
${B} .large .bexp div, ${B} .large .jexp div { height: 5px; border-radius: 4px; background: linear-gradient(90deg, #f3c063, #d99a2b); transition: width .35s ease; }
${B}.swb-ap .large .blvl { top: 85px; } ${B}.swb-ap .large .bexp { top: 89px; }
${B}.swb-ap .large .jlvl { top: 99px; } ${B}.swb-ap .large .jexp { top: 103px; }
${B} .large .extra { top: 115px; left: 9px; right: 9px; width: auto; padding: 0; display: flex; justify-content: space-between; align-items: center; font-size: 0; overflow: visible; }
${B}.swb-ap .large .extra { top: 120px; }
${B} .large .extra .weight, ${B} .large .extra .zeny_value { display: inline-flex; align-items: center; height: 19px; padding: 0 9px; border-radius: 99px; background: var(--chip); box-shadow: 0 1px 3px rgba(60,70,150,.15); font: 600 10.5px "Segoe UI", sans-serif; }
${B} .large .extra .weight { font-size: 0; gap: 0; }
${B} .large .extra .weight::before { content: "Weight"; margin-right: 5px; font-size: 10px; color: var(--soft); }
${B} .large .extra .weight span { font-size: 10.5px; color: inherit; }
${B} .large .extra .weight_value::after { content: " / "; white-space: pre; }
${B} .large .extra .weight[style*="red"] { background: rgba(224,112,44,.2); color: #c2410c !important; }
${B} .large .extra .zeny_value { color: var(--gold-ink); }
${B} .large .extra .zeny_value::after { content: " z"; white-space: pre; }

/* Small panel: the reference's compact strip, name in the title bar. */
${B} .small .info-container { top: 18px; height: 52px; background: none; }
${B} .small .line2 { top: 3px; left: 56px; max-width: 110px; overflow: hidden; text-overflow: ellipsis; font: 600 10.5px/14px "Segoe UI", sans-serif; color: var(--ink); }
${B} .small .line3, ${B} .small .line4 { left: 56px; width: 154px; font-weight: 600; }
${B} .small .line3 { top: 19px; } ${B} .small .line4 { top: 35px; }
${B} .small .hpcontainer, ${B} .small .spcontainer { position: relative; display: block; width: 154px; padding-left: 7px; box-sizing: border-box; ${BAR()} ${ON_BAR} }
${B} .small .hpcontainer { height: 13px; line-height: 13px; }
${B} .small .spcontainer { height: 11px; line-height: 11px; font-size: 9px; }
${B} .small .hpcontainer::before { ${FILL('--swb-hp', HP)} z-index: -1; }
${B} .small .spcontainer::before { ${FILL('--swb-sp', SP)} z-index: -1; }
${B} .small .hpcontainer, ${B} .small .spcontainer { isolation: isolate; }
${B} .small .line3 .hp_max_value, ${B} .small .line4 .sp_max_value { display: inline; width: auto; font-weight: 600; }
${B} .small .expcontainer { position: absolute; left: auto; right: 0; top: -16px; width: auto; font-size: 0; }
${B} .small .expcontainer .bexp_value { font: 600 10.5px/14px "Segoe UI", sans-serif; color: var(--gold-ink); }
${B} .small .apcontainer { display: none; }
${B}.swb-ap .small .line4 { top: 33px; }
${B}.swb-ap .small .apcontainer { display: block; position: absolute; left: 56px; top: 13px; width: 154px; height: 4px; font-size: 0; ${BAR()} }
${B}.swb-ap .small .apcontainer::before { ${FILL('--swb-ap', AP)} }

/* BasicInfoV4's small mode has no info-container/line4/hpcontainer wrappers: level,
   job and exp share one line, and HP/SP share another, as bare text. Style what it has;
   same specificity as the block above, so being later makes this win for V4 only. */
#BasicInfoV4.sw .small .line2 { top: 20px; left: 56px; width: 154px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font: 600 10px/14px "Segoe UI", sans-serif; color: var(--ink); }
#BasicInfoV4.sw .small .line2 .bexp_value { color: var(--gold-ink); }
#BasicInfoV4.sw .small .line3 { top: 36px; left: 56px; width: 154px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font: 600 10px/14px "Segoe UI", sans-serif; color: var(--ink); }
#BasicInfoV4.sw .small .line3 .hp_value, #BasicInfoV4.sw .small .line3 .hp_max_value { color: #3fae4f; }
#BasicInfoV4.sw.sw-dark .small .line3 .hp_value, #BasicInfoV4.sw.sw-dark .small .line3 .hp_max_value { color: #8fe08a; }
#BasicInfoV4.sw .small .line3 .sp_value, #BasicInfoV4.sw .small .line3 .sp_max_value { color: var(--blue-deep); }

/* Below 25% HP the bar turns orange and breathes. */
${B}.swb-low .large .hp_bar::before, ${B}.swb-low .small .hpcontainer::before { background: ${LOW}; animation: swb-low 1.6s ease-in-out infinite; }
@keyframes swb-low { 50% { filter: brightness(1.25) saturate(1.2); } }

/* The menu: a handle to open it, then the game's buttons on rounded tiles. */
${B} .bt_menu { left: 85px; width: 50px; height: 11px; border-radius: 0 0 9px 9px; background: var(--chip) !important; box-shadow: 0 0 0 1px var(--ring); cursor: pointer; transition: background .13s ease; }
${B} .bt_menu:hover { background: #fff !important; }
${B}.sw-dark .bt_menu:hover { background: rgba(255,255,255,.2) !important; }
${B} .bt_menu::before { position: absolute; inset: 0; color: var(--chip-ink); font: 700 9px/11px "Segoe UI", sans-serif; text-align: center; }
${B} .btn_open::before { content: "\\25BE"; } ${B} .btn_close::before { content: "\\25B4"; }
${B} .buttons { border-radius: 14px; background: var(--bg) !important; box-shadow: 0 0 0 1px var(--ring), 0 10px 30px rgba(36,44,96,.42); animation: swb-menu .18s ease; }
@keyframes swb-menu { from { opacity: 0; transform: translateY(-6px); } }
${B} .buttons > [id] { border: 0; border-radius: 9px; background-color: var(--chip); box-shadow: 0 1px 3px rgba(60,70,150,.22); transition: transform .13s ease, box-shadow .13s ease, filter .13s ease; }
${B} .buttons > [id]:hover { transform: translateY(-1px); filter: brightness(1.08); box-shadow: 0 0 0 2px var(--blue), 0 3px 8px rgba(53,89,189,.35); }
${B} .menu_tip { padding: 4px 9px; border-radius: 8px; background: var(--label); color: var(--label-ink); text-shadow: none; font: 600 11px "Segoe UI", sans-serif; }
${B} .ro-custom-scrollbar { width: 8px !important; }
${B} .ro-custom-scrollbar .btn-up, ${B} .ro-custom-scrollbar .btn-down { height: 6px; background: none !important; }
${B} .ro-custom-scrollbar .track { background: none !important; }
${B} .ro-custom-scrollbar .thumb { background: #8a8db8 !important; border: 0 !important; border-radius: 9px; opacity: .6; }
@media (prefers-reduced-motion: reduce) { ${B} *, ${B} *::before, ${B} .buttons { animation: none !important; transition: none !important; } }
`;

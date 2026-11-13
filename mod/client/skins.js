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
${K} .tab-content, ${K} .tab-content-mini { top: 30px; bottom: 2px; left: 2px; right: 2px; width: auto; height: auto; border-top: 0; border-radius: 12px; background: var(--panel); box-shadow: inset 0 0 0 1px var(--panel-ring); }
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
${K} .footer .skpoints_count { color: var(--blue-deep); }
${K} .footer .btn { border-radius: 5px; }
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
${D} .footer .skpoints_count { color: var(--blue-deep); font-weight: 600; }
${D} .emblem_drop { border-color: var(--blue); border-radius: 14px; background: var(--panel); }
${D} .ally_list, ${D} .hostile_list, ${D} .emblem_container { border: 0 !important; border-radius: 8px; background: var(--chip) !important; box-shadow: inset 0 0 0 1px var(--panel-ring); }
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
    Emoticons Enchant EnchantGrade EquipmentV0 EquipmentV1 EquipmentV2 EquipmentV3 FPS GraphicsOption GuildCompanion InventoryV0 InventoryV1
    InventoryV2 ItemListWindowSelection ItemPreview ItemReform LaphineSys LaphineUpg Mail MakeModelMessage MakeReadBook MemorialDungeon PetEvolution PetInformations
    Pincodewindow ReadMail ReadRodex Refine Reputation Rodex Roulette ShortCutOption ShortCuts SoundOption Storage StorageFilter
    Stylist SwitchEquip Trade VendingModelMessage VendingReport WorldMap WriteRodex cartdecoration cartitems changecart vending vendingshop`.split(/\s+/).filter(Boolean));

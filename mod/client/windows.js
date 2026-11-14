import { EQUIPMENT, STATUS, SKILLS, PARTY, GUILD, GENERIC, GENERIC_WINDOWS, BASICINFO, NPCSTORE, FPS } from './skins.js';

// Dynamic Item Info: the game's own windows in the same look as the item window.
// A new Inventory, plus Equipment, Status, Skill Tree, Party, Guild and Basic Info.
//
// The window is rebuilt around the client's own item slots. The client keeps
// drawing every item into .content and keeps every handler on it (double-click
// to use or equip, right-click for item info, dragging to hotkeys, equipment,
// storage or the ground, shift-click to link in chat, the favourites tab drop),
// so all of that works exactly as in the game. This mod lays the window out
// anew with a stylesheet, adds its own toolbar (search, sort, list or grid,
// light or midnight theme), a weight bar with zeny, a resize grip and a hover
// label, and only reads from the client: names come from the client's own
// hover label and item data from its own drag payload.

const TILE = 34, GAP = 4, PAD = 8, STEP = TILE + GAP;
const LIMITS = { cols: [5, 12], rows: [3, 10] };
const SORTS = ['game', 'type', 'name', 'new'];
const SORT_LABEL = { game: 'Game order', type: 'Type', name: 'Name', new: 'Newest' };
// Item types the client uses, in the order the Type sort shows them.
const TYPE_ORDER = [0, 2, 11, 18, 5, 4, 12, 10, 6, 7, 8, 3, 1];

const svg = body => `<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const ICON = {
    search: svg('<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/>'),
    sort: svg('<path d="M4 3v10M2 11l2 2 2-2M9 4h5M9 8h4M9 12h3"/>'),
    grid: svg('<rect x="2" y="2" width="5" height="5" rx="1.2"/><rect x="9" y="2" width="5" height="5" rx="1.2"/><rect x="2" y="9" width="5" height="5" rx="1.2"/><rect x="9" y="9" width="5" height="5" rx="1.2"/>'),
    list: svg('<path d="M5 4h9M5 8h9M5 12h9"/><circle cx="2.2" cy="4" r=".6"/><circle cx="2.2" cy="8" r=".6"/><circle cx="2.2" cy="12" r=".6"/>'),
    sun: svg('<circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/>'),
    moon: svg('<path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5Z"/>'),
    weight: svg('<path d="M5.5 5.5a2.5 2.5 0 1 1 5 0"/><path d="M3.5 6h9l1.5 8h-12Z"/>'),
    coin: svg('<ellipse cx="8" cy="5" rx="5" ry="2.2"/><path d="M3 5v6c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2V5M3 8c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2"/>'),
};

const slots = colour => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${STEP}" height="${STEP}"><rect width="${TILE}" height="${TILE}" rx="9" fill="${colour}"/></svg>`)}")`;

const CSS = `
:host { width: auto !important; height: auto !important; }
#InventoryV3.sw {
    --sw-cols: 7; --sw-rows: 5;
    --sw-w: calc(var(--sw-cols) * ${TILE}px + (var(--sw-cols) - 1) * ${GAP}px + ${PAD * 2}px);
    --sw-h: calc(var(--sw-rows) * ${TILE}px + (var(--sw-rows) - 1) * ${GAP}px + ${PAD * 2}px);
    --ink: #47476b; --soft: #7d7fa3; --blue: #4f7fe0; --blue-deep: #3559bd; --gold: #eeb044; --gold-ink: #8a5a12;
    --bg: radial-gradient(ellipse 220px 70px at 85% 4%, rgba(255,255,255,.75), transparent), linear-gradient(160deg, #c9d6f8 0%, #dfd8f6 42%, #f5dfe9 76%, #fdeedd 100%);
    --ring: #8ea3dd; --panel: rgba(255,253,246,.92); --panel-ring: rgba(255,255,255,.95);
    --chip: rgba(255,255,255,.72); --chip-ink: #6b6e98; --chip-hover: #fff;
    --accent: linear-gradient(#6d97ee, #3559bd); --accent-ink: #fff;
    --fav: #fff3d6; --fav-ink: #8a5a12;
    --field: rgba(255,255,255,.8); --slot-hover: #fff; --count: #3559bd; --count-halo: #fff;
    --label: rgba(53,89,189,.96); --label-ink: #fff; --label-soft: #d9e3ff;
    --bar: rgba(255,255,255,.75); --fill: linear-gradient(90deg, #4f7fe0, #b7a4ec);
    --slots: ${slots('rgba(120,138,205,.11)')};
    --title: linear-gradient(90deg, #4f74d6, #7b9cec 55%, #b7a4ec);
    width: var(--sw-w); height: auto; padding: 0 10px 10px; color: var(--ink);
    background: var(--bg); border-radius: 16px;
    box-shadow: 0 0 0 1px var(--ring), 0 10px 30px rgba(36,44,96,.42);
    font-family: "Segoe UI", system-ui, sans-serif; font-size: 11px; user-select: none;
}
#InventoryV3.sw.sw-dark {
    --ink: #e6e8ff; --soft: #a9acd6; --blue: #8fb0ff; --blue-deep: #b9cdff; --gold-ink: #f5d58a;
    --bg: radial-gradient(ellipse 220px 70px at 85% 4%, rgba(160,140,255,.22), transparent), linear-gradient(160deg, #1f2550 0%, #2d2a5e 55%, #3d2a52 100%);
    --ring: #4b4f8f; --panel: rgba(255,255,255,.06); --panel-ring: rgba(255,255,255,.08);
    --chip: rgba(255,255,255,.09); --chip-ink: #c3c6ee; --chip-hover: rgba(255,255,255,.16);
    --accent: linear-gradient(#f3c063, #d99a2b); --accent-ink: #3a2604;
    --fav: rgba(238,176,68,.16); --fav-ink: #f5d58a;
    --field: rgba(255,255,255,.08); --slot-hover: rgba(255,255,255,.14); --count: #f5d58a; --count-halo: #1f2550;
    --label: rgba(20,22,52,.96); --label-ink: #f5d58a; --label-soft: #c3c6ee;
    --bar: rgba(255,255,255,.1); --fill: linear-gradient(90deg, #eeb044, #f5d58a);
    --slots: ${slots('rgba(255,255,255,.06)')};
    --title: linear-gradient(90deg, #2b3170, #3d3a80 55%, #5a3f78);
}
@media (prefers-reduced-motion: reduce) { #InventoryV3.sw * { transition: none !important; } }

/* Title bar: the client still drags the window by it. */
#InventoryV3.sw .titlebar { display: flex; align-items: center; height: 30px; margin: 0 -10px 8px; padding: 0 10px; box-sizing: border-box;
    width: auto; background: var(--title) !important; border-radius: 16px 16px 0 0; }
#InventoryV3.sw .titlebar .left, #InventoryV3.sw .titlebar .right { float: none; margin: 0; display: flex; align-items: center; gap: 6px; }
#InventoryV3.sw .titlebar .left { flex: 1; }
#InventoryV3.sw .titlebar .clear, #InventoryV3.sw .titlebar .left .base { display: none; }
#InventoryV3.sw .titlebar .text { width: auto; height: auto; font-size: 13px; font-weight: 600; color: #fff; letter-spacing: .3px; text-shadow: 0 1px 2px rgba(20,30,90,.6); vertical-align: 0; }
#InventoryV3.sw .sw-count { margin-left: 8px; font-size: 11px; color: rgba(255,255,255,.85); font-weight: 600; }
#InventoryV3.sw .titlebar .right .base { width: 18px; height: 18px; border-radius: 50%; background: rgba(255,255,255,.22) !important; color: #fff; font: 600 13px/18px "Segoe UI", sans-serif; padding: 0; text-align: center; cursor: pointer; transition: background .15s ease, transform .15s ease; }
#InventoryV3.sw .titlebar .right .base:hover { background: rgba(255,255,255,.4) !important; transform: scale(1.08); }
#InventoryV3.sw .titlebar .mini::before { content: "\\2013"; }
#InventoryV3.sw .titlebar .close::before { content: "\\00d7"; font-size: 15px; }

/* Panel: tabs, toolbar and slots in one column. */
#InventoryV3.sw .panel { overflow: visible; gap: 8px; border-radius: 0; }
#InventoryV3.sw .middle { flex-direction: column; gap: 8px; overflow: visible; }
#InventoryV3.sw .tabs { width: auto; flex-direction: row; gap: 4px; background: transparent; }
#InventoryV3.sw .tabs button, #InventoryV3.sw .tabs .tab { writing-mode: horizontal-tb; text-orientation: mixed; flex: 0 0 auto; width: auto; height: 22px; left: 0; padding: 0 12px;
    border: 0; border-radius: 99px; background: var(--chip) !important; color: var(--chip-ink); font: 600 11px "Segoe UI", sans-serif; transform: none; cursor: pointer;
    box-shadow: 0 1px 3px rgba(60,70,150,.15); transition: background .15s ease, color .15s ease; }
#InventoryV3.sw .tabs button:hover { background: var(--chip-hover) !important; }
#InventoryV3.sw .tab:last-child { background: var(--fav) !important; color: var(--fav-ink); }
#InventoryV3.sw .tab.selected, #InventoryV3.sw .tab.selected:last-child { background: var(--accent) !important; color: var(--accent-ink); transform: none; box-shadow: 0 2px 7px rgba(53,89,189,.4), inset 0 1px 0 rgba(255,255,255,.4); }

#InventoryV3.sw .sw-tools { display: flex; gap: 4px; align-items: center; }
#InventoryV3.sw .sw-find { flex: 1; min-width: 0; display: flex; align-items: center; gap: 5px; height: 24px; padding: 0 8px; border-radius: 8px; background: var(--field); color: var(--soft); box-shadow: inset 0 0 0 1px var(--panel-ring); }
#InventoryV3.sw .sw-find input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--ink); font: 12px "Segoe UI", sans-serif; padding: 0; user-select: text; }
#InventoryV3.sw .sw-find input::placeholder { color: var(--soft); }
#InventoryV3.sw .sw-btn { height: 24px; min-width: 24px; display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 0 7px; border: 0; border-radius: 8px;
    background: var(--field); color: var(--chip-ink); font: 600 11px "Segoe UI", sans-serif; cursor: pointer; box-shadow: inset 0 0 0 1px var(--panel-ring); transition: background .15s ease, color .15s ease; }
#InventoryV3.sw .sw-btn:hover { background: var(--chip-hover); color: var(--blue-deep); }
#InventoryV3.sw .sw-btn[aria-pressed="true"] { color: var(--blue-deep); }

/* Theme toggle: a sky-toned pill, sun and moon always both visible, a sliding knob. */
#InventoryV3.sw .sw-theme { position: relative; width: 44px; height: 24px; min-width: 44px; padding: 0; border: 0; border-radius: 99px; cursor: pointer;
    background: linear-gradient(90deg, #bcd4ff, #fde3b0); box-shadow: inset 0 1px 3px rgba(60,70,150,.25); transition: background .25s ease; }
#InventoryV3.sw.sw-dark .sw-theme { background: linear-gradient(90deg, #1b1f45, #2d2a5e); }
#InventoryV3.sw .sw-theme-sun, #InventoryV3.sw .sw-theme-moon { position: absolute; top: 50%; transform: translateY(-50%); display: flex; transition: opacity .2s ease, color .2s ease; }
#InventoryV3.sw .sw-theme-sun { left: 5px; color: #a06a0e; opacity: .8; }
#InventoryV3.sw .sw-theme-moon { right: 5px; color: #6b6e98; opacity: .45; }
#InventoryV3.sw.sw-dark .sw-theme-sun { opacity: .35; color: #cdd3ff; }
#InventoryV3.sw.sw-dark .sw-theme-moon { opacity: 1; color: #f5d58a; }
#InventoryV3.sw .sw-theme-knob { position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.35); transition: left .2s ease, background .2s ease; }
#InventoryV3.sw.sw-dark .sw-theme-knob { left: 22px; background: #2d2a5e; }
#InventoryV3.sw .sw-theme:hover .sw-theme-knob { filter: brightness(1.08); }

/* Slots: rounded tiles with gaps, drawn behind the client's items. */
#InventoryV3.sw .container { flex: none; width: var(--sw-w); height: var(--sw-h); padding: 0; margin: 0 -0px; border: 0; border-radius: 12px; background: var(--panel); box-shadow: inset 0 0 0 1px var(--panel-ring), inset 0 2px 8px rgba(60,70,150,.1); white-space: normal; box-sizing: border-box; }
#InventoryV3.sw .content { width: auto !important; margin: 0; padding: ${PAD}px; box-sizing: border-box; min-height: 100%; display: grid; gap: ${GAP}px; align-content: start;
    grid-template-columns: repeat(var(--sw-cols), ${TILE}px); grid-auto-rows: ${TILE}px;
    background-color: transparent !important; background-image: var(--slots) !important; background-size: ${STEP}px ${STEP}px !important; background-position: ${PAD}px ${PAD}px !important; background-repeat: repeat !important; background-origin: padding-box !important; background-clip: content-box !important; }
#InventoryV3.sw .content .item { width: ${TILE}px; height: ${TILE}px; border-radius: 9px; transition: background .14s ease, box-shadow .14s ease; }
#InventoryV3.sw .content .item:hover { background: var(--slot-hover); box-shadow: 0 0 0 1.5px var(--blue), 0 3px 9px rgba(60,70,170,.3); z-index: 5; }
#InventoryV3.sw .content .item .icon, #InventoryV3.sw .content .item .switch1 { top: 5px; left: 5px; transition: transform .14s ease; }
#InventoryV3.sw .content .item:hover .icon { transform: translateY(-1px) scale(1.1); }
#InventoryV3.sw .content .item .amount { top: auto; bottom: 1px; right: 3px; color: var(--count); font: 700 10px "Segoe UI", sans-serif; text-shadow: 0 0 2px var(--count-halo), 0 0 2px var(--count-halo), 0 0 1px var(--count-halo); }
#InventoryV3.sw .content .item .grade { top: auto; bottom: 2px; left: 2px; }
/* The client marks new items with a picture; here it is a gold dot. */
#InventoryV3.sw .content .item .new_item { width: 7px; height: 7px; top: 3px; right: 3px; border-radius: 50%; background-image: none !important; }
#InventoryV3.sw .content .item .new_item[style*="url"] { background: var(--gold); box-shadow: 0 0 0 1.5px var(--count-halo); }
#InventoryV3.sw .content .item.sw-hidden { display: none; }
#InventoryV3.sw .sw-name, #InventoryV3.sw .sw-wt { display: none; }
#InventoryV3.sw .sw-empty { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; color: var(--soft); font-size: 12px; pointer-events: none; }
#InventoryV3.sw .sw-empty.on { display: flex; }

/* List view: the same items as rows, with name and weight. */
#InventoryV3.sw.sw-list .content { grid-template-columns: 1fr; grid-auto-rows: 30px; gap: 2px; background-image: none !important; }
#InventoryV3.sw.sw-list .content .item { width: auto; height: 30px; display: flex; align-items: center; gap: 8px; padding: 0 8px 0 3px; border-radius: 8px; box-sizing: border-box; background: transparent; }
#InventoryV3.sw.sw-list .content .item:nth-child(odd) { background: var(--chip); }
#InventoryV3.sw.sw-list .content .item:hover { background: var(--slot-hover); }
#InventoryV3.sw.sw-list .content .item .icon { position: relative; top: 0; left: 0; flex: none; }
#InventoryV3.sw.sw-list .content .item .switch1 { top: 3px; left: 3px; }
#InventoryV3.sw.sw-list .content .item:hover .icon { transform: none; }
#InventoryV3.sw.sw-list .sw-name { display: block; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--ink); }
#InventoryV3.sw.sw-list .sw-wt { display: block; flex: none; color: var(--soft); font-size: 11px; }
#InventoryV3.sw.sw-list .content .item .amount { position: static; flex: none; min-width: 26px; text-align: right; font-size: 12px; text-shadow: none; }
#InventoryV3.sw.sw-list .content .item .new_item { top: 4px; left: 26px; right: auto; }

/* The client's hover label gives way to this mod's. */
#InventoryV3.sw .overlay { display: none !important; }
#InventoryV3.sw .sw-label { position: absolute; z-index: 900; display: none; pointer-events: none; padding: 6px 9px; border-radius: 9px; background: var(--label); color: var(--label-ink);
    box-shadow: 0 4px 14px rgba(20,30,90,.35); white-space: nowrap; font: 12px "Segoe UI", sans-serif; }
#InventoryV3.sw .sw-label.on { display: block; }
#InventoryV3.sw .sw-label b { font-weight: 600; }
#InventoryV3.sw .sw-label.grey b { opacity: .7; }
#InventoryV3.sw .sw-label small { display: block; margin-top: 2px; font-size: 11px; color: var(--label-soft); }

/* Footer: weight and zeny on top, the client's lock and compare buttons below. */
#InventoryV3.sw .footer { height: auto; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; padding-top: 2px; background: none !important; }
#InventoryV3.sw .sw-weight { flex: 1 1 100%; display: flex; align-items: center; gap: 6px; color: var(--soft); font-size: 11px; }
#InventoryV3.sw .sw-bar { flex: 1; height: 7px; border-radius: 9px; background: var(--bar); overflow: hidden; box-shadow: inset 0 0 0 1px var(--panel-ring); }
#InventoryV3.sw .sw-bar i { display: block; height: 100%; width: 0; border-radius: 9px; background: var(--fill); transition: width .3s ease; }
#InventoryV3.sw .sw-weight.warn .sw-bar i { background: linear-gradient(90deg, #f0a040, #f5c36a); }
#InventoryV3.sw .sw-weight.heavy .sw-bar i { background: linear-gradient(90deg, #e04848, #f08080); }
#InventoryV3.sw .sw-weight.warn .sw-wtext { color: #d9822b; } #InventoryV3.sw .sw-weight.heavy .sw-wtext { color: #e04848; }
#InventoryV3.sw .sw-wtext { font-weight: 600; color: var(--ink); }
#InventoryV3.sw .sw-zeny { display: inline-flex; align-items: center; gap: 4px; margin-left: 4px; color: var(--gold-ink); font-weight: 600; }
#InventoryV3.sw .expand, #InventoryV3.sw .droplock, #InventoryV3.sw .compare, #InventoryV3.sw .deallock_on, #InventoryV3.sw .deallock_off, #InventoryV3.sw .sort { position: relative; left: auto; top: auto; }
#InventoryV3.sw .expand { width: auto; height: 18px; color: var(--soft); }
#InventoryV3.sw .expand .ncnt, #InventoryV3.sw .expand .mcnt { color: var(--ink); font-weight: 600; }
#InventoryV3.sw .footer div button { cursor: pointer; border-radius: 4px; transition: transform .13s ease, filter .13s ease; }
#InventoryV3.sw .footer div button:hover { transform: translateY(-1px); filter: brightness(1.12); }
#InventoryV3.sw .footer .extend { display: none !important; }
#InventoryV3.sw span.name { border-radius: 7px; background: var(--label); color: var(--label-ink); text-shadow: none; font-size: 11px; padding: 4px 7px; }
#InventoryV3.sw .lockoverlay { background: #c9d6f8; border-radius: 12px; }
#InventoryV3.sw .lockoverlaymsg { top: auto; bottom: 8px; left: 8px; }
#InventoryV3.sw .sw-grip { position: absolute; right: 3px; bottom: 3px; width: 14px; height: 14px; cursor: nwse-resize; border-radius: 0 0 12px 0;
    background: linear-gradient(135deg, transparent 50%, var(--soft) 50%, var(--soft) 58%, transparent 58%, transparent 70%, var(--soft) 70%, var(--soft) 78%, transparent 78%); opacity: .7; }
#InventoryV3.sw .sw-grip:hover { opacity: 1; }
#InventoryV3.sw .panel[style*="none"] ~ .sw-grip { display: none; }

/* The client's scrollbar, slimmed to match. */
#InventoryV3.sw .ro-custom-scrollbar { width: 8px !important; right: 3px !important; }
#InventoryV3.sw .ro-custom-scrollbar .btn-up, #InventoryV3.sw .ro-custom-scrollbar .btn-down { height: 6px; background: none !important; }
#InventoryV3.sw .ro-custom-scrollbar .track { background: none !important; }
#InventoryV3.sw .ro-custom-scrollbar .thumb { background: var(--soft) !important; border: 0 !important; border-radius: 9px; opacity: .55; }
`;

const clamp = (value, [low, high]) => Math.min(Math.max(Math.round(Number(value) || low), low), high);
const number = text => Number(String(text ?? '').replace(/[^\d.]/g, '')) || 0;

export default function windows(parameters, api) {

    const saved = (() => { try { return api.preferences?.get?.('inventory', null) || {}; } catch { return {}; } })();
    const prefs = {
        cols: clamp(saved.cols ?? 7, LIMITS.cols),
        rows: clamp(saved.rows ?? 5, LIMITS.rows),
        view: saved.view === 'list' ? 'list' : 'grid',
        sort: SORTS.includes(saved.sort) ? saved.sort : 'game',
        dark: typeof saved.dark === 'boolean' ? saved.dark : parameters?.dark === true,
    };
    const save = () => { try { api.preferences?.set?.('inventory', prefs); } catch { /* storage may be unavailable */ } };

    const mounted = new Map(); // host -> unmount
    const weights = new Map(); // item id -> weight per unit, from the item description
    let basic = null;          // the BasicInfo window, which holds weight and zeny

    function itemWeight(id) {
        if (!weights.has(id)) {
            const text = api.items.get(id)?.description || '';
            const found = /Weight\s*:\s*([\d.]+)/i.exec(text);
            weights.set(id, found ? Number(found[1]) : null);
        }
        return weights.get(id);
    }

    function readBasic() {
        const root = basic?.root;
        if (!root) return null;
        const value = root.querySelector('.weight_value'), total = root.querySelector('.weight_total'), zeny = root.querySelector('.zeny_value');
        return { weight: number(value?.textContent), total: number(total?.textContent), zeny: (zeny?.textContent || '').trim() };
    }

    function mount(component) {
        const root = component.root, win = root?.querySelector?.('#InventoryV3');
        if (!win || mounted.has(component.host)) return;
        const content = win.querySelector('.content'), tabs = win.querySelector('.tabs'), footer = win.querySelector('.footer'), container = win.querySelector('.container');
        if (!content || !tabs || !footer || !container) return;
        const added = [];
        const add = (parent, html, before) => {
            const holder = document.createElement('div');
            holder.innerHTML = html;
            const node = holder.firstElementChild;
            parent.insertBefore(node, before ?? null);
            added.push(node);
            return node;
        };

        const style = document.createElement('style');
        style.dataset.diiWindows = 'InventoryV3';
        style.textContent = CSS;
        root.append(style);
        added.push(style);

        const tools = add(tabs.parentNode, `<div class="sw-tools">
            <label class="sw-find">${ICON.search}<input type="text" placeholder="Search items" spellcheck="false" aria-label="Search items"></label>
            <button type="button" class="sw-btn sw-sort" title="Sort">${ICON.sort}<span></span></button>
            <button type="button" class="sw-btn sw-view"></button>
            <button type="button" class="sw-theme" role="switch" aria-checked="false">
                <span class="sw-theme-sun">${ICON.sun}</span><span class="sw-theme-moon">${ICON.moon}</span><span class="sw-theme-knob"></span>
            </button>
        </div>`, tabs.nextSibling);
        const search = tools.querySelector('input'), sortButton = tools.querySelector('.sw-sort'), viewButton = tools.querySelector('.sw-view'), themeButton = tools.querySelector('.sw-theme');
        const empty = add(container, '<div class="sw-empty">No items match</div>');
        const weight = add(footer, `<div class="sw-weight">${ICON.weight}<div class="sw-bar"><i></i></div><span class="sw-wtext">–</span><span class="sw-zeny">${ICON.coin}<span>–</span></span></div>`, footer.firstChild);
        const label = add(win, '<div class="sw-label" role="tooltip"></div>');
        const grip = add(win, '<div class="sw-grip" title="Resize"></div>');
        const count = add(win.querySelector('.titlebar .left'), '<span class="sw-count"></span>');

        const info = new WeakMap(); // item element -> { id, type, name, index, identified }
        let probing = false;

        // The client's drag payload is the item itself; reading it here sends nothing.
        function probe(element) {
            const before = Object.prototype.hasOwnProperty.call(window, '_OBJ_DRAG_') ? window._OBJ_DRAG_ : undefined;
            let data = null, name = '';
            probing = true;
            try {
                const transfer = new DataTransfer();
                element.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: transfer }));
                data = window._OBJ_DRAG_?.data || JSON.parse(transfer.getData('Text') || 'null')?.data || null;
            } catch { /* leave it unread */ }
            if (before === undefined) delete window._OBJ_DRAG_; else window._OBJ_DRAG_ = before;
            try {
                // The client writes "Name: 3 ea" into its hover label; that is the name it shows.
                const overlay = win.querySelector('.overlay');
                element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                name = (overlay?.textContent || '').replace(/:\s*\d+\s*(ea|Quantity)?\s*$/i, '').trim();
                element.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
            } catch { /* fall back below */ }
            probing = false;
            const id = Number(data?.ITID) || 0;
            if (!name && id) name = api.items.get(id)?.name || '';
            const entry = { id, type: Number(data?.type ?? 99), name: name || `Item ${id}`, index: Number(element.dataset.index) || 0, identified: data?.IsIdentified !== false && data?.IsIdentified !== 0 };
            info.set(element, entry);
            let nameNode = element.querySelector('.sw-name'), weightNode = element.querySelector('.sw-wt');
            if (!nameNode) { nameNode = document.createElement('span'); nameNode.className = 'sw-name'; element.insertBefore(nameNode, element.querySelector('.amount')); }
            if (!weightNode) { weightNode = document.createElement('span'); weightNode.className = 'sw-wt'; element.insertBefore(weightNode, element.querySelector('.amount')); }
            nameNode.textContent = entry.name;
            const each = id ? itemWeight(id) : null;
            weightNode.textContent = each === null ? '' : `${each} wt`;
            return entry;
        }

        const items = () => [...content.querySelectorAll(':scope > .item')];
        const countOf = element => Number(element.querySelector('.count')?.textContent) || 1;

        function arrange() {
            const query = search.value.trim().toLowerCase();
            const list = items();
            let shown = 0;
            for (const element of list) {
                const entry = info.get(element) || probe(element);
                const match = !query || entry.name.toLowerCase().includes(query);
                element.classList.toggle('sw-hidden', !match);
                if (match) shown++;
            }
            const sorted = [...list];
            const typeRank = type => { const at = TYPE_ORDER.indexOf(type); return at < 0 ? TYPE_ORDER.length : at; };
            const byName = (a, b) => info.get(a).name.localeCompare(info.get(b).name);
            if (prefs.sort === 'type') sorted.sort((a, b) => typeRank(info.get(a).type) - typeRank(info.get(b).type) || byName(a, b));
            else if (prefs.sort === 'name') sorted.sort(byName);
            else if (prefs.sort === 'new') sorted.sort((a, b) => info.get(b).index - info.get(a).index);
            sorted.forEach((element, rank) => { element.style.order = prefs.sort === 'game' ? '' : String(rank); });
            empty.classList.toggle('on', Boolean(query) && shown === 0);
            const host = win.querySelector('.scroll-host');
            host?._roScrollbarRestart?.();
        }

        function paint() {
            win.classList.add('sw');
            win.classList.toggle('sw-dark', prefs.dark);
            win.classList.toggle('sw-list', prefs.view === 'list');
            win.style.setProperty('--sw-cols', prefs.cols);
            win.style.setProperty('--sw-rows', prefs.rows);
            sortButton.querySelector('span').textContent = SORT_LABEL[prefs.sort];
            sortButton.setAttribute('aria-pressed', String(prefs.sort !== 'game'));
            viewButton.innerHTML = prefs.view === 'list' ? ICON.grid : ICON.list;
            viewButton.title = prefs.view === 'list' ? 'Show as grid' : 'Show as list';
            themeButton.setAttribute('aria-checked', String(prefs.dark));
            themeButton.title = prefs.dark ? 'Switch to light theme' : 'Switch to midnight theme';
        }

        function paintWeight() {
            const data = readBasic();
            const text = weight.querySelector('.sw-wtext'), bar = weight.querySelector('.sw-bar i'), zeny = weight.querySelector('.sw-zeny span');
            if (!data || !data.total) { text.textContent = '–'; bar.style.width = '0'; zeny.textContent = data?.zeny || '–'; return; }
            const share = data.weight / data.total;
            text.textContent = `${data.weight} / ${data.total}`;
            bar.style.width = `${Math.min(100, share * 100).toFixed(1)}%`;
            weight.classList.toggle('warn', share >= 0.5 && share < 0.9);
            weight.classList.toggle('heavy', share >= 0.9);
            weight.title = share >= 0.9 ? 'Over 90%: you cannot attack or use skills' : share >= 0.5 ? 'Over 50%: HP and SP no longer recover on their own' : `${(share * 100).toFixed(1)}% of your weight limit`;
            zeny.textContent = data.zeny ? `${data.zeny} z` : '–';
        }

        function paintCount() {
            const now = win.querySelector('.ncnt')?.textContent || '', most = win.querySelector('.mcnt')?.textContent || '';
            count.textContent = `${now}${most}`.trim();
        }

        // Hover label: name, count and weight.
        function showLabel(element) {
            const entry = info.get(element) || probe(element);
            const amount = countOf(element), each = entry.id ? itemWeight(entry.id) : null;
            const total = each === null ? '' : amount > 1 ? ` · weight ${each} each, ${+(each * amount).toFixed(1)} total` : ` · weight ${each}`;
            label.innerHTML = '<b></b><small></small>';
            label.querySelector('b').textContent = entry.name;
            label.querySelector('small').textContent = `${amount} ${amount === 1 ? 'piece' : 'pieces'}${total}`;
            label.classList.toggle('grey', !entry.identified);
            label.classList.add('on');
            const scale = win.getBoundingClientRect().width / (win.offsetWidth || 1) || 1;
            const box = element.getBoundingClientRect(), frame = win.getBoundingClientRect();
            let left = (box.left - frame.left) / scale, top = (box.top - frame.top) / scale - label.offsetHeight - 6;
            if (top < 0) top = (box.bottom - frame.top) / scale + 6;
            left = Math.max(4, Math.min(left, win.offsetWidth - label.offsetWidth - 4));
            label.style.left = `${left}px`;
            label.style.top = `${top}px`;
        }
        const hideLabel = () => label.classList.remove('on');
        const onOver = event => { if (probing) return; const element = event.target.closest?.('.item'); if (element && content.contains(element)) showLabel(element); };
        const onOut = event => { if (probing) return; if (!event.relatedTarget || !event.relatedTarget.closest?.('.item')) hideLabel(); else onOver({ target: event.relatedTarget }); };
        const onLeave = () => hideLabel();
        content.addEventListener('mouseover', onOver);
        content.addEventListener('mouseout', onOut);
        content.addEventListener('dragstart', onLeave);
        content.addEventListener('dblclick', onLeave);

        // Toolbar.
        let release = null;
        const onFocus = () => { if (!release) { try { release = api.input.suspend(); } catch { release = null; } } };
        const onBlur = () => { if (release) { release(); release = null; } };
        const onKey = event => {
            event.stopPropagation();
            if (event.key === 'Escape') { search.value = ''; arrange(); search.blur(); }
        };
        search.addEventListener('focus', onFocus);
        search.addEventListener('blur', onBlur);
        search.addEventListener('input', arrange);
        search.addEventListener('keydown', onKey);
        search.addEventListener('keyup', event => event.stopPropagation());
        search.addEventListener('keypress', event => event.stopPropagation());
        sortButton.addEventListener('click', () => { prefs.sort = SORTS[(SORTS.indexOf(prefs.sort) + 1) % SORTS.length]; save(); paint(); arrange(); });
        viewButton.addEventListener('click', () => { prefs.view = prefs.view === 'list' ? 'grid' : 'list'; save(); paint(); arrange(); });
        themeButton.addEventListener('click', () => { prefs.dark = !prefs.dark; save(); paint(); retheme(); });
        for (const button of tools.querySelectorAll('button')) button.addEventListener('mousedown', event => event.stopPropagation());

        // Resize grip: whole columns and rows.
        grip.addEventListener('pointerdown', event => {
            event.preventDefault();
            event.stopPropagation();
            const scale = win.getBoundingClientRect().width / (win.offsetWidth || 1) || 1;
            const start = { x: event.clientX, y: event.clientY, cols: prefs.cols, rows: prefs.rows };
            const move = next => {
                const cols = clamp(start.cols + (next.clientX - start.x) / scale / STEP, LIMITS.cols);
                const rows = clamp(start.rows + (next.clientY - start.y) / scale / STEP, LIMITS.rows);
                if (cols === prefs.cols && rows === prefs.rows) return;
                prefs.cols = cols; prefs.rows = rows; paint(); arrange();
            };
            const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); save(); };
            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', up);
        });

        // The client rebuilds .content on every tab switch and redraws counts as they change.
        let queued = false;
        const schedule = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; if (mounted.has(component.host)) { arrange(); paintCount(); } }); };
        const watch = new MutationObserver(records => {
            for (const record of records) for (const node of record.addedNodes) if (node.nodeType === 1 && node.classList.contains('item')) info.delete(node);
            schedule();
        });
        watch.observe(content, { childList: true });
        const counter = new MutationObserver(paintCount);
        for (const node of win.querySelectorAll('.ncnt, .mcnt')) counter.observe(node, { childList: true, characterData: true, subtree: true });

        paint();
        arrange();
        paintCount();
        paintWeight();

        mounted.set(component.host, {
            paintWeight,
            unmount() {
                watch.disconnect();
                counter.disconnect();
                onBlur();
                content.removeEventListener('mouseover', onOver);
                content.removeEventListener('mouseout', onOut);
                content.removeEventListener('dragstart', onLeave);
                content.removeEventListener('dblclick', onLeave);
                for (const element of items()) { element.classList.remove('sw-hidden'); element.style.order = ''; element.querySelectorAll('.sw-name, .sw-wt').forEach(node => node.remove()); }
                for (const node of added) node.remove();
                win.classList.remove('sw', 'sw-dark', 'sw-list');
                win.style.removeProperty('--sw-cols');
                win.style.removeProperty('--sw-rows');
                if (!win.classList.length) win.removeAttribute('class');
                if (!win.style.length) win.removeAttribute('style');
                for (const element of items()) if (!element.style.length) element.removeAttribute('style');
            },
        });
    }

    function unmount(component) {
        mounted.get(component.host)?.unmount();
        mounted.delete(component.host);
    }

    // BasicInfo shows weight and zeny; the footer follows it.
    let basicWatch = null;
    const repaintWeights = () => { for (const entry of mounted.values()) entry.paintWeight(); };
    function bindBasic(component) {
        basicWatch?.disconnect();
        basic = component;
        basicWatch = new MutationObserver(repaintWeights);
        const targets = component.root?.querySelectorAll?.('.weight_value, .weight_total, .zeny_value') || [];
        for (const node of targets) basicWatch.observe(node, { childList: true, characterData: true, subtree: true });
        repaintWeights();
    }

    // Every other game window: one stylesheet each, in the Inventory's theme. A
    // window is known by its root element's id, which the client's own template sets.
    const SKINS = {
        EquipmentV4: { setting: 'equipment', css: EQUIPMENT, classes: ['sw'] },
        WinStats: { setting: 'equipment', css: STATUS, classes: ['sw'] },
        SkillListV2: { setting: 'skills', css: SKILLS, classes: ['sw'] },
        PartyFriends: { setting: 'others', css: PARTY, classes: ['sw'] },
        Guild: { setting: 'others', css: GUILD, classes: ['sw'] },
        NpcStore: { setting: 'others', css: NPCSTORE, classes: ['sw'] },
        FPS: { setting: 'others', css: FPS, classes: ['sw'] },
        // The client picks BasicInfoV4 below 4th class and BasicInfoV5 at 4th class,
        // regardless of packetver (UIVersionManager.selectUIVersionWithJob), so both
        // need the skin; BASICINFO's selectors cover both ids.
        BasicInfoV4: { setting: 'basic', css: BASICINFO, classes: ['sw'], watch: watchBasic },
        BasicInfoV5: { setting: 'basic', css: BASICINFO, classes: ['sw'], watch: watchBasic },
    };
    const plain = { setting: 'others', css: GENERIC, classes: ['swg'] };
    const specFor = id => SKINS[id] || (GENERIC_WINDOWS.has(id) ? plain : null);
    // The client puts each window inside a div.ui-component-root in the shadow root.
    const rootOf = component => { const box = component.root?.querySelector?.('.ui-component-root') || component.root; return [...(box?.children || [])].find(node => node.id) || null; };
    const skinned = new Map(); // host -> { style, win, classes }
    // Basic Info: the game writes HP, SP, AP, exp, level and job as text. Copy them into
    // CSS variables on the window, so the stylesheet can draw the bars and the badge.
    let jobsLoad = null;
    const jobIds = () => (jobsLoad ??= fetch(new URL('./jobs.json', import.meta.url)).then(r => r.json()).catch(() => ({})));
    const jobIcons = new Map(); // job name -> promise of the icon's url, or null
    const jobIcon = name => {
        if (!jobIcons.has(name)) jobIcons.set(name, jobIds().then(ids => ids[name] === undefined ? null
            : Promise.resolve(api.screens?.image?.(`renewalparty/icon_jobs_${ids[name]}.bmp`)).catch(() => null)).then(url => url || null, () => null));
        return jobIcons.get(name);
    };
    const BASIC_VARS = ['--swb-hp', '--swb-sp', '--swb-ap', '--swb-lv', '--swb-job'];
    const BASIC_CLASSES = ['swb-low', 'swb-ap', 'swb-noicon'];
    function watchBasic(win) {
        const text = selector => win.querySelector(selector)?.textContent?.trim() || '';
        const count = selector => { const n = parseInt(text(selector).replace(/[^\d]/g, ''), 10); return Number.isFinite(n) ? n : 0; };
        const share = (now, max) => max > 0 ? Math.max(0, Math.min(100, now * 100 / max)) : 0;
        const set = (name, value) => { if (win.style.getPropertyValue(name) !== value) win.style.setProperty(name, value); };
        let job = null, stopped = false;
        function paint() {
            const hp = share(count('.hp_value'), count('.hp_max_value'));
            const apMax = count('.ap_max_value');
            set('--swb-hp', hp.toFixed(1) + '%');
            set('--swb-sp', share(count('.sp_value'), count('.sp_max_value')).toFixed(1) + '%');
            set('--swb-ap', share(count('.ap_value'), apMax).toFixed(1) + '%');
            set('--swb-lv', JSON.stringify(text('.blvl_value')));
            const low = count('.hp_max_value') > 0 && hp < 25;
            if (win.classList.contains('swb-low') !== low) win.classList.toggle('swb-low', low);
            if (win.classList.contains('swb-ap') !== apMax > 0) win.classList.toggle('swb-ap', apMax > 0);
            const name = text('.job_value');
            if (name !== job) { job = name; showJob(name); }
        }
        // The job icon is the one the Party window uses, found from the job's name.
        async function showJob(name) {
            const url = await jobIcon(name);
            if (stopped || name !== job) return;
            if (url) { set('--swb-job', `url("${url}")`); win.classList.remove('swb-noicon'); }
            else { win.style.removeProperty('--swb-job'); win.classList.add('swb-noicon'); }
        }
        const watch = new MutationObserver(records => { if (records.some(r => r.target !== win)) paint(); });
        watch.observe(win, { subtree: true, childList: true, characterData: true });
        paint();
        return () => {
            stopped = true;
            watch.disconnect();
            for (const name of BASIC_VARS) win.style.removeProperty(name);
            win.classList.remove(...BASIC_CLASSES);
            if (!win.style.length) win.removeAttribute('style');
        };
    }

    function retheme() { for (const { win } of skinned.values()) win.classList.toggle('sw-dark', prefs.dark); }
    function skin(component) {
        const win = rootOf(component), spec = win && specFor(win.id);
        if (!spec || parameters?.[spec.setting] === false || skinned.has(component.host)) return;
        const style = document.createElement('style');
        style.dataset.diiWindows = win.id;
        style.textContent = spec.css;
        component.root.append(style);
        win.classList.add(...spec.classes);
        skinned.set(component.host, { style, win, classes: spec.classes, stop: spec.watch?.(win) });
        retheme();
    }
    function unskin(component) {
        const entry = skinned.get(component.host);
        if (!entry) return;
        entry.style.remove();
        entry.stop?.();
        entry.win.classList.remove(...entry.classes, 'sw-dark');
        if (!entry.win.classList.length) entry.win.removeAttribute('class');
        skinned.delete(component.host);
    }

    api.on('ui:append', component => {
        if (component.name === 'InventoryV3') { if (parameters?.inventory !== false) mount(component); }
        else if (/^BasicInfo/.test(component.name)) { bindBasic(component); skin(component); }
        else skin(component);
    });
    api.on('ui:remove', component => {
        if (component.name === 'InventoryV3') unmount(component);
        else if (basic && component.host === basic.host) { basicWatch?.disconnect(); basicWatch = null; basic = null; repaintWeights(); unskin(component); }
        else unskin(component);
    });

    return () => {
        for (const entry of mounted.values()) entry.unmount();
        mounted.clear();
        for (const { style, win, classes, stop } of skinned.values()) { style.remove(); stop?.(); win.classList.remove(...classes, 'sw-dark'); }
        skinned.clear();
        basicWatch?.disconnect();
        basic = null;
    };
}

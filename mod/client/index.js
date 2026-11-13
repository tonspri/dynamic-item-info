// Dynamic Item Info v0.6.0: a structured look for the client's own item windows,
// and the game's other windows in the same look (windows.js, skins.js).
import gameWindows from './windows.js';
// ItemInfo and ItemCompare keep every stock element and all their behaviour; this
// adds one layer inside them and hides what it replaces. It only reads what the
// client has already put in the window, so it works on an item anywhere: bag,
// storage, shop, or another player. Taking the dii-on class off restores stock.
// Base values and your level come from npc/dynamic-item-info.txt, refine values
// from refine.json (rAthena's refine tables); without them the window still works.

const STYLE = `
.dii-on { width: 320px; font: 12px/1.35 "Segoe UI", Tahoma, Verdana, sans-serif; color: #47476b;
    --ink: #47476b; --soft: #7d7fa3; --blue: #4f7fe0; --blue-deep: #3559bd; --gold: #eeb044; --line: rgba(120, 138, 205, .35); --cream: rgba(255, 253, 246, .9); }
.dii-on .container { position: relative; display: grid; grid-template-columns: 75px minmax(0, 1fr); grid-template-rows: auto 1fr auto auto auto; column-gap: 10px; height: auto !important; padding: 9px; overflow: hidden;
    border: 1px solid #7f97d8; border-radius: 12px; box-shadow: 0 10px 28px rgba(36, 44, 96, .45); background-color: #dfe6fa; background-repeat: no-repeat;
    background-image: radial-gradient(ellipse 200px 60px at 84% 6%, rgba(255, 255, 255, .7), transparent), linear-gradient(160deg, #c9d6f8 0%, #dfd8f6 42%, #f5dfe9 76%, #fdeedd 100%) !important; }
.dii-on .collection { position: static; grid-column: 1; grid-row: 1 / span 2; align-self: start; box-sizing: border-box; width: 75px; height: 100px; border-radius: 8px; background-color: rgba(255, 255, 255, .85); background-position: center; box-shadow: 0 0 0 2px var(--rim, #9db7ea); }
.dii-on.dii-grade-D { --rim: #6fbf8a; } .dii-on.dii-grade-C { --rim: #5b9be8; } .dii-on.dii-grade-B { --rim: #b58ae6; } .dii-on.dii-grade-A { --rim: var(--gold); }
.dii-on .title { position: static; grid-column: 2; grid-row: 1; box-sizing: border-box; width: auto; height: auto; min-height: 18px; padding: 0 16px 2px 0; overflow: hidden; overflow-wrap: anywhere; white-space: normal; font-size: 13px; font-weight: 600; color: #34345a; text-shadow: none; cursor: move; }
.dii-on .title.damaged { color: #a83246; text-shadow: none; }
.dii-on .close { z-index: 2; top: 8px; right: 8px; transition: transform .14s ease; }
.dii-on .close:hover { transform: scale(1.2); }
.dii-on .preview-action { grid-column: 1 / -1; grid-row: 3; padding: 5px 0 0; }
.dii-on .preview-action:not(:has(.btn_mounting[style*="block"])) { display: none; }
.dii-on .extend, .dii-on > .option-container, .dii-on > .cardlist { display: none !important; }
/* Never position: static on a scroll box: the client's scrollbar turns that into an inline relative, and the stock top and left would then push the box out of the window. */
.dii-on .description { display: none; position: relative; top: 0; left: 0; grid-column: 1 / -1; grid-row: 5; box-sizing: border-box; width: auto; height: auto !important; max-height: 150px; margin-top: 6px; padding: 6px 0 6px 9px; border-radius: 10px; background: var(--cream); line-height: 16px; }
.dii-on.dii-full .description { display: block; }
.dii-on .description .description-inner { width: auto; padding-right: 9px; }

.dii-sum, .dii-body { display: none; }
.dii-on .dii-sum { grid-column: 2; grid-row: 2; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.dii-hero { display: flex; align-items: baseline; gap: 5px; }
.dii-hero b { font-size: 22px; font-weight: 600; line-height: 1.1; color: var(--blue-deep); }
.dii-hero span { color: var(--soft); font-size: 11px; }
.dii-hero em { font-size: 13px; font-style: normal; font-weight: 600; color: #b9791b; }
.dii-chips { display: flex; flex-wrap: wrap; gap: 3px; }
.dii-chip { padding: 0 7px; border-radius: 9px; font-size: 11px; color: var(--soft); background: rgba(255, 255, 255, .8); white-space: nowrap; }
.dii-chip.refine { color: #8a5a12; background: #fbe6bb; }
.dii-chip.grade { color: #fff; background: var(--rim, #9db7ea); }
.dii-chip.worn { color: #2f6f3a; background: rgba(120, 200, 130, .35); }

.dii-on .dii-body { position: relative; grid-column: 1 / -1; grid-row: 4; display: block; max-height: clamp(180px, calc(100vh - 340px), 420px); margin-top: 8px; overflow-x: hidden; overflow-y: auto; }
.dii-content { display: flex; flex-direction: column; gap: 6px; animation: dii-fade .16s ease; }
.dii-sec { flex: none; padding: 6px 9px; border: 1px solid rgba(255, 255, 255, .95); border-radius: 10px; background: var(--cream); box-shadow: 0 1px 5px rgba(80, 90, 160, .13); }
.dii-sec h4 { margin: 0 0 3px; font-size: 11px; font-weight: 600; color: var(--blue-deep); }
.dii-row { display: flex; justify-content: space-between; gap: 10px; padding: 1px 0; }
.dii-row > span { min-width: 0; overflow-wrap: anywhere; }
.dii-row > b { flex: none; max-width: 62%; text-align: right; font-weight: 600; color: var(--blue-deep); overflow-wrap: anywhere; }
.dii-row > b.neg { color: #a83246; }
.dii-row.long > b { flex: 1 1 0; font-weight: 400; color: var(--ink); }
.dii-row.soft > span, .dii-row.soft > b { color: var(--soft); font-weight: 400; }
.dii-row > b.ok { color: #2f8a3c; }
.dii-row > b.bad { color: #a83246; }
.dii-diff { flex: none; min-width: 44px; padding: 0 6px; border-radius: 9px; font-size: 11px; font-weight: 600; text-align: center; color: var(--soft); background: rgba(120, 138, 205, .15); white-space: nowrap; }
.dii-diff.up { color: #2f6f3a; background: rgba(120, 200, 130, .3); }
.dii-diff.down { color: #a83246; background: rgba(240, 120, 140, .22); }
.dii-vs { margin-left: auto; color: var(--soft); white-space: nowrap; }
.dii-vs b { font-weight: 600; color: var(--ink); }
.dii-cmp { display: flex; align-items: center; gap: 8px; padding: 1px 0; }
.dii-hint { margin-top: 3px; color: var(--soft); font-size: 11px; }
.dii-hero .dii-diff { align-self: center; margin-left: 2px; min-width: 0; }
.dii-line { padding: 1px 0; overflow-wrap: anywhere; }
.dii-line b { font-weight: 600; color: var(--blue-deep); }
.dii-about { color: var(--soft); font-style: italic; overflow-wrap: anywhere; }
.dii-note { color: #8a5a12; }
.dii-card { margin-top: 3px; border: 1px solid rgba(214, 160, 70, .55); border-radius: 8px; background: rgba(255, 248, 228, .9); transition: box-shadow .14s ease; }
.dii-card:hover { box-shadow: 0 2px 8px rgba(190, 130, 40, .3); }
.dii-card summary { display: flex; align-items: center; gap: 6px; padding: 3px 6px; cursor: pointer; font-weight: 600; color: #8a5a12; list-style: none; }
.dii-card summary::-webkit-details-marker { display: none; }
.dii-card summary::after { content: '\\25BE'; margin-left: auto; transition: transform .14s ease; }
.dii-card:not([open]) summary::after { transform: rotate(-90deg); }
.dii-card summary img { width: 24px; height: 24px; image-rendering: pixelated; }
.dii-card > div { padding: 0 8px 4px; }
.dii-empty { margin-top: 3px; padding: 2px 6px; border: 1px dashed var(--line); border-radius: 8px; color: var(--soft); }
.dii-more { flex: none; align-self: center; padding: 2px 12px; border: 1px solid var(--line); border-radius: 12px; font: inherit; font-size: 11px; color: var(--blue-deep); background: #fff; cursor: pointer; transition: transform .13s ease, box-shadow .13s ease; }
.dii-more:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(79, 110, 200, .3); }
.dii-more:active { transform: scale(.96); }
@keyframes dii-fade { from { opacity: 0; transform: translateY(2px); } }
@media (prefers-reduced-motion: reduce) { .dii-on * { animation: none !important; transition: none !important; } }
`;

const escape = text => String(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const HEROES = /^(attack|atk|defense|def)$/i;
const KINDS = /^(class|type)$/i;
const NEEDS = /^(level requirement|required level|req\.? level|base level|equip level|jobs?|applicable jobs?|gender)$/i;
const EFFECT_LABEL = /^(effect|special effect|cure)$|bonus$/i;
const PROSE_LABEL = /^(description|warning|note)$/i;
const EFFECT_WORDS = /[+-]\s?\d|\d\s?%|\bLv\.?\s*\d|\bLevel\s+\d|^(enables?|increases?|decreases?|reduces?|adds?|when|chance|grants?|has a|random|auto-?casts?|recovers?|restores?|immun|indestructible|ignores?|nullif|critical|perfect)\b/i;
const DANGLING = /\b(of|the|a|an|to|and|or|with|for|by|on|in|at|from|when|that|is|are|has|have|will|be)$/i;

/** What the client's item name tells us: "+9 [A] Bloody Gladius [3]". */
export function parseTitle(text) {
    const name = String(text ?? '').replace(/\s+/g, ' ').trim();
    return {
        // Only at the front, where DB.getItemName puts them: "Safe to +10 Armor Refine Ticket" is a name.
        refine: Number(name.match(/^\+(\d+)\s/)?.[1] ?? 0),
        grade: name.match(/^(?:\+\d+\s)?\[([DCBA])\]\s/)?.[1] ?? null,
        slots: Number(name.match(/\s\[(\d)\]$/)?.[1] ?? 0),
    };
}

/**
 * Sorts an item description into sections and loses no words: a line it cannot
 * place stays as prose. Handles what reaches it unformatted (colours, NAVI tags).
 */
export function parseDescription(text) {
    const lines = String(text ?? '').replace(/\r/g, '')
        .replace(/<(NAVI|URL|TIPBOX)>([\s\S]*?)<INFO>[\s\S]*?<\/INFO><\/\1>/g, '$2')
        .replace(/\^[0-9a-fA-F]{6}/g, '')
        .split('\n').map(line => line.trim());
    const out = { kind: null, hero: null, stats: [], needs: [], effects: [], about: [] };
    // Wrapped lines first: the tables break sentences across entries.
    const prose = [];
    let open = false;
    const flush = () => { open = false; };
    const entries = [];
    for (const line of lines) {
        if (!/[\p{L}\p{N}]/u.test(line)) { flush(); continue; }
        const fact = line.match(/^([\p{L}][\p{L} .'/-]{0,28}?)\s*:\s*(.*)$/u);
        if (fact && fact[2] && fact[1].split(' ').length <= 3 && fact[2].length <= 90) {
            entries.push({ label: fact[1].trim(), value: fact[2].trim() });
            flush();
            continue;
        }
        const last = entries.at(-1);
        if (open && last?.text && !/[.!?:;)]$/.test(last.text) && (/^[\p{Ll}(]/u.test(line) || DANGLING.test(last.text))) last.text += ' ' + line;
        else entries.push({ text: line });
        open = true;
    }
    for (const entry of entries) {
        if (entry.text) {
            (EFFECT_WORDS.test(entry.text) ? out.effects : prose).push(entry.text);
        } else if (KINDS.test(entry.label) && !out.kind) out.kind = entry.value;
        else if (HEROES.test(entry.label) && !out.hero && /^\d/.test(entry.value)) out.hero = entry;
        else if (NEEDS.test(entry.label)) out.needs.push(entry);
        else if (EFFECT_LABEL.test(entry.label)) out.effects.push(`${/bonus$/i.test(entry.label) ? entry.label + ': ' : ''}${entry.value}`);
        else if (PROSE_LABEL.test(entry.label)) prose.push(`${/^description$/i.test(entry.label) ? '' : entry.label + ': '}${entry.value}`);
        else out.stats.push(entry);
    }
    out.about = prose;
    return out;
}

const plainText = text => String(text ?? '')
    .replace(/\^[0-9a-fA-F]{6}/g, '')
    .replace(/<(NAVI|URL|TIPBOX)>([\s\S]*?)<INFO>[\s\S]*?<\/INFO><\/\1>/g, '$2')
    .replace(/\s+/g, ' ').trim();

/**
 * Which item a window shows. The plugin API gives no id, and the title can carry
 * refine, grade, slots and card words, so: the longest run of the title's words that
 * is an item's exact name, with the same description. No match (say, unidentified) is null.
 * A name as short as "Axe" can sit past the search's limit, so byName looks further then.
 */
export function identifyItem(titleText, descText, search, byName) {
    // Refine and grade stay in for now: "+20 Basic Food Pack" is an item's whole name.
    const name = String(titleText ?? '').replace(/\s+/g, ' ').trim().replace(/\s\[\d\]$/, '');
    const words = name.split(' ').slice(0, 12);
    const text = plainText(descText);
    const slots = parseTitle(titleText).slots;
    for (let size = words.length; size > 0; size--) {
        for (let start = 0; start + size <= words.length; start++) {
            const part = words.slice(start, start + size).join(' ');
            const matches = item => plainText(item.name) === part && plainText(item.description) === text;
            const found = search(part, 200) || [];
            let same = found.filter(matches);
            if (!same.length && found.length >= 200 && byName) same = byName(part).filter(matches);
            if (same.length) return (same.find(item => item.slots === slots) ?? same[0]).id;
        }
    }
    return null;
}

/** npc/dynamic-item-info.txt's answer to "item <id>", or null when refused. */
export function parseItemReply(text) {
    const parts = String(text ?? '').split('|');
    if (parts[0] !== 'ok' || parts.length !== 14) return null;
    const [level, type, subtype, atk, matk, def, weight, wlv, alv, min, max] = parts.slice(3).map(Number);
    return { era: parts[1], group: parts[2], level, type, subtype, atk, matk, def, weight, wlv, alv, min, max };
}

const tenths = n => String(Math.round(n * 10) / 10);
const W_BOW = 11;

/**
 * Rows from the server's item data and rAthena's rules (status_calc_pc): a weapon
 * gets Bonus/100 ATK, renewal also MATK except on bows, and over-refine adds a random
 * part; armor sums Bonus/100 DEF over all worn pieces before rounding, so tenths stay.
 */
export function buildStats(item, refineTable, refine, grade) {
    const out = { hero: null, rows: [], needs: [] };
    const weapon = item.group === 'weapon';
    const armor = item.group === 'armor';
    const renewal = item.era === 'renewal';
    const levels = refineTable?.[item.era]?.[item.group]?.[weapon ? item.wlv : item.alv];
    const at = n => (levels && n > 0 ? levels[n - 1] : undefined);
    const gives = n => {
        const [bonus, random] = at(n);
        const parts = weapon
            ? [`+${Math.floor(bonus / 100)} ATK`, ...(renewal && item.subtype !== W_BOW ? [`+${Math.floor(bonus / 100)} MATK`] : [])]
            : [`+${tenths(bonus / 100)} DEF`];
        if (renewal && weapon && item.wlv === 5) parts.push(`+${n * 2} P.ATK`, `+${n * 2} S.MATK`);
        if (renewal && armor && item.alv === 2) parts.push(`+${n * 2} RES`, `+${n * 2} MRES`);
        return { text: parts.join(', '), random: Math.floor(random / 100) };
    };
    if (weapon && item.atk > 0) {
        const now = at(refine) ? Math.floor(at(refine)[0] / 100) : 0;
        out.hero = { value: String(item.atk), label: 'Base ATK', bonus: now };
        out.rows.push({ label: 'Base ATK', value: String(item.atk) });
    } else if (armor && item.def > 0) {
        const now = at(refine) ? at(refine)[0] / 100 : 0;
        out.hero = { value: String(item.def), label: 'Base DEF', bonus: now ? tenths(now) : 0 };
        out.rows.push({ label: 'Base DEF', value: String(item.def) });
    }
    if (renewal && weapon && item.matk > 0) out.rows.push({ label: 'Base MATK', value: String(item.matk) });
    // A +0 item may not be refinable at all, and the server does not say; a refined one is.
    if (refine > 0 && at(refine)) {
        const now = gives(refine);
        out.rows.push({ label: `Refine +${refine}`, value: now.text });
        if (now.random) out.rows.push({ label: 'Over-refine', value: `up to +${now.random} ATK at random` });
        if (grade) out.rows.push({ label: `Grade ${grade} refine bonus`, value: 'not included', soft: true });
        if (at(refine + 1)) out.rows.push({ label: `Next +${refine + 1}`, value: `${gives(refine + 1).text} total`, soft: true });
        else out.rows.push({ label: 'Refine', value: 'at the maximum', soft: true });
    }
    if (weapon && item.wlv > 0) out.rows.push({ label: 'Weapon level', value: String(item.wlv) });
    if (item.weight >= 0) out.rows.push({ label: 'Weight', value: tenths(item.weight / 10) });
    const have = item.level;
    if (item.min > 0) out.needs.push(have >= item.min ? { label: 'Base level', value: `\u2713 ${item.min}`, state: 'ok' } : { label: 'Base level', value: `\u2717 ${item.min} (you are ${have})`, state: 'bad' });
    if (item.max > 0 && item.max < 999) out.needs.push(have <= item.max ? { label: 'Maximum level', value: `\u2713 ${item.max}`, state: 'ok' } : { label: 'Maximum level', value: `\u2717 ${item.max} (you are ${have})`, state: 'bad' });
    return out;
}

const BOUND = { 1: 'Account', 2: 'Guild', 3: 'Party', 4: 'Character', 9: 'Mixed' };
const GRADES = { D: 1, C: 2, B: 3, A: 4 };

/** npc/dynamic-item-info.txt's answer to "own ...", or null when refused. */
export function parseOwnReply(text) {
    const parts = String(text ?? '').split('|');
    if (parts[0] !== 'ok' || parts.length !== 5) return null;
    const [copies, worn, tradable, bound] = parts.slice(1).map(Number);
    return { copies, worn, tradable, bound };
}

/** The request naming this exact copy. A card that can't be placed, or a hidden list (forged gear), matches any cards. */
export function ownRequest(id, title, optionCount, cardIds) {
    const cards = cardIds && cardIds.length === 4 && cardIds.every(card => card !== null) ? cardIds : [-1, -1, -1, -1];
    return `own ${id} ${title.refine} ${GRADES[title.grade] ?? 0} ${optionCount} ${cards.join(' ')}`;
}

export function ownRows(own) {
    const rows = [{ label: 'Carrying', value: String(own.copies) }];
    if (own.worn) rows.push({ label: 'Equipped', value: String(own.worn) });
    rows.push({ label: 'Bound', value: BOUND[own.bound] ?? 'No' });
    rows.push({ label: 'Can be traded', value: own.tradable === own.copies ? 'Yes' : own.tradable === 0 ? 'No' : `${own.tradable} of ${own.copies}` });
    return rows;
}

/** What a refine level adds, as numbers. Over-refine's random part and grade are left out. */
export function refineValues(item, refineTable, refine) {
    const weapon = item.group === 'weapon';
    const row = refine > 0 ? refineTable?.[item.era]?.[item.group]?.[weapon ? item.wlv : item.alv]?.[refine - 1] : null;
    if (!row) return { atk: 0, matk: 0, def: 0 };
    if (!weapon) return { atk: 0, matk: 0, def: row[0] / 100 };
    const atk = Math.floor(row[0] / 100);
    return { atk, matk: item.era === 'renewal' && item.subtype !== W_BOW ? atk : 0, def: 0 };
}

/**
 * The inspected item against the worn one, base values only and labelled so. Null when
 * they are not the same kind of gear: the client also pairs a weapon with a worn shield.
 */
export function compareStats(mine, worn, refineTable) {
    if (mine?.item.group !== worn?.item.group || !['weapon', 'armor'].includes(mine?.item.group)) return null;
    const [a, b] = [mine, worn].map(side => ({ ...side.item, ...Object.fromEntries(Object.entries(refineValues(side.item, refineTable, side.refine)).map(([key, n]) => [`r${key}`, n])) }));
    const weapon = a.group === 'weapon';
    const rows = (weapon
        ? [['Base ATK', 'atk'], ...(a.era === 'renewal' ? [['Base MATK', 'matk']] : []), ['Refine ATK', 'ratk'], ...(a.era === 'renewal' ? [['Refine MATK', 'rmatk']] : []), ['Weapon level', 'wlv', 'plain']]
        : [['Base DEF', 'def'], ['Refine DEF', 'rdef']])
        .map(([label, key, plain]) => ({ label, mine: a[key], worn: b[key], plain: !!plain }));
    rows.push({ label: 'Weight', mine: a.weight / 10, worn: b.weight / 10, plain: true });
    const shown = rows.filter(row => row.mine || row.worn).map(row => ({ ...row, diff: Math.round((row.mine - row.worn) * 10) / 10 }));
    const heroKey = weapon ? 'atk' : 'def';
    return {
        rows: shown,
        same: shown.every(row => row.diff === 0),
        hero: Math.round((a[heroKey] - b[heroKey]) * 10) / 10,
        heroLabel: weapon ? 'base ATK' : 'base DEF',
        graded: !!(mine.grade || worn.grade),
    };
}

const diffHtml = (diff, plain, suffix = '') => {
    if (diff === 0) return `<span class="dii-diff">=${suffix}</span>`;
    const text = `${diff > 0 ? '\u25B2' : '\u25BC'}${tenths(Math.abs(diff))}${suffix}`;
    return `<span class="dii-diff${plain ? '' : diff > 0 ? ' up' : ' down'}">${text}</span>`;
};
const compareHtml = comparison => comparison.same
    ? '<div class="dii-line">Same base values as your equipped item.</div>'
    : comparison.rows.map(row => `<div class="dii-cmp"><span>${escape(row.label)}</span><span class="dii-vs"><b>${tenths(row.mine)}</b> vs ${tenths(row.worn)}</span>${diffHtml(row.diff, row.plain)}</div>`).join('')
        + `<div class="dii-hint">This item vs equipped. Base values only: your stats, skills and cards also change real damage${comparison.graded ? ', and Grade bonuses are not included' : ''}.</div>`;

/** One effect line as rows: "Str +2, DEF +1" is two; anything else stays a sentence. */
export function splitEffect(line) {
    const row = part => part.match(/^([\p{L}][\p{L}\d .'%-]*?)\s*([+-]\s?\d[\d,.]*%?)$/u);
    const parts = line.split(/,\s*/).map(row);
    if (parts.every(Boolean)) return parts.map(m => ({ label: m[1], value: m[2].replace(/\s/g, '') }));
    return [{ text: line }];
}

/** A sentence as safe HTML with its numbers picked out. */
export function emphasize(text) {
    return escape(text).replace(/[+-]\s?\d[\d,.]*%?|\b\d[\d,.]*%|\b(?:Lv\.?|Level)\s*\d+/g, '<b>$&</b>');
}

const effectHtml = lines => lines.flatMap(splitEffect).map(part => part.text
    ? `<div class="dii-line">${emphasize(part.text)}</div>`
    : `<div class="dii-row"><span>${escape(part.label)}</span><b class="${part.value[0] === '-' ? 'neg' : ''}">${escape(part.value)}</b></div>`).join('');
const factHtml = fact => `<div class="dii-row${fact.value.length > 24 ? ' long' : ''}"><span>${escape(fact.label)}</span><b>${escape(fact.value)}</b></div>`;
const statHtml = row => `<div class="dii-row${row.soft ? ' soft' : ''}${row.value.length > 24 ? ' long' : ''}"><span>${escape(row.label)}</span><b class="${row.state ?? ''}">${escape(row.value)}</b></div>`;
const section = (title, html) => html ? `<section class="dii-sec"><h4>${escape(title)}</h4>${html}</section>` : '';

export default function init(parameters, api) {
    const stopWindows = gameWindows(parameters, api);
    if (api?.version !== 1) throw new Error('Dynamic Item Info requires client API 1');
    const windows = new Map();
    const cardIds = new Map();
    let full = api.preferences?.get?.('full', false) === true;
    const here = file => new URL(file, import.meta.url).href;
    const identified = new Map();
    const serverItems = new Map();
    const asking = new Set();
    const refused = new Map();
    let refineTable = null;
    let refineLoad = null;
    let levelAt = 0;
    let characterLevel = null;
    const owned = new Map();
    const askingOwn = new Set();
    const restrictions = new Map();

    // A question each time an item comes up, because what you carry changes. Repeats within a moment reuse the answer.
    async function askOwn(request) {
        const last = owned.get(request);
        if (askingOwn.has(request) || (last && Date.now() < last.until) || !api.server?.request) return;
        askingOwn.add(request);
        let value = null;
        let wait = 30000;
        try {
            value = parseOwnReply(await api.server.request('dii', request, { timeout: 4000 }));
            if (value) wait = 3000;
        } catch {}
        askingOwn.delete(request);
        owned.set(request, { value, until: Date.now() + wait });
        if (owned.size > 200) owned.delete(owned.keys().next().value);
        redrawAll();
    }

    // The client only fills its restrictions tooltip on hover, so hover its label for a moment. Once per text.
    function readRestrictions(inner, key) {
        const label = inner.querySelector('.moveinfo-label');
        if (!label) return [];
        if (!restrictions.has(key)) {
            label.dispatchEvent(new MouseEvent('mouseenter'));
            const tooltip = document.getElementById('moveinfo-tooltip');
            restrictions.set(key, tooltip ? [...tooltip.children].map(line => line.textContent.trim()).filter(Boolean) : []);
            label.dispatchEvent(new MouseEvent('mouseleave'));
        }
        return restrictions.get(key);
    }

    // Built once, and only if a name overflows the search. Ids past this are mods' own, with rarer names.
    let nameIndex = null;
    const byName = part => {
        if (!nameIndex) {
            nameIndex = new Map();
            for (let id = 1; id < 70000; id++) {
                const item = api.items.get?.(id);
                if (!item) continue;
                const key = plainText(item.name);
                if (!nameIndex.has(key)) nameIndex.set(key, []);
                nameIndex.get(key).push(item);
            }
        }
        return nameIndex.get(part) ?? [];
    };

    const whichItem = (title, text) => {
        const key = `${title}\n${text}`;
        if (!identified.has(key)) {
            identified.set(key, api.items?.search ? identifyItem(title, text, (part, limit) => api.items.search(part, limit), byName) : null);
            if (identified.size > 500) identified.delete(identified.keys().next().value);
        }
        return identified.get(key);
    };

    const redrawAll = () => { for (const view of windows.values()) refresh(view); };

    // One question per item, and again after a while for the level. A local command, so this is quick.
    async function askServer(id) {
        if (asking.has(id) || (serverItems.has(id) && Date.now() - levelAt < 10000) || Date.now() - (refused.get(id) ?? 0) < 30000 || !api.server?.request) return;
        asking.add(id);
        try {
            refineLoad ??= fetch(here('./refine.json')).then(r => r.json()).then(table => { refineTable = table; }).catch(() => {});
            const [reply] = await Promise.all([api.server.request('dii', `item ${id}`, { timeout: 4000 }), refineLoad]);
            const item = parseItemReply(reply);
            if (item) {
                serverItems.set(id, item);
                characterLevel = item.level;
                levelAt = Date.now();
            } else refused.set(id, Date.now());
        } catch {
            refused.set(id, Date.now());
        } finally {
            asking.delete(id);
        }
        redrawAll();
    }

    const cardInfo = name => {
        if (!cardIds.has(name)) {
            const found = api.items?.search?.(name, 20)?.find(item => item.name === name) ?? null;
            cardIds.set(name, found);
        }
        return cardIds.get(name);
    };

    // What the stock code wrote. A hidden list can be the last item's: setItem only hides it.
    function readWindow(view) {
        const shown = node => node && node.style.display !== 'none';
        const inner = view.root.querySelector('.description-inner');
        const copy = inner.cloneNode(true);
        copy.querySelectorAll('.moveinfo-label').forEach(node => node.remove());
        const rental = [...copy.querySelectorAll('div')].map(node => { const text = node.textContent; node.remove(); return text; });
        const options = view.root.querySelector('.option-container');
        const cardlist = view.root.querySelector('.cardlist');
        return {
            restrictions: readRestrictions(inner, copy.textContent),
            titleText: view.root.querySelector('.title')?.textContent ?? '',
            descText: copy.textContent,
            title: parseTitle(view.root.querySelector('.title')?.textContent),
            info: parseDescription(copy.textContent),
            rental,
            options: shown(options) ? [...options.querySelectorAll('.optionlist .border')].map(node => node.textContent.trim()).filter(Boolean) : [],
            cards: shown(cardlist) ? [...cardlist.querySelectorAll('.item')].map(node => node.querySelector('.name')?.textContent ?? '') : null,
            links: inner.querySelector('.navi-link') ? inner.textContent : null,
        };
    }

    function cardsHtml(cards, slots) {
        if (!cards) return '';
        const rows = cards.map((name, index) => {
            if (name) {
                const card = cardInfo(name);
                const effects = card ? parseDescription(card.description).effects : [];
                return `<details class="dii-card" open data-slot="${index}"><summary title="Right-click to read this card"><img alt="" data-card="${card?.id ?? ''}">${escape(name)}</summary><div>${effectHtml(effects) || '<div class="dii-line">No listed effect</div>'}</div></details>`;
            }
            return index < slots ? `<div class="dii-empty">Slot ${index + 1}: empty</div>` : '';
        }).join('');
        return section('Cards', rows);
    }

    function draw(view) {
        const data = readWindow(view);
        const { title, info } = data;
        // An item with a map link opens its text by itself, until the player closes that one.
        const open = full || (data.links !== null && data.links !== view.closedLinks);
        view.links = data.links;
        const id = whichItem(data.titleText, data.descText);
        if (id !== null) askServer(id);
        if (title.refine && id !== null && api.items.get?.(id)?.name?.startsWith(`+${title.refine} `)) title.refine = 0;
        const known = id !== null ? serverItems.get(id) : null;
        const cardIds = data.cards ? data.cards.map(name => (name ? cardInfo(name)?.id ?? null : 0)) : null;
        const ownKey = id !== null ? ownRequest(id, title, data.options.length, cardIds) : null;
        if (ownKey) askOwn(ownKey);
        const mine = ownKey ? owned.get(ownKey)?.value : null;
        const have = mine?.copies > 0 ? mine : null;
        // ItemInfo reads what ItemCompare, which only ever shows worn gear, has on show.
        view.shown = known ? { item: known, refine: title.refine, grade: title.grade } : null;
        const worn = view.name === 'ItemInfo' ? [...windows.values()].find(other => other.name === 'ItemCompare')?.shown : null;
        const comparison = view.shown && worn ? compareStats(view.shown, worn, refineTable) : null;
        const stats = known ? buildStats({ ...known, level: characterLevel ?? known.level }, refineTable, title.refine, title.grade) : null;
        // What the server answered replaces the same facts from the description's text.
        const others = stats ? info.stats.filter(fact => !/^(weight|weapon level|armor level)$/i.test(fact.label)) : info.stats;
        const needs = stats ? info.needs.filter(fact => !/level/i.test(fact.label)) : info.needs;
        const shownHero = stats?.hero ?? (info.hero && { value: info.hero.value, label: info.hero.label, bonus: 0 });
        const hero = shownHero ? `<div class="dii-hero"><b>${escape(shownHero.value)}</b>${shownHero.bonus ? `<em>+${escape(shownHero.bonus)}</em>` : ''}<span>${escape(shownHero.label)}</span>${comparison && stats?.hero ? diffHtml(comparison.hero, false, ` ${comparison.heroLabel}`) : ''}</div>` : '';
        const chips = [
            // The client only compares against worn gear; a card opened from that window is not worn.
            view.name === 'ItemCompare' && !/^card$/i.test(info.kind ?? '') ? '<span class="dii-chip worn">Equipped</span>' : '',
            view.name === 'ItemInfo' && have ? `<span class="dii-chip worn">${have.worn ? 'You have it equipped' : `You carry ${have.copies}`}</span>` : '',
            have && BOUND[have.bound] ? `<span class="dii-chip">${BOUND[have.bound]} bound</span>` : '',
            info.kind ? `<span class="dii-chip">${escape(info.kind)}</span>` : '',
            title.refine ? `<span class="dii-chip refine">Refine +${title.refine}</span>` : '',
            title.grade ? `<span class="dii-chip grade">Grade ${title.grade}</span>` : '',
        ].join('');
        const summary = `${hero}<div class="dii-chips">${chips}</div>`;
        const body = [
            data.rental.map(text => `<div class="dii-sec dii-note">${escape(text)}</div>`).join(''),
            section('Stats', stats ? stats.rows.map(statHtml).join('') : ''),
            comparison ? section('Compared with equipped', compareHtml(comparison)) : '',
            section('Effects', effectHtml(info.effects)),
            section('Random options', effectHtml(data.options)),
            cardsHtml(data.cards, title.slots),
            section('Details', others.map(factHtml).join('')),
            section('Requirements', (stats ? stats.needs.map(statHtml).join('') : '') + needs.map(factHtml).join('')),
            section('Restrictions', data.restrictions.map(line => `<div class="dii-line">${escape(line)}</div>`).join('')),
            have ? section('Your copies', ownRows(have).map(statHtml).join('') + '<div class="dii-hint">What this character carries with the same refine, grade, cards and number of options. Storage is not counted.</div>') : '',
            info.about.length ? `<section class="dii-sec dii-about">${info.about.map(escape).join('<br>')}</section>` : '',
            `<button class="dii-more" type="button">${open ? 'Hide' : 'Show'} full description</button>`,
        ].join('');
        view.el.classList.remove('dii-grade-D', 'dii-grade-C', 'dii-grade-B', 'dii-grade-A');
        if (title.grade) view.el.classList.add(`dii-grade-${title.grade}`);
        view.el.classList.toggle('dii-full', open);
        view.el.classList.add('dii-on');
        // The stock code can touch a window without changing the item: keep what is open and where it was scrolled.
        if (summary !== view.lastSummary) { view.sum.innerHTML = summary; view.lastSummary = summary; }
        if (body !== view.lastBody) {
            view.content.innerHTML = body;
            view.lastBody = body;
            view.body.scrollTop = 0;
            for (const img of view.content.querySelectorAll('img[data-card]')) {
                const id = Number(img.dataset.card);
                if (id) api.items.icon(id).then(url => { if (url) img.src = url; }).catch(() => {});
            }
        }
        // The worn item arrived or changed: the inspected item's comparison follows it.
        if (view.name === 'ItemCompare') {
            const key = JSON.stringify(view.shown);
            if (key !== view.shownKey) {
                view.shownKey = key;
                const inspected = [...windows.values()].find(other => other.name === 'ItemInfo');
                if (inspected) refresh(inspected);
            }
        }
    }

    function refresh(view) {
        view.queued = false;
        if (!windows.has(view.host)) return;
        try {
            draw(view);
            view.broken = false;
        } catch (error) {
            // Never leave a player without item text: this window goes back to stock.
            view.el.classList.remove('dii-on');
            if (!view.broken) console.warn('Dynamic Item Info: showing the stock window', error);
            view.broken = true;
        }
    }

    // ItemCompare measures itself before this restyle widens it, and would sit over ItemInfo.
    function placeCompare() {
        const info = [...windows.values()].find(view => view.name === 'ItemInfo');
        const compare = [...windows.values()].find(view => view.name === 'ItemCompare');
        if (!info || !compare) return;
        const a = info.host.getBoundingClientRect();
        const b = compare.host.getBoundingClientRect();
        if (b.right <= a.left || b.left >= a.right) return;
        const left = a.left - b.width >= 0 ? a.left - b.width : a.right;
        compare.host.style.left = `${left}px`;
        compare.host.style.top = `${a.top}px`;
    }

    function attach(component) {
        if ((component.name !== 'ItemInfo' && component.name !== 'ItemCompare') || windows.has(component.host)) return;
        const root = component.root;
        const el = root.querySelector(`.${component.name}`);
        const container = el?.querySelector('.container');
        if (!container) return;
        const style = document.createElement('style');
        style.textContent = STYLE;
        root.append(style);
        const sum = document.createElement('div');
        sum.className = 'dii-sum';
        const body = document.createElement('div');
        body.className = 'dii-body';
        // The client's scrollbar lives inside the scroll box, so items are drawn one level in:
        // wiping the box itself would make the client add another, each with its own wheel handler.
        const content = document.createElement('div');
        content.className = 'dii-content';
        body.append(content);
        container.append(sum, body);
        const view = { name: component.name, host: component.host, root, el, style, sum, body, content, queued: false, broken: false, lastSummary: null, lastBody: null };
        const queue = () => {
            if (view.queued) return;
            view.queued = true;
            queueMicrotask(() => { refresh(view); placeCompare(); });
        };
        view.observer = new MutationObserver(queue);
        for (const selector of ['.title', '.description-inner', '.option-container', '.cardlist']) {
            const node = root.querySelector(selector);
            if (node) view.observer.observe(node, { childList: true, subtree: true, characterData: true, attributes: selector === '.option-container' || selector === '.cardlist', attributeFilter: selector === '.option-container' || selector === '.cardlist' ? ['style'] : undefined });
        }
        body.addEventListener('click', event => {
            if (!event.target.closest('.dii-more')) return;
            full = !el.classList.contains('dii-full');
            view.closedLinks = full ? null : view.links;
            api.preferences?.set?.('full', full);
            for (const other of windows.values()) refresh(other);
        });
        // A card's name opens the card itself, as a right-click on the stock icon does.
        body.addEventListener('contextmenu', event => {
            const card = event.target.closest('.dii-card');
            if (!card) return;
            event.preventDefault();
            root.querySelector(`.cardlist .item[data-index="${card.dataset.slot}"] .icon`)?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
        });
        windows.set(component.host, view);
        queue();
    }

    function detach(component) {
        const view = windows.get(component.host);
        if (!view) return;
        windows.delete(component.host);
        view.shown = null;
        view.observer.disconnect();
        view.style.remove();
        view.sum.remove();
        view.body.remove();
        view.el.classList.remove('dii-on', 'dii-full', 'dii-grade-D', 'dii-grade-C', 'dii-grade-B', 'dii-grade-A');
        if (view.name === 'ItemCompare') redrawAll();
    }

    // Another character, or another era's world: nothing known still holds.
    api.on('connection', () => { serverItems.clear(); refused.clear(); owned.clear(); characterLevel = null; levelAt = 0; });
    api.on('ui:append', attach);
    api.on('ui:remove', detach);
    return () => { stopWindows(); for (const view of [...windows.values()]) detach(view); };
}

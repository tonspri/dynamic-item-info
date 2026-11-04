'use strict';
// Package checks: the server script and the window must agree. Run from the repository root.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');

const mod = path.resolve('mod');
const read = rel => fs.readFileSync(path.join(mod, rel), 'utf8');
const manifest = JSON.parse(read('mod.json'));
const VERSION = manifest.version;
const refine = JSON.parse(read('client/refine.json'));
const npc = read(`npc/dynamic-item-info-v${VERSION}.txt`);
const code = npc.replace(/\/\/[^\n]*/g, '');
const results = [];
const check = async (label, fn) => { await fn(); results.push(label); };

(async () => {
    // A copy outside the mod so Node reads the plugin as a module.
    const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'dii-'));
    const copy = path.join(scratch, 'index.mjs');
    fs.copyFileSync(path.join(mod, 'client/index.js'), copy);
    const plugin = await import('file:///' + copy.replace(/\\/g, '/'));

    await check('manifest: name, era folders and the files of this version', () => {
        assert.equal(manifest.name, 'dynamic-item-info');
        for (const [folder, era] of [[manifest.renewalFolder, 'renewal'], [manifest.prerenewalFolder, 'pre-renewal']])
            assert(read(`${folder}/npc/dynamic-item-info-era-v${VERSION}.txt`).includes(`$@DII_era$ = "${era}";`));
        assert(fs.existsSync(`RELEASE-NOTES-v${VERSION}.md`));
    });

    await check('npc: level 0, braces balance, every called label exists, and it only reads', () => {
        assert.match(code, /bindatcmd "dii", strnpcinfo\(3\) \+ "::OnRequest", 0, 99;/);
        assert.equal((code.match(/{/g) || []).length, (code.match(/}/g) || []).length);
        for (const [, label] of code.matchAll(/callsub\(?\s*(S_\w+)/g)) assert(new RegExp(`^${label}:`, 'm').test(code), label);
        for (const banned of ['getitem', 'delitem', 'Zeny', 'modstore_set', 'bonus_script', 'query_sql', 'atcommand']) assert(!code.replace(/getitemname|getiteminfo/g, '').includes(banned), banned);
    });

    await check('identify: the longest run of title words with the same description', () => {
        const table = [
            { id: 1101, name: 'Sword', description: 'A basic sword.', slots: 3 },
            { id: 1102, name: 'Sword', description: 'A basic sword.', slots: 4 },
            { id: 13811, name: '+20 Basic Food Pack', description: 'Food.', slots: 0 },
        ];
        const search = (text, limit) => table.filter(item => item.name.toLowerCase().includes(text.toLowerCase())).slice(0, limit);
        assert.equal(plugin.identifyItem('+7 [B] Double Fierce Sword [4]', 'A basic sword.', search), 1102);
        assert.equal(plugin.identifyItem('Sword [3]', '^000000A basic sword.', search), 1101);
        assert.equal(plugin.identifyItem('+20 Basic Food Pack', 'Food.', search), 13811);
        assert.equal(plugin.identifyItem('Sword', 'Unknown Item, can be identified.', search), null);
    });

    await check('description: sorts into sections and keeps every word', () => {
        const parsed = plugin.parseDescription(['A practical sword', 'that is typically', 'used by sailors.', 'Enables use of', 'Level 5 Bash.', 'Str +2, DEF +1', 'Class:^6666CC One-Handed Sword^000000', 'Attack:^CC0000 150^000000', 'Weight:^009900 90^000000', 'Level Requirement:^009900 40^000000', 'Jobs:^6666CC Swordman^000000'].join('\n'));
        assert.equal(parsed.kind, 'One-Handed Sword');
        assert.deepEqual(parsed.hero, { label: 'Attack', value: '150' });
        assert.deepEqual(parsed.effects, ['Enables use of Level 5 Bash.', 'Str +2, DEF +1']);
        assert.deepEqual(parsed.about, ['A practical sword that is typically used by sailors.']);
        assert.deepEqual(parsed.needs.map(n => n.label), ['Level Requirement', 'Jobs']);
    });

    await check('npc and client agree on the reply', () => {
        const parts = code.slice(code.indexOf('return "ok|'));
        const order = [...parts.matchAll(/ITEMINFO_(\w+)/g)].map(m => m[1]);
        assert.deepEqual(order, ['SUBTYPE', 'ATTACK', 'MAGICATTACK', 'DEFENSE', 'WEIGHT', 'WEAPONLEVEL', 'ARMORLEVEL', 'EQUIPLEVELMIN', 'EQUIPLEVELMAX']);
        assert.deepEqual(plugin.parseItemReply('ok|renewal|weapon|99|5|2|150|0|0|900|4|1|40|0'),
            { era: 'renewal', group: 'weapon', level: 99, type: 5, subtype: 2, atk: 150, matk: 0, def: 0, weight: 900, wlv: 4, alv: 1, min: 40, max: 0 });
        assert.equal(plugin.parseItemReply('err|No such item.'), null);
        assert.equal(plugin.parseItemReply(undefined), null);
    });

    await check('copies: the request, the reply and how they read', () => {
        assert.equal(plugin.ownRequest(1101, { refine: 7, grade: 'A' }, 2, [4002, 0, 0, 0]), 'own 1101 7 4 2 4002 0 0 0');
        assert.equal(plugin.ownRequest(1101, { refine: 0, grade: null }, 0, null), 'own 1101 0 0 0 -1 -1 -1 -1', 'hidden cards match any');
        assert.equal(plugin.ownRequest(1101, { refine: 0, grade: null }, 0, [4002, null, 0, 0]), 'own 1101 0 0 0 -1 -1 -1 -1', 'an unplaced card matches any');
        // The script reads each request argument in the order the client sends them.
        const call = code.match(/callsub\(S_Own, ([^;]+)\);/)[1].match(/\[(\d)\]/g).map(m => Number(m[1]));
        assert.deepEqual(call, [2, 3, 4, 5, 6, 7, 8, 9]);
        assert.deepEqual(plugin.parseOwnReply('ok|3|1|2|0'), { copies: 3, worn: 1, tradable: 2, bound: 0 });
        assert.equal(plugin.parseOwnReply('err|No.'), null);
        assert.equal(plugin.parseOwnReply('ok|1'), null);
        const read = own => Object.fromEntries(plugin.ownRows(own).map(r => [r.label, r.value]));
        assert.deepEqual(read({ copies: 3, worn: 1, tradable: 2, bound: 0 }), { Carrying: '3', Equipped: '1', Bound: 'No', 'Can be traded': '2 of 3' });
        assert.deepEqual(read({ copies: 1, worn: 0, tradable: 0, bound: 4 }), { Carrying: '1', Bound: 'Character', 'Can be traded': 'No' });
        assert.equal(read({ copies: 2, worn: 0, tradable: 2, bound: 9 }).Bound, 'Mixed');
        assert.equal(read({ copies: 2, worn: 0, tradable: 2, bound: 0 })['Can be traded'], 'Yes');
    });

    await check('refine table: matches rAthena, including the +9 weapon in the reference shot', () => {
        assert.deepEqual(refine.renewal.weapon[1].slice(8, 10), [[1800, 600], [2000, 900]]);
        assert.deepEqual(refine['pre-renewal'].armor[1][0], [70, 0]);
        assert.deepEqual(Object.keys(refine['pre-renewal'].weapon), ['1', '2', '3', '4']);
        assert.deepEqual(Object.keys(refine.renewal.weapon), ['1', '2', '3', '4', '5']);
        assert.equal(refine.renewal.weapon[1].length, 20);
    });

    await check('stats: rAthena\'s refine rules for each kind of gear', () => {
        const weapon = { era: 'renewal', group: 'weapon', level: 99, subtype: 2, atk: 200, matk: 0, def: 0, weight: 10, wlv: 1, alv: 1, min: 1, max: 0 };
        const rows = (item, level, grade) => Object.fromEntries(plugin.buildStats(item, refine, level, grade).rows.map(r => [r.label, r.value]));
        const nine = rows(weapon, 9);
        assert.equal(nine['Base ATK'], '200');
        assert.equal(nine['Refine +9'], '+18 ATK, +18 MATK');
        assert.equal(nine['Next +10'], '+20 ATK, +20 MATK total');
        assert.equal(nine['Over-refine'], 'up to +6 ATK at random');
        assert.equal(nine.Weight, '1');
        assert.equal(plugin.buildStats(weapon, refine, 9).hero.bonus, 18);
        assert.equal(rows({ ...weapon, subtype: 11 }, 9)['Refine +9'], '+18 ATK', 'a bow gets no MATK from refine');
        assert.equal(rows({ ...weapon, era: 'pre-renewal' }, 7)['Refine +7'], '+14 ATK');
        assert.equal(rows({ ...weapon, wlv: 5 }, 3)['Refine +3'].includes('+6 P.ATK, +6 S.MATK'), true);
        assert.equal(rows(weapon, 20).Refine, 'at the maximum');
        assert.equal(rows(weapon, 0)['Refine +0'], undefined);
        assert.equal(rows(weapon, 7, 'A')['Grade A refine bonus'], 'not included');
        const armor = { ...weapon, era: 'pre-renewal', group: 'armor', def: 4, wlv: 0 };
        assert.equal(rows(armor, 7)['Refine +7'], '+4.9 DEF');
        assert.equal(plugin.buildStats(armor, refine, 7).hero.label, 'Base DEF');
        assert.equal(rows({ ...armor, era: 'renewal', alv: 2 }, 2)['Refine +2'].includes('+4 RES, +4 MRES'), true);
        const potion = { ...weapon, group: 'other', atk: 0, wlv: 0, weight: 70, min: 0 };
        assert.deepEqual(plugin.buildStats(potion, refine, 0).rows, [{ label: 'Weight', value: '7' }]);
        assert.deepEqual(plugin.buildStats({ ...weapon, level: 12, min: 40 }, refine, 0).needs, [{ label: 'Base level', value: '\u2717 40 (you are 12)', state: 'bad' }]);
        assert.deepEqual(plugin.buildStats({ ...weapon, level: 50, min: 40, max: 100 }, refine, 0).needs.map(n => n.state), ['ok', 'ok']);
        assert.equal(plugin.buildStats({ ...weapon, level: 120, max: 100 }, refine, 0).needs.at(-1).state, 'bad');
        assert.equal(plugin.buildStats(weapon, null, 9).rows.some(r => /^Refine/.test(r.label)), false, 'no table, no refine claims');
    });

    await check('compare: labelled base values, only between the same kind of gear', () => {
        const weapon = { era: 'renewal', group: 'weapon', subtype: 2, atk: 105, matk: 0, def: 0, weight: 700, wlv: 3, alv: 1 };
        const worn = { ...weapon, atk: 200, weight: 10, wlv: 1 };
        const result = plugin.compareStats({ item: weapon, refine: 7 }, { item: worn, refine: 9 }, refine);
        const row = label => result.rows.find(r => r.label === label);
        assert.equal(result.hero, -95);
        assert.equal(result.heroLabel, 'base ATK');
        assert.equal(result.same, false);
        assert.deepEqual([row('Base ATK').mine, row('Base ATK').worn, row('Base ATK').diff], [105, 200, -95]);
        assert.deepEqual([row('Refine ATK').mine, row('Refine ATK').worn], [Math.floor(refine.renewal.weapon[3][6][0] / 100), 18]);
        assert.equal(row('Refine MATK').worn, 18);
        assert.equal(row('Base MATK'), undefined, 'neither has any');
        assert.deepEqual([row('Weight').diff, row('Weight').plain], [69, true], 'weight is neither better nor worse');
        assert.equal(row('Weapon level').plain, true);
        const bow = plugin.compareStats({ item: { ...weapon, subtype: 11 }, refine: 7 }, { item: worn, refine: 0 }, refine);
        assert.equal(bow.rows.find(r => r.label === 'Refine MATK'), undefined, 'a bow gets no refine MATK, and a +0 weapon has none');
        const pre = plugin.compareStats({ item: { ...weapon, era: 'pre-renewal' }, refine: 7 }, { item: { ...worn, era: 'pre-renewal' }, refine: 0 }, refine);
        assert.equal(pre.rows.some(r => /MATK/.test(r.label)), false);
        const armor = { era: 'pre-renewal', group: 'armor', def: 4, weight: 100, wlv: 0, alv: 1 };
        const plated = plugin.compareStats({ item: armor, refine: 7 }, { item: { ...armor, def: 2 }, refine: 1 }, refine);
        assert.equal(plated.hero, 2);
        assert.equal(plated.heroLabel, 'base DEF');
        assert.equal(plated.rows.find(r => r.label === 'Refine DEF').diff, 4.2, 'tenths, without float noise');
        assert.equal(plugin.compareStats({ item: weapon, refine: 0 }, { item: weapon, refine: 0 }, refine).same, true);
        assert.equal(plugin.compareStats({ item: weapon, refine: 0, grade: 'A' }, { item: worn, refine: 0 }, refine).graded, true);
        assert.equal(plugin.compareStats({ item: weapon, refine: 0 }, { item: armor, refine: 0 }, refine), null, 'a weapon against a worn shield');
        assert.equal(plugin.compareStats({ item: { ...armor, group: 'other' }, refine: 0 }, { item: { ...armor, group: 'other' }, refine: 0 }, refine), null, 'cards and potions');
        assert.equal(plugin.compareStats(null, { item: armor, refine: 0 }, refine), null);
        assert.equal(plugin.compareStats({ item: armor, refine: 0 }, null, refine), null);
    });

    await check('title: refine, grade and slots, the way DB.getItemName writes them', () => {
        assert.deepEqual(plugin.parseTitle('+9 [A] Double Bloody Gladius [3]'), { refine: 9, grade: 'A', slots: 3 });
        assert.deepEqual(plugin.parseTitle('Sword'), { refine: 0, grade: null, slots: 0 });
        assert.deepEqual(plugin.parseTitle('Safe to +10 Armor Refine Ticket'), { refine: 0, grade: null, slots: 0 });
        assert.deepEqual(plugin.parseTitle('+3 [B] Cap'), { refine: 3, grade: 'B', slots: 0 });
        assert.deepEqual(plugin.parseTitle(undefined), { refine: 0, grade: null, slots: 0 });
    });

    await check('description: unformatted tags and colours never show', () => {
        const parsed = plugin.parseDescription('Go to <NAVI>^0000FFProntera^000000<INFO>prontera,150,150,0,101,0</INFO></NAVI> now.');
        assert.deepEqual(parsed.about, ['Go to Prontera now.']);
    });

    await check('effects: rows, sentences and safe text', () => {
        assert.deepEqual(plugin.splitEffect('Str +2, DEF +1'), [{ label: 'Str', value: '+2' }, { label: 'DEF', value: '+1' }]);
        assert.deepEqual(plugin.splitEffect('Enables use of Level 5 Bash.'), [{ text: 'Enables use of Level 5 Bash.' }]);
        assert.equal(plugin.emphasize('<i>ATK</i> +5%'), '&lt;i&gt;ATK&lt;/i&gt; <b>+5%</b>');
    });

    fs.rmSync(scratch, { recursive: true, force: true });
    console.log(results.map(r => `ok - ${r}`).join('\n'));
})().catch(error => { console.error(results.map(r => `ok - ${r}`).join('\n')); console.error(error); process.exit(1); });

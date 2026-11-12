# Dynamic Item Info

A mod for [Ragnarok Offline](https://github.com/Flux159/ragnarokoffline.app) that turns the item information window into clear sections: live stats, refine values, a labelled comparison with what you have equipped, the copies you carry, restrictions, effects, random options and cards you can expand. The Inventory, Equipment, Status and Skill Tree windows get the same look, with search, sort, a list view, a weight bar and a light or midnight theme. Works in renewal and pre-renewal, on a normal player account.

## What is here

| Path | What it is |
|---|---|
| `mod/` | The mod exactly as it ships |
| `mod/client/index.js` | The window layer, and the logic that reads the window and works out the rows |
| `mod/client/windows.js` | The new Inventory, and the wiring for the other game windows |
| `mod/client/skins.js` | The Equipment, Status and Skill Tree styles |
| `mod/client/refine.json` | Refine bonuses for each era, generated from rAthena's `db/re/refine.yml` and `db/pre-re/refine.yml` |
| `mod/npc/` | The read-only server script |
| `mod/renewal/`, `mod/pre-renewal/` | One line each, telling the script which era this world is |
| `tests/` | Package checks that run on every push |
| `scripts/` | Builds the release zip |

Each release is built by this repository's workflow from the commit it names, after the checks pass.

## How it works

- **The window:** the client's own `ItemInfo` and `ItemCompare` windows keep every stock element, including the title they drag by, the art, the buttons and the description. The mod adds one layer inside them through `ui:append` and hides what it replaces with CSS under a `dii-on` class. Removing that class restores the stock window, which is what happens if drawing an item ever fails.
- **Which item:** the plugin API doesn't give the item's id, so the mod finds the longest run of the title's words that is an exact item name with the same description. An item it can't place shows what its description says.
- **The server:** `@dii` is a level-0 command, so players can type it themselves. It only reads: `getiteminfo` for the item's base values, `BaseLevel`, and `getinventorylist` for the character's own copies. It gives, takes and stores nothing, and answers only about the character asking.
- **The game windows:** the Inventory, Equipment, Status and Skill Tree keep the client's own slots, rows and handlers, so using, equipping, dragging and raising stats work as in the game. The mod lays them out with a stylesheet in each window's shadow root and adds its own toolbar to the Inventory. It reads item names from the client's own hover label and item data from its own drag payload, and sends nothing.
- **Refine rules:** the rows follow rAthena's `status_calc_pc`. The window says so when a value isn't counted, such as Grade's extra refine bonus.

## Limits

See the [mod's README](mod/README-v0.5.0.md#known-limits).

## License

[GPL-3.0](LICENSE)

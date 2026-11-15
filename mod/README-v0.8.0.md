# Dynamic Item Info v0.8.0

Turns the item information window into clear sections: live stats, refine values now and at the next level, a labelled comparison with what you have equipped, the copies you carry and their restrictions, effects, random options, cards you can expand, and whether your level meets the requirements. Works on any item the game shows you, and keeps the game's own art, buttons and full description. The Inventory, Equipment, Status, Skill Tree, Party, Guild, Basic Info, the chat box, the skill bar and the Escape and settings menus get the same look, with search, sort, a list view, a weight bar and a light or midnight theme; the chat box is also resizable in width and stays translucent over gameplay. Every other game window gets the matching title bar and frame. Renewal and pre-renewal.

## How to use it
Enable the mod, restart the game, then open any item's information as usual. There is nothing else to set up.

- **Stats** shows the item's base values from your server, what its refine gives now, and what the next level would give. Base values are labelled as base: your real damage also depends on your stats and skills.
- **Requirements** checks your level against the item's limits. Jobs are shown as the item lists them, without a check.
- **Your copies** shows how many of this exact item your character carries, how many are equipped, whether they're bound and whether they can be traded. It matches on refine, grade, cards and number of options, and doesn't count storage.
- **Restrictions** lists what the game says you can't do with the item, like dropping or storing it.
- **Full description** at the bottom shows the game's original text. The window remembers your choice. It opens by itself on items whose text has a map link, so the link stays one click away.
- **Cards** in slots list their effects. Click a card to fold it, or right-click it to read the card itself.
- **Compared with equipped**: when the game opens its comparison window, the item you're inspecting gets a section comparing base values and refine with your equipped item, and the difference beside its main number. The comparison window itself gets the same look and is marked Equipped. If the window doesn't open, turn on item comparison in the game's inventory options.

## The game's windows in the same look
- **Inventory (Alt+E)**: tabs on top, rounded slots, search (Esc clears it, game keys pause while you type), sort by Game order, Type, Name or Newest, a list view with names and weights, a weight bar with zeny (orange at 50%, red at 90%), and a hover label with name, count and weight. Resize from the bottom-right corner; the size is remembered.
- **Equipment (Alt+Q)**: pill tabs, worn items on rounded cards and named empty slots.
- **Status**: stat names drawn as text on a clean panel and round + buttons.
- **Skill Tree (Alt+S)**: pill tabs along the top and rounded skill cells, with raisable skills tinted.
- **Basic Info**: your job badge with your base level on it, big HP and SP bars with the numbers inside (orange and breathing below 25% HP), base and job exp bars, and weight and zeny chips. The small mode is a compact strip with the badge and both bars. The menu opens from a handle and shows the game's buttons on rounded tiles.
- **Party and Friends**: rounded member rows, a clean bar of buttons and Friends/Party pills.
- **Guild (Alt+G)**: pill tabs, a cream panel and softer tables.
- **The chat box**: translucent glass that keeps the game showing through behind it, gold sender names (the rest of each line, and its own colour -- party, guild, system -- stays exactly as the game sends it), and a corner grip to resize its width, from 360 to 900px. Dragging the top edge of the log still resizes its height, the game's own way; the size and position are both remembered. Every tab, filter, command and keyboard shortcut works as before. The background's opacity is a setting.
- **The skill bar**: larger tiles around the game's own icons, each slot's hotkey under it, and Rows buttons to show 1 to 4 rows. Drag-drop, hotkeys and cooldowns are the game's own.
- **Escape menu, shortcut keys and Graphics Settings**: buttons as text, pill tabs, themed checkboxes, sliders and lists.
- **Every other game window** (Storage, Quest, shops, trade, mail, world map and more): the blue title bar, round close button, rounded frame and slim scrollbar. Their insides stay the game's own.
- **Light or midnight**: the moon and sun button in the Inventory switches every window. Windows that keep the game's insides only change their title bar.
- Every click, drag and button works as in the game: using, equipping, dragging to hotkeys, right-click info, raising stats and skills. Each window can be turned back to the game's own in Settings.

## How it reads items
The sections come from what the game already shows in the window, plus a small read-only server command for base values and your level. A line it can't place stays readable as plain text. If the server doesn't answer, the window still shows everything from the item's description.

## Known limits
- Refine values come from the game's standard refine tables. A mod that changes those tables won't show here.
- An item with a Grade gets more from its refine than the row shows; the window says so.
- The comparison covers base values and refine only, not cards, random options, item effects or what they do with your stats and skills. A higher number doesn't always mean a better item. Over-refine's random bonus isn't counted.
- An unrefined item shows no refine rows, because the server doesn't say whether it can be refined.
- Armor refine shows tenths, like +4.9 DEF, because the server adds up all your armor before rounding.
- Your copies describes what your character carries, even when you're looking at the same item in a shop, in storage or on another player.
- Two copies that differ only in which random options they have, with the same number of options, count as the same copy.
- Items are recognized by matching their name and description, so an unidentified item, or one your client's text doesn't match, shows only its description.
- Requirements and details are recognized from English item text. With another language, more lines appear as plain text.
- If the mod hits a problem with an item, that window goes back to the game's normal look.
- The new windows apply to the windows of the app's default client version (Inventory from 2018, Status from 2020, Equipment from 2022). With an older client version chosen in Settings, those windows keep the game's look.
- A few buttons whose words are still part of a picture (the equip switch buttons) stay the game's own; Apply, Reset and the npc shop's Buy/Sell/Cancel/OK draw real text now.
- The chat box's width-resize grip is ours; its vertical resize, by dragging the log's own top edge, is the game's. Width is remembered separately from the game's own saved height and position.
- Weight per item comes from the item description; an item without a weight line shows none.

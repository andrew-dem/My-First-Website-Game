# Worldbound: A Cultivator's Life (v4)

A browser life game. Be born, cultivate, take risks, duel rivals, brew pills, break through realms, die, and carry **fate** into the next life. Plain HTML/CSS/JS, no dependencies, works on GitHub Pages.

## Run
Open `index.html`, or run `python -m http.server 8000` and visit http://localhost:8000. Tests: `node tests.js`.

## What is in it
- Three origins and a random spirit root (five elements, each with a perk).
- Six realms, six places (village, market, sect, forest, ruins, peak) with their own actions and events.
- 29 events with risk tags. Luck shifts rolls toward the better outcome.
- Duels: Strike / Guard / Technique (rock-paper-scissors), foes tend to repeat, flee option, a persistent rival who returns.
- Six techniques learned at the sect or from masters, and alchemy (four pills) from spirit herbs.
- Fate shop: six permanent upgrades that apply to every future life.
- Laptop layout (three columns), tablet and phone layouts, keyboard shortcuts, autosave (`worldbound-v4`). A v3 save's fate is carried over.

## Files
`engine.js` rules (no DOM) · `ui.js` interface · `styles.css` · `index.html` · `tests.js` · `legacy_v3/` earlier prototype · `legacy_v0.2/` unrelated kingdom simulator · `PROJECT_HANDOFF.md` continuation notes.

## Verified (automated: `node tests.js`, 18 checks; manual: real Chromium)
Content validity, determinism, every life ends, dead characters cannot act, invalid actions change nothing, travel, breakthrough, duels, flee, rival replacement, alchemy, pills, sect, fate shop, luck, save/load mid-duel, and a 150-life balance run. The UI was clicked through in a browser including a 900-click random stress run (16 lives, no errors).

## Limitations
No sound or art beyond the SVG scene. Balance is tuned by a simple bot only. Fonts load from Google Fonts (falls back to serif offline).

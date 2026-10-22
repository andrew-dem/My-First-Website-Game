# PROJECT_HANDOFF — Worldbound: A Cultivator's Life
Last updated: 2026-10-22 (session 2)

## Purpose
Browser cultivation life game (plain HTML/CSS/JS, no dependencies, GitHub Pages friendly): live a life, duel, brew, break through realms, die, carry fate forward.

## VERIFIED state (run and checked this session)
- Files: `index.html`, `styles.css`, `engine.js` (rules, no DOM, exports for node), `ui.js`, `tests.js`, `README.md`, `legacy_v3/` (old 17 KB engine), `legacy_v0.2/` (unrelated kingdom sim).
- `node tests.js` -> 18/18 pass. Includes a 150-life bot: ~80% leave Mortal, ~40% reach Foundation, ~18% reach Nascent Soul.
- Real Chromium: birth screen, life, duel, alchemy, map, fate shop, reload persistence (save key `worldbound-v4`), 900-click random stress (16 lives, 0 errors), phone view has no horizontal overflow.
- Implemented: 3 origins, spirit roots with elements, 6 realms, 6 places, 29 events with risk tags, luck, duels with rival, 6 techniques, 4 pills, fate shop (6 upgrades), keyboard shortcuts, 3-column laptop UI.

## NOT verified / known gaps
- The other AI platform's newer engine (46 events, "17 tests") was never uploaded; this v4 engine is a rebuild to its described spec, with 29 events not 46.
- Balance tuned with one simple bot only; no human playtest.
- Only desktop Chromium and a 390px viewport tested; no Safari/Firefox.

## Next steps (priority order)
1. Human playtest and tune: breakthrough chance, event rewards, early-game pacing.
2. More content: 20+ events (so 46+), more places, techniques with active duel effects, rival backstory.
3. Sect ranks and quests; inventory/equipment; companions.
4. Sound and light animation; on-page tutorial for first life.
5. Deploy to GitHub Pages after local test.

## Run / test
Open `index.html` or `python -m http.server 8000`. Tests: `node tests.js`.

## Constraints
No API keys or secrets. Keep engine DOM-free so tests run in node. Keep ids/classes used by ui.js in index.html (app, art, seal, name, meta, ladder, vitals, kit, card, choices, actions, keys, tabs, panel, wipe, toast, moment).

### INSTRUCTIONS FOR THE NEXT AI
1. Read this whole document first.
2. Understand the existing state before proposing changes.
3. Do not redo completed work (engine, UI, tests, laptop layout).
4. Ask for missing files only if necessary (e.g. the other platform's newer engine, if the user still has it).
5. Preserve existing functionality; run `node tests.js` before and after changes.
6. Continue from step 1 of Next steps.
7. Verify assumptions against the real files.
8. Update this document after significant progress.

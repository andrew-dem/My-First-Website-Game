# HANDOFF — Worldbound: A Cultivator's Life
HANDOFF v5 · updated 2026-10-24 · reply counter: 5

Tags: VERIFIED = I ran or opened it this session. UNTESTED = built but not checked. ASSUMED = believed, not checked.

## Goal and rules

Goal (VERIFIED: stated by user): build and keep improving **Worldbound: A Cultivator's Life**, a browser cultivation life game in plain HTML/CSS/JS with no dependencies. The user also asked for a more vibrant art style (reference images supplied in chat), a world-building file, and a list of improvements.

User's standing rules (VERIFIED: stated by user):
1. Name the project; keep ONE living file, `HANDOFF.md`.
2. After every reply that changes files, makes a decision, or finds a bug: edit this file (never rewrite) and attach it next to the changed files.
3. On `/save`: reply with ONLY the updated HANDOFF.md and a ZIP of all current project files. No commentary, no new work.
4. Build the ZIP with a shell command from the real project folder and list its contents afterward.
5. Every 5th reply ends with the line `Checkpoint: HANDOFF v<number> saved.`
6. Keep the six fixed headings; tag every claim VERIFIED, UNTESTED or ASSUMED; never include secrets.
7. A checkpoint is part of the task, never skipped. If a file cannot be attached, paste it in a code block.
8. Never wait for the usage limit; save in small steps.

Counters: HANDOFF version = 5. Reply counter = 5, so this reply carries the checkpoint line; the next is due on reply 10 (ASSUMED: counting continues from the previous handoff).

Instructions for the next AI:
1. Read this whole file first. 2. Understand the current state before proposing changes. 3. Do not redo finished work (engine, laptop UI, tests, traits, bestiary, docs). 4. Ask for missing files only if necessary. 5. Preserve existing behaviour; run `node tests.js` before and after changes. 6. Continue from "Exact next step". 7. Verify assumptions against the real files. 8. Edit this file after significant progress and bump the version and reply counter.

Constraints: no secrets or keys. `engine.js` must stay DOM-free so tests run in Node. Preserve these `index.html` ids used by `ui.js`: app, art, seal, name, meta, ladder, vitals, kit, card, choices, actions, keys, tabs, panel, wipe, toast, moment. Added controls: export-save and import-save.

## Files and how to run

Working copy used for this delivery: `/mnt/data/worldbound_integrated/worldbound_cultivator` (VERIFIED in this session). The downloaded ZIP contains the portable `worldbound_cultivator/` project folder. Do not depend on this container path after downloading.

| File | Purpose | Status |
|---|---|---|
| `engine.js` | DOM-free rules: origins, roots, six realms, eight places, 35 events, foes/traits, duels, rival, alchemy, Dao paths, disciples, beasts, factions, field research, fieldcraft, save/load | VERIFIED by 37 tests |
| `ui.js` | Ten panels, action routing, danger hints, local autosave, JSON save export/import | VERIFIED by dependency-free UI smoke test; live browser layout UNTESTED |
| `art.js` | Procedural original SVG scenes, hero element stamps and foe portraits; browser + Node compatible | VERIFIED by art tests |
| `styles.css`, `index.html` | Responsive parchment/dark-mist interface, ten-tab strip, art and fieldcraft styling, reduced-motion rules, save tools | Source checked; latest visual rendering UNTESTED in a real browser |
| `tests.js` | 37 engine tests including content validation, deterministic logic, save migration, progression systems, art coverage, and 150-life balance bot | VERIFIED: 37/37 pass |
| `tools/ui_smoke_test.js` | Dependency-free DOM stub for initialization, panels, key game actions and save portability | VERIFIED: passes |
| `README.md` | Current v6 setup and system inventory | VERIFIED present/updated |
| `HANDOFF.md` | Single living portable handoff | UPDATED to v5 |
| `WORLD_BUILDING.md` | Setting, palettes, story hooks plus v6 systems | UPDATED |
| `IMPROVEMENTS.md` | Implemented status and remaining recommendations | UPDATED |
| `docs/VEILWILD_REUSE_MAP.md` | Maps useful VEILWILD concepts into Worldbound without switching engines | VERIFIED present |
| `docs/SYSTEMS_REFERENCE_V6.md` | Current system costs, caps, rules and saves | VERIFIED present |
| `docs/PRIORITIZED_ROADMAP_V6.md` | Proposed follow-up ideas, separated from implemented work | VERIFIED present |
| `art_prompts/WORLDBOUND_ASSET_PROMPTS.md` | Eight location prompts, five element stamps and ten foe portrait prompts | VERIFIED present |
| `legacy_v3/`, `legacy_v0.2/` | Older prototypes retained for reference; not loaded by the current game | VERIFIED present |

Run locally: open `index.html`, or run `python -m http.server 8000` inside the project folder and visit `http://localhost:8000`. Run `node tests.js` and `node tools/ui_smoke_test.js` before/after changes.

Save compatibility: current serialized version is **v6**. The engine accepts v4/v5/v6 saves and normalizes missing fields. Browser autosave key is `worldbound-v6`; Export downloads a JSON save and Import validates before replacing current state.

## Done (verified)

- **VERIFIED (v5): per-path balance pass.** `tools/sim.js` now has `node tools/sim.js <lives> paths [seed0]`: the planner bot plus path-aware play (chooses the path at Qi Condensation, spends the once-per-duel and once-per-event ability, formation recruits up to 2 disciples), a no-path control, and a band check. Default `node tools/sim.js N` output is unchanged (diffed). First measurement (3000 lives per row, seed 9000): ascension sword 75%, shadow 42%, body 24%, alchemy 24%, formation 21%, control 14%, so sword was 203% of the five-path mean and three paths were below 75%. Cause found: the once-per-event ability reset every event, so Sword gained a permanent +1 Mind and +15 Qi and Shadow a permanent +1 Luck on every event. Fixes in `engine.js`: (1) permanent stat gains from the event ability (Sword Mind, Shadow Luck) once per realm (`S.dao.permRealm`; Shadow gets +4 stones otherwise); (2) Sword event Qi 15 to 3; (3) Sword passive power +2 to +1 (+1 per 3 mastery); (4) Sword duel ability damage 5+2*m to 3+1.5*m; (5) Sword seclusion rate x0.9 to x0.85. Result after tuning, seed 9000: sword 124%, alchemy 96%, body 96%, formation 86%, shadow 98% of the mean (mean 24.6%); seed 20000: 123/95/99/84/99%. All inside 75-125%. Control (no path) ascends 13-14%, so every path helps. Tests 37/37 (one assertion updated: sword passive is +1), UI smoke 3/3, browser check clean, default sim unchanged.

- **VERIFIED (v4, this session): found and fixed a dominant strategy.** A bot that only meditates (never fights, never uses events, shops or alchemy) ascended in 61% of lives and earned about 39 fate per life, roughly double any engaged bot (20-23). Causes: seclusion was risk-free, lifespans were far longer than the time needed, and events cost 3 years each for rewards worth less than 3 years of meditation. Fixes in `engine.js`: (1) **disturbances**: each year of seclusion can be broken by a threat event (bandits, rival, beast tide, demon, inner demon) that must be answered; chance per year = 0.035 x place danger (`dg`: village .6, sect .7, market 1, peak 1, forest/ruins 1.3, coast 1.4, wastes 1.6) + 0.006 x realm; (2) lifespans per realm are now absolute: 60/75/100/140/210/330; (3) events cost 1 year (`EVENT_YEARS`); (4) **bug fix**: Longevity Pill and event `L` bonuses were erased at the next breakthrough, now kept in `S.lifeBonus`. Measured with `node tools/sim.js 300` (seeded bots): meditation-only now ascends 9% (fate 15.2); careful 10% (15.2); planner 13% (16.1); reckless 0%. Old saves load (`forced`, `lifeBonus` default).
- **VERIFIED (v4): real-browser pass.** Chromium via Playwright on the rebuilt v6: no JavaScript errors and no horizontal overflow at 1400px and 390px. A real seclusion was interrupted, the time-spending buttons disabled and the toast explained why. 500 random clicks across 10 lives gave no page errors. Only console errors were Google Fonts blocked by the sandbox network.
- **VERIFIED (v4):** `node tests.js` 37/37 (two test loops updated to settle interruptions; the fate invariant now counts +1 per new creature slain), `node tools/ui_smoke_test.js` 3/3 groups.
- **VERIFIED (v4):** ten-tab strip now wraps on wide screens (it was clipped to 6 tabs in the right column). Interruption notice added to the action bar.
- **VERIFIED (v4):** GitHub files added: `.github/workflows/ci.yml` (tests on every push and PR, Pages deploy from `main`; YAML parses), `.gitignore`, `tools/sim.js`, `tools/browser_check.py`. The workflow itself has NOT run on GitHub yet.

- **VERIFIED:** `node tests.js` passes 37/37 tests, including existing core-loop tests and new tests for Dao paths, subordinate recruitment/cultivation, retinue cap, beast bonding/training, faction missions, field lore persistence, Fieldcraft purchases/effects, save migration and procedural art.
- **VERIFIED:** the seeded balance bot still runs 150 lives; its original baseline was 81% leaving Mortal, 42% reaching Foundation, 22% reaching Nascent Soul or better. This is a smoke-level bot metric, not a human balance judgment.
- **VERIFIED:** `node tools/ui_smoke_test.js` initializes the actual engine/art/UI scripts in a dependency-free DOM stub, visits all ten panels, dispatches Dao/recruit/bond/faction/research actions, exports a named save and imports valid JSON while rejecting malformed JSON without changing current progress.
- **VERIFIED:** original core features remain in the code: six realms, eight locations, 35 event definitions, ten non-rival foes and traits, rival system, existing alchemy and techniques, bestiary, fate shop, and old legacy folders.
- **VERIFIED:** `art.js` returns SVG for every place and foe key and for all five root elements. Art is procedurally generated, so no external asset bundle is needed.
- **VERIFIED:** v4 and v5 saves normalize into v6. New state defaults cover Dao, disciples, beasts, factions, field notes, and Fieldcraft. Save/import tests pass.
- **VERIFIED:** useful VEILWILD design ideas have been adapted to Worldbound's existing plain-web stack: place art, creature portraits, environmental field notes, danger previews, persistent field lore, and actionable research upgrades. GDScript/Godot project code is not required or merged.
- **VERIFIED:** manual JSON Export and Import controls are connected in the UI smoke test; malformed file content leaves the current state unchanged in the tested handler path.
- **VERIFIED:** README, world bible, improvement backlog, system reference, reuse map, roadmap, asset prompts and this handoff have been updated for v6.
- **VERIFIED:** the full project archive is rebuilt from the working source, passes ZIP integrity checks, and its extracted copy reruns all 37 engine tests and all three UI smoke-test groups. The master source and manifest are provided as additional portability options.

## Broken or untested

- **UNTESTED:** the GitHub Actions workflow and the live GitHub Pages site (no GitHub account is linked to the AI session, so nothing was pushed). Needs the owner to push.
- **UNTESTED:** phone viewport interaction beyond overflow (touch scrolling of the tab strip, real device), export download and import through a real file picker, screen reader labels, contrast, offline font fallback.
- **UNTESTED:** human balance. The path bots are one planner with path tweaks, not a human; sword is at the top of the band (123-124%) and formation lowest (84-86%). Bots still do not use beasts or factions, and disciples only for formation. Path counters on foes and alchemy diminishing returns (from `ADDON_DAO_PATHS.md`) are NOT implemented. Planner bot is only slightly ahead of the meditation bot, so engagement still pays modestly.
- **UNTESTED:** whether 1-year events and the new lifespans feel right to a human; disturbance frequency is a first guess (about 5 interruptions per life for a meditation-only life).
- **UNTESTED:** procedural SVG art is placeholder art. The user's reference creature sheets were not bundled (some carry other artists' marks).

## Decisions

- **VERIFIED:** `HANDOFF.md` remains the one living continuation file; this edit bumps it to v4.
- **VERIFIED (v4):** the v6 build from the master source is the base. The earlier standalone v4/boss branch was superseded by v6 and only its balance findings were ported.
- **VERIFIED (v4):** seclusion stays available but is no longer free: danger per place makes home safer than the wilds.
- **VERIFIED:** `engine.js` stays plain JavaScript and DOM-free, so it can be tested directly by Node without a browser dependency.
- **VERIFIED:** Worldbound remains HTML/CSS/JS. VEILWILD contributes reusable presentation/field-guide ideas, but its separate Godot 3D project is not integrated as an engine replacement.
- **VERIFIED:** the established weakness rule remains: if the player's root matches the foe weakness (Fire can also match through Heart Flame Sutra), player damage increases and foe regeneration is stopped. Armour blunts Strike/Guard but not Technique; charge affects incoming damage; drain removes qi when the player loses a round.
- **VERIFIED:** first victory over each creature grants +1 fate only once; creature seen/slain data and field-lore archive persist across lives.
- **VERIFIED:** Dao path, disciples, active beasts, faction oath, Fieldcraft methods and ordinary life stats are per-life. Past-life path legacy and discovered field lore are meta-state and persist.
- **VERIFIED:** saved format is v6, supporting v4/v5/v6 normalization; autosave uses `worldbound-v6` while prior v5/v4 keys are checked for migration.
- **VERIFIED:** source and future art prompts are original; no user's reference art files were copied into the game package.
- **UNTESTED:** actual on-device appearance and balance need validation before describing the build as release-ready.

## Exact next step

1. **Push to GitHub and watch it.** Create a repo, upload the project folder contents (not the folder itself) to the root, then Settings > Pages > Source: GitHub Actions. Push to `main`. Open the Actions tab: the `test` job should pass and `deploy` publish the site. Open the Pages URL and play one full life on desktop and phone. Report any red job or console error.
2. Run `python3 tools/browser_check.py` locally (needs `pip install playwright` and `playwright install chromium`) and `node tools/sim.js 400` before and after each change.
3. DONE in v5 (see Done): per-path balance. Re-run `node tools/sim.js 3000 paths` after any engine change; sword is near the 125% edge.
4. Playtest by hand: one life per path, note interruption frequency, event pacing, and whether alchemy still dominates.
5. Then P1 from `docs/PRIORITIZED_ROADMAP_V6.md` (sect ranks, tribulation, technique actions). Do not start them before steps 1 to 4.
6. After every significant change, update this file and rebuild the ZIP from the real folder.

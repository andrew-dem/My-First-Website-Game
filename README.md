# Worldbound: A Cultivator's Life — v6

**Worldbound** is a dependency-free browser cultivation life simulator built with plain HTML, CSS, and JavaScript. You are reborn with a spirit root, cultivate through six realms, make risky choices, fight rivals and spirit beasts, join factions, train a retinue, study the world, and carry fate and discovered lore into future lives.

This build keeps the existing game and adds new mechanics in its current stack. The separate Godot VEILWILD prototype is **not** required and does not replace Worldbound.

## Run locally

1. Extract the project folder.
2. Open `index.html` in a modern browser, or run `python -m http.server 8000` inside this folder and open `http://localhost:8000`.
3. Run engine tests with `node tests.js`.
4. Run the dependency-free UI smoke test with `node tools/ui_smoke_test.js`.

No npm packages, engine installation, server backend, or external asset pack is required. Google Fonts are optional; the site falls back to local system serif fonts when unavailable.

## Existing core loop retained

- Three origins; five elements and spirit-root qualities.
- Six cultivation realms, eight locations, 35 event definitions, alchemy and four pill recipes.
- RPS-style duels (Strike/Guard/Technique), ten non-rival creature foes with traits, a persistent rival, flight/escape, and a cross-life bestiary reward.
- Sect techniques, six fate-shop upgrades, life chronicle, and local autosave.

## New systems in this expanded build

- **Procedural art (`art.js`):** original SVG scene paintings for all eight locations, a root-element hero stamp, and foe portraits for the bestiary and duels. This repurposes VEILWILD's art/creature presentation idea in native browser code.
- **Pre-fight danger hints:** expected damage estimate, known creature trait/weakness display, and calculated escape chance.
- **Five Dao paths:** Sword, Alchemy, Body, Formation, and Shadow; path passives, once-per-event/duel abilities, mastery, and limited starting echoes from past lives.
- **Subordinate system:** recruit up to three disciples, rank-train and qi-cultivate them, assign specialist roles, and make rank, realm, loyalty, and morale affect their contribution.
- **Spirit-beast bonds:** bond eligible foes after a prior victory, train bonds, grow affinity, and assign Guardian, Scout, Forager, or Combat Companion roles. Two active bonds per life.
- **Five factions:** Azure Cloud Sect, Beast Wardens, Mist Market Guild, Ruin Scholars, and Tidebound Covenant; each has an entry condition, a distinct perk, and repeatable missions.
- **Field lore and research:** study the eight regions, preserve discoveries across reincarnations, and spend research on four life-specific Fieldcraft methods.
- **Portable saves:** autosave under `worldbound-v6`, export JSON backups, import valid v4/v5/v6 saves, and preserve existing progress if a selected import is invalid.
- **Ten tabs:** Map, Alchemy, Bestiary, Journal, Dao Paths, Sect, Beasts, Factions, Research, and Fate.

## Fieldcraft methods

| Method | Research cost | Effect |
|---|---:|---|
| Trail-Sense Method | 1 | +8 percentage points to escape odds |
| Forager's Atlas | 2 | +1 herb from herb-bearing events and field studies |
| Weakness Codex | 3 | +2 combat power when your element matches a foe's weakness |
| Warding Sigils | 3 | Begin every duel with a three-point shield |

Research methods last for the current life. Field lore itself persists in the archive across reincarnations.

## Useful file map

| File | Purpose |
|---|---|
| `engine.js` | Pure rule engine; no DOM dependencies. Main balancing source of truth. |
| `ui.js` | All panels, controls, warnings, autosave, and save import/export. |
| `art.js` | Self-contained procedural SVG scene, hero, and foe illustrations. |
| `styles.css` | Responsive UI, themes, art styling, and reduced-motion support. |
| `tests.js` | 37 automated game-rule and data-integrity tests, including a 150-life seeded balance bot. |
| `tools/ui_smoke_test.js` | Executes real engine/art/UI scripts in a dependency-free DOM stub and exercises all panels/action routes. |
| `HANDOFF.md` | Living portable project handoff and precise next step. |
| `WORLD_BUILDING.md` | Regions, story hooks, creature lore, art direction, and content rules. |
| `IMPROVEMENTS.md` | Prioritized ideas, with current completed work marked. |
| `docs/VEILWILD_REUSE_MAP.md` | Explains which reusable ideas were brought over and how. |
| `docs/SYSTEMS_REFERENCE_V6.md` | Mechanics, gates, costs, caps, and save behavior. |
| `docs/PRIORITIZED_ROADMAP_V6.md` | Recommendations that are still proposals, not implemented features. |
| `legacy_v3/`, `legacy_v0.2/` | Preserved historical prototypes; not loaded by the current game. |

## Verification status

- **VERIFIED:** `node tests.js` passes 37/37 tests.
- **VERIFIED:** `node tools/ui_smoke_test.js` passes UI initialization, all ten panel render routes, Dao selection, disciple recruitment, beast bonding, faction joining, field research spending, export file naming, valid import, and invalid-import safety in a dependency-free test DOM.
- **VERIFIED:** every existing location, element, and foe key returns SVG art; v4/v5 saves normalize into v6; research and faction data survive save/load.
- **VERIFIED (v6.2):** `python3 tools/browser_check.py` (Playwright Chromium) shows no page errors and no horizontal overflow. Visual and accessibility review by a human is still UNTESTED.
- **UNTESTED:** human balance/playtest, target-browser behavior, and exported standalone packaging.

## Good first playthrough

Start a life, reach Qi Condensation, choose a Dao path, visit regions and study traces, spend research on a Fieldcraft method, record foes in the Bestiary, defeat a bondable beast, visit the Sect to recruit and cultivate disciples, and join the faction whose perk best supports your plan. Export a save before experimenting with a new build.

## Scope guidance

This remains a life-simulation game first. The new systems should reinforce the repeating loop of cultivation → choice → risk → discovery → death/legacy. Avoid adding multiplayer, a huge equipment tree, many new currencies, or an infinite world until save recovery, human playtests, and the current systems are stable.


## Play and test (v6.1)
- Play: open `index.html`, or `python3 -m http.server 8000`. Live site after GitHub Pages is enabled: `https://<your-name>.github.io/<repo>/`.
- Tests: `node tests.js`, `node tools/ui_smoke_test.js`. Balance bots: `node tools/sim.js 400`. Real browser: `python3 tools/browser_check.py`.
- Seclusion can now be interrupted by threats (more often away from home). Events cost 1 year. Lifespans are 60/75/100/140/210/330.
- GitHub: push to `main`; `.github/workflows/ci.yml` runs tests and deploys Pages.

- Path balance: `node tools/sim.js 3000 paths` compares the five Dao paths with a no-path control (v6.2: all within 75-125% of the mean).

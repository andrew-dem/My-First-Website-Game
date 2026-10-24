# Worldbound — Improvements to Add (v6)

Effort: S = under an hour, M = a few hours, L = a day or more. Impact is my judgement of how much it changes the experience.

## Already done in v6 (automated engine/UI smoke tests pass)

| Item | Status |
|---|---|
| Creature traits: armour, regeneration, charge, qi drain, element weakness | DONE and tested |
| Bestiary: discovered/locked creature entries and +1 fate for the first victory | DONE and tested |
| Eight locations, 35 events, realm-gated places, six realms | RETAINED and tested |
| Procedural SVG scene per location, element hero stamp, and foe portraits | DONE; artwork availability tested, final browser appearance still needs a real-browser pass |
| Pre-fight danger preview, duel damage estimate, calculated escape chance | DONE in interface source; visual placement needs a human check |
| Five Dao paths with passives, active abilities, mastery and past-life echoes | DONE and engine-tested |
| Up to three recruitable disciples with rank training, qi cultivation, specialist roles, morale and loyalty effects | DONE and engine-tested |
| Two active bonded beasts, bond growth/affinity, role assignment and prior-victory gate | DONE and engine-tested |
| Five oath-bound factions, location/realm gates, distinct perks and missions | DONE and engine-tested |
| Eight field lore notes; permanent archive across reincarnations | DONE and engine-tested |
| Four Fieldcraft methods purchased with research: Trail Sense, Forager's Atlas, Weakness Codex, Warding Sigils | DONE and engine-tested |
| Save version 6, migration from v4/v5, manual JSON export/import and safe rejection of malformed imports | DONE; Node UI smoke test passes, real-browser download/import needs manual confirmation |
| Responsive tab strip and reduced-motion CSS rules | PRESENT in source; latest layout still needs real device/browser validation |
| Dependency-free automated coverage | 37/37 engine tests plus UI smoke test pass |

## Do next (prioritized)

| # | Improvement | Why | Effort | Impact |
|---|---|---|---|---|
| 1 | **Real-browser validation and human balance pass** | Verify the ten tabs, import/export, mobile overflow, duel messaging, and all new economy loops. Balance data is not a substitute for human playtests. | S | Very high |
| 2 | **Fast-forward with standing orders** | Simulate 3/5/10 years under cautious/balanced/bold rules, pausing before duels, lethal choices, or breakthroughs. | M | High |
| 3 | **Sect ranks and missions** | Outer disciple → inner disciple → core disciple → elder candidate; give standing and missions a long-term purpose. | M | High |
| 4 | **Event memory flags and consequence chains** | Let choices echo in later encounters and make reincarnated lives feel distinct without adding new currencies. | M | High |
| 5 | **Breakthrough tribulations and active techniques** | Add one short preparation sequence and meaningful learned-technique actions, while preserving the current duel triangle and text-first gameplay. | M | High |

## Gameplay

| Improvement | Effort | Impact |
|---|---|---|
| Five Elements combat layer: element cycle, elemental techniques and pills, elemental stances | M | High |
| Rival storyline: dialogue, escalating encounters, a final showdown at the last breakthrough | M | High |
| Tribulation mini-game for breakthroughs (prepare an array, survive lightning waves) | M | Medium |
| Companions and the NPC archetypes in `WORLD_BUILDING.md` (shops, quests, betrayals) | L | High |
| Equipment and artefacts (weapon, robe, talisman) forged at the market | L | Medium |
| Chain events using flags (helped the child, robbed the elder) so choices echo later | M | High |
| Achievements and a "fate ledger" (slay all ten creatures, ascend with each origin, reach Foundation before 30) | S | Medium |
| Difficulty modes and a daily seed challenge; hardcore mode with no fate | S | Medium |

## Content

| Improvement | Effort |
|---|---|
| Grow events from 35 to 60 or more, with two or three text variants each | M |
| More places (a sky city, a frozen sea, a demon border) and more creatures with the same one-element, one-weakness, one-trait rule | M |
| Technique active effects in duels (not just passive bonuses) | M |
| Optional Chinese UI text and glyph names, which suits the theme | M |

## Presentation and feel

| Improvement | Effort |
|---|---|
| Synthesised ambient sound and effects (WebAudio, no asset files) with a mute button | M |
| Short animated moments for breakthroughs and deaths using the art system | S |
| Accessibility: visible focus, larger text option, screen-reader labels, high-contrast theme | S |
| Mobile polish and installable offline app (service worker) | S |

## Technical

| Improvement | Effort |
|---|---|
| Save versioning with migrations (v4 to v5) plus export and import of the save as JSON | S |
| UI tests in the repo (Playwright) and a GitHub Actions workflow that runs `node tests.js` | S |
| Split `engine.js` into modules (data, combat, alchemy, save) once it passes about 1,000 lines | M |
| In-game telemetry log (local only) to feed balance decisions | S |

## Known risks

- The art system will need original drawings; your reference images guide style but are not shipped.
- Fonts load from Google Fonts and fall back to a serif offline.
- Browsers other than desktop Chromium and a 390px phone viewport have not been tested.


## v6 integration note

The procedural art, environmental field-guide notes, creature portraits, and danger-preview concepts originally explored in the separate VEILWILD project have been adapted for Worldbound's existing HTML/CSS/JavaScript architecture. See `docs/VEILWILD_REUSE_MAP.md`. The game remains dependency-free; the separate Godot project is not required.

Research is now spendable through Fieldcraft rather than being only a score. Future ideas in `docs/PRIORITIZED_ROADMAP_V6.md` are proposals and should not be described as current features.

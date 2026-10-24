# Worldbound — Recommended Next Improvements (v6 baseline)

The features below are **proposals**, not implemented unless a row explicitly says otherwise. Work one milestone at a time; preserve `engine.js` as the rules source and run both Node test commands after each change.

## P0 — Validate the new foundation

1. **Real browser pass:** open `index.html` at desktop and mobile widths. Test all ten tabs, one complete life, a duel, export, import, and import of an older v4/v5 save. Verify buttons don't clip and the ten-tab strip can be horizontally scrolled on mobile.
2. **Backup recovery drill:** export a save, move it outside the project folder, reset only browser storage in a test profile, then import the backup. Confirm the old file is not silently overwritten when an invalid file is selected.
3. **Human balance review:** run a few lives per Dao path before changing the numerical bonuses. Track first-realm timing, average realm at death, beast/faction unlock timing, and whether missions are worth their two-year cost.
4. **Economy pass:** measure stone and herb income from early, middle, and late lives. Avoid adding another currency until the value of research, faction reputation, stones, herbs, and fate is clear.

## P1 — Make each life tell a different story

1. **Fast-forward with standing orders:** let the player simulate 3/5/10 years using a selected policy (cautious, balanced, bold), but pause before lethal choices, duels, breakthrough attempts, and new faction decisions. Use the existing deterministic seed so the result is reproducible.
2. **Sect ranks and assignments:** outer disciple → inner disciple → core disciple → elder candidate, with short missions that use existing standing/realm values. Unlock a technique or place gate per rank rather than adding an arbitrary currency.
3. **Event memory flags:** record decisions such as helping an elder, sparing a creature, or aiding a merchant. Later events can reference those flags to create consequences across multiple years/lives. Store stable IDs in saves, not event title text.
4. **Breakthrough tribulation:** a short preparation decision using body, qi, root element, Dao path, fieldcraft, and an optional formation disciple. Keep it deterministic/testable and don't force a reflex-heavy mini-game on players who prefer text choices.
5. **Technique actions in duels:** give learned techniques one limited active effect (e.g., damage, ward, cleanse, escape) while respecting the current Strike/Guard/Technique matchup triangle. Provide clear cooldown/use limits and avoid replacing the existing loop.

## P2 — Deepen strategy

1. **Equipment and relics:** one weapon, one robe, one talisman. Each item should present a trade-off, not a universal straight upgrade. Use a short item list first, not hundreds of random stats.
2. **Beast bond story arcs:** affinity milestones at 50/70/90 trigger an optional event, cosmetic variant, or distinct role perk. High affinity should change play, not just a number.
3. **Discipline-specific events:** one event chain for each disciple role. Loyalty/morale should trigger meaningful support or a recoverable conflict, never a completely random irreversible loss without warning.
4. **Faction rivalries:** a limited reputation matrix for two opposing faction pairs. Help one side and another may offer less favorable missions, but don't lock essential content forever.
5. **Legacy challenges:** earn a named mark for reaching a realm under a condition, completing a creature journal, or ascending with each Dao. Keep achievements optional and cross-life.
6. **Region-specific ecology:** migratory species, time-sensitive clues, weather modifiers, and small location-to-location chains. Reuse the existing eight locations before building more.

## P3 — Presentation and quality of life

1. **SVG atlas and comparison view:** show a creature's portrait, known weakness, habitat notes, and defeated status on one focused details card.
2. **Audio:** use optional WebAudio cues for new discovery, breakthrough, danger, and death; include a mute toggle and volume control, and respect reduced motion/sensory preferences.
3. **Accessibility pass:** visible keyboard focus, larger-text control, screen-reader labels for SVG artwork, contrast check, no state conveyed only by color, and reduced animation.
4. **Offline mode:** add a service worker only after save/import/export is stable; version the cache so an old app shell cannot conflict with a newer save.
5. **Automated browser testing:** add a real-browser test runner only if the repository is ready to carry a dependency. Check a core journey and save/import flow; don't rely only on markup string checks.

## Do not implement yet

- Multiplayer / server accounts.
- Infinite procedural world generation.
- Huge crafting and equipment trees.
- More than a few currencies.
- Permanent random loss of valued subordinates or beasts without warning/choice.
- Large narrative cutscenes that interrupt the text-event flow.

## Acceptance gate for every major addition

- There is a clear user-facing reason for the system.
- It is wired into current actions rather than existing only as a UI panel or counter.
- Costs, rewards, caps, and failure states are shown before committing.
- Old saves load with defaults, and current saves survive the new fields.
- Tests cover at least one success, one invalid action, one edge case, and save/load.
- The handoff and README are updated; `VERIFIED`, `UNTESTED`, and `ASSUMED` claims are used accurately.

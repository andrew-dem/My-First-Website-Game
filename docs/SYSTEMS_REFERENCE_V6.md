# Worldbound v6 — Systems Reference

This is an implementation-facing checklist for contributors. The main source of truth remains `engine.js`; read the relevant function before changing a value. Costs or effects listed here should be updated with the code if they change.

## Dao paths

Unlocked at realm index 1 (Qi Condensation); one choice per life. Path mastery ranges from 1–5 and increases when the player activates the path ability. A past-life path legacy can grant a limited starting mastery echo.

| Path | Main identity | Combat/event active | Trade-off |
|---|---|---|---|
| Sword | direct combat | charges the next successful hit | reduced seclusion qi efficiency |
| Alchemy | resources/recovery | restores some qi/body in duel or yields stones in event | lower base duel power |
| Body | endurance | heals and reduces the next hit | lower base duel power; no breakthrough bonus |
| Formation | preparation/support | shield during duel or standing/stones during event | less effective without support |
| Shadow | evasion | avoids the next incoming blow or increases Luck in an event | lower base duel power |

An active ability is once per event or once per duel, not once forever. Event abilities refresh when the next event is drawn; a new duel resets the duel use.

## Disciples

- Recruit at the Sect; cap is 3 per life; starting recruitment cost is 25 stones, then +12 for each current disciple.
- Rank training increases level, loyalty, and morale. Training costs `ceil((12 + level * 5) * 0.85)` with Azure Cloud membership; otherwise the undiscounted amount.
- Qi cultivation costs 8 stones for Azure Cloud members or 10 otherwise. It adds qi and attempts a breakthrough once qi reaches 100.
- Assign one role at the Sect: Iron Guard, Pill Refiner, Pathfinder, Scripture Scholar, or Spirit Herbalist.
- Rank, cultivated realm, loyalty, and morale contribute to role weight; avoid making any single role exceed its current soft cap in the rule where it is used.

## Bonded beasts

- A species must have been defeated at least once in a prior/current life, then it can be bonded at Forest or Sect (or anywhere for Beast Wardens).
- Limit 2 active bonds per life. Bonding cost is species-specific; Wardens receive a 20% discount.
- Training requires one herb and `8 + 4 * current bond level` stones; levels cap at 5.
- Bond roles: Guardian, Scout, Forager, Combat Companion. Affinity at 70+ adds one role-weight point.
- Beasts, their level, and their affinity are per-life. Bestiary defeats persist in meta state.

## Factions

Only one oath per life. A faction's home location is the meeting point for joining and missions.

| Faction | Home | Gate | Primary benefit |
|---|---|---|---|
| Azure Cloud Sect | Sect | none beyond location | breakthrough support, discounted disciple training/cultivation |
| Beast Wardens | Forest | prior Spirit Beast victory | 20% lower beast-bond cost, can bond in any location |
| Mist Market Guild | Market | location | improved brewing and herb supply on successful missions |
| Ruin Scholars | Ruins | at least Qi Condensation and prior Ruin Guardian victory | additional research/mind during studies and missions |
| Tidebound Covenant | Coast | Core Formation and prior abyssal encounter | extra combat power against Kraken/Leviathan and mitigated qi drain |

Missions consume supplies and two years; success increases standing/reputation and gives a scale-based stone reward; failure causes harm and reputation loss. Mission failure never intentionally leaves Body negative without entering the death state.

## Field notes and Fieldcraft

- One main field study per location per life; the note is kept in `S.fieldNotes` and meta `M.fieldLore` marks it as learned across lives.
- Each study adds one research point, mind, qi, and some location-specific resources; Ruin Scholars improve study rewards.
- Fieldcraft purchases consume research and last for the current life only. The recorded lore persists between lives.

| Upgrade ID | Cost | Effect |
|---|---:|---|
| `trail` | 1 | +0.08 escape chance, bounded by the existing cap |
| `forager` | 2 | +1 additional herb for positive herb outcomes and qualifying field studies |
| `weakness` | 3 | +2 player duel power when element and foe weakness match |
| `warding` | 3 | 3 shield points at the start of each duel |

## Save format and backup

- Current serialized game version: **6**.
- Accepts supported versions 4, 5, and 6; missing new fields get safe defaults during load normalization.
- Browser autosave key: `worldbound-v6`.
- Manual Export creates a dated JSON download. Import validates before changing state; malformed save text must not replace the current state.
- Export a manual save before testing large balance changes or experimenting with a new build.

## Verification commands

```sh
node --check engine.js
node --check art.js
node --check ui.js
node tests.js
node tools/ui_smoke_test.js
```

The UI smoke test is intentionally dependency-free. It confirms script initialization and action routing, not actual browser geometry, focus order, screen-reader behavior, or color contrast. Those require a real browser/playtest.

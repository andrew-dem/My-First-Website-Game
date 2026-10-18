# Worldbound — Living World Simulator (Prototype v0.1)

A playable, browser-based prototype for a text-driven open-world life and kingdom simulator. It focuses on the deterministic time engine, autonomous standing orders, persistent events, missed opportunities, succession, and long time jumps.

## Run it

### Simplest method
1. Download and extract `worldbound_simulator.zip`.
2. Open the extracted folder.
3. Double-click `index.html` to open it in Chrome, Edge, or Firefox.

No installation, account, API key, or internet connection is required for the core prototype.

### Recommended local server
If you have Python installed, open a terminal in this folder and run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

You can also use VS Code with the Live Server extension.

## Play
- Choose +1, +5, +10, +25, +50, or +100 years, or enter a custom jump.
- Edit the standing orders and apply them before a jump.
- Try different autonomy and interruption policies.
- Watch the character, faction, economy, events, and history change.
- Use **Generate century report** to create a report from recorded events.
- Use **Save** and **Load** to persist the world in the current browser.

## Important limitations
This is a working game prototype, not the complete production game design:
- It uses a deterministic rules-based simulation with a seeded pseudo-random generator. It does not call an external AI model.
- The world is represented by a small number of aggregate systems. Individual citizens, full combat, detailed maps, diplomacy, inventory, and complex family trees are not implemented.
- Successor behavior is represented at faction level after the founder dies; it does not yet create a fully playable heir with a separate character sheet.
- The event feed is capped for display; the chronicle is stored in the save, but a very long simulation may create a large save.
- Browser saves are local to the browser profile and are not automatically synced between devices.
- The simulation's numbers and probabilities are illustrative and should be balanced through testing.

## Architecture
- `index.html`: user interface and dashboard layout.
- `styles.css`: responsive visual design.
- `game.js`: world state, time advancement, standing orders, simulation rules, event history, and local saving.

## Next development steps
1. Add unit tests for time boundaries, resource accounting, event ordering, and save recovery.
2. Split the simulation engine into modules and add schema validation/migrations.
3. Add individual NPCs, relationship memory, quests, dungeon expeditions, and faction diplomacy.
4. Add a backend database for cross-device persistent worlds.
5. Integrate an AI provider only for interpreting natural-language orders and narrating verified simulation results. Keep API secrets on the server; never put a private API key in browser JavaScript.

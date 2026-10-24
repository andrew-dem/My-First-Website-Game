# Worldbound — World Bible (v1)

Everything here matches the game as built (ids in `code font` exist in `engine.js`). Items marked **(proposed)** are lore for future content and are not in the game yet.

## 1. Premise and tone

You are born into a world where qi is borrowed time. Spend it well and a mortal can outlive empires; spend it badly and you are a cautionary tale told at a roadside inn. Every life ends, but **fate**, the residue of everything you endured, carries into the next one.

Pillars: (1) risk you can read, never certainty; (2) time is the real currency (age and lifespan); (3) the world is vast and indifferent, and it is beautiful anyway; (4) each life is short, so every choice should fit on one screen.

Voice for all text: second person, present tense, one or two concrete sentences, no modern idioms, no explaining the joke.

## 2. Cosmology

**Qi** is the light that moves through all living and dead things. Where it pools it hardens into **spirit stones**, the common currency. Cultivators draw qi into their meridians, a body that was never built to hold it, which is why every breakthrough hurts.

**The Wheel of Lives.** Heaven keeps a ledger, and when a cultivator dies the ledger records what they carried: standing, deeds, victories, the realm they reached. That sum is **fate**, and it is spent in the Fate shop between lives. Nobody remembers their past lives, but the ledger remembers you.

**Ascension.** Beyond Soul Transformation lies the final gate. Passing it ends the life with a win (`+20 fate`) and the world does not say where you went.

### The Five Elements (Wuxing)

Each spirit root carries one element. Each element has a colour, a guardian beast from old stories, and a small perk in the game.

| Element | Colour | Old guardian | Perk in game |
|---|---|---|---|
| Metal | pearl white, steel blue | White Tiger of the west | +2 duel power |
| Wood | emerald, jade | Azure Dragon of the east | +1 herb when gathering in the forest |
| Water | cyan, deep blue | Black Tortoise-serpent of the north | +1 Mind at birth |
| Fire | amber, vermilion | Vermilion Phoenix of the south | +10% alchemy success |
| Earth | gold, ochre | Golden Qilin of the centre | +2 max Body |

Creature weaknesses use the same elements: a cultivator whose root matches a creature's weakness deals +40% damage to it and stops its regeneration (`weak` in `FOES`). The Heart Flame Sutra counts as Fire for this.

## 3. The six realms

Lifespan is 60 years plus the realm bonus. You begin at 16 and need full qi (100) to attempt each breakthrough.

| Realm | Glyph | Lifespan bonus | What it means |
|---|---|---|---|
| Mortal | 凡 | +0 | An ordinary body that has heard the rumour of qi. |
| Qi Condensation | 气 | +30 | Qi gathers and can be felt. The ruins and wastes open to you. |
| Foundation | 基 | +80 | The meridians are rebuilt. Coast travel is possible. |
| Core Formation | 丹 | +170 | A golden core spins in the belly. Heaven's Peak answers. |
| Nascent Soul | 婴 | +350 | A second self forms. Few in any province reach this. |
| Soul Transformation | 神 | +700 | One step from leaving the world. |

## 4. Places

| id | Name | Gate | Feel | Lore |
|---|---|---|---|---|
| `village` | Mountain Village | none | warm, poor, safe | Terraced fields under a pagoda roof. Every life starts here. The elders still tell the story of the child who left and never came back. |
| `market` | Misty Market | 4 stones | lantern light, haggling | Built on a river-fog crossing where six roads meet. Herbs, rumours, and pickpockets in equal supply. |
| `sect` | Azure Cloud Sect | 6 stones | pale stone, floating pavilions | Teaches the six techniques for a price. Rules by Standing, not by sword. |
| `forest` | Whispering Forest | 3 stones | green gloom, glowing fungus | Rich in herbs and in things that eat the people who gather them. Home of the King Boar. |
| `ruins` | Sunken Ruins | Qi Condensation, 12 stones | gold dust, vines, dark halls | A kingdom that fell in a single night. Its guardians still obey. The pale giant dwells in the lower halls. |
| `peak` | Heaven's Peak | Core Formation, 40 stones | storm, thin air, purple lightning | Where heaven leans closest. Tribulation is not a metaphor here. A frost titan prowls the ridge. |
| `wastes` | Rotting Wastes | Qi Condensation, 8 stones | olive mist, sickly light | Old battlefields that were never buried properly. Spores bloom on the dead. The Archespore sleeps here. |
| `coast` | Abyssal Coast | Foundation, 20 stones | black water, bright pearls | The sea drops away a mile from shore. Pearl divers pay well and rarely return. The Kraken and the Ocean Leviathan hunt here. |

## 5. Factions

- **Azure Cloud Sect.** The only organised teacher of techniques. Entry-level errands raise Standing, and Standing unlocks harder techniques. Its elders test outer disciples with questions no scripture answers.
- **The Misty Market guilds.** Merchants who care about stones and nothing else. They buy herbs, sell herbs, and know every rumour first.
- **Imperial recruiters.** The mortal state. It pays for strong backs and does not care about spirit roots.
- **Road brotherhoods.** Bandits led by a chief. They fold when the chief falls.
- **The Hollow Hearts.** Cultivators who traded their hearts for speed. Black qi marks them. Demon cultivators in the game are their wandering members.
- **(proposed) The Ledger-keepers.** Silent figures who appear at deaths and weigh fate. They answer no questions.

## 6. The rival

Every life has one rival, a mirror cultivator who rises when you rise (+3 power on 75% of your breakthroughs). Names: Duan Hu, Gu Meng, Ren Yao, Xiao Lan, Mo Chen, Jiang Wu. Beat the same rival twice and a new one takes their place.

Lore: rivalry is the Wheel's way of keeping score. **(proposed)** A rival may turn out to be a former life of the player, visible only in the ledger.

## 7. Bestiary

Ten creatures, each with an element and quirks the player can learn. The art style for all of them is a **field-guide sheet**: parchment, ink sketch, labelled weak points, a small notes box.

| id | Name | Where | Element | Traits | Lore |
|---|---|---|---|---|---|
| `bandit` | Bandit chief | roads | none | none | A road tyrant with a red scarf and a notched blade. Cowardly once his men fall. |
| `beast` | Spirit beast | forest | none | none | A fox-tiger fed on spirit herbs. Its flame mane shows how much qi it has eaten. |
| `ghost` | Ruin guardian | ruins | none | none | A soldier bound to a vanished kingdom. It guards a vault long after the vault is empty. |
| `demon` | Demon cultivator | roads | none | none | A cultivator who traded his heart for power. Black qi wraps him like smoke. |
| `kingboar` | King Boar | forest | Earth | Charges; weak to Wood | Mutated boar the size of a cart, stone-hard hide, tusks that tear armour. Rooted ground slows its charge. |
| `archespore` | Archespore | wastes | Wood | Regenerates; weak to Fire | A fungal behemoth that does not chase. It waits where the land is forgotten. Cutting its mushrooms releases a cloud of decay. |
| `ursusumbra` | Ursusumbra | ruins | Earth | Armoured; weak to Water | A pale, bloated giant with bone plates fused to its skin and a jaw that opens a full half circle. Slow, but one blow breaks walls. |
| `behemoth` | Frost Behemoth | peak | Water | Armoured, charges; weak to Fire | A horned, armoured titan of the high snows. Technique pierces its plates; strikes glance off. |
| `kraken` | Kraken | coast | Water | Drains qi; weak to Earth | An abyssal hunter with a brain in every arm. Its grip crushes hulls and drains qi. |
| `leviathan` | Ocean Leviathan | coast | Water | Regenerates; weak to Earth | A titan of living water. Runes glow along its scales and the sea heals it. |

Rule of thumb for new creatures: one element, one weakness, one trait, one sentence of lore a traveller could plausibly have heard.

## 8. Techniques, pills and herbs

| Technique | Source | Idea |
|---|---|---|
| Breathing Art | sect, 30 stones | The first lesson every disciple learns. |
| Iron Fist | sect, 40 stones | Body as weapon. |
| Cloud Step | sect, Qi Condensation, Standing 2 | Footwork that makes escape easier. |
| Heart Flame Sutra | sect, Qi Condensation, Standing 3 | A fire-aligned scripture that sharpens alchemy. |
| Sword Intent | sect, Foundation, Standing 5 | Will made edge. |
| Dao Heart Scripture | sect, Core Formation, Standing 8 | The long scripture of quiet qi. |

Spirit herbs grow in the forest, the wastes, and cave walls, and sell at the market. Four pills can be brewed from them: **Qi Pill**, **Mending Pill**, **Breakthrough Pill**, **Longevity Pill**. Fire-root alchemists are the best brewers. Failed pills explode.

## 9. Origins and fate upgrades

- **Farmer's child:** hard hands and a steady heart.
- **Fallen noble:** a lost name and a hidden purse.
- **Street orphan:** nobody helped you, so you learned to be lucky.

Fate upgrades, as lore: *Fortune's Whisper* (the ledger tips the scale), *Tempered Bones* (the body remembers hardship), *Past-life Insight* (a half-heard lesson), *Ancestral Savings* (a line of ledger credit), *Reforged Root* (the ledger re-spins your thread), *Muscle Memory* (the first lesson never fully fades).

## 10. History (short)

1. **The Age of Rivers.** The first cultivators drank from the five rivers and learned the elements.
2. **The Night of the Sunken Kingdom.** A kingdom vanished in one night; the ruins keep its soldiers.
3. **The Rotting Wars.** Armies fought until the land refused to bury them. The wastes remember.
4. **The founding of the Azure Cloud Sect.** Scholars who wrote the techniques down so they would not die with their teachers.
5. **The coming of the deep ones.** The sea stopped being a boundary. Nobody has explained why.

## 11. Open mysteries (hooks for future content) **(proposed)**

1. Who keeps the Heaven's Ledger, and why does it keep score?
2. Why does fate persist when memory does not?
3. Is the rival the same person every life?
4. What waits beyond ascension?
5. Why does the Archespore appear only where the land has been forgotten?
6. What did the Sunken Kingdom do the night it vanished?

## 12. NPC archetypes for future events **(proposed, invented for this game)**

| Name | Role | Hook |
|---|---|---|
| Old Tan | silent herb-seller | Never speaks; his herbs are always the freshest. What does he know? |
| Madam Ruo | veiled apothecary | Sells pills too good to be honest. Wants a favour, not stones. |
| Elder Bo | village head | Keeps the village's one scripture and refuses to let it be read. |
| Kei the Blind | wandering seer | Predicts deaths, never his own. |
| Hu Zhang | butcher-cultivator | Strong, cheerful, and secretly a retired Hollow Heart. |
| Auntie Sima | matchmaker and gossip | Knows every rival's secret. |
| Wen Lu | ruin scholar | Obsessed with the Sunken Kingdom's last night. |
| Captain Mei | ship captain | Hires crews for the Abyssal Coast and is always short of crew. |

## 13. Art direction: "vibrant field-guide"

Reference direction (from the style sheets you supplied): painterly misty vistas, glowing element colours, parchment field-guide pages for creatures, and a clean character-sheet layout. The reference files are not reused in the game; all art will be original SVG/CSS.

| Element | Primary | Highlight |
|---|---|---|
| Metal | `#8fa8c4` | `#f4f7fb` |
| Wood | `#1c8f5c` | `#5ff0a8` |
| Water | `#1b6fd6` | `#55d0ff` |
| Fire | `#e3301f` | `#ffa24a` |
| Earth | `#b8742a` | `#ffd35e` |

Place palettes: village = sunrise orange and cream; market = night purple and lantern pink; sect = sky blue and white; forest = deep teal and glowing green; ruins = gold and sandstone; peak = storm violet and ember; wastes = olive and sickly lime; coast = ink blue and cyan.

Rules: one glowing accent per image; silhouettes first, detail second; parchment for text panels, dark misty backdrops for scenes; creature portraits on a soft element-coloured glow; motion only for mist, motes and flames, and always off under `prefers-reduced-motion`.

## 14. How to add content

1. **Event:** `E(id, title, text, minRealm, maxRealm, placeIdOrNull, options)`; each option is `[label, cost, outcomes]` and outcome probabilities must sum to 1 (a test enforces this).
2. **Creature:** add to `FOES` with `p`, `pr`, `hp`, `hr`, `loot`, `rep`, `lore`, optional `el`, `weak`, `regen`, `charge`, `armor`, `drain`, `tip`; then reference it from an event or place action with `{duel:"id"}`.
3. **Place:** add to `PLACES` with `min`, `cost`, `acts`.
4. Run `node tests.js` before and after.


## 15. Current v6 systems: Dao, retinue, beasts, factions and field research

This section records current systems introduced into the HTML/JavaScript game. Implemented behavior is in `engine.js`; costs and caps should be confirmed there before changing this text.

### The five Dao paths

- **Sword Dao:** favors direct combat and a charged next strike, at the cost of some seclusion efficiency.
- **Alchemy Dao:** turns encounter insight into resources and recovery, but has lower direct combat power.
- **Body Dao:** emphasizes resilience, healing and reducing a coming blow.
- **Formation Dao:** favors preparation, shields and coordinated support.
- **Shadow Dao:** prizes evasion, risk management and reading an encounter before it turns hostile.

A Dao choice is made at Qi Condensation and lasts for the current life. Repeated active use builds mastery; past lives on the same path can grant a limited mastery echo. The intended fantasy is commitment to a style, not a single best answer for every event.

### The sect retinue

The player can recruit up to three disciples at the Azure Cloud Sect. Their roles are Iron Guard, Pill Refiner, Pathfinder, Scripture Scholar and Spirit Herbalist. Rank training and qi cultivation are separate: rank raises the consistency of a role, while realm progression and relationship state improve its effectiveness. Loyalty and morale are meant to become narrative hooks for future missions rather than random punishment.

### Spirit-beast bonds

A creature becomes bondable after the player has defeated it at least once. A bonded spirit beast can be trained and assigned a Guardian, Scout, Forager or Combat Companion role. Bonds are per-life, while bestiary knowledge persists. The design intent is to give different creatures practical utility without making every species a direct damage pet.

### Faction oaths

| Faction | Home | Identity |
|---|---|---|
| Azure Cloud Sect | Sect | orthodox teaching and coordinated breakthrough preparation |
| Beast Wardens | Forest | tracking, protection and cheaper beast bonds |
| Mist Market Guild | Market | commerce, herb supply and alchemical knowledge |
| Ruin Scholars | Ruins | field research, forgotten formations and archive work |
| Tidebound Covenant | Coast | abyssal research and defense against sea titans |

Only one oath can be taken in a life. Joining, access, and mission rewards are deliberately tied to location, realm and discovery.

### Field notes and research methods

Each of the eight regions has a principal field note. Studying it awards research and preserves the lore in the cross-life archive. The player may spend research in the current life on one or more methods: Trail-Sense Method (+8 percentage points to escape odds), Forager's Atlas (+1 herb from qualifying sources), Weakness Codex (+2 combat power when the player's element matches a foe's weakness), and Warding Sigils (a three-point shield at duel start). These are functional mechanics, not just journal text.

### Art integration

`art.js` creates original SVG scene backdrops for the existing places, root-element hero stamps, and portraits for known foes. This adapts the creature-field-guide and region-art ideas from the separate VEILWILD prototype without replacing the current game engine. SVG fallback artwork keeps the project self-contained. Future final art should use original/appropriately licensed assets and retain source records.

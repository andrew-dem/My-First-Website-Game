(() => {
  "use strict";

  const SAVE_KEY = "worldbound-save-v2";
  const MONTHS_PER_YEAR = 12;
  const MAX_JUMP_YEARS = 500;

  const $ = (id) => document.getElementById(id);
  let dirty = false;
  let state = createWorld();
  initFounder();
  let activeFilter = "all";
  let simulating = false;
  let stopRequested = false;

  function createWorld() {
    return {
      version: 2,
      time: { year: 1, month: 1 },
      character: null, people: [],
      dynasty: { house: "Vale", rulerId: null, heirId: null, extinct: false },
      control: "player", // "player" | "observer" | "ended"
      faction: {
        name: "Vale Settlement", tier: "Settlement", population: 286,
        treasury: 2400, food: 1100, stability: 72, military: 18,
        territory: 1, incomePerMonth: 95, foodProduction: 45,
        foodConsumption: 39, upkeepPerMonth: 65, leader: "Aren Vale",
        legacy: "Founder-led", corruption: 8, prosperity: 35, militaryBonus: 0
      },
      world: {
        status: "Stable", threat: 12, rivalPower: 20, trade: 1,
        activeWar: false, famine: false, dynastyStrength: 20, harvest: 1, droughtYears: 0
      },
      orders: {
        primaryGoal: "power", reserve: true, avoidWar: true,
        opportunities: true, risk: "balanced", autonomy: "planned",
        interruptions: "none"
      },
      events: [],
      pending: [],
      chronicle: [],
      counters: { events: 0, decisions: 0, actions: 0, people: 0, compacted: 0 },
      cooldowns: {}, ended: false,
      lastJump: null,
      rngSeed: 927431
    };
  }

  // Seeded PRNG: outcomes are repeatable for the same saved state and event sequence.
  function random() {
    state.rngSeed = (state.rngSeed * 1664525 + 1013904223) >>> 0;
    return state.rngSeed / 4294967296;
  }
  function randInt(min, max) { return Math.floor(random() * (max - min + 1)) + min; }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function nowLabel() { return `Year ${state.time.year}, Month ${state.time.month}`; }
  function addMonths(months) {
    const total = (state.time.year - 1) * MONTHS_PER_YEAR + (state.time.month - 1) + months;
    state.time.year = Math.floor(total / MONTHS_PER_YEAR) + 1;
    state.time.month = total % MONTHS_PER_YEAR + 1;
  }
  function currentMonthIndex() { return (state.time.year - 1) * 12 + (state.time.month - 1); }
  function recordEvent(type, title, description, options = {}) {
    if (options.cooldown) { // skip repeats of the same record inside the cooldown window (months)
      const key = options.key || title, now = currentMonthIndex(), last = state.cooldowns[key];
      if (last !== undefined && now - last < options.cooldown) return null;
      state.cooldowns[key] = now;
    }
    const event = {
      id: ++state.counters.events,
      year: state.time.year, month: state.time.month,
      type, title, description, importance: options.importance || "normal",
      resolved: true
    };
    state.events.unshift(event);
    state.chronicle.push({ ...event });
    if (state.events.length > 250) state.events.length = 250;
    if (state.chronicle.length > 1500) { // keep saves small: drop the oldest routine entries, never major/critical ones
      let excess = state.chronicle.length - 1200;
      state.chronicle = state.chronicle.filter(e => (excess > 0 && e.importance === "normal") ? (excess--, state.counters.compacted++, false) : true);
    }
    return event;
  }
  function money(n) { return Math.round(n).toLocaleString("en-US") + " G"; }

  // ---------- People, mortality and succession ----------
  // Every person (founder, heirs, successors, rivals, exiles) lives in state.people and
  // follows the SAME rules: a lifespan rolled at birth plus an age-based yearly hazard.
  const GIVEN = ["Mira","Toren","Selene","Doran","Isolde","Garrick","Lysa","Bram","Edda","Corin","Nessa","Alric","Tamsin","Orin","Wren","Petra","Joss","Maren","Varro"];
  const HOUSES = ["Ashdown","Corvane","Hale","Marrow","Thorne","Wexley","Brandt","Ilvar"];
  function rollLifespan() {
    const z = (random() + random() + random() + random() - 2) / 0.5774; // ~normal, sd 1
    return clamp(Math.round(72 + z * 9), 40, 100);
  }
  function deathHazard(age) { return age < 5 ? 0.004 : age < 50 ? 0.0015 : 0.004 + (age - 50) * 0.0006; }
  function personById(id) { return state.people.find(x => x.id === id) || null; }
  function newPerson(o = {}) {
    const { given, ...rest } = o;
    const house = rest.house || state.dynasty.house;
    const first = given || GIVEN[randInt(0, GIVEN.length - 1)];
    const person = Object.assign({
      id: "p" + (++state.counters.people), name: `${first} ${house}`, house,
      age: 0, alive: true, lifespan: rollLifespan(), born: state.time.year, died: null, fate: null,
      generation: 1, reigned: false, role: "relative",
      power: 5, influence: 0, wealth: 0, ambitionProgress: 0,
      traits: { ambition: randInt(30, 90), caution: randInt(30, 90), loyalty: randInt(30, 90) },
      currentActivity: "Preparing plans", nextDecisionMonth: 2
    }, rest);
    state.people.push(person);
    return person;
  }
  function initFounder() {
    const p = newPerson({ given: "Aren", house: "Vale", age: 20, role: "ruler", reigned: true, power: 12, influence: 8, wealth: 850, ambitionProgress: 8, traits: { ambition: 85, caution: 55, loyalty: 65 } });
    state.dynasty.rulerId = p.id;
    state.character = p;
  }
  function agePeople() {
    const dead = [];
    for (const p of state.people) {
      if (!p.alive) continue; // the dead never age, act, or die twice
      p.age += 1;
      if (p.age >= p.lifespan || random() < deathHazard(p.age)) {
        p.alive = false; p.died = state.time.year; p.fate = `Died at age ${p.age}`;
        dead.push(p);
      }
    }
    return dead;
  }
  function maybeBirthHeir() {
    const d = state.dynasty, c = state.character;
    if (state.control !== "player" || !c.alive || d.heirId || c.age < 20 || c.age > 50) return;
    if (random() < (state.orders.primaryGoal === "legacy" ? 0.5 : 0.3)) {
      const h = newPerson({ role: "heir", house: d.house, generation: c.generation + 1 });
      d.heirId = h.id;
      recordEvent("character", "An heir is born", `${h.name} was born to ${c.name} and is first in line to the succession.`, {});
    }
  }
  function rulerDied(dead) {
    const f = state.faction, d = state.dynasty;
    f.stability = clamp(f.stability - 8, 0, 100);
    const heir = d.heirId ? personById(d.heirId) : null;
    let successor = null, text = "";
    if (heir && heir.alive) {
      const regency = heir.age < 16;
      const dispute = random() < clamp((60 - f.stability) / 200 + (regency ? 0.1 : 0), 0.02, 0.4);
      if (dispute) {
        f.stability = clamp(f.stability - 10, 0, 100);
        if (random() < 0.4) {
          heir.role = "exiled";
          successor = newPerson({ role: "ruler", house: HOUSES[randInt(0, HOUSES.length - 1)], age: randInt(25, 50) });
          d.house = successor.house;
          text = `A rival, ${successor.name}, seized power in the succession dispute and ${heir.name} was set aside. House ${d.house} now rules.`;
        } else text = `${heir.name} won a contested succession${regency ? " as a child under a regency" : ""}, at a cost to stability.`;
      } else text = `${heir.name} inherited leadership${regency ? " as a child, with a council governing in their name" : ""}.`;
      successor = successor || heir;
    } else if (f.stability >= 45 && random() < 0.6) {
      successor = newPerson({ role: "ruler", house: d.house, age: randInt(20, 50), generation: dead.generation + 1 });
      f.stability = clamp(f.stability - 10, 0, 100);
      text = `${dead.name} left no living heir. A distant relative, ${successor.name}, claimed the throne.`;
    }
    if (!successor) {
      d.extinct = true; d.heirId = null; state.control = "observer";
      f.leader = "Regency Council"; f.legacy = "Dynasty extinct; council rule"; f.dynastyStrength = 0;
      recordEvent("character", `${dead.name} dies; House ${d.house} ends`, `${dead.name} died at age ${dead.age} with no living heir and no claimant able to hold the throne. The dynasty is extinct, but ${f.name} continues under a council. You are now observing.`, { importance: "critical" });
      if (state.orders.interruptions === "critical") state._pauseRequested = "Dynasty extinct";
      return;
    }
    successor.role = "ruler"; successor.reigned = true;
    if (successor.generation <= dead.generation && successor.house === dead.house) successor.generation = dead.generation + 1;
    successor.wealth = Math.round(dead.wealth * 0.6) + 300;
    successor.power = Math.max(5, Math.round(dead.power * 0.4));
    successor.influence = Math.round(dead.influence * 0.5);
    successor.ambitionProgress = 5;
    d.rulerId = successor.id; d.heirId = null; d.extinct = false;
    state.character = successor; state.control = "player";
    f.leader = successor.name; f.legacy = "Successor-led";
    recordEvent("character", `${dead.name} dies; ${successor.name} takes power`, `${dead.name} died at age ${dead.age}. ${text}`, { importance: "critical" });
    if (state.orders.interruptions === "critical") state._pauseRequested = `Succession: ${dead.name} to ${successor.name}`;
  }

  function applyOrdersFromUI() {
    state.orders.primaryGoal = $("primaryGoal").value;
    state.orders.reserve = $("reserveToggle").checked;
    state.orders.avoidWar = $("warToggle").checked;
    state.orders.opportunities = $("opportunityToggle").checked;
    state.orders.risk = $("riskTolerance").value;
    state.orders.autonomy = $("autonomyMode").value;
    state.orders.interruptions = $("interruptMode").value;
    $("ordersStatus").textContent = "Standing orders applied to future decisions.";
    const labels = { power: "Build power and influence", wealth: "Build sustainable wealth", influence: "Expand political influence", legacy: "Establish a lasting dynasty" };
    $("planTitle").textContent = labels[state.orders.primaryGoal];
    render();
  }

  function goalLabel() {
    return ({
      power: "Build power and influence",
      wealth: "Build sustainable wealth",
      influence: "Expand political influence",
      legacy: "Establish a lasting dynasty"
    })[state.orders.primaryGoal] || "Pursue ambition";
  }

  function updateCharacterPlan() {
    if (!state.character.alive) {
      state.character.currentActivity = "Legacy continues through successors";
      state.faction.legacy = "Successor-led";
      return;
    }
    const goal = state.orders.primaryGoal;
    if (goal === "power") state.character.currentActivity = "Training and seeking rare techniques";
    else if (goal === "wealth") state.character.currentActivity = "Building trade and income";
    else if (goal === "influence") state.character.currentActivity = "Negotiating alliances and authority";
    else state.character.currentActivity = "Preparing succession and institutions";
  }

  function simulateRoutineMonth() {
    const f = state.faction;
    const c = state.character;
    // All values below are simulation rules; no AI or narrative text can mutate them directly.
    f.treasury += f.incomePerMonth - f.upkeepPerMonth;
    f.food += f.foodProduction - f.foodConsumption;
    f.food = Math.min(f.food, f.foodConsumption * 18); // granaries spoil: stocks are capped at ~18 months
    if (f.food < 0) {
      const shortage = Math.min(10, Math.ceil(Math.abs(f.food) / 10));
      f.food = 0;
      f.stability = clamp(f.stability - shortage * 0.7, 0, 100);
      f.population = Math.max(0, f.population - shortage);
      if (!state.world.famine) recordEvent("world", "Famine", `Granaries ran empty in ${f.name}. Hunger is spreading and unrest is rising.`, { importance: "critical" });
      state.world.famine = true;
    } else if (f.food > 250 && state.world.famine) {
      state.world.famine = false;
      f.stability = clamp(f.stability + 4, 0, 100);
      recordEvent("world", "The famine ends", `Food stores recovered in ${f.name} and order slowly returned.`, {});
    }
    if (f.treasury < 0) {
      f.stability = clamp(f.stability - 0.8, 0, 100);
      f.corruption = clamp(f.corruption + 0.08, 0, 100);
    }
    if (f.food > f.foodConsumption * 6 && f.treasury > 1000 && f.stability > 55 && f.population < f.territory * 450 && random() < 0.22) {
      f.population += randInt(0, 2);
    }
    if (f.stability > 70 && f.treasury > 1500 && random() < 0.05) f.prosperity = clamp(f.prosperity + 1, 0, 100);
    if (c.alive) {
      c.wealth += Math.max(0, f.incomePerMonth - f.upkeepPerMonth) * 0.08;
    }
    f.stability = clamp(f.stability, 0, 100);
    if (f.population > f.territory * 450 * 1.3) { // lost land cannot feed everyone: people leave
      f.population = Math.max(1, f.population - Math.ceil(f.population * 0.01));
      recordEvent("world", "Emigration", `People are leaving ${f.name} as the remaining land cannot support its population.`, { cooldown: 120 });
    }
    f.treasury = Math.round(f.treasury * 100) / 100;
    f.food = Math.round(f.food * 100) / 100;
  }

  function evaluateAgentDecision() {
    state.counters.decisions++;
    const c = state.character, f = state.faction, w = state.world, o = state.orders;
    if (!c.alive) return;
    const riskBonus = o.risk === "bold" ? 0.12 : o.risk === "cautious" ? -0.1 : 0;
    const reserveSafe = !o.reserve || (f.treasury > 1000 && f.food > 250);
    const opportunityChance = clamp(0.20 + c.power / 250 + riskBonus, 0.05, 0.65);

    // Immediate needs outrank ambition.
    if (f.food < 160 || f.treasury < 100) {
      f.incomePerMonth += 4;
      f.foodProduction += 3;
      c.currentActivity = "Stabilizing food and finances";
      recordEvent("faction", "Emergency management", `${c.name} redirected effort toward food production and essential income.`, { importance: "major", cooldown: 24 });
      return;
    }

    if (o.primaryGoal === "power") {
      c.power += randInt(1, 3);
      c.ambitionProgress += randInt(2, 5);
      c.wealth = Math.max(0, c.wealth - (o.risk === "bold" ? 35 : 20));
      if (random() < opportunityChance && o.opportunities) {
        c.power += randInt(2, 5);
        recordEvent("character", "A rare technique discovered", `${c.name} found a technique that accelerated personal development.`, { importance: "major", cooldown: 120 });
      } else {
        recordEvent("character", "Years of disciplined training", `${c.name} focused on training and improved their power.`, { cooldown: 60 });
      }
    } else if (o.primaryGoal === "wealth") {
      f.incomePerMonth += randInt(2, 6);
      c.wealth += randInt(80, 180);
      c.ambitionProgress += randInt(1, 3);
      if (o.opportunities && random() < opportunityChance) {
        f.trade += 1; f.incomePerMonth += 5;
        recordEvent("faction", "A profitable trade agreement", `A trade arrangement increased the faction's long-term income.`, { importance: "major", cooldown: 90 });
      } else {
        recordEvent("character", "Investment in commerce", `${c.name} expanded income-producing ventures.`, { cooldown: 60 });
      }
    } else if (o.primaryGoal === "influence") {
      c.influence += randInt(1, 3);
      f.stability = clamp(f.stability + randInt(-2, 3), 0, 100);
      c.ambitionProgress += randInt(2, 4);
      if (o.opportunities && random() < opportunityChance) {
        w.rivalPower = Math.max(5, w.rivalPower - randInt(1, 4));
        recordEvent("world", "A diplomatic opening", `${c.name} secured a useful political connection and improved regional standing.`, { importance: "major", cooldown: 90 });
      } else recordEvent("character", "Political influence grows", `${c.name} negotiated with local leaders and expanded their network.`, { cooldown: 60 });
    } else {
      f.dynastyStrength = clamp(f.dynastyStrength + randInt(1, 4), 0, 100);
      c.ambitionProgress += randInt(2, 4);
      f.stability = clamp(f.stability + 1, 0, 100);
      if (random() < 0.45) {
        f.legacy = "Institutions developing";
        recordEvent("faction", "Institutions established", `${c.name} improved succession procedures and strengthened local administration.`, { importance: "major", cooldown: 120 });
      } else recordEvent("character", "Planning for a lasting legacy", `${c.name} invested in institutions and long-term continuity.`, { cooldown: 60 });
    }

    // Expansion depends on capacity, reserves, stability, and military conditions.
    if (reserveSafe && f.stability > 50 && f.treasury > 1800 + 400 * f.territory && random() < 0.28 / (1 + 0.3 * f.territory)) {
      f.territory += 1;
      f.population += randInt(20, 75);
      f.treasury -= 300 + 150 * f.territory;
      f.incomePerMonth += 12;
      f.upkeepPerMonth += 8;
      f.tier = f.territory >= 5 ? "City-State" : f.territory >= 3 ? "Town" : "Settlement";
      f.prosperity = clamp(f.prosperity + 3, 0, 100);
      recordEvent("faction", "Territorial expansion", `${f.name} gained a new area and expanded its economic base.`, { importance: "major" });
    }

    // Rival pressure can become a war; standing orders affect risk but do not remove it.
    const warChance = clamp(0.025 + w.rivalPower / 1200 + (100 - f.stability) / 1200, 0.01, 0.16);
    if (!w.activeWar && random() < warChance) {
      if (o.avoidWar && w.rivalPower > f.military * 1.3) {
        f.treasury = Math.max(0, f.treasury - 120);
        w.threat = clamp(w.threat + 8, 0, 100);
        recordEvent("world", "A dangerous border crisis", `A stronger rival applied pressure. ${c.name} paid for defenses and diplomacy instead of initiating a reckless war.`, { importance: "major" });
      } else {
        w.activeWar = true;
        recordEvent("world", "A border war begins", `A conflict erupted near ${f.name}. The autonomous leadership must manage supplies, defense, and diplomacy.`, { importance: "critical" });
      }
    }
    c.ambitionProgress = clamp(c.ambitionProgress, 0, 100);
    c.power = Math.max(1, c.power);
    c.influence = Math.max(0, c.influence);
  }

  function resolveWorldEvents() {
    const f = state.faction, c = state.character, w = state.world;
    // Called once per year-end (from processMonth). The old month-12 guard made this unreachable.
    if (w.activeWar) {
      const strength = f.military + randInt(-5, 8) + (f.food > 100 ? 4 : -5);
      const rival = w.rivalPower + randInt(-5, 8);
      if (strength >= rival) {
        w.activeWar = false;
        w.rivalPower = Math.max(5, w.rivalPower - randInt(2, 6));
        f.stability = clamp(f.stability + 4, 0, 100);
        f.treasury = Math.max(0, f.treasury - 400);
        recordEvent("world", "The border war ends in a defense victory", `${f.name} held its ground, but the campaign consumed treasury and supplies.`, { importance: "major" });
      } else {
        w.activeWar = false;
        f.territory = Math.max(1, f.territory - 1);
        f.stability = clamp(f.stability - 12, 0, 100);
        f.treasury = Math.max(0, f.treasury - 250);
        f.militaryBonus -= 3;
        recordEvent("world", "The border war ends in defeat", `${f.name} lost territory and influence after an unsuccessful defense.`, { importance: "critical" });
      }
    }
    if (random() < 0.07) {
      const event = randInt(1, 4);
      if (event === 1) {
        f.foodProduction += 2;
        recordEvent("world", "Agricultural improvement", "Better farming methods increased annual food production.", {});
      } else if (event === 2) {
        w.rivalPower += randInt(2, 6);
        recordEvent("world", "A rival power grows", "A neighboring faction expanded its influence beyond your borders.", { importance: "major" });
      } else if (event === 3) {
        f.stability = clamp(f.stability - 5, 0, 100);
        recordEvent("faction", "Public dissatisfaction", "Unequal benefits and local grievances reduced stability.", {});
      } else {
        f.militaryBonus += 2;
        recordEvent("faction", "Military reforms", "Training and organization improved defensive capability.", {});
      }
    }
    // Weather: droughts last several years and have a long cooldown, so famine can emerge from them.
    if (w.droughtYears > 0) {
      w.droughtYears--; w.harvest = 0.5;
      if (w.droughtYears === 0) { w.harvest = 1; recordEvent("world", "The drought ends", "Rains returned and harvests recovered.", {}); }
    } else {
      w.harvest = 1;
      if (random() < 0.06 && !(state.cooldowns.drought > currentMonthIndex() - 600)) {
        state.cooldowns.drought = currentMonthIndex();
        w.droughtYears = randInt(2, 4); w.harvest = 0.5;
        recordEvent("world", "Drought", "Failing rains cut harvests across the region. Food stores will be tested.", { importance: "major" });
      }
    }
    // Annual rescale: costs and output follow population, so growth creates real pressure.
    if (f.population > 0) {
      f.foodConsumption = Math.max(25, Math.round(f.population * 0.14));
      f.foodProduction = Math.max(10, Math.round(f.population * 0.17 * w.harvest));
      f.upkeepPerMonth = Math.max(40, Math.round(f.population * 0.22));
      f.incomePerMonth = Math.max(55, Math.round(20 + f.population * 0.16 + f.prosperity * 0.6 + f.territory * 10 - f.corruption * 0.2)); // income scales with people, like upkeep
      f.military = Math.max(5, Math.round(f.population * 0.06 + f.territory * 2) + f.militaryBonus);
    }
    if (f.treasury < 0) { // debt forces austerity: spending is cut and taxes rise, at a cost to stability
      f.upkeepPerMonth = Math.round(f.upkeepPerMonth * 0.85); f.incomePerMonth = Math.round(f.incomePerMonth * 1.05);
      f.stability = clamp(f.stability - 3, 0, 100);
      recordEvent("faction", "Austerity measures", `With the treasury in debt, ${f.name} cut spending and raised taxes. The public is unhappy.`, { importance: "major", cooldown: 60 });
    }
    w.rivalPower = clamp(w.rivalPower + randInt(-1, 2), 5, 150);
    if (f.territory > 6) f.stability = clamp(f.stability - (f.territory - 6) * 0.8, 0, 100); // overextension
  }

  function ageAndLifeEvents() {
    const d = state.dynasty;
    const dead = agePeople();
    dead.sort((a, b) => (a.id === d.rulerId) - (b.id === d.rulerId)); // heirs first, ruler last
    for (const p of dead) {
      if (p.id === d.rulerId) rulerDied(p);
      else if (p.id === d.heirId) {
        d.heirId = null;
        recordEvent("character", "The heir dies", `${p.name}, heir to the throne, died at age ${p.age}.`, { importance: "major" });
      }
    }
    maybeBirthHeir();
  }

  function evaluateYearlyDecision() {
    if (state.control === "observer") {
      // The dynasty is extinct; a council keeps the faction running at faction level.
      const f = state.faction;
      if (f.stability > 40 && f.treasury > 1800 + 400 * f.territory && random() < 0.2 / (1 + 0.3 * f.territory)) {
        f.territory += 1;
        f.population += randInt(15, 55);
        f.incomePerMonth += 6;
        f.upkeepPerMonth += 5;
        f.tier = f.territory >= 5 ? "City-State" : f.territory >= 3 ? "Town" : "Settlement";
        recordEvent("faction", "Council-led expansion", `The council expanded ${f.name}'s influence and economic base.`, { importance: "major" });
      }
      return;
    }
    if (state.character.age < 16) { state.character.currentActivity = "Growing up under a regency"; return; }
    evaluateAgentDecision();
  }

  function processMonth() {
    if (state.ended) return;
    dirty = true;
    simulateRoutineMonth();
    addMonths(1);
    if (state.time.month === 1) {
      ageAndLifeEvents();
      evaluateYearlyDecision();
      resolveWorldEvents();
    } else if (state.time.month === 6) {
      // Midyear decision checkpoint, separate from the annual strategic decision.
      if (state.character.alive && state.orders.autonomy !== "planned" && random() < 0.45) {
        state.character.influence += 1;
        recordEvent("character", "An independent choice", `${state.character.name} pursued a personal opportunity consistent with their ambitions.`, {});
      }
    }
    if (state.faction.population <= 0 && !state.ended) { // processed exactly once; the run ends here
      state.faction.population = 0;
      state.ended = true; state.control = "ended";
      recordEvent("faction", "The settlement collapses", "The population has fallen to zero. The faction no longer functions as an inhabited settlement.", { importance: "critical" });
    }
    if (state.faction.territory === 1 && state.faction.stability < 15 && random() < 0.03 && !(state.cooldowns.uprising > currentMonthIndex() - 60)) {
      state.cooldowns.uprising = currentMonthIndex();
      const lost = Math.round(state.faction.population * 0.05);
      state.faction.population = Math.max(1, state.faction.population - lost);
      state.faction.stability = clamp(state.faction.stability + 15, 0, 100);
      recordEvent("faction", "An uprising shakes the realm", `Years of unrest erupted into open revolt. Order was restored only after about ${lost} people were lost.`, { importance: "major" });
    }
    if (state.faction.territory > 1 && state.faction.stability < 15 && random() < 0.08 && !(state.cooldowns.breakaway > currentMonthIndex() - 36)) {
      state.cooldowns.breakaway = currentMonthIndex();
      state.faction.territory = Math.max(1, state.faction.territory - 1);
      state.faction.stability = clamp(state.faction.stability + 4, 0, 100);
      recordEvent("faction", "A region breaks away", "Low stability caused a region to become independent or fall outside the faction's control.", { importance: "major" });
    }
    updateWorldStatus();
  }

  function updateWorldStatus() {
    const w = state.world, f = state.faction;
    w.status = state.ended ? "Collapsed" : w.activeWar ? "At war" : w.famine ? "Famine" : f.stability < 35 ? "Unrest" : "Stable";
  }

  function advanceYears(years) {
    if (simulating) return;
    const n = Math.floor(Number(years));
    if (!Number.isFinite(n) || n < 1 || n > MAX_JUMP_YEARS) {
      $("simulationStatus").textContent = `Choose a whole number from 1 to ${MAX_JUMP_YEARS} years.`;
      return;
    }
    if (state.ended) { $("simulationStatus").textContent = "This world has ended. Start a new world."; return; }
    applyOrdersFromUI();
    simulating = true; stopRequested = false;
    let pausedReason = null;
    $("cancelJumpBtn").classList.remove("hidden");
    const startYear = state.time.year;
    const targetMonthIndex = currentMonthIndex() + n * MONTHS_PER_YEAR;
    let steps = 0;
    $("simulationStatus").textContent = `Simulating ${n} year${n === 1 ? "" : "s"}...`;
    // Chunk work so the interface remains responsive for long jumps.
    function runChunk() {
      const chunkLimit = 240;
      let count = 0;
      while (currentMonthIndex() < targetMonthIndex && count < chunkLimit && !stopRequested && !state.ended) {
        processMonth();
        count++; steps++;
        if (state._pauseRequested) {
          const reason = state._pauseRequested;
          state._pauseRequested = null;
          if (state.orders.interruptions === "critical") {
            pausedReason = reason;
            stopRequested = true;
            break;
          }
        }
      }
      render();
      if (currentMonthIndex() < targetMonthIndex && !stopRequested && !state.ended) {
        $("simulationStatus").textContent = `Simulating... ${Math.floor((currentMonthIndex() - ((startYear - 1) * 12)) / (n * 12) * 100)}%`;
        setTimeout(runChunk, 0);
      } else {
        simulating = false;
        $("cancelJumpBtn").classList.add("hidden");
        const completedYears = Math.floor((state.time.year - startYear) + (state.time.month - 1) / 12);
        state.lastJump = { startYear, endYear: state.time.year, requestedYears: n, steps, completedAt: nowLabel() };
        if (state.ended) {
          $("simulationStatus").textContent = `The run ended at ${nowLabel()}: the settlement collapsed.`;
        } else if (pausedReason) {
          $("simulationStatus").textContent = `Paused at ${nowLabel()}: ${pausedReason}. Start another jump to resume.`;
        } else if (stopRequested) {
          $("simulationStatus").textContent = `Stopped or paused at ${nowLabel()}. ${steps} monthly steps processed.`;
        } else {
          $("simulationStatus").textContent = `Jump resolved at ${nowLabel()}. ${steps} monthly steps processed.`;
        }
        render();
        saveGame(false);
      }
    }
    setTimeout(runChunk, 0);
  }

  function render() {
    const c = state.character, f = state.faction, w = state.world;
    $("yearValue").textContent = `Year ${state.time.year}, Month ${state.time.month}`;
    $("characterName").textContent = state.control === "observer" ? "No ruler — observing" : c.name;
    $("factionName").textContent = f.name;
    $("worldStatus").textContent = w.status;
    $("characterTitle").textContent = state.control === "observer" ? `${c.name} (last ruler)` : c.name;
    $("characterState").textContent = state.control === "observer" ? "Observer mode" : state.control === "ended" ? "Run ended" : "Alive";
    $("characterState").className = state.control === "player" ? "pill pill-green" : "pill";
    $("characterSubtitle").textContent = `House ${c.house} · Generation ${c.generation}${c.alive ? "" : " · " + (c.fate || "deceased")}`;
    $("ageValue").textContent = c.alive ? c.age : `${c.age} at death`;
    $("powerValue").textContent = c.power;
    $("wealthValue").textContent = money(c.wealth);
    $("influenceValue").textContent = c.influence;
    $("ambitionPercent").textContent = `${Math.round(clamp(c.ambitionProgress, 0, 100))}%`;
    $("ambitionBar").style.width = `${clamp(c.ambitionProgress, 0, 100)}%`;
    $("lifeNote").textContent = lifeNoteText();
    $("settlementTitle").textContent = f.name;
    $("factionTier").textContent = f.tier;
    $("populationValue").textContent = Math.round(f.population).toLocaleString();
    $("treasuryValue").textContent = money(f.treasury);
    $("foodValue").textContent = Math.round(f.food).toLocaleString();
    $("stabilityValue").textContent = `${Math.round(f.stability)}/100`;
    $("militaryValue").textContent = Math.round(f.military);
    $("territoryValue").textContent = `${f.territory} region${f.territory === 1 ? "" : "s"}`;
    $("policyLabel").textContent = state.orders.primaryGoal[0].toUpperCase() + state.orders.primaryGoal.slice(1);
    $("planTitle").textContent = goalLabel();
    $("planDescription").textContent = c.alive ? `Follow the ${state.orders.primaryGoal} objective, preserve configured reserves, and adapt when major events change the opportunity or risk.` : `No ruler remains. A council manages the faction under faction-level rules.`;
    $("currentActivity").textContent = c.currentActivity;
    $("nextDecision").textContent = c.alive ? "Within 1 year" : "Council decisions ongoing";
    $("legacyStatus").textContent = f.legacy;
    $("eventCount").textContent = `${state.chronicle.length} events`;
    renderEvents();
  }

  function lifeNoteText() {
    const c = state.character, d = state.dynasty;
    if (state.control === "ended") return "The run has ended.";
    if (state.control === "observer") return `House ${d.house} is extinct; ${c.name} was the last ruler. The faction continues under a council.`;
    const heir = d.heirId ? personById(d.heirId) : null;
    return `${heir ? `Heir: ${heir.name}, age ${heir.age}.` : "No living heir."} Rulers, heirs and rivals all follow the same mortality rules.`;
  }

  function renderEvents() {
    const feed = $("eventFeed");
    const filtered = state.events.filter(e => activeFilter === "all" || e.type === activeFilter);
    if (!filtered.length) {
      feed.innerHTML = '<div class="empty-state">No events in this category yet.</div>';
      return;
    }
    feed.innerHTML = filtered.slice(0, 80).map(e => `
      <article class="event-card">
        <div class="event-year">Y${e.year} · M${e.month}</div>
        <div><h4>${escapeHtml(e.title)} ${e.importance === "critical" ? '<span class="danger-text">●</span>' : ""}</h4>
        <p>${escapeHtml(e.description)}</p><span class="event-type">${escapeHtml(e.type)} · ${escapeHtml(e.importance)}</span></div>
      </article>`).join("");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch]);
  }

  function generateChronicle() {
    const box = $("chronicleBox");
    const events = state.chronicle.slice().reverse();
    const byType = events.reduce((acc, e) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc; }, {});
    const last = state.lastJump;
    const lines = [
      `WORLD CHRONICLE — ${state.faction.name}`,
      `Current date: ${nowLabel()}`,
      last ? `Last jump: requested ${last.requestedYears} years; processed ${last.steps} monthly steps; stopped at ${last.completedAt}.` : "No time jump has been completed yet.",
      "",
      "CURRENT STATE",
      `Leader: ${state.faction.leader}`,
      `Faction tier: ${state.faction.tier}`,
      `Population: ${Math.round(state.faction.population).toLocaleString()}`,
      `Treasury: ${money(state.faction.treasury)}`,
      `Food: ${Math.round(state.faction.food).toLocaleString()}`,
      `Stability: ${Math.round(state.faction.stability)}/100`,
      `Territory: ${state.faction.territory}`,
      `Ruler: ${state.character.name} (House ${state.dynasty.house}, generation ${state.character.generation}) — ${state.character.alive ? "alive, age " + state.character.age : state.character.fate || "deceased"}`,
      `Rulers who have died: ${state.people.filter(p => p.reigned && !p.alive).length} · Control: ${state.control}`,
      "",
      "RECORDED EVENTS",
      `Total retained history: ${events.length}`,
      `Character: ${byType.character || 0} · Faction: ${byType.faction || 0} · World: ${byType.world || 0}`,
      ...events.slice(0, 25).map(e => `Year ${e.year}, Month ${e.month} — ${e.title}: ${e.description}`),
      "",
      "NOTE: This report is assembled from recorded game events. It does not invent additional historical events."
    ];
    box.textContent = lines.join("\n");
    box.classList.remove("hidden");
  }

  function serialize() { return JSON.stringify({ ...state, character: undefined }); }
  function hydrate() { // rebuild the ruler reference from the single people registry
    state.character = personById(state.dynasty.rulerId);
    if (!state.character) throw new Error("Save has no ruler record");
    delete state._pauseRequested;
  }

  function saveGame(showStatus = true) {
    try {
      localStorage.setItem(SAVE_KEY, serialize());
      if (showStatus) $("saveStatus").textContent = `Saved at ${nowLabel()}`;
      else $("saveStatus").textContent = "Autosaved";
    } catch (err) {
      $("saveStatus").textContent = "Save failed";
      console.error(err);
    }
  }
  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        $("simulationStatus").textContent = "No local save found in this browser.";
        return;
      }
      const loaded = JSON.parse(raw);
      if (!loaded || loaded.version !== 2 || !loaded.people || !loaded.faction) throw new Error("Invalid save format");
      state = loaded; hydrate(); dirty = false;
      $("primaryGoal").value = state.orders.primaryGoal;
      $("reserveToggle").checked = state.orders.reserve;
      $("warToggle").checked = state.orders.avoidWar;
      $("opportunityToggle").checked = state.orders.opportunities;
      $("riskTolerance").value = state.orders.risk;
      $("autonomyMode").value = state.orders.autonomy || "planned";
      $("interruptMode").value = state.orders.interruptions || "none";
      $("simulationStatus").textContent = `Loaded save at ${nowLabel()}.`;
      render();
    } catch (err) {
      $("simulationStatus").textContent = "Could not load save. It may be damaged or from another version.";
      console.error(err);
    }
  }
  function resetWorld() {
    if (!confirm("Start a new world? This replaces the current in-memory world. Your existing local save remains until you save the new world.")) return;
    state = createWorld(); initFounder(); dirty = false;
    $("primaryGoal").value = "power";
    $("reserveToggle").checked = true;
    $("warToggle").checked = true;
    $("opportunityToggle").checked = true;
    $("riskTolerance").value = "balanced";
    $("autonomyMode").value = "planned";
    $("interruptMode").value = "none";
    $("simulationStatus").textContent = "A new world is ready.";
    $("chronicleBox").classList.add("hidden");
    render();
  }

  if (typeof document === "undefined") { // Node: expose the engine for tests/tests.js
    module.exports = {
      get state() { return state; }, set state(v) { state = v; },
      reset(seed) { state = createWorld(); if (seed) state.rngSeed = seed; initFounder(); },
      processMonth, currentMonthIndex, serialize, hydrate
    };
    return;
  }
  document.querySelectorAll("[data-years]").forEach(button => button.addEventListener("click", () => advanceYears(button.dataset.years)));
  $("customJumpBtn").addEventListener("click", () => advanceYears($("customYears").value));
  $("cancelJumpBtn").addEventListener("click", () => { stopRequested = true; $("simulationStatus").textContent = "Stop requested; finishing current simulation chunk."; });
  $("applyOrdersBtn").addEventListener("click", applyOrdersFromUI);
  $("saveBtn").addEventListener("click", () => saveGame(true));
  $("loadBtn").addEventListener("click", loadGame);
  $("resetBtn").addEventListener("click", resetWorld);
  $("showChronicleBtn").addEventListener("click", generateChronicle);
  document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach(b => b.classList.toggle("active", b === button));
    renderEvents();
  }));

  // Persist on page exit and after meaningful state changes.
  // Only autosave on exit if this session changed the world; otherwise opening and closing the page would overwrite a good save with a fresh world.
  window.addEventListener("beforeunload", () => { if (dirty) { try { localStorage.setItem(SAVE_KEY, serialize()); } catch (_) {} } });
  render();
})();
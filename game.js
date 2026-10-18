(() => {
  "use strict";

  const SAVE_KEY = "worldbound-save-v1";
  const MONTHS_PER_YEAR = 12;
  const MAX_JUMP_YEARS = 500;

  const $ = (id) => document.getElementById(id);
  let state = createWorld();
  let activeFilter = "all";
  let simulating = false;
  let stopRequested = false;

  function createWorld() {
    return {
      version: 1,
      time: { year: 1, month: 1 },
      character: {
        id: "aren-vale", name: "Aren Vale", age: 20, alive: true,
        power: 12, influence: 8, wealth: 850, ambitionProgress: 8,
        lifespan: 78, traits: { ambition: 85, caution: 55, loyalty: 65 },
        currentActivity: "Preparing plans", nextDecisionMonth: 2,
        heirName: "Mira Vale", generation: 1, fate: null
      },
      faction: {
        name: "Vale Settlement", tier: "Settlement", population: 286,
        treasury: 2400, food: 1100, stability: 72, military: 18,
        territory: 1, incomePerMonth: 95, foodProduction: 45,
        foodConsumption: 39, upkeepPerMonth: 65, leader: "Aren Vale",
        legacy: "Founder-led", corruption: 8, prosperity: 35
      },
      world: {
        status: "Stable", threat: 12, rivalPower: 20, trade: 1,
        activeWar: false, famine: false, dynastyStrength: 20
      },
      orders: {
        primaryGoal: "power", reserve: true, avoidWar: true,
        opportunities: true, risk: "balanced", autonomy: "planned",
        interruptions: "none"
      },
      events: [],
      pending: [],
      chronicle: [],
      counters: { events: 0, decisions: 0, actions: 0 },
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
    const event = {
      id: ++state.counters.events,
      year: state.time.year, month: state.time.month,
      type, title, description, importance: options.importance || "normal",
      resolved: true
    };
    state.events.unshift(event);
    state.chronicle.push({ ...event });
    if (state.events.length > 250) state.events.length = 250;
    return event;
  }
  function money(n) { return Math.round(n).toLocaleString("en-US") + " G"; }

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
    if (f.food < 0) {
      const shortage = Math.min(10, Math.ceil(Math.abs(f.food) / 10));
      f.food = 0;
      f.stability = clamp(f.stability - shortage * 0.7, 0, 100);
      f.population = Math.max(0, f.population - shortage);
      state.world.famine = true;
    } else if (f.food > 250 && state.world.famine) {
      state.world.famine = false;
      f.stability = clamp(f.stability + 4, 0, 100);
    }
    if (f.treasury < 0) {
      f.stability = clamp(f.stability - 0.8, 0, 100);
      f.corruption = clamp(f.corruption + 0.08, 0, 100);
    }
    if (f.food > 800 && f.treasury > 1000 && f.stability > 55 && random() < 0.22) {
      f.population += randInt(0, 2);
    }
    if (f.stability > 70 && f.treasury > 1500 && random() < 0.05) f.prosperity = clamp(f.prosperity + 1, 0, 100);
    if (c.alive) {
      c.wealth += Math.max(0, f.incomePerMonth - f.upkeepPerMonth) * 0.08;
    }
    f.stability = clamp(f.stability, 0, 100);
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
      recordEvent("faction", "Emergency management", `${c.name} redirected effort toward food production and essential income.`, { importance: "major" });
      return;
    }

    if (o.primaryGoal === "power") {
      c.power += randInt(1, 3);
      c.ambitionProgress += randInt(2, 5);
      c.wealth = Math.max(0, c.wealth - (o.risk === "bold" ? 35 : 20));
      if (random() < opportunityChance && o.opportunities) {
        c.power += randInt(2, 5);
        recordEvent("character", "A rare technique discovered", `${c.name} found a technique that accelerated personal development.`, { importance: "major" });
      } else {
        recordEvent("character", "Years of disciplined training", `${c.name} focused on training and improved their power.`, {});
      }
    } else if (o.primaryGoal === "wealth") {
      f.incomePerMonth += randInt(2, 6);
      c.wealth += randInt(80, 180);
      c.ambitionProgress += randInt(1, 3);
      if (o.opportunities && random() < opportunityChance) {
        f.trade += 1; f.incomePerMonth += 5;
        recordEvent("faction", "A profitable trade agreement", `A trade arrangement increased the faction's long-term income.`, { importance: "major" });
      } else {
        recordEvent("character", "Investment in commerce", `${c.name} expanded income-producing ventures.`, {});
      }
    } else if (o.primaryGoal === "influence") {
      c.influence += randInt(1, 3);
      f.stability = clamp(f.stability + randInt(-2, 3), 0, 100);
      c.ambitionProgress += randInt(2, 4);
      if (o.opportunities && random() < opportunityChance) {
        w.rivalPower = Math.max(5, w.rivalPower - randInt(1, 4));
        recordEvent("world", "A diplomatic opening", `${c.name} secured a useful political connection and improved regional standing.`, { importance: "major" });
      } else recordEvent("character", "Political influence grows", `${c.name} negotiated with local leaders and expanded their network.`, {});
    } else {
      f.dynastyStrength = clamp(f.dynastyStrength + randInt(1, 4), 0, 100);
      c.ambitionProgress += randInt(2, 4);
      f.stability = clamp(f.stability + 1, 0, 100);
      if (random() < 0.45) {
        f.legacy = "Institutions developing";
        recordEvent("faction", "Institutions established", `${c.name} improved succession procedures and strengthened local administration.`, { importance: "major" });
      } else recordEvent("character", "Planning for a lasting legacy", `${c.name} invested in institutions and long-term continuity.`, {});
    }

    // Expansion depends on capacity, reserves, stability, and military conditions.
    if (reserveSafe && f.stability > 50 && f.treasury > 1800 && random() < 0.28) {
      f.territory += 1;
      f.population += randInt(20, 75);
      f.treasury -= 300;
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
    // Annual events happen at month 12.
    if (state.time.month !== 12) return;
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
        f.military = Math.max(5, f.military - 3);
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
        f.military += 2;
        recordEvent("faction", "Military reforms", "Training and organization improved defensive capability.", {});
      }
    }
    // Annual upkeep of institutional and population growth.
    if (f.population > 0) {
      f.foodConsumption = Math.max(25, Math.round(f.population * 0.14));
      f.foodProduction = Math.max(30, Math.round(f.population * 0.17));
      f.upkeepPerMonth = Math.max(40, Math.round(f.population * 0.22));
      f.incomePerMonth = Math.max(55, Math.round(55 + f.prosperity * 0.6 + f.territory * 12 - f.corruption * 0.2));
    }
  }

  function ageAndLifeEvents() {
    if (state.time.month !== 1) return;
    const c = state.character, f = state.faction;
    if (c.alive) {
      c.age += 1;
      if (c.age >= c.lifespan) {
        c.alive = false;
        c.fate = `Died at age ${c.age}`;
        c.currentActivity = "Life ended; legacy continues";
        f.leader = c.heirName;
        f.legacy = "Successor-led";
        f.stability = clamp(f.stability - 8, 0, 100);
        f.dynastyStrength = clamp(f.dynastyStrength + 5, 0, 100);
        recordEvent("character", `${c.name} dies; succession begins`, `${c.name} died at age ${c.age}. ${c.heirName} inherited leadership under the example succession rule. The world continues.`, { importance: "critical" });
        if (state.orders.interruptions === "critical") {
          state._pauseRequested = `Character death and succession at age ${c.age}`;
        }
      }
    } else {
      // The successor is represented at faction level; the original character remains in history.
      if (random() < 0.035) {
        f.stability = clamp(f.stability + randInt(-4, 5), 0, 100);
        recordEvent("faction", "The successor reshapes the realm", `${f.leader} changed a policy, affecting the faction's stability and direction.`, { importance: "major" });
      }
    }
  }

  function evaluateYearlyDecision() {
    if (!state.character.alive) {
      // A successor-led faction continues to make broad strategic progress.
      const f = state.faction;
      if (f.stability > 40 && f.treasury > 1000 && random() < 0.35) {
        f.territory += 1;
        f.population += randInt(15, 55);
        f.incomePerMonth += 6;
        f.upkeepPerMonth += 5;
        f.tier = f.territory >= 5 ? "City-State" : f.territory >= 3 ? "Town" : "Settlement";
        recordEvent("faction", "Successor-led expansion", `${f.leader} expanded the faction's influence under the inherited legacy.`, { importance: "major" });
      }
      return;
    }
    evaluateAgentDecision();
  }

  function processMonth() {
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
    if (state.faction.population <= 0) {
      state.faction.population = 0;
      state.world.status = "Collapsed";
      recordEvent("faction", "The settlement collapses", "The population has fallen to zero. The faction no longer functions as an inhabited settlement.", { importance: "critical" });
      state._pauseRequested = "Faction collapse";
    }
    if (state.faction.stability < 15 && random() < 0.08) {
      state.faction.territory = Math.max(1, state.faction.territory - 1);
      state.faction.stability = clamp(state.faction.stability + 4, 0, 100);
      recordEvent("faction", "A region breaks away", "Low stability caused a region to become independent or fall outside the faction's control.", { importance: "major" });
    }
  }

  function advanceYears(years) {
    if (simulating) return;
    const n = Math.floor(Number(years));
    if (!Number.isFinite(n) || n < 1 || n > MAX_JUMP_YEARS) {
      $("simulationStatus").textContent = `Choose a whole number from 1 to ${MAX_JUMP_YEARS} years.`;
      return;
    }
    applyOrdersFromUI();
    simulating = true; stopRequested = false;
    $("cancelJumpBtn").classList.remove("hidden");
    const startYear = state.time.year;
    const targetMonthIndex = currentMonthIndex() + n * MONTHS_PER_YEAR;
    let steps = 0;
    $("simulationStatus").textContent = `Simulating ${n} year${n === 1 ? "" : "s"}...`;
    // Chunk work so the interface remains responsive for long jumps.
    function runChunk() {
      const chunkLimit = 240;
      let count = 0;
      while (currentMonthIndex() < targetMonthIndex && count < chunkLimit && !stopRequested) {
        processMonth();
        count++; steps++;
        if (state._pauseRequested) {
          const reason = state._pauseRequested;
          state._pauseRequested = null;
          if (state.orders.interruptions === "critical") {
            $("simulationStatus").textContent = `Paused at ${nowLabel()}: ${reason}. Resume with another time jump.`;
            stopRequested = true;
            break;
          }
        }
      }
      render();
      if (currentMonthIndex() < targetMonthIndex && !stopRequested) {
        $("simulationStatus").textContent = `Simulating... ${Math.floor((currentMonthIndex() - ((startYear - 1) * 12)) / (n * 12) * 100)}%`;
        setTimeout(runChunk, 0);
      } else {
        simulating = false;
        $("cancelJumpBtn").classList.add("hidden");
        const completedYears = Math.floor((state.time.year - startYear) + (state.time.month - 1) / 12);
        state.lastJump = { startYear, endYear: state.time.year, requestedYears: n, steps, completedAt: nowLabel() };
        if (stopRequested && !state._pauseRequested) {
          $("simulationStatus").textContent = `Stopped or paused at ${nowLabel()}. ${steps} monthly steps processed.`;
        } else {
          $("simulationStatus").textContent = `Jump resolved at ${nowLabel()}. ${steps} monthly steps processed.`;
        }
        recordEvent("world", "Time advancement completed", `The requested ${n}-year jump began in Year ${startYear} and stopped at ${nowLabel()}. Routine systems and eligible events were processed.`, {});
        render();
        saveGame(false);
      }
    }
    setTimeout(runChunk, 0);
  }

  function render() {
    const c = state.character, f = state.faction, w = state.world;
    $("yearValue").textContent = `Year ${state.time.year}, Month ${state.time.month}`;
    $("characterName").textContent = c.alive ? c.name : `${c.heirName} (successor)`;
    $("factionName").textContent = f.name;
    $("worldStatus").textContent = w.status;
    $("characterTitle").textContent = c.alive ? c.name : c.heirName;
    $("characterState").textContent = c.alive ? "Alive" : "Deceased";
    $("characterState").className = c.alive ? "pill pill-green" : "pill";
    $("characterSubtitle").textContent = c.alive ? `Ambitious founder · Generation ${c.generation}` : `${c.fate || "Life ended"} · Generation ${c.generation}`;
    $("ageValue").textContent = c.alive ? c.age : `${c.age} at death`;
    $("powerValue").textContent = c.power;
    $("wealthValue").textContent = money(c.wealth);
    $("influenceValue").textContent = c.influence;
    $("ambitionPercent").textContent = `${Math.round(clamp(c.ambitionProgress, 0, 100))}%`;
    $("ambitionBar").style.width = `${clamp(c.ambitionProgress, 0, 100)}%`;
    $("lifeNote").textContent = c.alive ? `Illustrative lifespan limit: age ${c.lifespan}.` : `The founder's story is recorded. ${f.leader} now leads the faction.`;
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
    $("planDescription").textContent = c.alive ? `Follow the ${state.orders.primaryGoal} objective, preserve configured reserves, and adapt when major events change the opportunity or risk.` : `The founder's original ambition is now part of the historical record. The successor continues under faction-level rules.`;
    $("currentActivity").textContent = c.currentActivity;
    $("nextDecision").textContent = c.alive ? "Within 1 year" : "Successor decisions ongoing";
    $("legacyStatus").textContent = f.legacy;
    $("eventCount").textContent = `${state.chronicle.length} events`;
    renderEvents();
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
      `Founder: ${state.character.name} — ${state.character.fate || (state.character.alive ? "alive" : "deceased")}`,
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

  function saveGame(showStatus = true) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
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
      if (!loaded || loaded.version !== 1 || !loaded.character || !loaded.faction) throw new Error("Invalid save format");
      state = loaded;
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
    state = createWorld();
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
  window.addEventListener("beforeunload", () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (_) {} });
  render();
})();
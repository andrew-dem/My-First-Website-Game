// Run with:  node tests.js        (no dependencies)
const assert = require("assert");
const g = require("./game.js");
const results = [];
function test(name, fn) {
  try { fn(); results.push([true, name]); console.log("PASS  " + name); }
  catch (e) { results.push([false, name]); console.log("FAIL  " + name + "\n      " + e.message); }
}
const S = () => g.state;
function years(n) { const end = g.currentMonthIndex() + n * 12; while (g.currentMonthIndex() < end && !S().ended) g.processMonth(); }
const SEEDS = [927431, 1, 42, 777, 20240, 31337, 5150, 9001];

test("founder ages and dies under the configured rules (every seed, by age 100)", () => {
  for (const seed of SEEDS) { g.reset(seed); const founder = S().character; years(90);
    assert.strictEqual(founder.alive, false, `founder alive at age ${founder.age} (seed ${seed})`);
    assert.ok(founder.age >= 40 && founder.age <= 100, "founder died outside the lifespan bounds"); }
});

test("REGRESSION: successors age and die too (the reported immortality bug)", () => {
  let successorsWhoDied = 0, rulerDeaths = 0;
  for (const seed of SEEDS) { g.reset(seed); years(400);
    for (const p of S().people) if (p.alive) assert.ok(p.age < p.lifespan, `${p.name} alive at ${p.age} >= lifespan ${p.lifespan} (seed ${seed})`);
    const reigned = S().people.filter(p => p.reigned);
    rulerDeaths += reigned.filter(p => !p.alive).length;
    successorsWhoDied += reigned.slice(1).filter(p => !p.alive).length; }
  assert.ok(successorsWhoDied >= 6, "too few successors died across seeds: " + successorsWhoDied);
  console.log(`      (${rulerDeaths} ruler deaths across ${SEEDS.length} seeds, ${successorsWhoDied} of them successors)`);
});

test("many generations: unique ids, at most one living ruler, no invalid state", () => {
  for (const seed of SEEDS) { g.reset(seed); years(500);
    const ids = S().people.map(p => p.id); assert.strictEqual(new Set(ids).size, ids.length, "duplicate person ids");
    const livingRulers = S().people.filter(p => p.role === "ruler" && p.alive && p.id === S().dynasty.rulerId);
    assert.ok(livingRulers.length <= 1, "more than one current ruler");
    if (S().control === "player") assert.ok(S().character.alive, "player controls a dead character"); }
});

test("dead people never come back and never age again across repeated jumps", () => {
  g.reset(2026); const frozen = new Map();
  for (let i = 0; i < 12; i++) { years(50);
    for (const p of S().people) { if (frozen.has(p.id)) { const f = frozen.get(p.id); assert.strictEqual(p.alive, false, p.name + " resurrected"); assert.strictEqual(p.age, f, p.name + " aged after death"); }
      else if (!p.alive) frozen.set(p.id, p.age); } }
  assert.ok(frozen.size > 3, "expected several deaths over 600 years");
});

test("a dynasty can end while the kingdom continues (observer mode)", () => {
  g.reset(5); const s = S(); const r = s.character;
  s.dynasty.heirId = null; s.faction.stability = 10; // no heir, too unstable for a claimant
  r.age = r.lifespan - 1; s.time.month = 12; // next Jan: ages to lifespan and dies
  let guard = 0; while (r.alive && guard++ < 24) g.processMonth();
  assert.strictEqual(r.alive, false);
  assert.strictEqual(s.dynasty.extinct, true, "dynasty should be extinct");
  assert.strictEqual(s.control, "observer");
  assert.ok(s.faction.population > 0 && !s.ended, "kingdom must continue");
  years(30); assert.ok(S().faction.population > 0 || S().ended, "world still simulates");
  assert.ok(S().chronicle.filter(e => /House .* ends/.test(e.title)).length === 1, "extinction recorded once");
});

test("a kingdom can collapse once without duplicate collapse records", () => {
  g.reset(8); const s = S(); s.faction.population = 0;
  for (let i = 0; i < 36; i++) g.processMonth();
  assert.strictEqual(s.ended, true); assert.strictEqual(s.control, "ended");
  assert.strictEqual(s.chronicle.filter(e => e.title === "The settlement collapses").length, 1, "collapse recorded more than once");
});

test("year-end events actually run: wars resolve and the economy rescales", () => {
  g.reset(11); const s = S(); s.world.activeWar = true; years(2);
  assert.strictEqual(s.world.activeWar, false, "war never ended");
  assert.ok(s.faction.foodConsumption !== 39, "food consumption never rescaled");
});

test("chronicle: unique ids, chronological order, no event spam", () => {
  for (const seed of SEEDS) { g.reset(seed); years(300); const c = S().chronicle;
    const ids = c.map(e => e.id); assert.strictEqual(new Set(ids).size, ids.length, "duplicate event ids");
    for (let i = 1; i < c.length; i++) { assert.ok(c[i].id > c[i - 1].id, "ids not increasing");
      assert.ok(c[i].year * 12 + c[i].month >= c[i - 1].year * 12 + c[i - 1].month, "events out of chronological order"); }
    const counts = {}; c.forEach(e => counts[e.title] = (counts[e.title] || 0) + 1);
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    assert.ok(top[1] <= 0.4 * c.length, `"${top[0]}" is ${top[1]} of ${c.length} events (seed ${seed})`);
    assert.ok(Object.keys(counts).length >= 8, "too little variety: " + Object.keys(counts).length); }
});

test("repeated jumps do not duplicate committed events", () => {
  g.reset(99); for (let i = 0; i < 6; i++) years(40);
  const ids = S().chronicle.map(e => e.id); assert.strictEqual(new Set(ids).size, ids.length);
  assert.strictEqual(S().counters.events >= ids.length, true);
});

test("save/load round-trip preserves identities, history and ruler reference", () => {
  g.reset(321); years(150); const before = JSON.parse(g.serialize());
  const json = g.serialize(); g.state = JSON.parse(json); g.hydrate();
  assert.deepStrictEqual(JSON.parse(g.serialize()), before, "round-trip changed the save");
  assert.strictEqual(S().character.id, S().dynasty.rulerId);
  years(50); const ids = S().people.map(p => p.id); assert.strictEqual(new Set(ids).size, ids.length, "ids collided after load");
});

test("same seed gives the same history (deterministic core)", () => {
  g.reset(4242); years(200); const a = g.serialize(); g.reset(4242); years(200);
  assert.strictEqual(g.serialize(), a);
});

test("a 500-year jump completes quickly and the save stays small", () => {
  g.reset(7); const t = Date.now(); years(500); const ms = Date.now() - t; const kb = g.serialize().length / 1024;
  console.log(`      (500 years: ${ms} ms, save ${kb.toFixed(0)} KB)`);
  assert.ok(ms < 2000, "too slow: " + ms + " ms"); assert.ok(kb < 1000, "save too large: " + kb + " KB");
});

const failed = results.filter(r => !r[0]).length;
console.log(`\n${results.length - failed}/${results.length} passed`); process.exit(failed ? 1 : 0);

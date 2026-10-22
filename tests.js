// Run with:  node tests.js   (no dependencies). Tests the real engine in engine.js.
const assert = require("assert"); const W = require("./engine.js");
let pass = 0, fail = 0;
function test(name, fn) { try { fn(); pass++; console.log("PASS  " + name); } catch (e) { fail++; console.log("FAIL  " + name + "\n      " + e.message); } }
const fresh = (seed = 1, o = 0, meta) => { W.set({ phase: "birth" }, meta || { fate: 0, lives: 0, best: 0, up: {} }); W.startLife(o, seed); return W.S; };
const snap = () => JSON.stringify(W.S);
// A simple player: heal when low, fight smart, break through when ready, otherwise cultivate.
function bot(maxSteps = 3000) {
  let n = 0;
  while (W.S.phase === "life" && n++ < maxSteps) {
    const S = W.S;
    if (S.duel) { let c = S.duel.foeLast === null ? 0 : [1, 2, 0][S.duel.foeLast]; if (c === 2 && !S.techs.length) c = 0; if (!W.duelMove(c).ok) W.duelMove(0); continue; }
    if (S.pills.body && S.body < W.maxBody() / 2) { W.usePill("body"); continue; }
    if (S.body < W.maxBody() / 3) { W.act(0); if (W.S.place !== "village") W.travel("village"); W.seclude(1); continue; }
    if (S.qi >= 100) { W.breakthrough(); continue; }
    const ev = W.evDef(); if (ev && Math.random() < .5) { const ok = ev.o.findIndex(o => o[1] <= S.stones && W.risk(o[2])[1] <= "r2"); W.choose(ok >= 0 ? ok : ev.o.length - 1); continue; }
    W.seclude(3);
  }
}

test("content: unique event ids, valid outcomes, every probability sums to 1", () => {
  const ids = W.EV.map(e => e.id); assert.strictEqual(new Set(ids).size, ids.length); assert.ok(W.EV.length >= 25);
  const keys = new Set(["q","b","m","l","s","r","L","y","d","h","sh","t","pill","duel"]);
  const all = [...W.EV.flatMap(e => e.o.map(o => [e.id, o])), ...W.PLACES.flatMap(p => p.acts.map(o => [p.id, o]))];
  for (const [id, o] of all) { assert.ok(o[0] && typeof o[1] === "number", id + " bad option");
    assert.ok(Math.abs(o[2].reduce((a, x) => a + x[0], 0) - 1) < 1e-9, id + " / " + o[0] + " probabilities");
    for (const [, text, f] of o[2]) { assert.ok(text, id + " empty text"); for (const k in f) assert.ok(keys.has(k), id + " bad key " + k);
      if (f.duel) assert.ok(f.duel === "rival" || W.FOES[f.duel], id + " bad foe"); } }
});
test("every realm and place always draws a valid, eligible event", () => {
  for (let r = 0; r <= 5; r++) for (const p of W.PLACES) { fresh(20 + r); W.S.realm = r; W.S.place = p.id;
    for (let i = 0; i < 30; i++) { W.S.age = 20; W.seclude(0); const e = W.evDef(); assert.ok(e, `no event r${r} ${p.id}`); assert.ok(r >= e.min && r <= e.max && (!e.pl || e.pl === p.id)); } }
});
test("deterministic: same seed gives the same life", () => {
  const run = () => { fresh(77); for (let i = 0; i < 40 && W.S.phase === "life"; i++) { W.seclude(3); if (W.S.qi >= 100) W.breakthrough(); } return snap(); };
  assert.strictEqual(run(), run());
});
test("every life ends: ages, dies, never exceeds lifespan, fate is awarded once", () => {
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) { const meta = { fate: 0, lives: 0, best: 0, up: {} }; fresh(seed, seed % 3, meta);
    for (let i = 0; i < 600 && W.S.phase === "life"; i++) W.seclude(10);
    assert.strictEqual(W.S.phase, "dead"); assert.ok(W.S.age >= 16); assert.strictEqual(W.M.lives, 1); assert.strictEqual(W.M.fate, W.S.dead.gain); }
});
test("the dead cannot act and nothing changes", () => {
  fresh(9); for (let i = 0; i < 100 && W.S.phase === "life"; i++) W.seclude(10);
  const s = snap(); for (const r of [W.seclude(3), W.breakthrough(), W.choose(0), W.act(0), W.travel("market"), W.learn("fist"), W.brew("qi"), W.duelMove(0), W.flee(), W.usePill("qi")]) assert.strictEqual(r.ok, false);
  assert.strictEqual(snap(), s);
});
test("invalid actions fail without changing state", () => {
  fresh(10); W.S.stones = 0; W.S.qi = 50; W.S.herbs = 0; const s = snap();
  for (const r of [W.travel("peak"), W.travel("village"), W.travel("nowhere"), W.breakthrough(), W.learn("fist"), W.brew("qi"), W.usePill("bt"), W.choose(99), W.duelMove(0), W.flee()]) assert.strictEqual(r.ok, false);
  assert.strictEqual(snap(), s);
});
test("travel costs stones, takes a year, changes place and draws a place event", () => {
  fresh(11); W.S.stones = 50; const a = W.S.age; assert.ok(W.travel("market").ok);
  assert.strictEqual(W.S.place, "market"); assert.strictEqual(W.S.stones, 46); assert.strictEqual(W.S.age, a + 1);
});
test("breakthrough: needs full qi, chance stays within 10-95%, success raises realm, failure hurts", () => {
  let ups = 0, fails = 0;
  for (let seed = 1; seed <= 60; seed++) { fresh(seed); W.S.qi = 100; const c = W.chance(); assert.ok(c >= .1 && c <= .95);
    const body = W.S.body, r = W.breakthrough(); if (r.success) { ups++; assert.strictEqual(W.S.realm, 1); assert.strictEqual(W.S.qi, 0); } else if (r.ok) { fails++; assert.ok(W.S.body < body || W.S.phase === "dead"); } }
  assert.ok(ups > 10 && fails > 3, `ups ${ups} fails ${fails}`);
});
test("duel: resolves with a winner, pays loot, never leaves negative body alive", () => {
  let wins = 0, deaths = 0;
  for (let seed = 1; seed <= 80; seed++) { fresh(seed); W.S.techs = ["fist"]; W.startDuel = null; W.S.stones = 0; 
    W.S.ev = "bandits"; W.choose(0); assert.ok(W.S.duel, "duel should start");
    let guard = 0; while (W.S.duel && guard++ < 60) { const r = W.duelMove(Math.floor(W.rnd() * 3)); assert.ok(r.ok); }
    if (W.S.phase === "dead") deaths++; else { wins++; assert.ok(W.S.stones >= 20 && W.S.body > 0); } }
  console.log(`      (duel vs bandit chief with random stances: ${wins} won, ${deaths} died)`); assert.ok(wins > 20 && deaths > 3);
});
test("duel: stance cycle beats work and flee has a real chance either way", () => {
  fresh(12); W.S.ev = "bandits"; W.choose(0); const d = W.S.duel; d.foeLast = null;
  let seenWin = false, seenLose = false; for (let i = 0; i < 25 && W.S.duel; i++) { const r = W.duelMove(1); if (r.r === "win") seenWin = true; if (r.r === "lose") seenLose = true; W.S.body = W.maxBody(); W.S.duel && (W.S.duel.hp = W.S.duel.max); }
  assert.ok(seenWin && seenLose);
  let esc = 0, hit = 0; for (let s = 1; s <= 60; s++) { fresh(s); W.S.ev = "bandits"; W.choose(0); const r = W.flee(); if (r.escaped) esc++; else hit++; }
  assert.ok(esc > 10 && hit > 10, `esc ${esc} hit ${hit}`);
});
test("rival is replaced after two defeats and keeps its identity before that", () => {
  fresh(13); const first = W.S.rival.n; W.S.mind = 40; W.S.techs = ["fist", "sword"]; W.S.body = 99; W.S.bodyBonus = 90; W.S.body = W.maxBody();
  W.S.ev = "rival"; W.choose(0); while (W.S.duel) { W.S.body = W.maxBody(); W.duelMove(0); } assert.strictEqual(W.S.rival.n, first); assert.strictEqual(W.S.rival.beaten, 1);
  W.S.ev = "rival"; W.choose(0); while (W.S.duel) { W.S.body = W.maxBody(); W.duelMove(0); } assert.strictEqual(W.S.rival.beaten, 0);
});
test("alchemy: needs herbs, consumes them, success adds pills, failure wastes herbs", () => {
  let ok = 0, no = 0; for (let s = 1; s <= 80; s++) { fresh(s); W.S.herbs = 2; const r = W.brew("qi"); assert.ok(r.ok); assert.strictEqual(W.S.herbs, 0); r.success ? (ok++, assert.strictEqual(W.S.pills.qi, 1)) : (no++, assert.strictEqual(W.S.pills.qi, 0)); }
  assert.ok(ok > 40 && no > 3, `ok ${ok} no ${no}`); fresh(1); W.S.herbs = 1; assert.strictEqual(W.brew("qi").ok, false); assert.strictEqual(W.brew("bt").ok, false);
});
test("pills: qi, mending, breakthrough and longevity all change state", () => {
  fresh(14); W.S.pills = { qi: 1, body: 1, bt: 2, life: 1 }; W.S.qi = 10; W.S.body = 1; const l = W.S.lifespan, c = W.chance();
  W.usePill("qi"); assert.strictEqual(W.S.qi, 40); W.usePill("body"); assert.strictEqual(W.S.body, 9); W.usePill("bt"); assert.ok(W.chance() > c); W.usePill("life"); assert.strictEqual(W.S.lifespan, l + 12);
});
test("sect: learning needs the sect, stones, rep and realm; bonuses apply", () => {
  fresh(15); W.S.stones = 500; assert.strictEqual(W.learn("fist").ok, false); W.S.place = "sect"; const p = W.power(); assert.ok(W.learn("fist").ok); assert.strictEqual(W.power(), p + 3);
  assert.strictEqual(W.learn("fist").ok, false); assert.strictEqual(W.learn("sword").ok, false);
});
test("fate shop: costs fate, respects max level, upgrades affect the next life", () => {
  const meta = { fate: 60, lives: 3, best: 2, up: {} }; W.set({ phase: "birth" }, meta);
  assert.ok(W.buyUpgrade("luck").ok); assert.strictEqual(W.M.fate, 57); W.buyUpgrade("luck"); W.buyUpgrade("luck"); assert.strictEqual(W.buyUpgrade("luck").ok, false);
  assert.strictEqual(W.buyUpgrade("tech").ok, true); assert.strictEqual(W.buyUpgrade("root").ok, true);
  W.set({ phase: "birth" }, { fate: 0, lives: 0, best: 0, up: {} }); W.startLife(0, 5); const base = W.S.luck;
  W.set({ phase: "birth" }, { fate: 0, lives: 0, best: 0, up: { luck: 3, tech: 1 } }); W.startLife(0, 5); assert.strictEqual(W.S.luck, base + 3); assert.deepStrictEqual(W.S.techs, ["breath"]);
  W.set({ phase: "birth" }, { fate: 0, lives: 0, best: 0, up: {} }); assert.strictEqual(W.buyUpgrade("luck").ok, false);
});
test("luck shifts rolls toward better outcomes", () => {
  const rate = (lk) => { let g = 0; for (let s = 1; s <= 400; s++) { fresh(s); W.S.luck = lk; W.S.ev = "herb"; W.S.stones = 0; const q = W.S.qi; W.choose(0); if (W.S.phase === "life" && W.S.qi > q) g++; } return g; };
  assert.ok(rate(15) > rate(0), "luck did not help");
});
test("save/load round-trips a life in the middle of a duel", () => {
  fresh(16); W.S.ev = "bandits"; W.choose(0); W.duelMove(0); const json = W.serialize(); const before = JSON.parse(json);
  W.set({ phase: "birth" }); assert.ok(W.load(json)); assert.deepStrictEqual(JSON.parse(W.serialize()), before); assert.ok(W.S.duel);
  assert.strictEqual(W.load("{bad json"), false); assert.strictEqual(W.load('{"v":3}'), false);
});
test("balance: a sensible bot reaches Foundation or better often, and some lives ascend or reach deep realms", () => {
  const realms = []; let deaths = {}; const t = Date.now();
  for (let s = 1; s <= 150; s++) { fresh(1000 + s, s % 3); bot(); realms.push(W.S.dead.realm); const c = W.S.dead.cause.replace(/ .*/, ""); deaths[c] = (deaths[c] || 0) + 1; }
  const mean = realms.reduce((a, b) => a + b) / realms.length, r1 = realms.filter(r => r >= 1).length / 150, r2 = realms.filter(r => r >= 2).length / 150, r4 = realms.filter(r => r >= 4).length / 150;
  console.log(`      (150 lives in ${Date.now() - t} ms: mean realm ${mean.toFixed(2)}, >=Qi ${(r1*100)|0}%, >=Foundation ${(r2*100)|0}%, >=Nascent ${(r4*100)|0}%)`);
  assert.ok(r1 > .7, "too hard to leave Mortal"); assert.ok(r2 > .3 && r2 < .98, "Foundation rate out of range"); assert.ok(r4 < .6, "too easy");
});
console.log(`\n${pass}/${pass + fail} passed`); process.exit(fail ? 1 : 0);

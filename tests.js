// Run with:  node tests.js   (no dependencies). Tests the real engine in engine.js.
const assert = require("assert"); const W = require("./engine.js");
let pass = 0, fail = 0;
function test(name, fn) { try { fn(); pass++; console.log("PASS  " + name); } catch (e) { fail++; console.log("FAIL  " + name + "\n      " + e.message); } }
const fresh = (seed = 1, o = 0, meta) => { W.set({ phase: "birth" }, meta || { fate: 0, lives: 0, best: 0, up: {}, seen: {}, slain: {} }); W.startLife(o, seed); return W.S; };
const snap = () => JSON.stringify(W.S);
let _s = 12345; const brnd = () => (_s = (_s * 1664525 + 1013904223) >>> 0) / 4294967296; // deterministic bot randomness
// A simple player: heal when low, fight smart, break through when ready, otherwise cultivate.
// Answer a forced event (a disturbance that broke a seclusion) with the safest affordable option.
function settle() {
  const S = W.S, ev = W.evDef(); if (!ev) return;
  const ok = ev.o.map((o, i) => ({ i, o, r: W.risk(o[2])[1] })).filter(x => x.o[1] <= S.stones).sort((a, b) => (a.r < b.r ? -1 : a.r > b.r ? 1 : a.o[1] - b.o[1]));
  W.choose(ok.length ? ok[0].i : 0);
}
// Duel with the counter-stance until it ends.
function fightOn() { let g = 0; while (W.S.duel && g++ < 200) { const d = W.S.duel; let c = d.foeLast === null ? 0 : [1, 2, 0][d.foeLast]; if (c === 2 && !W.S.techs.some(id => W.TECH.find(t => t.id === id).d > 0)) c = 0; if (!W.duelMove(c).ok) W.duelMove(0); } }
// Meditate n years at a time, handling anything that interrupts; stops when the life ends.
function meditate(n, maxSteps = 4000) { let g = 0; while (W.S.phase === "life" && g++ < maxSteps) { if (W.S.duel) fightOn(); else if (W.S.forced) settle(); else W.seclude(n); } }
function bot(maxSteps = 3000) {
  let n = 0;
  while (W.S.phase === "life" && n++ < maxSteps) {
    const S = W.S;
    if (S.forced && !S.duel) { settle(); continue; }
    if (S.duel) { let c = S.duel.foeLast === null ? 0 : [1, 2, 0][S.duel.foeLast]; if (c === 2 && !S.techs.length) c = 0; if (!W.duelMove(c).ok) W.duelMove(0); continue; }
    if (S.pills.body && S.body < W.maxBody() / 2) { W.usePill("body"); continue; }
    if (S.body < W.maxBody() / 3) { W.act(0); if (W.S.place !== "village") W.travel("village"); W.seclude(1); continue; }
    if (S.qi >= 100) { W.breakthrough(); continue; }
    const ev = W.evDef(); if (ev && brnd() < .5) { const ok = ev.o.findIndex(o => o[1] <= S.stones && W.risk(o[2])[1] <= "r2"); W.choose(ok >= 0 ? ok : ev.o.length - 1); continue; }
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
    meditate(10, 600);
    assert.strictEqual(W.S.phase, "dead"); assert.ok(W.S.age >= 16); assert.strictEqual(W.M.lives, 1); assert.strictEqual(W.M.fate, W.S.dead.gain + Object.keys(W.M.slain || {}).length); } // death fate plus +1 per new creature slain
});
test("the dead cannot act and nothing changes", () => {
  fresh(9); meditate(10, 400);
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
  for (let seed = 1; seed <= 80; seed++) { fresh(seed); W.S.techs = ["fist"]; W.S.stones = 0; 
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
  _s = 12345; const realms = []; let deaths = {}; const t = Date.now();
  for (let s = 1; s <= 150; s++) { fresh(1000 + s, s % 3); bot(); realms.push(W.S.dead.realm); const c = W.S.dead.cause.replace(/ .*/, ""); deaths[c] = (deaths[c] || 0) + 1; }
  const mean = realms.reduce((a, b) => a + b) / realms.length, r1 = realms.filter(r => r >= 1).length / 150, r2 = realms.filter(r => r >= 2).length / 150, r4 = realms.filter(r => r >= 4).length / 150;
  console.log(`      (150 lives in ${Date.now() - t} ms: mean realm ${mean.toFixed(2)}, >=Qi ${(r1*100)|0}%, >=Foundation ${(r2*100)|0}%, >=Nascent ${(r4*100)|0}%)`);
  assert.ok(r1 > .7, "too hard to leave Mortal"); assert.ok(r2 > .3 && r2 < .98, "Foundation rate out of range"); assert.ok(r4 < .6, "too easy");
});

const dealt = (kind, st, el, techs) => { let sum = 0, n = 0; for (let s = 1; s <= 200; s++) { fresh(s); W.S.root.el = el; W.S.techs = techs; W.S.bodyBonus = 500; W.S.body = W.maxBody(); W.startDuel(kind);
  const r = W.duelMove(st); if (r.r === "win") { sum += r.dealt; n++; } } return sum / n; };
test("creature traits: armor blunts Strike but not Technique; weakness adds damage", () => {
  assert.ok(dealt("ursusumbra", 0, "Metal", ["fist"]) < .85 * dealt("bandit", 0, "Metal", ["fist"]), "armor did not reduce Strike");
  const a = dealt("ursusumbra", 2, "Metal", ["fist"]), b = dealt("bandit", 2, "Metal", ["fist"]); assert.ok(Math.abs(a - b) / b < .05, "armor should not reduce Technique");
  assert.ok(dealt("archespore", 0, "Fire", ["fist"]) > 1.25 * dealt("archespore", 0, "Wood", ["fist"]), "Fire weakness missing");
});
test("creature traits: regeneration heals unless you are the weakness element; kraken drains qi", () => {
  for (const [el, heals] of [["Metal", true], ["Fire", false]]) { fresh(31); W.S.root.el = el; W.S.bodyBonus = 500; W.S.body = W.maxBody(); W.startDuel("archespore"); let checked = 0;
    for (let i = 0; i < 30 && W.S.duel; i++) { W.S.body = W.maxBody(); const d = W.S.duel, before = d.hp, r = W.duelMove(0); if (!W.S.duel) break;
      assert.strictEqual(d.hp, Math.min(d.max, before - r.dealt + (heals ? 2 : 0))); checked++; } assert.ok(checked > 3); }
  fresh(32); W.S.bodyBonus = 500; W.S.body = W.maxBody(); W.startDuel("kraken"); let drained = false;
  for (let i = 0; i < 40 && !drained; i++) { W.S.qi = 50; W.S.body = W.maxBody(); W.S.duel.hp = W.S.duel.max; const r = W.duelMove(i % 3); if (r.r === "lose") { assert.strictEqual(W.S.qi, 42); drained = true; } }
  assert.ok(drained, "never saw a lost round");
});
test("bestiary: first victory over a creature gives +1 fate once; creatures are recorded as seen", () => {
  fresh(33); W.S.mind = 40; W.S.techs = ["fist", "sword"]; W.S.bodyBonus = 900; const f0 = W.M.fate;
  for (let k = 1; k <= 2; k++) { W.S.body = W.maxBody(); W.startDuel("kingboar"); assert.ok(W.M.seen.kingboar); let g = 0; while (W.S.duel && g++ < 80) { W.S.body = W.maxBody(); W.duelMove(0); }
    assert.strictEqual(W.M.slain.kingboar, k); assert.strictEqual(W.M.fate, f0 + 1); }
});
test("new places are gated by realm and reachable once earned", () => {
  fresh(34); W.S.stones = 500; assert.strictEqual(W.travel("wastes").ok, false); assert.strictEqual(W.travel("coast").ok, false);
  W.S.realm = 2; assert.ok(W.travel("wastes").ok); assert.ok(W.travel("coast").ok); assert.ok(W.PLACES.length >= 8 && W.EV.length >= 35);
});


test("Dao paths unlock at Qi Condensation, commit once, and change their passive", () => {
  fresh(101); assert.strictEqual(W.chooseDaoPath("sword").ok, false); W.S.realm = 1; const before = W.power();
  assert.ok(W.chooseDaoPath("sword").ok); assert.strictEqual(W.S.dao.path, "sword"); assert.ok(W.power() >= before + 1) // sword passive is +1 at mastery 1 after the v6.2 balance pass;
  assert.strictEqual(W.chooseDaoPath("alchemy").ok, false); assert.strictEqual(W.S.dao.mastery.sword, 1);
});
test("Dao active ability is limited once per event and once per duel", () => {
  fresh(102); W.S.realm=1; assert.ok(W.chooseDaoPath("formation").ok);
  assert.ok(W.useDaoAbility().ok); assert.strictEqual(W.useDaoAbility().ok, false);
  W.S.ev = "bandits"; W.choose(0); assert.ok(W.S.duel); assert.ok(W.useDaoAbility().ok); assert.strictEqual(W.S.duel.pathUsed, true);
  assert.strictEqual(W.useDaoAbility().ok, false);
});
test("all five Dao path active abilities have a valid effect payload", () => {
  for (const id of ["sword","alchemy","body","formation","shadow"]) {
    fresh(103); W.S.realm=1; W.chooseDaoPath(id); W.startDuel("bandit");
    const d=W.S.duel, before={qi:W.S.qi, body:W.S.body, damage:d.pathDamage, shield:d.shield};
    assert.ok(W.useDaoAbility().ok, id); assert.ok(d.pathUsed, id);
    if(id==="sword") assert.ok(d.pathDamage>before.damage);
    if(id==="alchemy") assert.ok(W.S.qi>=before.qi && W.S.body>=before.body);
    if(id==="body") assert.ok(d.reduceNext || W.S.body>=before.body);
    if(id==="formation") assert.ok(d.shield>before.shield);
    if(id==="shadow") assert.ok(d.evadeNext);
  }
});
test("disciple recruitment is sect-gated, ranked, cultivatable, and role-based", () => {
  fresh(104); W.S.stones=500; assert.strictEqual(W.recruitDisciple("guard").ok,false);
  W.S.place="sect"; assert.ok(W.recruitDisciple("guard").ok); const d=W.S.disciples[0];
  assert.strictEqual(d.role,"guard"); const oldLevel=d.level; assert.ok(W.trainDisciple(d.id).ok); assert.strictEqual(d.level,oldLevel+1);
  assert.ok(W.cultivateDisciple(d.id).ok); assert.ok(d.qi>0 || d.realm>0);
  assert.ok(W.assignDisciple(d.id,"herbalist").ok); assert.strictEqual(d.role,"herbalist");
});
test("disciple cultivation, rank, loyalty and morale improve support contribution", () => {
  fresh(114); W.S.place="sect"; W.S.stones=1000; W.S.realm=1;
  assert.ok(W.recruitDisciple("scholar").ok); const d=W.S.disciples[0]; const initial=W.chance();
  assert.ok(W.trainDisciple(d.id).ok); assert.ok(W.trainDisciple(d.id).ok);
  const trained=W.chance(); assert.ok(trained>initial, `scholar support should improve breakthrough odds (${initial} -> ${trained})`);
  d.realm=2; d.loyalty=70; d.morale=90; const cultivated=W.chance(); assert.ok(cultivated>trained, "realm and trusted morale/loyalty should further increase role weight");
});
test("retinue has a hard cap of three disciples", () => {
  fresh(105); W.S.place="sect"; W.S.stones=1000;
  assert.ok(W.recruitDisciple("guard").ok); assert.ok(W.recruitDisciple("scout").ok); assert.ok(W.recruitDisciple("scholar").ok);
  assert.strictEqual(W.recruitDisciple("alchemist").ok,false); assert.strictEqual(W.S.disciples.length,3);
});
test("beast bonds require a past victory, are capped at two, and can grow", () => {
  fresh(106); W.S.place="forest"; W.S.stones=500; W.S.herbs=5;
  assert.strictEqual(W.bondBeast("beast").ok,false); W.M.slain.beast=1;
  assert.ok(W.bondBeast("beast").ok); const b=W.S.beasts[0]; const lvl=b.level;
  assert.ok(W.trainBeast("beast").ok); assert.strictEqual(b.level,lvl+1);
  assert.ok(W.assignBeast("beast","guardian").ok); assert.strictEqual(b.role,"guardian");
  W.M.slain.kingboar=1; assert.ok(W.bondBeast("kingboar").ok); W.M.slain.archespore=1;
  assert.strictEqual(W.bondBeast("archespore").ok,false); assert.strictEqual(W.S.beasts.length,2);
});
test("beast affinity makes a trained Scout more effective", () => {
  fresh(115); W.S.place="forest"; W.S.stones=500; W.S.herbs=8; W.M.slain.beast=1;
  assert.ok(W.bondBeast("beast").ok); const before=W.fleeChance(); const b=W.S.beasts[0];
  for(let i=0;i<4;i++) assert.ok(W.trainBeast("beast").ok);
  assert.strictEqual(b.level,5); assert.ok(b.affinity>=70); assert.ok(W.fleeChance()>before, "trained high-affinity scout should improve escape odds");
});
test("factions are place-gated, oath-bound, and missions resolve with rewards or costs", () => {
  fresh(107); W.S.stones=500; assert.strictEqual(W.joinFaction("azure").ok,false);
  W.S.place="sect"; assert.ok(W.joinFaction("azure").ok); assert.strictEqual(W.S.faction,"azure");
  assert.strictEqual(W.joinFaction("mist").ok,false); const age=W.S.age; const stones=W.S.stones;
  const result=W.factionMission(); assert.ok(result.ok); assert.strictEqual(W.S.age,age+2); assert.notStrictEqual(W.S.stones,stones);
});
test("field notes reward research once per location and survive in the meta archive", () => {
  fresh(108); const mind=W.S.mind; const r=W.studyField(); assert.ok(r.ok); assert.strictEqual(W.S.research,1); assert.ok(W.S.mind>=mind);
  assert.strictEqual(W.studyField().ok,false); assert.ok(W.M.fieldLore.village); const json=W.serialize(); W.set({phase:"birth"}); assert.ok(W.load(json)); assert.ok(W.M.fieldLore.village);
});
test("version 4 and 5 saves migrate safely to version 6 systems", () => {
  fresh(109); const prior=JSON.parse(W.serialize()); prior.v=4;
  delete prior.S.dao; delete prior.S.disciples; delete prior.S.beasts; delete prior.S.fieldNotes; delete prior.S.fieldcraft; delete prior.S.faction;
  delete prior.S.factionRep; delete prior.S.research; delete prior.S.factionMissions;
  assert.ok(W.load(JSON.stringify(prior))); assert.strictEqual(W.S.dao.path,null); assert.deepStrictEqual(W.S.disciples,[]); assert.deepStrictEqual(W.S.beasts,[]); assert.deepStrictEqual(W.S.fieldcraft,{});
  assert.strictEqual(JSON.parse(W.serialize()).v,6);
  const prior5=JSON.parse(W.serialize()); prior5.v=5; delete prior5.S.fieldcraft;
  assert.ok(W.load(JSON.stringify(prior5))); assert.deepStrictEqual(W.S.fieldcraft,{});
});
test("field research methods spend insight once and provide concrete gameplay effects", () => {
  fresh(111); W.S.research=9;
  assert.ok(W.unlockFieldcraft("trail").ok); const afterOne=W.S.research;
  assert.strictEqual(W.unlockFieldcraft("trail").ok,false); assert.strictEqual(W.S.research,afterOne);
  assert.ok(W.unlockFieldcraft("forager").ok); assert.ok(W.unlockFieldcraft("weakness").ok); assert.ok(W.unlockFieldcraft("warding").ok);
  assert.strictEqual(W.S.research,0);
  const beforeFlee=W.fleeChance(); W.S.fieldcraft.trail=false; const withoutTrail=W.fleeChance(); W.S.fieldcraft.trail=true;
  assert.ok(Math.abs((beforeFlee-withoutTrail)-.08)<1e-9);
  W.S.root.el="Fire"; W.S.fieldcraft.weakness=false; W.startDuel("archespore"); const base=W.power(); W.S.fieldcraft.weakness=true;
  assert.strictEqual(W.power(),base+2);
  W.S.duel=null; W.startDuel("bandit"); assert.strictEqual(W.S.duel.shield,3);
});
test("Forager's Atlas improves herb yield from field research and survives save/load", () => {
  fresh(112); W.S.place="forest"; W.S.research=2; assert.ok(W.unlockFieldcraft("forager").ok);
  const before=W.S.herbs; assert.ok(W.studyField().ok); assert.strictEqual(W.S.herbs,before+2);
  const json=W.serialize(); W.set({phase:"birth"}); assert.ok(W.load(json)); assert.ok(W.S.fieldcraft.forager); assert.strictEqual(JSON.parse(W.serialize()).v,6);
});
test("procedural SVG art provides every existing place and foe with original vector artwork", () => {
  const art=require("./art.js");
  for(const p of W.PLACES) assert.ok(art.scene(p.id,"Water",3).startsWith("<svg"),"missing scene: "+p.id);
  for(const f of Object.keys(W.FOES)) assert.ok(art.foe(f).includes("<svg"),"missing foe: "+f);
  for(const el of Object.keys(art.ELEMENT)) assert.ok(art.hero(el).includes("<svg"),"missing hero: "+el);
});
test("field research and faction save data persist without damaging the base life state", () => {
  fresh(110); W.S.place="sect"; W.S.stones=400; W.joinFaction("azure"); W.recruitDisciple("scholar");
  const original={dao:W.S.dao,disciples:W.S.disciples, faction:W.S.faction,rep:W.S.factionRep};
  const json=W.serialize(); W.set({phase:"birth"}); assert.ok(W.load(json));
  assert.deepStrictEqual(W.S.dao,original.dao); assert.deepStrictEqual(W.S.disciples,original.disciples); assert.strictEqual(W.S.faction,original.faction); assert.deepStrictEqual(W.S.factionRep,original.rep);
});

console.log(`\n${pass}/${pass + fail} passed`); process.exit(fail ? 1 : 0);

// Balance simulator: node sim.js [lives]
// Deterministic (the engine's seeded RNG). Compares simple "player" policies so we can see whether
// engaging with the game's systems actually beats just meditating. It is NOT a substitute for human playtesting.
const W = require(process.env.ENGINE || "../engine.js"), N = +process.argv[2] || 400;
const fresh = (seed, o) => { W.set({ phase: "birth" }, { fate: 0, lives: 0, best: 0, up: {}, seen: {} }); W.startLife(o, seed); };

// How a policy fights: counter the foe's last stance (foes tend to repeat), use Technique only if we have one.
function duelStep() {
  const S = W.S, d = S.duel, hasTech = S.techs.some(id => W.TECH.find(t => t.id === id).d > 0);
  const c = d.foeLast === null ? 0 : [1, 2, 0][d.foeLast];
  const st = c === 2 && !hasTech ? 0 : c;
  // retreat from a fight we are clearly losing
  const hit = Math.ceil(d.p / 2); if (S.body > hit && S.body <= hit * 2 && d.hp > d.max * .4 && W.flee().ok) return; // retreat while a failed escape is survivable
  if (!W.duelMove(st).ok) W.duelMove(0);
}
const heal = () => { const S = W.S; if (S.pills.body) return W.usePill("body"); if (S.place !== "village") return W.travel("village"); return W.act(1); };
// Value of an option in rough qi-equivalents (what a thoughtful player would weigh): rewards minus danger.
function value(o) { const S = W.S; return o[2].reduce((a, [p, , f]) => a + p * ((f.q || 0) + (f.s || 0) * .25 + (f.r || 0) * 2 + (f.m || 0) * 10 + (f.l || 0) * 4 + (f.t || 0) * 15 + (f.h || 0) * 5 + (f.pill ? 25 : 0) + (f.b > 0 ? Math.min(f.b, W.maxBody() - S.body) * .5 : 0)), 0) - danger(o) * 1.2; }
const pickBest = (S, min) => { const ev = W.evDef(); if (!ev) return null; let best = -1, bv = min; ev.o.forEach((o, i) => { if (o[1] <= S.stones) { const v = value(o); if (v > bv) { bv = v; best = i; } } }); return best >= 0 ? best : null; };
const pickSafe = (S, cap) => { const ev = W.evDef(); if (!ev) return null; let best = -1, bd = 1e9; ev.o.forEach((o, i) => { if (o[1] <= S.stones && W.risk(o[2])[1] <= cap) { const d = danger(o); if (d < bd) { bd = d; best = i; } } }); return best >= 0 ? best : null; };

// Rough danger of an option, in "body points lost" terms: death counts as 100, a duel as 18 (30 with no combat technique).
function danger(o) {
  const S = W.S, noTech = !S.techs.some(id => W.TECH.find(t => t.id === id).d > 0), duelCost = noTech ? 30 : 18;
  return o[2].reduce((a, [p, , f]) => a + p * (f.d ? 100 : f.duel ? duelCost : f.b < 0 ? -f.b : 0) - p * ((f.s || 0) * .05 + (f.q || 0) * .1 + (f.r || 0) * .5 + (f.t || 0) * 6), 0) + o[1] * .05;
}
// A forced event (a disturbance during seclusion) must be answered. Cautious players take the least dangerous affordable option; bold ones the first.
function settle(brave) {
  const S = W.S, ev = W.evDef(); if (!ev) return W.seclude(0);
  const order = ev.o.map((o, i) => ({ i, o })).filter(x => x.o[1] <= S.stones);
  if (!order.length) return W.choose(0);
  if (!brave) order.sort((a, b) => danger(a.o) - danger(b.o));
  return W.choose(order[0].i);
}
const POL = {
  // never touches events, shops or alchemy: pure meditation
  idle() { const S = W.S; if (S.qi >= 100) return W.breakthrough(); if (S.body < W.maxBody() / 3) return heal(); return W.seclude(3); },
  // the test-suite bot: sometimes takes low-risk event choices
  careful() { const S = W.S; if (S.pills.body && S.body < W.maxBody() / 2) return W.usePill("body"); if (S.body < W.maxBody() / 3) return heal();
    if (S.qi >= 100) return W.breakthrough(); if (W.rnd() < .5) { const i = pickSafe(S, "r2"); if (i !== null) return W.choose(i); } return W.seclude(3); },
  // always takes the first affordable option
  bold() { const S = W.S; if (S.qi >= 100) return W.breakthrough(); const ev = W.evDef(); if (ev && W.rnd() < .7) { const i = ev.o.findIndex(o => o[1] <= S.stones); return W.choose(i >= 0 ? i : 0); } return W.seclude(3); },
  // uses the whole kit with a budget so it cannot loop: technique first, herbs and pills before breakthroughs, safe events
  planner(S0, ctx) { const S = W.S;
    if (S.body < W.maxBody() * .7) return heal();
    if (S.qi >= 100) { if (S.pills.bt && S.btBonus < .3) return W.usePill("bt"); if (S.herbs >= 4 && S.realm >= 1 && ctx.brewTries < 6) { ctx.brewTries++; return W.brew("bt"); } ctx.brewTries = 0; return W.breakthrough(); }
    if (S.pills.qi && S.qi <= 65) return W.usePill("qi");
    const want = ["breath", "flame", "dao", "fist"].find(id => !S.techs.includes(id)), t = want && W.TECH.find(x => x.id === want);
    if (t && ctx.shop < 12 && S.stones >= t.cost + 8 && S.realm >= t.min && S.rep >= t.rep) { ctx.shop++; return S.place !== "sect" ? W.travel("sect") : W.learn(want); }
    if (t && ctx.shop < 12 && S.place === "sect" && S.rep < t.rep && S.realm >= t.min) { ctx.shop++; return W.act(0); }
    if (S.realm >= 1 && S.herbs < 4 && ctx.farm < 10 && S.qi < 80) { ctx.farm++; return S.place !== "forest" ? W.travel("forest") : W.act(0); }
    if (S.herbs >= 2 && S.qi < 80 && ctx.brewTries < 6) { ctx.brewTries++; return W.brew("qi"); }
    if (S.stones < 50 && S.stones < 80 && ctx.work < 8 && S.realm === 0) { ctx.work++; return S.place !== "village" ? W.travel("village") : W.act(0); }
    { const i = pickBest(S, 6); if (i !== null) return W.choose(i); }
    return W.seclude(3); } };

// ---- Per-path balance check: node tools/sim.js 3000 paths ----
// Every path plays the same "planner" bot plus what a thoughtful player of that path would add, so differences come from the paths.
// "none" is the control (no Dao path chosen). A bot is not a human: treat this as a smoke-level balance signal.
const PATHS = ["sword", "alchemy", "body", "formation", "shadow"];
function daoDuelStep() { // spend the once-per-duel ability at the start of a fight, or when hurt
  const S = W.S, d = S.duel;
  if (S.dao && S.dao.path && !d.pathUsed) {
    const p = S.dao.path, hurt = S.body < W.maxBody() * .6;
    if (p === "sword" || p === "formation" || hurt || (p === "alchemy" && S.qi < 70)) W.useDaoAbility();
  }
  duelStep();
}
function pathPolicy(path) {
  return function (S0, ctx) {
    const S = W.S;
    if (path && S.realm >= 1 && !(S.dao && S.dao.path)) W.chooseDaoPath(path);
    if (S.dao && S.dao.path && !S.dao.usedEvent && W.evDef() && !S.forced) W.useDaoAbility(); // the free once-per-event effect
    if (path === "formation" && S.dao && S.dao.path && (S.disciples || []).length < 2 && ctx.recruit < 6) { // formation wants trained support
      const have = (S.disciples || []).length, cost = 25 + have * 12;
      if (S.stones >= cost + 10) { ctx.recruit++; return S.place !== "sect" ? W.travel("sect") : W.recruitDisciple(["guard", "scholar"][have]); }
    }
    return POL.planner(S0, ctx);
  };
}
function runPath(path, n, seed0) {
  const pol = pathPolicy(path), rs = [], ages = [], gains = []; let duels = 0, wins = 0, alive = 0;
  for (let s = 1; s <= n; s++) {
    fresh(seed0 + s, s % 3); const ctx = { shop: 0, farm: 0, brewTries: 0, work: 0, recruit: 0 }; let k = 0, lastRealm = 0, inDuel = false;
    while (W.S.phase === "life" && k++ < 6000) {
      if (W.S.realm !== lastRealm) { lastRealm = W.S.realm; ctx.shop = 0; ctx.farm = 0; ctx.brewTries = 0; ctx.work = 0; ctx.recruit = 0; }
      if (W.S.duel) { if (!inDuel) { inDuel = true; duels++; } daoDuelStep(); }
      else { inDuel = false; if (W.S.forced) settle(false); else { const r = pol(null, ctx); if (r && !r.ok) W.seclude(3); } }
    }
    if (W.S.phase === "life") { alive++; continue; }
    const d = W.S.dead; rs.push(d.win ? 6 : d.realm); ages.push(d.age); gains.push(d.gain); wins += W.S.wins || 0;
  }
  const m = (a) => a.reduce((x, y) => x + y, 0) / a.length, pct = (k) => rs.filter(r => r >= k).length / rs.length * 100;
  return { path: path || "none", n: rs.length, qi: pct(1), found: pct(2), core: pct(3), nasc: pct(4), soul: pct(5), asc: pct(6), fate: m(gains), age: m(ages), duelWin: duels ? wins / duels * 100 : 0, alive };
}
function runPaths(n, seed0) {
  const rows = [runPath(null, n, seed0), ...PATHS.map(p => runPath(p, n, seed0))], real = rows.slice(1);
  const mean = (k) => real.reduce((a, r) => a + r[k], 0) / real.length, f = (v, w, d) => v.toFixed(d === undefined ? 1 : d).padStart(w);
  console.log(`Lives per row: ${n} (same seeds for every row). Ascension band allowed: 75% to 125% of the mean of the five paths.\n`);
  console.log("path      Qi%   Found%  Core%  Nasc%  Soul%   Asc%  vs mean | fate/life  age  duel wins%");
  const meanAsc = mean("asc");
  for (const r of rows) {
    const ratio = r.path === "none" ? "  (control)" : f(r.asc / meanAsc * 100, 7, 0) + "%" + (r.asc / meanAsc < .75 || r.asc / meanAsc > 1.25 ? "  OUT" : "");
    console.log(`${r.path.padEnd(9)} ${f(r.qi, 4, 0)}  ${f(r.found, 6, 0)}  ${f(r.core, 5, 0)}  ${f(r.nasc, 5, 0)}  ${f(r.soul, 5, 0)}  ${f(r.asc, 5)}  ${ratio.padEnd(14)} | ${f(r.fate, 8)}  ${f(r.age, 4, 0)}  ${f(r.duelWin, 6, 0)}${r.alive ? "  (still alive: " + r.alive + ")" : ""}`);
  }
  const ratios = real.map(r => r.asc / meanAsc), fates = real.map(r => r.fate / mean("fate"));
  console.log(`\nMean ascension of the five paths: ${meanAsc.toFixed(2)}%. Spread of ascension vs mean: ${Math.round(Math.min(...ratios) * 100)}% to ${Math.round(Math.max(...ratios) * 100)}%. Spread of fate/life vs mean: ${Math.round(Math.min(...fates) * 100)}% to ${Math.round(Math.max(...fates) * 100)}%.`);
  const out = real.filter(r => r.asc / meanAsc < .75 || r.asc / meanAsc > 1.25).map(r => r.path);
  console.log(out.length ? "RESULT: OUT OF BAND: " + out.join(", ") : "RESULT: all five paths are inside the 75-125% band.");
  return out;
}

module.exports = { POL, duelStep, settle, fresh, W, danger, value, pickBest, heal, PATHS, pathPolicy, runPath, runPaths };
if (require.main === module && process.argv[3] === "paths") runPaths(N, +process.argv[4] || 9000);
else if (require.main === module) {
for (const name in POL) {
  const rs = [], ages = [], gains = []; const cause = {}; let early = 0, alive = 0;
  for (let s = 1; s <= N; s++) {
    fresh(5000 + s, s % 3); const ctx = { shop: 0, farm: 0, brewTries: 0, work: 0 }; let n = 0, lastRealm = 0;
    while (W.S.phase === "life" && n++ < 6000) { if (W.S.realm !== lastRealm) { lastRealm = W.S.realm; ctx.shop = 0; ctx.farm = 0; ctx.brewTries = 0; ctx.work = 0; }
      if (W.S.duel) duelStep(); else if (W.S.forced) settle(name === "bold"); else { const r = POL[name](null, ctx); if (r && !r.ok) W.seclude(3); } }
    if (W.S.phase === "life") { alive++; continue; }
    const d = W.S.dead; rs.push(d.win ? 6 : d.realm); ages.push(d.age); gains.push(d.gain); if (d.age < 30) early++;
    const c = d.cause.split(" ").slice(0, 3).join(" "); cause[c] = (cause[c] || 0) + 1; }
  const n = rs.length, pct = (k) => Math.round(rs.filter(r => r >= k).length / n * 100) + "%", mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const top = Object.entries(cause).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0] + " " + e[1]).join("; ");
  console.log(`${name.padEnd(8)} Qi ${pct(1).padStart(4)} Found ${pct(2).padStart(4)} Core ${pct(3).padStart(4)} Nasc ${pct(4).padStart(4)} Soul ${pct(5).padStart(4)} Asc ${pct(6).padStart(4)} | fate/life ${mean(gains).toFixed(1).padStart(5)} | age ${Math.round(mean(ages)).toString().padStart(3)} | <30 ${Math.round(early / n * 100)}%${alive ? " | still alive " + alive : ""} | ${top}`);
}
if (process.argv[3] === "events") {
  console.log("\nEvents available per realm (any place / village / sect / ruins / peak / forest):");
  for (let r = 0; r <= 5; r++) { const f = (p) => W.EV.filter(e => r >= e.min && r <= e.max && (!e.pl || e.pl === p)).length; console.log(`  ${W.R[r][0].padEnd(20)} ${W.EV.filter(e => r >= e.min && r <= e.max && !e.pl).length} / ${f("village")} / ${f("sect")} / ${f("ruins")} / ${f("peak")} / ${f("forest")}`); }
}
}

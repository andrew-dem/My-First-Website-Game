// Worldbound UI. All rules live in engine.js; this file only draws state and forwards clicks.
(() => {
"use strict";
const W = window.WB, KEY = "worldbound-v4", $ = (id) => document.getElementById(id);
let tab = "map", toastT, momentT;
const S = () => W.S, M = () => W.M;
const tag = (outs) => { const [t, c] = W.risk(outs); return `<span class="tag ${c}">${t}</span>`; };
const rn = (i) => W.R[i][0];

function art() {
  $("art").innerHTML = `<svg viewBox="0 0 640 250" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--bg1)"/><stop offset="1" stop-color="#d9b88a"/></linearGradient></defs>
  <rect width="640" height="250" fill="url(#sk)"/><circle cx="440" cy="80" r="26" fill="#fff4cf"/><circle cx="440" cy="80" r="44" fill="#fff4cf" opacity=".18"/>
  <path d="M0 170 L90 100 L170 150 L260 80 L350 160 L450 110 L560 165 L640 120 V250 H0Z" fill="#3b4f4c" opacity=".7"/>
  <path d="M0 210 L120 150 L220 200 L330 140 L450 205 L560 160 L640 200 V250 H0Z" fill="#14201f"/>
  <ellipse class="mist" cx="300" cy="190" rx="240" ry="14" fill="#cfe3dc" opacity=".25"/></svg>`;
}
function orb(qi) {
  return `<svg class="orb" viewBox="0 0 76 76"><circle class="o0" cx="38" cy="38" r="32"/><circle class="o1" cx="38" cy="38" r="32" transform="rotate(-90 38 38)" stroke-dasharray="${(qi * 2.01).toFixed(1)} 201"/><text x="38" y="43" text-anchor="middle">${qi}</text></svg>`;
}
function left() {
  const s = S(), life = s.phase !== "birth";
  $("app").dataset.realm = life ? s.realm : 0; $("app").classList.toggle("dead", s.phase === "dead");
  $("seal").textContent = life ? W.R[s.realm][1] : "凡";
  $("name").textContent = life ? s.name : "Worldbound";
  $("meta").textContent = life ? `${rn(s.realm)} · Age ${s.age} of ${s.lifespan} · Life ${M().lives + (s.phase === "dead" ? 0 : 1)}` : `Fate ${M().fate} · Lives lived ${M().lives}`;
  $("ladder").innerHTML = W.R.map((r, i) => `<i class="${life && i < s.realm ? "done" : life && i === s.realm ? "now" : ""}" title="${r[0]}">${r[1]}</i>`).join("");
  if (!life) { $("vitals").innerHTML = ""; $("kit").innerHTML = `<h3>Best realm reached</h3><p class="dim">${W.R[Math.min(5, M().best)][0]}${M().best > 5 ? " (ascended)" : ""}</p>`; return; }
  const mb = W.maxBody(), o = W.ORIGINS.find(x => x.id === s.origin);
  $("vitals").innerHTML = `<div class="qi">${orb(s.qi)}Qi</div><div class="bars">
    <div>Body ${s.body}/${mb}<div class="bar"><span style="width:${s.body / mb * 100}%"></span></div></div>
    <div>Lifespan ${s.age}/${s.lifespan}<div class="bar life"><span style="width:${Math.min(100, s.age / s.lifespan * 100)}%"></span></div></div></div>
    <div class="chips"><div>Mind<b>${s.mind}</b></div><div>Luck<b>${s.luck}</b></div><div>Stones<b>${s.stones}</b></div><div>Standing<b>${s.rep}</b></div></div>`;
  $("kit").innerHTML = `<h3>${o.n}</h3><p class="dim">${s.root.n} (${s.root.el}) ×${s.root.mult} · ${W.ELFX[s.root.el]}</p>
    <h3>Techniques</h3><p class="dim">${s.techs.length ? s.techs.map(id => W.TECH.find(t => t.id === id).n).join(", ") : "None yet. Study at the sect or find a master."}</p>
    <h3>Pack</h3><p class="dim">${s.herbs} herbs · ${Object.keys(s.pills).map(k => s.pills[k] ? `${s.pills[k]} ${W.RECIPES[k].n}` : "").filter(Boolean).join(", ") || "no pills"}${s.btBonus ? " · breakthrough boost ready" : ""}</p>
    <h3>Rival</h3><p class="dim">${s.rival.n} · power ${s.rival.p} · defeated ${s.rival.beaten}/2 · you ${W.power()}</p>`;
}
function center() {
  const s = S(), c = $("card"), ch = $("choices"), ac = $("actions"), note = s.note ? `<p class="note">${s.note}</p>` : "";
  let keys = "";
  if (s.phase === "birth") {
    c.innerHTML = `<h2>Choose your birth</h2><p>Who were you before the path found you? Your spirit root is drawn by fate.</p>`; c.dataset.g = "生";
    ch.innerHTML = W.ORIGINS.map((o, i) => `<button class="choice" data-do="origin:${i}"><span>${o.n}<small>${o.x} ${o.fx}</small></span></button>`).join(""); ac.innerHTML = ""; keys = "Press 1, 2 or 3";
  } else if (s.phase === "dead") {
    const d = s.dead; c.dataset.g = d.win ? "升" : "终";
    c.innerHTML = `<h2>${d.win ? "You ascended" : "Your life ended"}</h2><p>${s.name} ${d.cause} at age ${d.age}, having reached ${rn(d.realm)}. You carry <b>${d.gain} fate</b> into your next life.</p>`;
    ch.innerHTML = ""; ac.innerHTML = `<button class="act go" data-do="next">Begin a new life</button>`; tab = "fate"; keys = "Press Enter";
  } else if (s.duel) {
    const d = s.duel, last = d.last === null ? "" : `<p class="note">You used ${W.STANCES[d.last]}; ${d.n} used ${W.STANCES[d.foeLast]}.</p>`;
    c.dataset.g = "斗"; c.innerHTML = `<h2>Duel: ${d.n}</h2><p>Power ${d.p} · Foe health ${Math.max(0, d.hp)}/${d.max} · Your body ${s.body}/${W.maxBody()} · Round ${d.round}</p>
      <div class="bar foe"><span style="width:${Math.max(0, d.hp) / d.max * 100}%"></span></div>${last}<p class="dim">Guard beats Strike. Technique beats Guard. Strike beats Technique. Foes tend to repeat themselves.</p>${note}`;
    const tech = s.techs.some(id => W.TECH.find(t => t.id === id).d > 0);
    ch.innerHTML = [["Strike", "Beats Technique. Solid damage."], ["Guard", "Beats Strike. Counter and recover 1 Body."], ["Technique", tech ? "Beats Guard. Heavy damage." : "Needs a combat technique."]].map((x, i) =>
      `<button class="choice" data-do="move:${i}" ${i === 2 && !tech ? "disabled" : ""}><span>${x[0]}<small>${x[1]}</small></span></button>`).join("");
    ac.innerHTML = `<button class="act" data-do="flee">Flee</button>`; keys = "1 Strike · 2 Guard · 3 Technique · F flee";
  } else {
    const e = W.evDef(); c.dataset.g = W.R[s.realm][1]; c.innerHTML = `<h2>${e.t}</h2><p>${e.x}</p>${note}`;
    ch.innerHTML = e.o.map((o, i) => `<button class="choice" data-do="choose:${i}" ${s.stones < o[1] ? "disabled" : ""}><span>${o[0]}${o[1] ? `<small>Costs ${o[1]} stones</small>` : ""}</span>${tag(o[2])}</button>`).join("");
    ac.innerHTML = (s.qi >= 100 ? `<button class="act go" data-do="bt">${s.realm === 5 ? "Ascend" : "Break through to " + rn(s.realm + 1)} (${Math.round(W.chance() * 100)}%)</button>` : "") +
      `<button class="act" data-do="seclude:3">Seclude 3 years</button><button class="act" data-do="seclude:10">Seclude 10 years</button>`;
    keys = "1-4 choose · S seclude 3 · D seclude 10 · B break through · M/A/J/F tabs";
  }
  $("keys").textContent = keys;
}
function panel() {
  const s = S(), life = s.phase === "life", names = { map: "Map", alch: "Alchemy", log: "Journal", fate: "Fate" };
  if (!life && tab !== "fate" && tab !== "log") tab = "fate";
  $("tabs").innerHTML = Object.keys(names).map(k => `<button role="tab" class="${tab === k ? "on" : ""}" data-tab="${k}" ${!life && (k === "map" || k === "alch") ? "disabled" : ""}>${names[k]}</button>`).join("");
  let h = "";
  if (tab === "map" && life) {
    h = `<div class="places">` + W.PLACES.map(p => `<button class="place ${p.id === s.place ? "here" : ""}" data-do="travel:${p.id}" ${p.id === s.place || s.realm < p.min || s.duel ? "disabled" : ""}><b>${p.n}</b><small>${p.x}</small><em>${p.id === s.place ? "You are here" : s.realm < p.min ? "Needs " + rn(p.min) : "Travel · " + p.cost + " stones · 1 year"}</em></button>`).join("") + `</div>`;
    const here = W.PLACES.find(p => p.id === s.place); h += `<h3>At ${here.n}</h3>` + here.acts.map((a, i) => `<button class="choice sm" data-do="act:${i}" ${s.stones < Math.max(a[1], /Buy/.test(a[0]) ? 8 : 0) || s.duel ? "disabled" : ""}><span>${a[0]}${a[1] ? `<small>Costs ${a[1]} stones</small>` : /Buy/.test(a[0]) ? "<small>Costs 8 stones</small>" : ""}</span>${tag(a[2])}</button>`).join("");
    if (here.id === "sect") h += `<h3>Techniques for sale</h3>` + W.TECH.map(t => { const own = s.techs.includes(t.id), why = own ? "Known" : s.realm < t.min ? "Needs " + rn(t.min) : s.rep < t.rep ? "Needs standing " + t.rep : t.cost + " stones";
      return `<button class="choice sm" data-do="learn:${t.id}" ${own || s.realm < t.min || s.rep < t.rep || s.stones < t.cost || s.duel ? "disabled" : ""}><span>${t.n}<small>${t.x}</small></span><span class="tag">${why}</span></button>`; }).join("");
  } else if (tab === "alch" && life) {
    h = `<p class="dim">Spirit herbs: <b>${s.herbs}</b>. Gather them in the forest or buy them at the market. Brewing takes 1 year.</p>` + Object.keys(W.RECIPES).map(k => { const r = W.RECIPES[k], lock = s.realm < r.min ? "Needs " + rn(r.min) : s.herbs < r.herbs ? "Needs " + r.herbs + " herbs" : "";
      return `<button class="choice sm" data-do="brew:${k}" ${lock || s.duel ? "disabled" : ""}><span>${r.n}<small>${r.x} · ${r.herbs} herbs · ${lock || Math.round(W.brewChance(k) * 100) + "% success"}</small></span></button>`; }).join("") +
      `<h3>Pills</h3>` + Object.keys(s.pills).map(k => `<button class="choice sm" data-do="pill:${k}" ${s.pills[k] ? "" : "disabled"}><span>${W.RECIPES[k].n} ×${s.pills[k]}<small>${W.RECIPES[k].x}</small></span></button>`).join("");
  } else if (tab === "log") {
    h = s.log && s.log.length ? `<ol class="memoir">${s.log.slice(0, 25).map(l => `<li><b>Age ${l.age}</b>${l.text}</li>`).join("")}</ol>` : `<p class="dim">Nothing yet.</p>`;
  } else {
    h = `<p class="dim">Fate: <b>${M().fate}</b>. Upgrades apply to every future life.</p>` + W.UPGRADES.map(u => { const l = M().up[u.id] || 0, max = u.cost.length;
      return `<button class="choice sm" data-do="buy:${u.id}" ${l >= max || M().fate < u.cost[l] ? "disabled" : ""}><span>${u.n} ${"●".repeat(l)}${"○".repeat(max - l)}<small>${u.x}</small></span><span class="tag">${l >= max ? "Max" : u.cost[l] + " fate"}</span></button>`; }).join("");
  }
  $("panel").innerHTML = h;
}
function render() { left(); center(); panel(); try { localStorage.setItem(KEY, W.serialize()); } catch (_) {} }
function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2200); }
function moment(kind, g, t, sub) { const m = $("moment"); m.className = "moment " + kind; m.innerHTML = `<div class="ring"></div><b>${g}</b><h2>${t}</h2><p>${sub}</p>`; m.hidden = false; clearTimeout(momentT); momentT = setTimeout(() => { m.hidden = true; }, 2600); }
$("moment").onclick = () => { $("moment").hidden = true; };

const run = {
  origin: (i) => { const r = W.startLife(+i); tab = "map"; return r; }, next: () => { W.toBirth(); tab = "fate"; return { ok: true }; },
  choose: (i) => W.choose(+i), act: (i) => W.act(+i), travel: (id) => W.travel(id), learn: (id) => W.learn(id), brew: (k) => W.brew(k), pill: (k) => W.usePill(k),
  seclude: (n) => W.seclude(+n), bt: () => W.breakthrough(), move: (i) => W.duelMove(+i), flee: () => W.flee(), buy: (id) => W.buyUpgrade(id) };
function go(spec) {
  const [k, arg] = spec.split(":"), s0 = S(), realm = s0.realm, was = s0.phase;
  const r = run[k](arg); if (!r.ok) { toast(r.msg); return; }
  render(); const s = S();
  if (s.phase === "dead" && was !== "dead") s.dead.win ? moment("up", "升", "Ascension", `${s.name} leaves this world behind.`) : moment("end", "终", "Your life ends", `${s.name} ${s.dead.cause}.`);
  else if (s.phase === "life" && was === "life" && s.realm > realm) moment("up", W.R[s.realm][1], rn(s.realm), "Breakthrough");
}
document.addEventListener("click", (e) => { const t = e.target.closest("[data-tab]"); if (t && !t.disabled) { tab = t.dataset.tab; render(); return; }
  const d = e.target.closest("[data-do]"); if (d && !d.disabled) go(d.dataset.do); });
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key.toLowerCase(), s = S(); let spec = null;
  if (s.phase === "birth" && "123".includes(k) && k) spec = "origin:" + (+k - 1);
  else if (s.phase === "dead" && k === "enter") spec = "next";
  else if (s.phase === "life" && s.duel) { if ("123".includes(k) && k) spec = "move:" + (+k - 1); else if (k === "f") spec = "flee"; }
  else if (s.phase === "life") { if ("1234".includes(k) && k) spec = "choose:" + (+k - 1); else if (k === "s") spec = "seclude:3"; else if (k === "d") spec = "seclude:10"; else if (k === "b") spec = "bt"; }
  const tabs = { m: "map", a: "alch", j: "log" }; if (!spec && s.phase === "life" && tabs[k]) { tab = tabs[k]; render(); return; } if (!spec && k === "f") { tab = "fate"; render(); return; }
  if (spec) { e.preventDefault(); go(spec); } });
$("wipe").onclick = () => { if (confirm("Erase all progress and fate?")) { W.set({ phase: "birth" }, { fate: 0, lives: 0, best: 0, up: {} }); tab = "fate"; render(); } };

try { const raw = localStorage.getItem(KEY); if (!raw || !W.load(raw)) { const old = localStorage.getItem("worldbound-v3"); if (old) { const d = JSON.parse(old); W.migrateV3(JSON.stringify(d)); } } } catch (_) {}
if (S().phase === "birth") tab = "fate";
art(); render();
window.WBUI = { render, go };
})();

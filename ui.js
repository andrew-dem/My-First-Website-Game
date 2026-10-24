// Worldbound v5 UI. Rules remain in engine.js; this file only presents state and forwards actions.
(() => {
"use strict";
const W = window.WB, A = window.WBArt, KEY = "worldbound-v6", $ = (id) => document.getElementById(id);
let tab = "map", toastT, momentT;
const S = () => W.S, M = () => W.M;
const esc = (x) => String(x ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const tag = (outs) => { const [t, c] = W.risk(outs); return `<span class="tag ${c}">${t}</span>`; };
const rn = (i) => W.R[i][0];
const traits = (t, s) => [t.weak && "Weak to " + t.weak + (s && (s.root.el === t.weak || (t.weak === "Fire" && s.techs.includes("flame"))) ? " (you have it)" : ""),
  t.armor && "Armored (Technique pierces)", t.regen && "Regenerates", t.charge && "Charges", t.drain && "Drains qi"].filter(Boolean).join(" · ");
const pathDef = (id) => W.DAO_PATHS.find(p => p.id === id);
const roleDef = (id) => W.DISCIPLE_ROLES.find(p => p.id === id);
const factionDef = (id) => W.FACTIONS.find(p => p.id === id);
const beastDef = (id) => W.BEAST_BONDS[id];

function art() {
  const s = S(), place = s.place || "village", el = (s.root && s.root.el) || "Metal", realm = s.realm || 0;
  const scene = A && A.scene ? A.scene(place, el, realm) : "";
  const hero = A && A.hero && s.phase !== "birth" ? `<div class="hero-stamp">${A.hero(el)}</div>` : "";
  $("art").innerHTML = scene + hero;
}
function orb(qi) {
  return `<svg class="orb" viewBox="0 0 76 76"><circle class="o0" cx="38" cy="38" r="32"/><circle class="o1" cx="38" cy="38" r="32" transform="rotate(-90 38 38)" stroke-dasharray="${(qi * 2.01).toFixed(1)} 201"/><text x="38" y="43" text-anchor="middle">${qi}</text></svg>`;
}
function discipleWeight(role) { return (S().disciples || []).filter(d => d.role === role).reduce((a,d) => a + (d.level || 1), 0); }
function left() {
  const s = S(), meta = M(), living = s.phase !== "birth";
  $("app").dataset.realm = living ? s.realm : 0; $("app").dataset.element = living && s.root ? s.root.el.toLowerCase() : "metal";
  $("app").classList.toggle("dead", s.phase === "dead");
  $("seal").textContent = living ? W.R[s.realm][1] : "凡";
  $("name").textContent = living ? s.name : "Worldbound";
  $("meta").textContent = living ? `${rn(s.realm)} · Age ${s.age} of ${s.lifespan} · Life ${meta.lives + (s.phase === "dead" ? 0 : 1)}` : `Fate ${meta.fate} · Lives lived ${meta.lives}`;
  $("ladder").innerHTML = W.R.map((r, i) => `<i class="${living && i < s.realm ? "done" : living && i === s.realm ? "now" : ""}" title="${r[0]}">${r[1]}</i>`).join("");
  if (!living) { $("vitals").innerHTML = ""; $("kit").innerHTML = `<h3>Best realm reached</h3><p class="dim">${W.R[Math.min(5, meta.best)][0]}${meta.best > 5 ? " (ascended)" : ""}</p><h3>Bestiary</h3><p class="dim">${Object.keys(meta.seen || {}).filter(k => meta.seen[k]).length}/${Object.keys(W.FOES).length} creatures recorded</p>`; return; }
  const mb = W.maxBody(), o = W.ORIGINS.find(x => x.id === s.origin) || W.ORIGINS[0], p = s.dao && pathDef(s.dao.path);
  $("vitals").innerHTML = `<div class="qi">${orb(s.qi)}Qi</div><div class="bars">
    <div>Body ${s.body}/${mb}<div class="bar"><span style="width:${Math.max(0,Math.min(100,s.body / mb * 100))}%"></span></div></div>
    <div>Lifespan ${s.age}/${s.lifespan}<div class="bar life"><span style="width:${Math.min(100, s.age / s.lifespan * 100)}%"></span></div></div></div>
    <div class="chips"><div>Mind<b>${s.mind}</b></div><div>Luck<b>${s.luck}</b></div><div>Stones<b>${s.stones}</b></div><div>Standing<b>${s.rep}</b></div></div>`;
  const disciples = (s.disciples || []).length, beasts = (s.beasts || []).length;
  $("kit").innerHTML = `<h3>${o.n}</h3><p class="dim">${s.root.n} (${s.root.el}) ×${s.root.mult} · ${W.ELFX[s.root.el]}</p>
    <h3>Dao path</h3><p class="dim">${p ? `${p.glyph} ${p.n} · mastery ${W.pathMastery(p.id)}/5` : "Unchosen · reach Qi Condensation to choose"}</p>
    <h3>Techniques</h3><p class="dim">${s.techs.length ? s.techs.map(id => (W.TECH.find(t => t.id === id) || {n:id}).n).join(", ") : "None yet. Study at the sect or find a master."}</p>
    <h3>Pack</h3><p class="dim">${s.herbs} herbs · ${Object.keys(s.pills).map(k => s.pills[k] ? `${s.pills[k]} ${W.RECIPES[k].n}` : "").filter(Boolean).join(", ") || "no pills"}${s.btBonus ? " · breakthrough boost ready" : ""}</p>
    <h3>Retinue</h3><p class="dim">${disciples}/3 disciples · ${beasts}/2 spirit beasts</p>
    <h3>Affiliation</h3><p class="dim">${s.faction ? (factionDef(s.faction) || {n:s.faction}).n : "Unaffiliated"}</p>
    <h3>Rival</h3><p class="dim">${s.rival.n} · power ${s.rival.p} · defeated ${s.rival.beaten}/2 · you ${W.power()}</p>`;
}
function dangerHint(outs) {
  const ids = [...new Set((outs || []).map(o => o && o[2] && o[2].duel).filter(Boolean))];
  if (!ids.length) return "";
  const s = S();
  const pieces = ids.map(id => {
    if (id === "rival") return `${s.rival.n} (~${Math.ceil(s.rival.p*.4)} Body/hit)`;
    const f = W.FOES[id]; if (!f) return id;
    const power = Math.round(f.p + (f.pr || 0) * s.realm), hit = Math.ceil(power*.4*(f.charge || 1));
    return `${f.n} (~${hit} Body/hit)`;
  });
  return `<small class="danger-hint">⚠ Possible duel: ${pieces.join(", ")}. Your current Body is ${s.body}.</small>`;
}
function center() {
  const s = S(), c = $("card"), ch = $("choices"), ac = $("actions"), note = s.note ? `<p class="note">${esc(s.note)}</p>` : "";
  let keys = "";
  if (s.phase === "birth") {
    c.innerHTML = `<h2>Choose your birth</h2><p>Who were you before the path found you? Your spirit root is drawn by fate. Each origin gives a different starting advantage.</p>`; c.dataset.g = "生";
    ch.innerHTML = W.ORIGINS.map((o, i) => `<button class="choice" data-do="origin:${i}"><span>${o.n}<small>${o.x} ${o.fx}</small></span></button>`).join(""); ac.innerHTML = ""; keys = "Press 1, 2 or 3";
  } else if (s.phase === "dead") {
    const d = s.dead; c.dataset.g = d.win ? "升" : "终";
    c.innerHTML = `<h2>${d.win ? "You ascended" : "Your life ended"}</h2><p>${esc(s.name)} ${esc(d.cause)} at age ${d.age}, having reached ${rn(d.realm)}. You carry <b>${d.gain} fate</b> into your next life.</p><p class="dim">Dao path: ${s.dao && pathDef(s.dao.path) ? pathDef(s.dao.path).n : "unselected"} · research notes: ${Object.keys(s.fieldNotes || {}).length} · disciples cultivated: ${(s.disciples || []).length}</p>`;
    ch.innerHTML = ""; ac.innerHTML = `<button class="act go" data-do="next">Begin a new life</button>`; tab = "fate"; keys = "Press Enter";
  } else if (s.duel) {
    const d = s.duel, last = d.last === null ? "" : `<p class="note">You used ${W.STANCES[d.last]}; ${d.n} used ${W.STANCES[d.foeLast]}. ${esc(d.msg)}</p>`, tr = traits(d, s);
    const f = W.FOES[d.kind], power = d.kind === "rival" ? d.p : d.p, hit = Math.ceil(power*.4*(d.charge || 1));
    const portrait = A && A.foe ? `<div class="duel-art">${A.foe(d.kind)}</div>` : "";
    c.dataset.g = "斗"; c.innerHTML = `${portrait}<h2>Duel: ${esc(d.n)}</h2><p>Power ${d.p} · Foe health ${Math.max(0, d.hp)}/${d.max} · Your Body ${s.body}/${W.maxBody()} · Round ${d.round}</p>
      <div class="bar foe"><span style="width:${Math.max(0, d.hp) / d.max * 100}%"></span></div>${tr ? `<p class="dim">${tr}</p>` : ""}<p class="danger-hint">Estimated incoming hit: about ${hit} Body before your guard, beast, or path effects. Estimated escape chance: ${Math.round(W.fleeChance()*100)}%. The Trail-Sense Method improves this chance.</p>${last}<p class="dim">Guard beats Strike. Technique beats Guard. Strike beats Technique. Foes tend to repeat themselves.</p>${note}`;
    const tech = s.techs.some(id => { const t=W.TECH.find(t => t.id===id); return t && t.d>0; });
    ch.innerHTML = [["Strike", "Beats Technique. Solid damage."], ["Guard", "Beats Strike. Counter and recover 1 Body."], ["Technique", tech ? "Beats Guard. Heavy damage." : "Needs a combat technique."]].map((x, i) =>
      `<button class="choice" data-do="move:${i}" ${i === 2 && !tech ? "disabled" : ""}><span>${x[0]}<small>${x[1]}</small></span></button>`).join("");
    const p = s.dao && pathDef(s.dao.path);
    ac.innerHTML = (p ? `<button class="act dao-act" data-do="dao" ${d.pathUsed ? "disabled" : ""}>${p.ability}${d.pathUsed ? " · spent" : " · once per duel"}</button>` : "") + `<button class="act" data-do="flee">Flee</button>`;
    keys = "1 Strike · 2 Guard · 3 Technique · F flee";
  } else {
    const e = W.evDef(); c.dataset.g = W.R[s.realm][1]; c.innerHTML = `<h2>${esc(e.t)}</h2><p>${esc(e.x)}</p>${note}`;
    ch.innerHTML = e.o.map((o, i) => `<button class="choice" data-do="choose:${i}" ${s.stones < o[1] ? "disabled" : ""}><span>${esc(o[0])}${o[1] ? `<small>Costs ${o[1]} stones</small>` : ""}${dangerHint(o[2])}</span>${tag(o[2])}</button>`).join("");
    const p = s.dao && pathDef(s.dao.path);
    const lock = s.forced ? "disabled" : ""; ac.innerHTML = (s.forced ? `<p class="dim lockmsg">Your seclusion was broken. Deal with this before you do anything else.</p>` : "") + (s.qi >= 100 ? `<button class="act go" data-do="bt" ${lock}>${s.realm === 5 ? "Ascend" : "Break through to " + rn(s.realm + 1)} (${Math.round(W.chance() * 100)}%)</button>` : "") +
      `<button class="act" data-do="seclude:3" ${lock}>Seclude 3 years</button><button class="act" data-do="seclude:10" ${lock}>Seclude 10 years</button>` +
      (p ? `<button class="act dao-act" data-do="dao" ${s.dao.usedEvent ? "disabled" : ""}>${p.ability}${s.dao.usedEvent ? " · spent this event" : " · use this event"}</button>` : "");
    keys = "1–4 choose · S seclude 3 · D seclude 10 · B break through · M/A/J/F tabs";
  }
  $("keys").textContent = keys;
}
function renderMap(s) {
  let h = `<div class="places">` + W.PLACES.map(p => `<button class="place ${p.id === s.place ? "here" : ""}" data-do="travel:${p.id}" ${p.id === s.place || s.realm < p.min || s.duel ? "disabled" : ""}><b>${p.n}</b><small>${p.x}</small><em>${p.id === s.place ? "You are here" : s.realm < p.min ? "Needs " + rn(p.min) : "Travel · " + p.cost + " stones · 1 year"}</em></button>`).join("") + `</div>`;
  const here = W.PLACES.find(p => p.id === s.place); h += `<h3>At ${here.n}</h3>` + here.acts.map((a, i) => `<button class="choice sm" data-do="act:${i}" ${s.stones < Math.max(a[1], /Buy/.test(a[0]) ? 8 : 0) || s.duel ? "disabled" : ""}><span>${a[0]}${a[1] ? `<small>Costs ${a[1]} stones</small>` : /Buy/.test(a[0]) ? "<small>Costs 8 stones</small>" : ""}</span>${tag(a[2])}</button>`).join("");
  h += `<button class="choice sm study-choice" data-do="study" ${s.duel || (s.fieldNotes && s.fieldNotes[s.place]) ? "disabled" : ""}><span>Study local traces<small>${s.fieldNotes && s.fieldNotes[s.place] ? "Main clues recorded for this life" : "Record environmental lore · gain insight and research"}</small></span><span class="tag">${s.fieldNotes && s.fieldNotes[s.place] ? "Recorded" : "Research"}</span></button>`;
  if (here.id === "sect") h += `<h3>Techniques for sale</h3>` + W.TECH.map(t => { const own = s.techs.includes(t.id), why = own ? "Known" : s.realm < t.min ? "Needs " + rn(t.min) : s.rep < t.rep ? "Needs standing " + t.rep : t.cost + " stones";
    return `<button class="choice sm" data-do="learn:${t.id}" ${own || s.realm < t.min || s.rep < t.rep || s.stones < t.cost || s.duel ? "disabled" : ""}><span>${t.n}<small>${t.x}</small></span><span class="tag">${why}</span></button>`; }).join("");
  return h;
}
function renderDao(s) {
  if (!s.dao || !s.dao.path) return `<p class="dim">At your first breakthrough, choose one Dao path. Each path offers a passive bonus, a once-per-encounter ability, and a weakness. Your path can change future lives, but not the current one.</p>` + W.DAO_PATHS.map(p => `<div class="system-card"><h3>${p.glyph} ${p.n}</h3><p>${p.passive}</p><small><b>Ability:</b> ${p.active}</small><small><b>Trade-off:</b> ${p.weakness}</small><button class="choice sm" data-do="path:${p.id}" ${s.realm < 1 || s.duel ? "disabled" : ""}><span>Commit to ${p.n}<small>${s.realm < 1 ? "Requires Qi Condensation" : "Permanent for this life"}</small></span></button></div>`).join("");
  const p = pathDef(s.dao.path), lvl = W.pathMastery(p.id);
  const used = s.duel ? !!s.duel.pathUsed : !!s.dao.usedEvent;
  return `<div class="system-card path-card"><h2>${p.glyph} ${p.n}</h2><p>${p.passive}</p><p><b>Mastery ${lvl}/5</b> · Path experience ${s.dao.xp || 0}</p><div class="meter"><span style="width:${lvl*20}%"></span></div><p><b>Active — ${p.ability}</b><br>${p.active}</p><p class="dim">${p.weakness}</p><p class="dim">The active ability refreshes for each new event or duel. Use it when it can change the outcome.</p><button class="choice sm" data-do="dao" ${used ? "disabled" : ""}><span>Use ${p.ability}<small>${s.duel ? (used ? "Already used this duel" : "Once this duel") : (used ? "Already used this event" : "Once this event")}</small></span></button></div>`;
}
function renderSect(s) {
  const here = s.place === "sect" && !s.duel, roles = W.DISCIPLE_ROLES;
  let h = `<p class="dim">Your retinue is limited to three disciples. Recruit specialists, train their rank, cultivate their realms, and assign a role. Rank, realm, loyalty, and morale contribute to role effectiveness; a balanced, well-supported team outperforms neglected specialists.</p>`;
  if (!here) h += `<p class="warning-line">Return to the Azure Cloud Sect to recruit, train, cultivate, or reassign your disciples.</p>`;
  h += `<h3>Recruit a disciple</h3>` + roles.map(r => `<button class="choice sm" data-do="recruit:${r.id}" ${!here || s.disciples.length>=3 || s.stones < 25+s.disciples.length*12 ? "disabled" : ""}><span>${r.n}<small>${r.x}</small></span><span class="tag">${25+s.disciples.length*12} stones</span></button>`).join("");
  h += `<h3>Your disciples (${s.disciples.length}/3)</h3>`;
  h += s.disciples.length ? s.disciples.map(d => {
    const rd=roleDef(d.role)||{n:d.role};
    const trainCost = Math.ceil((12 + d.level * 5) * (s.faction === "azure" ? .85 : 1));
    const cultivateCost = s.faction === "azure" ? 8 : 10;
    return `<div class="system-card disciple-card"><div class="card-row"><b>${esc(d.name)}</b><span class="tag">Rank ${d.level}/5</span></div><small>${rd.n} · ${rn(Math.min(5,d.realm||0))} · Qi ${d.qi||0}/100</small><div class="mini-stats"><span>Loyalty ${d.loyalty}</span><span>Morale ${d.morale}</span></div><div class="button-row"><button data-do="train:${d.id}" ${!here || d.level>=5 || s.stones<trainCost ? "disabled" : ""}>Train · ${trainCost} stones</button><button data-do="cultivate:${d.id}" ${!here || d.realm>=Math.min(5,s.realm+1) || s.stones<cultivateCost ? "disabled" : ""}>Cultivate · ${cultivateCost}</button></div><small>Assign role:</small><div class="role-row">${roles.map(r=>`<button data-do="assign:${d.id}|${r.id}" class="${d.role===r.id?"selected":""}" ${!here || d.role===r.id ? "disabled" : ""}>${r.n}</button>`).join("")}</div></div>`;
  }).join("") : `<p class="dim">No disciples yet. Visit the sect with spirit stones to begin.</p>`;
  return h;
}
function renderBeasts(s) {
  const bonded = s.beasts || [], seen = M().slain || {};
  let h = `<p class="dim">Bond a creature only after defeating it at least once. Bonds reset with reincarnation, but bestiary knowledge persists. You may carry two bonded beasts per life.</p>`;
  h += `<h3>Current bonds (${bonded.length}/2)</h3>`;
  h += bonded.length ? bonded.map(b => {
    const def = beastDef(b.kind) || {n:b.n,x:"A spirit-beast companion."};
    return `<div class="system-card beast-card"><div class="beast-portrait">${A && A.foe ? A.foe(b.kind) : ""}</div><div class="beast-copy"><b>${esc(b.n)}</b><small>Bond level ${b.level}/5 · affinity ${b.affinity}/100${b.affinity>=70 ? " · trusted" : ""}</small><small>${def.x}</small><button data-do="trainbeast:${b.kind}" ${s.duel || b.level>=5 || s.herbs<1 || s.stones<8+b.level*4 ? "disabled" : ""}>Train · 1 herb + ${8+b.level*4} stones</button><small>Role</small><div class="role-row">${W.BEAST_ROLES.map(r=>`<button data-do="assignbeast:${b.kind}|${r.id}" class="${b.role===r.id?"selected":""}" ${s.duel || b.role===r.id ? "disabled" : ""}>${r.n}</button>`).join("")}</div></div></div>`;
  }).join("") : `<p class="dim">No bonded beasts yet.</p>`;
  h += `<h3>Known creatures you can bond</h3>`;
  h += Object.keys(W.BEAST_BONDS).filter(k => (seen[k]||0)>0 && !bonded.some(b=>b.kind===k)).map(k => { const b=W.BEAST_BONDS[k], cost=Math.ceil(b.cost*(s.faction==="wardens"?.8:1)); return `<div class="system-card beast-card"><div class="beast-portrait">${A && A.foe ? A.foe(k) : ""}</div><div class="beast-copy"><b>${b.n}</b><small>${b.x}</small><button data-do="bond:${k}" ${s.duel || bonded.length>=2 || !( ["forest","sect"].includes(s.place) || s.faction==="wardens") || s.stones<cost ? "disabled" : ""}>Form bond · ${cost} stones</button></div></div>`; }).join("") || `<p class="dim">Defeat one of the bondable beasts to unlock it here. Bonds form at the Forest or Sect.</p>`;
  return h;
}
function renderFactions(s) {
  let h = `<p class="dim">Join one faction per life. Faction missions cost supplies and two years; successes earn stones, standing, and faction reputation. Membership is a strategic commitment, not a cosmetic title.</p>`;
  for (const f of W.FACTIONS) {
    const member = s.faction === f.id, eligible = W.canJoinFaction(f.id), rep = (s.factionRep && s.factionRep[f.id]) || 0;
    h += `<div class="system-card faction-card"><div class="card-row"><b>${f.n}</b><span class="tag">${member ? "Member" : `Rep ${rep}`}</span></div><p>${f.x}</p><small><b>Perk:</b> ${f.perk}</small><small>Meeting place: ${W.PLACES.find(p=>p.id===f.home).n} · Minimum realm: ${rn(f.min)}</small>`;
    if (member) h += `<button class="choice sm" data-do="mission" ${s.place!==f.home || s.duel || s.stones < 6+Math.min(8,s.factionMissions||0) ? "disabled" : ""}><span>Undertake faction mission<small>${s.place!==f.home ? "Return to " + W.PLACES.find(p=>p.id===f.home).n : "Costs supplies and 2 years"}</small></span><span class="tag">Mission</span></button>`;
    else h += `<button class="choice sm" data-do="joinfaction:${f.id}" ${!eligible.ok || s.duel ? "disabled" : ""}><span>Join ${f.n}<small>${eligible.ok ? "Take an oath this life" : eligible.msg}</small></span></button>`;
    h += `</div>`;
  }
  return h;
}
function renderResearch(s) {
  const fieldcraft = s.fieldcraft || {}, research = s.research || 0;
  let h = `<p class="dim">Research comes from studying local traces and completing scholarly assignments. Spend it on practical methods for this life; discovered field lore remains in your persistent archive across reincarnations.</p><div class="research-meter"><span>Unspent research</span><b>${research}</b></div>`;
  h += W.FIELD_UPGRADES.map(u => {
    const unlocked = !!fieldcraft[u.id];
    return `<div class="system-card research-card"><div class="card-row"><h3>${u.glyph} ${u.n}</h3><span class="tag">${unlocked ? "Learned" : u.cost + " research"}</span></div><p>${u.x}</p><button class="choice sm" data-do="research:${u.id}" ${unlocked || research < u.cost || s.phase !== "life" || s.duel ? "disabled" : ""}><span>${unlocked ? "Already learned" : "Study method"}<small>${unlocked ? "Active for this life" : research < u.cost ? `Need ${u.cost-research} more research point(s)` : "Available to unlock"}</small></span></button></div>`;
  }).join("");
  const archive = M().fieldLore || {};
  h += `<h3>Persistent field archive</h3><p class="dim">${Object.keys(archive).filter(k=>archive[k]).length}/${Object.keys(W.FIELD_NOTES).length} regions recorded across all lives.</p>`;
  h += Object.entries(W.FIELD_NOTES).map(([k,n]) => `<div class="entry ${archive[k] ? "" : "locked"}"><b>${archive[k] ? n.title : W.PLACES.find(p=>p.id===k).n + " · Unrecorded"}</b><small>${archive[k] ? n.text : "Study this location to preserve its lore."}</small></div>`).join("");
  return h;
}
function renderPanel() {
  const s = S(), life = s.phase === "life", names = {map:"Map",alch:"Alchemy",best:"Bestiary",log:"Journal",dao:"Dao Paths",sect:"Sect",beasts:"Beasts",factions:"Factions",research:"Research",fate:"Fate"};
  const allowedWhileDead = new Set(["fate","log","best","research"]);
  if (!life && !allowedWhileDead.has(tab)) tab = "fate";
  $("tabs").innerHTML = Object.keys(names).map(k => `<button role="tab" aria-selected="${tab===k}" class="${tab===k?"on":""}" data-tab="${k}" ${!life&&!allowedWhileDead.has(k) ? "disabled" : ""}>${names[k]}</button>`).join("");
  let h = "";
  if (tab === "map" && life) h = renderMap(s);
  else if (tab === "alch" && life) {
    h = `<p class="dim">Spirit herbs: <b>${s.herbs}</b>. Gather them in the forest or buy them at the market. Brewing takes 1 year.</p>` + Object.keys(W.RECIPES).map(k => { const r = W.RECIPES[k], lock = s.realm < r.min ? "Needs " + rn(r.min) : s.herbs < r.herbs ? "Needs " + r.herbs + " herbs" : "";
      return `<button class="choice sm" data-do="brew:${k}" ${lock || s.duel ? "disabled" : ""}><span>${r.n}<small>${r.x} · ${r.herbs} herbs · ${lock || Math.round(W.brewChance(k) * 100) + "% success"}</small></span></button>`; }).join("") + `<h3>Pills</h3>` + Object.keys(s.pills).map(k => `<button class="choice sm" data-do="pill:${k}" ${s.pills[k] ? "" : "disabled"}><span>${W.RECIPES[k].n} ×${s.pills[k]}<small>${W.RECIPES[k].x}</small></span></button>`).join("");
  } else if (tab === "best") {
    const seen = M().seen || {}, slain = M().slain || {}, ks = Object.keys(W.FOES);
    h = `<p class="dim">Creatures met: <b>${ks.filter(k => seen[k]).length}/${ks.length}</b>. Defeat each species the first time for +1 fate.</p>` + ks.map(k => { const f = W.FOES[k], known = !!seen[k];
      return known ? `<div class="entry bestiary-entry"><div class="entry-portrait">${A && A.foe ? A.foe(k) : ""}</div><div><b>${f.n}${f.el ? ` <span class="tag">${f.el}</span>` : ""}</b><small>${f.lore}</small><small>${traits(f) || "No special traits"} · defeated ${slain[k] || 0}</small></div></div>` : `<div class="entry locked"><b>???</b><small>Not yet met. Seek clues in relevant habitats.</small></div>`; }).join("");
    h += `<h3>Field lore preserved</h3>` + Object.entries(W.FIELD_NOTES).map(([k,n])=>`<div class="entry ${M().fieldLore && M().fieldLore[k] ? "" : "locked"}"><b>${M().fieldLore && M().fieldLore[k] ? n.title : "Unrecorded field lore"}</b><small>${M().fieldLore && M().fieldLore[k] ? n.text : "Visit this place and study its traces to unlock this note."}</small></div>`).join("");
  } else if (tab === "log") {
    h = `<p class="dim">Research this life: ${(s.research||0)} · Field notes this life: ${Object.keys(s.fieldNotes||{}).length}/${Object.keys(W.FIELD_NOTES).length}</p>`;
    h += `<h3>Field notes</h3>` + Object.entries(W.FIELD_NOTES).map(([k,n])=>`<div class="entry ${s.fieldNotes && s.fieldNotes[k] ? "" : "locked"}"><b>${s.fieldNotes && s.fieldNotes[k] ? n.title : W.PLACES.find(p=>p.id===k).n+" · Unrecorded"}</b><small>${s.fieldNotes && s.fieldNotes[k] ? n.text : "Use Study local traces at this location to record it."}</small></div>`).join("");
    h += `<h3>Life chronicle</h3>` + (s.log && s.log.length ? `<ol class="memoir">${s.log.slice(0, 25).map(l => `<li><b>Age ${l.age}</b>${esc(l.text)}</li>`).join("")}</ol>` : `<p class="dim">Nothing yet.</p>`);
  } else if (tab === "dao" && life) h = renderDao(s);
  else if (tab === "sect" && life) h = renderSect(s);
  else if (tab === "beasts" && life) h = renderBeasts(s);
  else if (tab === "factions" && life) h = renderFactions(s);
  else if (tab === "research") h = renderResearch(s);
  else {
    h = `<p class="dim">Fate: <b>${M().fate}</b>. Permanent upgrades apply to every future life.</p>` + W.UPGRADES.map(u => { const l = M().up[u.id] || 0, max = u.cost.length;
      return `<button class="choice sm" data-do="buy:${u.id}" ${l >= max || M().fate < u.cost[l] ? "disabled" : ""}><span>${u.n} ${"●".repeat(l)}${"○".repeat(max - l)}<small>${u.x}</small></span><span class="tag">${l >= max ? "Max" : u.cost[l] + " fate"}</span></button>`; }).join("");
  }
  $("panel").innerHTML = h;
}
function render() { art(); left(); center(); renderPanel(); try { localStorage.setItem(KEY, W.serialize()); } catch (_) {} }
function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600); }
function moment(kind, g, t, sub) { const m = $("moment"); m.className = "moment " + kind; m.innerHTML = `<div class="ring"></div><b>${g}</b><h2>${t}</h2><p>${sub}</p>`; m.hidden = false; clearTimeout(momentT); momentT = setTimeout(() => { m.hidden = true; }, 2600); }
$("moment").onclick = () => { $("moment").hidden = true; };

// Manual save portability: import validates a candidate before replacing current state.
$("export-save").onclick = () => {
  try {
    const blob = new Blob([W.serialize()], {type:"application/json"});
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = `worldbound-save-v6-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Save exported. Keep a copy outside the browser.");
  } catch (_) { toast("Save export failed in this browser."); }
};
$("import-save").addEventListener("change", async (e) => {
  const file = e.target && e.target.files && e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    if (!W.load(text)) { toast("That file is not a supported Worldbound save. Your current progress was kept."); return; }
    tab = S().phase === "life" ? "map" : "fate";
    render(); toast("Save imported successfully.");
  } catch (_) { toast("Could not read that save. Your current progress was kept."); }
  finally { e.target.value = ""; }
});

const run = {
  origin:(i)=>{const r=W.startLife(+i);tab="map";return r;}, next:()=>{W.toBirth();tab="fate";return {ok:true};},
  choose:(i)=>W.choose(+i), act:(i)=>W.act(+i), travel:(id)=>W.travel(id), learn:(id)=>W.learn(id), brew:(k)=>W.brew(k), pill:(k)=>W.usePill(k),
  seclude:(n)=>W.seclude(+n), bt:()=>W.breakthrough(), move:(i)=>W.duelMove(+i), flee:()=>W.flee(), buy:(id)=>W.buyUpgrade(id),
  path:(id)=>W.chooseDaoPath(id), dao:()=>W.useDaoAbility(), study:()=>W.studyField(), research:(id)=>W.unlockFieldcraft(id),
  recruit:(role)=>W.recruitDisciple(role), train:(id)=>W.trainDisciple(id), cultivate:(id)=>W.cultivateDisciple(id),
  assign:(arg)=>{const [id,role]=String(arg||"").split("|");return W.assignDisciple(id,role);},
  bond:(id)=>W.bondBeast(id), trainbeast:(id)=>W.trainBeast(id), assignbeast:(arg)=>{const [id,role]=String(arg||"").split("|");return W.assignBeast(id,role);},
  joinfaction:(id)=>W.joinFaction(id), mission:()=>W.factionMission()
};
function go(spec) {
  const i = spec.indexOf(":"), k = i < 0 ? spec : spec.slice(0,i), arg = i < 0 ? "" : spec.slice(i+1), s0 = S(), realm = s0.realm, was = s0.phase;
  if (!run[k]) { toast("This action is not available."); return; }
  const r = run[k](arg); if (!r || !r.ok) { toast(r && r.msg ? r.msg : "Action failed."); return; }
  render(); const s = S();
  if (s.phase === "dead" && was !== "dead") s.dead.win ? moment("up", "升", "Ascension", `${s.name} leaves this world behind.`) : moment("end", "终", "Your life ends", `${s.name} ${s.dead.cause}.`);
  else if (s.phase === "life" && was === "life" && s.realm > realm) moment("up", W.R[s.realm][1], rn(s.realm), "Breakthrough");
  if (r.msg && r.ok && ["path","recruit","train","cultivate","assign","bond","trainbeast","assignbeast","joinfaction","mission","study","dao","research"].includes(k)) toast(r.msg);
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-tab]"); if (t && !t.disabled) { tab = t.dataset.tab; render(); return; }
  const d = e.target.closest("[data-do]"); if (d && !d.disabled) go(d.dataset.do);
});
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName)||"")) return;
  const k=e.key.toLowerCase(), s=S(); let spec=null;
  if (s.phase === "birth" && "123".includes(k) && k) spec="origin:"+(+k-1);
  else if (s.phase === "dead" && k === "enter") spec="next";
  else if (s.phase === "life" && s.duel) { if ("123".includes(k) && k) spec="move:"+(+k-1); else if (k === "f") spec="flee"; }
  else if (s.phase === "life") { if ("1234".includes(k) && k) spec="choose:"+(+k-1); else if (k === "s") spec="seclude:3"; else if (k === "d") spec="seclude:10"; else if (k === "b") spec="bt"; }
  const tabs={m:"map",a:"alch",j:"log",p:"dao",c:"sect",v:"beasts",g:"factions",r:"research"};
  if (!spec && s.phase === "life" && tabs[k]) { tab=tabs[k];render();return; }
  if (!spec && k === "f") { tab="fate";render();return; }
  if (spec) { e.preventDefault();go(spec); }
});
$("wipe").onclick = () => { if (confirm("Erase all progress and fate? This cannot be undone.")) { W.set({phase:"birth"}, {fate:0,lives:0,best:0,up:{},seen:{},slain:{},fieldLore:{},pathLegacy:{}}); tab="fate"; try {localStorage.removeItem(KEY);localStorage.removeItem("worldbound-v5");localStorage.removeItem("worldbound-v4");localStorage.removeItem("worldbound-v3");} catch(_){} render(); } };

try {
  let raw = localStorage.getItem(KEY);
  if (!raw) raw = localStorage.getItem("worldbound-v5");
  if (!raw) raw = localStorage.getItem("worldbound-v4");
  if (!raw || !W.load(raw)) { const old=localStorage.getItem("worldbound-v3"); if(old){const d=JSON.parse(old);W.migrateV3(JSON.stringify(d));} }
} catch (_) {}
if (S().phase === "birth") tab = "fate";
render();
window.WBUI = {render,go,setTab:(t)=>{tab=t;render();},getTab:()=>tab};
})();

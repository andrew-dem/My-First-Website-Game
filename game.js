(() => {
  "use strict";
  const KEY = "worldbound-v3";
  // [name, glyph, lifespan bonus]
  const R = [["Mortal","凡",0],["Qi Condensation","气",30],["Foundation","基",80],["Core Formation","丹",170],["Nascent Soul","婴",350],["Soul Transformation","神",700]];
  const NAMES = ["Lin Wei","Su Yan","Han Mo","Bai Qing","Ye Chen","Mu Xue","Tang Jun","Lian Hua","Zhou Ke","Shen Yu"];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let S, M = { fate: 0, lives: 0, best: 0 };

  function rnd() { // seeded, so a life is reproducible from its saved state
    S.seed = (S.seed + 0x6D2B79F5) >>> 0; let t = S.seed;
    t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  // Event: [id, title, text, minRealm, maxRealm, options]. Option: [label, stoneCost, outcomes].
  // Outcome: [probability, text, effects]. List outcomes best to worst: Luck shifts rolls toward the best.
  // Effects: q qi, b body, m mind, l luck, s stones, r reputation, L lifespan, y years passed (default 3), d death cause.
  const EV = [
    ["herb","Spirit herb on the cliff","A glowing herb grows from a sheer cliff above the village.",0,2,[
      ["Climb for it",0,[[.6,"You reach it and eat it raw. Warmth floods your meridians.",{q:22,b:1}],[.3,"You slip and tumble, bruised and bleeding.",{b:-4}],[.1,"The rope snaps.",{d:"fell from a cliff"}]]],
      ["Hire a guide",20,[[.85,"The guide fetches it safely and you share the herb.",{q:12}],[.15,"The guide cheats you and vanishes.",{l:-1}]]],
      ["Leave it",0,[[1,"You walk on and think about greed.",{m:1}]]]]],
    ["beggar","The beggar at the gate","A filthy old man asks you for a meal. His eyes are strangely clear.",0,1,[
      ["Share your meal",0,[[.5,"He taps your brow. A thin stream of qi enters you.",{q:25,l:1}],[.5,"He thanks you and leaves. You feel lighter.",{r:2,m:1}]]],
      ["Drive him away",0,[[.8,"He mutters and shuffles off.",{r:-2}],[.2,"His eyes flash. A curse settles on you.",{l:-3,b:-2}]]]]],
    ["trial","The sect entrance trial","Elders test every young seeker. Hundreds line up in the rain.",0,0,[
      ["Take the trial",0,[[.5,"You pass. The elders note your talent.",{q:30,r:5,l:1}],[.4,"You fail, but the examiner pities you.",{r:1,m:1}],[.1,"The test beast mauls you.",{b:-5}]]]]],
    ["rival","A rival insults you","A disciple from a richer family mocks your robes in front of everyone.",0,3,[
      ["Duel him",0,[[.5,"You win, and gain face.",{r:3,q:8}],[.4,"You lose and limp home.",{b:-3,r:-1}],[.1,"He fights to cripple you.",{b:-6}]]],
      ["Swallow the insult",0,[[1,"Your temper cools. Your heart grows steady.",{m:2}]]]]],
    ["realm","A secret realm opens","A rift shimmers over the valley. Every sect is sending people in.",1,4,[
      ["Enter alone",0,[[.35,"You find an ancient inheritance.",{q:50,s:40,l:1}],[.35,"You scrape out with a few stones.",{s:20,q:10}],[.2,"Guardians drive you out, wounded.",{b:-5}],[.1,"The realm collapses with you inside.",{d:"lost in a collapsing secret realm"}]]],
      ["Join a sect expedition",0,[[.7,"A safe trip, but your share is small.",{s:15,q:12,r:2}],[.3,"Rival sects ambush the party.",{b:-4,r:1}]]],
      ["Stay out",0,[[1,"You watch the rift close.",{m:1}]]]]],
    ["pill","A master sells breakthrough pills","An alchemist hawks his wares from a floating stall.",1,5,[
      ["Buy a pill",40,[[.8,"The pill dissolves into pure qi.",{q:35}],[.2,"A fake. You lose the stones and learn caution.",{m:1}]]],
      ["Haggle hard",0,[[.4,"He relents and sells you a cheap pill.",{q:28}],[.6,"He laughs and shoos you away.",{r:-1}]]]]],
    ["feast","A tainted feast","The host smiles too widely. Something in the wine smells wrong.",0,5,[
      ["Test it with a silver needle",0,[[1,"The needle blackens. You were right to doubt.",{m:1,r:1}]]],
      ["Drink anyway",0,[[.7,"It was only strong wine.",{s:10}],[.3,"Poison burns through you.",{b:-5}]]]]],
    ["begs","A mortal begs for help","A woman kneels in the road. Her village is hunted by bandits.",0,4,[
      ["Help her",0,[[.6,"She is an elder's niece. Her family remembers you.",{r:4,l:2}],[.4,"It was a trap set by bandits.",{b:-4,s:-20}]]],
      ["Walk away",0,[[1,"Your dao heart hardens.",{m:2,l:-1}]]]]],
    ["omen","A heavenly omen","Violet clouds gather. Qi pours from the sky.",2,5,[
      ["Meditate beneath it",0,[[.5,"The sky's qi pours into you.",{q:40}],[.3,"Overwhelmed, you cough blood.",{b:-4,q:10}],[.2,"Lightning finds you.",{b:-7}]]],
      ["Take shelter",0,[[1,"The omen fades. You gain nothing.",{}]]]]],
    ["war","The sect goes to war","Border sects have declared a feud. Banners are raised.",2,5,[
      ["Fight on the front",0,[[.5,"Disciples sing your name.",{r:8,q:15}],[.4,"Wounded, you hold the line.",{b:-5,r:5}],[.1,"You fall in battle.",{d:"died in a sect war"}]]],
      ["Guard the rear",0,[[1,"You stay safe, but whispers of cowardice follow.",{r:-2,s:10}]]]]],
    ["cave","An old cultivator's cave","A cave mouth breathes ancient qi. Bones lie at the entrance.",1,5,[
      ["Offer incense first",10,[[.7,"His spirit blesses you.",{q:45,l:2}],[.3,"Nothing happens.",{}]]],
      ["Search the cave",0,[[.4,"Treasure: his manual and some stones.",{q:35,s:30}],[.4,"Empty, but you dodge his traps.",{m:1}],[.2,"His ghost takes your body.",{d:"possessed by a lingering ghost"}]]]]],
    ["market","The spirit stone market","Stalls glitter with ore, herbs and fake relics.",0,5,[
      ["Gamble 20 stones on a stone-cutting",20,[[.3,"Jackpot: a vein of jade.",{s:80,l:1}],[.7,"Just gravel.",{}]]],
      ["Sell gathered herbs",0,[[1,"A fair price.",{s:25}]]]]],
    ["elixir","An ancient elixir","A hermit offers a Longevity Elixir, if you can pay.",3,5,[
      ["Drink it",60,[[.7,"Fifteen years return to your bones.",{L:15}],[.3,"The elixir was tainted.",{b:-6}]]],
      ["Decline",0,[[1,"You choose your own path.",{m:1}]]]]],
    ["demon","Whispers of a demonic art","A scroll promises power without limit. Its ink is still wet.",1,5,[
      ["Burn the scroll",0,[[1,"Your heart stays clean.",{m:2,r:2}]]],
      ["Practice it",0,[[.5,"Power surges, but your heart darkens.",{q:60,m:-3,l:-2}],[.3,"Qi deviation. Your meridians tear.",{b:-8}],[.2,"The demon consumes you.",{d:"consumed by a demonic technique"}]]]]],
    ["brother","A sworn brother's offer","An old friend whispers of a treasure map.",0,5,[
      ["Trust him",0,[[.6,"You split the haul.",{s:35}],[.4,"He betrays you.",{s:-30,b:-3}]]],
      ["Refuse politely",0,[[1,"Nothing gained. Nothing lost.",{m:1}]]]]],
    ["fall","Meditate by a waterfall","The roar drowns every thought but one.",0,5,[
      ["Sit beneath it",0,[[.8,"Insight blossoms.",{q:15,m:1}],[.2,"A beast stalks you at night.",{b:-3}]]]]]
  ].map(a => ({ id: a[0], t: a[1], x: a[2], lo: a[3], hi: a[4], o: a[5] }));

  const total = () => S.base + R[S.realm][2] + S.bonus;
  const bodyMax = () => 10 + S.realm * 3;
  const chance = () => clamp(0.8 - S.realm * 0.1 + S.mind * 0.02 + S.luck * 0.015, 0.15, 0.95);
  const note = (text) => { S.log.unshift({ age: S.age, text }); S.log.length = Math.min(S.log.length, 40); };

  function newLife() {
    M.lives++;
    S = { seed: (Date.now() ^ (M.lives * 7919)) >>> 0 };
    S.base = 55 + Math.floor(rnd() * 26);
    S.name = NAMES[Math.floor(rnd() * NAMES.length)];
    Object.assign(S, { age: 16, realm: 0, qi: 0, body: 10, mind: 5 + Math.min(M.fate, 6), luck: 3 + Math.min(Math.floor(M.fate / 2), 6),
      stones: 30, rep: 0, bonus: 0, log: [], recent: [], dead: null });
    note(M.fate ? `Reborn with ${M.fate} fate behind you.` : "Your journey begins.");
    S.ev = pick();
  }
  function pick() {
    const ok = EV.filter(e => S.realm >= e.lo && S.realm <= e.hi && !S.recent.includes(e.id));
    const e = ok[Math.floor(rnd() * ok.length)] || EV[0];
    S.recent.push(e.id); if (S.recent.length > 6) S.recent.shift();
    return e;
  }
  function die(cause) {
    if (S.dead) return; // death happens once
    const gain = S.realm * 2 + 1 + (S.rep >= 20 ? 1 : 0);
    S.dead = { cause, gain }; M.fate += gain; M.best = Math.max(M.best, S.realm);
    note(`You ${cause.startsWith("died") || cause.startsWith("fell") ? "" : "were "}${cause}.`.replace("You were ascended", "You ascended"));
  }
  function years(n) {
    for (let i = 0; i < n && !S.dead; i++) {
      S.age++; S.body = Math.min(bodyMax(), S.body + 1);
      const h = (0.001 + Math.max(0, S.age - 50) * 0.0006) * (1 - 0.12 * S.realm);
      if (S.age >= total()) die("died of old age"); else if (rnd() < h) die("fell ill and died");
    }
  }
  function apply(f) {
    S.qi = clamp(S.qi + (f.q || 0), 0, 100); S.body = clamp(S.body + (f.b || 0), 0, bodyMax());
    S.mind = clamp(S.mind + (f.m || 0), 0, 20); S.luck = clamp(S.luck + (f.l || 0), -5, 20);
    S.stones = Math.max(0, S.stones + (f.s || 0)); S.rep += f.r || 0; S.bonus += f.L || 0;
    if (f.d) die(f.d); else if (S.body <= 0) die("died of your wounds");
  }
  function choose(i) {
    if (S.dead) return;
    const [, cost, outs] = S.ev.o[i]; if (S.stones < cost) return;
    S.stones -= cost;
    const x = rnd() - S.luck * 0.012; let acc = 0, out = outs[outs.length - 1];
    for (const o of outs) { acc += o[0]; if (x < acc) { out = o; break; } }
    note(out[1]); apply(out[2]);
    if (!S.dead) { years(out[2].y ?? 3); if (!S.dead) S.ev = pick(); }
  }
  function seclude(n) {
    if (S.dead) return;
    for (let i = 0; i < n && !S.dead; i++) {
      S.qi = clamp(S.qi + (2.5 + S.mind * 0.25) / (1 + S.realm * 0.6), 0, 100); // higher realms cultivate slower
      if (rnd() < 0.05) { apply({ b: -4 }); note("A qi deviation during seclusion hurt you."); }
      years(1);
    }
    if (!S.dead) note(`You spent ${n} years in seclusion.`);
  }
  function breakthrough() {
    if (S.dead || S.qi < 100) return;
    if (S.realm === 5) { S.dead = { cause: "ascended to the upper realm", gain: 10, win: true }; M.fate += 10; M.best = 6; note("You ascend beyond this world."); return; }
    if (rnd() < chance()) { S.realm++; S.qi = 0; S.body = bodyMax(); note(`Breakthrough! You enter ${R[S.realm][0]}.`); }
    else {
      S.qi = 50; apply({ b: -3 }); note("The breakthrough failed. Your qi scatters.");
      if (!S.dead && S.realm > 0 && rnd() < 0.2) die("died in a failed tribulation");
    }
    years(1);
  }
  function risk(outs) {
    const bad = outs.reduce((a, o) => a + ((o[2].d || (o[2].b || 0) <= -3) ? o[0] : 0), 0);
    const dead = outs.reduce((a, o) => a + (o[2].d ? o[0] : 0), 0);
    return dead >= .1 ? ["Deadly", "r4"] : bad >= .4 ? ["Dangerous", "r3"] : bad >= .2 ? ["Risky", "r2"] : bad > 0 ? ["Low risk", "r1"] : ["Safe", "r0"];
  }

  if (typeof document === "undefined") { // Node: expose for tests
    module.exports = { get S() { return S; }, get M() { return M; }, EV, newLife, choose, seclude, breakthrough, years };
    return;
  }
  const $ = (id) => document.getElementById(id);
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ S, M })); } catch (_) {} }
  const GLY = { herb:"药", beggar:"丐", trial:"试", rival:"敌", realm:"秘", pill:"丹", feast:"毒", begs:"救", omen:"天", war:"战", cave:"洞", market:"市", elixir:"寿", demon:"魔", brother:"义", fall:"定" };
  const SKY = [["#2c3a40","#d8a860"],["#1f3f44","#e0c88c"],["#1b3a55","#a8d4d0"],["#2b2459","#d8b0e0"],["#4a1c2a","#f0a070"],["#10102a","#f6e7a8"]];
  const ridge = (b, a, f, p, fill, o) => { let d = "M0 170"; for (let x = 0; x <= 400; x += 20) d += ` L${x} ${(b - a * (0.55 * Math.abs(Math.sin(x * f + p)) + 0.45 * Math.sin(x * f * 2.3 + p * 1.7) ** 2)).toFixed(0)}`; return `<path d="${d} L400 170Z" fill="${fill}" opacity="${o}"/>`; };
  function scene() { // ink-wash landscape: sky, light and altitude change with realm
    const r = S.realm, [a, b] = SKY[r]; let st = "";
    if (r >= 3) for (let i = 0; i < 24 + r * 6; i++) st += `<circle cx="${(i * 97) % 400}" cy="${(i * 53) % 90}" r="${i % 5 ? .7 : 1.3}" fill="#fff" opacity=".${4 + i % 5}"/>`;
    return `<svg viewBox="0 0 400 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><radialGradient id="gl"><stop offset="0" stop-color="#fff6d8"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient></defs><rect width="400" height="170" fill="url(#sk)"/>${st}<circle cx="290" cy="${70 - r * 6}" r="${34 + r * 6}" fill="url(#gl)" opacity=".8"/><circle cx="290" cy="${70 - r * 6}" r="${12 + r * 2}" fill="#fff3cf"/>${r >= 5 ? '<circle cx="290" cy="34" r="30" fill="none" stroke="#f1d27a" stroke-width="1.5"/>' : ""}${ridge(105 - r * 4, 40, .021, 1, "#1f3a3e", .55)}${ridge(125, 34, .033, 2, "#173034", .8)}<g class="mist"><ellipse cx="120" cy="125" rx="170" ry="9" fill="#e8f1ec" opacity=".18"/><ellipse cx="300" cy="140" rx="190" ry="8" fill="#e8f1ec" opacity=".16"/></g>${ridge(150, 26, .05, 3, "#0c1c1d", 1)}</svg>`;
  }
  function render(fresh) {
    const app = $("app"); app.dataset.realm = S.realm; app.classList.toggle("dead", !!S.dead);
    $("art").innerHTML = scene();
    $("seal").textContent = R[S.realm][1]; $("name").textContent = S.name;
    $("meta").textContent = `${R[S.realm][0]} · Life ${M.lives} · Fate ${M.fate}`;
    $("ladder").innerHTML = R.map((r, i) => `<i class="${i < S.realm ? "done" : i === S.realm ? "now" : ""}" title="${r[0]}">${r[1]}</i>`).join("");
    const C = 2 * Math.PI * 17;
    $("vitals").innerHTML =
      `<div class="qi"><svg viewBox="0 0 44 44" class="orb"><circle cx="22" cy="22" r="17" class="o0"/><circle cx="22" cy="22" r="17" class="o1" stroke-dasharray="${(S.qi / 100 * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 22 22)"/><text x="22" y="26" text-anchor="middle">${Math.round(S.qi)}</text></svg>Qi</div>` +
      `<div class="bars"><div>Body ${S.body}/${bodyMax()}<div class="bar"><span style="width:${S.body / bodyMax() * 100}%"></span></div></div><div>Lifespan ${S.age}/${total()}<div class="bar life"><span style="width:${Math.min(100, S.age / total() * 100)}%"></span></div></div></div>` +
      `<div class="chips"><div>Mind<b>${S.mind}</b></div><div>Luck<b>${S.luck}</b></div><div>Stones<b>${S.stones}</b></div><div>Standing<b>${S.rep}</b></div></div>`;
    const card = $("card"), ch = $("choices"), ac = $("actions");
    card.dataset.g = S.dead ? (S.dead.win ? "升" : "终") : GLY[S.ev.id] || "道";
    if (S.dead) {
      card.innerHTML = `<h2>${S.dead.win ? "Ascension" : "Your life ends"}</h2><p>${S.name} ${S.dead.cause} at age ${S.age}, in the ${R[S.realm][0]} realm. You carry ${S.dead.gain} fate into your next life.</p>`;
      ch.innerHTML = ""; ac.innerHTML = `<button class="act go" data-a="reborn">Reincarnate</button>`;
    } else {
      card.innerHTML = `<h2>${S.ev.t}</h2><p>${S.ev.x}</p>`;
      ch.innerHTML = S.ev.o.map((o, i) => { const [t, c] = risk(o[2]);
        return `<button class="choice" data-c="${i}" ${S.stones < o[1] ? "disabled" : ""}><span>${o[0]}${o[1] ? `<small>Costs ${o[1]} stones</small>` : ""}</span><span class="tag ${c}">${t}</span></button>`; }).join("");
      ac.innerHTML = (S.qi >= 100 ? `<button class="act go" data-a="bt">${S.realm === 5 ? "Ascend" : "Break through to " + R[S.realm + 1][0]} (${S.realm === 5 ? "final step" : Math.round(chance() * 100) + "% chance"})</button>` : "") +
        `<button class="act" data-a="s3">Seclude 3 years</button><button class="act" data-a="s10">Seclude 10 years</button>`;
    }
    $("memoir").innerHTML = S.log.slice(0, 6).map(l => `<li><b>Age ${l.age}</b>${l.text}</li>`).join("");
    if (fresh) { card.classList.remove("fresh"); void card.offsetWidth; card.classList.add("fresh"); }
    save();
  }
  let mt;
  function moment(kind, g, t, sub) { // full-screen beat for breakthroughs and death; tap to skip
    const m = $("moment"); m.className = "moment " + kind;
    m.innerHTML = `<div class="ring"></div><b>${g}</b><h2>${t}</h2><p>${sub}</p>`; m.hidden = false;
    clearTimeout(mt); mt = setTimeout(() => { m.hidden = true; }, 2800);
  }
  $("moment").onclick = () => { $("moment").hidden = true; };
  function act(fn) {
    const pr = S.realm, pd = S.dead; fn(); render(true);
    if (S.dead && !pd) S.dead.win ? moment("up", "升", "Ascension", `${S.name} leaves this world behind.`) : moment("end", "终", "Your life ends", `${S.name} ${S.dead.cause}.`);
    else if (S.realm > pr) moment("up", R[S.realm][1], R[S.realm][0], "Breakthrough");
  }
  $("choices").onclick = (e) => { const b = e.target.closest("[data-c]"); if (b) act(() => choose(+b.dataset.c)); };
  $("actions").onclick = (e) => { const a = e.target.closest("[data-a]"); if (a) act({ s3: () => seclude(3), s10: () => seclude(10), bt: breakthrough, reborn: newLife }[a.dataset.a]); };
  $("wipe").onclick = () => { if (confirm("Erase all progress and fate?")) { M = { fate: 0, lives: 0, best: 0 }; newLife(); render(true); } };
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.S && d.M && d.S.log) { S = d.S; M = d.M; } } catch (_) {}
  if (!S) newLife();
  render(true);
})();

// Worldbound engine v4 — pure game rules, no DOM. Loaded by index.html and by tests.js (node).
(function (root) {
"use strict";
const R = [["Mortal","凡",0],["Qi Condensation","气",30],["Foundation","基",80],["Core Formation","丹",170],["Nascent Soul","婴",350],["Soul Transformation","神",700]];
const NAMES = ["Lin Wei","Su Yan","Han Mo","Bai Qing","Ye Chen","Mu Xue","Tang Jun","Lian Hua","Zhou Ke","Shen Yu","Qin Ao","Feng Li"];
const RIVAL_NAMES = ["Duan Hu","Gu Meng","Ren Yao","Xiao Lan","Mo Chen","Jiang Wu"];
const EL = ["Metal","Wood","Water","Fire","Earth"];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ORIGINS = [
  { id:"farm", n:"Farmer's child", x:"Hard hands and a steady heart.", fx:"+3 Body, +10 stones", b:3, s:10 },
  { id:"noble", n:"Fallen noble", x:"A lost name and a hidden purse.", fx:"+60 stones, +1 Mind", s:60, m:1 },
  { id:"orphan", n:"Street orphan", x:"Nobody helped you, so you learned to be lucky.", fx:"+2 Luck, +1 Body", l:2, b:1 }];
const ROOTS = [{n:"Heavenly root",mult:1.6,w:1},{n:"Single root",mult:1.3,w:4},{n:"Dual root",mult:1.1,w:8},{n:"Triple root",mult:.9,w:10},{n:"Mixed root",mult:.75,w:12}];
const ELFX = { Metal:"+2 duel power", Wood:"+1 herb when gathering", Water:"+1 Mind", Fire:"better alchemy", Earth:"+2 max Body" };
const TECH = [
  {id:"breath",n:"Breathing Art",x:"+15% cultivation speed",cost:30,rep:0,min:0,q:.15,d:0,a:0},
  {id:"fist",n:"Iron Fist",x:"+3 duel power",cost:40,rep:0,min:0,q:0,d:3,a:0},
  {id:"step",n:"Cloud Step",x:"+2 power, easier escapes",cost:70,rep:2,min:1,q:0,d:2,a:0,f:.2},
  {id:"flame",n:"Heart Flame Sutra",x:"+10% cultivation, better alchemy",cost:90,rep:3,min:1,q:.1,d:0,a:.12},
  {id:"sword",n:"Sword Intent",x:"+6 duel power",cost:140,rep:5,min:2,q:0,d:6,a:0},
  {id:"dao",n:"Dao Heart Scripture",x:"+25% cultivation speed",cost:260,rep:8,min:3,q:.25,d:0,a:0}];
const RECIPES = {
  qi:{n:"Qi Pill",herbs:2,min:0,base:.8,x:"+30 Qi"}, body:{n:"Mending Pill",herbs:2,min:0,base:.8,x:"+8 Body"},
  bt:{n:"Breakthrough Pill",herbs:4,min:1,base:.55,x:"+15% to your next breakthrough"}, life:{n:"Longevity Pill",herbs:6,min:2,base:.45,x:"+12 lifespan"}};
const UPGRADES = [
  {id:"luck",n:"Fortune's Whisper",x:"+1 starting Luck",cost:[3,6,10]},
  {id:"body",n:"Tempered Bones",x:"+2 max Body",cost:[3,6,10]},
  {id:"mind",n:"Past-life Insight",x:"+1 starting Mind",cost:[4,8,12]},
  {id:"stones",n:"Ancestral Savings",x:"+30 starting stones",cost:[2,4,7]},
  {id:"root",n:"Reforged Root",x:"Roll your spirit root again, keep the best",cost:[6,12]},
  {id:"tech",n:"Muscle Memory",x:"Begin knowing Breathing Art",cost:[5]}];
const FOES = {
  bandit:{n:"Bandit chief",p:4,pr:3,hp:10,hr:6,loot:20,rep:1}, beast:{n:"Spirit beast",p:5,pr:3,hp:12,hr:7,loot:15,rep:1,herb:1},
  ghost:{n:"Ruin guardian",p:6,pr:3.5,hp:14,hr:8,loot:40,rep:2}, demon:{n:"Demon cultivator",p:7,pr:4,hp:16,hr:9,loot:50,rep:4}};
const STANCES = ["Strike","Guard","Technique"]; // Guard beats Strike, Technique beats Guard, Strike beats Technique
const BEATS = { 1:0, 2:1, 0:2 };

const PLACES = [
 {id:"village",n:"Mountain Village",min:0,cost:0,x:"Quiet, safe, and poor.",acts:[
  ["Work the fields",0,[[.85,"Honest work earns a few stones.",{s:7}],[.15,"A bad harvest. You earn nothing.",{}]]],
  ["Rest and recover",0,[[1,"A week of sleep and thin soup restores you.",{b:4}]]]]},
 {id:"market",n:"Misty Market",min:0,cost:4,x:"Traders, rumors, and spirit herbs.",acts:[
  ["Buy a spirit herb",8,[[1,"You haggle and walk away with a herb.",{h:1,y:0}]]],
  ["Sell all your herbs",0,[[1,"The herbalist counts out your stones.",{sh:1,y:0}]]],
  ["Listen for rumors",0,[[.5,"A drunk mentions a hidden spring. Your luck stirs.",{l:1}],[.5,"Only gossip.",{}]]]]},
 {id:"sect",n:"Azure Cloud Sect",min:0,cost:6,x:"Techniques are taught here, for a price.",acts:[
  ["Run errands for the elders",0,[[.8,"The elders note your diligence.",{r:1,s:4}],[.2,"A senior disciple bullies you.",{b:-2}]]]]},
 {id:"forest",n:"Whispering Forest",min:0,cost:3,x:"Herbs and beasts grow wild here.",acts:[
  ["Gather herbs",0,[[.55,"You find two spirit herbs.",{h:2}],[.3,"You find one, and a thorny beast bites you.",{h:1,b:-3}],[.15,"A beast stalks you. You must fight.",{duel:"beast"}]]],
  ["Hunt a spirit beast",0,[[1,"You track a beast to its lair.",{duel:"beast",y:0}]]]]},
 {id:"ruins",n:"Sunken Ruins",min:1,cost:12,x:"Traps, treasure, and old ghosts.",acts:[
  ["Search the ruins",0,[[.35,"You pry open a sealed vault.",{s:60,h:1,r:1}],[.35,"Mostly dust, plus a few stones.",{s:12}],[.2,"A trap springs.",{b:-6}],[.1,"The ceiling collapses.",{d:"was buried in forgotten ruins"}]]]]},
 {id:"peak",n:"Heaven's Peak",min:3,cost:40,x:"Thin air, thunder, and enlightenment.",acts:[
  ["Meditate in the storm",0,[[.5,"Lightning tempers your meridians.",{q:45,m:1}],[.35,"The storm batters you.",{q:15,b:-8}],[.15,"A bolt finds you.",{d:"was struck down on Heaven's Peak"}]]]]}];

const E = (id,t,x,min,max,pl,o) => ({id,t,x,min,max,pl,o});
const EV = [
 E("herb","Spirit herb on the cliff","A glowing herb grows from a sheer cliff above the village.",0,2,null,[
  ["Climb for it",0,[[.6,"You reach it and eat it raw. Warmth floods your meridians.",{q:22,b:1}],[.3,"You slip and tumble, bruised and bleeding.",{b:-4}],[.1,"The rope snaps.",{d:"fell from a cliff"}]]],
  ["Hire a guide",20,[[.85,"The guide fetches it safely and you share the herb.",{q:15}],[.15,"The guide runs off with the herb.",{}]]]]),
 E("feast","A tainted feast","The host smiles too widely. Something in the wine smells wrong.",0,5,null,[
  ["Test it with a silver needle",0,[[.8,"The needle blackens. You leave quietly, wiser.",{m:1}],[.2,"You catch the host's eye. He pales and flees.",{r:1}]]],
  ["Drink anyway",0,[[.5,"It was only strong wine. You gain a friend.",{r:1,l:1}],[.35,"Poison burns through you.",{b:-6}],[.15,"The poison was meant to kill.",{d:"was poisoned at a feast"}]]]]),
 E("brother","A sworn brother's offer","An old friend whispers of a treasure map.",0,2,null,[
  ["Trust him",0,[[.45,"The map was real. You split a small fortune.",{s:50,r:1}],[.3,"It was a trap set by bandits.",{duel:"bandit",y:0}],[.25,"He vanishes with your savings.",{s:-20}]]],
  ["Refuse politely",0,[[1,"You walk on, a little lonelier but sharper.",{m:1}]]]]),
 E("master","A wandering master","A ragged old man watches you train, then sighs.",0,2,null,[
  ["Kneel and beg to learn",0,[[.4,"He grunts and shows you a technique.",{t:1}],[.6,"He cuffs you and walks away.",{b:-1}]]],
  ["Offer 25 stones",25,[[.7,"He pockets the coins and teaches you a technique.",{t:1}],[.3,"He vanishes with your coins.",{}]]]]),
 E("bandits","Bandit ambush","Three riders block the road, blades drawn.",0,2,null,[
  ["Fight",0,[[1,"You raise your fists.",{duel:"bandit",y:0}]]],
  ["Pay them off",15,[[.9,"They take the coins and wave you on.",{}],[.1,"They take the coins and a few bruises.",{b:-3}]]],
  ["Run",0,[[.5,"You lose them in the trees.",{y:1}],[.5,"A thrown knife finds your leg.",{b:-4,y:1}]]]]),
 E("spring","A spirit spring","Warm mist rises from a hidden pool humming with qi.",1,3,null,[
  ["Bathe in it",0,[[.7,"Qi floods your meridians.",{q:30}],[.3,"The water is too strong and burns you.",{b:-3,q:10}]]],
  ["Bottle the water",10,[[1,"You brew a Qi Pill from the water.",{pill:"qi"}]]]]),
 E("rival","Your rival appears","Your rival blocks the path, smiling without warmth.",0,5,null,[
  ["Accept the duel",0,[[1,"You settle it with your hands.",{duel:"rival",y:0}]]],
  ["Mock him first",0,[[.5,"Your words land. The crowd laughs at him.",{r:1}],[.5,"He loses his temper and attacks.",{duel:"rival",y:0}]]],
  ["Bribe him to leave",25,[[1,"He pockets the stones and leaves, for now.",{}]]]]),
 E("tournament","Sect tournament","The sect opens its ring to outer disciples.",1,3,null,[
  ["Enter",0,[[.4,"You win the ring and the elders' praise.",{r:3,s:30}],[.4,"You lose, but you are noticed.",{b:-3,r:1}],[.2,"A brutal loss that costs you blood.",{b:-6}]]],
  ["Watch and learn",0,[[1,"You study the winners' footwork.",{m:1}]]]]),
 E("plague","Plague in the village","Fever spreads from house to house.",0,1,null,[
  ["Tend the sick",0,[[.6,"Villagers remember your kindness.",{r:2}],[.4,"You catch the fever.",{b:-4,r:1}]]],
  ["Stay away",0,[[1,"You are safe, and quietly ashamed.",{r:-1}]]]]),
 E("omen","Tribulation omen","Dark clouds gather. A heavenly tribulation is near.",3,5,null,[
  ["Prepare an array",30,[[.8,"The array channels the thunder into your core.",{q:30,m:1}],[.2,"The array cracks and the lightning bites.",{b:-5}]]],
  ["Ignore it",0,[[.6,"The clouds drift away.",{}],[.4,"Stray lightning scorches you.",{b:-6}]]]]),
 E("demon","A demon cultivator","A man wreathed in black qi smiles at you.",2,5,null,[
  ["Fight",0,[[1,"You face him.",{duel:"demon",y:0}]]],
  ["Flee",0,[[.5,"You break his line of sight and escape.",{y:1}],[.5,"His qi lash flays you as you run.",{b:-8,y:1}]]]]),
 E("cave","A hidden cave","Warm light spills from a crack in the cliff.",1,4,null,[
  ["Enter",0,[[.4,"A cultivator's cache. Qi and stones.",{q:35,s:30}],[.3,"Spirit herbs grow along the walls.",{h:2}],[.2,"Cave-in. You dig out, bleeding.",{b:-7}],[.1,"The cave seals behind you.",{d:"was entombed in a hidden cave"}]]],
  ["Mark it and move on",0,[[1,"Another traveler will find it, not you.",{y:1}]]]]),
 E("scam","A market scam","A stallkeeper swears his 'dragon bone' will make you immortal.",0,2,null,[
  ["Haggle hard",0,[[.5,"You expose the fake and the crowd pays you.",{s:25}],[.5,"His thugs teach you a lesson.",{b:-3}]]],
  ["Walk away",0,[[1,"You keep your stones.",{m:0}]]]]),
 E("demonheart","Inner demon","Your own voice whispers that you are a fraud.",2,5,null,[
  ["Face it",0,[[.6,"You master the doubt.",{m:2,q:20}],[.3,"It shakes your foundation.",{q:-25,b:-3}],[.1,"You are consumed.",{d:"was consumed by an inner demon"}]]],
  ["Suppress it",0,[[.7,"The whisper fades, for now.",{}],[.3,"It festers and clouds your mind.",{m:-1}]]]]),
 E("tide","Beast tide","The ground shakes as spirit beasts pour toward the village.",1,3,null,[
  ["Defend the village",0,[[.5,"You hold the line and are hailed.",{r:3,s:20}],[.3,"You hold, but at a cost.",{b:-6,r:1}],[.2,"A great beast singles you out.",{duel:"beast",y:0}]]],
  ["Slip away",0,[[1,"You escape, unnoticed and unproud.",{r:-1}]]]]),
 E("star","A falling star","A streak of fire crashes into the hills.",2,5,null,[
  ["Chase it",0,[[.4,"A star-iron fragment. Lucky and rich.",{l:2,s:50}],[.4,"Only scorched rock.",{b:-3}],[.2,"The impact zone is unstable.",{b:-8}]]],
  ["Make a wish",0,[[1,"You close your eyes and feel calm.",{l:1}]]]]),
 E("manual","A secret manual","A dead cultivator's pack holds a worn manual.",1,3,null,[
  ["Study it",0,[[.5,"A real technique!",{t:1}],[.3,"Deep notes on cultivation sharpen your mind.",{m:1}],[.2,"A booby-trapped page drains your qi.",{q:-15}]]],
  ["Sell it",0,[[1,"A collector pays well.",{s:45}]]]]),
 E("elder","A dying elder","An old man gasps beside the road, clutching a pouch.",0,3,null,[
  ["Care for him",0,[[.7,"He dies thanking you and leaves his pouch.",{s:30,r:1}],[.3,"He dies before you can help.",{b:-1}]]],
  ["Rob him",0,[[.6,"Easy coin, heavy conscience.",{s:60,r:-3}],[.4,"His kin find you.",{b:-3,r:-3}]]]]),
 E("army","Imperial recruiters","Soldiers march into the village, looking for strong backs.",0,2,null,[
  ["Join the army",0,[[.5,"A hard year, a decent purse.",{s:40,r:2}],[.5,"A skirmish leaves you wounded.",{b:-6}]]],
  ["Hide",0,[[1,"They march on.",{}]]]]),
 E("child","A lost child","A little girl cries beside the road.",0,2,null,[
  ["Escort her home",0,[[.8,"Her family weeps with gratitude.",{r:2,l:1}],[.2,"Wolves follow your trail.",{b:-3}]]]]),
 E("vein","A spirit stone vein","The cliff face glitters with raw spirit stone.",2,4,null,[
  ["Mine it",0,[[.6,"A fat haul of stones.",{s:80}],[.3,"A rockfall injures you, but you carry stones out.",{b:-5,s:30}],[.1,"A guardian beast defends its vein.",{duel:"beast",y:0}]]],
  ["Report it to the sect",0,[[1,"The sect rewards your honesty.",{r:3}]]]]),
 E("mist","A poisonous valley","Green mist fills the pass. Qi swirls inside it.",1,3,null,[
  ["Cross it",0,[[.5,"The mist feeds your qi.",{q:25}],[.35,"You stagger out, poisoned.",{b:-6}],[.15,"The mist is lethal.",{d:"choked in a poisonous valley"}]]],
  ["Take the long way",0,[[1,"Five days of walking.",{y:5}]]]]),
 E("inn","A rain-soaked inn","A warm fire, a cheap room, and an old storyteller.",0,5,null,[
  ["Rest and listen",0,[[.7,"A good night restores you.",{b:3,y:1}],[.3,"His tales sharpen your thinking.",{m:1,y:1}]]]]),
 E("pickpocket","A pickpocket","A small hand slips toward your purse.",0,5,"market",[
  ["Give chase",0,[[.5,"You catch him and take back more than he took.",{s:15}],[.5,"You trip over a crate.",{b:-2}]]],
  ["Let it go",0,[[1,"A few stones lighter.",{s:-10}]]]]),
 E("eldertest","An elder's test","An elder asks a question no scripture answers.",0,3,"sect",[
  ["Answer boldly",0,[[.5,"The elder smiles. Your Mind and name grow.",{r:3,m:1}],[.5,"Wrong, and you are caned.",{b:-3,r:1}]]],
  ["Decline",0,[[1,"The elder shrugs.",{r:-1}]]]]),
 E("guardian","A ghost guardian","A pale soldier rises from the stones, spear levelled.",1,5,"ruins",[
  ["Fight",0,[[1,"Steel against spirit.",{duel:"ghost",y:0}]]],
  ["Offer tribute",20,[[.8,"The ghost accepts and fades.",{s:40}],[.2,"The ghost is unmoved and strikes.",{b:-5}]]]]),
 E("storm","Thunder on the peak","The sky breaks open above you.",3,5,"peak",[
  ["Endure it",0,[[.6,"You drink in the lightning.",{q:50}],[.4,"The storm nearly kills you.",{b:-10}]]],
  ["Descend",0,[[1,"Wisdom is knowing when to leave.",{}]]]]),
 E("alpha","The alpha beast","Eyes glint in the dark. The pack's leader steps out.",0,5,"forest",[
  ["Fight",0,[[1,"You meet its gaze and charge.",{duel:"beast",y:0}]]],
  ["Sneak away",0,[[.6,"You slip past in the shadows.",{y:1}],[.4,"It lunges as you flee.",{b:-3,y:1}]]]]),
 E("festival","Harvest festival","The village celebrates with songs and sweet wine.",0,1,"village",[
  ["Join in",0,[[.7,"A good day. Someone slips you a lucky charm.",{s:5,l:1,y:1}],[.3,"You dance for hours and win hearts.",{r:1,y:1}]]]])];

let S = { phase: "birth" };
let M = { fate: 0, lives: 0, best: 0, up: {} };

function rnd() {
  S.seed = (S.seed + 0x6D2B79F5) >>> 0; let t = S.seed;
  t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
const pick = (a) => a[Math.floor(rnd() * a.length)];
const bad = (msg) => ({ ok: false, msg });
const good = (msg, o) => ({ ok: true, msg, ...(o || {}) });
const canAct = () => S.phase === "life" && !S.dead;
const known = (id) => S.techs.includes(id);
const techSum = (k) => S.techs.reduce((a, id) => a + (TECH.find(t => t.id === id)[k] || 0), 0);
const maxBody = () => 10 + 5 * S.realm + (S.root.el === "Earth" ? 2 : 0) + (S.bodyBonus || 0);
const power = () => 3 + 3 * S.realm + techSum("d") + Math.floor(S.mind / 2) + (S.root.el === "Metal" ? 2 : 0) + Math.floor(S.qi / 50);
const evDef = () => EV.find(e => e.id === S.ev) || null;
function log(text) { S.log.unshift({ age: S.age, text }); if (S.log.length > 40) S.log.length = 40; }
function say(text) { S.note = text; log(text); }

function rollRoot(levels) {
  let best = null;
  for (let i = 0; i <= levels; i++) {
    let p = rnd() * ROOTS.reduce((a, r) => a + r.w, 0), r = ROOTS[ROOTS.length - 1];
    for (const c of ROOTS) { if (p < c.w) { r = c; break; } p -= c.w; }
    const root = { n: r.n, mult: r.mult, el: pick(EL) };
    if (!best || root.mult > best.mult) best = root;
  }
  return best;
}
function newRival() { return { n: pick(RIVAL_NAMES), p: 5 + 3 * S.realm, beaten: 0 }; }

function startLife(originIdx, seed) {
  const o = ORIGINS[originIdx] || ORIGINS[0], u = M.up || {};
  S = { phase: "life", seed: (seed === undefined ? Date.now() : seed) >>> 0, name: "", origin: o.id, age: 16, realm: 0,
    qi: 0, body: 0, mind: 0, luck: 0, stones: 0, rep: 0, herbs: 0, pills: { qi: 0, body: 0, bt: 0, life: 0 }, btBonus: 0,
    techs: u.tech ? ["breath"] : [], place: "village", lifespan: 60, bodyBonus: (o.b || 0) + 2 * (u.body || 0),
    log: [], ev: null, recent: [], duel: null, note: "", dead: null, wins: 0 };
  S.name = pick(NAMES); S.root = rollRoot(u.root || 0); S.rival = newRival();
  S.mind = 4 + (o.m || 0) + (u.mind || 0) + (S.root.el === "Water" ? 1 : 0);
  S.luck = 2 + (o.l || 0) + (u.luck || 0); S.stones = 20 + (o.s || 0) + 30 * (u.stones || 0);
  S.body = maxBody();
  log("Your journey begins."); S.ev = pickEvent();
  return good("A new life begins.");
}
function toBirth() { S = { phase: "birth" }; }

function pickEvent() {
  let pool = EV.filter(e => S.realm >= e.min && S.realm <= e.max && (!e.pl || e.pl === S.place) && !S.recent.includes(e.id));
  if (!pool.length) { S.recent = []; pool = EV.filter(e => S.realm >= e.min && S.realm <= e.max && (!e.pl || e.pl === S.place)); }
  // events tied to the current place are twice as likely
  const w = pool.flatMap(e => e.pl ? [e, e] : [e]); const e = pick(w);
  S.recent.push(e.id); if (S.recent.length > 8) S.recent.shift();
  return e.id;
}
function roll(outs) {
  let p = Math.max(0, rnd() - Math.min(.2, S.luck * .012));
  for (const o of outs) { if (p < o[0]) return o; p -= o[0]; }
  return outs[outs.length - 1];
}
function risk(outs) {
  let pd = 0, pb = 0;
  for (const [p, , f] of outs) { if (f.d) pd += p; else if (f.duel || f.b < 0) pb += p; }
  if (pd >= .1) return ["Deadly", "r4"]; if (pd > 0 || pb >= .4) return ["Dangerous", "r3"];
  if (pb >= .2) return ["Risky", "r2"]; if (pb > 0) return ["Minor risk", "r1"]; return ["Safe", "r0"];
}
function advance(y) {
  S.age += y;
  if (S.age >= S.lifespan) die("died peacefully of old age");
}
function die(cause, win) {
  if (S.dead) return;
  const gain = S.realm * 4 + Math.floor(S.age / 20) + Math.floor(S.rep / 3) + (win ? 20 : 0);
  S.dead = { cause, win: !!win, gain, age: S.age, realm: S.realm };
  M.fate += gain; M.lives++; M.best = Math.max(M.best, S.realm + (win ? 1 : 0));
  S.duel = null; S.ev = null; S.phase = "dead"; log(win ? "You ascend." : "Your life ends: " + cause + ".");
}
function learnRandom() {
  const c = TECH.filter(t => !known(t.id) && t.min <= S.realm);
  if (!c.length) { S.qi = clamp(S.qi + 20, 0, 100); return "You already know all you can. Insight becomes qi."; }
  const t = pick(c); S.techs.push(t.id); return "You learn " + t.n + ".";
}
function apply(e, defY) {
  let extra = "";
  if (e.q) S.qi = clamp(S.qi + e.q, 0, 100);
  if (e.m) S.mind = clamp(S.mind + e.m, 1, 40);
  if (e.l) S.luck = clamp(S.luck + e.l, 0, 15);
  if (e.s) S.stones = Math.max(0, S.stones + e.s);
  if (e.r) S.rep += e.r;
  if (e.L) S.lifespan += e.L;
  if (e.h) S.herbs = Math.max(0, S.herbs + e.h + (e.h > 0 && S.root.el === "Wood" && S.place === "forest" ? 1 : 0));
  if (e.sh) { S.stones += S.herbs * 6; S.herbs = 0; }
  if (e.pill) S.pills[e.pill]++;
  if (e.t) extra = " " + learnRandom();
  if (e.b) { S.body = clamp(S.body + e.b, 0, maxBody()); if (S.body <= 0) die("succumbed to their wounds"); }
  if (e.d) die(e.d);
  if (!S.dead && e.duel) startDuel(e.duel);
  const y = e.y !== undefined ? e.y : defY;
  if (!S.dead && y) advance(y);
  return extra;
}
function afterAction() { if (!S.dead && !S.duel) S.ev = pickEvent(); }

function choose(i) {
  if (!canAct() || S.duel) return bad("You cannot choose right now.");
  const ev = evDef(), o = ev && ev.o[i]; if (!o) return bad("No such choice.");
  if (S.stones < o[1]) return bad("Not enough spirit stones.");
  S.stones -= o[1]; const out = roll(o[2]); const extra = apply(out[2], 3);
  say(out[1] + extra); afterAction(); return good(out[1] + extra);
}
function act(i) {
  if (!canAct() || S.duel) return bad("You cannot act right now.");
  const o = PLACES.find(p => p.id === S.place).acts[i]; if (!o) return bad("No such action.");
  if (S.stones < o[1]) return bad("Not enough spirit stones.");
  if (/Buy a spirit herb/.test(o[0]) && S.stones < 8) return bad("Not enough spirit stones.");
  S.stones -= o[1]; const out = roll(o[2]); const extra = apply(out[2], 1);
  say(out[1] + extra); if (!S.dead && !S.duel && !S.ev) S.ev = pickEvent(); return good(out[1] + extra);
}
function travel(id) {
  if (!canAct() || S.duel) return bad("You cannot travel right now.");
  const p = PLACES.find(x => x.id === id); if (!p) return bad("Unknown place.");
  if (p.id === S.place) return bad("You are already here.");
  if (S.realm < p.min) return bad("You must reach " + R[p.min][0] + " first.");
  if (S.stones < p.cost) return bad("Travel costs " + p.cost + " stones.");
  S.stones -= p.cost; S.place = id; say("You travel to " + p.n + "."); advance(1);
  afterAction(); return good("Arrived at " + p.n + ".");
}
function seclude(n) {
  if (!canAct() || S.duel) return bad("You cannot seclude right now.");
  const gain = Math.round(n * (5 + S.mind * .6) * S.root.mult * (1 + techSum("q")) / (1 + S.realm * .95));
  const before = S.qi; S.qi = clamp(S.qi + gain, 0, 100);
  S.body = clamp(S.body + n, 0, maxBody()); if (rnd() < n * .04) S.mind++;
  say("You seclude for " + n + " years. Qi +" + (S.qi - before) + (before + gain > 100 ? " (overflow wasted)." : "."));
  advance(n); afterAction(); return good("Secluded.");
}
function chance() {
  return clamp(.64 - S.realm * .13 + S.mind * .012 + S.luck * .008 + (S.root.mult - 1) * .15 + S.btBonus, .1, .95);
}
function breakthrough() {
  if (!canAct() || S.duel) return bad("You cannot break through right now.");
  if (S.qi < 100) return bad("Your qi is not full yet.");
  const ok = rnd() < chance(); S.btBonus = 0;
  if (ok) {
    if (S.realm === 5) { die("ascended beyond the mortal world", true); return good("You ascend."); }
    S.realm++; S.qi = 0; S.lifespan = 60 + R[S.realm][2]; S.body = maxBody(); S.mind++;
    if (rnd() < .75) { S.rival.p += 3; }
    say("Breakthrough! You reach " + R[S.realm][0] + ".");
  } else {
    S.qi = 40; S.body = clamp(S.body - (2 + S.realm * 2), 0, maxBody());
    say("The breakthrough fails. Your meridians scream.");
    if (S.body <= 0) { die("was torn apart by a failed breakthrough"); return good("You died."); }
  }
  advance(1); afterAction(); return good(ok ? "Success" : "Failure", { success: ok });
}
function learn(id) {
  if (!canAct() || S.duel) return bad("You cannot study right now.");
  const t = TECH.find(x => x.id === id); if (!t) return bad("Unknown technique.");
  if (S.place !== "sect") return bad("Techniques are taught at the Azure Cloud Sect.");
  if (known(id)) return bad("You already know it.");
  if (S.realm < t.min) return bad("Requires " + R[t.min][0] + ".");
  if (S.rep < t.rep) return bad("Requires reputation " + t.rep + ".");
  if (S.stones < t.cost) return bad("Costs " + t.cost + " stones.");
  S.stones -= t.cost; S.techs.push(id); say("You learn " + t.n + "."); advance(1); afterAction();
  return good("Learned " + t.n + ".");
}
function brewChance(key) {
  return clamp(RECIPES[key].base + S.mind * .015 + S.luck * .008 + (S.root.el === "Fire" ? .1 : 0) + techSum("a"), .05, .95);
}
function brew(key) {
  if (!canAct() || S.duel) return bad("You cannot brew right now.");
  const r = RECIPES[key]; if (!r) return bad("Unknown recipe.");
  if (S.realm < r.min) return bad("Requires " + R[r.min][0] + ".");
  if (S.herbs < r.herbs) return bad("Needs " + r.herbs + " spirit herbs.");
  S.herbs -= r.herbs; const ok = rnd() < brewChance(key);
  if (ok) { S.pills[key]++; say("The cauldron glows. You brew a " + r.n + "."); }
  else { say("The pill cracks and bursts. The herbs are wasted."); S.body = clamp(S.body - 1, 0, maxBody()); if (S.body <= 0) die("was killed by an alchemy explosion"); }
  if (!S.dead) advance(1); afterAction(); return good(ok ? "Brewed" : "Failed", { success: ok });
}
function usePill(key) {
  if (!canAct()) return bad("You cannot do that now.");
  if (!S.pills[key]) return bad("You have none.");
  S.pills[key]--;
  if (key === "qi") S.qi = clamp(S.qi + 30, 0, 100);
  if (key === "body") S.body = clamp(S.body + 8, 0, maxBody());
  if (key === "bt") S.btBonus = Math.min(.3, S.btBonus + .15);
  if (key === "life") S.lifespan += 12;
  say("You take a " + RECIPES[key].n + "."); return good("Used.");
}

function startDuel(kind) {
  let f;
  if (kind === "rival") f = { n: S.rival.n, p: S.rival.p, hp: 12 + 8 * S.realm, loot: 30, rep: 3, rival: true };
  else { const d = FOES[kind]; f = { n: d.n, p: Math.round(d.p + d.pr * S.realm), hp: Math.round(d.hp + d.hr * S.realm), loot: d.loot, rep: d.rep, herb: d.herb || 0 }; }
  S.duel = { kind, n: f.n, p: f.p, hp: f.hp, max: f.hp, loot: f.loot, rep: f.rep, herb: f.herb || 0, rival: !!f.rival, round: 1, last: null, foeLast: null };
  say(f.n + " blocks your way!");
}
function duelMove(st) {
  if (!canAct() || !S.duel) return bad("No duel in progress.");
  if (!(st >= 0 && st <= 2)) return bad("Invalid stance.");
  if (st === 2 && !S.techs.some(id => TECH.find(t => t.id === id).d > 0)) return bad("You know no combat technique.");
  const d = S.duel; let fs = d.foeLast !== null && rnd() < .4 ? d.foeLast : Math.floor(rnd() * 3);
  const mine = power(), res = { me: st, foe: fs, foeName: d.n }; let dm = 0, df = 0;
  if (st === fs) { dm = 1; df = 1; res.r = "clash"; }
  else if (BEATS[st] === fs) { df = Math.ceil(mine * (.6 + rnd() * .5) / 2); if (st === 2) df = Math.ceil(df * 1.5); if (st === 1) { df = Math.ceil(df * .6); S.body = clamp(S.body + 1, 0, maxBody()); } res.r = "win"; }
  else { dm = Math.ceil(d.p * (.6 + rnd() * .5) / 2); res.r = "lose"; }
  d.hp -= df; S.body -= dm; res.dealt = df; res.taken = dm; d.last = st; d.foeLast = fs; d.round++;
  if (S.body <= 0) { S.body = 0; die("was slain by " + d.n); res.end = "dead"; return good("You fall.", res); }
  if (d.hp <= 0) {
    S.stones += d.loot; S.rep += d.rep; S.wins++; if (d.herb) S.herbs += d.herb; let t = "You defeat " + d.n + ". +" + d.loot + " stones.";
    if (d.rival) { S.rival.beaten++; if (S.rival.beaten >= 2) { t += " " + S.rival.n + " is finished. A new rival will rise."; S.rival = newRival(); } else t += " " + S.rival.n + " flees, vowing revenge."; }
    S.duel = null; say(t); advance(1); afterAction(); res.end = "win"; return good(t, res);
  }
  return good("Round " + (d.round - 1), res);
}
function flee() {
  if (!canAct() || !S.duel) return bad("No duel in progress.");
  const c = clamp(.45 + S.luck * .03 + techSum("f"), .1, .9);
  if (rnd() < c) { S.duel = null; say("You escape."); advance(1); afterAction(); return good("Escaped.", { escaped: true }); }
  S.body -= Math.ceil(S.duel.p / 2);
  if (S.body <= 0) { S.body = 0; die("was cut down while fleeing " + S.duel.n); return good("You fall."); }
  return good("You fail to escape and take a hit.", { escaped: false });
}
function buyUpgrade(id) {
  const u = UPGRADES.find(x => x.id === id); if (!u) return bad("Unknown upgrade.");
  const lvl = (M.up[id] || 0); if (lvl >= u.cost.length) return bad("Already at maximum.");
  if (M.fate < u.cost[lvl]) return bad("Not enough fate.");
  M.fate -= u.cost[lvl]; M.up[id] = lvl + 1; return good("Upgraded.");
}
const serialize = () => JSON.stringify({ v: 4, S, M });
function load(json) {
  try { const d = JSON.parse(json); if (d && d.v === 4 && d.S && d.M && d.M.up) { S = d.S; M = d.M; return true; } } catch (_) {}
  return false;
}
function migrateV3(json) { // keep fate earned in the old v3 game
  try { const d = JSON.parse(json); if (d && d.M) { M.fate += d.M.fate | 0; M.lives = d.M.lives | 0; M.best = d.M.best | 0; return true; } } catch (_) {}
  return false;
}
const api = { R, ORIGINS, ROOTS, ELFX, TECH, RECIPES, UPGRADES, PLACES, EV, FOES, STANCES,
  get S() { return S; }, get M() { return M; }, set(s, m) { S = s; if (m) M = m; },
  startLife, toBirth, choose, act, travel, seclude, breakthrough, chance, learn, brew, brewChance, usePill, duelMove, flee,
  buyUpgrade, risk, power, maxBody, evDef, serialize, load, migrateV3, rnd };
if (typeof module !== "undefined" && module.exports) module.exports = api; else root.WB = api;
})(this);

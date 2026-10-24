// Worldbound engine v6 — pure game rules, no DOM. Loaded by index.html and by tests.js (node).
(function (root) {
"use strict";
const R = [["Mortal","凡",60],["Qi Condensation","气",75],["Foundation","基",100],["Core Formation","丹",140],["Nascent Soul","婴",210],["Soul Transformation","神",330]]; // third value: lifespan (age) at that realm
const EVENT_YEARS = 1; // years an event choice takes unless its outcome says otherwise
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
  bandit:{n:"Bandit chief",p:4,pr:3,hp:10,hr:6,loot:20,rep:1,lore:"A road tyrant with a red scarf and a notched blade. Cowardly once his men fall."},
  beast:{n:"Spirit beast",p:5,pr:3,hp:12,hr:7,loot:15,rep:1,herb:1,lore:"A fox-tiger fed on spirit herbs. Its flame mane marks how much qi it has eaten."},
  ghost:{n:"Ruin guardian",p:6,pr:3.5,hp:14,hr:8,loot:40,rep:2,lore:"A soldier bound to a vanished kingdom. It guards the vault long after the vault is empty."},
  demon:{n:"Demon cultivator",p:7,pr:4,hp:16,hr:9,loot:50,rep:4,lore:"A cultivator who traded his heart for power. Black qi wraps him like smoke."},
  kingboar:{n:"King Boar",p:6,pr:3,hp:16,hr:8,loot:30,rep:2,herb:1,el:"Earth",weak:"Wood",charge:1.4,tip:"Roots tangle the charging boar!",lore:"A mutated boar the size of a cart. Its charge hits hard; rooted ground slows it."},
  archespore:{n:"Archespore",p:6,pr:3.5,hp:18,hr:9,loot:35,rep:3,herb:3,el:"Wood",weak:"Fire",regen:2,tip:"Fire scorches the fungal flesh!",lore:"A fungal behemoth that waits where the land is forgotten. It regrows unless burned."},
  ursusumbra:{n:"Ursusumbra",p:8,pr:3.5,hp:22,hr:9,loot:55,rep:4,el:"Earth",weak:"Water",armor:.3,tip:"Water seeps into the cracked plates!",lore:"A pale giant with bone plates fused to its skin. Slow, but one blow breaks walls."},
  behemoth:{n:"Frost Behemoth",p:9,pr:4,hp:24,hr:10,loot:70,rep:5,el:"Water",weak:"Fire",armor:.25,charge:1.25,tip:"Flame cracks the frozen armor!",lore:"A horned, armored titan of the high snows. Its plates turn blades; technique pierces them."},
  kraken:{n:"Kraken",p:10,pr:4.5,hp:26,hr:11,loot:90,rep:6,el:"Water",weak:"Earth",drain:8,tip:"Earth pins the grasping tentacles!",lore:"An abyssal hunter with a brain in every arm. Its grip drains qi as well as blood."},
  leviathan:{n:"Ocean Leviathan",p:11,pr:5,hp:30,hr:12,loot:120,rep:8,el:"Water",weak:"Earth",regen:2,tip:"Earth dams the leviathan's currents!",lore:"A titan of living water, runes glowing along its scales. The sea heals it."}};
const STANCES = ["Strike","Guard","Technique"]; // Guard beats Strike, Technique beats Guard, Strike beats Technique
const BEATS = { 1:0, 2:1, 0:2 };
// Integrated expansion data. Worldbound stays a browser life-sim; these systems extend its existing Dao, sect, and bestiary loops.
const DAO_PATHS = [
  {id:"sword", n:"Sword Dao", glyph:"剑", passive:"+2 duel power, with mastery increasing precision.", ability:"Blade Intent", active:"Charge your next successful hit with extra damage.", weakness:"Less efficient at non-combat recovery."},
  {id:"alchemy", n:"Alchemy Dao", glyph:"丹", passive:"+10% brewing success, plus a small bonus from alchemist disciples.", ability:"Golden Transmutation", active:"During a duel, recover qi and a little Body; at an event, convert effort into stones.", weakness:"Lower direct combat power."},
  {id:"body", n:"Body Dao", glyph:"体", passive:"+3 maximum Body and better recovery while secluded.", ability:"Mountain-Bearing Flesh", active:"Recover Body and reduce the next incoming hit.", weakness:"No bonus to breakthrough chance."},
  {id:"formation", n:"Formation Dao", glyph:"阵", passive:"+3% breakthrough chance; improves squad and mission coordination.", ability:"Set the Array", active:"Raise a shield in a duel, or gain standing during an event.", weakness:"Most effective when you have trained support."},
  {id:"shadow", n:"Shadow Dao", glyph:"影", passive:"Improves escape odds and adds flexibility in dangerous encounters.", ability:"Veil Step", active:"Avoid the next incoming blow, or gain Luck during an event.", weakness:"Less suited to prolonged direct duels."}
];
const DISCIPLE_ROLES = [
  {id:"guard", n:"Iron Guard", x:"Reduces incoming duel damage as rank rises."},
  {id:"alchemist", n:"Pill Refiner", x:"Improves brewing success."},
  {id:"scout", n:"Pathfinder", x:"Improves escape odds and field safety."},
  {id:"scholar", n:"Scripture Scholar", x:"Improves breakthrough preparation and research."},
  {id:"herbalist", n:"Spirit Herbalist", x:"Finds extra herbs in suitable gathering outcomes."}
];
const DISCIPLE_NAMES = ["Shen Rui","Lan Yue","Guo Fan","Mei Lin","Zhao Ning","Yu Qiao","Chen Bo","Rong Xiu","Wen Kai","Su He","Jin Tao","Qiao An"];
const BEAST_BONDS = {
  beast:{n:"Flame-Tuft Spirit Beast",cost:18,role:"scout",x:"A nimble companion that helps you avoid danger."},
  kingboar:{n:"King Boar",cost:24,role:"guardian",x:"A stubborn guardian that softens incoming blows."},
  archespore:{n:"Archespore",cost:26,role:"forager",x:"A spore companion that improves herb gathering."},
  ursusumbra:{n:"Ursusumbra",cost:32,role:"guardian",x:"Heavy armor and a powerful protective presence."},
  behemoth:{n:"Frost Behemoth",cost:36,role:"companion",x:"A titan companion that bolsters combat power."},
  kraken:{n:"Kraken Whelp",cost:42,role:"companion",x:"A rare abyssal bond with a deep qi resonance."},
  leviathan:{n:"Leviathan Echo",cost:50,role:"companion",x:"An ancient echo that strengthens your presence."}
};
const BEAST_ROLES = [
  {id:"guardian",n:"Guardian",x:"Reduce incoming duel damage."},
  {id:"scout",n:"Scout",x:"Improve escape odds."},
  {id:"forager",n:"Forager",x:"Improve herb gathering."},
  {id:"companion",n:"Combat Companion",x:"Add combat power at higher bond levels."}
];
const FACTIONS = [
  {id:"azure",n:"Azure Cloud Sect",home:"sect",min:0,x:"A disciplined school of orthodox cultivators.",perk:"Training, standing, and coordinated breakthroughs."},
  {id:"wardens",n:"Beast Wardens",home:"forest",min:0,x:"Trackers who protect villages from spirit beasts.",perk:"Better beast bonding and field safety."},
  {id:"mist",n:"Mist Market Guild",home:"market",min:0,x:"Merchants, alchemists, and discreet brokers.",perk:"Better commerce and alchemy supplies."},
  {id:"scholars",n:"Ruin Scholars",home:"ruins",min:1,x:"Researchers of lost empires and forbidden arrays.",perk:"Field research and insight."},
  {id:"tidebound",n:"Tidebound Covenant",home:"coast",min:3,x:"Sea cultivators who study leviathans and tides.",perk:"A safer path into abyssal regions."}
];
const FIELD_UPGRADES = [
  {id:"trail", n:"Trail-Sense Method", cost:1, glyph:"踪", x:"Gain +8 percentage points to escape odds. Learn to read broken reeds, disturbed dust, and beast movement before danger closes in."},
  {id:"forager", n:"Forager's Atlas", cost:2, glyph:"药", x:"Gain one extra herb from herb-bearing events and field studies. The archive identifies safer growths and medicinal lookalikes."},
  {id:"weakness", n:"Weakness Codex", cost:3, glyph:"识", x:"Gain +2 duel power when your element matches a foe's documented weakness. Applies only when the matchup is actually favorable."},
  {id:"warding", n:"Warding Sigils", cost:3, glyph:"阵", x:"Begin each duel with a 3-point protective ward, inspired by defensive formations recorded in ancient ruins."}
];
const FIELD_NOTES = {
  village:{title:"A Village's Quiet Meridians",text:"The village sits where small earth veins meet. Locals can read a change in the wind before a storm."},
  market:{title:"Trade Routes of Spirit Herb",text:"Merchants judge herb quality by scent, colour, and the drift of qi. Their ledgers also map paths missing from public charts."},
  sect:{title:"The Azure Cloud Formation",text:"The courtyard stones form a circulation array. Its broken inner ring suggests a forgotten teaching."},
  forest:{title:"Tracks Beneath the Whispering Canopy",text:"Claw marks and shed scales reveal that most beasts avoid needless fights. Patient observation can teach more than reckless hunting."},
  ruins:{title:"The Last Watch of the Sunken Kingdom",text:"The guardians protected a treasury, but inscriptions suggest it had been moved before the kingdom fell."},
  peak:{title:"Thunder on Heaven's Peak",text:"The oldest lightning marks run through the stone instead of across it. The mountain once carried an enormous formation."},
  wastes:{title:"The Spores Remember",text:"The Rotting Wastes are not lifeless. A fungal web exchanges nutrients and qi under the ash, and its largest spores react to flame."},
  coast:{title:"A Song Beneath the Abyssal Coast",text:"The tide pulls against the moon in irregular intervals. Something far below answers the rhythm."}
};

const PLACES = [
 {id:"village",n:"Mountain Village",min:0,cost:0,dg:.6,x:"Quiet, safe, and poor.",acts:[
  ["Work the fields",0,[[.85,"Honest work earns a few stones.",{s:7}],[.15,"A bad harvest. You earn nothing.",{}]]],
  ["Rest and recover",0,[[1,"A week of sleep and thin soup restores you.",{b:4}]]]]},
 {id:"market",n:"Misty Market",min:0,cost:4,dg:1,x:"Traders, rumors, and spirit herbs.",acts:[
  ["Buy a spirit herb",8,[[1,"You haggle and walk away with a herb.",{h:1,y:0}]]],
  ["Sell all your herbs",0,[[1,"The herbalist counts out your stones.",{sh:1,y:0}]]],
  ["Listen for rumors",0,[[.5,"A drunk mentions a hidden spring. Your luck stirs.",{l:1}],[.5,"Only gossip.",{}]]]]},
 {id:"sect",n:"Azure Cloud Sect",min:0,cost:6,dg:.7,x:"Techniques are taught here, for a price.",acts:[
  ["Run errands for the elders",0,[[.8,"The elders note your diligence.",{r:1,s:4}],[.2,"A senior disciple bullies you.",{b:-2}]]]]},
 {id:"forest",n:"Whispering Forest",min:0,cost:3,dg:1.3,x:"Herbs and beasts grow wild here.",acts:[
  ["Gather herbs",0,[[.55,"You find two spirit herbs.",{h:2}],[.3,"You find one, and a thorny beast bites you.",{h:1,b:-3}],[.15,"A beast stalks you. You must fight.",{duel:"beast"}]]],
  ["Hunt a spirit beast",0,[[1,"You track a beast to its lair.",{duel:"beast",y:0}]]]]},
 {id:"ruins",n:"Sunken Ruins",min:1,cost:12,dg:1.3,x:"Traps, treasure, and old ghosts.",acts:[
  ["Search the ruins",0,[[.35,"You pry open a sealed vault.",{s:60,h:1,r:1}],[.35,"Mostly dust, plus a few stones.",{s:12}],[.2,"A trap springs.",{b:-6}],[.1,"The ceiling collapses.",{d:"was buried in forgotten ruins"}]]]]},
 {id:"peak",n:"Heaven's Peak",min:3,cost:40,dg:1,x:"Thin air, thunder, and enlightenment.",acts:[
  ["Meditate in the storm",0,[[.5,"Lightning tempers your meridians.",{q:45,m:1}],[.35,"The storm batters you.",{q:15,b:-8}],[.15,"A bolt finds you.",{d:"was struck down on Heaven's Peak"}]]]]},
 {id:"wastes",n:"Rotting Wastes",min:1,cost:8,dg:1.6,x:"Forgotten battlefields where spores bloom.",acts:[
  ["Harvest glowing spores",0,[[.5,"You gather three luminous spore caps.",{h:3}],[.3,"Spores sting your lungs, but you carry two herbs out.",{h:2,b:-3}],[.2,"The ground heaves. Something ancient wakes.",{duel:"archespore"}]]]]},
 {id:"coast",n:"Abyssal Coast",min:2,cost:20,dg:1.4,x:"Black water, bright pearls, and things below.",acts:[
  ["Dive for sea pearls",0,[[.45,"Pearls glitter in the silt.",{s:70}],[.3,"A current batters you, but you surface with a few pearls.",{b:-5,s:20}],[.15,"Tentacles uncoil from the dark.",{duel:"kraken"}],[.1,"The deep takes you.",{d:"drowned in the abyssal sea"}]]]]}];

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
  ["Join in",0,[[.7,"A good day. Someone slips you a lucky charm.",{s:5,l:1,y:1}],[.3,"You dance for hours and win hearts.",{r:1,y:1}]]]]),
 E("kingboar","The King Boar","The undergrowth explodes. A tusked boar, big as a cart, paws the earth.",0,3,"forest",[
  ["Stand and fight",0,[[1,"You brace for the charge.",{duel:"kingboar",y:0}]]],
  ["Climb a tree",0,[[.6,"It snorts below until it loses interest.",{y:1}],[.4,"A tusk rakes your heel as you climb.",{b:-4,y:1}]]]]),
 E("sleeper","The sleeper in the spores","A mound of moss and mushrooms breathes slowly. Something huge is dreaming under it.",1,5,"wastes",[
  ["Burn the mushrooms",0,[[.5,"Flames roll across the mound. You scoop rare herbs from the ash.",{h:2}],[.3,"The fire wakes it.",{duel:"archespore",y:0}],[.2,"Burning spores choke you.",{b:-4}]]],
  ["Tiptoe away",0,[[.7,"You leave it to dream.",{y:1}],[.3,"A spore cloud follows you.",{b:-3,y:1}]]]]),
 E("giant","The pale giant","A hulking, pale thing crouches in the dark, chewing something that used to be a door.",2,5,"ruins",[
  ["Fight",0,[[1,"You step into its light.",{duel:"ursusumbra",y:0}]]],
  ["Sneak past",0,[[.6,"It never looks up.",{y:1}],[.4,"A swinging arm clips you.",{b:-6,y:1}]]]]),
 E("snowtitan","The blizzard titan","Snow shifts on the ridge. Two horns, then an armored back as wide as a house.",3,5,"peak",[
  ["Fight",0,[[1,"You raise your weapon against the storm.",{duel:"behemoth",y:0}]]],
  ["Retreat down the ridge",0,[[.6,"You slide to safety.",{y:1}],[.4,"The titan roars and the ridge shakes.",{b:-6,y:1}]]]]),
 E("ship","A ship in distress","A trade ship rocks in the black water, one mast snapped, lanterns still burning.",2,5,"coast",[
  ["Help the crew",0,[[.4,"You save the crew and the captain pays handsomely.",{r:3,s:60}],[.35,"Something huge grips the hull.",{duel:"kraken",y:0}],[.25,"Waves throw you against the rocks.",{b:-6}]]],
  ["Sail past",0,[[1,"The lanterns fade behind you.",{r:-1}]]]]),
 E("song","The leviathan's song","The sea hums a note you feel in your bones. Cyan light moves beneath the waves.",3,5,"coast",[
  ["Listen",0,[[.5,"The song opens your mind.",{m:2,q:30}],[.3,"The song hurts as much as it teaches.",{b:-8}],[.2,"The singer rises to see who listens.",{duel:"leviathan",y:0}]]],
  ["Plug your ears",0,[[1,"Silence, and a long walk home.",{y:2}]]]])];

let S = { phase: "birth" };
let M = { fate: 0, lives: 0, best: 0, up: {}, seen: {}, slain: {} };

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
const maxBody = () => 10 + 5 * S.realm + (S.root.el === "Earth" ? 2 : 0) + (S.bodyBonus || 0) + ((S.dao && S.dao.path === "body") ? 3 : 0);
function discipleWeight(role) {
  return (S.disciples || []).filter(d => d.role === role).reduce((n, d) => n + Math.max(1,
    (d.level || 1) + Math.min(2, Math.floor((d.realm || 0) / 2)) + ((d.loyalty || 0) >= 65 ? 1 : 0) + ((d.morale || 0) >= 80 ? 1 : 0)), 0);
}
function beastWeight(role) {
  return (S.beasts || []).filter(b => b.role === role).reduce((n, b) => n + Math.max(1, (b.level || 1) + ((b.affinity || 0) >= 70 ? 1 : 0)), 0);
}
const power = () => 3 + 3 * S.realm + techSum("d") + Math.floor(S.mind / 2) + (S.root.el === "Metal" ? 2 : 0) + Math.floor(S.qi / 50)
  + ((S.dao && S.dao.path === "sword") ? 1 + Math.floor(((S.dao.mastery || {}).sword || 1) / 3) : 0)
  + ((S.dao && ["alchemy","body","shadow"].includes(S.dao.path)) ? -1 : 0)
  + ((S.dao && S.dao.path === "formation" && !(S.disciples || []).length && !(S.beasts || []).length) ? -1 : 0)
  + (beastWeight("companion") > 0 ? Math.max(1, Math.floor((beastWeight("companion") + 1) / 3)) : 0)
  + ((S.faction === "tidebound" && S.duel && ["kraken","leviathan"].includes(S.duel.kind)) ? 2 : 0)
  + ((S.fieldcraft && S.fieldcraft.weakness && S.duel && S.duel.weak && (S.root.el === S.duel.weak || (S.duel.weak === "Fire" && known("flame")))) ? 2 : 0);
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
    techs: u.tech ? ["breath"] : [], place: "village", lifespan: R[0][2], bodyBonus: (o.b || 0) + 2 * (u.body || 0),
    log: [], ev: null, forced: false, lifeBonus: 0, recent: [], duel: null, note: "", dead: null, wins: 0,
    dao: { path: null, mastery: {}, xp: 0, usedEvent: false },
    disciples: [], nextDiscipleId: 1, beasts: [], fieldNotes: {}, research: 0, fieldcraft: {},
    faction: null, factionRep: {}, factionMissions: 0 };
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
  if (S.dao && S.dao.path) { M.pathLegacy = M.pathLegacy || {}; M.pathLegacy[S.dao.path] = (M.pathLegacy[S.dao.path] || 0) + 1; }
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
  if (e.L) { S.lifespan += e.L; S.lifeBonus = (S.lifeBonus | 0) + e.L; }
  if (e.h) S.herbs = Math.max(0, S.herbs + e.h + (e.h > 0 && S.root.el === "Wood" && S.place === "forest" ? 1 : 0) + (e.h > 0 ? Math.min(2, Math.ceil(discipleWeight("herbalist") / 3) + Math.floor(beastWeight("forager") / 3)) : 0) + (e.h > 0 && S.fieldcraft && S.fieldcraft.forager ? 1 : 0));
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
function afterAction() { if (!S.dead && !S.duel) { S.ev = pickEvent(); S.forced = false; if (S.dao) S.dao.usedEvent = false; } }
const INTERRUPTED = "Something has interrupted you. Deal with it first.";
const THREATS = ["bandits", "rival", "demon", "demonheart", "tide"]; // events that can break a seclusion
function threat() {
  const pool = EV.filter(e => THREATS.includes(e.id) && S.realm >= e.min && S.realm <= e.max && (!e.pl || e.pl === S.place));
  if (!pool.length) return null;
  const e = pick(pool); S.recent.push(e.id); if (S.recent.length > 8) S.recent.shift(); return e.id;
}
const disturbChance = () => clamp(.035 * PLACES.find(p => p.id === S.place).dg + .006 * S.realm, 0, .25); // per year of seclusion

function choose(i) {
  if (!canAct() || S.duel) return bad("You cannot choose right now.");
  const ev = evDef(), o = ev && ev.o[i]; if (!o) return bad("No such choice.");
  if (S.stones < o[1]) return bad("Not enough spirit stones.");
  S.stones -= o[1]; const out = roll(o[2]); const extra = apply(out[2], EVENT_YEARS);
  say(out[1] + extra); afterAction(); return good(out[1] + extra);
}
function act(i) {
  if (!canAct() || S.duel) return bad("You cannot act right now."); if (S.forced) return bad(INTERRUPTED);
  const o = PLACES.find(p => p.id === S.place).acts[i]; if (!o) return bad("No such action.");
  if (S.stones < o[1]) return bad("Not enough spirit stones.");
  if (/Buy a spirit herb/.test(o[0]) && S.stones < 8) return bad("Not enough spirit stones.");
  S.stones -= o[1]; const out = roll(o[2]); const extra = apply(out[2], 1);
  say(out[1] + extra); if (!S.dead && !S.duel && !S.ev) S.ev = pickEvent(); return good(out[1] + extra);
}
function travel(id) {
  if (!canAct() || S.duel) return bad("You cannot travel right now."); if (S.forced) return bad(INTERRUPTED);
  const p = PLACES.find(x => x.id === id); if (!p) return bad("Unknown place.");
  if (p.id === S.place) return bad("You are already here.");
  if (S.realm < p.min) return bad("You must reach " + R[p.min][0] + " first.");
  if (S.stones < p.cost) return bad("Travel costs " + p.cost + " stones.");
  S.stones -= p.cost; S.place = id; say("You travel to " + p.n + "."); advance(1);
  afterAction(); return good("Arrived at " + p.n + ".");
}
function seclude(n) {
  if (!canAct() || S.duel) return bad("You cannot seclude right now.");
  if (S.forced) return bad(INTERRUPTED);
  const rate = (5 + S.mind * .6) * S.root.mult * (1 + techSum("q")) / (1 + S.realm * .95) * ((S.dao && S.dao.path === "sword") ? .85 : 1), pd = disturbChance();
  let done = 0, hit = false;
  for (let i = 0; i < n; i++) { done++; if (S.age + done >= S.lifespan) break; if (rnd() < pd) { hit = true; break; } }
  const before = S.qi, raw = before + Math.round(done * rate); S.qi = clamp(raw, 0, 100);
  S.body = clamp(S.body + done + ((S.dao && S.dao.path === "body") ? Math.ceil(done * .5) : 0), 0, maxBody()); if (done && rnd() < done * .04 + discipleWeight("scholar") * .003) S.mind++;
  say((hit ? "Your seclusion is broken after " + done + (done === 1 ? " year" : " years") : "You seclude for " + n + " years") + ". Qi +" + (S.qi - before) + (raw > 100 ? " (overflow wasted)." : "."));
  advance(done);
  if (hit && !S.dead) { const t = threat(); if (t) { S.ev = t; S.forced = true; return good("Interrupted.", { interrupted: true, years: done }); } }
  afterAction(); return good("Secluded.", { years: done });
}
function chance() {
  return clamp(.64 - S.realm * .13 + S.mind * .012 + S.luck * .008 + (S.root.mult - 1) * .15 + S.btBonus + ((S.dao && S.dao.path === "formation") ? .03 : 0) + discipleWeight("scholar") * .006 + (S.faction === "azure" ? .02 : 0), .1, .95);
}
function breakthrough() {
  if (!canAct() || S.duel) return bad("You cannot break through right now."); if (S.forced) return bad(INTERRUPTED);
  if (S.qi < 100) return bad("Your qi is not full yet.");
  const ok = rnd() < chance(); S.btBonus = 0;
  if (ok) {
    if (S.realm === 5) { die("ascended beyond the mortal world", true); return good("You ascend."); }
    S.realm++; S.qi = 0; S.lifespan = R[S.realm][2] + (S.lifeBonus | 0); S.body = maxBody(); S.mind++;
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
  if (!canAct() || S.duel) return bad("You cannot study right now."); if (S.forced) return bad(INTERRUPTED);
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
  return clamp(RECIPES[key].base + S.mind * .015 + S.luck * .008 + (S.root.el === "Fire" ? .1 : 0) + techSum("a") + ((S.dao && S.dao.path === "alchemy") ? .1 : 0) + Math.min(.12, discipleWeight("alchemist") * .025) + (S.faction === "mist" ? .03 : 0), .05, .95);
}
function brew(key) {
  if (!canAct() || S.duel) return bad("You cannot brew right now."); if (S.forced) return bad(INTERRUPTED);
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
  if (key === "life") { S.lifespan += 12; S.lifeBonus = (S.lifeBonus | 0) + 12; }
  say("You take a " + RECIPES[key].n + "."); return good("Used.");
}

function startDuel(kind) {
  let f; const t = FOES[kind] || {};
  if (kind === "rival") f = { n: S.rival.n, p: S.rival.p, hp: 12 + 8 * S.realm, loot: 30, rep: 3, rival: true };
  else { const d = FOES[kind]; f = { n: d.n, p: Math.round(d.p + d.pr * S.realm), hp: Math.round(d.hp + d.hr * S.realm), loot: d.loot, rep: d.rep, herb: d.herb || 0 }; }
  S.duel = { kind, n: f.n, p: f.p, hp: f.hp, max: f.hp, loot: f.loot, rep: f.rep, herb: f.herb || 0, rival: !!f.rival, round: 1, last: null, foeLast: null,
    weak: t.weak || null, regen: t.regen || 0, charge: t.charge || 0, armor: t.armor || 0, drain: t.drain || 0, tip: t.tip || "", msg: "", shield: (S.fieldcraft && S.fieldcraft.warding ? 3 : 0), pathUsed: false, pathDamage: 0, evadeNext: false, reduceNext: false };
  if (S.dao) S.dao.usedEvent = false;
  M.seen = M.seen || {}; if (kind !== "rival") M.seen[kind] = true;
  say(f.n + " blocks your way!");
}
const weakHit = (d) => !!d.weak && (S.root.el === d.weak || (d.weak === "Fire" && known("flame")));
function duelMove(st) {
  if (!canAct() || !S.duel) return bad("No duel in progress.");
  if (!(st >= 0 && st <= 2)) return bad("Invalid stance.");
  if (st === 2 && !S.techs.some(id => TECH.find(t => t.id === id).d > 0)) return bad("You know no combat technique.");
  const d = S.duel; let fs = d.foeLast !== null && rnd() < .4 ? d.foeLast : Math.floor(rnd() * 3);
  const mine = power(), res = { me: st, foe: fs, foeName: d.n }; let dm = 0, df = 0, hit = false;
  if (st === fs) { dm = 1; df = 1; res.r = "clash"; }
  else if (BEATS[st] === fs) { df = Math.ceil(mine * (.6 + rnd() * .5) / 2); if (st === 2) df = Math.ceil(df * 1.5); if (st === 1) { df = Math.ceil(df * .6); S.body = clamp(S.body + 1, 0, maxBody()); }
    if (d.armor && st !== 2) df = Math.max(1, Math.ceil(df * (1 - d.armor)));
    if (weakHit(d)) { hit = true; df = Math.ceil(df * 1.4); } if (d.pathDamage > 0) { df += d.pathDamage; d.pathDamage = 0; } res.r = "win"; }
  else { dm = Math.ceil(d.p * (.6 + rnd() * .5) / 2); if (d.charge) dm = Math.ceil(dm * d.charge);
    if (d.evadeNext) { dm = 0; d.evadeNext = false; }
    if (d.reduceNext) { dm = Math.ceil(dm * .55); d.reduceNext = false; }
    dm = Math.max(0, dm - Math.min(3, Math.ceil(discipleWeight("guard") / 3)) - Math.min(2, Math.ceil(beastWeight("guardian") / 3)));
    if (d.shield > 0 && dm > 0) { const blocked = Math.min(dm, d.shield); dm -= blocked; d.shield -= blocked; }
    if (d.drain && dm > 0) S.qi = Math.max(0, S.qi - Math.max(0, d.drain - (S.faction === "tidebound" ? 3 : 0))); res.r = "lose"; }
  d.hp -= df; S.body -= dm; if (d.hp > 0 && d.regen && !weakHit(d)) d.hp = Math.min(d.max, d.hp + d.regen);
  res.weak = hit; d.msg = res.r === "clash" ? "Your blows clash." : res.r === "win" ? `You hit ${d.n} for ${df}.` + (hit && d.tip ? " " + d.tip : "") : `${d.n} hits you for ${dm}.` + (d.drain ? " Your qi drains." : "");
  res.dealt = df; res.taken = dm; d.last = st; d.foeLast = fs; d.round++;
  if (S.body <= 0) { S.body = 0; die("was slain by " + d.n); res.end = "dead"; return good("You fall.", res); }
  if (d.hp <= 0) {
    S.stones += d.loot; S.rep += d.rep; S.wins++; if (d.herb) S.herbs += d.herb; let t = "You defeat " + d.n + ". +" + d.loot + " stones.";
    M.slain = M.slain || {}; if (!d.rival) { if (!M.slain[d.kind]) { M.slain[d.kind] = 1; M.fate += 1; t += " Bestiary entry complete: +1 fate."; } else M.slain[d.kind]++; }
    if (d.rival) { S.rival.beaten++; if (S.rival.beaten >= 2) { t += " " + S.rival.n + " is finished. A new rival will rise."; S.rival = newRival(); } else t += " " + S.rival.n + " flees, vowing revenge."; }
    S.duel = null; say(t); advance(1); afterAction(); res.end = "win"; return good(t, res);
  }
  return good("Round " + (d.round - 1), res);
}
function fleeChance() {
  return clamp(.45 + S.luck * .03 + techSum("f") + ((S.dao && S.dao.path === "shadow") ? .12 : 0) + Math.min(.12, discipleWeight("scout") * .015) + beastWeight("scout") * .035 + ((S.fieldcraft && S.fieldcraft.trail) ? .08 : 0), .1, .92);
}
function flee() {
  if (!canAct() || !S.duel) return bad("No duel in progress.");
  const c = fleeChance();
  if (rnd() < c) { S.duel = null; say("You escape."); advance(1); afterAction(); return good("Escaped.", { escaped: true }); }
  S.body -= Math.ceil(S.duel.p / 2);
  if (S.body <= 0) { S.body = 0; die("was cut down while fleeing " + S.duel.n); return good("You fall."); }
  return good("You fail to escape and take a hit.", { escaped: false });
}

function daoPath(id) { return DAO_PATHS.find(p => p.id === id) || null; }
function chooseDaoPath(id) {
  if (!canAct() || S.duel) return bad("You cannot choose a Dao path right now.");
  if (S.realm < 1) return bad("Reach Qi Condensation before choosing a Dao path.");
  if (!daoPath(id)) return bad("Unknown Dao path.");
  if (S.dao && S.dao.path) return bad("Your Dao path is already chosen for this life.");
  const echoLevel = Math.min(2, Math.floor((((M.pathLegacy || {})[id]) || 0) / 3));
  S.dao = {path:id, mastery:{[id]:1 + echoLevel}, xp:echoLevel ? [0,0,2,5,9,14][1 + echoLevel] : 0, usedEvent:false};
  say("You commit to the " + daoPath(id).n + ". This path will shape the rest of this life.");
  return good("Dao path chosen.");
}
function gainDaoMastery(amount) {
  if (!S.dao || !S.dao.path) return;
  S.dao.xp = (S.dao.xp || 0) + amount;
  const thresholds = [0, 2, 5, 9, 14];
  let level = 1;
  for (let i = 1; i < thresholds.length; i++) if (S.dao.xp >= thresholds[i]) level = i + 1;
  S.dao.mastery = S.dao.mastery || {};
  S.dao.mastery[S.dao.path] = Math.max(S.dao.mastery[S.dao.path] || 1, level);
}
function useDaoAbility() {
  if (!canAct() || !S.dao || !S.dao.path) return bad("Choose a Dao path first.");
  const p = daoPath(S.dao.path);
  if (!p) return bad("Your Dao path is invalid.");
  if (S.duel) {
    const d = S.duel;
    if (d.pathUsed) return bad("Your path ability is already spent in this duel.");
    d.pathUsed = true;
    if (p.id === "sword") d.pathDamage = 3 + Math.floor((S.dao.mastery.sword || 1) * 1.5);
    else if (p.id === "alchemy") { S.qi = clamp(S.qi + 20, 0, 100); S.body = clamp(S.body + 2, 0, maxBody()); }
    else if (p.id === "body") { S.body = clamp(S.body + 5, 0, maxBody()); d.reduceNext = true; }
    else if (p.id === "formation") d.shield = (d.shield || 0) + 5 + Math.floor((S.dao.mastery.formation || 1) * 2);
    else if (p.id === "shadow") d.evadeNext = true;
    gainDaoMastery(1); say(p.ability + " is activated."); return good("Path ability activated.");
  }
  if (S.dao.usedEvent) return bad("Your path ability is already spent in this event.");
  S.dao.usedEvent = true;
  const permOk = S.dao.permRealm !== S.realm; // permanent stat gains: once per realm, so the ability cannot be farmed into huge Mind/Luck
  if (p.id === "sword") { S.qi = clamp(S.qi + 3, 0, 100); if (permOk) { S.mind = clamp(S.mind + 1, 1, 40); S.dao.permRealm = S.realm; } }
  else if (p.id === "alchemy") { S.stones += 12; if (S.herbs > 0) { S.herbs--; S.qi = clamp(S.qi + 10, 0, 100); } }
  else if (p.id === "body") S.body = clamp(S.body + 4, 0, maxBody());
  else if (p.id === "formation") { S.rep += 1; S.stones += 5; }
  else if (p.id === "shadow") { if (permOk) { S.luck = clamp(S.luck + 1, 0, 15); S.dao.permRealm = S.realm; } else S.stones += 4; }
  gainDaoMastery(1); say(p.ability + " shapes this encounter."); return good("Path ability activated.");
}
function recruitDisciple(role) {
  if (!canAct() || S.duel) return bad("You cannot recruit right now."); if (S.forced) return bad(INTERRUPTED);
  if (S.place !== "sect") return bad("Recruit disciples at the Azure Cloud Sect.");
  const def = DISCIPLE_ROLES.find(x => x.id === role); if (!def) return bad("Unknown disciple role.");
  S.disciples = S.disciples || [];
  if (S.disciples.length >= 3) return bad("You can lead at most three disciples in one life.");
  const cost = 25 + S.disciples.length * 12;
  if (S.stones < cost) return bad("Recruitment requires " + cost + " stones.");
  S.stones -= cost;
  const d = {id:"disciple_" + (S.nextDiscipleId || 1), name:pick(DISCIPLE_NAMES), role, level:1, qi:0, realm:0, loyalty:55, morale:70, xp:0};
  S.nextDiscipleId = (S.nextDiscipleId || 1) + 1; S.disciples.push(d);
  advance(1); if (!S.dead) { say("You recruit " + d.name + " as a " + def.n + "."); afterAction(); }
  return good("Disciple recruited.", {disciple:d});
}
function trainDisciple(id) {
  if (!canAct() || S.duel) return bad("You cannot train right now."); if (S.forced) return bad(INTERRUPTED);
  if (S.place !== "sect") return bad("Training requires the Azure Cloud Sect.");
  const d = (S.disciples || []).find(x => x.id === id); if (!d) return bad("Disciple not found.");
  if (d.level >= 5) return bad(d.name + " has reached the current training cap.");
  const cost = Math.ceil((12 + d.level * 5) * (S.faction === "azure" ? .85 : 1)); if (S.stones < cost) return bad("Training requires " + cost + " stones.");
  S.stones -= cost; d.level++; d.xp = (d.xp || 0) + 2; d.morale = Math.min(100, (d.morale || 0) + 8); d.loyalty = Math.min(100, (d.loyalty || 0) + 4);
  advance(1); if (!S.dead) { say(d.name + " advances to disciple rank " + d.level + "."); afterAction(); }
  return good("Disciple trained.");
}
function cultivateDisciple(id) {
  if (!canAct() || S.duel) return bad("You cannot cultivate a disciple right now."); if (S.forced) return bad(INTERRUPTED);
  if (S.place !== "sect") return bad("Disciple cultivation requires the Azure Cloud Sect.");
  const d = (S.disciples || []).find(x => x.id === id); if (!d) return bad("Disciple not found.");
  if (d.realm >= Math.min(5, S.realm + 1)) return bad("This disciple has reached the realm your current guidance can support.");
  const cost = S.faction === "azure" ? 8 : 10; if (S.stones < cost) return bad("Cultivating a disciple requires " + cost + " stones.");
  S.stones -= cost; d.qi = Math.min(120, (d.qi || 0) + 28 + S.mind * 2); d.xp = (d.xp || 0) + 1;
  let result = d.name + " circulates qi under your guidance.";
  if (d.qi >= 100) {
    const odds = clamp(.68 - d.realm * .09 + S.mind * .008 + (S.dao && S.dao.path === "formation" ? .04 : 0), .2, .9);
    if (rnd() < odds) { d.realm++; d.qi = 0; d.morale = Math.min(100, (d.morale || 0) + 10); result = d.name + " breaks through to " + R[d.realm][0] + "!"; }
    else { d.qi = 40; d.morale = Math.max(0, (d.morale || 0) - 8); result = d.name + " fails a breakthrough and must rebuild their foundation."; }
  }
  advance(2); if (!S.dead) { say(result); afterAction(); }
  return good(result);
}
function assignDisciple(id, role) {
  if (!canAct() || S.duel) return bad("You cannot assign disciples right now."); if (S.forced) return bad(INTERRUPTED);
  if (S.place !== "sect") return bad("Disciples can be reassigned at the Azure Cloud Sect.");
  const d = (S.disciples || []).find(x => x.id === id), def = DISCIPLE_ROLES.find(x => x.id === role);
  if (!d || !def) return bad("Choose a valid disciple and role.");
  d.role = role; d.morale = Math.min(100, (d.morale || 0) + 3); say(d.name + " is now assigned as " + def.n + ".");
  return good("Role assigned.");
}
function bondBeast(kind) {
  if (!canAct() || S.duel) return bad("You cannot bond a beast right now."); if (S.forced) return bad(INTERRUPTED);
  const def = BEAST_BONDS[kind]; if (!def) return bad("This creature cannot be bonded.");
  if (!(M.slain && M.slain[kind] > 0)) return bad("Defeat this creature at least once before attempting a bond.");
  S.beasts = S.beasts || [];
  if (S.beasts.some(b => b.kind === kind)) return bad("This beast is already bonded to you.");
  if (S.beasts.length >= 2) return bad("You can maintain two active spirit-beast bonds per life.");
  if (!((S.place === "forest") || (S.place === "sect") || S.faction === "wardens")) return bad("Bond beasts in the Whispering Forest or at the Azure Cloud Sect.");
  const cost = Math.ceil(def.cost * (S.faction === "wardens" ? .8 : 1));
  if (S.stones < cost) return bad("Bonding requires " + cost + " spirit stones.");
  S.stones -= cost; const b = {kind, n:def.n, role:def.role, level:1, xp:0, affinity:35}; S.beasts.push(b);
  say("A bond forms with " + def.n + ". Treat it as a partner, not a weapon."); return good("Beast bonded.", {beast:b});
}
function trainBeast(kind) {
  if (!canAct() || S.duel) return bad("You cannot train a beast right now."); if (S.forced) return bad(INTERRUPTED);
  const b = (S.beasts || []).find(x => x.kind === kind); if (!b) return bad("Beast bond not found.");
  if (b.level >= 5) return bad("This beast has reached the current growth cap.");
  const cost = 8 + b.level * 4;
  if (S.herbs < 1) return bad("Beast training requires one spirit herb.");
  if (S.stones < cost) return bad("Beast training requires " + cost + " stones.");
  S.herbs--; S.stones -= cost; b.xp = (b.xp || 0) + 2; b.level++; b.affinity = Math.min(100, (b.affinity || 0) + 10);
  advance(1); if (!S.dead) { say(b.n + " grows to bond level " + b.level + "."); afterAction(); }
  return good("Beast trained.");
}
function assignBeast(kind, role) {
  if (!canAct() || S.duel) return bad("You cannot assign a beast right now."); if (S.forced) return bad(INTERRUPTED);
  const b = (S.beasts || []).find(x => x.kind === kind), def = BEAST_ROLES.find(x => x.id === role);
  if (!b || !def) return bad("Choose a valid beast and role.");
  b.role = role; say(b.n + " takes the role: " + def.n + "."); return good("Beast role assigned.");
}
function canJoinFaction(id) {
  const f = FACTIONS.find(x => x.id === id); if (!f) return {ok:false,msg:"Unknown faction."};
  if (S.faction) return {ok:false,msg:"You already took an oath to " + ((FACTIONS.find(x => x.id === S.faction) || {}).n || S.faction) + " this life."};
  if (S.place !== f.home) return {ok:false,msg:"Travel to " + ((PLACES.find(p => p.id === f.home) || {}).n || f.home) + " to meet this faction."};
  if (S.realm < f.min) return {ok:false,msg:"Requires " + R[f.min][0] + "."};
  if (id === "wardens" && !(M.slain && M.slain.beast > 0)) return {ok:false,msg:"Defeat a Spirit Beast in a previous or current life first."};
  if (id === "scholars" && !(M.slain && M.slain.ghost > 0)) return {ok:false,msg:"Defeat a Ruin Guardian first."};
  if (id === "tidebound" && !(M.seen && (M.seen.kraken || M.seen.leviathan))) return {ok:false,msg:"Encounter an abyssal creature first."};
  return {ok:true,msg:"Eligible."};
}
function joinFaction(id) {
  if (!canAct() || S.duel) return bad("You cannot take a faction oath right now.");
  const c = canJoinFaction(id); if (!c.ok) return bad(c.msg);
  S.faction = id; S.factionRep = S.factionRep || {}; S.factionRep[id] = Math.max(1, S.factionRep[id] || 0);
  say("You swear an oath to " + FACTIONS.find(x => x.id === id).n + "."); return good("Faction joined.");
}
function factionMission() {
  if (!canAct() || S.duel) return bad("You cannot undertake a faction mission right now."); if (S.forced) return bad(INTERRUPTED);
  if (!S.faction) return bad("Join a faction first.");
  const f = FACTIONS.find(x => x.id === S.faction); if (!f) return bad("Faction record is invalid.");
  if (S.place !== f.home) return bad("Return to " + PLACES.find(p => p.id === f.home).n + " to receive a mission.");
  const cost = 6 + Math.min(8, S.factionMissions || 0); if (S.stones < cost) return bad("The mission requires " + cost + " stones for supplies.");
  S.stones -= cost;
  const odds = clamp(.66 + S.luck * .008 + ((S.factionRep[f.id] || 0) * .015) + (S.dao && S.dao.path === "formation" ? .04 : 0) + discipleWeight("scout") * .002, .25, .93);
  const success = rnd() < odds; S.factionMissions = (S.factionMissions || 0) + 1;
  if (success) {
    const reward = 12 + S.realm * 7 + Math.floor(S.mind / 2); S.stones += reward; S.rep += 1; S.factionRep[f.id] = (S.factionRep[f.id] || 0) + 1;
    if (f.id === "mist") S.herbs += 1;
    if (f.id === "scholars") { S.research = (S.research || 0) + 1; S.mind = clamp(S.mind + 1, 1, 40); }
    advance(2); if (!S.dead) { say(f.n + " mission succeeds. You earn " + reward + " stones and standing."); afterAction(); }
    return good("Mission completed.", {success:true});
  }
  S.body = clamp(S.body - 2, 0, maxBody()); S.factionRep[f.id] = Math.max(0, (S.factionRep[f.id] || 0) - 1);
  if (S.body <= 0) die("was lost during a faction mission");
  else { advance(2); if (!S.dead) { say("The mission fails. You return injured, but alive."); afterAction(); } }
  return good("Mission failed.", {success:false});
}
function studyField() {
  if (!canAct() || S.duel) return bad("You cannot study the field right now."); if (S.forced) return bad(INTERRUPTED);
  const place = S.place, note = FIELD_NOTES[place]; if (!note) return bad("There are no useful field signs here.");
  S.fieldNotes = S.fieldNotes || {}; if (S.fieldNotes[place]) return bad("You have already documented the main field signs here this life.");
  S.fieldNotes[place] = true; S.research = (S.research || 0) + 1; M.fieldLore = M.fieldLore || {}; M.fieldLore[place] = true;
  S.mind = clamp(S.mind + 1 + (S.faction === "scholars" ? 1 : 0), 1, 40); S.qi = clamp(S.qi + 12, 0, 100);
  if (S.faction === "scholars") S.research++;
  if (["market","forest","wastes"].includes(place)) S.herbs += 1 + (S.fieldcraft && S.fieldcraft.forager ? 1 : 0);
  if (["village","sect","market"].includes(place)) S.stones += 8;
  advance(1); if (!S.dead) { say("Field note recorded: " + note.title + "."); afterAction(); }
  return good(note.title, {note});
}
function unlockFieldcraft(id) {
  if (!canAct() || S.duel) return bad("You cannot study an archive method right now.");
  const def = FIELD_UPGRADES.find(x => x.id === id);
  if (!def) return bad("Unknown field research method.");
  S.fieldcraft = S.fieldcraft || {};
  if (S.fieldcraft[id]) return bad("This method is already mastered for the current life.");
  if ((S.research || 0) < def.cost) return bad("This method requires " + def.cost + " research points.");
  S.research -= def.cost; S.fieldcraft[id] = true;
  say("Archive method learned: " + def.n + ".");
  return good("Research method learned.", {upgrade:def});
}
function pathMastery(id) { return S.dao && S.dao.mastery && S.dao.mastery[id] || 0; }


function buyUpgrade(id) {
  const u = UPGRADES.find(x => x.id === id); if (!u) return bad("Unknown upgrade.");
  const lvl = (M.up[id] || 0); if (lvl >= u.cost.length) return bad("Already at maximum.");
  if (M.fate < u.cost[lvl]) return bad("Not enough fate.");
  M.fate -= u.cost[lvl]; M.up[id] = lvl + 1; return good("Upgraded.");
}
const normalizeMeta = (m) => Object.assign({ fate:0, lives:0, best:0, up:{}, seen:{}, slain:{}, fieldLore:{}, pathLegacy:{} }, m || {});
function normalizeState(st) {
  if (!st || typeof st !== "object") return st;
  if (st.phase === "life" || st.phase === "dead") {
    st.dao = st.dao || {path:null, mastery:{}, xp:0, usedEvent:false}; st.dao.mastery = st.dao.mastery || {};
    st.disciples = st.disciples || []; st.nextDiscipleId = st.nextDiscipleId || 1; st.beasts = st.beasts || [];
    st.fieldNotes = st.fieldNotes || {}; st.research = st.research || 0; st.fieldcraft = st.fieldcraft || {}; st.faction = st.faction || null;
    st.factionRep = st.factionRep || {}; st.factionMissions = st.factionMissions || 0;
    st.pills = Object.assign({qi:0,body:0,bt:0,life:0}, st.pills || {}); st.forced = !!st.forced; st.lifeBonus = st.lifeBonus | 0;
  }
  return st;
}
const serialize = () => JSON.stringify({ v: 6, S, M: normalizeMeta(M) });
function load(json) {
  try { const d = JSON.parse(json); if (d && (d.v === 4 || d.v === 5 || d.v === 6) && d.S && d.M && d.M.up) { S = normalizeState(d.S); M = normalizeMeta(d.M); return true; } } catch (_) {}
  return false;
}
function migrateV3(json) { // keep fate earned in the old v3 game
  try { const d = JSON.parse(json); if (d && d.M) { M.fate += d.M.fate | 0; M.lives = d.M.lives | 0; M.best = d.M.best | 0; return true; } } catch (_) {}
  return false;
}
const api = { R, ORIGINS, ROOTS, ELFX, TECH, RECIPES, UPGRADES, PLACES, EV, FOES, STANCES,
  get S() { return S; }, get M() { return M; }, set(s, m) { S = s; if (m) M = normalizeMeta(m); },
  startLife, startDuel, toBirth, choose, act, travel, seclude, breakthrough, chance, learn, brew, brewChance, usePill, duelMove, flee,
  buyUpgrade, risk, power, maxBody, evDef, serialize, load, migrateV3, rnd, DAO_PATHS, DISCIPLE_ROLES, BEAST_BONDS, BEAST_ROLES, FACTIONS, FIELD_NOTES, FIELD_UPGRADES, chooseDaoPath, useDaoAbility, pathMastery, unlockFieldcraft, fleeChance, recruitDisciple, trainDisciple, cultivateDisciple, assignDisciple, bondBeast, trainBeast, assignBeast, canJoinFaction, joinFaction, factionMission, studyField };
if (typeof module !== "undefined" && module.exports) module.exports = api; else root.WB = api;
})(this);

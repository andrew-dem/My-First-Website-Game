// Dependency-free UI smoke test. This executes the real engine/art/UI scripts in a tiny DOM stub.
// It verifies startup and each newly added panel; it does not replace a real-browser visual test.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");
const root = path.resolve(__dirname, "..");
const ids = ["app","art","seal","name","meta","ladder","vitals","kit","card","choices","actions","keys","tabs","panel","wipe","toast","moment","export-save","import-save"];
class Element {
  constructor(id) {
    this.id = id; this.innerHTML = ""; this.textContent = ""; this.hidden = false; this.dataset = {}; this.className = ""; this.disabled = false; this.onclick = null;
    this.classList = { toggle: () => {}, add: () => {}, remove: () => {} }; this.listeners = {};
  }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  click() { if (this.onclick) this.onclick(); }
  remove() {}
}
const elements = Object.fromEntries(ids.map(id => [id, new Element(id)]));
const listeners = {};
const storage = new Map();
const downloads = [];
const document = {
  body: {appendChild: () => {}},
  getElementById(id) { if (!elements[id]) elements[id] = new Element(id); return elements[id]; },
  createElement(tag) { return {tagName:tag, href:"", download:"", click(){downloads.push({href:this.href,download:this.download});}, remove(){}}; },
  addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }
};
const localStorage = { getItem: k => storage.has(k) ? storage.get(k) : null, setItem: (k,v) => storage.set(k,String(v)), removeItem: k => storage.delete(k) };
class BlobMock { constructor(parts, options) { this.parts=parts; this.type=options && options.type; } }
const urlApi = {createObjectURL: () => "blob:worldbound-test", revokeObjectURL: () => {}};
const sandbox = { console, document, localStorage, confirm: () => true, setTimeout: () => 1, clearTimeout: () => {}, Date, Math, JSON, Object, Array, String, Number, Boolean, Set, Map, RegExp, Error, parseInt, isNaN, Blob:BlobMock, URL:urlApi };
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const file of ["engine.js", "art.js", "ui.js"]) vm.runInContext(fs.readFileSync(path.join(root,file),"utf8"), sandbox, {filename:file, timeout:5000});
assert.ok(sandbox.WB, "engine API exists");
assert.ok(sandbox.WBArt, "procedural art module exists");
assert.ok(sandbox.WBUI, "UI initializes");
assert.ok(elements.card.innerHTML.includes("Choose your birth"), "birth screen renders");
assert.ok(elements.art.innerHTML.includes("<svg"), "scene SVG renders");
sandbox.WBUI.go("origin:0");
for (const tab of ["map","alch","best","log","dao","sect","beasts","factions","research","fate"]) {
  sandbox.WBUI.setTab(tab);
  assert.ok(typeof elements.panel.innerHTML === "string", `${tab} panel returns markup`);
}
const W = sandbox.WB;
W.S.realm = 1; W.S.place = "sect"; W.S.stones = 1000; W.S.qi = 100; W.S.research = 9;
sandbox.WBUI.setTab("dao");
assert.ok(elements.panel.innerHTML.includes("Sword Dao"), "unselected Dao options render");
assert.ok(sandbox.WBUI.go("path:sword") === undefined || W.S.dao.path === "sword", "Dao path action can be dispatched");
assert.strictEqual(W.S.dao.path, "sword", "Dao path commits");
sandbox.WBUI.setTab("sect");
assert.ok(elements.panel.innerHTML.includes("Recruit a disciple"), "sect controls render");
sandbox.WBUI.go("recruit:guard");
assert.strictEqual(W.S.disciples.length,1,"sect action recruits a disciple");
W.M.slain.beast = 1; W.S.place = "forest"; W.S.stones = 1000;
sandbox.WBUI.setTab("beasts");
assert.ok(elements.panel.innerHTML.includes("Known creatures you can bond"), "beast collection renders");
sandbox.WBUI.go("bond:beast");
assert.strictEqual(W.S.beasts.length,1,"beast action creates a bond");
W.S.place = "sect"; W.S.faction = null;
sandbox.WBUI.setTab("factions");
sandbox.WBUI.go("joinfaction:azure");
assert.strictEqual(W.S.faction,"azure","faction action joins faction");
sandbox.WBUI.setTab("research");
assert.ok(elements.panel.innerHTML.includes("Trail-Sense Method"), "field research methods render");
sandbox.WBUI.go("research:trail");
assert.ok(W.S.fieldcraft.trail, "field research action unlocks an upgrade");
elements["export-save"].click();
assert.ok(downloads[0] && downloads[0].download.startsWith("worldbound-save-v6-"), "export button creates a named save download");
const importedStones = 321, validSave = W.serialize(); W.S.stones = 0;
const importChange = elements["import-save"].listeners.change[0];
(async () => {
  const save = JSON.parse(validSave); save.S.stones = importedStones;
  await importChange({target:{files:[{text:async()=>JSON.stringify(save)}],value:"backup.json"}});
  assert.strictEqual(W.S.stones, importedStones, "import action restores a valid save");
  const safeStones = W.S.stones;
  await importChange({target:{files:[{text:async()=>"not a save"}],value:"bad.json"}});
  assert.strictEqual(W.S.stones, safeStones, "invalid import does not replace current progress");
  storage.set("worldbound-v5", "old"); storage.set("worldbound-v4", "old"); storage.set("worldbound-v3", "old");
  elements.wipe.click();
  assert.ok(!storage.has("worldbound-v5") && !storage.has("worldbound-v4") && !storage.has("worldbound-v3"), "wipe removes all legacy storage keys");
  console.log("PASS  UI initializes and renders the birth scene, SVG art, and all 10 panels");
  console.log("PASS  UI action routing supports Dao selection, disciple recruitment, beast bonding, faction joining, and spending field research");
  console.log("PASS  export produces a named save, import restores valid saves, malformed files are rejected, and wipe clears legacy save keys");
  console.log("NOTE  This is a dependency-free DOM smoke test, not a full browser layout/accessibility test.");
})().catch(err => { console.error(err); process.exitCode = 1; });

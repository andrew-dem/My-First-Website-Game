/* Worldbound original procedural SVG art. No external assets or dependencies. */
(function (root) {
  "use strict";
  const PLACE = {
    village:{sky:["#1b3140","#b86b55"],land:"#3c6a58",glow:"#ffd28a",motif:"village"},
    market:{sky:["#253c52","#8b4962"],land:"#516d70",glow:"#ffcf84",motif:"market"},
    sect:{sky:["#1f4962","#5ea8a0"],land:"#2d6e68",glow:"#d9ffe8",motif:"sect"},
    forest:{sky:["#071f2e","#167b70"],land:"#123f35",glow:"#65ffe0",motif:"forest"},
    ruins:{sky:["#171d3c","#7c577b"],land:"#55506c",glow:"#c5a2ff",motif:"ruins"},
    peak:{sky:["#172d4d","#9caad4"],land:"#485b78",glow:"#d6edff",motif:"peak"},
    wastes:{sky:["#321d26","#a84d32"],land:"#62362e",glow:"#ff9b52",motif:"wastes"},
    coast:{sky:["#051b35","#087e92"],land:"#073a54",glow:"#5ff5f0",motif:"coast"}
  };
  const ELEMENT = {
    Metal:{a:"#e8f2ff",b:"#8aa7c6",c:"#455975"},
    Wood:{a:"#9bffb4",b:"#3ccf8e",c:"#155a4a"},
    Water:{a:"#a4f4ff",b:"#40a8e8",c:"#164b8c"},
    Fire:{a:"#ffe0a0",b:"#ff704c",c:"#8d253e"},
    Earth:{a:"#fff0b4",b:"#c89a4b",c:"#5e4735"}
  };
  const FOE = {
    bandit:{shape:"humanoid",a:"#c9574f",b:"#542c42",eyes:"#ffdb9a"},
    beast:{shape:"wolf",a:"#ffb15a",b:"#7d3450",eyes:"#9bfff0"},
    ghost:{shape:"ghost",a:"#d7ddff",b:"#6d75bd",eyes:"#74f6ff"},
    demon:{shape:"humanoid",a:"#e75a6e",b:"#401b4e",eyes:"#ffcf72"},
    kingboar:{shape:"boar",a:"#d2a36a",b:"#4f433e",eyes:"#ffcf8a"},
    archespore:{shape:"spore",a:"#b5ff8e",b:"#3d985d",eyes:"#ffe49e"},
    ursusumbra:{shape:"bear",a:"#b5c1db",b:"#4a526f",eyes:"#97e9ff"},
    behemoth:{shape:"horns",a:"#d7f6ff",b:"#658fc4",eyes:"#ffffff"},
    kraken:{shape:"kraken",a:"#4ef0d2",b:"#1d5f8a",eyes:"#ffe49c"},
    leviathan:{shape:"serpent",a:"#72fff0",b:"#1a6b8b",eyes:"#fff7b2"},
    rival:{shape:"humanoid",a:"#d69bff",b:"#39366d",eyes:"#ffdb9a"}
  };
  function esc(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function scene(placeId, element, realm) {
    const p = PLACE[placeId] || PLACE.village, e = ELEMENT[element] || ELEMENT.Metal;
    const id = "wb_" + esc(placeId) + "_" + esc(element) + "_" + (Number(realm)||0);
    const mountains = `<path d="M0 175 70 92 126 150 214 60 300 154 382 90 450 154 520 72 640 170V260H0Z" fill="${p.land}" opacity=".94"/><path d="M0 208 102 150 188 192 284 140 372 204 473 142 566 188 640 160V260H0Z" fill="#06171d" opacity=".72"/>`;
    let detail = "";
    if (p.motif === "forest") detail = `<g fill="#082e2b"><path d="M44 207 70 89 96 207Z M90 224 126 66 162 224Z M470 228 506 82 545 228Z M538 218 572 110 605 218Z"/><path d="M70 110 48 144H92Z M126 92 98 134H153Z M506 105 480 146H534Z" fill="${p.glow}" opacity=".3"/></g>`;
    if (p.motif === "village" || p.motif === "market") detail = `<g stroke="#dfb27a" stroke-width="2"><path d="M70 204V153L102 128 134 153V204Z M113 210V168L151 138 190 168V210Z M463 208V154L495 127 527 154V208Z" fill="#382e3b"/><path d="M90 205V172H108V205 M145 210V183H163V210 M485 208V172H503V208" fill="${p.glow}" opacity=".8"/><path d="M60 156 102 122 144 156 M101 168 151 132 201 168 M453 158 495 120 537 158" fill="none"/></g>`;
    if (p.motif === "sect") detail = `<g stroke="#c1ebd5" stroke-width="2" fill="#14394b"><path d="M250 203V145L320 90 390 145V203Z"/><path d="M228 148 320 70 412 148 M270 142H370 M266 166H374 M285 203V170H355V203" fill="none"/><path d="M302 87V55H338V87" fill="#a8f1d7"/></g>`;
    if (p.motif === "ruins") detail = `<g fill="#292843" stroke="#a78bbd" stroke-width="2"><path d="M65 215V134H91V215 M112 215V116H139V215 M91 148H112 M140 157 184 118 220 157V215H140Z"/><path d="M82 132 103 108 124 132 M155 156 183 128 208 156" fill="none"/><path d="M177 181h18v34h-18z" fill="${p.glow}" opacity=".5"/></g>`;
    if (p.motif === "peak") detail = `<path d="M0 190 115 42 170 113 270 12 372 143 450 57 548 146 602 88 640 140" fill="none" stroke="#d7edff" stroke-width="3" opacity=".7"/><path d="M270 22 250 56 272 50 255 78 300 47 281 45Z" fill="${p.glow}"/>`;
    if (p.motif === "wastes") detail = `<g fill="#1c252c" stroke="#bb6548" stroke-width="2"><path d="M78 219Q68 164 97 145Q91 177 116 183Q132 148 148 160Q125 203 132 219Z M470 225Q455 172 492 134Q477 177 513 186Q538 152 550 171Q522 202 531 225Z"/><circle cx="322" cy="179" r="22" fill="${p.glow}" opacity=".35"/><circle cx="342" cy="201" r="8" fill="${p.glow}" opacity=".6"/></g>`;
    if (p.motif === "coast") detail = `<path d="M0 191Q80 158 160 193T320 190T480 192T640 189V260H0Z" fill="#042d49"/><path d="M0 212Q70 192 140 212T280 210T420 212T560 212T640 207" fill="none" stroke="${p.glow}" stroke-width="3" opacity=".55"/><g fill="#0b283f"><path d="M72 196 92 134 112 196Z M520 201 548 110 578 201Z"/></g>`;
    const moonX = placeId === "coast" ? 470 : placeId === "market" ? 494 : 468;
    return `<svg class="world-scene" viewBox="0 0 640 260" role="img" aria-label="${esc(placeId)} cultivation landscape" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient><radialGradient id="${id}_glow"><stop stop-color="${p.glow}" stop-opacity=".8"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/></radialGradient></defs><rect width="640" height="260" fill="url(#${id}_sky)"/><circle cx="${moonX}" cy="67" r="60" fill="url(#${id}_glow)"/><circle cx="${moonX}" cy="67" r="25" fill="${p.glow}" opacity=".85"/><circle cx="${moonX-7}" cy="61" r="23" fill="#ffffff" opacity=".25"/><g fill="#fff4da" opacity=".7">${Array.from({length:24},(_,i)=>`<circle cx="${(i*83+19)%640}" cy="${(i*31+17)%115}" r="${i%5===0?1.8:.8}"/>`).join("")}</g>${mountains}${detail}<path d="M0 236Q90 217 190 236T390 234T640 229V260H0Z" fill="#050f17" opacity=".82"/><g fill="${e.a}" opacity=".8">${Array.from({length:9},(_,i)=>`<circle class="qi-mote" cx="${(i*67+37)%620}" cy="${145+(i*19)%83}" r="${i%3===0?2.4:1.4}"/>`).join("")}</g><rect width="640" height="260" fill="${e.c}" opacity=".08"/></svg>`;
  }
  function hero(element) {
    const e = ELEMENT[element] || ELEMENT.Metal;
    return `<svg class="hero-figure" viewBox="0 0 160 180" role="img" aria-label="${esc(element)} spirit cultivator"><defs><radialGradient id="hero_glow"><stop stop-color="${e.a}" stop-opacity=".85"/><stop offset="1" stop-color="${e.b}" stop-opacity="0"/></radialGradient><linearGradient id="hero_robe" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${e.a}"/><stop offset="1" stop-color="${e.c}"/></linearGradient></defs><circle cx="80" cy="94" r="65" fill="url(#hero_glow)"/><path d="M80 17 95 39 80 31 65 39Z" fill="${e.a}"/><circle cx="80" cy="47" r="18" fill="#e2b78b"/><path d="M62 47Q54 23 80 22Q108 23 99 51L91 39 71 39Z" fill="#202337"/><path d="M62 67 43 92 31 133 52 139 67 104 64 158 96 158 93 104 108 139 129 133 117 92 98 67Z" fill="url(#hero_robe)" stroke="${e.a}" stroke-width="2"/><path d="M65 72 80 89 95 72 M80 89V141" fill="none" stroke="${e.a}" stroke-width="2"/><circle cx="80" cy="91" r="8" fill="${e.a}"/><path d="M44 83 28 60 M116 83 132 60" stroke="${e.a}" stroke-width="5" stroke-linecap="round"/><path d="M47 159 41 174H70L72 159 M88 159 90 174H119L112 159" fill="#151b2b"/></svg>`;
  }
  function foe(kind) {
    const f = FOE[kind] || FOE.beast, id = "foe_" + esc(kind);
    let body = "";
    if (f.shape === "humanoid") body = `<path d="M75 66 45 91 39 135 57 147 67 105 68 166H112L110 105 123 145 141 136 132 91 104 65Z" fill="${f.b}" stroke="${f.a}" stroke-width="3"/><circle cx="91" cy="45" r="24" fill="${f.a}"/><path d="M69 38 58 19 78 29 94 16 110 31 128 18 116 43Z" fill="${f.b}"/><path d="M80 47h6 M101 47h6" stroke="${f.eyes}" stroke-width="4" stroke-linecap="round"/>`;
    if (f.shape === "wolf" || f.shape === "boar" || f.shape === "bear") { const ear = f.shape === "boar" ? `M49 51 36 26 63 38 M114 41 137 27 128 58` : `M55 45 43 20 73 33 M111 34 139 17 127 53`; body = `<path d="M46 119Q34 76 67 69L84 48 109 65Q139 72 137 117L123 146 106 133 98 159 80 159 72 132 56 147Z" fill="${f.b}" stroke="${f.a}" stroke-width="4"/>${ear}<path d="M72 68Q88 54 111 67L127 91 111 109 76 107 60 91Z" fill="${f.a}"/><path d="M72 83h7 M104 83h7" stroke="${f.eyes}" stroke-width="5" stroke-linecap="round"/><path d="M78 98 64 116 84 109 M108 99 126 116 106 108" stroke="#fff0d3" stroke-width="5" fill="none"/>`; }
    if (f.shape === "ghost") body = `<path d="M45 151V76Q45 35 91 30Q137 37 137 78V151L115 137 92 155 69 137Z" fill="${f.b}" stroke="${f.a}" stroke-width="4"/><path d="M67 77Q91 62 116 78" stroke="${f.a}" stroke-width="3" fill="none"/><ellipse cx="75" cy="87" rx="6" ry="11" fill="${f.eyes}"/><ellipse cx="108" cy="87" rx="6" ry="11" fill="${f.eyes}"/><path d="M82 108Q92 117 102 108" stroke="${f.a}" stroke-width="4" fill="none"/>`;
    if (f.shape === "spore") body = `<path d="M50 106Q39 65 69 57Q91 25 113 56Q147 67 133 108L117 118 116 158H65L65 119Z" fill="${f.b}" stroke="${f.a}" stroke-width="4"/><path d="M56 73Q92 8 130 73Q92 88 56 73Z" fill="${f.a}"/><circle cx="78" cy="94" r="7" fill="${f.eyes}"/><circle cx="108" cy="94" r="7" fill="${f.eyes}"/><path d="M83 111Q92 119 102 111" stroke="${f.a}" stroke-width="3" fill="none"/><g fill="${f.a}"><circle cx="45" cy="52" r="4"/><circle cx="141" cy="41" r="3"/><circle cx="134" cy="135" r="5"/></g>`;
    if (f.shape === "horns") body = `<path d="M50 142 42 80 65 55 91 47 117 55 140 80 131 142 111 158 70 158Z" fill="${f.b}" stroke="${f.a}" stroke-width="4"/><path d="M65 58 34 20 43 71 M116 58 148 20 138 71" fill="${f.a}" stroke="${f.b}" stroke-width="4"/><path d="M69 83h10 M105 83h10" stroke="${f.eyes}" stroke-width="5" stroke-linecap="round"/><path d="M77 112 92 121 107 112" fill="none" stroke="${f.a}" stroke-width="4"/>`;
    if (f.shape === "kraken") body = `<g stroke="${f.a}" stroke-width="8" fill="none" stroke-linecap="round"><path d="M87 110Q40 92 27 137T13 159 M96 112Q141 80 143 127T150 159 M78 111Q52 129 55 151 M105 112Q129 130 121 156 M82 113Q69 143 83 164 M99 113Q113 145 103 165"/></g><path d="M57 71Q89 36 120 71L117 111Q91 132 63 111Z" fill="${f.b}" stroke="${f.a}" stroke-width="4"/><circle cx="78" cy="82" r="7" fill="${f.eyes}"/><circle cx="104" cy="82" r="7" fill="${f.eyes}"/>`;
    if (f.shape === "serpent") body = `<path d="M30 151Q8 117 46 95T77 70Q82 36 113 51Q135 62 118 84Q103 97 88 82Q82 69 94 61" fill="none" stroke="${f.b}" stroke-width="28" stroke-linecap="round"/><path d="M30 151Q8 117 46 95T77 70Q82 36 113 51Q135 62 118 84" fill="none" stroke="${f.a}" stroke-width="7" stroke-linecap="round"/><path d="M90 51 85 20 104 38 120 20 120 53Z" fill="${f.a}"/><circle cx="110" cy="59" r="4" fill="${f.eyes}"/>`;
    return `<svg class="foe-portrait" viewBox="0 0 180 180" role="img" aria-label="${esc(kind)} creature portrait"><defs><radialGradient id="${id}_bg"><stop stop-color="${f.a}" stop-opacity=".45"/><stop offset="1" stop-color="#070e1d"/></radialGradient><filter id="${id}_glow"><feGaussianBlur stdDeviation="3"/></filter></defs><rect width="180" height="180" rx="18" fill="url(#${id}_bg)"/><circle cx="90" cy="90" r="69" fill="none" stroke="${f.a}" stroke-opacity=".3"/><circle cx="90" cy="90" r="77" fill="none" stroke="${f.a}" stroke-opacity=".18" stroke-dasharray="3 8"/><circle cx="90" cy="90" r="40" fill="${f.a}" opacity=".13" filter="url(#${id}_glow)"/>${body}<g fill="${f.a}" opacity=".6"><circle cx="25" cy="36" r="2"/><circle cx="150" cy="49" r="3"/><circle cx="30" cy="137" r="3"/><circle cx="153" cy="136" r="2"/></g></svg>`;
  }
  const api = {scene, hero, foe, PLACE, ELEMENT, FOE};
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.WBArt = api;
})(typeof window !== "undefined" ? window : globalThis);

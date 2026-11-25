import { t, language, setLanguage } from "./i18n.js";
import { canvas, colors, details, fmt, legend, plot, select, clearPlots, redrawPlots } from "./plot.js";
import { atlas, normalCycle, sample, sinus } from "./rhythms.js";
import { anatomy, leadNotes, acquisition, curriculum, questions } from "./lessons.js";
import { anatomyExplorer, mountAnatomyExplorer, tissueOverlay, tissuePlayback } from "./heart.js";
import { filterLab, qrsLab, hrvLab, opticalLab } from "./labs.js";

const $ = id => document.getElementById(id);
const view = $("view");
document.documentElement.lang = language;
for (const element of document.querySelectorAll("[data-i18n]")) {
  element.textContent = t(element.textContent);
}
for (const element of document.querySelectorAll("[data-i18n-label]")) {
  element.setAttribute("aria-label", t(element.getAttribute("aria-label")));
}
const description = document.querySelector('meta[name="description"]');
description.content = t(description.content);
const languageSelect = $("language-select");
languageSelect.value = language;
languageSelect.onchange = () => setLanguage(languageSelect.value);
languageSelect.hidden = false;
const themeToggle = $("theme-toggle");
const theme = document.documentElement.dataset;
const updateThemeToggle = () => {
  const dark = theme.theme === "dark";
  themeToggle.textContent = dark ? t("Světlý režim") : t("Tmavý režim");
  document.querySelector('meta[name="theme-color"]').content = dark ? "#17181c" : "#f7f4f5";
};
themeToggle.onclick = () => {
  theme.theme = theme.theme === "dark" ? "light" : "dark";
  try { localStorage.setItem("ekg-theme", theme.theme); } catch {}
  updateThemeToggle();
  redrawPlots();
};
updateThemeToggle();
themeToggle.hidden = false;
const card = (title, body) => `<section class="card"><h2>${title}</h2>${body}</section>`;
const noteCards = notes => `<div class="details-grid">${notes.map(([title, text]) => details(title, text)).join("")}</div>`;
const source = text => t`<p class="source">Podklady · ${text}</p>`;
const hero = (title, intro) => `<header class="hero"><h1>${title}</h1><p>${intro}</p></header>`;
const option = (id, text) => `<button type="button" id="${id}">${text}</button>`;

const pages = {
  vedeni: [t("Převodní systém"), "⌁", t("Sleduj cestu vzruchu srdcem a jeho stopu ve svodu II. Přehraj jeden srdeční cyklus nebo jej projdi krok po kroku."), conduction],
  atlas: [t("Atlas rytmů"), "≋", t("Porovnej výukový rytmus se sinusovou referencí. Nejdřív si všimni polohy vln a pravidelnosti, pak odkryj vysvětlení."), rhythmAtlas],
  anatomie: [t("Anatomie a oběh"), "♡", t("Projdi cestu krve oběma polovinami srdce a sleduj, které chlopně se během cyklu otevírají."), anatomyPage],
  svody: [t("Svody a elektrická osa"), "⊕", t("Otoč elektrickým vektorem a porovnej projekce téhož stahu v šesti končetinových svodech."), leadPage],
  snimani: [t("Snímání EKG"), "⊢", t("Sleduj signál od kontaktu elektrody s kůží přes zesílení a filtraci až po digitální vzorek."), acquisitionPage],
  filtrace: [t("Filtrace a šum"), "≋", t("Na stejném úseku porovnej původní EKG a filtrovaný průběh. V detailu zkontroluj zachování QRS i úseku ST."), filterLab],
  detekce: [t("Detekce QRS"), "⌖", t("Porovnej značky dvou detektorů a projdi, jak z EKG vznikne kandidát na QRS a lokalizovaná R značka."), qrsLab],
  hrv: [t("Variabilita rytmu"), "∿", t("Přejdi od značek R přes intervaly RR a kontrolu kvality až k tachogramu, grafům a ukazatelům HRV."), hrvLab],
  optika: [t("Optické mapování"), "⊞", t("Vyber pixel v záznamu izolovaného srdce a porovnej jeho jas v čase s odvozenou mapou aktivace."), opticalLab],
  test: [t("Procvičování"), "✓", t("Zkus neanotovaný proužek a ověř si principy z obou stran zkouškových okruhů."), quiz],
  zdroje: [t("Osnova a zdroje"), "▤", t("Najdi lekci k jednotlivým bodům zkoušky, podklady a stav doplnění."), sourcesPage],
};

$("nav").innerHTML = Object.entries(pages).map(([key, [label, icon]]) =>
  `<a href="#${key}"><span class="nav-icon" aria-hidden="true">${icon}</span>${label}</a>`).join("");

let leave;
function render() {
  const hash = location.hash.slice(1);
  if (hash === "obsah") return;
  const key = Object.hasOwn(pages, hash) ? hash : "vedeni";
  leave?.();
  clearPlots();
  const [title, , intro, setup] = pages[key];
  $("section-name").textContent = title;
  document.title = t`${title} · EKG laboratoř`;
  document.querySelectorAll("#nav a").forEach(link => {
    if (link.hash === "#" + key) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  view.innerHTML = hero(title, intro) + '<div id="module"></div>';
  const target = $("module");
  const cleanup = setup(target);
  leave = typeof cleanup === "function" ? cleanup : null;
}
window.addEventListener("hashchange", () => {
  if (location.hash === "#obsah") return;
  render();
  window.scrollTo(0, 0);
  $("obsah").focus({ preventScroll: true });
});

function heartMap(flow = false) {
  return `<svg class="map" viewBox="0 0 400 305" role="img" aria-label="${flow ? t("Schéma čtyř srdečních dutin a směru toku") : t("Schéma srdce a drah převodního systému")}">
    <defs><marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker></defs>
    <path d="M175 64 C170 35 177 18 194 14 C226 3 254 17 261 39 L262 72 M155 72 L140 18 M212 79 L232 44 C247 34 274 41 294 62" fill="none" stroke="var(--map-stroke)" stroke-width="12" stroke-linecap="round"/>
    <path d="M192 81 C155 34 103 55 92 100 C72 174 135 228 207 280 C222 291 237 284 252 267 C303 209 322 149 299 104 C280 67 241 65 217 94 Z" fill="var(--map-fill)" stroke="var(--map-stroke)" stroke-width="2"/>
    <path d="M102 149 Q147 127 191 154 Q160 199 130 210 M202 157 Q235 121 307 136 M203 160 Q230 228 218 283" fill="none" stroke="var(--map-stroke)" stroke-width="2"/>
    <path d="M120 164 Q151 159 177 173 M234 162 Q268 145 293 153" fill="none" stroke="var(--map-stroke)" stroke-width="4" stroke-linecap="round"/>
    ${flow ? "" : tissueOverlay()}
    ${flow ? t`
    <g fill="none" stroke="var(--chart-blue)" stroke-width="4" marker-end="url(#flow-arrow)">
      <path data-route="0" d="M137 19 L148 89 Q155 110 145 142"/>
      <path data-route="1" d="M145 146 Q145 166 168 184 Q173 191 167 210"/>
      <path data-route="2" d="M166 211 Q200 185 205 135 Q204 66 278 53"/>
    </g><g fill="none" stroke="var(--accent)" stroke-width="4" marker-end="url(#flow-arrow)">
      <path data-route="3" d="M299 75 Q273 84 258 117"/>
      <path data-route="4" d="M258 117 Q233 139 252 168 L262 213"/>
      <path data-route="5" d="M263 215 Q218 213 221 163 L224 61 Q225 23 251 36"/>
    </g>
    <text x="22" y="95">Pravá síň</text><text x="20" y="217">Pravá komora</text>
    <text x="306" y="122">Levá síň</text><text x="289" y="229">Levá komora</text>
    ` : t`
    <g data-route="0"><circle cx="130" cy="85" r="8" fill="var(--accent)"/><path d="M123 83 L72 64 H24" fill="none" stroke="var(--accent-border)"/><text x="23" y="57">SA uzel</text></g>
    <g data-route="1"><path d="M132 87 Q170 82 190 104 Q223 77 258 106 M131 92 Q137 117 174 132 M139 92 Q166 94 177 132" fill="none" stroke="var(--accent)" stroke-width="3" stroke-dasharray="4 4"/><text x="244" y="76">Bachmannův</text><text x="244" y="92">svazek</text></g>
    <g data-route="2"><circle cx="179" cy="138" r="7" fill="var(--chart-gold)"/><path d="M167 136 L80 123 H23" fill="none" stroke="var(--chart-gold)"/><text x="23" y="115">AV uzel</text></g>
    <g data-route="3"><path d="M181 140 Q189 154 194 164" fill="none" stroke="var(--chart-gold)" stroke-width="5" stroke-linecap="round"/><path d="M194 154 L246 125 H316" fill="none" stroke="var(--chart-gold)"/><text x="307" y="119">Hisův</text><text x="306" y="135">svazek</text></g>
    <g data-route="4"><path d="M194 164 Q181 193 179 218 M194 164 Q213 188 221 247 M208 192 Q226 209 245 218" fill="none" stroke="var(--chart-blue)" stroke-width="4" stroke-linecap="round"/><path d="M208 183 L265 174 H321" fill="none" stroke="var(--chart-blue)"/><text x="304" y="167">Raménka</text><text x="304" y="184">a fascikly</text></g>
    <g data-route="5"><path d="M179 218 Q157 208 143 190 M179 218 Q170 226 160 228 M222 247 Q241 259 271 214 M245 218 Q262 221 278 191 M242 245 Q264 239 280 227" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/><path d="M267 227 L307 247 H362" fill="none" stroke="var(--accent-border)"/><text x="279" y="264">Purkyňova vlákna</text></g>
    <path data-route="6" d="M116 171 C127 210 163 242 213 275 C235 281 272 232 293 176" fill="none" stroke="var(--chart-alt)" stroke-width="5" stroke-linecap="round"/>
    `}
  </svg>`;
}

const phases = [
  [0, t("SA uzel"), t("SA uzel vytváří vzruch. Samostatnou vlnu uzlu na povrchovém EKG nevidíme.")],
  [.12, t("Vlna P"), t("Vzruch aktivuje pravou i levou síň. Jejich depolarizace vytváří vlnu P.")],
  [.211, t("Převod přes AV uzel"), t("Převod se zpomaluje. PQ měříme od začátku P do začátku QRS a zahrnuje také aktivaci síní.")],
  [.257, t("Hisův svazek"), t("Vzruch pokračuje Hisovým svazkem. Jeho vlastní aktivita se ve svodu II samostatně neprojeví.")],
  [.280, t("Komplex QRS"), t("Raménka a fascikly rozvedou vzruch. Začíná depolarizace komor, která tvoří QRS.")],
  [.329, t("Purkyňova síť"), t("Purkyňova síť rychle aktivuje další oblasti komor. Repolarizace síní bývá v QRS překrytá.")],
  [.37, t("Úsek ST"), t("Komory jsou z větší části depolarizované. Rozdíl potenciálů v tomto svodu je malý.")],
  [.452, t("Vlna T"), t("Komorový myokard se repolarizuje a vzniká vlna T.")],
];

function conduction(target) {
  target.innerHTML = t`<div class="stack"><div class="grid feature">
    <section class="card"><div class="card-head"><h2>Mapa vedení</h2><span class="tag">Schéma</span></div>
    ${heartMap()}
    <div class="controls tissue-controls">
      <label><input type="checkbox" id="show-tissue" checked> Svalovina</label>
      <label><input type="checkbox" id="show-pathway" checked> Převodní dráhy</label>
    </div>
    ${legend([["var(--wave-front)",t("Čelo aktivace")],["var(--wave-active)",t("Depolarizovaná svalovina")],["var(--wave-recovery)",t("Repolarizace")]])}
    <p class="source">Tečky představují oblasti svaloviny a barva jejich elektrický stav. Mechanický stah na aktivaci navazuje. Časování i rozložení vlny jsou schematické.</p>
    <p class="source"><a href="https://pubmed.ncbi.nlm.nih.gov/5482907/">Aktivace lidského srdce · Durrer a kol.</a></p></section>
    <section class="card"><div class="card-head"><h2>Jeden sinusový cyklus</h2><span class="tag">Svod II</span></div>
    ${canvas("cycle", t("Syntetické EKG se synchronizovaným časovým kurzorem"), "tall")}
    <div class="legend">Syntetický průběh · PQ 160 ms · QRS 90 ms</div>
    <div class="controls">${option("play", t("Přehrát cyklus"))}${option("prev", t("Předchozí"))}${option("next", t("Další krok"))}
    ${select("cycle-speed", t("Tempo"), [["5",t("5× pomaleji")],["10",t("10× pomaleji")],["20",t("20× pomaleji")]])}</div>
    <label for="clock">Čas v cyklu <output id="clock-value"></output></label><input id="clock" type="range" min="0" max="850" value="0" aria-label="Čas v cyklu v milisekundách">
    </section></div>
    <section class="card"><div class="card-head"><h2>Co se právě děje</h2><span id="phase-label" class="tag"></span></div>
    <p id="phase-copy" class="callout" aria-live="polite"></p>
    <div class="phase-buttons">${phases.map(([, name], i) => option("phase-" + i, name)).join("")}</div>
    ${source(t("Heart anatomy, sn. 43–54 · Zápočet, s. 1"))}</section>
    <div class="grid">${card(t("Změny rytmu"), t('<p>Porovnej sinusový rytmus s komorovou extrasystolou a postupnou AV blokádou.</p><a class="action" href="#atlas">Otevřít atlas</a>'))}${card(t("Krevní oběh"), t('<p>Projdi mechanický cyklus, tok krve a chlopně na samostatné vrstvě.</p><a class="action" href="#anatomie">Otevřít anatomii</a>'))}</div></div>`;

  const tissue = $("tissue-layer");
  const drawTissue = tissuePlayback(tissue);
  const routes = [...target.querySelectorAll("[data-route]")];
  $("show-tissue").onchange = event => { tissue.toggleAttribute("hidden", !event.target.checked); };
  $("show-pathway").onchange = event => {
    routes.forEach(route => route.toggleAttribute("hidden", !event.target.checked));
  };
  const signal = sample(normalCycle, "II", 0, .85);
  const highlighted = [0, 1, 2, 3, 4, 5, 5, 6];
  let time = 0, frame, phase = -1, playing = false;
  $("play").className = "primary";
  const update = () => {
    let nextPhase = phases.findLastIndex(([start]) => time >= Math.round(start * 1000));
    if (time >= 640) nextPhase = 0;
    if (nextPhase !== phase) {
      phase = nextPhase;
      $("phase-label").textContent = time >= 640 ? t("Mezi cykly") : phases[phase][1];
      $("phase-copy").textContent = time >= 640 ? t("Repolarizace v modelu skončila. Izolinie trvá do další síňové aktivace.") : phases[phase][2];
      routes.forEach(node => {
        node.classList.toggle("route-active", time < 640 && Number(node.dataset.route) === highlighted[phase]);
      });
      phases.forEach((_, i) => $("phase-" + i).setAttribute("aria-pressed", String(i === phase && time < 640)));
    }
    drawTissue(time);
    $("clock").value = time;
    $("clock").setAttribute("aria-valuetext", fmt(time, 0) + " ms");
    $("clock-value").value = "· " + fmt(time, 0) + " ms";
    $("prev").disabled = time === 0;
    $("next").disabled = time >= 640;
    plot($("cycle"), { series: [{ values: signal, step: .002 }], x: [0, .85], y: [-.4, 1.25], paper: true,
      events: [{ time: time / 1000, dash: false, color: colors.gold },
        { time: .15, label: "P", color: colors.accent, labelOnly: true },
        { time: .285, label: "QRS", color: colors.blue, labelOnly: true },
        { time: .52, label: "T", color: colors.alternate, labelOnly: true }],
      bands: [{ from: .12, to: .21, color: "var(--chart-accent-band)" }, { from: .28, to: .37, color: "var(--chart-blue-band)" }, { from: .452, to: .64, color: "var(--chart-alt-band)" }] });
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    playing = false;
    $("play").textContent = t("Přehrát cyklus");
  };
  const move = ms => { stop(); time = ms; phase = -1; update(); };
  $("clock").oninput = e => move(Number(e.target.value));
  $("prev").onclick = () => move(Math.round((phases.findLast(([t]) => Math.round(t * 1000) < time)?.[0] ?? 0) * 1000));
  $("next").onclick = () => move(Math.round((phases.find(([t]) => Math.round(t * 1000) > time)?.[0] ?? .64) * 1000));
  phases.forEach(([t], i) => $("phase-" + i).onclick = () => move(Math.round(t * 1000)));
  $("play").onclick = () => {
    if (playing) { stop(); return; }
    if (time >= 850) time = 0;
    playing = true;
    $("play").textContent = t("Pozastavit");
    let previous = performance.now(), progress = time;
    const animate = now => {
      progress += (now - previous) / Number($("cycle-speed").value);
      previous = now;
      time = Math.min(850, Math.round(progress));
      update();
      if (time === 850) stop();
      else frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
  };
  update();
  return stop;
}

function anatomyPage(target) {
  const flow = [
    t("Odkysličená krev přitéká z těla dutými žilami do pravé síně."),
    t("Při plnění proudí krev přes trojcípou chlopeň do pravé komory."),
    t("Při vypuzování jde krev přes pulmonální chlopeň do plicnice a plic."),
    t("Okysličená krev přitéká plicními žilami do levé síně."),
    t("Při plnění proudí krev přes mitrální chlopeň do levé komory."),
    t("Při vypuzování jde krev přes aortální chlopeň do aorty a těla."),
  ];
  const valves = [
    [t("Plnění komor"), t("Trojcípá a mitrální otevřené. Pulmonální a aortální zavřené.")],
    [t("Izovolumická kontrakce"), t("Všechny zavřené. Uzávěr AV chlopní doprovází první ozva.")],
    [t("Vypuzování"), t("Pulmonální a aortální otevřené. Trojcípá a mitrální zavřené.")],
    [t("Izovolumická relaxace"), t("Všechny zavřené. Uzávěr poloměsíčitých chlopní doprovází druhá ozva.")],
  ];
  target.innerHTML = `<div class="stack">${anatomyExplorer()}<div class="grid feature">
    ${card(t("Cesta krve"), heartMap(true) + '<div class="controls">' + option("flow-prev", t("Předchozí")) + option("flow-next", t("Další úsek")) + '</div><p id="flow-copy" class="callout" aria-live="polite"></p>')}
    ${card(t("Chlopně v průběhu cyklu"), '<div class="controls">' + select("valves", t("Fáze"), valves.map(([name], i) => [i, name])) + '</div><p id="valves-copy" class="callout" aria-live="polite"></p>' + source(t("Heart anatomy, sn. 4–54 · Zápočet, s. 1")))}
    </div>${card(t("Anatomie a fyziologie"), noteCards(anatomy))}</div>`;
  mountAnatomyExplorer(target);
  let position = 0;
  const show = () => {
    target.querySelectorAll("[data-route]").forEach(node => node.style.opacity = Number(node.dataset.route) === position ? 1 : .22);
    $("flow-copy").textContent = flow[position];
    $("flow-prev").disabled = position === 0;
    $("flow-next").textContent = position === flow.length - 1 ? t("Začít znovu") : t("Další úsek");
  };
  $("flow-prev").onclick = () => { position--; show(); };
  $("flow-next").onclick = () => { position = (position + 1) % flow.length; show(); };
  $("valves").onchange = () => { $("valves-copy").textContent = valves[$("valves").value][1]; };
  $("valves").onchange();
  show();
}

function rhythmAtlas(target) {
  const groups = Object.groupBy(Object.entries(atlas), ([, item]) => item.group);
  target.innerHTML = t`<div class="stack"><section class="card">
    <div class="controls"><label for="case">Příklad <select id="case">${Object.entries(groups).map(([group, items]) =>
      `<optgroup label="${group}">${items.map(([key, {name}]) => `<option value="${key}">${name}</option>`).join("")}</optgroup>`).join("")}</select></label>
    ${option("reveal", t("Zobrazit vysvětlení"))}${option("ladder-toggle", t("Otevřít žebříček"))}</div>
    <p class="muted" id="atlas-origin"></p><div id="strips" class="stack"></div></section>
    <section class="card" id="rhythm-explanation" hidden></section>
    <section class="card" id="ladder-panel" hidden><h2>Žebříčkový diagram</h2>
    <div class="controls">${option("ladder-back", t("Předchozí vrstva"))}${option("ladder-next", t("Další vrstva"))}</div>
    <p id="ladder-copy" aria-live="polite"></p>${canvas("ladder", t("Žebříček se síňovou, převodní a komorovou úrovní"), "short")}
    ${legend([[colors.accent,t("Pozorovaná P a QRS")], [colors.gold,t("Odvozený převod nebo místo bloku")], [colors.blue,t("Modelový impulz SA uzlu")]])}</section></div>`;
  $("reveal").className = "primary";
  let scene = atlas.sinus, revealed = false, ladderOn = false, level = 0;
  const ascent = () => {
    const ref = sinus(Math.ceil(scene.duration / .86));
    const annotations = revealed ? (scene.eventsMark ?? [[scene.focus, t("Studovaný stah")]]).map(([time, label], i) => ({ time, label, lane: i % 2, color: i ? colors.gold : colors.alternate })) : [];
    const brackets = revealed ? (scene.brackets ?? []).map(([from, to, label]) => ({ from, to, label })) : [];
    $("atlas-origin").textContent = t`Syntetické výukové průběhy · ${scene.leads.join(t(" a "))} · ${fmt(scene.duration)} s · stejné měřítko v každé dvojici`;
    $("strips").innerHTML = scene.leads.map((lead, i) => t`<div class="stack">
      <div><h3>Sinusová reference · ${lead}</h3>${canvas("ref-" + i, t("Sinusová reference ve svodu ") + lead, "short")}</div>
      <div><h3>${scene.name} · ${lead}</h3>${canvas("case-" + i, t("Studovaný rytmus ve svodu ") + lead, "short")}</div>
    </div>`).join("");
    scene.leads.forEach((lead, i) => {
      const x = [0, scene.duration], y = [-1.25, 1.35];
      plot($("ref-" + i), { series: [{ values: sample(ref, lead, ...x), step: .002 }], x, y, paper: true });
      plot($("case-" + i), { series: [{ values: sample(scene.events, lead, ...x), step: .002, color: colors.alternate }], x, y, paper: true, events: annotations, brackets });
    });
    $("rhythm-explanation").hidden = !revealed;
    $("reveal").textContent = revealed ? t("Skrýt vysvětlení") : t("Zobrazit vysvětlení");
    if (!revealed) return;
    const chosen = scene.leads[0];
    const refQ = ref.q.reduce((a,b) => Math.abs(a.t-scene.focus) < Math.abs(b.t-scene.focus) ? a : b);
    $("rhythm-explanation").innerHTML = t`<h2>Rozbor průběhu</h2>
    <div class="details-grid"><div><h3>Kam se podívat?</h3><p>${scene.look}</p></div>
    <div><h3>Co se změnilo?</h3><p>${scene.change}</p></div><div><h3>Jak změna vznikla?</h3><p>${scene.why}</p></div></div>
    <div class="grid"><div><h3>Detail reference · ${chosen}</h3>${canvas("zoom-ref", t("Detail referenčního stahu"), "short")}</div><div><h3>Detail ukázky · ${chosen}</h3>${canvas("zoom-case", t("Detail označeného stahu"), "short")}</div></div>
    ${source(t`Arytmologie, sn. ${scene.slides} · syntetická výuková rekonstrukce`)}
    ${["wpw", "mahaim", "shortpr", "av2to1", "mobitz2"].includes($("case").value) ? source(["av2to1", "mobitz2"].includes($("case").value)
      ? t('<a href="https://doi.org/10.1161/CIR.0000000000000628">ACC/AHA/HRS · vymezení AV bloku 2:1</a>')
      : t('<a href="https://doi.org/10.1093/eurheartj/ehz467">ESC · běžné a atypické přídatné dráhy</a> · <a href="https://pubmed.ncbi.nlm.nih.gov/6662116/">Elektrofyziologická studie krátkého PQ</a>')) : ""}`;
    const zoom = (id, data, center, color, marks) => {
      const x = [center - .23, center + .58];
      plot($(id), { series: [{ values: sample(data, chosen, ...x), start: x[0], step: .002, color }], x,
        y: [-1.25, 1.35], paper: true, events: marks });
    };
    zoom("zoom-ref", ref, refQ.t, colors.accent, [{ time: refQ.t, label: t("Začátek QRS") }]);
    zoom("zoom-case", scene.events, scene.focus, colors.alternate, annotations);
  };
  const ladder = () => {
    $("ladder-panel").hidden = !ladderOn;
    $("ladder-toggle").textContent = ladderOn ? t("Skrýt žebříček") : t("Otevřít žebříček");
    if (!ladderOn) return;
    const { p, q } = scene.events;
    const tracks = [];
    const labels = ["P", "QRS", t("Obě řady s odvozeným vedením")];
    $("ladder-copy").textContent = [
      t("Začni na úrovni síní. Každou viditelnou P přenes ve stejném čase do horní řady."),
      t("Přidej QRS ve spodní řadě. U výpadku nech odpovídající místo prázdné."),
      t("Spoj události, které k sobě v tomto modelu patří. Přerušená čára a kříž označují odvozený výpadek, modrá modelový SA impulz.")
    ][level];
    $("ladder-copy").setAttribute("aria-label", labels[level] + ". " + $("ladder-copy").textContent);
    const track = (times, values, color, dots = false, dashed = false) => tracks.push({ times, values, color, dots, dashed });
    const mark = (time, row) => track([time, time], [row - .12, row + .12], colors.accent);
    p.forEach(({ t }) => mark(t, 2));
    if (level >= 1) q.forEach(({ t }) => mark(t, 0));
    const cross = (t, y, color) => {
      track([t - .035, t + .035], [y - .105, y + .105], color);
      track([t - .035, t + .035], [y + .105, y - .105], color);
    };
    if (level >= 2) {
      q.filter(event => event.p != null).forEach(event => track([event.p, event.t], [2, 0], colors.gold, false, true));
      const key = $("case").value;
      if (["mobitz1", "mobitz2", "av2to1", "av3", "high"].includes(key)) {
        p.filter(({ t }) => !q.some(event => event.p === t)).forEach(({ t }) => {
          const end = t + (key === "mobitz1" ? .23 : .12);
          track([t, end], [2, 1], colors.gold, false, true);
          cross(end, 1, colors.gold);
        });
      }
      if (scene.sa) {
        const delay = key === "sa1" ? .13 : .07;
        const origins = {
          sa2a: [{ time: .13, p: .31 }, { time: .93, p: 1.24 }, { time: 1.73, p: 2.12 }, { time: 2.53 },
            { time: 3.33, p: 3.68 }, { time: 4.13, p: 4.61 }, { time: 4.93, p: 5.49 }],
          sa2b: [...p.map(event => ({ time: event.t - delay, p: event.t })), { time: 2.82 }],
          sa3: sinus(7).p.map(event => ({ time: event.t - delay })),
        }[key] ?? p.map(event => ({ time: event.t - delay, p: event.t }));
        origins.forEach(event => {
          track([event.time, event.p ?? event.time + .07], [2.67, event.p == null ? 2.38 : 2], colors.blue, false, true);
          if (event.p == null) cross(event.time + .07, 2.38, colors.blue);
        });
      }
      if (key === "junction") track([1.97, 2.073], [1, 2], colors.gold, false, true);
      if (key === "pvcReset") track([1.90, 2.05, 2.20], [0, 1, 2], colors.gold, false, true);
      if (["pvc", "interpolated", "bigeminy", "pvcReset", "endDiastolic", "ronT", "pvcCouplet", "av3"].includes(key)) {
        q.filter(event => event.p == null).forEach(({t}) => track([t], [.32], colors.gold, true));
      }
    }
    $("ladder-back").disabled = level === 0;
    $("ladder-next").disabled = level === 2;
    plot($("ladder"), { series: tracks, x: [0, scene.duration], y: [-.28, 2.98], yLabel: t("Úroveň"), yNames: {0: t("Komory"), 1: t("Převod"), 2: t("Síně"), 2.67: t("SA uzel")} });
  };
  $("case").onchange = () => { scene = atlas[$("case").value]; revealed = false; level = 0; clearPlots(); ascent(); ladder(); };
  $("reveal").onclick = () => { revealed = !revealed; clearPlots(); ascent(); ladder(); };
  $("ladder-toggle").onclick = () => { ladderOn = !ladderOn; ladder(); };
  $("ladder-next").onclick = () => { level++; ladder(); };
  $("ladder-back").onclick = () => { level--; ladder(); };
  ascent();
}

function leadPage(target) {
  const directions = { I: 0, II: 60, III: 120, aVR: -150, aVL: -30, aVF: 90, "−aVR": 30 };
  const order = { regular: ["I", "II", "III", "aVR", "aVL", "aVF"], cabrera: ["aVL", "I", "−aVR", "II", "aVF", "III"] };
  const degrees = angle => angle * Math.PI / 180;
  const radial = (angle, distance) => [180 + Math.cos(degrees(angle)) * distance, 156 + Math.sin(degrees(angle)) * distance];
  const loop = Array.from({length: 97}, (_, i) => {
    const angle = i / 96 * 2 * Math.PI;
    return [(.5 - .5 * Math.cos(angle)) * 100, Math.sin(angle) * 22 * (.5 - .5 * Math.cos(angle))];
  });
  target.innerHTML = `<div class="stack"><div class="grid feature">
    ${card(t("Šestiosý systém"), t`<svg class="map" viewBox="0 0 360 312" role="img" aria-label="Šest končetinových os, okamžitý vektor a jeho výuková smyčka">
      <circle cx="180" cy="156" r="114" fill="var(--plot)" stroke="var(--map-stroke)"/>
      <g id="lead-axes"></g><path id="vcg-loop" fill="none" stroke="${colors.blue}" stroke-width="2"/><path id="mean-axis" fill="none" stroke="${colors.accent}" stroke-width="3"/><circle id="axis-end" r="4" fill="${colors.accent}"/>
    </svg>` + t('<label for="axis">Elektrická osa <output id="angle-value"></output></label><input id="axis" type="range" min="-180" max="180" value="60"><p id="axis-hint" class="callout" aria-live="polite"></p>') + legend([[colors.accent, t("Výsledný směr")], [colors.blue, t("Schematická smyčka QRS")]]))}
    ${card(t("Projekce téhož modelového stahu"), '<div class="controls">' + select("lead-order", t("Řazení"), [["regular",t("Standardní")],["cabrera","Cabrera"]]) + select("lead-active", t("Zobrazený svod"), []) + '</div>' + canvas("projection", t("Modelová projekce QRS")) + '<div id="lead-values" class="table-wrap"></div>')}
    </div>${card(t("Jak vzniká dvanáct svodů"), noteCards(leadNotes) + source(t('Lead systems, sn. 2–46 · Zápočet, s. 1 · <a href="https://doi.org/10.1016/j.jacc.2007.01.024">AHA, technologie EKG a Cabrera</a>')))}</div>`;
  const update = () => {
    const theta = +$("axis").value;
    const leads = order[$("lead-order").value];
    const selected = $("lead-active").value;
    const end = radial(theta, 103);
    const axisText = theta >= -30 && theta <= 90 ? t("orientační běžné rozmezí") :
      theta > 90 ? t("pravá odchylka") : theta >= -90 ? t("levá odchylka") : t("extrémní osa");
    $("angle-value").value = fmt(theta, 0) + "°";
    $("axis-hint").textContent = t`${fmt(theta, 0)}° · ${axisText}. Pro odhad sleduj znaménka projekcí I, aVF a II.`;
    $("axis-end").setAttribute("cx", end[0]); $("axis-end").setAttribute("cy", end[1]);
    $("mean-axis").setAttribute("d", `M180 156 L${end.join(" ")}`);
    $("lead-axes").innerHTML = leads.map(name => {
      const angle = directions[name];
      const far = radial(angle, 114), label = radial(angle, 132), near = radial(angle + 180, 114);
      const active = name === selected ? colors.gold : "var(--map-stroke)";
      return `<line x1="${near[0]}" y1="${near[1]}" x2="${far[0]}" y2="${far[1]}" stroke="${active}" stroke-width="1"/><text x="${label[0]}" y="${label[1] + 4}" text-anchor="middle">${name}</text>`;
    }).join("");
    const projected = loop.map(([x, y]) => [
      Math.cos(degrees(theta)) * x - Math.sin(degrees(theta)) * y,
      Math.sin(degrees(theta)) * x + Math.cos(degrees(theta)) * y,
    ]);
    $("vcg-loop").setAttribute("d", projected.map(([x, y], i) => `${i ? "L" : "M"}${180+x} ${156+y}`).join(" "));
    const angle = degrees(directions[selected]);
    const curve = projected.map(([x,y]) => (x * Math.cos(angle) + y * Math.sin(angle)) / 100);
    const signal = [...Array(30).fill(0), ...curve, ...Array(30).fill(0)];
    plot($("projection"), { series: [{ values: signal, step: .001 }], x: [0, .156], y: [-1.15,1.15], paper: true });
    $("lead-values").innerHTML = t`<table><thead><tr><th>Svod</th><th>Kladná osa</th><th>Projekce směru</th></tr></thead><tbody>${leads.map(name => {
      const direction = directions[name], value = Math.cos(degrees(theta - direction));
      return `<tr><td>${name}</td><td>${direction}°</td><td>${fmt(Math.abs(value) < .005 ? 0 : value, 2)} mV</td></tr>`;
    }).join("")}</tbody></table>`;
  };
  const reorder = () => {
    const old = $("lead-active").value, leads = order[$("lead-order").value];
    $("lead-active").innerHTML = leads.map(name => `<option>${name}</option>`).join("");
    $("lead-active").value = leads.includes(old) ? old : "II";
    update();
  };
  $("axis").oninput = update;
  $("lead-order").onchange = reorder;
  $("lead-active").onchange = update;
  reorder();
}

function acquisitionPage(target) {
  const steps = [t("Elektroda"), t("Rozhraní"), t("Zesilovač"), "DRL", t("Filtr a převodník"), t("Nadvzorkování"), t("Komprese")];
  target.innerHTML = `<div class="stack">
    ${card(t("Snímací řetězec"), '<div class="controls" id="acq-steps">' + steps.map((name, i) => option("acq-" + i, name)).join("") + '</div><div id="acq-copy" class="callout" aria-live="polite"></div>' + source(t("ECG acquisition HW, s. 2–68 · Zápočet, s. 2")))}
    <div class="grid">
    ${card(t("Souhlasný a rozdílový signál"), t('<label for="cmrr">Potlačení CMRR <output id="cmrr-value"></output></label><input id="cmrr" type="range" min="20" max="100" step="10" value="60">') + canvas("amp", t("Rozdílová složka EKG s příměsí souhlasného signálu")) + '<p id="amp-copy" class="source"></p>')}
    ${card(t("Softwarová akvizice"), t('<p class="callout">Samostatná prezentace k softwarové akvizici v dodané sadě chybí. K doplnění kurzu prosím přilož příslušné slajdy.</p>') + noteCards(acquisition.slice(5)) + source(t('<a href="https://www.analog.com/en/resources/app-notes/an-2003.html">Analog Devices AN-2003</a> · <a href="https://doi.org/10.1016/j.jacc.2007.01.024">AHA, technologie EKG</a>')))}
    </div></div>`;
  const step = n => {
    const [name, text] = acquisition[n];
    $("acq-copy").innerHTML = `<strong>${name}</strong><p>${text}</p>`;
    steps.forEach((_, i) => $("acq-" + i).setAttribute("aria-pressed", String(n === i)));
  };
  steps.forEach((_, i) => $("acq-" + i).onclick = () => step(i));
  const update = () => {
    const cmrr = Number($("cmrr").value);
    const residue = 120 * 10 ** (-cmrr / 20);
    const clean = sample(normalCycle, "II", 0, .85, 1000);
    const output = clean.map((v, i) => v + residue * Math.sin(2 * Math.PI * 50 * i / 1000));
    $("cmrr-value").value = cmrr + " dB";
    $("amp-copy").textContent = t`Model vztažený na vstup. Ze souhlasného brumu 120 mV zbývá ${fmt(residue, 4)} mV. Červená křivka ukazuje čistou diferenciální složku, fialová výstup s reziduem.`;
    plot($("amp"), { series: [{ values: output, step: .001, color: colors.alternate }, { values: clean, step: .001 }], x: [0, .85], y: [-1.5, 1.8] });
  };
  $("cmrr").oninput = update;
  step(0);
  update();
}

function quiz(target) {
  const sampleQuiz = [atlas.pvc, atlas.mobitz1, atlas.pac];
  target.innerHTML = `<div class="stack">
    ${card(t("Neanotovaný proužek"), '<div class="controls">' + select("quiz-strip", t("Ukázka"), [["0","A"],["1","B"],["2","C"]]) + option("strip-answer", t("Odkrýt řešení")) + '</div>' +
    t('<p class="muted">Syntetický svod II. Najdi odchylku v rytmu a vysvětli, jak vznikla.</p>') + canvas("blind", t("Neanotovaný výukový proužek")) + '<p id="strip-result" class="callout" hidden aria-live="polite"></p>')}
    ${card(t("Otázky k zápočtu"), t`<form id="quiz-form">${questions.map(([question, choices], i) => `<fieldset><legend>${question}</legend>
      ${choices.map((choice, j) => `<label><input type="radio" name="q-${i}" value="${j}" required> ${choice}</label>`).join("")}
      <p id="answer-${i}" class="callout" hidden></p></fieldset>`).join("")}
    <button class="primary">Vyhodnotit odpovědi</button> <output id="quiz-score" aria-live="polite"></output></form>` + source(t("Exam Topics, s. 1–2 · Zápočet, s. 5")))}</div>`;
  const update = reveal => {
    const scene = sampleQuiz[Number($("quiz-strip").value)];
    $("strip-result").hidden = !reveal;
    $("strip-result").textContent = reveal ? `${scene.name}. ${scene.change} ${scene.why}` : "";
    plot($("blind"), { series: [{ values: sample(scene.events, "II", 0, scene.duration), step: .002 }],
      x: [0, scene.duration], y: [-1.25, 1.35], paper: true,
      events: reveal ? (scene.eventsMark ?? [[scene.focus, t("Studovaný stah")]]).map(([time,label],i) => ({ time,label,lane:i })) : [] });
  };
  $("quiz-strip").onchange = () => update(false);
  $("strip-answer").onclick = () => update($("strip-result").hidden);
  $("quiz-form").onsubmit = event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let score = 0;
    questions.forEach(([, choices, correct, explanation], i) => {
      const result = $("answer-" + i);
      const match = Number(form.get("q-" + i)) === correct;
      if (match) score++;
      const [opening, closing] = language === "en" ? ["“", "”"] : ["„", "“"];
      result.textContent = (match ? t("Správně. ") : t("Správná odpověď je ") + opening + choices[correct] + closing + ". ") + explanation;
      result.hidden = false;
    });
    $("quiz-score").value = t`${score} z ${questions.length} správně`;
  };
  update(false);
}

function sourcesPage(target) {
  target.innerHTML = `<div class="stack">${card(t("Obě strany zkouškových okruhů"), t`<div class="table-wrap"><table>
    <thead><tr><th>Bod osnovy</th><th>Lekce</th><th>Opora v materiálech</th></tr></thead><tbody>
    ${curriculum.map(([subject, key, reference]) => `<tr><td>${subject}</td><td><a href="#${key}">${pages[key][0]}</a></td><td>${reference}</td></tr>`).join("")}
    </tbody></table></div>` + source(t("MPA-DVK – Exam Topics, s. 1–2 a MPC-DVK – Zápis k zápočtu, s. 1–5")))}
    ${card(t("Doplňující zdroje a mezery"), t`<p>Výklad nadvzorkování, komprese a části o Cabrerovi vychází z externích technických zdrojů. K těmto tématům prosím doplň samostatné slajdy softwarové akvizice, pokud jsou k dispozici.</p>
    <ul><li><a href="https://www.analog.com/en/resources/app-notes/an-2003.html">Analog Devices AN-2003 · nadvzorkování v ADC</a></li>
    <li><a href="https://doi.org/10.1016/j.jacc.2007.01.024">AHA · technologie, komprese a zobrazení EKG</a></li>
    <li><a href="https://pubmed.ncbi.nlm.nih.gov/3997178/">Pan a Tompkins · původní detektor</a></li>
    <li><a href="https://doi.org/10.1161/01.cir.93.5.1043">Task Force · metody a jednotky HRV</a></li>
    <li><a href="https://doi.org/10.1161/CIR.0000000000000628">ACC/AHA/HRS · klasifikace AV převodu včetně poměru 2:1</a></li></ul>`
    + t('<p>Naměřené EKG nemá referenční R anotace. U videa izolovaného srdce chybí podložená snímková frekvence a u souboru RR podrobný popis záznamu. Laboratoře tyto meze uvádějí vedle dat.</p>'))}</div>`;
}

render();

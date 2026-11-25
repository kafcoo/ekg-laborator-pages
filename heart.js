import { t } from "./i18n.js";

const atrialAreas = [
  "M93 105C99 67 130 58 155 66C174 71 184 88 194 104L181 142C157 135 130 135 103 148Z",
  "M195 105C221 81 263 76 285 94C296 103 303 120 306 134C260 130 232 137 204 153Z",
];
const ventricularArea = "M103 151C136 137 165 139 192 156C224 131 266 130 307 139C308 185 282 228 251 265C235 282 221 289 207 277C167 248 115 205 103 151Z";

function activationCells() {
  const cells = [];
  const step = 8;
  for (let y = 65; y <= 150; y += step) {
    for (let x = 91; x <= 311; x += step) {
      const side = x < 195 ? 0 : 1;
      const distance = side === 0 ? Math.hypot(x - 131, y - 89) : Math.hypot(x - 218, (y - 100) * 1.3);
      const start = side === 0 ? 120 + distance * .81 : 147 + distance * .62;
      cells.push({ x, y, start: Math.min(205, start), recovery: 272 + distance * .31, layer: side });
    }
  }
  const origins = [[203, 177, 280], [211, 225, 299], [175, 210, 304], [250, 225, 310]];
  for (let y = 137; y <= 287; y += step) {
    for (let x = 99; x <= 313; x += step) {
      const start = Math.min(...origins.map(([sx, sy, delay]) => delay + Math.hypot((x - sx) * .9, y - sy) * .77));
      const depth = Math.max(0, 53 - Math.abs(x - 207));
      const recovery = 452 + depth * 1.8 + Math.abs(241 - y) * .64;
      cells.push({ x, y, start: Math.min(369, start), recovery, layer: 2 });
    }
  }
  return cells;
}

const cells = activationCells();
const cellMarkup = cell => `<circle cx="${cell.x}" cy="${cell.y}" r="2.3"/>`;

export function tissueOverlay() {
  return `<defs>
    ${[...atrialAreas, ventricularArea].map((path, i) => `<clipPath id="tissue-region-${i}"><path d="${path}"/></clipPath>`).join("")}
  </defs>
  <g id="tissue-layer" aria-hidden="true">
    ${[0, 1, 2].map(layer => `<g clip-path="url(#tissue-region-${layer})">${cells.filter(cell => cell.layer === layer).map(cellMarkup).join("")}</g>`).join("")}
  </g>`;
}

export function tissuePlayback(layer) {
  const ordered = [0, 1, 2].flatMap(group => cells.filter(cell => cell.layer === group));
  const dots = [...layer.querySelectorAll("circle")];
  return time => {
    ordered.forEach(({ start, recovery }, i) => {
      const state = time < start || time >= recovery + 12 ? ""
        : time < start + 15 ? "wave-front"
        : time < recovery ? "wave-active" : "wave-recovery";
      if (dots[i].getAttribute("class") !== state) dots[i].setAttribute("class", state);
    });
  };
}

// Front-facing cutaway. The right heart appears on the viewer's left.
const cutaway = { width: 533, height: 641 };
const chambers = [
  ["right-atrium", t("Pravá síň"), "Atrium dextrum", t("Přijímá odkysličenou krev z těla horní a dolní dutou žílou. Krev pokračuje přes trojcípou chlopeň do pravé komory."), [124,344,1.85],
    "M95 291C112 258 149 254 183 284C197 311 201 354 197 379C176 402 173 430 150 447L128 478C106 463 86 431 86 399C78 354 81 315 95 291Z"],
  ["left-atrium", t("Levá síň"), "Atrium sinistrum", t("Přijímá okysličenou krev z plic plicními žilami. Krev pokračuje přes mitrální chlopeň do levé komory."), [327,275,2.15],
    "M278 227C315 198 374 212 393 258L403 291C379 305 358 314 339 329C315 321 289 307 270 282Z"],
  ["right-ventricle", t("Pravá komora"), "Ventriculus dexter", t("Při stahu vytlačuje krev přes pulmonální chlopeň do plicního kmene a dál do plic."), [246,500,1.85],
    "M154 472C181 453 215 465 244 480C276 497 319 528 355 554C360 580 313 572 287 559C216 550 174 523 150 493Z M196 400C220 378 251 403 279 410C281 432 292 458 304 482C268 460 223 452 205 435Z"],
  ["left-ventricle", t("Levá komora"), "Ventriculus sinister", t("Při stahu vytlačuje okysličenou krev přes aortální chlopeň do aorty a tělního oběhu. Její svalová stěna je silnější než u pravé komory."), [392,464,1.8],
    "M377 322C400 314 426 347 434 378C446 412 453 466 444 496C439 516 432 537 414 540C400 526 397 499 384 480C368 455 364 402 350 371C348 350 358 332 377 322Z"],
];
const vessels = [
  ["vena-cava", t("Duté žíly"), "Venae cavae", t("Horní dutá žíla přivádí krev z horní poloviny těla a dolní z dolní poloviny. Obě ústí do pravé síně."), [124,181,2],
    "M110 89C118 129 129 195 128 248 M124 516L124 584", 32],
  ["pulmonary-veins", t("Plicní žíly"), "Venae pulmonales", t("Vracejí okysličenou krev z plic do levé síně."), [430,218,2.15],
    "M397 215L444 216 M406 259L448 261 M60 225L94 229 M57 264L86 260", 28],
  ["aorta", t("Aorta"), "Aorta", t("Odvádí okysličenou krev z levé komory do tělního oběhu. Z jejího začátku odstupují koronární tepny."), [268,119,1.8],
    "M186 239C162 166 201 115 265 114C309 115 331 132 336 152 M203 99L177 54 M268 91L274 49 M296 99L317 56 M260 577L256 605", 27],
  ["pulmonary-trunk", t("Plicní kmen"), "Truncus pulmonalis", t("Vede odkysličenou krev z pravé komory. Dělí se na pravou a levou plicní tepnu."), [265,211,1.9],
    "M235 351C229 304 234 220 269 195C298 172 360 171 420 192 M59 187L88 181", 42],
];
const valves = [
  ["tricuspid", t("Trojcípá chlopeň"), "Valva tricuspidalis", t("Otevírá se z pravé síně do pravé komory při plnění. Při stahu komory uzávěr brání návratu krve do síně."), [165,459,2.35],
    "M133 484C152 454 174 446 202 458 M189 402C181 426 203 445 231 467", 18],
  ["mitral", t("Mitrální chlopeň"), "Valva mitralis", t("Otevírá se z levé síně do levé komory při plnění. Při stahu komory uzávěr brání návratu krve do síně."), [377,315,2.4],
    "M337 320C348 328 357 350 360 367 M374 319C384 300 394 300 405 308", 16],
  ["pulmonary-valve", t("Pulmonální chlopeň"), "Valva trunci pulmonalis", t("Leží na výstupu z pravé komory do plicního kmene. Po vypuzení krve se uzavře a brání zpětnému toku do komory."), [235,368,2.55],
    "M207 371C218 346 254 347 264 380 M212 381C224 386 232 375 234 369 M238 369C248 389 259 390 267 380", 14],
  ["aortic-valve", t("Aortální chlopeň"), "Valva aortae", t("Leží mezi levou komorou a aortou. Při uvolnění komory uzávěr brání návratu krve z aorty."), [302,351,2.55],
    "M275 370C272 347 287 328 309 329C328 329 337 343 331 357 M279 379C300 388 301 367 293 359 M298 345C310 355 325 342 317 334", 14],
];
const walls = [
  ["septum", t("Mezikomorová přepážka"), "Septum interventriculare", t("Odděluje pravou a levou komoru. V její svalové části vedou raménka převodního systému směrem ke komorám."), [327,475,2.05],
    "M269 399C275 437 315 480 331 513C342 533 349 550 366 564", 23],
  ["myocardium", t("Srdeční svalovina"), "Myocardium", t("Svalové buňky se při elektrické aktivaci depolarizují a potom se stahují. Jejich souhra vytváří tlak, který pohání krev."), [463,494,1.85],
    "M415 327C445 373 465 394 470 449C483 530 451 565 416 578", 20],
  ["tendinous-cords", t("Šlašinky"), "Chordae tendineae", t("Spojují cípy mitrální a trojcípé chlopně s papilárními svaly. Při stahu komor se napnou a omezují vyvrácení cípů do síní."), [365,391,2.45],
    "M349 343C356 361 363 396 368 428 M376 339C380 363 392 401 403 425", 13],
  ["papillary-muscles", t("Papilární svaly"), "Musculi papillares", t("Vybíhají ze stěny komor. Při systole se stahují společně se svalovinou komor a přes šlašinky stabilizují cípy chlopní."), [413,510,2.3],
    "M401 444C421 468 430 495 417 523 M360 439L398 518", 21],
];
const groups = [chambers, valves, vessels, walls];
const parts = groups.flat();
const byId = new Map(parts.map(part => [part[0], part]));

function anatomyShape(part) {
  const [id, , , , , path, width] = part;
  return `<path class="anatomy-shape" data-structure="${id}" d="${path}" ${width ? `stroke-width="${width}" fill="none"` : 'stroke-width="2"'}/>`;
}

function anatomyMarker([id, name, , , [x, y]]) {
  return `<g class="anatomy-marker" data-marker="${id}" role="button" tabindex="0" aria-label="${name}" aria-pressed="false" transform="translate(${x} ${y})">
    <title>${name}</title><circle class="marker-hit" r="20"/><circle class="marker-ring" r="8.7"/><circle class="marker-core" r="3.2"/>
  </g>`;
}

export function anatomyExplorer() {
  const names = [t("Dutiny"), t("Chlopně"), t("Velké cévy"), t("Stěny a přepážka")];
  return t`<section class="card anatomy-explorer" id="anatomy-explorer">
    <h2>Interaktivní model srdce</h2>
    <p class="muted">Vyber bod v řezu srdcem nebo název v seznamu. Model se přiblíží na vybranou část.</p>
    <div class="anatomy-layout">
      <div class="anatomy-stage">
        <svg id="anatomy-map" viewBox="0 0 ${cutaway.width} ${cutaway.height}" role="group" aria-label="Řez srdcem s interaktivními body">
          <g class="anatomy-camera">
            <image href="assets/heart-cutaway.svg" width="${cutaway.width}" height="${cutaway.height}" class="anatomy-art" aria-hidden="true"/>
            ${[...vessels, ...chambers, ...walls, ...valves].map(anatomyShape).join("")}
            ${parts.map(anatomyMarker).join("")}
          </g>
        </svg>
      </div>
      <div class="anatomy-side">
        <div class="controls">
          <label for="heart-part">Část srdce</label>
          <select id="heart-part"><option value="">Celé srdce</option>
            ${groups.map((group, i) => `<optgroup label="${names[i]}">${group.map(([id, name]) => `<option value="${id}">${name}</option>`).join("")}</optgroup>`).join("")}
          </select>
          <button type="button" id="heart-overview" disabled>Oddálit</button>
        </div>
        <div id="heart-details" class="anatomy-details" aria-live="polite" aria-atomic="true">
          <h3 id="heart-name">Celé srdce</h3><p id="heart-latin" class="anatomy-latin" lang="la" hidden></p>
          <p id="heart-function">V řezu jsou vidět čtyři dutiny, chlopně a velké cévy. Pravá strana srdce je v obrázku vlevo.</p>
        </div>
        <p class="source"><a href="https://www.nhlbi.nih.gov/health/heart/anatomy">Anatomie srdce · NHLBI</a></p>
        <p class="source anatomy-credit">Ilustrace: <a href="https://commons.wikimedia.org/wiki/File:Diagram_of_the_human_heart_(no_labels).svg">Wapcaplet, Stenemo a Jmarchn</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a></p>
      </div>
    </div>
  </section>`;
}

export function mountAnatomyExplorer(target) {
  const explorer = target.querySelector("#anatomy-explorer");
  const get = id => explorer.querySelector("#" + id);
  const svg = get("anatomy-map");
  const camera = svg.querySelector(".anatomy-camera");
  const markers = [...svg.querySelectorAll("[data-marker]")];
  const shapes = [...svg.querySelectorAll("[data-structure]")];
  const picker = get("heart-part");
  const reset = get("heart-overview");
  const details = get("heart-details");

  function choose(id) {
    const part = byId.get(id);
    picker.value = id;
    reset.disabled = !part;
    svg.classList.toggle("anatomy-zoomed", Boolean(part));
    const cx = cutaway.width / 2, cy = cutaway.height / 2;
    const [x, y, scale] = part?.[4] ?? [cx, cy, 1];
    camera.style.transform = `translate(${cx - x * scale}px, ${cy - y * scale}px) scale(${scale})`;

    for (const marker of markers) {
      const active = marker.dataset.marker === id;
      marker.setAttribute("aria-pressed", String(active));
      marker.setAttribute("tabindex", !part || active ? "0" : "-1");
    }
    for (const shape of shapes) shape.classList.toggle("structure-selected", shape.dataset.structure === id);
    get("heart-name").textContent = part?.[1] ?? t("Celé srdce");
    get("heart-latin").textContent = part?.[2] ?? "";
    get("heart-latin").hidden = !part;
    get("heart-function").textContent = part?.[3] ?? t("V řezu jsou vidět čtyři dutiny, chlopně a velké cévy. Pravá strana srdce je v obrázku vlevo.");
  }

  const overview = () => {
    choose("");
    picker.focus({ preventScroll: true });
  };
  picker.onchange = () => choose(picker.value);
  reset.onclick = overview;
  svg.onclick = event => {
    const hit = event.target.closest("[data-marker], [data-structure]");
    if (!hit) return;
    choose(hit.dataset.marker ?? hit.dataset.structure);
    if (details.getBoundingClientRect().bottom > window.innerHeight) {
      const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
      details.scrollIntoView({ block: "nearest", behavior: reducedMotion ? "instant" : "smooth" });
    }
  };
  explorer.onkeydown = event => {
    const marker = event.target.closest("[data-marker]");
    if (marker && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      choose(marker.dataset.marker);
    }
    if (event.key === "Escape" && picker.value) {
      event.preventDefault();
      overview();
    }
  };
}

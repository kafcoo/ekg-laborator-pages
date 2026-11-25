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
const outline = "M190 87C146 51 98 63 83 110C65 164 98 210 141 251C164 273 183 287 200 299C217 312 241 307 255 292C293 252 329 191 325 140C321 86 276 70 238 91L212 105Z";
const chambers = [
  ["right-atrium", t("Pravá síň"), "Atrium dextrum", t("Přijímá odkysličenou krev z těla horní a dolní dutou žílou. Krev pokračuje přes trojcípou chlopeň do pravé komory."), [128,111,2.1],
    "M109 83C86 101 86 131 102 155C125 146 154 142 180 153C180 125 165 96 147 85C136 78 120 76 109 83Z", "venous"],
  ["left-atrium", t("Levá síň"), "Atrium sinistrum", t("Přijímá okysličenou krev z plic plicními žilami. Krev pokračuje přes mitrální chlopeň do levé komory."), [279,112,2.1],
    "M237 107C251 88 287 88 301 107C312 119 316 136 314 154C291 142 261 144 239 154C234 139 230 121 237 107Z", "arterial"],
  ["right-ventricle", t("Pravá komora"), "Ventriculus dexter", t("Při stahu vytlačuje krev přes pulmonální chlopeň do plicního kmene a dál do plic."), [147,204,1.85],
    "M104 166C121 156 150 152 176 163C192 188 183 222 201 267C161 243 122 206 104 166Z", "venous"],
  ["left-ventricle", t("Levá komora"), "Ventriculus sinister", t("Při stahu vytlačuje okysličenou krev přes aortální chlopeň do aorty a tělního oběhu. Její svalová stěna je silnější než u pravé komory."), [263,216,1.8],
    "M239 166C259 151 291 151 311 166C303 209 277 255 246 286C238 295 224 294 217 286C205 257 200 218 209 194Z", "arterial"],
];
const vessels = [
  ["vena-cava", t("Duté žíly"), "Venae cavae", t("Horní dutá žíla přivádí krev z horní poloviny těla a dolní z dolní poloviny. Obě ústí do pravé síně."), [102,52,2],
    "M101 32L111 89 M86 233C86 196 105 175 116 146", "venous", 19],
  ["pulmonary-veins", t("Plicní žíly"), "Venae pulmonales", t("Vracejí okysličenou krev z plic do levé síně."), [330,117,2.2],
    "M325 100L296 112 M340 132L306 132", "arterial", 15],
  ["aorta", t("Aorta"), "Aorta", t("Odvádí okysličenou krev z levé komory do tělního oběhu. Z jejího začátku odstupují koronární tepny."), [217,42,2.05],
    "M216 142C215 110 207 91 199 73C188 41 222 20 253 34C273 43 274 64 270 80 M211 36L207 19 M231 30L232 14 M252 35L260 20", "arterial", 20],
  ["pulmonary-trunk", t("Plicní kmen"), "Truncus pulmonalis", t("Vede odkysličenou krev z pravé komory. Dělí se na pravou a levou plicní tepnu."), [304,72,2],
    "M197 169C180 147 183 116 201 95C227 65 272 66 313 77", "venous", 20],
];
const valves = [
  ["tricuspid", t("Trojcípá chlopeň"), "Valva tricuspidalis", t("Otevírá se z pravé síně do pravé komory při plnění. Při stahu komory uzávěr brání návratu krve do síně."), [143,153,2.4],
    "M111 160Q125 146 143 157Q159 147 176 159", "valve", 5],
  ["mitral", t("Mitrální chlopeň"), "Valva mitralis", t("Otevírá se z levé síně do levé komory při plnění. Při stahu komory uzávěr brání návratu krve do síně."), [274,152,2.4],
    "M243 158Q258 150 273 155Q289 146 306 157", "valve", 5],
  ["pulmonary-valve", t("Pulmonální chlopeň"), "Valva trunci pulmonalis", t("Leží na výstupu z pravé komory do plicního kmene. Po vypuzení krve se uzavře a brání zpětnému toku do komory."), [188,130,2.65],
    "M179 128Q190 137 199 128", "valve", 5],
  ["aortic-valve", t("Aortální chlopeň"), "Valva aortae", t("Leží mezi levou komorou a aortou. Při uvolnění komory uzávěr brání návratu krve z aorty."), [218,150,2.65],
    "M206 149Q218 158 231 148", "valve", 5],
];
const walls = [
  ["septum", t("Mezikomorová přepážka"), "Septum interventriculare", t("Odděluje pravou a levou komoru. V její svalové části vedou raménka převodního systému směrem ke komorám."), [198,219,2.25],
    "M197 171C189 205 189 239 212 279", "wall", 13],
  ["myocardium", t("Srdeční svalovina"), "Myocardium", t("Svalové buňky se při elektrické aktivaci depolarizují a potom se stahují. Jejich souhra vytváří tlak, který pohání krev."), [295,250,1.95],
    "M274 270Q296 240 307 211", "wall", 9],
];
const groups = [chambers, valves, vessels, walls];
const parts = groups.flat();
const byId = new Map(parts.map(part => [part[0], part]));

function anatomyShape(part) {
  const [id, , , , , path, color, width] = part;
  return `<path class="anatomy-shape anatomy-${color}" data-structure="${id}" d="${path}" ${width ? `stroke-width="${width}" fill="none"` : 'stroke-width="2"'}/>`;
}

function anatomyMarker([id, name, , , [x, y]]) {
  return `<g class="anatomy-marker" data-marker="${id}" role="button" tabindex="0" aria-label="${name}" aria-pressed="false" transform="translate(${x} ${y})">
    <title>${name}</title><circle class="marker-hit" r="13.5"/><circle class="marker-ring" r="4.8"/><circle class="marker-core" r="1.7"/>
  </g>`;
}

export function anatomyExplorer() {
  const names = [t("Dutiny"), t("Chlopně"), t("Velké cévy"), t("Stěny a přepážka")];
  return t`<section class="card anatomy-explorer" id="anatomy-explorer">
    <h2>Interaktivní model srdce</h2>
    <p class="muted">Vyber bod v řezu srdcem nebo název v seznamu. Model se přiblíží na vybranou část.</p>
    <div class="anatomy-layout">
      <div class="anatomy-stage">
        <svg id="anatomy-map" viewBox="0 0 400 325" role="group" aria-label="Řez srdcem s interaktivními body">
          <defs><pattern id="anatomy-grid" patternUnits="userSpaceOnUse" width="16" height="16"><path d="M16 0H0V16" fill="none" stroke="var(--plot-grid-fine)" stroke-width="1"/></pattern></defs>
          <rect width="400" height="325" fill="url(#anatomy-grid)" aria-hidden="true"/>
          <g class="anatomy-camera">
            ${vessels.map(anatomyShape).join("")}
            <path d="${outline}" fill="var(--map-fill)" stroke="var(--map-stroke)" stroke-width="2" aria-hidden="true"/>
            ${[...chambers, ...walls, ...valves].map(anatomyShape).join("")}
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
    const [x, y, scale] = part?.[4] ?? [200, 162.5, 1];
    camera.style.transform = `translate(${200 - x * scale}px, ${162.5 - y * scale}px) scale(${scale})`;

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

import { t } from "./i18n.js";
import { average, cumulative, longIntervals, matchPeaks, timeStats, welch } from "./analysis.js";
import { bounds, canvas, colors, details, fmt, legend, metric, plot, select } from "./plot.js";
import { filterNotes, hrvNotes, opticalNotes } from "./lessons.js";
import { ecg, normalCycle, sample, sinus } from "./rhythms.js";

const source = text => t`<p class="source">Podklady · ${text}</p>`;
const foot = items => `<div class="details-grid">${items.map(([title, copy]) => details(title, copy)).join("")}</div>`;
const card = (title, content) => `<section class="card"><h2>${title}</h2>${content}</section>`;
const options = map => Object.entries(map).map(([id, [name]]) => [id, name]);
const pct = value => Number.isFinite(value) ? fmt(value) + " %" : "—";
const number = (value, unit = "") => Number.isFinite(value) ? fmt(value, 2) + unit : "—";
const fileCache = new Map();
async function dataFile(name, binary = false) {
  if (!fileCache.has(name)) {
    const request = fetch("data/" + name).then(response => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return binary ? response.arrayBuffer() : response.json();
    }).catch(error => {
      fileCache.delete(name);
      throw error;
    });
    fileCache.set(name, request);
  }
  return fileCache.get(name);
}
function report(target, error) {
  if (!target.isConnected) return;
  console.error(error);
  const status = target.querySelector("[data-status]");
  status.textContent = t("Data se nepodařilo načíst. Ověř, že aplikaci otevíráš přes lokální HTTP server, a obnov stránku.");
  status.hidden = false;
}
const segments = {
  clean: [t("Klid"), 0, 10, "bp", 4],
  drift: [t("Drift izolinie"), 10, 20, "hp", 15],
  mains: [t("Síťový brum"), 20, 30, "notch", 25],
  emg: [t("Svalové rušení"), 30, 41.355, "lp", 35],
};
const filters = {
  hp: [t("Horní propust · 0,5 Hz"), t("Potlačí pomalý pohyb izolinie. Sleduj změnu absolutní základní úrovně a tvar za QRS. Posun stejnosměrné složky je očekávaný.")],
  notch: [t("Pásmová zádrž · 49–51 Hz"), t("Zacílí na 50Hz brum. Úzké pásmo zachovává více okolních frekvencí. V okolí rychlých změn může vzniknout doznívání.")],
  lp: [t("Dolní propust · 25 Hz"), t("Ztlumí značnou část rychlého svalového šumu. Zaoblí také strmé přechody QRS a změní vrcholovou amplitudu.")],
  bp: [t("Pásmová propust · 0,5–20 Hz"), t("Praktický experiment pro detekci v tomto záznamu. Potlačí drift i rychlé rušení za cenu ztráty části spektra QRS a změny morfologie.")],
  bad: [t("Horní propust · 5 Hz"), t("Nevhodná volba pro zachování morfologie. Silně zasahuje do pomalejších částí EKG, včetně ST a T. V detailu porovnej průběh krátce za komplexem.")],
};

export async function filterLab(target) {
  target.innerHTML = t`<div class="stack"><section class="card">
    <div class="controls">${select("filter-section", t("Úsek"), options(segments))} ${select("filter-kind", t("Filtr"), options(filters))}</div>
    <p data-status role="status">Načítám měření…</p>
    <div id="filter-ready" hidden><p class="muted" id="filter-range"></p>${canvas("filter-full", t("Vstupní a filtrovaný signál na společné časové ose"), "tall")}
    ${legend([[colors.alternate, t("Vstup")], [colors.accent, t("Výstup při stejném měřítku")]])}
    <p class="callout" id="filter-copy"></p>
    <label for="filter-position">Začátek detailu <output id="filter-time"></output></label>
    <input type="range" id="filter-position" step=".05" aria-label="Začátek detailu v sekundách">
    ${canvas("filter-zoom", t("Detail vstupu a filtrovaného EKG v délce dvou sekund"))}
    <p class="source">Čtvrtý úsek používá celý zbytek souboru. Rozhraní úseků je nominální, kolem přepnutí jsou přechody. Výstupy jsou vypočtené na celém záznamu metodou Butterworth SOS vpřed i vzad. Graf používá jednotky z notebooku.</p>
    ${source(t("Šum v EKG, s. 2–99 · ecg_filtering_student.ipynb · Místní soubor ECG_II_1000Hz_…txt"))}</div></section>
    ${card(t("Doplň pokus o přechodové rušení"), '<div class="controls">' + select("artifact", t("Artefakt"), [["step",t("Skok izolinie")],["impulse",t("Impulz")],["move",t("Přechod při pohybu")]]) + '</div>' + canvas("artifact-plot", t("Syntetické EKG s časově lokalizovaným artefaktem")) + t('<p class="source">Syntetický experiment. Červeně čistý cyklus, fialově cyklus se zvoleným rušením.</p>'))}
    ${card(t("Adaptivní potlačení brumu"), '<div class="controls">' + select("adaptive-mode", t("Reference"), [["clean",t("Pouze síťové rušení")],["leak",t("Reference obsahuje i EKG")]]) + '</div>' + canvas("adaptive-plot", t("Srovnání vstupu, adaptivního výstupu a čisté syntetické reference")) + t('<p class="callout" id="adaptive-copy"></p><p class="source">Výukový model · adaptivní odečet dvou fázových složek 50 Hz metodou NLMS. Šum v EKG, s. 87–99.</p>'))}
    ${card(t("Volba a vlastnosti filtru"), foot(filterNotes))}</div>`;
  const $ = id => target.querySelector("#" + id);
  const artifact = () => {
    const clean = Array.from({length: 1000}, (_, i) => ecg(i / 1000, normalCycle));
    const type = $("artifact").value;
    const noisy = clean.map((v, i) => v + (type === "step" ? (i >= 365 ? .55 : 0)
      : type === "impulse" ? (i >= 365 && i < 373 ? .95 : 0)
      : Math.exp(-.5 * ((i - 390) / 34) ** 2) * Math.sin(i * .17) * .47));
    plot($("artifact-plot"), { series: [{ values: noisy, step: .001, color: colors.alternate }, { values: clean, step: .001 }], x: [0, 1], y: [-.55, 1.35], paper: true });
  };
  $("artifact").onchange = artifact;
  artifact();
  const adaptive = () => {
    const reference = sample(sinus(8), "II", 0, 5, 1000);
    const mixed = [], output = [];
    const leak = $("adaptive-mode").value === "leak";
    let w1 = 0, w2 = 0;
    reference.forEach((v, i) => {
      const angle = 2 * Math.PI * 50 * i / 1000;
      const a = Math.sin(angle), b = Math.cos(angle);
      const x1 = a + (leak ? 2 * v : 0);
      const x2 = b;
      const input = v + (i < 2500 ? .18 : .48) * (.93 * a + .37 * b);
      const error = input - w1 * x1 - w2 * x2;
      const step = .018 * error / (.01 + x1 ** 2 + x2 ** 2);
      w1 += step * x1;
      w2 += step * x2;
      mixed.push(input);
      output.push(error);
    });
    plot($("adaptive-plot"), { series: [
      {values: mixed, step: .001, color: colors.alternate}, {values: output, step: .001},
      {values: reference, step: .001, color: colors.blue, dashed: true},
    ], x: [2,4], y: [-.65,1.65], events: [{time:2.5,label:t("Brum zesílí")}] });
    $("adaptive-copy").textContent = leak
      ? t("Reference obsahuje kromě brumu i část EKG. Adaptivní odečet pak může oslabit užitečné vlny. Porovnej červený výstup s modrou přerušovanou referencí.")
      : t("Po skoku amplitudy brumu v 2,5 s se filtr postupně přizpůsobí. Fialová je zašuměný vstup, červená odhad EKG a modrá přerušovaná křivka čistá reference.");
  };
  $("adaptive-mode").onchange = adaptive;
  adaptive();
  try {
    const data = await dataFile("filter.json");
    if (!target.isConnected) return;
    target.querySelector("[data-status]").hidden = true;
    $("filter-ready").hidden = false;
    const current = $("filter-section"), kind = $("filter-kind"), slider = $("filter-position");
    const show = (id, start, end) => {
      const x0 = Math.round(start * 1000), x1 = Math.round(end * 1000);
      const values = [data.raw.slice(x0, x1), data[kind.value].slice(x0, x1)];
      plot($(id), { series: values.map((set, j) => ({ values: set, step: .001, start, color: j ? colors.accent : colors.alternate })),
        x: [start, end], y: bounds(values), paper: id === "filter-zoom" });
    };
    const showZoom = () => {
      const start = Number(slider.value);
      $("filter-time").value = fmt(start, 2) + " s";
      show("filter-zoom", start, start + 2);
    };
    const update = () => {
      const [name, start, end] = segments[current.value];
      $("filter-range").textContent = t`${name} · ${fmt(start, 3)}–${fmt(end, 3)} s · svod II · 1 000 Hz`;
      $("filter-copy").textContent = filters[kind.value][1];
      show("filter-full", start, end);
      showZoom();
    };
    current.onchange = () => {
      const [, start, end, preferred, detail] = segments[current.value];
      slider.min = start; slider.max = end - 2; slider.value = detail;
      kind.value = preferred;
      update();
    };
    slider.oninput = showZoom;
    kind.onchange = update;
    current.onchange();
  } catch (error) {
    report(target, error);
  }
}

const qrsStages = {
  band: [t("Pásmová propust"), t("Kauzální Butterworth 5–15 Hz zvýrazní pásmo užitečné pro QRS a přidá frekvenčně závislé zpoždění."), t("Napětí [mV]")],
  diff: [t("Derivace"), t("Zpětný rozdíl dělený 1 ms zvýrazní strmé hrany. Pomalý nebo široký komplex může mít nižší odpověď."), t("Sklon [mV/s]")],
  square: [t("Umocnění"), t("Druhá mocnina zdůrazní strmé změny obou znamének a zvětší rozdíl proti malým sklonům."), t("Sklon² [(mV/s)²]")],
  mwi: [t("Klouzavá integrace"), t("Kauzální průměr přes předchozích 150 ms zachytí rozloženou energii a rozšíří odezvu. Maximum je vůči začátku QRS zpožděné."), t("Integrace [(mV/s)²]")],
  threshold: [t("Adaptivní prahy"), t("První práh leží čtvrtinu rozdílu mezi odhady hladiny šumu a stahů nad hladinou šumu. Odhady se přepočítávají po kandidátech."), t("Integrace [(mV/s)²]")],
  search: [t("Zpětné dohledání"), t("Při mezeře přes 1,66násobek odhadu RR se vybere silný dříve odmítnutý kandidát nad polovinou prahu, pokud splní minimální odstupy."), t("Integrace [(mV/s)²]")],
};

export async function qrsLab(target) {
  target.innerHTML = t`<div class="stack"><section class="card">
    <div class="controls">${select("qrs-source",t("Záznam"), [["noisy",t("Syntetický · s rušením")],["synth",t("Syntetický · čistý")],...options(segments)])}
    ${select("qrs-stage", t("Krok"), options(qrsStages))}
    <a class="action" id="to-hrv" href="#hrv">Otevřít intervaly v HRV</a></div>
    <p data-status role="status">Načítám průběhy…</p><div id="qrs-ready" hidden>
    <label for="qrs-position">Začátek okna <output id="qrs-time"></output></label><input type="range" id="qrs-position" min="0" value="0" step=".1">
    <div class="stack"><div><h3>Vstup a lokalizované značky</h3>${canvas("qrs-in", t("Vstup s referenčními a detekovanými časovými značkami"))}</div>
    <div><h3 id="qrs-stage-title"></h3>${canvas("qrs-mid", t("Výstup zvoleného stupně detektoru"))}</div></div>
    ${legend([[colors.accent, t("Pan–Tompkins · lokální značka")],[colors.alternate,t("Hamilton · lokální značka")],[colors.blue,t("Syntetická reference")],[colors.gold,t("Integrační kandidát nebo práh")]])}
    <p class="callout" id="qrs-copy"></p><p class="source" id="qrs-delay"></p>
    <div class="controls" id="qrs-jumps"></div></div></section>
    <section class="card"><h2>Porovnání detekcí v celém zvoleném úseku</h2><div id="qrs-metrics"></div>
    ${details(t("Jak se počítají metriky"), t("Po časovém seřazení se spáruje vždy nejdřívější kompatibilní dvojice s absolutním rozdílem nejvýše 100 ms. Každá značka se použije nejvýše jednou. Citlivost (Se) je TP/(TP+FN), PPV je TP/(TP+FP). U neanotovaného měření lze počítat pouze vzájemná spárování, nikoliv citlivost."))}
    ${details(t("Zpoždění a původ implementací"), t("Pan–Tompkins je výuková adaptace na 1 000 Hz s jedním rozhodovacím kanálem. Nepřebírá kompletní dvojí sadu prahů ani všechny kroky původního algoritmu. Úvodní odhad prahu používá prvních 2,4 s. Druhý detektor je Hamilton z místní knihovny py-ecg-detectors. Po rozhodnutí oba lokalizují dominantní absolutní výchylku v okolí kandidáta na pomocném bezfázově filtrovaném EKG. Na časné špičce po startu je méně kontextu."))}
    ${source(t('R detectors, s. 8–44 · r_detecting.ipynb · qrs_detection_colab.ipynb · <a href="https://pubmed.ncbi.nlm.nih.gov/3997178/">Pan a Tompkins, 1985</a>'))}</section></div>`;
  const $ = id => target.querySelector("#" + id);
  const input = $("qrs-source"), slider = $("qrs-position"), stage = $("qrs-stage");
  let current, offset = 0, request = 0;
  const display = () => {
    if (!current) return;
    const field = stage.value;
    const [name, text, unit] = qrsStages[field];
    const t0 = Number(slider.value), t1 = t0 + 4;
    const x = [offset + t0, offset + t1];
    const indices = [Math.round(t0 * 1000), Math.min(current.input.length, Math.round(t1 * 1000))];
    const cut = values => values.slice(...indices);
    const marks = (peaks, color, lane) => (peaks ?? []).map(index => ({ time: offset + index / 1000, color, partial: true, lane, dash: false }));
    const trace = (values, color, dashed = false) => ({values: cut(values), start: x[0], step: .001, color, dashed});
    $("qrs-time").value = fmt(x[0], 2) + " s";
    const top = trace(current.input, colors.gray);
    plot($("qrs-in"), { series: [top], x, y: bounds([top.values], .15), paper: true, events: [
      ...marks(current.pan, colors.accent, 0), ...marks(current.ham, colors.alternate, 1), ...marks(current.ref, colors.blue, 2)] });
    $("qrs-stage-title").textContent = name;
    const series = [trace(current[field === "threshold" || field === "search" ? "mwi" : field], colors.accent)];
    const thresholdMode = field === "threshold" || field === "search";
    if (thresholdMode) {
      series.push(trace(current.threshold, colors.gold));
      if (field === "search") series.push(trace(current.threshold.map(value => value / 2), colors.gold, true));
    }
    const events = field === "search"
      ? current.search.map(index => ({ time: offset + index / 1000, color: colors.alternate, label: t("Dohledáno") }))
      : marks(current.panLag, colors.gold, 0);
    plot($("qrs-mid"), { series, x, y: bounds(series.map(s => s.values)), yLabel: unit, events });
    const missed = current.ref ? matchPeaks(current.ref, current.pan).missed : [];
    $("qrs-copy").textContent = text + (field === "search" ? t` V celém tomto úseku dohledáno ${current.search.length} kandidátů.` : "");
    const delays = current.panLag.flatMap(candidate => {
      const nearest = current.pan.reduce((best, item) => Math.abs(item - candidate) < Math.abs(best - candidate) ? item : best, Infinity);
      return Math.abs(candidate - nearest) <= 175 ? [candidate - nearest] : [];
    });
    $("qrs-delay").textContent = (delays.length
      ? t`Rozdíl mezi integrační a nejbližší lokalizovanou značkou je v průměru ${fmt(average(delays), 0)} ms (kandidáti do 175 ms).` + " "
      : t("V úseku chybí odpovídající integrační a lokalizované značky. ")) +
      (current.ref ? t`Široký a slabší syntetický komplex je v ${fmt(current.ref[9] / 1000, 3)} s.` + (missed.includes(current.ref[9]) ? t(" Pan–Tompkins ho v toleranci nenašel. Porovnej derivaci a integraci v okolí tohoto času.") : t(" Porovnej jeho derivaci a integraci s okolními stahy.")) : t("Časy jsou vztažené k původnímu souboru. Detektory jsou spuštěné od začátku zvoleného úseku."));
  };
  const jump = (title, index, field) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = title;
    button.onclick = () => {
      slider.value = Math.max(0, Math.min(Number(slider.max), index / 1000 - 2));
      stage.value = field;
      display();
    };
    $("qrs-jumps").append(button);
  };
  const score = () => {
    $("qrs-jumps").replaceChildren();
    if (current.search.length) jump(t("Prohlédnout dohledaný kandidát"), current.search[0], "search");
    if (!current.ref) {
      const { pairs, falsePositives, missed } = matchPeaks(current.pan, current.ham);
      if (missed.length) jump(t("Ukázat značku pouze od Pan–Tompkins"), missed[0], "mwi");
      if (falsePositives.length) jump(t("Ukázat značku pouze od Hamiltona"), falsePositives[0], "mwi");
      $("qrs-metrics").innerHTML = t`<p>Měření bez referenčních anotací. Jde o shodu algoritmů v toleranci ±100 ms.</p><div class="metrics">
        ${metric(t("Páry"), pairs.length)}${metric(t("Pouze Pan–Tompkins"), missed.length)}${metric(t("Pouze Hamilton"), falsePositives.length)}</div>`;
      return;
    }
    jump(t("Prohlédnout slabý široký komplex"), current.ref[9], "mwi");
    $("qrs-metrics").innerHTML = t`<p>Syntetická úloha · ${current.ref.length} známých pozic · tolerance ±100 ms</p><div class="table-wrap"><table>
      <thead><tr><th>Detektor</th><th>TP</th><th>FP</th><th>FN</th><th>Se</th><th>PPV</th></tr></thead><tbody>
      ${[["Pan–Tompkins", current.pan], ["Hamilton", current.ham]].map(([name, values]) => {
        const { pairs, falsePositives, missed } = matchPeaks(current.ref, values);
        const tp = pairs.length;
        return `<tr><td>${name}</td><td>${tp}</td><td>${falsePositives.length}</td><td>${missed.length}</td><td>${pct(100 * tp / current.ref.length)}</td><td>${pct(100 * tp / values.length)}</td></tr>`;
      }).join("")}</tbody></table></div>`;
  };
  const update = async () => {
    const id = input.value, nonce = ++request;
    const status = target.querySelector("[data-status]");
    status.textContent = t("Načítám průběhy…");
    status.hidden = false;
    $("qrs-ready").hidden = true;
    $("qrs-metrics").innerHTML = "";
    try {
      const dataset = await dataFile(`qrs-${id}.json`);
      if (!target.isConnected || nonce !== request) return;
      current = dataset;
      offset = segments[id]?.[1] ?? 0;
      slider.max = Math.max(0, current.input.length / 1000 - 4);
      slider.value = id === "noisy" || id === "synth" ? 6 : 0;
      status.hidden = true;
      $("qrs-ready").hidden = false;
      display();
      score();
    } catch (error) {
      if (nonce === request) report(target, error);
    }
  };
  input.onchange = update;
  stage.onchange = slider.oninput = display;
  $("to-hrv").onclick = () => {
    sessionStorage.setItem("dvk-hrv-source", input.value);
  };
  await update();
}

const hrvSources = [
  ["example", t("Krátká syntetická úloha")],
  ["ectopic", t("Syntetický ektopický stah")],
  ["long", t("Pět minut syntetických NN")],
  ["local", t("Soubor ze cvičení · rr.txt")],
  ["detectors", t("Značky z laboratoře QRS")],
];

export async function hrvLab(target) {
  target.innerHTML = t`<div class="stack"><section class="card">
    <div class="controls">${select("hrv-source",t("Vstup"), hrvSources)}
    <label id="miss-control"><input type="checkbox" id="miss-r"> Vynechat jednu R značku</label>
    <span id="correct-control" hidden>${select("rr-treatment", t("Kontrola"), [["raw",t("Zobrazit surové RR")],["exclude",t("Vyřadit sloučené RR")],["restore",t("Obnovit známou značku")]])}</span></div>
    <p data-status role="status"></p><p id="hrv-origin" class="callout"></p>
    <div id="hrv-ready" class="stack" hidden><div><h3>Vrcholy R a intervaly</h3>${canvas("hrv-r", t("Časové značky R a výukové EKG tam, kde je k dispozici"), "short")}</div>
    <div><h3>Tachogram</h3>${canvas("tachogram", t("Délka RR nebo NN v čase"))}</div>
    ${legend([[colors.blue,t("Pozorované R nebo surové RR")],[colors.accent,t("Použitelné NN")],[colors.alternate,t("Vynechaná, obnovená nebo ektopická značka")]])}
    <div id="nn-metrics"></div><div id="hrv-table"></div>
    <a class="action" href="#detekce">Zpět k detekci QRS</a></div></section>
    <section class="card" id="hrv-extra" hidden><h2>Geometrické a spektrální zobrazení</h2><div class="controls">
    ${select("hrv-chart", t("Graf"), [["hist",t("Histogram")],["poincare",t("Poincarého graf")],["spectrum",t("Welchovo spektrum")]])}</div>
    ${canvas("hrv-plot", t("Zvolený geometrický nebo spektrální výstup"))}<p id="hrv-plot-copy" class="source" aria-live="polite"></p></section>
    ${card(t("Co vychází z řady NN"), foot(hrvNotes) + details(t("Ruční příklad"), t("NN jsou 800, 850, 800 a 850 ms. Průměr je 825 ms. Výběrové SDNN = √(4 × 25² / 3) ≈ 28,87 ms. Všechny tři sousední rozdíly mají absolutní velikost 50 ms, takže RMSSD je 50 ms a NN50 je nula.")) +
    source(t('HRV, s. 2–47 · hrv_student.ipynb · Zápočet, s. 3 · <a href="https://doi.org/10.1161/01.cir.93.5.1043">Task Force</a>')))}</div>`;
  const $ = id => target.querySelector("#" + id);
  const input = $("hrv-source"), miss = $("miss-r"), treatment = $("rr-treatment");
  const carry = sessionStorage.getItem("dvk-hrv-source");
  if (carry) input.value = "detectors";
  let generation = 0, state;
  const examples = [800, 850, 800, 850];
  const emptyPlot = id => plot($(id), { series: [], x: [0, 1], y: [0, 1], xLabel: "", yLabel: "" });
  const chart = () => {
    if (!state) return;
    const id = $("hrv-chart").value;
    const { nn, stats, times, rr } = state;
    const values = nn.filter(Number.isFinite);
    const out = $("hrv-plot-copy");
    if (id === "spectrum") {
      if (input.value !== "long") {
        emptyPlot("hrv-plot");
        out.textContent = t("Pro spektrální pokus zvol pět minut syntetických NN. Krátký příklad i záznamy ze cvičení zde nemají dost dlouhý a doložený souvislý NN úsek.");
        return;
      }
      state.spectral ??= welch(rr, times);
      const { series, df, segments: windows } = state.spectral;
      const power = (min, max) => series.reduce((sum, value, i) => i * df >= min && i * df < max ? sum + value * df : sum, 0);
      const hf = power(.15, .4), lf = power(.04, .15), vlf = power(df, .04);
      const visible = series.slice(0, Math.ceil(.42 / df) + 1);
      plot($("hrv-plot"), { series: [{ values: visible, step: df }], x: [0, .42], y: [0, Math.max(...visible) * 1.12],
        xLabel: t("Frekvence [Hz]"), yLabel: "PSD [ms²/Hz]",
        bands: [{ from: 0, to: .04, color: "var(--chart-gold-band)" }, { from: .04, to: .15, color: "var(--chart-blue-band)" }, { from: .15, to: .4, color: "var(--chart-accent-band)" }] });
      out.textContent = t`Lineární interpolace 4 Hz, Hannovo okno 128 s, 50% překrytí, odečet průměru po oknech. Použito ${windows} oken, rozlišení ${fmt(df, 5)} Hz. LF ${number(lf," ms²")}, HF ${number(hf," ms²")}, orientační VLF ${number(vlf," ms²")}. Syntetické složky jsou blízko 0,10 a 0,24 Hz.`;
      return;
    }
    if (!values.length) {
      emptyPlot("hrv-plot");
      out.textContent = t("Pro tento graf zvol vstup s ověřenými nebo výukově známými NN.");
      return;
    }
    if (id === "poincare") {
      const range = bounds([values], .15);
      const xs = stats.pairs.map(([a]) => a), ys = stats.pairs.map(([,b]) => b);
      plot($("hrv-plot"), { series: [{ times: range, values: range, color: colors.gray, dashed: true },
        { times: xs, values: ys, dots: true }], x: range, y: range, xLabel: "NNₙ [ms]", yLabel: "NNₙ₊₁ [ms]" });
      out.textContent = t`${xs.length} platných dvojic · SD1 ${number(stats.sd1," ms")} · SD2 ${number(stats.sd2," ms")}. Stejné dvojice se v grafu překrývají.`;
      return;
    }
    const width = 7.8125;
    const min = Math.floor(Math.min(...values) / width) * width;
    const count = Math.floor((Math.max(...values) - min) / width) + 1;
    const bins = Array(count).fill(0);
    values.forEach(value => bins[Math.min(count - 1, Math.floor((value - min) / width))]++);
    const max = Math.max(...bins);
    const x = [min - width / 2, min + width * (count + .5)];
    const bar = Math.max(3, Math.min(22, ($("hrv-plot").clientWidth - 68) / (count + 1) * .87));
    plot($("hrv-plot"), { series: [{ start: min + width / 2, step: width, values: bins, bars: bar }], x, y: [0, max * 1.15], xLabel: "NN [ms]", yLabel: t("Počet") });
    out.textContent = t`Třída 7,8125 ms. Trojúhelníkový index ${values.length}/${max} = ${number(values.length / max)}. Na krátkém vzorku slouží k ověření principu. TINN je popsané v kartě metody.`;
  };
  const redraw = async () => {
    const request = ++generation;
    const type = input.value;
    $("miss-control").hidden = type !== "example";
    $("correct-control").hidden = type !== "example" || !miss.checked;
    const status = target.querySelector("[data-status]");
    status.hidden = true;
    try {
      let rr, original, origin, offset = 0, actual, observed = [], missing, ectopic, rejected = [];
      if (type === "example") {
        original = cumulative(examples);
        missing = miss.checked ? original[2] : undefined;
        rr = miss.checked ? [800, 1650, 850] : examples;
        observed = cumulative(rr);
        origin = t("Syntetická úloha se čtyřmi známými NN. Vynecháš-li prostřední R, spojí se intervaly 850 a 800 ms.");
        if (missing != null) rejected = [1];
      } else if (type === "ectopic") {
        rr = [800, 500, 1100, 850, 800, 825];
        observed = cumulative(rr);
        ectopic = observed[2];
        rejected = [1, 2];
        origin = t("Syntetický průběh se známou extrasystolou. Interval 500 ms končí ektopickým stahem a interval 1 100 ms jím začíná. Oba zůstávají v RR, oba se vyřadí z NN.");
      } else if (type === "long") {
        rr = longIntervals();
        observed = cumulative(rr);
        origin = t`Syntetické NN, ${fmt(observed.at(-1), 1)} s. Časování moduluje pomalá složka 0,10 Hz a rychlejší složka 0,24 Hz.`;
      } else if (type === "local") {
        status.textContent = t("Načítám rr.txt…"); status.hidden = false;
        rr = await dataFile("rr.json");
        observed = cumulative(rr);
        origin = t("rr.txt · 73 hodnot · 7,594 s při interpretaci v ms podle notebooku. Původ a normálnost jednotlivých stahů nejsou doložené. Graf ukazuje RR; údaje v tabulce dovolují kontrolu bez potvrzení NN.");
      } else {
        const key = carry && [...Object.keys(segments), "synth", "noisy"].includes(carry) ? carry : "noisy";
        status.textContent = t("Načítám výstup detektoru…"); status.hidden = false;
        const data = await dataFile(`qrs-${key}.json`);
        offset = segments[key]?.[1] ?? 0;
        observed = data.pan.map(index => index / 1000 + offset);
        rr = data.pan.slice(1).map((value, i) => value - data.pan[i]);
        actual = data.input;
        origin = t`Vstup z detekce QRS · ${segments[key]?.[0] ?? (key === "synth" ? t("syntetický čistý") : t("syntetický s rušením"))} · lokalizované značky Pan–Tompkins. Intervaly jsou kandidátní RR. K ověření porovnej chybějící či přebývající značky v laboratoři QRS.`;
      }
      if (!target.isConnected || request !== generation) return;
      status.hidden = true;
      $("hrv-ready").hidden = $("hrv-extra").hidden = false;
      $("hrv-origin").textContent = origin;
      let times = observed.slice(1), nn = rr.map(() => null);
      const verified = ["example", "long", "ectopic"].includes(type);
      const restored = verified && missing != null && treatment.value === "restore";
      if (verified) nn = rr.map((value, i) => rejected.includes(i) ? null : value);
      if (restored) {
        nn = examples;
        times = original.slice(1);
      }
      const stats = timeStats(nn);
      state = { nn, stats, times, rr };
      const duration = observed.at(-1) ?? 1;
      const x = [offset, Math.max(offset + .25, duration)];
      const rPlot = actual ? [{ values: actual, step: .001, start: offset, color: colors.gray }] : [];
      const marks = observed.map(time => ({ time, color: colors.blue, partial: type === "long", dash: false }));
      if (ectopic != null) marks.push({ time: ectopic, color: colors.alternate, label: t("Ektopický stah") });
      if (missing != null) marks.push({ time: missing, color: colors.alternate, label: restored ? t("Obnovená R") : t("Vynechaná R") });
      plot($("hrv-r"), { series: rPlot, x, y: actual ? bounds([actual]) : [-.2, 1], yLabel: actual ? t("Napětí [mV]") : t("Časové značky R"), yNames: actual ? undefined : {} ,
        events: marks });
      const rrTrace = { times: observed.slice(1), values: rr, dots: true, color: colors.blue };
      const nnTrace = { times, values: nn, dots: true };
      const showBoth = !verified || rejected.length > 0 && !restored;
      const rrValues = showBoth ? [rr, nn] : [nn];
      plot($("tachogram"), { series: showBoth ? [rrTrace, nnTrace] : [nnTrace], x, y: bounds(rrValues, .13), yLabel: t("Délka [ms]") });
      const rawStats = timeStats(rr);
      const rawMetric = treatment.value === "raw" && missing != null ? t`<p class="callout">Kdybys sloučený RR bez kontroly započítal, dostal bys SD ${number(rawStats.sdnn," ms")} a RMS sousedních rozdílů ${number(rawStats.rmssd," ms")}.</p>` : "";
      $("nn-metrics").innerHTML = verified ? rawMetric + `<div class="metrics">${metric(t("Platné NN"), stats.count)}
        ${metric("SDNN", number(stats.sdnn," ms"))}${metric("RMSSD", number(stats.rmssd," ms"))}
        ${metric("NN50", Number.isFinite(stats.pnn50) ? stats.nn50 : "—")}${metric("pNN50", pct(stats.pnn50))}</div>`
        : `<div class="metrics">${metric(t("Kandidátní RR"), rr.length)}${metric(t("Průměr RR"), number(average(rr)," ms"))}</div>`;
      const rows = restored ? nn.map((value, i) => [times[i], value, i === 1 || i === 2 ? t("Obnovený NN") : "NN"])
        : rr.map((value,i) => [observed[i + 1], value, nn[i] == null ? (rejected.includes(i) ? (ectopic != null ? t("Vyřazeno · souvisí s ektopií") : t("Vyřazeno · chybí R")) : t("RR · bez ověření NN")) : "NN"]);
      $("hrv-table").innerHTML = t`<details${type === "example" || type === "ectopic" ? " open" : ""}><summary>Intervaly a kontrola kvality</summary><div class="table-wrap"><table>
        <thead><tr><th>Konec [s]</th><th>Délka [ms]</th><th>Stav</th></tr></thead><tbody>
        ${rows.slice(0, 20).map(([time, value, state]) => `<tr><td>${fmt(time,3)}</td><td>${value}</td><td>${state}</td></tr>`).join("")}
        </tbody></table></div>${rows.length > 20 ? t("<p>Tabulka ukazuje prvních 20 intervalů; graf používá celý úsek.</p>") : ""}</details>`;
      chart();
    } catch (error) { if (request === generation) report(target, error); }
  };
  input.onchange = miss.onchange = treatment.onchange = redraw;
  $("hrv-chart").onchange = chart;
  await redraw();
}

const frameCount = 205, edge = 100, area = edge ** 2;
const shade = (value, stops) => {
  const position = Math.min(1, Math.max(0, value)) * (stops.length - 1);
  const first = Math.min(stops.length - 2, Math.floor(position));
  const weight = position - first;
  return stops[first].map((tone, i) => Math.round(tone * (1 - weight) + stops[first + 1][i] * weight));
};

export async function opticalLab(target) {
  target.innerHTML = t`<div class="stack"><div class="grid feature"><section class="card"><h2>Obraz izolovaného srdce</h2>
    <div class="controls">${select("image-mode", t("Vrstva"), [["raw",t("Měřená intenzita")],["delta",t("Změna proti snímku 1")],["activation",t("Odhad snímku aktivace")]])}</div>
    <p data-status role="status">Načítám data kamery…</p>
    <canvas id="opt-map" width="100" height="100" role="img" aria-label="Obraz naměřených hodnot optického mapování; pixel zvol kliknutím nebo poli souřadnic"></canvas>
    <label for="frame">Snímek <output id="frame-value"></output></label><input type="range" min="0" max="204" value="48" id="frame">
    <p class="source" id="opt-scale"></p></section>
    <section class="card"><h2>Stopa zvoleného pixelu</h2>
    <div class="controls pixel-controls"><label for="pixel-x">Sloupec x <input type="number" min="0" max="99" value="52" id="pixel-x"></label>
    <label for="pixel-y">Řádek y <input type="number" min="0" max="99" value="65" id="pixel-y"></label></div>
    ${canvas("opt-trace",t("Měřená intenzita zvoleného pixelu podle snímku"),"tall")}<p id="opt-coordinate" class="callout"></p>
    <p class="source">ap_potkan.mat · 100 × 100 pixelů · 205 snímků · orientace podle notebooku. Snímková frekvence v souboru ani notebooku není doložená, osa proto používá snímky.</p></section></div>
    ${card(t("Akční potenciály a povrchové EKG"), t`<div class="controls">${select("ap-choice",t("Model"), [["vent",t("Pracovní komorová buňka")],["node",t("Buňka SA uzlu")]])}</div>${canvas("ap-model",t("Schematický membránový potenciál"))}<p class="source">Výukové schéma membránového potenciálu. Měřený jas z kamery je zobrazen samostatně výše.</p>`)}
    <div class="grid">
    ${card(t("Dvě cesty perfuze"), t`<h3>Langendorff</h3><ol class="chain" aria-label="Tok při Langendorffově perfuzi"><li>Vstup do aorty</li><li>Koronární ústí</li><li>Koronární tepny</li></ol>
    <h3>Pracující srdce</h3><ol class="chain" aria-label="Tok do pracujícího srdce"><li>Vstup do levé síně</li><li>Levá komora</li><li>Aorta a zátěž</li></ol>
    <p class="source">Schéma toku roztoku · Optical mapping, sn. 17–20</p>`)}
    ${card(t("Pohyb ve stopě kamery"), t('<div class="controls"><label><input type="checkbox" id="opt-move" checked> Přidat pohyb</label></div>') + canvas("opt-artifact", t("Syntetická změna fluorescence s artefaktem pohybu"), "short") + t('<p class="source">Modrá křivka je výukový optický AP. Fialová zahrnuje změnu jasu při posunu tkáně v průběhu plató. Data z kamery výše zůstávají měřenou stopou.</p>'))}
    </div>
    ${card(t("Perfuze a optická cesta"), foot(opticalNotes) + source(t("Optical mapping, sn. 2–65 · ap_propagation_rat.ipynb · Zápočet, s. 4")))}</div>`;
  const $ = id => target.querySelector("#" + id);
  const model = () => {
    const node = $("ap-choice").value === "node";
    const times = node ? [0, 130, 290, 340, 395, 520, 580, 720, 870] : [0, 70, 72, 82, 100, 190, 245, 278, 325, 400];
    const values = node ? [-61,-55,-40,6,0,-46,-62,-55,-40] : [-87,-87,-65,30,11,5,-9,-62,-87,-87];
    plot($("ap-model"), { series: [{ times, values }], x: [0, times.at(-1)], y: [-105, 45], xLabel: t("Čas [ms]"), yLabel: t("Membránový potenciál [mV]") });
  };
  $("ap-choice").onchange = model;
  model();
  const optMotion = () => {
    const step = .002;
    const ideal = Array.from({length: 240}, (_, i) => {
      const t = i * step;
      return 1.7 / (1 + Math.exp(-((t - .085) / .008))) - 1.7 / (1 + Math.exp(-((t - .275) / .028)));
    });
    const motion = ideal.map((value, i) => value + .93 * Math.exp(-.5 * ((i * step - .19) / .029) ** 2));
    const series = [{values: ideal, step, color: colors.blue}];
    if ($("opt-move").checked) series.push({values: motion, step, color: colors.alternate});
    plot($("opt-artifact"), { series, x: [0, .48], y: [-.1, 2.9], yLabel: t("Relativní změna [%]") });
  };
  $("opt-move").onchange = optMotion;
  optMotion();
  try {
    const bytes = await dataFile("optical.i16", true);
    if (!target.isConnected) return;
    if (bytes.byteLength !== frameCount * area * 2) throw new Error(t("Nesouhlasí velikost optických dat"));
    const signal = new Int16Array(bytes);
    const activation = new Int16Array(area).fill(-1);
    for (let pixel = 0; pixel < area; pixel++) {
      if (signal[area + pixel] > -500) continue;
      let maxRise = 12;
      for (let frame = 25; frame <= 70; frame++) {
        const rise = signal[(frame + 2) * area + pixel] - signal[(frame - 2) * area + pixel];
        if (rise > maxRise) { maxRise = rise; activation[pixel] = frame; }
      }
    }
    const ctx = $("opt-map").getContext("2d");
    const frameSlider = $("frame");
    const pixelCoordinate = id => Math.max(0, Math.min(99, Math.round(Number($(id).value) || 0)));
    const update = () => {
      const frame = Number(frameSlider.value), x = pixelCoordinate("pixel-x"), y = pixelCoordinate("pixel-y");
      const mode = $("image-mode").value, pixel = y * edge + x;
      $("frame-value").value = frame;
      frameSlider.disabled = mode === "activation";
      const buffer = ctx.createImageData(edge, edge);
      const palette = mode === "activation" ? [[40,62,130],[147,100,177],[247,197,117]] :
        mode === "delta" ? [[82,113,212],[18,28,37],[255,145,118]] : [[18,28,37],[119,111,143],[247,238,250]];
      for (let i = 0; i < area; i++) {
        const base = signal[area + i], raw = signal[frame * area + i];
        const value = mode === "activation" ? (activation[i] - 25) / 45
          : mode === "delta" ? (raw - base + 80) / 160 : -raw / 1647;
        const rgb = mode === "activation" && activation[i] < 0 ? [18, 28, 37] : shade(value, palette);
        buffer.data.set([...rgb,255], i * 4);
      }
      ctx.putImageData(buffer, 0, 0);
      ctx.strokeStyle = "#ffffff";
      ctx.strokeRect(x - 2.5, y - 2.5, 5, 5);
      const trace = Array.from({length: frameCount}, (_, i) => signal[i * area + pixel]);
      const events = [{ time: frame, color: colors.gray, dash: false }];
      if (activation[pixel] >= 0) events.push({ time: activation[pixel], color: colors.gold, label: t("Odhad aktivace") });
      plot($("opt-trace"), { series: [{ values: trace }], x: [0, 204], y: bounds([trace]), xLabel: t("Snímek"), yLabel: t("Hodnota kamery [j.]"), events });
      $("opt-coordinate").textContent = t`Pixel [${x}, ${y}] · snímek ${frame} · hodnota ${trace[frame]} · ` +
        (activation[pixel] >= 0 ? t`výukový odhad aktivace ve snímku ${activation[pixel]}` : t("mimo odhadnutou oblast nebo pod prahem změny"));
      $("opt-scale").textContent = {
        raw: t("Hodnota kamery −1647 až 0. Světlejší barva odpovídá větší absolutní velikosti záporné hodnoty."),
        delta: t("Rozdíl −80 až +80 jednotek, krajní hodnoty jsou oříznuté. Modrá je pokles, růžová růst proti snímku s indexem 1."),
        activation: t("Modrá odpovídá dřívějšímu snímku, zlatá pozdějšímu (25–70). Odhad hledá nejstrmější kladnou změnu ve čtyřech snímcích v úseku prvního vzestupu. Tmavé pixely jsou maskované. Pohyb může odhad ovlivnit."),
      }[mode];
    };
    frameSlider.oninput = $("image-mode").onchange = $("pixel-x").oninput = $("pixel-y").oninput = update;
    $("opt-map").onclick = event => {
      const rect = event.currentTarget.getBoundingClientRect();
      $("pixel-x").value = Math.min(99, Math.floor((event.clientX - rect.left) / rect.width * 100));
      $("pixel-y").value = Math.min(99, Math.floor((event.clientY - rect.top) / rect.height * 100));
      update();
    };
    target.querySelector("[data-status]").hidden = true;
    update();
  } catch (error) { report(target, error); }
}

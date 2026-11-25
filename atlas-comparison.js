import { t } from "./i18n.js";
import { atlasNotes } from "./atlas-notes.js";
import { atlas, measureRhythm, sample, sinus } from "./rhythms.js";
import { canvas, colors, fmt, plot } from "./plot.js";

const plotY = [-1.25, 1.55];
const stroke = [colors.accent, colors.alternate];
const rowLabels = () => [t("P–P [ms]"), t("QRS–QRS [ms]"), t("PQ / PR [ms]"), t("QRS [ms]")];

function pairScenes(first, second) {
  const a = atlas[first], b = atlas[second];
  const duration = Math.max(a.duration, b.duration);
  const adaptSinus = (key, other) => key === "sinus"
    ? { ...atlas.sinus, events: sinus(Math.ceil(duration / .86) + 1), duration, leads: other.leads }
    : atlas[key];
  return [adaptSinus(first, b), adaptSinus(second, a)];
}

function rhythmMarks(scene) {
  return (scene.eventsMark ?? [[scene.focus, t("Studovaný stah")]])
    .map(([time, label], i) => ({ time, label, lane: i % 2, color: i ? colors.gold : colors.alternate }));
}

function tracePlot(target, id, scene, lead, x, index, annotate, center) {
  const isDetail = center !== undefined;
  const from = isDetail ? center + x[0] : x[0];
  const to = isDetail ? center + x[1] : Math.min(x[1], scene.duration);
  const delta = center ?? 0;
  const events = annotate ? rhythmMarks(scene).map(mark => ({ ...mark, time: mark.time - delta })) : [];
  const brackets = annotate && !isDetail ? (scene.brackets ?? []).map(([from, to, label]) => ({ from, to, label })) : [];
  const values = sample(scene.events, lead, from, to).map((value, i) => {
    const time = from + .002 * i;
    return time < 0 || time > scene.duration ? NaN : value;
  });
  plot(target.querySelector("#" + id), {
    series: [{ values, start: from - delta, step: .002, color: stroke[index] }],
    x, y: plotY, paper: true, events, brackets,
    ...(isDetail ? { xLabel: t("Čas od značky [s]") } : {}),
  });
}

function wavePanel(id, scene, lead) {
  const title = t`${scene.name} · svod ${lead}`;
  return `<div class="atlas-trace"><h3>${title}</h3>${canvas(id, title, "short")}</div>`;
}

const range = values => {
  if (!values.length) return "—";
  const min = Math.min(...values), max = Math.max(...values);
  return min === max ? fmt(min, 0) : fmt(min, 0) + "–" + fmt(max, 0);
};
const sequence = values => {
  const distinct = [...new Set(values)];
  return distinct.length > 4 ? range(values) : distinct.map(value => fmt(value, 0)).join(" · ") || "—";
};

function eventTable(measurement) {
  const moment = time => time === undefined ? "—" : fmt(time, 3);
  return t`<details class="atlas-events"><summary>Časy jednotlivých událostí</summary>
    <div class="table-wrap"><table>
    <thead><tr><th>Začátek P [s]</th><th>Začátek QRS [s]</th><th>PQ / PR [ms]</th></tr></thead>
    <tbody>${measurement.atrialRows.map(beat => `<tr><td>${moment(beat.p)}</td><td>${moment(beat.q)}</td><td>${beat.pr ?? "—"}</td></tr>`).join("")}
    ${measurement.otherQrs.map(time => `<tr><td>—</td><td>${moment(time)}</td><td>—</td></tr>`).join("")}</tbody>
    </table></div><p>P a QRS jsou spojeny jen tam, kde je v modelu doložený převod. Samostatné QRS jsou uvedeny dole.</p></details>`;
}

const guidance = [
  [["mobitz1", "mobitz2"], t("U obou vypadne QRS po pravidelné P. Porovnej řadu PQ před výpadkem a první PQ po něm: u Mobitz I se mění, u Mobitz II zůstávají stejná.")],
  [["sa2b", "mobitz2"], t("Najdi P v pauze. U SA bloku vypadne celý P–QRS–T, zatímco při AV bloku P pokračuje a může zůstat bez QRS.")],
  [["pac", "pvc"], t("Rozhoduje, co přišlo předčasně: změněná P s následným úzkým QRS, nebo přímo široký QRS bez kauzální P.")],
  [["rbbb", "lbbb"], t("V1 ukáže rozdíl mezi koncovým R′ u RBBB a převážně záporným QRS u LBBB. Ve V6 porovnej širokou koncovou S s širokou R.")],
  [["lafb", "lpfb"], t("Srovnej polaritu hlavní výchylky v aVL a aVF. Modely odrážejí opačný směr osy a oba mohou mít QRS kratší než 120 ms.")],
  [["wpw", "shortpr"], t("V obou ukázkách je krátké PQ. U WPW hledej pozvolný delta náběh a širší QRS, u druhého příkladu je náběh ostrý.")],
  [["av2to1", "av3"], t("U převodu 2:1 má každý převedený QRS stejné časování vůči P. U úplného bloku P a QRS běží nezávisle.")],
  [["bigeminy", "pvcCouplet"], t("U bigeminie se střídá běžný a předčasný QRS. U kupletu najdi dva předčasné široké komplexy bez normálního stahu mezi nimi.")],
];

function clinicalCard(key, scene, measurement) {
  const [criteria, pitfall] = atlasNotes[key];
  return t`<article class="atlas-analysis">
    <h3>${scene.name}</h3>
    <dl>
      <dt>Kam se podívat?</dt><dd>${scene.look}</dd>
      <dt>Co se změnilo?</dt><dd>${scene.change}</dd>
      <dt>Jak změna vznikla?</dt><dd>${scene.why}</dd>
      <dt>Měřitelné znaky</dt><dd>${criteria}</dd>
      <dt>Rozlišení a limity</dt><dd>${pitfall}</dd>
    </dl>
    ${eventTable(measurement)}
    <p class="source">Arytmologie, sn. ${scene.slides} · syntetická výuková rekonstrukce</p>
  </article>`;
}

export function renderAtlasPair(target, first, second, revealed) {
  const scenes = pairScenes(first, second);
  const [a, b] = scenes;
  const shared = a.leads.filter(lead => b.leads.includes(lead));
  const leadPairs = shared.length ? shared.map(lead => [lead, lead]) : [[a.leads[0], b.leads[0]]];
  const x = [0, Math.max(a.duration, b.duration)];
  const origin = target.querySelector("#atlas-origin");
  origin.textContent = shared.length
    ? t`Syntetické výukové průběhy · ${shared.join(t(" a "))} · společná časová osa a měřítko`
    : t`Syntetické výukové průběhy · každý příklad je v jiném svodu. Srovnávej časování; polarita a tvar závisí na svodu.`;
  if (a.duration !== b.duration) origin.textContent += " " + t("Kratší proužek končí dřív na společné ose.");

  const strips = target.querySelector("#strips");
  strips.innerHTML = leadPairs.map((leads, row) => `<div class="grid atlas-pair">
    ${wavePanel("case-" + row, a, leads[0])}
    ${wavePanel("ref-" + row, b, leads[1])}
  </div>`).join("");
  leadPairs.forEach(([leadA, leadB], row) => {
    tracePlot(target, "case-" + row, a, leadA, x, 0, revealed);
    tracePlot(target, "ref-" + row, b, leadB, x, 1, revealed);
  });

  const explanation = target.querySelector("#rhythm-explanation");
  explanation.hidden = !revealed;
  if (!revealed) return;

  const keys = [first, second];
  const leads = leadPairs[0];
  const measurements = scenes.map((scene, i) => measureRhythm(scene.events, scene.duration, leads[i]));
  const summaries = measurements.map(measurement => [
    range(measurement.pp), range(measurement.rr), sequence(measurement.pr), range(measurement.widths),
  ]);
  const tip = guidance.find(([ids]) => ids.includes(first) && ids.includes(second) && first !== second)?.[1];
  explanation.innerHTML = t`<h2>Rozbor průběhu</h2>
    ${tip ? `<p class="callout">${tip}</p>` : ""}
    <h3>Měření u obou příkladů</h3>
    <div class="table-wrap"><table class="atlas-metrics">
      <thead><tr><th>Interval</th><th scope="col">${a.name} · ${leads[0]}</th><th scope="col">${b.name} · ${leads[1]}</th></tr></thead>
      <tbody>${rowLabels().map((label, i) => `<tr><th scope="row">${label}</th><td>${summaries[0][i]}</td><td>${summaries[1][i]}</td></tr>`).join("")}</tbody>
    </table></div>
    <p class="source">Hodnoty vycházejí z časových značek modelu. Odstup komorových stahů se měří od začátku QRS k začátku QRS a zahrnuje i předčasné stahy a pauzy. PQ je uveden jen u převedených P. Pomlčka znamená, že údaj není k dispozici.</p>
    <h3 class="atlas-detail-heading">Detail vybraného místa</h3>
    <p class="muted">Nula značí zvýrazněné místo v každém příkladu. Oba detaily mají stejné měřítko.</p>
    <div class="grid atlas-pair">${wavePanel("zoom-case", a, leads[0])}${wavePanel("zoom-ref", b, leads[1])}</div>
    <div class="grid atlas-analysis-grid">
      ${clinicalCard(keys[0], a, measurements[0])}
      ${first === second ? "" : clinicalCard(keys[1], b, measurements[1])}
    </div>
    <p class="source"><a href="https://doi.org/10.1161/CIR.0000000000000628">ACC/AHA/HRS · AV blokády</a> · <a href="https://doi.org/10.1016/j.jacc.2008.12.013">AHA/ACCF/HRS · blokády ramének a fasciklů</a> · <a href="https://doi.org/10.1093/eurheartj/ehz467">ESC · preexcitace</a></p>`;
  scenes.forEach((scene, i) => {
    const key = keys[i];
    const otherFocus = scenes[1 - i].focus;
    const center = key === "sinus"
      ? scene.events.q.reduce((closest, beat) => Math.abs(beat.t - otherFocus) < Math.abs(closest.t - otherFocus) ? beat : closest).t
      : scene.focus;
    const focused = key === "sinus" ? { ...scene, focus: center } : scene;
    tracePlot(target, i ? "zoom-ref" : "zoom-case", focused, leads[i], [-.27, .57], i, true, center);
  });
}

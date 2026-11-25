import { t } from "./i18n.js";
const wave = (t, left, right, amplitude) => {
  if (t <= left || t >= right) return 0;
  return amplitude * Math.sin(Math.PI * (t - left) / (right - left)) ** 1.3;
};

const shapes = {
  normal: [[0, .024, -.13], [.017, .06, 1.11], [.053, .09, -.24]],
  normalV1: [[0, .034, .23], [.023, .088, -.72]],
  normalAVL: [[0, .032, -.13], [.025, .08, .48]],
  pvcAlt: [[0, .064, .23], [.041, .139, -1.10], [.115, .179, .43]],
  pvc: [[0, .056, -.35], [.027, .125, 1.25], [.095, .175, -.68]],
  rbbb1: [[0, .047, .34], [.032, .09, -.56], [.072, .148, 1.02]],
  rbbb6: [[0, .038, -.1], [.024, .072, .99], [.069, .15, -.51]],
  lbbb1: [[0, .034, .12], [.025, .155, -1.07]],
  lbbb6: [[0, .082, .83], [.064, .151, .92]],
  fascSide: [[0, .037, -.13], [.021, .093, .82]],
  fascDown: [[0, .034, .22], [.019, .094, -.79]],
  delta: [[0, .065, .40], [.044, .116, .91], [.112, .156, -.21]],
};

const baselineShape = { V1: "normalV1", aVL: "normalAVL" };
const beatShape = (event, lead) => event.shape?.[lead] ?? event.shape?.II ?? baselineShape[lead] ?? "normal";

export function ecg(t, events, lead = "II") {
  let value = 0;
  for (const event of events.p) {
    const start = event.t;
    value += wave(t, start, start + .09, (event.amp ?? .15) * (lead === "V1" ? .65 : 1));
  }
  for (const event of events.q) {
    const start = event.t;
    const type = beatShape(event, lead);
    for (const [left, right, amp] of shapes[type]) value += wave(t, start + left, start + right, amp);
    const tAmp = { pvc: -.31, pvcAlt: .32, rbbb1: -.24, lbbb6: -.27, lbbb1: .27, normalV1: .13, normalAVL: .12 }[type] ?? .28;
    const shift = ["pvc", "pvcAlt", "rbbb1", "rbbb6", "lbbb1", "lbbb6", "delta"].includes(type) ? .052 : 0;
    value += wave(t, start + .172 + shift, start + .36 + shift, tAmp);
  }
  return value;
}

export const sample = (events, lead, from, to, fs = 500) =>
  Array.from({ length: Math.round((to - from) * fs) + 1 }, (_, i) => ecg(from + i / fs, events, lead));

const sequence = (n, first = .31, period = .86) => Array.from({ length: n }, (_, i) => first + i * period);
const beats = (starts, prs, shapes = {}, amps = {}) => ({
  p: starts.map((t, i) => ({ t, amp: amps[i] })),
  q: starts.flatMap((t, i) => {
    const pr = Array.isArray(prs) ? prs[i] : prs;
    return pr == null ? [] : [{ t: t + pr, p: t, shape: shapes[i] }];
  }),
});
const fixed = sequence(7);
export const normalCycle = beats([.12], .16);
export const sinus = n => beats(sequence(n), .16);
const standardLeads = ["II"];
const pvc = { II: "pvc" };
const code = (name, group, slides, events, focus, look, change, why, extra = {}) =>
  ({ name, group, slides, events, focus, look, change, why, duration: 5.6, leads: standardLeads, ...extra });

export const atlas = {
  sinus: code(t("Sinusový rytmus"), t("Základ"), "2", beats(fixed, .16), 2.19,
    t("Najdi P před každým QRS a porovnej tři po sobě jdoucí cykly."),
    t("V proužcích je stejná pravidelnost. PQ je 160 ms a RR 860 ms."),
    t("Vzruch vzniká v SA uzlu, projde síněmi a obvyklou převodní cestou aktivuje komory.")),
  pvc: code(t("Komorová extrasystola"), t("Extrasystoly"), "20–23, 28–32",
    (() => {
      const events = beats(fixed, [.16, .16, null, .16, .16, .16, .16]);
      events.q.splice(2, 0, { t: 1.93, shape: pvc });
      return events;
    })(), 1.93, t("Porovnej QRS v 1,93 s s očekávaným sinusovým QRS ve 2,19 s."),
    t("Předčasný komplex trvá 175 ms. Před ním chybí příčinná P. Okolní sinusové QRS jsou od sebe 1,72 s, tedy 2 × běžné RR."),
    t("Komorový vzruch se šíří mimo běžný začátek aktivace přes převodní systém. V této variantě se sinusový čas nezmění."),
    { eventsMark: [[1.93, t("Časný QRS")], [2.19, t("Očekávaný QRS")]], brackets: [[1.33, 3.05, t("1 720 ms")]] }),
  mobitz1: code(t("AV blok II. stupně · Mobitz I"), t("AV blokády"), "49–54",
    beats(fixed, [.16, .22, .26, null, .16, .22, .26]), 2.89,
    t("Změř PQ u prvních tří převedených stahů. Podívej se za čtvrtou vlnu P."),
    t("PQ roste ze 160 přes 220 na 260 ms. Po čtvrté P QRS nepřichází. Následující stah má opět PQ 160 ms."),
    t("V modelu se AV převod postupně zpomaluje a jeden síňový vzruch se na komory nepřevede."),
    { eventsMark: [[2.89, t("Nepřevedená P")], [3.05, t("Oblast chybějícího QRS")]], brackets: [[.31, .47, ""], [1.17, 1.39, ""], [2.03, 2.29, ""]] }),
  pac: code(t("Síňová extrasystola"), t("Extrasystoly"), "4–13",
    beats([.31, 1.17, 1.81, 2.67, 3.53, 4.39, 5.25], .16, {}, { 2: -.19 }), 1.81,
    t("Najdi časnou obrácenou P a zkontroluj následující QRS."),
    t("P mění tvar i načasování. QRS zůstane úzký a další normální P přijde před původně očekávaným časem."),
    t("Ektopické ložisko aktivuje síně jiným směrem. V této ukázce přenastaví čas SA uzlu a ke komorám se převádí běžnou cestou.")),
  junction: code(t("Junkční extrasystola"), t("Extrasystoly"), "14–19",
    (() => {
      const events = beats([.31, 1.17, 2.78, 3.64, 4.50, 5.36], .16);
      events.q.splice(2, 0, { t: 1.97 });
      events.p.splice(2, 0, { t: 2.073, amp: -.17 });
      return events;
    })(), 1.97, t("Prohlédni úzký předčasný QRS a zápornou vlnu těsně za ním."),
    t("P v ukázce následuje až po začátku QRS."),
    t("Vzruch vzniká v AV junkci. Ke komorám jde obvyklou cestou, k síním se šíří zpětně. Podle časování může být záporná P před QRS, v něm i po něm.")),
  interpolated: code(t("Interpolovaná komorová extrasystola"), t("Extrasystoly"), "24–25",
    (() => { const e = beats(fixed, [.16, .16, .20, .16, .16, .16, .16]); e.q.splice(2, 0, { t: 1.76, shape: pvc }); return e; })(), 1.76,
    t("Porovnej rozestupy sinusových P kolem širokého QRS."), t("Předčasný QRS se vejde mezi dva sinusové stahy. Sinusové PP zůstává 860 ms."), t("Komorový vzruch vznikne mezi stahy. V modelu ovlivní délku dalšího AV převodu, zatímco SA uzel pokračuje.")),
  bigeminy: code(t("Komorová bigeminie"), t("Extrasystoly"), "24, 28–32",
    (() => { const e = beats(fixed, [.16, null, .16, null, .16, null, .16]); e.q.push(...[1.01, 2.73, 4.45].map(t => ({t, shape: pvc}))); return e; })(), 2.73,
    t("Sleduj střídání běžného a předčasného komplexu po celé délce."), t("Za každým normálním QRS přichází široký předčasný komplex."), t("Bigeminie popisuje opakující se dvojice. Trigeminie či kvadrigeminie označují skupiny po třech či čtyřech, zatímco kuplet a triplet označují dvě nebo tři extrasystoly za sebou.")),
  pacMulti: code(t("Síňové extrasystoly · různé tvary P"), t("Extrasystoly"), "10–13",
    beats([.31, 1.17, 1.81, 2.67, 3.26, 4.12, 4.98], .16, {}, { 2: -.17, 4: .065 }), 1.81,
    t("Vedle normálních P porovnej časné P v 1,81 a 3,26 s."), t("Dvě předčasné P mají odlišný tvar i znaménko, následující QRS zůstávají úzké."),
    t("Model ukazuje dvě různé výchozí polohy síňové aktivace. V praxi může viditelný tvar měnit také jiná poloha elektrody nebo překrytí s T."),
    { eventsMark: [[1.81, t("Časná P₁")], [3.26, t("Časná P₂")]] }),
  pvcReset: code(t("Komorová extrasystola · neúplná pauza"), t("Extrasystoly"), "23",
    (() => { const e = beats([.31, 1.17, 2.78, 3.64, 4.50, 5.36], .16); e.q.push({t: 1.90, shape: pvc}); e.p.splice(2, 0, {t: 2.20, amp: -.14}); return e; })(),
    1.90, t("Hledej široký QRS a menší obrácenou P za ním."), t("Normální QRS jsou od sebe 1,61 s, méně než 2 × běžný RR 860 ms."),
    t("Výukové schéma předpokládá zpětné vedení. Posunutím nového sinusového cyklu vůči původnímu harmonogramu může vzniknout neúplná kompenzační pauza.")),
  endDiastolic: code(t("Pozdní komorová extrasystola"), t("Extrasystoly"), "24, 26",
    (() => { const e = beats(fixed, [.16,.16,null,.16,.16,.16,.16]); e.q.push({ t: 2.132, shape: pvc }); return e; })(), 2.132,
    t("V detailu zkontroluj P ve 2,03 s a široký komplex krátce po ní."), t("P zůstává v sinusovém čase. QRS začíná o přibližně 60 ms dříve než běžný převedený QRS."),
    t("P a komorová extrasystola se v čase těsně potkají. P sama nedokazuje, že po ní viditelný QRS vznikl AV převodem."),
    { eventsMark: [[2.132, t("Časný široký QRS")], [2.19, t("Očekávaný QRS")]] }),
  ronT: code(t("Komorová extrasystola · R na T"), t("Extrasystoly"), "24, 27",
    (() => { const e = beats(fixed, [.16,.16,null,.16,.16,.16,.16]); e.q.push({ t: 1.575, shape: pvc }); return e; })(), 1.575,
    t("Srovnej oblast kolem 1,6 s s vlnou T referenčního stahu."), t("Předčasný široký komplex zasahuje do předchozí T, která v referenci končí kolem 1,69 s."),
    t("V modelu vznikne komorový vzruch už během předchozí repolarizace. Součet obou dějů změní výslednou křivku."),
    { eventsMark: [[1.575, t("Začátek časného QRS")]], brackets: [[1.502,1.69,t("T v referenci")]] }),
  pvcCouplet: code(t("Komorový kuplet · dva tvary"), t("Extrasystoly"), "28–32",
    (() => { const e = beats(fixed, [.16,.16,null,null,.16,.16,.16]); e.q.push({t:1.89,shape:pvc},{t:2.42,shape:{II:"pvcAlt"}}); return e; })(), 1.89,
    t("Najdi dva po sobě jdoucí časné široké QRS. Porovnej jejich tvar."), t("Oba komplexy jsou za sebou bez běžného převedeného stahu mezi nimi, jejich hlavní výchylky mají opačnou polaritu."),
    t("Kuplet popisuje počet extrasystol v řadě. Rozdíl tvaru ve stejném svodu ukazuje rozdíl ve směru aktivace, sám přesné ložisko neurčí."),
    { eventsMark: [[1.89, t("První extrasystola")],[2.42,t("Druhá extrasystola")]] }),
  sa1: code(t("SA blok I. stupně"), t("SA blokády"), "34–37", beats(fixed, .16), 2.03,
    t("Proužek porovnej s referencí a zobraz žebříček."), t("Časování vln je stejné. Zpoždění mezi SA impulzem a začátkem P je vidět pouze ve výukovém modelu."),
    t("Samotný impulz SA uzlu je pro povrchové EKG příliš malý. SA blok I. stupně z tohoto proužku samostatně neurčíš."), { sa: true }),
  sa2a: code(t("SA blok II. stupně · typ I"), t("SA blokády"), "38–41",
    beats([.31, 1.24, 2.12, 3.68, 4.61, 5.49], .16), 2.95,
    t("Změř PP před pauzou a velikost pauzy."), t("PP se zkrátí z 930 na 880 ms a následuje pauza 1,56 s. Vypadne celý cyklus."),
    t("V modelu se přírůstky zpoždění výstupu z SA uzlu postupně zmenšují, až se jeden impulz na síně nepřevede."), { sa: true, eventsMark: [[2.95, t("Chybí P–QRS–T")]] }),
  sa2b: code(t("SA blok II. stupně · typ II"), t("SA blokády"), "40–41",
    beats(fixed.filter((_, i) => i !== 3), .16), 2.89,
    t("Najdi chybějící celý cyklus a změř PP kolem pauzy."), t("Pauza je v ukázce 1,72 s, přesně dvojnásobek základního PP."),
    t("Jeden sinusový impulz se nedostane k síním. Podobný povrchový obraz má více možných mechanismů."), { sa: true, eventsMark: [[2.89, t("Chybí P–QRS–T")]] }),
  sa3: code(t("SA blok III. stupně · únik"), t("SA blokády"), "42–45",
    { p: [], q: sequence(4, .56, 1.32).map(t => ({ t })) }, 1.88,
    t("Hledej pomalejší, pravidelné QRS bez zřetelné předcházející P."), t("Podle schématu tvorbu komorového rytmu převzala AV junkce."),
    t("Povrchový proužek nedokáže rozlišit úplnou výstupní blokádu SA uzlu od zástavy tvorby sinusového impulzu."), { sa: true }),
  av1: code(t("AV blok I. stupně"), t("AV blokády"), "47–48", beats(fixed, .25), 2.03,
    t("Najdi začátek P i začátek nejbližšího QRS."), t("Všechna PQ mají 250 ms, každá P má odpovídající QRS."),
    t("Převod se zpomalí. Celý interval zahrnuje síňovou depolarizaci a vedení až k začátku aktivace komor.")),
  mobitz2: code(t("AV blok II. stupně · Mobitz II"), t("AV blokády"), "49–50, 54",
    beats(fixed, [.17, .17, .17, null, .17, .17, .17]), 2.89,
    t("Najdi P bez QRS a porovnej PQ sousedních převedených cyklů."), t("PQ zůstává v této ukázce 170 ms před výpadkem i po něm."),
    t("Některé síňové impulzy se nepřevedou. Fixní poměr 2:1 sám o sobě neumožní odlišit typ I a II."), { eventsMark: [[2.89, t("Nepřevedená P")], [3.05, t("Oblast chybějícího QRS")]] }),
  av2to1: code(t("AV blok II. stupně · převod 2:1"), t("AV blokády"), "49–55",
    beats(sequence(10), [.18, null, .18, null, .18, null, .18, null, .18, null]), 2.89,
    t("Po každé druhé P vyhledej QRS; vyznač místa bez komorové aktivace."), t("Převod se pravidelně střídá 1:0. Převedené stahy mají v ukázce PQ 180 ms."),
    t("Poměr 2:1 ponechává mezi výpadky jen jedno měřitelné PQ. Z této sekvence nelze stanovit typ Mobitz I nebo II."),
    { duration: 8.4, eventsMark: [[2.89,t("Nepřevedená P")], [3.05,t("Oblast chybějícího QRS")]] }),
  high: code(t("Pokročilý AV blok · 3:1"), t("AV blokády"), "55",
    beats(sequence(12), [.17, null, null, .17, null, null, .17, null, null, .17, null, null]), 3.75,
    t("Spočítej P mezi dvěma QRS."), t("Na tři síňové impulzy se převede jeden. Sleduj pravidelné P i pomalejší QRS."),
    t("Dva po sobě jdoucí vzruchy se ve znázorněném modelu nepřevedou."), { duration: 9.7, eventsMark: [[3.75, t("Bez QRS")], [4.61, t("Bez QRS")]] }),
  av3: code(t("AV blok III. stupně"), t("AV blokády"), "56–61",
    { p: sequence(10).map(t => ({ t })), q: sequence(5, .73, 1.62).map(t => ({ t, shape: pvc })) }, 2.35,
    t("Porovnej rozestupy PP a RR a měnící se polohu P vůči QRS."), t("Síně i komory mají vlastní pravidelný rytmus. Vzájemná poloha P a QRS se posouvá."),
    t("Síňové impulzy se nepřevádějí. V tomto schématu aktivuje komory pomalý únikový rytmus s širokým QRS."), { duration: 8.3 }),
  rbbb: code(t("Blok pravého raménka"), t("Nitrokomorové vedení"), "63–70",
    beats(fixed, .16, Object.fromEntries(fixed.map((_, i) => [i, { V1: "rbbb1", V6: "rbbb6" }]))), 2.19,
    t("Současně zkontroluj V1 a V6."), t("Ve V1 je výrazná terminální R′ a ve V6 široká koncová S. QRS trvá přibližně 150 ms."),
    t("Pravá komora se aktivuje později, protože k ní musí vzruch dojít z levé strany."), { leads: ["V1", "V6"] }),
  lbbb: code(t("Blok levého raménka"), t("Nitrokomorové vedení"), "71–78",
    beats(fixed, .16, Object.fromEntries(fixed.map((_, i) => [i, { V1: "lbbb1", V6: "lbbb6" }]))), 2.19,
    t("Porovnej široký převážně záporný QRS ve V1 a široký R ve V6."), t("Aktivace levé komory trvá déle a směry počátečních vektorů jsou odlišné od reference."),
    t("Vzruch přichází do levé komory se zpožděním z pravé strany."), { leads: ["V1", "V6"] }),
  lafb: code(t("Blok levého předního fasciklu"), t("Nitrokomorové vedení"), "79–80",
    beats(fixed, .16, Object.fromEntries(fixed.map((_, i) => [i, { aVL: "fascSide", aVF: "fascDown" }]))), 2.19,
    t("Sleduj současně vysoké R v aVL a hluboké S v aVF."), t("Model ukazuje odklon vektoru nahoru a doleva; QRS nemusí být široký jako u bloku celého raménka."),
    t("Aktivace levé komory začíná přes zadní fascikl. Samotný odklon osy má více příčin."), { leads: ["aVL", "aVF"] }),
  lpfb: code(t("Blok levého zadního fasciklu"), t("Nitrokomorové vedení"), "79–80",
    beats(fixed, .16, Object.fromEntries(fixed.map((_, i) => [i, { aVL: "fascDown", aVF: "fascSide" }]))), 2.19,
    t("Sleduj rS v aVL a qR v aVF."), t("Model ukazuje odklon vektoru směrem dolů a doprava."),
    t("Aktivace levé komory začíná přes přední fascikl. Posouzení vyžaduje vyloučit jiné příčiny pravé osy."), { leads: ["aVL", "aVF"] }),
  wpw: code(t("Komorová preexcitace · obraz WPW"), t("Preexcitace"), "81–84",
    beats(fixed, .095, Object.fromEntries(fixed.map((_, i) => [i, { II: "delta" }]))), 2.125,
    t("Srovnej začátek QRS s referencí a najdi pomalý náběh."),
    t("PQ se zkrátil na 95 ms, široký QRS začíná delta vlnou."),
    t("Část komor se aktivuje přídatnou spojkou dřív a zbytek běžným převodem. Termín syndrom vyžaduje klinický kontext.")),
  mahaim: code(t("Přídatná dráha typu Mahaim · schéma kurzu"), t("Preexcitace"), "85–86",
    beats(fixed, .16, Object.fromEntries(fixed.map((_, i) => [i, { II: "delta" }]))), 2.19,
    t("Porovnej delta náběh s běžnou délkou PQ."), t("Na výukové variantě zůstává PQ 160 ms a začátek QRS je pozvolný."),
    t("Atriofascikulární dráhy mívají dekrementální převod. V klidu může být preexcitace nenápadná a povrchový tvar sám dráhu neurčuje.")),
  shortpr: code(t("Krátké PQ bez delta vlny · historické LGL"), t("Preexcitace"), "87–88",
    beats(fixed, .095), 2.125, t("Najdi PQ kratší než 120 ms a porovnej náběh QRS."), t("PQ je 95 ms a QRS začíná stejně strmě jako v referenci."),
    t("LGL je historické označení popisu krátkého PQ a normálního QRS v souvislosti s tachykardií. Z tohoto obrazce nelze určit jednotný mechanismus."))
};

// The intervals are derived from the synthetic event model, not inferred from pixels.
export function measureRhythm(events, duration, lead) {
  const order = (a, b) => a.t - b.t;
  const p = events.p.filter(beat => beat.t < duration).sort(order);
  const q = events.q.filter(beat => beat.t < duration).sort(order);
  const ms = seconds => Math.round(seconds * 1000);
  const spacing = beats => beats.slice(1).map((beat, i) => ms(beat.t - beats[i].t));
  const atrialRows = p.map(beat => {
    const conduction = q.find(qrs => qrs.p === beat.t);
    return { p: beat.t, q: conduction?.t, pr: conduction && ms(conduction.t - beat.t) };
  });
  return {
    pp: spacing(p), rr: spacing(q), pr: atrialRows.flatMap(beat => beat.pr === undefined ? [] : [beat.pr]),
    widths: q.map(beat => ms(Math.max(...shapes[beatShape(beat, lead)].map(([, end]) => end)))),
    atrialRows,
    otherQrs: q.filter(beat => beat.p === undefined).map(beat => beat.t),
  };
}

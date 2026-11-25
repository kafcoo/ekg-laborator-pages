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

export function ecg(t, events, lead = "II") {
  let value = 0;
  for (const event of events.p) {
    const start = event.t;
    value += wave(t, start, start + .09, (event.amp ?? .15) * (lead === "V1" ? .65 : 1));
  }
  for (const event of events.q) {
    const start = event.t;
    const type = event.shape?.[lead] ?? event.shape?.II ?? ({ V1: "normalV1", aVL: "normalAVL" }[lead] ?? "normal");
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
  sinus: code("Sinusový rytmus", "Základ", "2", beats(fixed, .16), 2.19,
    "Najdi P před každým QRS a porovnej tři po sobě jdoucí cykly.",
    "V proužcích je stejná pravidelnost. PQ je 160 ms a RR 860 ms.",
    "Vzruch vzniká v SA uzlu, projde síněmi a obvyklou převodní cestou aktivuje komory."),
  pvc: code("Komorová extrasystola", "Extrasystoly", "20–23, 28–32",
    (() => {
      const events = beats(fixed, [.16, .16, null, .16, .16, .16, .16]);
      events.q.splice(2, 0, { t: 1.93, shape: pvc });
      return events;
    })(), 1.93, "Porovnej QRS v 1,93 s s očekávaným sinusovým QRS ve 2,19 s.",
    "Předčasný komplex trvá 175 ms. Před ním chybí příčinná P. Okolní sinusové QRS jsou od sebe 1,72 s, tedy 2 × běžné RR.",
    "Komorový vzruch se šíří mimo běžný začátek aktivace přes převodní systém. V této variantě se sinusový čas nezmění.",
    { eventsMark: [[1.93, "Časný QRS"], [2.19, "Očekávaný QRS"]], brackets: [[1.33, 3.05, "1 720 ms"]] }),
  mobitz1: code("AV blok II. stupně · Mobitz I", "AV blokády", "49–54",
    beats(fixed, [.16, .22, .26, null, .16, .22, .26]), 2.89,
    "Změř PQ u prvních tří převedených stahů. Podívej se za čtvrtou vlnu P.",
    "PQ roste ze 160 přes 220 na 260 ms. Po čtvrté P QRS nepřichází. Následující stah má opět PQ 160 ms.",
    "V modelu se AV převod postupně zpomaluje a jeden síňový vzruch se na komory nepřevede.",
    { eventsMark: [[2.89, "Nepřevedená P"], [3.05, "QRS podle reference"]], brackets: [[.31, .47, ""], [1.17, 1.39, ""], [2.03, 2.29, ""]] }),
  pac: code("Síňová extrasystola", "Extrasystoly", "4–13",
    beats([.31, 1.17, 1.81, 2.67, 3.53, 4.39, 5.25], .16, {}, { 2: -.19 }), 1.81,
    "Najdi časnou obrácenou P a zkontroluj následující QRS.",
    "P mění tvar i načasování. QRS zůstane úzký a další normální P přijde před původně očekávaným časem.",
    "Ektopické ložisko aktivuje síně jiným směrem. V této ukázce přenastaví čas SA uzlu a ke komorám se převádí běžnou cestou."),
  junction: code("Junkční extrasystola", "Extrasystoly", "14–19",
    (() => {
      const events = beats([.31, 1.17, 2.78, 3.64, 4.50, 5.36], .16);
      events.q.splice(2, 0, { t: 1.97 });
      events.p.splice(2, 0, { t: 2.073, amp: -.17 });
      return events;
    })(), 1.97, "Prohlédni úzký předčasný QRS a zápornou vlnu těsně za ním.",
    "P v ukázce následuje až po začátku QRS.",
    "Vzruch vzniká v AV junkci. Ke komorám jde obvyklou cestou, k síním se šíří zpětně. Podle časování může být záporná P před QRS, v něm i po něm."),
  interpolated: code("Interpolovaná komorová extrasystola", "Extrasystoly", "24–25",
    (() => { const e = beats(fixed, [.16, .16, .20, .16, .16, .16, .16]); e.q.splice(2, 0, { t: 1.76, shape: pvc }); return e; })(), 1.76,
    "Porovnej rozestupy sinusových P kolem širokého QRS.", "Předčasný QRS se vejde mezi dva sinusové stahy. Sinusové PP zůstává 860 ms.", "Komorový vzruch vznikne mezi stahy. V modelu ovlivní délku dalšího AV převodu, zatímco SA uzel pokračuje."),
  bigeminy: code("Komorová bigeminie", "Extrasystoly", "24, 28–32",
    (() => { const e = beats(fixed, [.16, null, .16, null, .16, null, .16]); e.q.push(...[1.01, 2.73, 4.45].map(t => ({t, shape: pvc}))); return e; })(), 2.73,
    "Sleduj střídání běžného a předčasného komplexu po celé délce.", "Za každým normálním QRS přichází široký předčasný komplex.", "Bigeminie popisuje opakující se dvojice. Trigeminie či kvadrigeminie označují skupiny po třech či čtyřech, zatímco kuplet a triplet označují dvě nebo tři extrasystoly za sebou."),
  pacMulti: code("Síňové extrasystoly · různé tvary P", "Extrasystoly", "10–13",
    beats([.31, 1.17, 1.81, 2.67, 3.26, 4.12, 4.98], .16, {}, { 2: -.17, 4: .065 }), 1.81,
    "Vedle normálních P porovnej časné P v 1,81 a 3,26 s.", "Dvě předčasné P mají odlišný tvar i znaménko, následující QRS zůstávají úzké.",
    "Model ukazuje dvě různé výchozí polohy síňové aktivace. V praxi může viditelný tvar měnit také jiná poloha elektrody nebo překrytí s T.",
    { eventsMark: [[1.81, "Časná P₁"], [3.26, "Časná P₂"]] }),
  pvcReset: code("Komorová extrasystola · neúplná pauza", "Extrasystoly", "23",
    (() => { const e = beats([.31, 1.17, 2.78, 3.64, 4.50, 5.36], .16); e.q.push({t: 1.90, shape: pvc}); e.p.splice(2, 0, {t: 2.20, amp: -.14}); return e; })(),
    1.90, "Hledej široký QRS a menší obrácenou P za ním.", "Normální QRS jsou od sebe 1,61 s, méně než 2 × běžný RR 860 ms.",
    "Výukové schéma předpokládá zpětné vedení. Posunutím nového sinusového cyklu vůči původnímu harmonogramu může vzniknout neúplná kompenzační pauza."),
  endDiastolic: code("Pozdní komorová extrasystola", "Extrasystoly", "24, 26",
    (() => { const e = beats(fixed, [.16,.16,null,.16,.16,.16,.16]); e.q.push({ t: 2.132, shape: pvc }); return e; })(), 2.132,
    "V detailu zkontroluj P ve 2,03 s a široký komplex krátce po ní.", "P zůstává v sinusovém čase. QRS začíná o přibližně 60 ms dříve než běžný převedený QRS.",
    "P a komorová extrasystola se v čase těsně potkají. P sama nedokazuje, že po ní viditelný QRS vznikl AV převodem.",
    { eventsMark: [[2.132, "Časný široký QRS"], [2.19, "Očekávaný QRS"]] }),
  ronT: code("Komorová extrasystola · R na T", "Extrasystoly", "24, 27",
    (() => { const e = beats(fixed, [.16,.16,null,.16,.16,.16,.16]); e.q.push({ t: 1.575, shape: pvc }); return e; })(), 1.575,
    "Srovnej oblast kolem 1,6 s s vlnou T referenčního stahu.", "Předčasný široký komplex zasahuje do předchozí T, která v referenci končí kolem 1,69 s.",
    "V modelu vznikne komorový vzruch už během předchozí repolarizace. Součet obou dějů změní výslednou křivku.",
    { eventsMark: [[1.575, "Začátek časného QRS"]], brackets: [[1.502,1.69,"T v referenci"]] }),
  pvcCouplet: code("Komorový kuplet · dva tvary", "Extrasystoly", "28–32",
    (() => { const e = beats(fixed, [.16,.16,null,null,.16,.16,.16]); e.q.push({t:1.89,shape:pvc},{t:2.42,shape:{II:"pvcAlt"}}); return e; })(), 1.89,
    "Najdi dva po sobě jdoucí časné široké QRS. Porovnej jejich tvar.", "Oba komplexy jsou za sebou bez běžného převedeného stahu mezi nimi, jejich hlavní výchylky mají opačnou polaritu.",
    "Kuplet popisuje počet extrasystol v řadě. Rozdíl tvaru ve stejném svodu ukazuje rozdíl ve směru aktivace, sám přesné ložisko neurčí.",
    { eventsMark: [[1.89, "První extrasystola"],[2.42,"Druhá extrasystola"]] }),
  sa1: code("SA blok I. stupně", "SA blokády", "34–37", beats(fixed, .16), 2.03,
    "Proužek porovnej s referencí a zobraz žebříček.", "Časování vln je stejné. Zpoždění mezi SA impulzem a začátkem P je vidět pouze ve výukovém modelu.",
    "Samotný impulz SA uzlu je pro povrchové EKG příliš malý. SA blok I. stupně z tohoto proužku samostatně neurčíš.", { sa: true }),
  sa2a: code("SA blok II. stupně · typ I", "SA blokády", "38–41",
    beats([.31, 1.24, 2.12, 3.68, 4.61, 5.49], .16), 2.95,
    "Změř PP před pauzou a velikost pauzy.", "PP se zkrátí z 930 na 880 ms a následuje pauza 1,56 s. Vypadne celý cyklus.",
    "V modelu se přírůstky zpoždění výstupu z SA uzlu postupně zmenšují, až se jeden impulz na síně nepřevede.", { sa: true, eventsMark: [[2.95, "Chybí P–QRS–T"]] }),
  sa2b: code("SA blok II. stupně · typ II", "SA blokády", "40–41",
    beats(fixed.filter((_, i) => i !== 3), .16), 2.89,
    "Najdi chybějící celý cyklus a změř PP kolem pauzy.", "Pauza je v ukázce 1,72 s, přesně dvojnásobek základního PP.",
    "Jeden sinusový impulz se nedostane k síním. Podobný povrchový obraz má více možných mechanismů.", { sa: true, eventsMark: [[2.89, "Chybí P–QRS–T"]] }),
  sa3: code("SA blok III. stupně · únik", "SA blokády", "42–45",
    { p: [], q: sequence(4, .56, 1.32).map(t => ({ t })) }, 1.88,
    "Hledej pomalejší, pravidelné QRS bez zřetelné předcházející P.", "Podle schématu tvorbu komorového rytmu převzala AV junkce.",
    "Povrchový proužek nedokáže rozlišit úplnou výstupní blokádu SA uzlu od zástavy tvorby sinusového impulzu.", { sa: true }),
  av1: code("AV blok I. stupně", "AV blokády", "47–48", beats(fixed, .25), 2.03,
    "Najdi začátek P i začátek nejbližšího QRS.", "Všechna PQ mají 250 ms, každá P má odpovídající QRS.",
    "Převod se zpomalí. Celý interval zahrnuje síňovou depolarizaci a vedení až k začátku aktivace komor."),
  mobitz2: code("AV blok II. stupně · Mobitz II", "AV blokády", "49–50, 54",
    beats(fixed, [.17, .17, .17, null, .17, .17, .17]), 2.89,
    "Najdi P bez QRS a porovnej PQ sousedních převedených cyklů.", "PQ zůstává v této ukázce 170 ms před výpadkem i po něm.",
    "Některé síňové impulzy se nepřevedou. Fixní poměr 2:1 sám o sobě neumožní odlišit typ I a II.", { eventsMark: [[2.89, "Nepřevedená P"], [3.05, "QRS podle reference"]] }),
  av2to1: code("AV blok II. stupně · převod 2:1", "AV blokády", "49–55",
    beats(sequence(10), [.18, null, .18, null, .18, null, .18, null, .18, null]), 2.89,
    "Po každé druhé P vyhledej QRS; vyznač místa bez komorové aktivace.", "Převod se pravidelně střídá 1:0. Převedené stahy mají v ukázce PQ 180 ms.",
    "Poměr 2:1 ponechává mezi výpadky jen jedno měřitelné PQ. Z této sekvence nelze stanovit typ Mobitz I nebo II.",
    { duration: 8.4, eventsMark: [[2.89,"Nepřevedená P"], [3.05,"QRS podle reference"]] }),
  high: code("Pokročilý AV blok · 3:1", "AV blokády", "55",
    beats(sequence(12), [.17, null, null, .17, null, null, .17, null, null, .17, null, null]), 3.75,
    "Spočítej P mezi dvěma QRS.", "Na tři síňové impulzy se převede jeden. Sleduj pravidelné P i pomalejší QRS.",
    "Dva po sobě jdoucí vzruchy se ve znázorněném modelu nepřevedou.", { duration: 9.7, eventsMark: [[3.75, "Bez QRS"], [4.61, "Bez QRS"]] }),
  av3: code("AV blok III. stupně", "AV blokády", "56–61",
    { p: sequence(10).map(t => ({ t })), q: sequence(5, .73, 1.62).map(t => ({ t, shape: pvc })) }, 2.35,
    "Porovnej rozestupy PP a RR a měnící se polohu P vůči QRS.", "Síně i komory mají vlastní pravidelný rytmus. Vzájemná poloha P a QRS se posouvá.",
    "Síňové impulzy se nepřevádějí. V tomto schématu aktivuje komory pomalý únikový rytmus s širokým QRS.", { duration: 8.3 }),
  rbbb: code("Blok pravého raménka", "Nitrokomorové vedení", "63–70",
    beats(fixed, .16, Object.fromEntries(fixed.map((_, i) => [i, { V1: "rbbb1", V6: "rbbb6" }]))), 2.19,
    "Současně zkontroluj V1 a V6.", "Ve V1 je výrazná terminální R′ a ve V6 široká koncová S. QRS trvá přibližně 150 ms.",
    "Pravá komora se aktivuje později, protože k ní musí vzruch dojít z levé strany.", { leads: ["V1", "V6"] }),
  lbbb: code("Blok levého raménka", "Nitrokomorové vedení", "71–78",
    beats(fixed, .16, Object.fromEntries(fixed.map((_, i) => [i, { V1: "lbbb1", V6: "lbbb6" }]))), 2.19,
    "Porovnej široký převážně záporný QRS ve V1 a široký R ve V6.", "Aktivace levé komory trvá déle a směry počátečních vektorů jsou odlišné od reference.",
    "Vzruch přichází do levé komory se zpožděním z pravé strany.", { leads: ["V1", "V6"] }),
  lafb: code("Blok levého předního fasciklu", "Nitrokomorové vedení", "79–80",
    beats(fixed, .16, Object.fromEntries(fixed.map((_, i) => [i, { aVL: "fascSide", aVF: "fascDown" }]))), 2.19,
    "Sleduj současně vysoké R v aVL a hluboké S v aVF.", "Model ukazuje odklon vektoru nahoru a doleva; QRS nemusí být široký jako u bloku celého raménka.",
    "Aktivace levé komory začíná přes zadní fascikl. Samotný odklon osy má více příčin.", { leads: ["aVL", "aVF"] }),
  lpfb: code("Blok levého zadního fasciklu", "Nitrokomorové vedení", "79–80",
    beats(fixed, .16, Object.fromEntries(fixed.map((_, i) => [i, { aVL: "fascDown", aVF: "fascSide" }]))), 2.19,
    "Sleduj rS v aVL a qR v aVF.", "Model ukazuje odklon vektoru směrem dolů a doprava.",
    "Aktivace levé komory začíná přes přední fascikl. Posouzení vyžaduje vyloučit jiné příčiny pravé osy.", { leads: ["aVL", "aVF"] }),
  wpw: code("Komorová preexcitace · obraz WPW", "Preexcitace", "81–84",
    beats(fixed, .095, Object.fromEntries(fixed.map((_, i) => [i, { II: "delta" }]))), 2.125,
    "Srovnej začátek QRS s referencí a najdi pomalý náběh.",
    "PQ se zkrátil na 95 ms, široký QRS začíná delta vlnou.",
    "Část komor se aktivuje přídatnou spojkou dřív a zbytek běžným převodem. Termín syndrom vyžaduje klinický kontext."),
  mahaim: code("Přídatná dráha typu Mahaim · schéma kurzu", "Preexcitace", "85–86",
    beats(fixed, .16, Object.fromEntries(fixed.map((_, i) => [i, { II: "delta" }]))), 2.19,
    "Porovnej delta náběh s běžnou délkou PQ.", "Na výukové variantě zůstává PQ 160 ms a začátek QRS je pozvolný.",
    "Atriofascikulární dráhy mívají dekrementální převod. V klidu může být preexcitace nenápadná a povrchový tvar sám dráhu neurčuje."),
  shortpr: code("Krátké PQ bez delta vlny · historické LGL", "Preexcitace", "87–88",
    beats(fixed, .095), 2.125, "Najdi PQ kratší než 120 ms a porovnej náběh QRS.", "PQ je 95 ms a QRS začíná stejně strmě jako v referenci.",
    "LGL je historické označení popisu krátkého PQ a normálního QRS v souvislosti s tachykardií. Z tohoto obrazce nelze určit jednotný mechanismus.")
};

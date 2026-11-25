import { t } from "./i18n.js";

export const atlasNotes = {
  sinus: [
    t("Zkontroluj pořadí P → QRS → T a převod 1:1. V tomto modelu jsou PP i RR 860 ms, což odpovídá asi 70 stahům za minutu."),
    t("Sinusový původ podporuje pravidelná P s očekávanou polaritou ve zvolených svodech. Fyziologická respirační variabilita může měnit PP i RR."),
  ],
  pvc: [
    t("Navazovací interval mezi předchozím sinusovým QRS a extrasystolou je 600 ms. Samotný QRS zde měří 175 ms a dvě okolní sinusové aktivace dělí 1 720 ms."),
    t("Typickou trojicí je předčasnost, široká odlišná morfologie a chybějící kauzální P. Široký předčasný QRS může vzniknout také supraventrikulárním stahem s aberantním vedením; zkontroluj P, časování a další svody."),
  ],
  mobitz1: [
    t("Sleduj celé Wenckebachovo seskupení: 160 → 220 → 260 ms, nepřevedená P a nový PQ 160 ms. P v tomto modelu zachovávají pravidelný rozestup."),
    t("Přírůstky PQ se nemusejí chovat vždy učebnicově. Při čistě 2:1 převodu nelze změřit dvě po sobě jdoucí převedené P, takže z tohoto úseku typ bezpečně neurčíš."),
  ],
  pac: [
    t("Předčasná P přijde v 1,81 s místo očekávaných 2,03 s. V modelu se převádí s PQ 160 ms, QRS je proto načasovaný k časné P a zůstává úzký."),
    t("Časná P se může schovat do T, deformovat ji nebo se vůbec nepřevést. Nepřevedená síňová extrasystola pak může připomínat pauzu při AV bloku."),
  ],
  junction: [
    t("Úzký QRS začíná v 1,97 s. Retrográdní P vzniká asi 103 ms po jeho začátku a v tomto svodu má zápornou polaritu."),
    t("Hlavní vodítko je vztah P k časnému QRS. Retrográdní P může splynout s QRS nebo mu předcházet s krátkým PQ; při nejasné P zkontroluj další svody."),
  ],
  interpolated: [
    t("Komorový komplex se vloží do běžného PP cyklu. Předčasný QRS je široký, ale další sinusová P přijde podle plánu; PQ následujícího převedeného stahu se zde prodlouží na 200 ms."),
    t("Interpolaci ověř na ose P a na pokračování sinusového rytmu. Délka PQ po extrasystole může záviset na skrytém zpětném průniku do převodního systému."),
  ],
  bigeminy: [
    t("Na proužku se opakuje dvojice normální stah–komorová extrasystola. RR se proto střídá mezi krátkým navazovacím intervalem a delším intervalem k dalšímu sinusovému stahu."),
    t("Bigeminie popisuje rytmický vzorec, zatímco komorový původ odvozujeme z morfologie a vztahu k P. Kuplet naopak obsahuje dvě extrasystoly po sobě."),
  ],
  pacMulti: [
    t("Porovnej časné P ve stejném svodu: první je záporná, druhá menší kladná. Obě mají v modelu stejný PQ a úzký QRS."),
    t("Různé tvary podporují různé směry síňové aktivace. Přečti celý proužek a zkontroluj, jestli odlišná P nesplývá s předchozí T."),
  ],
  pvcReset: [
    t("Okolní sinusové QRS dělí 1 610 ms místo 1 720 ms. Menší záporná P v 2,20 s je v modelu projevem retrográdní aktivace síní."),
    t("Úplnost pauzy posuzuj vůči pravidelnému rytmu před extrasystolou. Samotný kratší interval nedokazuje, že se impulz skutečně vrátil až k sinusovému uzlu."),
  ],
  endDiastolic: [
    t("V tomto detailu je P na sinusovém harmonogramu, ale široký QRS začíná dříve než očekávaný převod. Náhodná blízkost obou událostí může připomínat krátké PQ."),
    t("Srovnej morfologii s běžnými QRS i čas předchozích P. Předčasný komorový stah může mít při současné aktivaci běžnou cestou i fúzní tvar."),
  ],
  ronT: [
    t("Začátek širokého QRS je v 1,575 s, zatímco T předchozího stahu v referenci končí v 1,69 s. Překryv je tedy přímo vidět v časování."),
    t("R na T popisuje načasování komorové extrasystoly do repolarizace předchozího stahu. Jeho význam závisí i na klinickém kontextu a vlastnostech repolarizace."),
  ],
  pvcCouplet: [
    t("První široký komplex má hlavní kladnou výchylku, druhý zápornou. Jejich začátky jsou od sebe 530 ms a mezi nimi není běžný převedený stah."),
    t("Odlišná morfologie může vzniknout jiným ohniskem, jiným vedením nebo fúzí. Dvojice se na rozdíl od bigeminie střídání s normálním stahem netýká."),
  ],
  sa1: [
    t("V modelu se prodlouží interval od výboje SA uzlu k začátku síňové aktivace. Povrchový záznam ale začíná měřit až P, takže tento interval na něm nezměříš."),
    t("Porovnej stejný proužek se sinusovým rytmem a pak zapni žebříček. Rozdíl v žebříčku představuje předpokládaný mechanismus, nikoli informaci skrytou v běžné křivce."),
  ],
  sa2a: [
    t("Před pauzou se PP zkracuje (930 → 880 ms); mezera 1 560 ms je kratší než dva bezprostředně předchozí PP cykly. Po pauze se sekvence v modelu opakuje."),
    t("Porovnej PP, ne jen RR. U AV Wenckebachovy periody síňové P pokračují, ale prodlužuje se PQ a po jedné P chybí QRS."),
  ],
  sa2b: [
    t("P–QRS–T vypadnou společně a následující P se v modelu vrací ve správné fázi, přesně po dvou běžných PP."),
    t("Pauzu mohou napodobit sinusová zástava nebo skrytá nepřevedená časná P v předchozí T. U AV bloku naopak hledej P uvnitř pauzy."),
  ],
  sa3: [
    t("Úzké QRS v modelu přicházejí po 1 320 ms, tedy asi 45/min. Síňový sinusový výboj a blok jsou vyznačené jen jako model v žebříčku."),
    t("Z pomalého úzkého únikového rytmu lze popsat pravděpodobný náhradní zdroj. Odlišení kompletního výstupního bloku SA uzlu a sinusové zástavy ze samotného povrchového proužku není spolehlivé."),
  ],
  av1: [
    t("V dospělém EKG je orientační hranice prodlouženého PQ nad 200 ms. Zde je PQ 250 ms a převod zachovává 1:1; žádná P nevypadne."),
    t("Dlouhé PQ samo o sobě neumístí zpoždění do konkrétní struktury. Sleduj obě hrany intervalu, od začátku P po první odchylku QRS."),
  ],
  mobitz2: [
    t("P v tomto modelu běží pravidelně a PQ převedených stahů zůstává 170 ms také po pauze. Po jedné včasné P chybí QRS bez předchozího prodlužování PQ."),
    t("Pro rozlišení potřebuješ převedené stahy před blokem i po něm a ověřit, že blokovaná P nepřišla předčasně. Čistý převod 2:1 neukazuje posloupnost potřebnou ke klasifikaci."),
  ],
  av2to1: [
    t("Na dva pravidelné síňové impulzy připadá jeden QRS. Zde je PP 860 ms a RR 1 720 ms, takže komorová frekvence je polovinou síňové."),
    t("Převod 2:1 je popis poměru. Samotná šířka QRS ani pevné PQ převedených stahů spolehlivě nerozliší Mobitz I a II."),
  ],
  high: [
    t("V modelu opakovaně zůstávají dvě po sobě jdoucí P bez QRS. Každá třetí P se převádí s PQ 170 ms, takže vztah mezi P a QRS je stále dohledatelný."),
    t("Od kompletního AV bloku odlišuj přítomnost některých skutečně převedených stahů, nikoli jen pomalou frekvenci."),
  ],
  av3: [
    t("PP je 860 ms a RR 1 620 ms. P v průběhu proužku vůči QRS posouvají fázi; zdánlivý PQ se mění a v modelu není žádný převod P → QRS."),
    t("AV disociace je popis vztahu, který může vzniknout i jinak než úplným blokem. V tomto příkladu jsou komory pomalejší a žádná P systematicky nespouští QRS."),
  ],
  rbbb: [
    t("U úplného RBBB u dospělého je QRS nejméně 120 ms s typickou pozdní pravostrannou aktivací. Model ukazuje koncovou R′ ve V1 a širokou koncovou S ve V6."),
    t("Široký QRS sám nerozliší blok raménka, preexcitaci nebo komorový stah. Sleduj hlavně koncovou morfologii a zkontroluj další svody."),
  ],
  lbbb: [
    t("U úplného LBBB u dospělého je QRS nejméně 120 ms. V1 má často QS nebo rS; v laterálních svodech je široká, často zářezová R. Tento model kreslí převážně záporný V1 a širokou R ve V6."),
    t("Zkontroluj také vztah ST–T k hlavní výchylce QRS. Výsledný vzorec posuzuj z více svodů; široká kladná R ve V6 sama k určení nestačí."),
  ],
  lafb: [
    t("Typická kombinace je qR v aVL a rS v dolních svodech při levé ose. V tomto modelu je QRS užší než u úplné blokády raménka."),
    t("Pro skutečné posouzení potřebuješ i další končetinové svody a odhad osy. Samotná hluboká S v aVF neumožňuje určit příčinu."),
  ],
  lpfb: [
    t("Model obrací orientaci vůči přednímu fascikulárnímu bloku: rS v aVL, qR v aVF a směr k dolním svodům."),
    t("Zadní fascikulární blok je při pravé ose závislý na vyloučení jiných vysvětlení, například změn pravé komory. Dva modelové svody nepředstavují úplný záznam."),
  ],
  wpw: [
    t("Měř od začátku P po první začátek delta vlny. Model kombinuje krátké PQ 95 ms, pozvolný náběh a širší QRS vzniklý spojením časné a běžné aktivace."),
    t("Krátké PQ bez delta vlny samo nestačí k určení preexcitace. Obraz WPW na EKG a syndrom WPW jsou rozdílné pojmy; syndrom zahrnuje související tachyarytmii."),
  ],
  mahaim: [
    t("V této idealizované ukázce zůstává PQ 160 ms a QRS má pozvolný začátek. Skutečné atriofascikulární dráhy mohou mít v klidu nenápadnou nebo chybějící zjevnou preexcitaci."),
    t("Z klidové morfologie samotné nelze určit anatomii přídatné dráhy. Porovnej klidový model s WPW a sleduj zvlášť délku PQ a počáteční část QRS."),
  ],
  shortpr: [
    t("Měřený PQ je 95 ms a začátek QRS zůstává ostrý. Tento proužek ukazuje pouze kombinaci krátkého PQ a úzkého QRS."),
    t("Historická nálepka LGL neříká, kudy se impulz převádí, ani neznamená, že pacient má tachykardii. Při porovnání s WPW je klíčový chybějící delta náběh."),
  ],
};

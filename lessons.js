export const anatomy = [
  ["Uložení, velikost a stěna", "Srdce leží v mediastinu mezi plícemi, zčásti vlevo od střední roviny. Velikostí odpovídá zhruba pěsti (v přednášce délka kolem 12 cm a šířka 8–9 cm). Hmotnost dospělého srdce se pohybuje přibližně kolem 230–340 g podle tělesné stavby. Dutinu vystýlá endokard, stah zajišťuje myokard a povrch tvoří epikard. Perikard srdce obaluje."],
  ["Dutiny a tok krve", "Duté žíly → pravá síň → trojcípá chlopeň → pravá komora → pulmonální chlopeň → plíce → plicní žíly → levá síň → mitrální chlopeň → levá komora → aortální chlopeň → tělo."],
  ["Chlopně a ozvy", "Při plnění jsou otevřené AV chlopně. S1 časově souvisí s jejich uzavřením. Po izovolumické kontrakci překročí komorový tlak tlak v tepnách a otevřou se poloměsíčité chlopně. S2 souvisí s jejich uzavřením. V obou izovolumických fázích jsou všechny chlopně zavřené."],
  ["Poslechová místa", "Aortální ve 2. mezižebří vpravo u sterna, pulmonální ve 2. mezižebří vlevo, trikuspidální při dolním levém okraji sterna, mitrální u hrotu poblíž 5. mezižebří v medioklavikulární čáře."],
  ["Vady a náhrady chlopní", "Stenóza klade odpor při dopředném toku. Regurgitace dovoluje zpětný tok při nedovření. Mezi náhrady patří mechanické a biologické protézy. Přednáška ukazuje mechanickou kuličkovou, jednolistou diskovou i dvoulistou konstrukci. Vybrané biologické chlopně lze zavést katétrem."],
  ["Koronární oběh a podpory", "Z aorty odstupuje pravá koronární tepna (RCA) a levý kmen, který se dělí na LAD a LCx. Ischemie zhoršuje funkci myokardu, může měnit ST/T, vyvolat arytmii nebo vést k infarktu. Dočasnou podporu poskytují např. intraaortální balonková kontrapulzace, katétrová pumpa a VA-ECMO podle potřeb oběhu."],
  ["Náhradní centra a spojení", "Orientační frekvence pro porovnání jsou sinus 60–100/min, AV junkce 40–60/min a komorové centrum 20–40/min. Bachmannův svazek vede aktivaci do levé síně. Internodální cesty jsou zobrazené jako schéma převodu v síních. Levé raménko má přední a zadní fascikl, přičemž podrobnější modely popisují také septální větvení."],
];

export const leadNotes = [
  ["Deset elektrod a dvanáct svodů", "RA, LA, LL a RL jsou končetinové elektrody, V1–V6 hrudní. I = LA − RA, II = LL − RA a III = LL − LA. Einthovenův trojúhelník dává II = I + III. RL typicky slouží pro DRL."],
  ["Goldberger a Wilson", "aVR je RA proti průměru LA a LL, obdobně aVL a aVF. Wilsonova svorka je průměr RA, LA a LL. Hrudní svody měří proti ní. V1/V2 leží ve 4. mezižebří u sterna vpravo/vlevo, V4 v 5. mezižebří v medioklavikulární čáře, V3 mezi V2 a V4, V5 a V6 v úrovni V4 v přední a střední axilární čáře."],
  ["Určení osy ze tří znamének", "Kladné I a aVF dávají úhel přibližně 0° až +90°. Je-li I kladný a aVF záporný, kladné II umístí osu mezi −30° a 0°. Záporné II ukáže na úhel pod −30°. Poblíž izoelektrického svodu je osa přibližně kolmá, směr pomůže vybrat další svod."],
  ["Elektrická a anatomická osa", "Elektrická osa aproximuje převládající směr depolarizace komor ve frontální rovině. Anatomická odpovídá orientaci srdce v hrudníku. Poloha těla a dýchání mění polohu bránice a mohou měnit projekci i odhad osy. V přednáškovém příkladu se při nádechu osa více vertikalizuje, proto může projekce do aVF narůst."],
  ["Vektorkardiografie a Frank", "Konec měnícího se elektrického vektoru opisuje smyčku. Frankův ortogonální systém aproximuje prostorové složky X, Y a Z pomocí vážených potenciálů z více elektrod. Projekce smyčky na svod dává časový průběh ve směru této osy."],
  ["Cabrerovo uspořádání", "aVL (−30°), I (0°), −aVR (+30°), II (+60°), aVF (+90°), III (+120°) seřadí svody podle orientace a usnadní porovnat sousední pohledy. Obrácením polarity aVR se jeho kladná osa posune z −150° na +30°."],
];

export const acquisition = [
  ["Elektrody", "Elektrody převádějí iontový proud v těle na elektronový proud v měření. Ag/AgCl s gelem má výhodu relativně nízké polarizace a stabilního rozhraní. Rozlišujeme např. jednorázové gelové, přísavné a suché elektrody. Poloha ovlivní tvar svodu."],
  ["Rozhraní a artefakt", "Půlčlánkové napětí je rovnovážné napětí na rozhraní kov–elektrolyt. Náhradní obvod má zdroj tohoto napětí, odpor elektrolytu a paralelní odpor a kapacitu dvojvrstvy. Kůže přidává vlastní impedanci. Pohyb mění kontakt, náboj dvojvrstvy i impedanci."],
  ["Instrumentační zesilovač", "Vstupní stupně s vysokou impedancí zatěžují elektrody jen málo. Následuje rozdílový stupeň. Vd = V+ − V−, Vcm = (V+ + V−)/2. CMRR = 20 log₁₀(Ad/Acm). Rozdílné vstupní impedance mohou přeměnit souhlasné rušení na rozdílové."],
  ["DRL a virtuální zem", "DRL odhadne společné napětí na vstupech a přes elektrodu vrací zápornou zpětnou vazbu. Virtuální zem nastaví pracovní střed při jednopólovém napájení, typicky kolem poloviny napájecího napětí. Obě funkce řeší odlišnou část snímacího řetězce."],
  ["Analogový filtr a A/D", "Antialiasingová dolní propust tlumí složky nad použitelné pásmo před vzorkováním. ADC převádí spojité napětí na diskrétní hodnoty v čase i amplitudě. Po převodu může následovat další filtrace a detekce."],
  ["Nadvzorkování při akvizici", "ADC vzorkuje rychleji, než vyžaduje cílové pásmo. Digitální dolní propust a decimace pak sníží množství širokopásmového šumu, který v cílovém pásmu zůstává. Čistě numerická interpolace už změřených vzorků nezíská dříve nezměřené detaily."],
  ["Komprese a zobrazení", "Bezeztrátová komprese po dekódování vrátí stejné vzorky, např. kóduje malé rozdíly po sobě jdoucích hodnot. Ztrátová metoda část informace zahodí, např. méně významné transformační koeficienty. Posuzuje se i věrnost amplitud a krátkých vln, nejen počet bajtů. Zobrazení Cabrera řadí rozvinuté frontální svody podle úhlu."],
];

export const filterNotes = [
  ["Proč záleží na účelu", "Pro věrnost morfologie se v kurzu uvádí např. rozsah kolem 0,05–150 Hz u dospělých. Detektor může použít užší pásmo, např. 5–15 Hz, kde vystoupí prudké změny QRS. Stejné nastavení může silně zkreslit ST, T i tvar QRS."],
  ["Překryv spekter a okraje", "Drift má energii hlavně při nízkých frekvencích, 50Hz brum je poměrně úzký a EMG širokopásmové. Při překryvu se spektrální složky signálu a rušení nedají dokonale oddělit. Skok a impulz mají široké spektrum. Po filtraci mohou v okolí vzniknout přechodové kmity."],
  ["FIR, IIR a okna", "FIR má konečnou impulzní odezvu. Při symetrických koeficientech poskytuje lineární fázi se zpožděním (N−1)/2 vzorku. Hammingovo okno potlačí postranní laloky proti obdélníkovému za cenu širšího přechodu. IIR používá zpětnou vazbu a často dosáhne strmé meze s menším řádem. Filtfilt odstraní fázový posun v offline zpracování a změní výslednou amplitudovou charakteristiku."],
  ["Odhad a odečet izolinie", "Prolož pomalý trend například polynomem přes vhodné izoelektrické body a odečti jej od signálu. Pokud přidáš příliš mnoho stupňů volnosti nebo zahrneš stahy bez rozmyslu, model může odečíst i část fyziologického průběhu."],
  ["Proč adaptivní filtr", "Filtr se mění podle situace. Má-li referenční vstup obsahující rušení a málo EKG, upravuje koeficienty tak, aby předpovídal rušení z reference a odečetl jej. LMS používá jednoduchou gradientní aktualizaci, NLMS škáluje krok energií reference, SDLMS používá znaménko vstupního vektoru a RLS přizpůsobuje model rychleji za cenu vyšší složitosti."],
  ["Přesun elektrod", "Uspořádání Mason–Likar přesouvá končetinové elektrody na trup. Může zmírnit pohyb kabelů a svalové artefakty při zátěži, současně mění projekce a amplitudy oproti standardní poloze."],
];

export const hrvNotes = [
  ["Autonomní regulace", "Časování SA uzlu se mění vlivem autonomní regulace a dýchání. Při respirační sinusové arytmii se intervaly typicky zkracují při nádechu a prodlužují při výdechu. Tvar tachogramu závisí i na délce úseku, aktivitě a podmínkách měření."],
  ["SDNN, RMSSD, NN50 a pNN50", "Vstupem jsou validní NN. SDNN je výběrová směrodatná odchylka NN v ms. RMSSD je odmocnina průměru čtverců sousedních rozdílů v ms. NN50 je počet absolutních rozdílů nad 50 ms, pNN50 jejich podíl v %. Mezery po vyloučených intervalech uchováváme a rozdíl přes ně nezapočítáváme."],
  ["SDANN a SDNN index", "U dlouhého záznamu, typicky 24 hodin, rozděl validní NN do pětiminutových úseků. SDANN je směrodatná odchylka průměrů úseků. SDNN index je průměr směrodatných odchylek v těchto úsecích. Obojí se udává v ms."],
  ["Histogram, trojúhelníkový index a TINN", "Na x je délka NN v ms, na y počet intervalů v třídě. Trojúhelníkový index je celkový počet intervalů dělený četností v nejvyšší třídě. TINN je šířka základny přizpůsobeného trojúhelníku v ms. Stabilní odhady vyžadují dost NN a standardizovanou šířku třídy, tradičně přibližně 7,8 ms."],
  ["Spektrum v čase a pásma", "Interval patří na čas svého ukončení. Pro Welch lze časovou řadu interpolovat na 4 Hz, odstranit průměr nebo trend a průměrovat výkon z překrývajících se oken. Na x je frekvence v Hz, na y hustota výkonu v ms²/Hz. Integrace dává výkon v ms² (VLF < 0,04 Hz, LF 0,04–0,15, HF 0,15–0,40). Pětiminutový stacionární úsek dovolí výukově ukázat LF a HF, odhad VLF je v něm omezený."],
  ["Poincarého graf", "Dvojice sousedních NN tvoří bod [NNₙ, NNₙ₊₁], obě osy jsou v ms. SD1 měří šířku kolmo k diagonále a SD2 rozptyl ve směru diagonály jako směrodatnou odchylku. Krátký úsek je vhodný pro ověření konstrukce."],
  ["Entropie a DFA", "Entropie odhaduje pravidelnost z opakování podobných sekvencí NN, výsledkem je bezrozměrné číslo závislé na délce vzoru a toleranci. DFA zkoumá škálování kolísání po odečtení trendu v oknech různých délek. Na log–log grafu je x velikost okna ve stazích, y velikost fluktuace v ms před logaritmováním a sklon dává exponent. Obě metody vyžadují dost dlouhou souvislou řadu."],
  ["Korelační dimenze a rekurence", "Korelační dimenze odhaduje škálování počtu blízkých dvojic v rekonstruovaném stavovém prostoru při změně poloměru. Výsledkem je bezrozměrný odhad dimenze. Rekurentní diagram kreslí blízkost stavů pro každou dvojici časových indexů, obě osy jsou index stahu nebo čas. Výsledky závisejí na délce, rozměru vnoření, zpoždění a prahu."],
];

export const opticalNotes = [
  ["Komorová buňka a SA uzel", "V pracovním komorovém myokardu má fáze 0 rychlý vzestup přes Na⁺ kanály, v plató se vyvažuje vstup Ca²⁺ a výstup K⁺, poté převládne repolarizace přes K⁺. SA uzel se ve fázi 4 spontánně depolarizuje a jeho vzestup je převážně Ca²⁺. Kontaktní mikroelektroda měří lokální potenciál. Povrchové EKG snímá výsledný rozdíl potenciálů vznikající při prostorově nerovnoměrné aktivaci srdce."],
  ["Dva modely perfuze", "Langendorff: zásobník → vstup proti směru do aorty → uzavřená aortální chlopeň → tok do koronárních ústí. Pracující srdce: rezervoár → levá síň → mitrální chlopeň → levá komora → aortální chlopeň → simulovaná zátěž."],
  ["Optická cesta a relativní fluorescence", "Světelný zdroj → excitační filtr → napěťově citlivé barvivo v tkáni → emisní filtr → kamera. Signál ΔF/F₀ vyjadřuje relativní změnu vůči základní fluorescenci po zohlednění offsetu. Závisí na barvivu, osvětlení a integraci v prostoru. Znaménko optické odezvy závisí na barvivu a zpracování."],
  ["Pohyb a jeho omezení", "Pohyb přesouvá tkáň mezi pixely a mění jas i bez změny potenciálu. Pomáhá stabilizace, registrace snímků, ratiometrie či oddělení složek. ICA hledá statisticky nezávislé komponenty a interpretace vyžaduje ověřit, která souvisí s pohybem. Samotné vyhlazení pohyb spolehlivě neoddělí."],
];

export const curriculum = [
  ["1 · Anatomie, vrstvy, velikost", "anatomie", "Heart anatomy, sn. 4–22 a 32–33"],
  ["1 · Chlopně, poslech, náhrady, oběh", "anatomie", "Heart anatomy, sn. 12, 22–31 a 40–41"],
  ["1 · Koronární oběh, ischemie, podpory", "anatomie", "Heart anatomy, sn. 34–39"],
  ["1 · Převod, pacemakery a frekvence", "vedeni", "Heart anatomy, sn. 43–54; Arytmologie, sn. 2; Zápočet, s. 1"],
  ["1 · AP a EKG, izolované srdce, perfuze, barviva a pohyb", "optika", "Optical mapping, sn. 2–65; ap_propagation_rat.ipynb"],
  ["1 · Dvanáct svodů, Einthoven, Goldberger, V1–V6, Frank", "svody", "Lead systems, sn. 2–46"],
  ["1 · Elektrická a anatomická osa, odchylky, dýchání", "svody", "Lead systems, sn. 24–46; Zápočet, s. 1"],
  ["1 · Užitečný signál, rušení, filtry, přesun elektrod", "filtrace", "Šum v EKG, s. 2–99; ecg_filtering_student.ipynb"],
  ["1 · Zesílení, virtuální zem, DRL a analogová filtrace", "snimani", "ECG acquisition HW, s. 2–44"],
  ["1 · Ag/AgCl, náhradní obvod, artefakt, umístění", "snimani", "ECG acquisition HW, s. 45–68"],
  ["1 · Nadvzorkování, komprese a zobrazení", "snimani", "Exam Topics, s. 1; externí doplnění Analog Devices a AHA"],
  ["1 · Cabrera, anatomické pořadí a −aVR", "svody", "Zápočet, s. 1; externí doplnění AHA"],
  ["2 · Typy filtrů, meze a adaptivní princip", "filtrace", "Šum v EKG, s. 39–99; Zápočet, s. 2"],
  ["2 · Extrasystoly, blokády a žebříčkový diagram", "atlas", "Arytmologie, sn. 2–88; Zápočet, s. 4"],
  ["2 · Příčiny HRV, princip a výstup parametrů", "hrv", "HRV, s. 2–47; hrv_student.ipynb; Zápočet, s. 3"],
  ["Cvičení · Detekce QRS a ověření", "detekce", "R detectors, s. 8–44; r_detecting.ipynb; qrs_detection_colab.ipynb"],
];

export const questions = [
  ["Co odpovídá průběhu P → postupně delší PQ → P bez QRS?", ["Mobitz I", "Stálý AV převod 1:1", "Samostatná komorová extrasystola"], 0, "Při Wenckebachově sekvenci se převod v této ukázce prodlužuje a nakonec vypadne."],
  ["Jaký mechanismus vysvětlí široký předčasný QRS bez příčinné P?", ["Zrychlení vedení přes AV uzel", "Vznik vzruchu v komoře", "Vynechaný SA vzruch"], 1, "Impulz z komory aktivuje myokard postupně mimo běžný začátek specializované dráhy."],
  ["Kdy se otevře aortální chlopeň?", ["Při plnění komor", "Na začátku izovolumické relaxace", "Když tlak v levé komoře překročí tlak v aortě"], 2, "Rozdíl tlaků umožní výtok do aorty."],
  ["I je +0,6 mV a II +0,9 mV. Kolik je III?", ["−0,3 mV", "+0,3 mV", "+1,5 mV"], 1, "Podle Einthovena platí III = II − I."],
  ["Který blok aktivně potlačuje souhlasné rušení na těle?", ["ADC", "Wilsonova svorka", "DRL"], 2, "DRL přivede zápornou zpětnou vazbu z odhadu souhlasné složky."],
  ["Jaký filtr je cílený na úzký síťový pík 50 Hz?", ["Pásmová zádrž 49–51 Hz", "Pásmová propust 49–51 Hz", "Horní propust 50 Hz"], 0, "Úzká zádrž tlumí brum a zachová větší část okolního pásma."],
  ["Proč detektor kvadratuje derivaci?", ["Přesně zarovná R", "Zvýrazní strmé úseky obou znamének", "Určí RR"], 1, "Čtverec převádí kladné i záporné strmé změny na velké kladné hodnoty."],
  ["Detektor našel 90 ze 100 událostí a přidal 5 falešných. Jaká je citlivost?", ["90 %", "94,7 %", "85 %"], 0, "Citlivost je 90/100. Pět falešných detekcí ovlivní PPV."],
  ["Jaké osy má Poincarého graf?", ["Čas v s a NN v ms", "Frekvence a spektrální výkon", "NNₙ a NNₙ₊₁, obě v ms"], 2, "Každý bod je jedna dvojice sousedních NN intervalů."],
  ["Co v žebříčku vyznačíš, když po P chybí QRS?", ["Značku komorového stahu v očekávaném čase", "P v síňové řadě, prázdné místo v komorové a odvozený zlom převodu", "Jedinou značku v komorové řadě"], 1, "P je pozorovaná událost. Místo, kde se předpokládá porucha vedení, je modelová část žebříčku."],
  ["Kdy může pomoci adaptivní filtr?", ["Když se parametry rušení mění a máme vhodnou referenci", "Jenom při dokonale konstantním signálu", "Když chceme převést intervaly na milisekundy"], 0, "Přizpůsobuje své koeficienty na základě signálu nebo informace o rušení."],
  ["Jak se získá lokální optická stopa?", ["Z jasu všech pixelů v jediném snímku", "Ze změny jasu vybraného pixelu v čase", "Z rozdílu dvou svodů"], 1, "Sleduješ tentýž pixel napříč snímky. Pohyb může jeho jas také měnit."],
];

# EKG laboratoř pro MPC-DVK

Česká výuková aplikace k převodnímu systému, svodům, rytmům a zpracování EKG. Učivo a zdroje jsou propojené s oběma stranami zkouškových okruhů přímo v aplikaci. Atlas používá syntetické rytmové proužky, filtrace měření ze cvičení a optické mapování pořízená data izolovaného srdce.

## Spuštění

```bash
cd ekg-laborator
python3 -m http.server 8765 --bind 127.0.0.1
```

Otevři [EKG laboratoř na localhostu](http://127.0.0.1:8765/). Stačí moderní prohlížeč a Python 3 pro lokální server. Data pro lekce jsou už v adresáři `data/`. Internet potřebuješ pouze pro otevření odkazovaných externích zdrojů. Server zastavíš klávesami Ctrl+C.

## Práce s lekcemi

- **Převodní systém a anatomie.** Krokování synchronizuje vlnu aktivace ve svalovině s kurzorem na syntetickém EKG. V anatomickém řezu lze přiblížit části srdce a zjistit jejich názvy a funkce. Samostatná mapa ukazuje tok krve a stav chlopní.
- **Atlas.** Vyber jeden z 28 příkladů. Po vlastním rozboru otevři vysvětlení, zvětšený stah nebo postupný žebříčkový diagram.
- **Svody a snímání.** Otoč elektrickou osu, přepni Cabrerovo pořadí a vyzkoušej vliv CMRR na průnik brumu.
- **Zpracování signálu.** Porovnej filtry, kroky výukové adaptace Pan–Tompkinsova detektoru a detekce metodou Hamilton. Tlačítko u detekce přenese zvolené značky do lekce HRV.
- **HRV a optika.** Zkus chybějící R, ektopický stah, histogram, Poincarého graf a spektrum ze syntetických NN. U kamery vyber pixel a odliš měřená data od odvozené aktivace.
- **Procvičování.** Tři neanotované proužky a 12 otázek s vysvětlením odpovědí.

## Kontrola a přepočet dat

Numerické kontroly lze zopakovat příkazem `node verify.mjs` v moderním Node.js. Výsledky a omezení jsou v [protokolu kontroly](PROTOKOL.md).

Při změně zdrojových dat spusť `python3 prepare_data.py` s NumPy a SciPy v prostředí, kde funguje sousední knihovna `py-ecg-detectors`. Skript čte podklady v nadřazeném adresáři a obnoví připravené soubory v `data/`. Pro běžné použití stačí příkaz ke spuštění serveru uvedený výše.

Statickou distribuční složku pro Sites vytvoří příkaz `node build.mjs`.

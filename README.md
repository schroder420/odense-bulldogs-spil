# Odense Bulldogs: konkurrenceadministration

Der er lavet fire sammenhængende administrationssider til Odense Bulldogs: Vælg spil, Konfigurér konkurrence, Tidspunkt og start samt Afvikling. Siderne er bygget i HTML, CSS og enkel JavaScript med formularvalidering, lokalt gemte valg og eksempeldata. Koden er kommenteret og ryddet op, og en sideskabelon med vejledning gør det let for gruppen at tilføje flere sider. Spillet og den rigtige storskærm kan tilsluttes senere.

Repoet indeholder også separate sider til Deltagere, Resultat, Præmier og Statistik. Der er ingen installation, byggeproces eller framework.

## Start lokalt

Åbn repoets mappe i VS Code. Brug Live Server på `vaelg-spil.html`, eller kør dette i terminalen:

```sh
python3 -m http.server 8080
```

Åbn [http://localhost:8080/vaelg-spil.html](http://localhost:8080/vaelg-spil.html).

## Find rundt i koden

| Fil eller mappe | Ansvar |
| --- | --- |
| `vaelg-spil.html` | Spilvalg. Spil 2 og 3 er “Kommer snart”. |
| `konfigurer.html` | Navn, hold, dragtfarver og præmie. |
| `tidspunkt.html` | Startvalg, varighed og opsummering. |
| `afvikling.html` | Statisk eksempel på konkurrenceafvikling. |
| `deltagere.html` | Separat side til deltagere. |
| `resultat.html` | Separat side til resultat. |
| `praemier.html` | Separat side til præmier. |
| `statistik.html` | Separat side til statistik. |
| `kampguide/index.html` | Kampguide til tilskuerne på /kampguide (mobil først, ingen login). Indhold fra kampguiden v2, nov. 2026. |
| `css/kampguide.css` | Kampguidens egne regler, alle med `.kampguide` foran. |
| `assets/kampguide/` | Banetegninger, fotos og PDF til kampguiden. |
| `styles.css` | Fælles skrifter, farver, navigation, formularer og komponenter. |
| `css/` | Én CSS-fil pr. side med samme navn som HTML-filen, fx `css/afvikling.css`. |
| `js/data.js` | Objektet `competition` og gemning i browseren. |
| `js/app.js` | Fælles hjælpefunktioner, mobilmenu og pladsholderdialoger. |
| `js/konfigurer.js` | Kun konfigureringens formular og dragtfarver. |
| `js/tidspunkt.js` | Kun startvalg, varighed og opsummering. |
| `js/afvikling.js` | Kun afviklingens eksempeldata og storskærmspladsholder. |
| `assets/` | Lokale billeder, SVG-ikoner og skrifttyper. |
| `side-skabelon.html` | Udgangspunkt for gruppens nye sider. |
| `css/side-skabelon.css` | Eksempel på en sides egne CSS-regler. |
| `js/side-skabelon.js` | Udgangspunkt for en sides egen JavaScript. |

## Tilføj en ny side

Eksempel: Du skal lave `ny-side.html`. Brug et filnavn, som ikke allerede findes i repoet.

1. Kopiér `side-skabelon.html` til `ny-side.html` i repoets rodmappe.
2. Kopiér `css/side-skabelon.css` til `css/ny-side.css`. Indlæs `styles.css` først og `css/ny-side.css` bagefter. Skift body-klassen `side-skabelon` til `ny-side`, og brug samme klasse foran dine egne CSS-regler.
3. Hvis siden har JavaScript, kopier `js/side-skabelon.js` til `js/ny-side.js`. Ret script-linket og funktionens navn. Hvis du ikke har brug for JavaScript, fjern kun linket til `js/side-skabelon.js`.
4. Ret `<title>`, beskrivelsen, `data-page`, brødkrummen og overskriften. Udskift indholdet i `<main>`. Behold `id="main"`, så skip-linket virker.
5. Ret skabelonens aktive menulink til din sides filnavn og navn. Brug `is-active` og `aria-current="page"` på den aktuelle sektion i hovedmenuen.
6. Tilføj linket på de eksisterende sider, som skal kunne åbne den nye side. Navigationen er almindelig HTML, så linkene opdateres i hver relevant HTML-fil og i skabelonen.

En knap, som åbner en pladsholder, erstattes af et almindeligt link, når siden findes. Eksempel:

```html
<!-- Før -->
<button type="button" data-placeholder="Ny side">Ny side</button>

<!-- Efter -->
<a href="ny-side.html">Ny side</a>
```

Behold eksisterende klasser og ikoner, når du ændrer et menupunkt. Fjern `data-placeholder` fra det færdige link. Brug et `<a>` til navigation og en `<button>` til en handling på den aktuelle side.

## Fælles design og scripts

Genbrug fx `page-heading`, `panel`, `field`, `field-label`, `button` og `button-primary` fra `styles.css`. `panel` giver et kort med indvendig luft. `form-section` bruges til afsnit inde i en formular. Farver og skrifter styres øverst i filen med CSS-variabler som `--orange`, `--text` og `--body`.

Placér nye, sidespecifikke regler i sidens egen CSS-fil. Sæt sidens body-klasse foran reglerne, fx `.ny-side .sideindhold`. Ret kun `styles.css`, når ændringen skal gælde fælles komponenter.

Fællesscripts indlæses i denne rækkefølge, efterfulgt af sidens egen fil:

```html
<script src="js/data.js" defer></script>
<script src="js/app.js" defer></script>
<script src="js/ny-side.js" defer></script>
```

`defer` sikrer, at HTML er læst, før scripts kører. Behold menuens ID'er `menu-toggle` og `mobile-scrim` og pladsholderdialogens ID'er fra skabelonen. De bruges af `app.js`.

Sidens egen JavaScript behøver ingen ændringer i `app.js`. Hold egne variabler inde i en funktion som vist i skabelonen, så de ikke kolliderer med fælles navne. Formular-ID'erne `configure-form` og `timing-form` samt `data-page="run"` tilhører de eksisterende sider.

## Formularer og gemning

Fælles konkurrenceoplysninger ligger i objektet `competition`. Formularfelternes `name` svarer til objektets feltnavne. Nye fælles felter skal også have en standardværdi i `js/data.js`, før de bruges med `fillForm()`.

`saveCompetition()` gemmer under nøglen `bulldogs-demo:v1:draft` og returnerer `true` eller `false`. `saveForm(form)` læser formularens navngivne felter og forsøger at gemme. Ved fejl vises `#save-error`, og de eksisterende formularer bliver på siden. Browserens lager skal være tilgængeligt, før valgene kan følge med til næste side.

Konkurrencens navn og modstander må ikke være tomme eller kun indeholde mellemrum. Ydre mellemrum fjernes, når formularen sendes. De øvrige feltkrav styres med HTML-attributter som `required`, `min` og `max`.

Data gemmes kun i den aktuelle browser. De deles ikke med andre brugere eller en backend. Ryd browserens webstedsdata for at begynde forfra.

## Arbejd sammen

Arbejd på hver jeres Git-branch og primært i egne HTML-, CSS- og JS-filer. Aftal ændringer i `styles.css`, `js/app.js` og `js/data.js`, fordi de deles mellem siderne. Tilføj kun egen sidelogik til sidens egen JS-fil.

Før I samler ændringer, gennemgå disse punkter:

- Åbn siden via den lokale server og prøv dens links.
- Kontrollér på både desktop og en smal mobilvisning.
- Prøv formularen med tomme felter, kun mellemrum og almindelige oplysninger.
- Kontrollér, at valg stadig findes efter sideskift og genindlæsning.
- Prøv navigationen med tastaturet, og tjek browserens konsol for fejl.

## Afgrænsning og senere integration

Der er endnu ingen rigtig start eller automatisk planlægning. Dato, tidspunkt og varighed er gemte formularvalg. Afvikling viser faste nøgletal og en fast tid. Knapper til skærmstyring og afslutning er deaktiverede eksempler.

Deltagere, Resultat, Præmier og Statistik er tilføjet som separate sider. Øvrige administrationsområder tilføjes af resten af gruppen. Selve spillet og den rigtige storskærm skal senere tilsluttes fra det gamle projekt `Odense-Bulldogs`. “Åbn storskærm” åbner indtil da en pladsholder. Backend, nedtælling, skærmrotation og vouchers er ikke implementeret her.

## Designaktiver

Logo og spillerfigurer er kopieret uændret fra `Odense-Bulldogs/public/assets/`. Forhåndsvisningerne bruger `bulldogs-glide-v6.webp`, `bulldogs-receive-v6.webp` og `opponent-receive-v6.webp`. De øvrige glide- og stride-figurer ligger også i `assets/`, klar til senere integration.

Barlow og Barlow Condensed er kopieret fra det gamle projekts lokale fontpakker. Licenserne ligger i `assets/fonts/`. Administrationsikonerne ligger i SVG-spriten `assets/icons.svg`, og pilikonet følger den angivne Figma-style tile.

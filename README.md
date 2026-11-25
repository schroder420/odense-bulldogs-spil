# Odense Bulldogs Kampkontrol

Prototypen er bygget i HTML, CSS og JavaScript. Firebase Authentication håndterer personalets login, og Cloud Firestore gemmer konkurrencer og leverer historiske kamptal. Spillet, storskærmen og verificeret udstedelse og indløsning af vouchers kræver stadig en spilserver.

## Start lokalt

Kør fra repoets rodmappe, eller brug Live Server i VS Code.

```sh
python3 -m http.server 8080
```

Åbn [Kampkontrol](http://localhost:8080/login.html) med en personalekonto. Fansiden er på [spiller.html](http://localhost:8080/spiller.html), og [kampguiden](http://localhost:8080/kampguide.html) er offentlig. Firebase SDK hentes ved kørsel, så der er ingen installation eller byggeproces for websitet.

## Personaleadgang

1. Slå **Email/Password** til under **Authentication → Sign-in method** i Firebase-projektet `odense-bulldogs`.
2. Udgiv indholdet fra `firestore.rules` på **Firestore → Rules**.
3. Opret din personalekonto under **Authentication → Users**. Brug en adgangskode, du selv vælger, og kopier kontoens **User UID**.
4. Opret dokumentet `staff/{UID}` i Firestore med tekstfeltet `role` sat til `staff`. Kontoen kan derefter logge ind i prototypen. En projektansvarlig kan fjerne personalerollen ved at fjerne medlemsdokumentet.

## Test med Firebase-emulatoren

Brug Firebase CLI og Java 21 eller nyere. Kør kommandoen fra repoet i en ekstra terminal ved siden af webserveren.

```sh
firebase emulators:start --project demo-bulldogs --only auth,firestore
```

Opret en testbruger og et tilsvarende `staff/{UID}` med `role: "staff"` i [Emulator Suite](http://127.0.0.1:4000). Åbn derefter [lokalt testlogin](http://localhost:8080/login.html?emulator=1). De interne links fører testvalget videre. Emulatorens database er separat og begynder uden de otte historiske kampe.

Prøv at oprette og planlægge en konkurrence, genindlæs afviklingen, og se at samme konkurrence-ID går igen på fanerne. Find konkurrencen i arkivet, og kontrollér, at en annullering bliver ved efter genindlæsning. Prøv også login med en bruger uden et medlemsdokument.

## Find rundt i koden

| Sted | Ansvar |
| --- | --- |
| `js/firebase.js` | Login, opslag i Firestore og ændringer via transaktioner. |
| `firestore.rules` | Adgang for personale, beskyttede samlinger og tilladte statusændringer. |
| `js/data.js` og formularernes egne scripts | Formularværdier, lokale kladder og afventning af gemning. |
| `js/archive.js` og `js/stats.js` | Arkiv, historiske tal og beregninger på dokumenterede data. |
| `js/round-details.js` | Deltagere, resultat og præmieoversigt for det valgte ID. |
| `js/public-competition.js` | Offentlig visning af dokumenter fra `public_rounds`. |
| `side-skabelon.html`, `css/side-skabelon.css` og `js/side-skabelon.js` | Udgangspunkt for nye administrationssider. |
| `styles.css` og `css/` | Fælles design og sidespecifikke regler. |

På en ny administrationsside importeres `staffReady` fra `js/app.js`. Brug `data-checking-access` på sidens hovedindhold, og bevar `#access-status` fra sideskabelonen. Vent på `staffReady`, før sidens egne Firestore-kald køres.

Den danske gennemgang med datamodel, kodeeksempler og eksamensforklaring ligger i [Forklaring af Firebase databasen til Odense Bulldogs](https://chatgpt.com/library?file_id=libfile_fde3_f-abfd730559dc8191bdf521bd602edfa1_bc9f3b7e46348191ba6bfc76c1b96afa&account_id=personal).

## Designaktiver

Logo og spillerfigurer er kopieret fra det gamle projekt `Odense-Bulldogs`. Barlow og Barlow Condensed ligger i `assets/fonts/` med licenser. Administrationsikonerne ligger i `assets/icons.svg`. Kampguiden har sine egne illustrationer og en PDF i `assets/kampguide/`.

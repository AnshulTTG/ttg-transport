# TTG — The Guianas Transport & Logistics (Transport Compleet)

Complete webapp voor Travel The Guianas: ritten, zonetarieven, calculator,
brandstof, schoonmaak, reparaties, servicebeurten met km-reminders, kasboek
(SRD/EUR/USD), maandoverzicht, bus-terugverdienen, invoices & offertes met
printfunctie, en gebruikersbeheer met Admin/User rollen.

Alle gegevens staan centraal in een Neon (PostgreSQL) database — iedereen
ziet dezelfde data op elk apparaat na inloggen.

## Stap 1 — GitHub (code)
1. Maak een account op https://github.com (gratis).
2. Klik rechtsboven op + → "New repository".
   - Naam: bv. `ttg-transport` · Private ✔ · Create repository.
3. Klik "uploading an existing file" en sleep ALLE bestanden uit deze map erin
   (server.js, package.json, README.md, .gitignore en de map public/ met index.html).
   NIET de map node_modules uploaden.
4. Klik "Commit changes".

## Stap 2 — Neon (database)
1. Maak een account op https://neon.tech (gratis plan is genoeg).
2. Maak een nieuw project, bv. `ttg`.
3. Op het dashboard zie je "Connection string" — kies "Pooled connection"
   en kopieer de hele regel die begint met `postgresql://...`.
   Dit is je DATABASE_URL.

## Stap 3 — Render (hosting)
1. Maak een account op https://render.com en log in met je GitHub-account.
2. Klik New → "Web Service" → kies je `ttg-transport` repository.
3. Instellingen:
   - Runtime: Node
   - Build Command:  npm install
   - Start Command:  npm start
   - Instance type: Free
4. Onder "Environment Variables" voeg je toe:
   - DATABASE_URL  = de connection string van Neon (stap 2)
   - JWT_SECRET    = een lang zelfverzonnen geheim, bv. 40 willekeurige tekens
5. Klik "Create Web Service" en wacht tot de status "Live" is.
6. Je site staat nu op https://JOUWNAAM.onrender.com

## Eerste keer inloggen
- Gebruikersnaam: admin · Pincode: 1234
- Ga DIRECT naar "Gebruikers & Login" en wijzig de pincode.
- Bij de eerste login vult de app de database met de startgegevens
  (assumptions, voertuigklassen, routes, voorbeeldrecords). Verwijder de
  voorbeeldrecords en vul je echte cijfers in.

## Goed om te weten
- Gratis Render-services gaan "slapen" na 15 min zonder bezoek; de eerste
  klik daarna duurt dan ±30-60 sec. Wil je dat niet, upgrade naar een
  betaald plan (~$7/mnd).
- Eigen domein (bv. admin.traveltheguianas.com): Render → Settings →
  Custom Domains, en voeg bij je domeinbeheer het getoonde CNAME-record toe.
- Pincodes staan als tekst in de database. Voor het team is dat werkbaar,
  maar gebruik geen pincodes die je ook ergens anders (bank, e-mail) gebruikt.

## Lokaal draaien (optioneel, voor testen)
```
npm install
set DATABASE_URL=postgresql://...   (Windows)  of  export DATABASE_URL=... (Mac/Linux)
set JWT_SECRET=test-geheim
npm start
```
Open daarna http://localhost:3000

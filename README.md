# De Mol Voting App

## Projectbeschrijving
Deze applicatie stelt gebruikers in staat om tijdens elke eliminatieronde van het tv-programma "De Mol" te stemmen op wie zij denken dat De Mol is. Gebruikers kunnen punten verdelen over de kandidaten, en degene die op het einde de meeste punten op De Mol heeft gezet, wint het spel. De applicatie maakt gebruik van Typescript React (met Vite) en Firebase (Firestore en Authentication) zonder traditionele backend.

## Functionaliteiten
- **Gebruikersauthenticatie**: Registreren en inloggen via Firebase Authentication.
- **Groepen**: Gebruikers kunnen groepen aanmaken en anderen uitnodigen via e-mail.
- **Stemmen**: Gebruikers verdelen 100 punten per stemronde over de resterende kandidaten.
- **Weegfactor**: Hoe dichter bij de finale, hoe zwaarder de punten wegen (bv. ronde 1: factor 1, ronde 2: factor 1.5, etc.).
- **Stemrondes**: Een stemronde sluit automatisch op zondag om 20:00 wanneer de volgende aflevering online komt. De eerste stemronde start op zondag 23/03 om 20:00.
- **Dashboard**: Stemmingen worden centraal opgeslagen. Gebruikers stemmen één keer per ronde en deze resultaten worden getoond in alle groepen waarvan ze lid zijn.
- **Uitslag**: Na de finale worden de eindscores berekend en wordt de winnaar bekendgemaakt.

## Technische Stack
- **Frontend**: React met Vite
- **UI Framework**: Shadcn UI
- **Authenticatie**: Firebase Authentication
- **Database**: Firebase Firestore
- **Hosting**: Firebase Hosting

## Installatie
1. **Project opzetten**
   ```sh
   yarn create vite de-mol-app --template react
   cd de-mol-app
   yarn add firebase react-router-dom @radix-ui/react-icons
   ```
   
2. **Shadcn UI instellen**
   ```sh
   npx shadcn-ui@latest init
   ```
   
3. **Firebase instellen**
   - Ga naar de Firebase Console en maak een nieuw project.
   - Voeg een webapp toe en kopieer de Firebase-configuratie.
   - Activeer Firestore Database en Authentication met e-mail/wachtwoord.

4. **Firebase-configuratie in React (src/lib/firebase.js)**
```javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCcf7vXG3jzJTfUaAbpE6KtZjcsn2Yf9hQ",
  authDomain: "demol-99d6c.firebaseapp.com",
  projectId: "demol-99d6c",
  storageBucket: "demol-99d6c.firebasestorage.app",
  messagingSenderId: "1098893515403",
  appId: "1:1098893515403:web:edd5be4f87be1f65e9928e",
  measurementId: "G-6JST25QZ72"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
```

## Datamodel
### Firestore Collections
1. **users**
   ```
   {
     uid: string,          // Firebase Auth UID
     email: string,        // Gebruiker e-mail
     displayName: string,  // Weergavenaam
     groups: array         // Groep-IDs waar gebruiker lid van is
   }
   ```

2. **groups**
   ```
   {
     id: string,           // Groep ID
     name: string,         // Groepsnaam
     createdBy: string,    // UID van maker
     members: array,       // UIDs van leden
     createdAt: timestamp  // Aanmaakdatum
   }
   ```

3. **votes**
   ```
   {
     userId: string,       // UID van stemmer
     roundId: number,      // Rondenummer
     votes: {              // Puntenverdeling
       kandidaat1: number,
       kandidaat2: number,
       ...
     },
     timestamp: timestamp  // Tijdstip van stemmen
   }
   ```

4. **rounds**
   ```
   {
     id: number,           // Rondenummer
     startDate: timestamp, // Starttijd
     endDate: timestamp,   // Eindtijd
     candidates: array,    // Nog aanwezige kandidaten
     weightFactor: number, // Weegfactor
     molRevealed: boolean  // Indien finale
   }
   ```

## Functionaliteiten implementeren
### 1. **Gebruikersauthenticatie**
   - Maak SignUp en SignIn componenten voor gebruikersauthenticatie.
   - Gebruik Firebase Authentication voor registratie en login.
   - Voeg wachtwoordreset functionaliteit toe.
   - Implementeer persistent login met localStorage.

### 2. **Groepen aanmaken**
   - Gebruikers kunnen groepen maken en andere gebruikers uitnodigen via e-mail.
   - Gebruikers kunnen groepen beheren (leden toevoegen/verwijderen).
   - Groepen hebben een unieke link om makkelijk te delen.

### 3. **Stemfunctionaliteit**
   - Gebruikers verdelen 100 punten over de kandidaten per stemronde.
   - Implementeer een interactieve slider/input voor puntenverdeling.
   - Realtime validatie dat punten tot 100 optellen.
   - Stemgegevens worden centraal opgeslagen in Firestore.
   - Gebruikers kunnen hun stem wijzigen tot de deadline.

### 4. **Automatische rondes**
   - Implementeer een timer voor automatische afsluiting van stemrondes.
   - Gebruik Cloud Functions om rondes automatisch af te sluiten/te openen.
   - Notificaties voor gebruikers wanneer nieuwe stemronde begint.

### 5. **Dashboard**
   - Overzicht van alle groepen waarin de gebruiker deelneemt.
   - Visualisatie van stemresultaten per ronde.
   - Ranglijst van spelers binnen elke groep.
   - Grafische weergave van puntenverdelingen over tijd.

## UI en Routing
- Gebruik React Router voor navigatie met de volgende routes:
  - `/`: Landingspagina/dashboard
  - `/login`: Inlogpagina
  - `/register`: Registratiepagina
  - `/groups`: Overzicht van groepen
  - `/groups/:id`: Specifieke groep details
  - `/vote`: Huidige stemronde
  - `/profile`: Gebruikersprofiel

- Gebruik Shadcn UI-componenten voor een moderne en consistente interface.
- Implementeer het kleurenschema van de officiële "De Mol" website (GoPlay).
- Zorg voor een responsive design dat werkt op mobiel, tablet en desktop.

## Deployment
1. **Bouw de applicatie**
   ```sh
   yarn build
   ```

2. **Deploy naar Firebase Hosting**
   ```sh
   firebase deploy
   ```

## Toekomstige uitbreidingen
- Sociale media integratie
- Echte push-notificaties
- Statistieken en voorspellingsmodellen
- Integratie met de officiële De Mol API (indien beschikbaar)

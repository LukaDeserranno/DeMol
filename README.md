# De Mol Voting App

## Projectbeschrijving
Deze applicatie stelt gebruikers in staat om tijdens elke eliminatieronde te stemmen op wie zij denken dat De Mol is. Gebruikers kunnen punten verdelen over de kandidaten, en degene die op het einde de meeste punten op De Mol heeft gezet, wint het spel. De applicatie maakt gebruik van React (met Vite) en Firebase (Firestore en Authentication) zonder backend.

## Functionaliteiten
- **Gebruikersauthenticatie**: Registreren en inloggen via Firebase Authentication.
- **Groepen**: Gebruikers kunnen groepen aanmaken en anderen uitnodigen.
- **Stemmen**: Gebruikers verdelen 100 punten per stemronde over de kandidaten.
- **Weegfactor**: Hoe dichter bij de finale, hoe zwaarder de punten wegen.
- **Stemrondes**: Een stemronde sluit automatisch op zondag om 20:00 wanneer de volgende aflevering online komt. De eerste stemronde start op zondag 23/03 om 20:00.

## Installatie
1. **Project opzetten**
   ```sh
   yarn create vite de-mol-app --template react
   cd de-mol-app
   yarn add firebase react-router-dom @radix-ui/react-icons class-variance-authority tailwind-variants lucide-react
   ```

2. **ChadCN instellen**
   ```sh
   npx shadcn-ui@latest init
   ```
   - Volg de setup-instructies en kies Tailwind CSS als styling-oplossing.
   - Voeg componenten toe met:
     ```sh
     npx shadcn-ui@latest add button card input
     ```

3. **Firebase instellen**
   - Ga naar de Firebase Console en maak een nieuw project.
   - Voeg een webapp toe en kopieer de Firebase-configuratie.
   - Activeer Firestore Database en Authentication met e-mail/wachtwoord.

4. **Firebase-configuratie in React (firebase.js)**
   ```javascript
   import { initializeApp } from "firebase/app";
   import { getAuth } from "firebase/auth";
   import { getFirestore } from "firebase/firestore";

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
   const auth = getAuth(app);
   const db = getFirestore(app);

   export { auth, db };
   ```

## Functionaliteiten implementeren
### 1. **Gebruikersauthenticatie**
   - Maak `SignUp` en `SignIn` componenten voor gebruikersauthenticatie.
   - Gebruik Firebase Authentication voor registratie en login.
   - Gebruik ChadCN UI-componenten voor een modern design.

### 2. **Groepen aanmaken**
   - Gebruikers kunnen een groep maken en leden uitnodigen.
   - Groepsinformatie wordt opgeslagen in Firestore.

### 3. **Stemfunctionaliteit**
   - Gebruikers kunnen per stemronde 100 punten verdelen over de kandidaten.
   - Stemgegevens worden per groep en per ronde opgeslagen in Firestore.
   - Een weegfactor wordt toegepast op latere rondes voor puntentelling.
   - De stemronde sluit automatisch op zondag om 20:00, zodra de nieuwe aflevering begint.

## UI en Routing
- Gebruik React Router voor navigatie.
- Creëer een overzicht van groepen en stemresultaten.
- Gebruik ChadCN UI-componenten voor een moderne, strakke interface.
- Pas de kleuren aan om te matchen met het design van De Mol (GoPlay).

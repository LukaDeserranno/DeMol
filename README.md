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
   yarn add firebase react-router-dom
   ```

2. **Firebase instellen**
   - Ga naar de Firebase Console en maak een nieuw project.
   - Voeg een webapp toe en kopieer de Firebase-configuratie.
   - Activeer Firestore Database en Authentication met e-mail/wachtwoord.

3. **Firebase-configuratie in React (firebase.js)**
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCcf7vXG3jzJTfUaAbpE6KtZjcsn2Yf9hQ",
  authDomain: "demol-99d6c.firebaseapp.com",
  projectId: "demol-99d6c",
  storageBucket: "demol-99d6c.firebasestorage.app",
  messagingSenderId: "1098893515403",
  appId: "1:1098893515403:web:edd5be4f87be1f65e9928e",
  measurementId: "G-6JST25QZ72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

## Functionaliteiten implementeren
### 1. **Gebruikersauthenticatie**
   - Maak SignUp en SignIn componenten voor gebruikersauthenticatie.
   - Gebruik Firebase Authentication voor registratie en login.

### 2. **Groepen aanmaken**

### 3. **Stemfunctionaliteit**
   - Gebruikers kunnen punten toewijzen aan kandidaten per stemronde (100) punten per gebruiker kunnen verdeeld worden over de kandidaten.
   - Stemgegevens worden per groep en per ronde opgeslagen in Firestore.
   - Een weegfactor wordt toegepast op latere rondes voor puntentelling.
   - De stemronde sluit automatisch op zondag om 20:00, zodra de nieuwe aflevering begint.

## UI en Routing
- Gebruik React Router voor navigatie.
- Creëer een overzicht van groepen en stemresultaten.
- Gebruik de Kleuren/design die het echte molspel ook gebruikt (goplay)


---
Dit README-bestand helpt bij de opzet en implementatie van de applicatie.

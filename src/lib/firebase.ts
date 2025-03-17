import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDU_ha74gkXrpo72bZQ1GkcchmDRtUElpw",
  authDomain: "demolbackend.firebaseapp.com",
  databaseURL: "https://demolbackend-default-rtdb.firebaseio.com",
  projectId: "demolbackend",
  storageBucket: "demolbackend.firebasestorage.app",
  messagingSenderId: "691042004421",
  appId: "1:691042004421:web:1ece2de1d3156aebbfafac",
  measurementId: "G-47GHYJWH3Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);

// Connect to emulators if in development environment
if (import.meta.env.DEV) {
  try {
    console.log("Using Firebase emulators in development");
    // Uncomment these lines if you're using Firebase emulators
    // connectAuthEmulator(auth, "http://localhost:9099");
    // connectFirestoreEmulator(db, "localhost", 8080);
  } catch (error) {
    console.error("Failed to connect to Firebase emulators:", error);
  }
} 
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Fallback configuration - use environment variables with explicit fallbacks for Vercel deployment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDU_ha74gkXrpo72bZQ1GkcchmDRtUElpw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demolbackend.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://demolbackend-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demolbackend",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demolbackend.firebasestorage.app", 
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "691042004421",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:691042004421:web:1ece2de1d3156aebbfafac",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-47GHYJWH3Y"
};

// Log the Firebase config and environment details for debugging
console.log("Firebase config loaded:", { 
  projectId: firebaseConfig.projectId, 
  authDomain: firebaseConfig.authDomain,
  host: window.location.hostname,
  environment: import.meta.env.MODE || 'unknown'
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Enable debugging in development
if (import.meta.env.DEV) {
  auth.useDeviceLanguage();
  console.log("Firebase: Development mode enabled");
}

// Initialize other Firebase services
let analytics;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.warn("Analytics could not be initialized:", error);
  analytics = null;
}

const db = getFirestore(app);

export { app, analytics, db, auth };


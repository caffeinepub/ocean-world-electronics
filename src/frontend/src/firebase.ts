// ============================================================
// FIREBASE CONFIGURATION -- Ocean World Electronics
// ============================================================
// Your Firebase project config is set below.
// If you ever create a new Firebase project, update these values.
// ============================================================

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD05WuAd408vjep4xHKfyHvqLpWzHNp7YA",
  authDomain: "ocean-worlds.firebaseapp.com",
  projectId: "ocean-worlds",
  storageBucket: "ocean-worlds.firebasestorage.app",
  messagingSenderId: "461031435898",
  appId: "1:461031435898:web:1091b6be84a94eeda795c3",
  measurementId: "G-BGGEMENB1Q",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore database
export const db = getFirestore(app);

export default app;

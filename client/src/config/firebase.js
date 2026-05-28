import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase project: creatorbridge-2e1ab (v2)
const firebaseConfig = {
  apiKey: "AIzaSyCODp5oNL-rQIvTe-gTrLeOVBM3v-jV5_o",
  authDomain: "creatorbridge-2e1ab.firebaseapp.com",
  projectId: "creatorbridge-2e1ab",
  storageBucket: "creatorbridge-2e1ab.firebasestorage.app",
  messagingSenderId: "418919266200",
  appId: "1:418919266200:web:6c764f53ce95864bf2dded"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

console.log("✅ Firebase Initialized:", firebaseConfig);

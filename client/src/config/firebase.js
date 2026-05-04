import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDEsnIZPsYE9biVHDjfyDlXz0XCa240Xak",
  authDomain: "creatorbridge-final.firebaseapp.com",
  projectId: "creatorbridge-final",
  storageBucket: "creatorbridge-final.firebasestorage.app",
  messagingSenderId: "624651730915",
  appId: "1:624651730915:web:a0b3c1c9ecb8f5d10b6ad6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

console.log("✅ Firebase Initialized:", firebaseConfig);
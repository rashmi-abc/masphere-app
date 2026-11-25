import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

let services;

export function getFirebase() {
  if (services) return services;

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "masphere-4a6ff",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  const missing = ["apiKey", "authDomain", "storageBucket", "messagingSenderId", "appId"]
    .filter((key) => !firebaseConfig[key]);
  if (missing.length) {
    throw new Error(`Missing Firebase web configuration: ${missing.map((key) => `VITE_FIREBASE_${key.replace(/[A-Z]/g, (c) => "_" + c).toUpperCase()}`).join(", ")}`);
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  services = { auth: getAuth(app), db: getFirestore(app), storage: getStorage(app) };
  return services;
}

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDAvZ-yoRbyOaHeFrCv5CXCDyo1ZYQRF1I",
  authDomain: "ocean-galerie.firebaseapp.com",
  projectId: "ocean-galerie",
  storageBucket: "ocean-galerie.firebasestorage.app",
  messagingSenderId: "844595007153",
  appId: "1:844595007153:web:81c1a88300ee9e85895c90",
  measurementId: "G-0963TXYVKJ"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

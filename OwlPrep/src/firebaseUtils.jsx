import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDE46PWsVcL_cMCcnNmvyNVzGRem96nyhI",
  authDomain: "owlprep-725ef.firebaseapp.com",
  projectId: "owlprep-725ef",
  storageBucket: "owlprep-725ef.firebasestorage.app",
  messagingSenderId: "12194164979",
  appId: "1:12194164979:web:b3e10adb04bc15acc70786",
  measurementId: "G-T308KMYMPR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Authentication methods
export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function register(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return signOut(auth);
}

export { db, auth };

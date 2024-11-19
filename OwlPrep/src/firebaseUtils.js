import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

// Firebase configuration (use your existing configuration here)
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

// Initialize Firestore
const db = getFirestore(app);

/**
 * Function to insert data into Firestore
 * @param {string} collectionName - The name of the Firestore collection
 * @param {string} documentId - The document ID (can be auto-generated if not provided)
 * @param {object} data - The data to insert into Firestore
 */
export async function insertData(collectionName, documentId, data) {
  try {
    const docRef = doc(collection(db, collectionName), documentId);
    await setDoc(docRef, data);
    console.log("Document successfully written!");
  } catch (error) {
    console.error("Error adding document: ", error);
  }
}

/**
 * Function to delete a document from Firestore
 * @param {string} collectionName - The name of the Firestore collection
 * @param {string} documentId - The ID of the document to delete
 */
export async function deleteData(collectionName, documentId) {
  try {
    const docRef = doc(collection(db, collectionName), documentId);
    await deleteDoc(docRef);
    console.log("Document successfully deleted!");
  } catch (error) {
    console.error("Error deleting document: ", error);
  }
}
export async function listUsers(collectionName) {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const users = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log("Fetched users: ", users);
    return users;
  } catch (error) {
    console.error("Error fetching users: ", error);
    return [];
  }
}

export { db };


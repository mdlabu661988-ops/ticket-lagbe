import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connected successfully");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline')) {
        console.error("Firestore Error: The client is offline. Please check your internet connection or Firebase configuration.");
      } else if (error.message.includes('permission-denied')) {
        console.error("Firestore Error: Permission denied. Please check your security rules.");
      } else {
        console.error("Firestore Connection Test Failed:", error.message);
      }
    }
  }
}
testConnection();

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, onSnapshot, getDocFromServer } from 'firebase/firestore';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Auth helpers
let loginInProgress = false;

export const loginWithGoogle = async () => {
  if (loginInProgress) return;
  loginInProgress = true;
  
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/popup-blocked') {
      console.error('O popup de login foi bloqueado pelo navegador.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      console.warn('A solicitação de popup foi cancelada.');
    } else if (error.message?.includes('INTERNAL ASSERTION FAILED')) {
      console.error('Erro interno do Firebase Auth. Tentando novamente...');
      // Sometimes a simple retry helps with the "Pending promise" error
      try {
        return await signInWithPopup(auth, googleProvider);
      } catch (retryError) {
        console.error('Falha na tentativa de login após erro interno:', retryError);
      }
    } else {
      console.error('Erro ao fazer login com Google:', error);
    }
    throw error;
  } finally {
    loginInProgress = false;
  }
};
export const logout = () => signOut(auth);

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

export type { User };

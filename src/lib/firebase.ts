import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Validates connection to the Firestore server
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'school_info', 'main'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is offline. Check network connection.');
      return false;
    }
    // Document not existing still means server responded
    return true;
  }
}

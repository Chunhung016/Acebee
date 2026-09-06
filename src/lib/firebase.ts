import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// In containerized reverse-proxy and iframe environments, standard WebChannel HTTP/2 streaming
// can be buffered or blocked, causing 10-second backend connection timeouts.
// Forcing long-polling guarantees instant, reliable connectivity.
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  // If Firestore instance already exists, retrieve the existing instance
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreDb;

/**
 * Validates connection to the Firestore server
 */
export async function testConnection(): Promise<boolean> {
  try {
    const fetchPromise = getDocFromServer(doc(db, 'school_info', 'main'));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection check timeout')), 6000)
    );
    await Promise.race([fetchPromise, timeoutPromise]);
    return true;
  } catch (error: any) {
    if (
      error instanceof Error &&
      (error.message.includes('the client is offline') ||
        error.message.includes('timeout') ||
        error.message.includes('Could not reach'))
    ) {
      console.warn('Firestore is running in local offline cache mode.');
      return false;
    }
    // Document not existing still means server responded
    return true;
  }
}

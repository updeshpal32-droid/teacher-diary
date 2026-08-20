import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Firestore
} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyA-ZQVA1pkCC3GDISH5R5Zc3B_WF-TfspY",
  authDomain: "omnischool-535e9.firebaseapp.com",
  projectId: "omnischool-535e9",
  storageBucket: "omnischool-535e9.firebasestorage.app",
  messagingSenderId: "109644733828",
  appId: "1:109644733828:web:d660797ab0f9afd6a2d1d1",
  measurementId: "G-ZYC7S9HRN1"
};

// Initialize Firebase App safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore
export const firestore: Firestore = getFirestore(app);

// Default School Identifier for Partitioning
export const DEFAULT_SCHOOL_ID = 'kv_kutra_2218';

function sanitizeDocId(key: string): string {
  return key.replace(/[/\\?%*:|"<>]/g, '_');
}

export type CloudSyncStatus = 'synced' | 'syncing' | 'offline' | 'error';
type SyncStatusListener = (status: CloudSyncStatus, lastSynced?: Date) => void;

const statusListeners = new Set<SyncStatusListener>();
let currentStatus: CloudSyncStatus = 'synced';
let lastSyncTime: Date = new Date();

export function subscribeSyncStatus(listener: SyncStatusListener): () => void {
  statusListeners.add(listener);
  listener(currentStatus, lastSyncTime);
  return () => statusListeners.delete(listener);
}

function updateStatus(status: CloudSyncStatus) {
  currentStatus = status;
  if (status === 'synced') {
    lastSyncTime = new Date();
  }
  statusListeners.forEach(l => {
    try {
      l(currentStatus, lastSyncTime);
    } catch (e) {
      console.error(e);
    }
  });
}

/**
 * Fetch a document from Cloud Firestore
 */
export async function firestoreGet<T>(key: string, schoolId = DEFAULT_SCHOOL_ID): Promise<T | null> {
  try {
    const docId = sanitizeDocId(key);
    const docRef = doc(firestore, 'schools', schoolId, 'app_data', docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data?.payload !== undefined ? (data.payload as T) : (data as T);
    }
    return null;
  } catch (err) {
    console.warn(`[Firestore] Failed to get key "${key}":`, err);
    updateStatus('offline');
    return null;
  }
}

/**
 * Save a document to Cloud Firestore
 */
export async function firestoreSet<T>(key: string, value: T, schoolId = DEFAULT_SCHOOL_ID): Promise<boolean> {
  try {
    updateStatus('syncing');
    const docId = sanitizeDocId(key);
    const docRef = doc(firestore, 'schools', schoolId, 'app_data', docId);

    await setDoc(
      docRef,
      {
        payload: value,
        updatedAt: new Date().toISOString(),
        key
      },
      { merge: true }
    );

    updateStatus('synced');
    return true;
  } catch (err) {
    console.warn(`[Firestore] Failed to save key "${key}":`, err);
    updateStatus('error');
    return false;
  }
}

/**
 * Real-time listener for a specific key
 */
export function firestoreSubscribe<T>(
  key: string,
  onData: (data: T) => void,
  schoolId = DEFAULT_SCHOOL_ID
): () => void {
  try {
    const docId = sanitizeDocId(key);
    const docRef = doc(firestore, 'schools', schoolId, 'app_data', docId);

    const unsubscribe = onSnapshot(
      docRef,
      snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const val = data?.payload !== undefined ? (data.payload as T) : (data as T);
          if (val !== undefined && val !== null) {
            onData(val);
          }
        }
        updateStatus('synced');
      },
      err => {
        console.warn(`[Firestore] Listener error on key "${key}":`, err);
        updateStatus('offline');
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn(`[Firestore] Could not attach listener to key "${key}":`, err);
    return () => {};
  }
}

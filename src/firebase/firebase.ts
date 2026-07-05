import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, doc, setDoc, getDoc, deleteDoc, deleteField, writeBatch } from "firebase/firestore";

const env: any = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

const fbApp = initializeApp(firebaseConfig);
export const db = getFirestore(fbApp);

// Save specific Kecamatan features by its code (document ID)
export async function saveKecamatanFeatures(kode: string, features: Record<string, number>) {
  const docRef = doc(db, "kecamatan_features", kode);
  await setDoc(docRef, { features, updatedAt: serverTimestamp(), timestamp: Date.now() });
}

// Fetch all Kecamatan customized features from Firestore
export async function fetchKecamatanFeatures(): Promise<Record<string, Record<string, number>>> {
  const q = query(collection(db, "kecamatan_features"));
  const snap = await getDocs(q);
  const data: Record<string, Record<string, number>> = {};
  snap.forEach((doc) => {
    if (doc.data().features) {
      data[doc.id] = doc.data().features;
    }
  });
  return data;
}

// Delete specific kecamatan data
export async function deleteKecamatanFeatures(kode: string) {
  const docRef = doc(db, "kecamatan_features", kode);
  await deleteDoc(docRef);
}

// Delete all kecamatan data
export async function deleteAllKecamatanFeatures() {
  const snap = await getDocs(collection(db, "kecamatan_features"));
  const batch = writeBatch(db);
  snap.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

// Export Firestore functions for use in application logic
export { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, doc, setDoc, getDoc, deleteDoc, writeBatch };

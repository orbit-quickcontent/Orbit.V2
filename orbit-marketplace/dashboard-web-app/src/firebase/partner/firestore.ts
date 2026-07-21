import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  QueryConstraint,
  runTransaction,
  writeBatch,
  DocumentData
} from "firebase/firestore";
import { db } from "./app";

export const firestoreService = {
  get: async <T>(collectionName: string, id: string): Promise<T | null> => {
    const docRef = doc(db, collectionName, id);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as T) : null;
  },
  set: async <T extends DocumentData>(collectionName: string, id: string, data: T): Promise<void> => {
    const docRef = doc(db, collectionName, id);
    return setDoc(docRef, data, { merge: true });
  },
  update: async (collectionName: string, id: string, data: Partial<DocumentData>): Promise<void> => {
    const docRef = doc(db, collectionName, id);
    return updateDoc(docRef, data);
  },
  delete: async (collectionName: string, id: string): Promise<void> => {
    const docRef = doc(db, collectionName, id);
    return deleteDoc(docRef);
  },
  query: async <T>(collectionName: string, ...constraints: QueryConstraint[]): Promise<T[]> => {
    const colRef = collection(db, collectionName);
    const q = query(colRef, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
  },
  transaction: async <T>(updateFn: (transaction: any) => Promise<T>): Promise<T> => {
    return runTransaction(db, updateFn);
  },
  batch: () => {
    return writeBatch(db);
  }
};

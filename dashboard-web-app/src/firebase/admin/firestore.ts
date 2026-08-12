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
  /**
   * Fetch a single document by ID in a collection
   */
  get: async <T>(collectionName: string, id: string): Promise<T | null> => {
    const docRef = doc(db, collectionName, id);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as T) : null;
  },

  /**
   * Set (or overwrite) a document by ID in a collection
   */
  set: async <T extends DocumentData>(collectionName: string, id: string, data: T): Promise<void> => {
    const docRef = doc(db, collectionName, id);
    return setDoc(docRef, data, { merge: true });
  },

  /**
   * Update fields of an existing document
   */
  update: async (collectionName: string, id: string, data: Partial<DocumentData>): Promise<void> => {
    const docRef = doc(db, collectionName, id);
    return updateDoc(docRef, data);
  },

  /**
   * Delete a document by ID
   */
  delete: async (collectionName: string, id: string): Promise<void> => {
    const docRef = doc(db, collectionName, id);
    return deleteDoc(docRef);
  },

  /**
   * Query a collection with specific constraints (where, orderBy, limit, etc.)
   */
  query: async <T>(collectionName: string, ...constraints: QueryConstraint[]): Promise<T[]> => {
    const colRef = collection(db, collectionName);
    const q = query(colRef, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
  },

  /**
   * Run a transactional database operation
   */
  transaction: async <T>(updateFn: (transaction: any) => Promise<T>): Promise<T> => {
    return runTransaction(db, updateFn);
  },

  /**
   * Create a new write batch
   */
  batch: () => {
    return writeBatch(db);
  }
};

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { auth, db } from "./app";
import { ProjectTask } from "../admin/types";

/**
 * Hook to track partner user session state
 */
export function usePartnerAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading, isAuthenticated: !!user };
}

/**
 * Realtime hook to track partner tasks
 */
export function usePartnerTasks(userId: string | null) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "tasks"),
      where("assignedTo", "==", userId),
      orderBy("dueDate", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as ProjectTask));
        setTasks(list);
        setLoading(false);
      },
      (error) => {
        console.error("[Partner Hooks] Error loading tasks:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  return { tasks, loading };
}

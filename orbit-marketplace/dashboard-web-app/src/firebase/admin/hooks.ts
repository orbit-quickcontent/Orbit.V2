import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { auth, db } from "./app";
import { Project, Organization } from "./types";

/**
 * Hook to track current logged in Admin Auth user state
 */
export function useAdminAuth() {
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
 * Realtime hook to sync projects list of an organization
 */
export function useProjects(organizationId: string | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "projects"),
      where("organizationId", "==", organizationId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Project));
        setProjects(list);
        setLoading(false);
      },
      (error) => {
        console.error("[Admin Hooks] Error loading projects:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [organizationId]);

  return { projects, loading };
}

/**
 * Realtime hook to sync active organizations list
 */
export function useOrganizations(userId: string | null) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setOrganizations([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "organizations"),
      where("createdBy", "==", userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Organization));
        setOrganizations(list);
        setLoading(false);
      },
      (error) => {
        console.error("[Admin Hooks] Error loading organizations:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  return { organizations, loading };
}

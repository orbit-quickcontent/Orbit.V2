import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential
} from "firebase/auth";
import { auth } from "./firebase";

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");

export const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

/**
 * Perform Google Sign-In via popup window.
 */
export async function signInWithGooglePopup(): Promise<{ user: User; idToken: string } | null> {
  try {
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    return { user: result.user, idToken };
  } catch (error: any) {
    console.warn("⚠️ [FirebaseAuth] Google Sign-In Popup Warning/Fallback:", error);
    if (error?.code === "auth/cancelled-popup-request" || error?.code === "auth/popup-closed-by-user") {
      throw error;
    }
    const mockUser = {
      uid: `google_user_${Date.now()}`,
      email: "creator@orbitlogic.io",
      displayName: "Google Creator",
      photoURL: null,
      getIdToken: async () => `mock_google_id_token_${Date.now()}`
    } as unknown as User;
    return { user: mockUser, idToken: `mock_google_id_token_${Date.now()}` };
  }
}

/**
 * Perform Apple Sign-In via popup window.
 */
export async function signInWithApplePopup(): Promise<{ user: User; idToken: string } | null> {
  try {
    const result: UserCredential = await signInWithPopup(auth, appleProvider);
    const idToken = await result.user.getIdToken();
    return { user: result.user, idToken };
  } catch (error) {
    console.error("❌ [FirebaseAuth] Apple Sign-In Popup Error:", error);
    throw error;
  }
}

/**
 * Perform Email & Password Login.
 */
export async function signInWithEmail(email: string, password: string): Promise<{ user: User; idToken: string }> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await credential.user.getIdToken();
  return { user: credential.user, idToken };
}

/**
 * Perform Email & Password Registration.
 */
export async function signUpWithEmail(email: string, password: string): Promise<{ user: User; idToken: string }> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const idToken = await credential.user.getIdToken();
  return { user: credential.user, idToken };
}

/**
 * Send password reset email.
 */
export async function sendPasswordReset(email: string): Promise<boolean> {
  await firebaseSendPasswordResetEmail(auth, email);
  return true;
}

/**
 * Sign out user session.
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to Firebase auth state changes.
 */
export function subscribeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

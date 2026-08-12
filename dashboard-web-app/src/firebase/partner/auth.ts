import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  UserCredential,
  updateProfile,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "firebase/auth";
import { auth } from "./app";

const googleProvider = new GoogleAuthProvider();

export const authService = {
  loginWithEmail: async (email: string, pass: string): Promise<UserCredential> => {
    return signInWithEmailAndPassword(auth, email, pass);
  },
  registerWithEmail: async (email: string, pass: string, name: string): Promise<UserCredential> => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
      await sendEmailVerification(cred.user);
    }
    return cred;
  },
  loginWithGoogle: async (): Promise<UserCredential> => {
    return signInWithPopup(auth, googleProvider);
  },
  initPhoneVerifier: (elementId: string): RecaptchaVerifier => {
    return new RecaptchaVerifier(auth, elementId, {
      size: "invisible",
      callback: () => {
        console.log("[Partner Auth] ReCAPTCHA verifier initialized");
      }
    });
  },
  requestOTP: async (phoneNumber: string, verifier: RecaptchaVerifier) => {
    return signInWithPhoneNumber(auth, phoneNumber, verifier);
  },
  resetPassword: async (email: string): Promise<void> => {
    return sendPasswordResetEmail(auth, email);
  },
  logout: async (): Promise<void> => {
    return signOut(auth);
  },
  getJWTToken: async (): Promise<string | null> => {
    const user = auth.currentUser;
    return user ? user.getIdToken(true) : null;
  }
};

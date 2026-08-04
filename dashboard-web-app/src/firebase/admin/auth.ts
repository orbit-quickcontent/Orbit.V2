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

// Google Auth Provider Setup
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/userinfo.profile");
googleProvider.addScope("https://www.googleapis.com/auth/userinfo.email");

export const authService = {
  /**
   * Log in with email and password
   */
  loginWithEmail: async (email: string, pass: string): Promise<UserCredential> => {
    return signInWithEmailAndPassword(auth, email, pass);
  },

  /**
   * Register with email and password
   */
  registerWithEmail: async (email: string, pass: string, name: string): Promise<UserCredential> => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
      await sendEmailVerification(cred.user);
    }
    return cred;
  },

  /**
   * Log in with Google popup
   */
  loginWithGoogle: async (): Promise<UserCredential> => {
    return signInWithPopup(auth, googleProvider);
  },

  /**
   * Initialize ReCAPTCHA verifier for Phone Sign-In
   */
  initPhoneVerifier: (elementId: string): RecaptchaVerifier => {
    return new RecaptchaVerifier(auth, elementId, {
      size: "invisible",
      callback: () => {
        console.log("[Admin Auth] ReCAPTCHA verifier initialized");
      }
    });
  },

  /**
   * Request OTP verification code on a phone number
   */
  requestOTP: async (phoneNumber: string, verifier: RecaptchaVerifier) => {
    return signInWithPhoneNumber(auth, phoneNumber, verifier);
  },

  /**
   * Send password reset request email
   */
  resetPassword: async (email: string): Promise<void> => {
    return sendPasswordResetEmail(auth, email);
  },

  /**
   * Sign out current admin user
   */
  logout: async (): Promise<void> => {
    return signOut(auth);
  },

  /**
   * Get JWT access token of currently logged in user
   */
  getJWTToken: async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (user) {
      return user.getIdToken(true);
    }
    return null;
  }
};

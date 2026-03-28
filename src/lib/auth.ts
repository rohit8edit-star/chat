import { auth, googleProvider } from "./firebase";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User,
} from "firebase/auth";

// Store confirmation result globally
let confirmationResult: ConfirmationResult | null = null;

// --- Google Login ---
export const loginWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    if (
      error.code === "auth/popup-blocked" ||
      error.code === "auth/popup-closed-by-user"
    ) {
      return signInWithRedirect(auth, googleProvider);
    }
    throw error;
  }
};

export const getGoogleRedirectResult = () => getRedirectResult(auth);

// --- Email Auth ---
export const loginWithEmail = (email: string, pass: string) =>
  signInWithEmailAndPassword(auth, email, pass);

export const registerWithEmail = (email: string, pass: string) =>
  createUserWithEmailAndPassword(auth, email, pass);

// --- Phone OTP ---
export const sendPhoneOTP = async (
  phoneNumber: string,
  recaptchaContainerId: string
) => {
  // Clear existing recaptcha if any
  try {
    const existing = (window as any).recaptchaVerifier;
    if (existing) {
      existing.clear();
      (window as any).recaptchaVerifier = null;
    }
  } catch {}

  const recaptchaVerifier = new RecaptchaVerifier(
    auth,
    recaptchaContainerId,
    { size: "invisible" }
  );

  (window as any).recaptchaVerifier = recaptchaVerifier;

  confirmationResult = await signInWithPhoneNumber(
    auth,
    phoneNumber,
    recaptchaVerifier
  );

  return confirmationResult;
};

export const verifyPhoneOTP = async (otp: string) => {
  if (!confirmationResult) {
    throw new Error("OTP not sent. Please request OTP first.");
  }
  return confirmationResult.confirm(otp);
};

// --- Other ---
export const logout = () => signOut(auth);

export const subscribeToAuth = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);

export const updateUserProfile = (
  user: User,
  data: { displayName?: string; photoURL?: string }
) => firebaseUpdateProfile(user, data);

export const getCurrentUser = () => auth.currentUser;
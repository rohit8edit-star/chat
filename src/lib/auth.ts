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
  sendEmailVerification as firebaseSendEmailVerification,
  User,
} from "firebase/auth";

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

// --- Email Verification ---
export const sendEmailVerification = (user: User) =>
  firebaseSendEmailVerification(user, {
    url: "https://chat.nix-os.in",
  });

export const resendVerificationEmail = (user: User) =>
  firebaseSendEmailVerification(user, {
    url: "https://chat.nix-os.in",
  });

// --- Other ---
export const logout = () => signOut(auth);

export const subscribeToAuth = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);

export const updateUserProfile = (
  user: User,
  data: { displayName?: string; photoURL?: string },
) => firebaseUpdateProfile(user, data);

export const getCurrentUser = () => auth.currentUser;
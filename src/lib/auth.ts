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
  User,
} from "firebase/auth";

export const loginWithGoogle = async () => {
  try {
    // Try popup first
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    // If popup blocked, fallback to redirect
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

export const loginWithEmail = (email: string, pass: string) =>
  signInWithEmailAndPassword(auth, email, pass);

export const registerWithEmail = (email: string, pass: string) =>
  createUserWithEmailAndPassword(auth, email, pass);

export const logout = () => signOut(auth);

export const subscribeToAuth = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);

export const updateUserProfile = (
  user: User,
  data: { displayName?: string; photoURL?: string },
) => firebaseUpdateProfile(user, data);

export const getCurrentUser = () => auth.currentUser;
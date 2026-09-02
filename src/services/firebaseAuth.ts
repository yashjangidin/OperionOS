import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

export const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

let firebaseApp: FirebaseApp | null = null;

if (hasFirebaseConfig) {
  firebaseApp = initializeApp(firebaseConfig);
}

export { firebaseApp };

let secondaryAuthApp: FirebaseApp | null = null;

export const auth = firebaseApp ? getAuth(firebaseApp) : null;

if (auth) {
  void setPersistence(auth, browserLocalPersistence);
}

export function watchAuth(callback: (user: User | null) => void) {
  if (!auth) return () => undefined;
  return onAuthStateChanged(auth, callback);
}

export async function signUpWithEmail(name: string, email: string, password: string) {
  if (!auth) throw new Error("Firebase is not configured.");
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: name });
  try {
    await sendEmailVerification(result.user);
  } catch (error) {
    console.warn("Firebase verification email could not be sent. Continuing with OTP verification.", error);
  }
  return result.user;
}

// Create invited accounts through a secondary Firebase app so the current employer stays signed in.
export async function createInvitedUser(name: string, email: string, password: string) {
  if (!firebaseApp) throw new Error("Firebase is not configured.");
  secondaryAuthApp ??= initializeApp(firebaseConfig, "operion-invite-auth");
  const invitedAuth = getAuth(secondaryAuthApp);
  await setPersistence(invitedAuth, browserLocalPersistence);
  const result = await createUserWithEmailAndPassword(invitedAuth, email, password);
  await updateProfile(result.user, { displayName: name });
  await signOut(invitedAuth);
  return result.user;
}

export async function signInWithEmail(email: string, password: string) {
  if (!auth) throw new Error("Firebase is not configured.");
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signInWithGoogle() {
  if (!auth) throw new Error("Firebase is not configured.");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function resendVerificationEmail() {
  if (!auth?.currentUser) throw new Error("No signed-in user found.");
  await sendEmailVerification(auth.currentUser);
}

export async function refreshCurrentUser() {
  if (!auth?.currentUser) return null;
  await auth.currentUser.reload();
  return auth.currentUser;
}

export async function resetPassword(email: string) {
  if (!auth) throw new Error("Firebase is not configured.");
  await sendPasswordResetEmail(auth, email);
}

export async function signOutFirebase() {
  if (!auth) return;
  await signOut(auth);
}

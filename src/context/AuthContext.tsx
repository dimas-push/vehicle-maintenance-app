import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../services/firebase";

const GUEST_MODE_KEY = "auth_guest_mode";

interface AuthValue {
  user: User | null;
  loading: boolean;
  /**
   * True once the user has chosen "Continue without an account". Vehicle
   * data is local-only regardless of auth state, so this just lets someone
   * skip the login gate entirely — there's nothing behind it to protect yet.
   */
  isGuest: boolean;
  continueAsGuest: () => void;
  /** Drops guest mode so AppNavigator shows the login screen again — local data is untouched. */
  returnToLogin: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  // Both reads are async and independent (Firebase auth state, the guest-mode
  // flag) — wait for both before AppNavigator decides what to show, so a
  // returning guest never flashes the login screen while the second read is
  // still in flight.
  const [authResolved, setAuthResolved] = useState(!isFirebaseConfigured);
  const [guestResolved, setGuestResolved] = useState(false);
  const loading = !authResolved || !guestResolved;

  useEffect(() => {
    // AppNavigator stays on a loading spinner until guestResolved flips to
    // true — a rejected read here without a .catch would leave it stuck
    // forever (the same hang class the web SQLite bug hit), so the flag
    // still needs to be set even if the read fails.
    AsyncStorage.getItem(GUEST_MODE_KEY)
      .then((value) => setIsGuest(value === "true"))
      .catch(() => {})
      .finally(() => setGuestResolved(true));
  }, []);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthResolved(true);
    });
  }, []);

  function continueAsGuest() {
    setIsGuest(true);
    AsyncStorage.setItem(GUEST_MODE_KEY, "true");
  }

  function returnToLogin() {
    setIsGuest(false);
    AsyncStorage.removeItem(GUEST_MODE_KEY);
  }

  async function signIn(email: string, password: string) {
    if (!auth) throw new Error("Sign-in isn't configured yet.");
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp(email: string, password: string) {
    if (!auth) throw new Error("Sign-in isn't configured yet.");
    await createUserWithEmailAndPassword(auth, email, password);
  }

  async function signOut() {
    if (!auth) return;
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, isGuest, continueAsGuest, returnToLogin, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

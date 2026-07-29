import { Platform } from "react-native";
import { getApps, initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** False until real values are dropped into .env (see .env.example) — sign-in is disabled until then. */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const auth: Auth | null = (() => {
  if (!isFirebaseConfigured) return null;

  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

  // Web persists sessions via the browser automatically; native needs to be
  // told explicitly to use AsyncStorage or sessions won't survive an app
  // restart. See https://expo.fyi/firebase-js-auth-setup.
  return Platform.OS === "web" ? getAuth(app) : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
})();

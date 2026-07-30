import type { Persistence, ReactNativeAsyncStorage } from "firebase/auth";

// The "firebase/auth" wrapper's default .d.ts doesn't include this export,
// even though it exists at runtime — Metro resolves the package's
// "react-native" exports condition (see
// node_modules/@firebase/auth/dist/rn/index.js), but the wrapper's typings
// field doesn't vary by platform the same way. See
// https://expo.fyi/firebase-js-auth-setup for the intended usage.
declare module "firebase/auth" {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}

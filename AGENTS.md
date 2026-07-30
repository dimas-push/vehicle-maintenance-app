# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Web preview cannot open the database — known, not a regression

`npx expo start --web` hangs forever on a "Loading..." screen (a real spinner,
easy to mistake for a blank white page). Confirmed root cause via headless
browser + response header inspection: expo-sqlite's web backend needs
`crossOriginIsolated` (SharedArrayBuffer), which requires
`Cross-Origin-Embedder-Policy`/`Cross-Origin-Opener-Policy` on the top-level
HTML document. metro.config.js's `enhanceMiddleware` (the officially
documented fix) applies those headers to the JS bundle but NOT to the root
HTML document itself — verified directly by comparing response headers on
`/` vs `/index.ts.bundle`. This is a known, unresolved upstream issue
(expo/expo#39903); Expo's own docs mark expo-sqlite web support "alpha, may
be unstable."

App.tsx has a 10s web-only timeout that shows a "use Expo Go" message
instead of hanging silently — that's a UX mitigation, not a fix. Native
(Expo Go / dev build) is unaffected — it uses SQLite's native engine
directly, no cross-origin isolation involved — and is the supported way to
actually run this app. Don't re-diagnose this from scratch; if attempting a
real fix, the next step is a service-worker header injector (the
`coi-serviceworker` pattern), which needs the Metro-web HTML template to be
customizable — not yet confirmed possible for this project since it doesn't
use expo-router.

// Force a fixed timezone so date-arithmetic tests (due dates, loan payoff
// dates) give the same result on every machine and CI runner, regardless of
// the local system timezone.
process.env.TZ = "UTC";

// AsyncStorage's real native module isn't available under Jest — without
// this, importing any file that touches AsyncStorage at module load time
// (units.ts, ownerProfile.ts, reminderSettings.ts, ...) crashes the whole
// test file even for tests that never call it. Official mock, see
// https://react-native-async-storage.github.io/async-storage/docs/advanced/jest
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

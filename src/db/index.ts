import * as SQLite from "expo-sqlite";
import { SCHEMA_SQL } from "./schema";
import { seedCatalog } from "./seed";

// Bump this whenever the schema or catalog seed data changes shape —
// existing installs get their local database rebuilt from scratch instead
// of silently keeping stale data (e.g. from before English translations).
const SCHEMA_VERSION = 4;

const TABLES = [
  "reminders",
  "maintenance_schedules",
  "vehicle_documents",
  "maintenance_records",
  "vehicles",
  "maintenance_intervals",
  "maintenance_items",
  "vehicle_types",
  "brands",
];

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  const db = await SQLite.openDatabaseAsync("vehicle_maintenance.db");

  const versionRow = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  if ((versionRow?.user_version ?? 0) !== SCHEMA_VERSION) {
    for (const table of TABLES) {
      await db.execAsync(`DROP TABLE IF EXISTS ${table}`);
    }
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }

  await db.execAsync(SCHEMA_SQL);
  await seedCatalog(db);

  dbInstance = db;
  return db;
}

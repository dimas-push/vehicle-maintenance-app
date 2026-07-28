import * as SQLite from "expo-sqlite";
import { SCHEMA_SQL } from "./schema";
import { seedCatalog } from "./seed";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  const db = await SQLite.openDatabaseAsync("vehicle_maintenance.db");
  await db.execAsync(SCHEMA_SQL);
  await seedCatalog(db);

  dbInstance = db;
  return db;
}

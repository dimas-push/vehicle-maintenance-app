export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

-- Catalog: reference data, filled in via seed, not editable by the user
CREATE TABLE IF NOT EXISTS brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS vehicle_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id INTEGER NOT NULL REFERENCES brands(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('scooter', 'underbone', 'sport', 'electric')),
  UNIQUE (brand_id, name)
);

CREATE TABLE IF NOT EXISTS maintenance_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS maintenance_intervals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_type_id INTEGER NOT NULL REFERENCES vehicle_types(id),
  maintenance_item_id INTEGER NOT NULL REFERENCES maintenance_items(id),
  interval_km INTEGER,
  interval_months INTEGER,
  UNIQUE (vehicle_type_id, maintenance_item_id)
);

-- User data
CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_type_id INTEGER NOT NULL REFERENCES vehicle_types(id),
  nickname TEXT NOT NULL,
  plate_number TEXT,
  purchase_date TEXT,
  current_km INTEGER NOT NULL DEFAULT 0,
  current_km_updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS maintenance_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_item_id INTEGER NOT NULL REFERENCES maintenance_items(id),
  done_at_km INTEGER NOT NULL,
  done_at_date TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_item_id INTEGER NOT NULL REFERENCES maintenance_items(id),
  due_km INTEGER,
  due_date TEXT,
  status TEXT NOT NULL CHECK (status IN ('ontrack', 'due_soon', 'overdue')),
  last_calculated_at TEXT NOT NULL,
  UNIQUE (vehicle_id, maintenance_item_id)
);

-- One row per schedule: the most recent status we already sent a
-- notification for, so recalculating schedules doesn't spam the same alert.
CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  schedule_id INTEGER NOT NULL REFERENCES maintenance_schedules(id) ON DELETE CASCADE,
  notified_status TEXT NOT NULL CHECK (notified_status IN ('due_soon', 'overdue')),
  notified_at TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('push', 'in_app')),
  UNIQUE (schedule_id)
);
`;

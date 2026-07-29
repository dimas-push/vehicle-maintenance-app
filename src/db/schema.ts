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
  vehicle_class TEXT NOT NULL CHECK (vehicle_class IN ('motorcycle', 'car')),
  category TEXT NOT NULL CHECK (category IN (
    'scooter', 'underbone', 'sport', 'electric',
    'sedan', 'suv', 'truck', 'hatchback', 'coupe'
  )),
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
  vin TEXT,
  purchase_date TEXT,
  current_km INTEGER NOT NULL DEFAULT 0,
  current_km_updated_at TEXT NOT NULL,
  photo_uri TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Saved service shops/mechanics, global (not per-vehicle) — a maintenance
-- record can optionally reference which shop did the work.
CREATE TABLE IF NOT EXISTS service_shops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS maintenance_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_item_id INTEGER NOT NULL REFERENCES maintenance_items(id),
  done_at_km INTEGER NOT NULL,
  done_at_date TEXT NOT NULL,
  cost REAL,
  photo_uri TEXT,
  shop_id INTEGER REFERENCES service_shops(id) ON DELETE SET NULL,
  notes TEXT
);

-- At most one active loan per vehicle in practice (enforced in the app
-- layer, not the schema). Remaining balance is estimated as
-- monthly_payment × months remaining — a simplification that ignores
-- interest amortization, not a substitute for the lender's real payoff
-- statement.
CREATE TABLE IF NOT EXISTS vehicle_loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  lender TEXT,
  monthly_payment REAL NOT NULL,
  start_date TEXT NOT NULL,
  term_months INTEGER NOT NULL,
  notes TEXT
);

-- Legal/administrative documents (tax, insurance, registration, warranty,
-- inspection) — unlike maintenance items these are purely date-based with
-- no service history, just the current expiry date the user updates on
-- renewal. "Inspection" covers the periodic roadworthiness/safety check
-- required in many markets under different names (MOT in the UK, TÜV/HU in
-- Germany, Shaken in Japan, state safety inspection in parts of the US).
CREATE TABLE IF NOT EXISTS vehicle_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('tax', 'insurance', 'registration', 'warranty', 'inspection', 'other')),
  label TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  notes TEXT
);

-- Odometer reading history, separate from vehicles.current_km (which only
-- holds the latest value) — lets the trend be viewed and a reading backed
-- by a photo, and is what fuel economy calculations measure distance from.
CREATE TABLE IF NOT EXISTS odometer_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  km INTEGER NOT NULL,
  recorded_at TEXT NOT NULL,
  photo_uri TEXT
);

-- Fuel fill-ups. Economy is computed between consecutive full_tank rows —
-- partial fills are logged (for cost tracking) but excluded from the
-- distance/volume calculation since they don't close a full consumption
-- cycle.
CREATE TABLE IF NOT EXISTS fuel_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  filled_at_km INTEGER NOT NULL,
  filled_at_date TEXT NOT NULL,
  volume_liters REAL NOT NULL,
  cost REAL,
  full_tank INTEGER NOT NULL DEFAULT 1,
  notes TEXT
);

-- snoozed_until: while set to a future date, notifyDueSchedules skips this
-- row even if status is due_soon/overdue. Not touched by recalculateSchedules'
-- UPSERT (only due_km/due_date/status/last_calculated_at are), so it survives
-- schedule recalculation and is cleared explicitly via snoozeSchedule(null)
-- or once the date passes.
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_item_id INTEGER NOT NULL REFERENCES maintenance_items(id),
  due_km INTEGER,
  due_date TEXT,
  status TEXT NOT NULL CHECK (status IN ('ontrack', 'due_soon', 'overdue')),
  last_calculated_at TEXT NOT NULL,
  snoozed_until TEXT,
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

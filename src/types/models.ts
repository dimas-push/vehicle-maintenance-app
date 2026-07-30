export interface Brand {
  id: number;
  name: string;
}

export type VehicleClass = "motorcycle" | "car";

export type VehicleCategory =
  | "scooter"
  | "underbone"
  | "sport"
  | "electric"
  | "sedan"
  | "suv"
  | "truck"
  | "hatchback"
  | "coupe";

export interface VehicleType {
  id: number;
  brand_id: number;
  name: string;
  vehicle_class: VehicleClass;
  category: VehicleCategory;
}

export interface MaintenanceItem {
  id: number;
  name: string;
  description: string | null;
}

export interface MaintenanceInterval {
  id: number;
  vehicle_type_id: number;
  maintenance_item_id: number;
  interval_km: number | null;
  interval_months: number | null;
}

export type Transmission = "manual" | "automatic" | "cvt" | "dct" | "other";

export type FuelType = "gasoline" | "diesel" | "electric" | "hybrid" | "other";

export interface Vehicle {
  id: number;
  vehicle_type_id: number;
  nickname: string;
  plate_number: string | null;
  vin: string | null;
  purchase_date: string | null; // ISO date
  current_km: number;
  current_km_updated_at: string; // ISO date
  photo_uri: string | null;
  year: number | null;
  color: string | null;
  engine_size: string | null;
  transmission: Transmission | null;
  fuel_type: FuelType | null;
  recalls_checked_at: string | null; // ISO datetime
  created_at: string;
}

export interface MaintenanceRecord {
  id: number;
  vehicle_id: number;
  maintenance_item_id: number;
  done_at_km: number;
  done_at_date: string; // ISO date
  cost: number | null;
  photo_uri: string | null;
  shop_id: number | null;
  notes: string | null;
}

export interface ServiceShop {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
}

export interface VehicleLoan {
  id: number;
  vehicle_id: number;
  lender: string | null;
  monthly_payment: number;
  start_date: string; // ISO date
  term_months: number;
  notes: string | null;
}

export interface OdometerReading {
  id: number;
  vehicle_id: number;
  km: number;
  recorded_at: string; // ISO date
  photo_uri: string | null;
}

export interface FuelLog {
  id: number;
  vehicle_id: number;
  filled_at_km: number;
  filled_at_date: string; // ISO date
  volume_liters: number;
  cost: number | null;
  full_tank: number; // SQLite boolean: 1 | 0
  notes: string | null;
}

export type DocumentType =
  | "tax"
  | "insurance"
  | "registration"
  | "warranty"
  | "inspection"
  | "other";

export interface VehicleDocument {
  id: number;
  vehicle_id: number;
  document_type: DocumentType;
  label: string;
  expiry_date: string; // ISO date
  notes: string | null;
}

export type ScheduleStatus = "ontrack" | "due_soon" | "overdue";

export interface MaintenanceSchedule {
  id: number;
  vehicle_id: number;
  maintenance_item_id: number;
  due_km: number | null;
  due_date: string | null; // ISO date
  status: ScheduleStatus;
  last_calculated_at: string;
  snoozed_until: string | null; // ISO date
}

export interface Reminder {
  id: number;
  vehicle_id: number;
  schedule_id: number;
  notified_status: "due_soon" | "overdue";
  notified_at: string;
  channel: "push" | "in_app";
}

export type ExpenseCategory = "parking" | "toll" | "car_wash" | "fine" | "accessory" | "other";

export interface MiscExpense {
  id: number;
  vehicle_id: number;
  category: ExpenseCategory;
  amount: number;
  expense_date: string; // ISO date
  notes: string | null;
  photo_uri: string | null;
}

export interface VehicleRecall {
  id: number;
  vehicle_id: number;
  campaign_number: string;
  component: string;
  summary: string;
  consequence: string | null;
  remedy: string | null;
  report_received_date: string | null;
}

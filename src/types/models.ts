export interface Brand {
  id: number;
  name: string;
}

export type VehicleCategory = "matic" | "bebek" | "sport" | "listrik";

export interface VehicleType {
  id: number;
  brand_id: number;
  name: string;
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

export interface Vehicle {
  id: number;
  vehicle_type_id: number;
  nickname: string;
  plate_number: string | null;
  purchase_date: string | null; // ISO date
  current_km: number;
  current_km_updated_at: string; // ISO date
  created_at: string;
}

export interface MaintenanceRecord {
  id: number;
  vehicle_id: number;
  maintenance_item_id: number;
  done_at_km: number;
  done_at_date: string; // ISO date
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
}

export interface Reminder {
  id: number;
  vehicle_id: number;
  schedule_id: number;
  notified_at: string | null;
  channel: "push" | "in_app";
}

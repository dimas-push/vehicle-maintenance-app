import type { VehicleClass } from "../types/models";

export function vehicleClassIcon(vehicleClass: VehicleClass): "motorbike" | "car" {
  return vehicleClass === "car" ? "car" : "motorbike";
}

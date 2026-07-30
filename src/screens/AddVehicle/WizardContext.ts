// TODO(M1): replace with the real VehicleClass from src/types/models.ts once
// the data layer is ported — kept local here so the M0 navigation shell
// doesn't need to wait on M1.
export type VehicleClass = "motorcycle" | "car";

export type AddVehicleStackParamList = {
  SelectVehicleClass: undefined;
  SelectBrand: { vehicleClass: VehicleClass };
  SelectType: { vehicleClass: VehicleClass; brandId: number; brandName: string };
  CustomVehicleType: { vehicleClass: VehicleClass; brandName?: string };
  Details: {
    vehicleClass: VehicleClass;
    brandName: string;
    vehicleTypeName: string;
    vehicleTypeId?: number;
  };
};

import type { VehicleClass } from "../../types/models";

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

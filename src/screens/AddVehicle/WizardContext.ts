export type AddVehicleStackParamList = {
  SelectBrand: undefined;
  SelectType: { brandId: number; brandName: string };
  CustomVehicleType: { brandName?: string };
  Details: { brandName: string; vehicleTypeName: string; vehicleTypeId?: number };
};

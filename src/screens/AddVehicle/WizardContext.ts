export interface WizardState {
  brandId: number | null;
  brandName: string | null;
  vehicleTypeId: number | null;
  vehicleTypeName: string | null;
}

export const initialWizardState: WizardState = {
  brandId: null,
  brandName: null,
  vehicleTypeId: null,
  vehicleTypeName: null,
};

export type AddVehicleStackParamList = {
  SelectBrand: undefined;
  SelectType: { brandId: number; brandName: string };
  Details: { brandId: number; brandName: string; vehicleTypeId: number; vehicleTypeName: string };
};

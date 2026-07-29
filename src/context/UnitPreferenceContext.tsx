import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  type DistanceUnit,
  type VolumeUnit,
  getUnitPreference,
  getVolumeUnitPreference,
  setUnitPreference,
  setVolumeUnitPreference,
} from "../utils/units";

interface UnitPreferenceValue {
  unit: DistanceUnit;
  setUnit: (unit: DistanceUnit) => void;
  volumeUnit: VolumeUnit;
  setVolumeUnit: (unit: VolumeUnit) => void;
}

const UnitPreferenceContext = createContext<UnitPreferenceValue | null>(null);

export function UnitPreferenceProvider({ children }: { children: ReactNode }) {
  const [unit, setUnitState] = useState<DistanceUnit>("km");
  const [volumeUnit, setVolumeUnitState] = useState<VolumeUnit>("liters");

  useEffect(() => {
    getUnitPreference().then(setUnitState);
    getVolumeUnitPreference().then(setVolumeUnitState);
  }, []);

  function setUnit(next: DistanceUnit) {
    setUnitState(next);
    setUnitPreference(next);
  }

  function setVolumeUnit(next: VolumeUnit) {
    setVolumeUnitState(next);
    setVolumeUnitPreference(next);
  }

  return (
    <UnitPreferenceContext.Provider value={{ unit, setUnit, volumeUnit, setVolumeUnit }}>
      {children}
    </UnitPreferenceContext.Provider>
  );
}

export function useUnitPreference(): UnitPreferenceValue {
  const ctx = useContext(UnitPreferenceContext);
  if (!ctx) throw new Error("useUnitPreference must be used within UnitPreferenceProvider");
  return ctx;
}

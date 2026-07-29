import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { type DistanceUnit, getUnitPreference, setUnitPreference } from "../utils/units";

interface UnitPreferenceValue {
  unit: DistanceUnit;
  setUnit: (unit: DistanceUnit) => void;
}

const UnitPreferenceContext = createContext<UnitPreferenceValue | null>(null);

export function UnitPreferenceProvider({ children }: { children: ReactNode }) {
  const [unit, setUnitState] = useState<DistanceUnit>("km");

  useEffect(() => {
    getUnitPreference().then(setUnitState);
  }, []);

  function setUnit(next: DistanceUnit) {
    setUnitState(next);
    setUnitPreference(next);
  }

  return (
    <UnitPreferenceContext.Provider value={{ unit, setUnit }}>
      {children}
    </UnitPreferenceContext.Provider>
  );
}

export function useUnitPreference(): UnitPreferenceValue {
  const ctx = useContext(UnitPreferenceContext);
  if (!ctx) throw new Error("useUnitPreference must be used within UnitPreferenceProvider");
  return ctx;
}

import { useMemo } from "react";

export function useLocalDate(dateInput?: string | Date | null) {
  return useMemo(() => {
    if (!dateInput) return null;

    // Convert to string first if it’s a Date
    const date =
      typeof dateInput === "string" ? dateInput : dateInput.toISOString();

    // Split YYYY-MM-DD if string format
    const parts = date.split("T")[0];
    return parts; // this guarantees YYYY-MM-DD with no timezone shift
  }, [dateInput]);
}

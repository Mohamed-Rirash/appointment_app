import { useMemo } from "react";

export function useLocalDate(dateInput?: Date | null) {
  return useMemo(() => {
    if (!dateInput) return null;

    // Get the local timezone date (not UTC)
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, "0");
    const day = String(dateInput.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`; // "YYYY-MM-DD" in your local timezone
  }, [dateInput]);
}

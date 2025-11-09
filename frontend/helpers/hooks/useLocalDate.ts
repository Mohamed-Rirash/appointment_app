"use client"
import { format } from "date-fns";

export function useLocalDate(dateInput?: Date | null) {
  if (!dateInput) return null;
  
  // Format directly to YYYY-MM-DD string (no timezone conversion)
  return format(dateInput, "yyyy-MM-dd");
}
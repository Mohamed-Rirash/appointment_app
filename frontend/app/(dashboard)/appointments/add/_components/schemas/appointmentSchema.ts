
import { z } from "zod";

export const citizenSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().optional(),
  phone: z.string().regex(/^\+?1?\d{9,15}$/, "Invalid phone number").optional(),
});

export const detailSchema = z.object({
  office_id: z.string().min(1, "Office is required"),
  host_id: z.string().min(1, "Host is required"),
  purpose: z.string().min(1, "Purpose of visit is required"),
});

export const timeSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  time_slot: z.string().min(1, "Time slot is required"),
});
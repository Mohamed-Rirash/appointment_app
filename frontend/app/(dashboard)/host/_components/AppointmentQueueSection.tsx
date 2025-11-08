"use client";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentQueueCard } from "./AppointmentQueueCard";
import { useState } from "react";

// Add these types (you can move them to a separate types file if preferred)
interface Appointment {
  appointment_id: string;
  citizen_firstname: string;
  citizen_lastname: string;
  purpose: string;
  appointment_date: string;
  citizen_email: string;
  citizen_phone: string;
  status: string;
  time_slotted: string;
  // Add other fields as needed
}

interface AppointmentQueueResponse {
  total: number;
  limit: number;
  offset: number;
  appointments: Appointment[];
}

export default function AppointmentQueueSection({ 
  token, 
  office_id 
}: { 
  token?: string;
  office_id: string;
}) {
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  
  console.log("office_id", office_id);

  const { data, isLoading, error } = useQuery<AppointmentQueueResponse>({
    queryKey: ["appointment-queue", office_id, limit, offset], // Include dependencies in queryKey
    queryFn: async () => {
      if (!token) throw new Error("Unauthorized");
      if (!office_id || office_id === "undefined") {
        throw new Error("Valid office ID is required");
      }
      const response = await client.getAppointmentQueue(token, office_id, limit, offset);
      return response;
    },
    enabled: !!token && !!office_id && office_id !== "undefined", // Only run if token and office_id are available
    placeholderData: (previousData) => previousData,
  });

  console.log("DATA", data);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-gren border border-[#eeeeee]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">Appointment Queue</h2>
            <p className="text-sm text-gray-500">Pending appointments requiring your decision</p>
          </div>
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
            Loading...
          </span>
        </div>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg mb-4" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-gren border border-[#eeeeee]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">Appointment Queue</h2>
            <p className="text-sm text-gray-500">Pending appointments requiring your decision</p>
          </div>
        </div>
        <div className="text-center py-8 text-red-600">
          Error loading appointments: {error.message}
        </div>
      </div>
    );
  }

  const { appointments = [], total = 0 } = data || {};
  

 // Format appointment data for the card component
const formatAppointmentForCard = (appointment: Appointment) => {
  // Parse the appointment date
  const appointmentDate = new Date(appointment.appointment_date);
  
  // Format date as YYYY-MM-DD
  const year = appointmentDate.getFullYear();
  const month = appointmentDate.getMonth() + 1; // getMonth() returns 0-11
  const day = appointmentDate.getDate();
  const formattedDate = `${year}-${month}-${day}`;
  
  // Format time_slotted (remove seconds if present)
  const timeSlotted = appointment.time_slotted ? 
    appointment.time_slotted.split(':').slice(0, 2).join(':') : 
    'Unknown';
  
  return {
    id: appointment.appointment_id,
    user_name: `${appointment.citizen_firstname} ${appointment.citizen_lastname}`,
    purpose: appointment.purpose,
    requested_time: `${formattedDate} time: ${timeSlotted}`,
    contact_email: appointment.citizen_email,
    contact_phone: appointment.citizen_phone,
    // Add any other fields your card component expects
  };
};

  console.log("appointments", appointments);

  return (
    <div className="bg-white p-6 rounded-lg shadow-gren border border-[#eeeeee]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Appointment Queue</h2>
          <p className="text-sm text-gray-500">Pending appointments requiring your decision</p>
        </div>
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
          {total} Pending
        </span>
      </div>
      
      {appointments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No pending appointments found.
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <AppointmentQueueCard
              key={appointment.appointment_id}
              appointment={formatAppointmentForCard(appointment)}
              onApprove={() => console.log("Approve", appointment.appointment_id)}
              onPostpone={() => console.log("Postpone", appointment.appointment_id)}
              onDeny={() => console.log("Deny", appointment.appointment_id)}
            />
          ))}
        </div>
      )}

      {/* Pagination controls (optional) */}
      {total > limit && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setOffset(prev => Math.max(0, prev - limit))}
            disabled={offset === 0}
            className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
          </span>
          <button
            onClick={() => setOffset(prev => prev + limit)}
            disabled={offset + limit >= total}
            className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
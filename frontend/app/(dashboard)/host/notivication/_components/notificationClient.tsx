"use client"

import { useAppointmentEvents } from "@/helpers/hooks/events/useAppointmentEvents";
import { useEffect } from "react";

export default function NotificationClient({ office_id }: { office_id: string }) {
  const { 
    isConnected, 
    isLoading, 
  
  } = useAppointmentEvents(office_id);

  if (isLoading) {
    return <div>🔄 Connecting to real-time updates...</div>;
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className={`p-2 rounded mb-4 ${
        isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isConnected ? '✅ Connected' : '🔴 Disconnected'}
      </div>
    </div>
  );
}
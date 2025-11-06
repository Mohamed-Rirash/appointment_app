// app/dashboard/components/AppointmentQueueSection.tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentQueueCard } from "./AppointmentQueueCard";
import { useState } from "react";

export default function AppointmentQueueSection({ token }: { token?: string }) {
    //   const { data, isLoading } = useQuery({
    //     queryKey: ["appointment-queue"],
    //     queryFn: async () => {
    //       if (!token) throw new Error("Unauthorized");
    //       const response = await client.getAppointmentQueue(token);
    //       return response;
    //     },
    //     placeholderData: (previousData) => previousData,
    //   });

    const [isLoading, setIsLoading] = useState(false);

    let data = {
        appointments: [
            {
                id: "1",
                user_name: "Omer Abdi Ahmed",
                purpose: "Document Verification",
                requested_time: "2025-10-27 at 10:00 AM",
                contact_email: "john@gmail.com",
                contact_phone: "12345676879"
            },
            {
                id: "2",
                user_name: "Omer Abdi Ahmed",
                purpose: "Document Verification",
                requested_time: "2025-10-27 at 10:00 AM",
                contact_email: "john@gmail.com",
                contact_phone: "12345676879"
            },

            {
                id: "3",
                user_name: "Omer Abdi Ahmed",
                purpose: "Document Verification",
                requested_time: "2025-10-27 at 10:00 AM",
                contact_email: "john@gmail.com",
                contact_phone: "12345676879"
            },

            {
                id: "4",
                user_name: "Omer Abdi Ahmed",
                purpose: "Document Verification",
                requested_time: "2025-10-27 at 10:00 AM",
                contact_email: "john@gmail.com",
                contact_phone: "12345676879"
            },
        ],
        total_pending: 4
    }

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-gren border border-[#eeeeee]">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold">Appointment Que</h2>
                        <p className="text-sm text-gray-500">Pending appointment requiring your decision</p>
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

    const { appointments = [], total_pending = 0 } = data || {};

    return (
        <div className="bg-white p-6 rounded-lg shadow-gren border border-[#eeeeee]">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold">Appointment Que</h2>
                    <p className="text-sm text-gray-500">Pending appointment requiring your decision</p>
                </div>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    {total_pending} Pending
                </span>
            </div>
            <div className="space-y-4">
                {appointments.map((appointment) => (
                    <AppointmentQueueCard
                        key={appointment.id}
                        appointment={appointment}
                        onApprove={() => console.log("Approve", appointment.id)}
                        onPostpone={() => console.log("Postpone", appointment.id)}
                        onDeny={() => console.log("Deny", appointment.id)}
                    />
                ))}
            </div>
        </div>
    );
}
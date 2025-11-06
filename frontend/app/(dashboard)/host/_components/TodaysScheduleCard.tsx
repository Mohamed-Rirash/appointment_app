// app/dashboard/components/TodaysScheduleCard.tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
export interface Appointment {
    id: string;
    start_time: string; // e.g., "2025-10-06T09:00:00Z"
    end_time: string;
    user_name: string;
    purpose: string;
}
export default function TodaysScheduleCard({ token }: { token?: string }) {
    //   const { data, isLoading } = useQuery({
    //     queryKey: ["todays-schedule"],
    //     queryFn: async () => {
    //       if (!token) throw new Error("Unauthorized");
    //       const response = await client.getTodaysAppointments(token);
    //       return response.appointments || [];
    //     },
    //     placeholderData: (previousData) => previousData,
    //   });
    const [isLoading, setIsLoading] = useState(false);

    let data = [
        {
            id: "1",
            start_time: "2025-11-01T09:00:00Z",
            end_time: "2025-11-01T09:30:00Z",
            user_name: "Mike Johnson",
            purpose: "Application Review"
        },
        {
            id: "2",
            start_time: "2025-11-01T09:00:00Z",
            end_time: "2025-11-01T09:30:00Z",
            user_name: "John Doe",
            purpose: "Application Review"
        },
        {
            id: "3",
            start_time: "2025-11-01T09:00:00Z",
            end_time: "2025-11-01T09:30:00Z",
            user_name: "Jane Doe",
            purpose: "Application Review"
        },
        {
            id: "4",
            start_time: "2025-10-06T12:00:00Z",
            end_time: "2025-10-06T12:30:00Z",
            user_name: "Jim Beam",
            purpose: "Application Review"
        },
    ]


    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-gren border border-[#eeeeee]">
                <h2 className="text-xl font-bold mb-1">Today's Schedule</h2>
                <p className="text-sm text-gray-500 mb-4">Your appointments for today</p>
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-md mb-2" />
                ))}
            </div>
        );
    }
    return (
        <div className="bg-white p-6 rounded-lg shadow-gren border border-[#eeeeee]">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold">Today's Schedule</h2>
                    <p className="text-sm text-gray-500">Your appointments for today</p>
                </div>
                <button className="text-brand-gray text-sm hover:text-brand">
                    View All Appointments
                </button>
            </div>
            <div className="space-y-2">
                {data.map((appointment) => {
                    const now = new Date();
                    const startTime = new Date(appointment.start_time);
                    const isPast = startTime < now;
                    return (
                        <div
                            key={appointment.id}
                            className={`p-4 rounded-md ${isPast
                                ? "bg-brand-secondary text-brand-gray"
                                : "bg-brand-primary text-brand-black"
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="font-medium">{formatTime(startTime)}</span>
                                    <span className="mx-2">•</span>
                                    <span className="font-semibold">{appointment.user_name}</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                    {isPast ? "Completed" : "Upcoming"}
                                </div>
                            </div>
                            <div className="mt-1 text-sm">{appointment.purpose}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
// Helper: Format time as "9:00 AM"
function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
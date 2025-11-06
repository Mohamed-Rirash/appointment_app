"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import clsx from "clsx";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { client } from "@/helpers/api/client";
import { format, } from "date-fns";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const times = [
    "8:00", "8:30", "9:00", "9:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30"
];

interface AvailabilityRecord {
    id?: string;
    daysofweek: string;
    specific_date?: string;
    start_time: string;
    end_time: string;
    is_recurring: boolean;
}

interface AvailabilityCalendarProps {
    officeId: string;
    token?: string
}

export default function AvailableOverview({ officeId, token }: AvailabilityCalendarProps) {
    const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);


    const dayMap: Record<string, string> = {
        "Mon": "MONDAY", "Tue": "TUESDAY", "Wed": "WEDNESDAY", "Thu": "THURSDAY",
        "Fri": "FRIDAY", "Sat": "SATURDAY", "Sun": "SUNDAY",
    };

    const reverseDayMap: Record<string, string> = {
        "MONDAY": "Mon", "TUESDAY": "Tue", "WEDNESDAY": "Wed", "THURSDAY": "Thu",
        "FRIDAY": "Fri", "SATURDAY": "Sat", "SUNDAY": "Sun",
    };

    // gets todays date
    const today = new Date();

    // Format: "Friday, October 31, 2025"
    const formattedDate = format(today, 'EEEE, MMMM dd, yyyy');

    // Load availability from backend
    const loadAvailability = useCallback(async () => {
        setLoading(true);
        try {
            const response = await client.getHotAvailability(officeId, token)

            const data: AvailabilityRecord[] = response
            convertFromBackendFormat(data);
        } catch (error) {
            console.error('Failed to load availability:', error);
            toast.error('Failed to load availability');
        } finally {
            setLoading(false);
        }
    }, [officeId]);


    ///  Convert backend data to selected slots with consistent time formatting
    const convertFromBackendFormat = (availability: AvailabilityRecord[]) => {
        const newSelectedSlots = new Set<string>();


        availability.forEach((record) => {
            if (!record.is_recurring) {
                console.log("⏩ Skipping non-recurring record:", record);
                return;
            }

            const day = reverseDayMap[record.daysofweek];
            if (!day) {
                console.warn("❓ Unknown day:", record.daysofweek);
                return;
            }

            try {
                // ✅ FIXED: Convert backend time format to match calendar format
                const startTime = formatTimeForCalendar(record.start_time);
                const endTime = formatTimeForCalendar(record.end_time);



                //  Use proper time comparison instead of string comparison
                if (compareTimes(startTime, endTime) >= 0) {
                    console.warn(`⏭️ Skipping invalid time range: ${startTime} to ${endTime}`);
                    return;
                }

                //  Use consistent time formatting throughout
                let currentTime = formatTimeConsistently(startTime);
                const formattedEndTime = formatTimeConsistently(endTime);

                while (compareTimes(currentTime, formattedEndTime) < 0) {
                    const slotKey = `${day}-${currentTime}`;
                    newSelectedSlots.add(slotKey);


                    // Increment by 30 minutes with consistent formatting
                    currentTime = incrementTimeBy30Minutes(currentTime);
                }
            } catch (error) {
                console.error("❌ Error processing time:", record.start_time, record.end_time, error);
            }
        });


        setSelectedSlots(newSelectedSlots);

    };

    // : Helper function to ensure consistent time formatting (single-digit hours)
    const formatTimeConsistently = (time: string): string => {
        const [hours, minutes] = time.split(":").map(Number);
        // Always return single-digit format for hours
        return `${hours}:${minutes.toString().padStart(2, "0")}`;
    };

    //  Helper function to increment time by 30 minutes with consistent formatting
    const incrementTimeBy30Minutes = (time: string): string => {
        const [hours, minutes] = time.split(":").map(Number);
        const nextMinutes = minutes + 30;
        const nextHours = hours + Math.floor(nextMinutes / 60);
        const finalMinutes = nextMinutes % 60;

        // Always return single-digit format for hours
        return `${nextHours}:${finalMinutes.toString().padStart(2, "0")}`;
    };

    //  Helper function to convert backend time to calendar format
    const formatTimeForCalendar = (backendTime: string): string => {
        // Backend time: "08:00:00" or "08:00"
        // Calendar time: "8:00" (remove leading zeros from hour)

        const timePart = backendTime.slice(0, 5); // Get "HH:MM"
        const [hours, minutes] = timePart.split(":");

        // Remove leading zero from hours: "08" → "8"
        const formattedHours = parseInt(hours, 10).toString();

        return `${formattedHours}:${minutes}`;
    };

    //  Helper function to compare times properly
    const compareTimes = (time1: string, time2: string): number => {
        const [h1, m1] = time1.split(":").map(Number);
        const [h2, m2] = time2.split(":").map(Number);

        const totalMinutes1 = h1 * 60 + m1;
        const totalMinutes2 = h2 * 60 + m2;

        return totalMinutes1 - totalMinutes2;
    };

    // Group consecutive time slots into blocks
    const groupConsecutiveTimes = (times: string[]): { start: string; end: string }[] => {
        if (times.length === 0) return [];

        const sortedTimes = [...times].sort();
        const blocks: { start: string; end: string }[] = [];

        let currentBlock = { start: sortedTimes[0], end: sortedTimes[0] };

        for (let i = 1; i < sortedTimes.length; i++) {
            const currentTime = sortedTimes[i];
            const prevTime = sortedTimes[i - 1];

            const [prevHours, prevMinutes] = prevTime.split(':').map(Number);
            const [currentHours, currentMinutes] = currentTime.split(':').map(Number);

            const prevTotalMinutes = prevHours * 60 + prevMinutes;
            const currentTotalMinutes = currentHours * 60 + currentMinutes;

            if (currentTotalMinutes - prevTotalMinutes === 30) {
                currentBlock.end = currentTime;
            } else {
                blocks.push({ ...currentBlock });
                currentBlock = { start: currentTime, end: currentTime };
            }
        }

        blocks.push(currentBlock);
        return blocks;
    };





    useEffect(() => {
        loadAvailability();
    }, [loadAvailability]);


    if (loading) {
        return (
            <Card className="p-6 border border-[#eeeeee] bg-white rounded-lg shadow-sm">
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#29E05F]" />
                    <span className="ml-2 text-brand-black">Loading availability...</span>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6 select-none border border-[#eeeeee] bg-white rounded-lg shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle className="text-xl font-bold text-brand-black">View Availability</CardTitle>
                </div>

                {/* Date navigation */}
                <div className="flex items-center gap-2 text-sm font-medium">

                    <ChevronLeft className="h-4 w-4" />

                    <span className="min-w-[180px] text-center text-brand-black">
                        {formattedDate}
                    </span>

                    <ChevronRight className="h-4 w-4" />

                </div>
            </CardHeader>

            <CardContent className="mt-6">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr>
                                <th className="w-16 p-2 text-left text-gray-500 font-medium">Time</th>
                                {days.map((day) => (
                                    <th key={day} className="text-center text-gray-600 font-medium py-2">
                                        {day}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {times.map((time) => (
                                <tr key={time}>
                                    <td className="text-sm text-brand-gray pr-2">{time}</td>
                                    {days.map((day) => {
                                        const key = `${day}-${time}`;
                                        const isActive = selectedSlots.has(key);
                                        return (
                                            <td
                                                key={key}
                                                className={clsx(
                                                    "border border-[#eeeeee]  cursor-pointer transition-colors duration-100",
                                                    isActive
                                                        ? "bg-brand hover:bg-brand/90"
                                                        : ""
                                                )}
                                                style={{ height: "32px", width: "100px" }}
                                            ></td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { addDays, startOfWeek, format, addWeeks } from "date-fns";
import { toast } from "react-hot-toast";
import { client } from "@/helpers/api/client";
import {
    Card,
    CardHeader,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, ChevronLeft, ChevronRight, Loader2, Clock, Calendar, MousePointer2 } from "lucide-react";
import { cn } from "@/libs/utils";

// ── TYPES & CONSTANTS ─────────────────────────────────────────────────────
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const times = [
    "8:00", "8:30", "9:00", "9:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "1:00", "1:30", "2:00", "2:30",
];

const dayMap: Record<string, string> = {
    Mon: "MONDAY",
    Tue: "TUESDAY",
    Wed: "WEDNESDAY",
    Thu: "THURSDAY",
    Fri: "FRIDAY",
    Sat: "SATURDAY",
    Sun: "SUNDAY",
};

const reverseDayMap: Record<string, string> = {
    MONDAY: "Mon",
    TUESDAY: "Tue",
    WEDNESDAY: "Wed",
    THURSDAY: "Thu",
    FRIDAY: "Fri",
    SATURDAY: "Sat",
    SUNDAY: "Sun"
};

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
    token?: string;
}

// ── HELPER FUNCTIONS ──────────────────────────────────────────────────────
function formatTimeForCalendar(backendTime: string): string {
    const timePart = backendTime.slice(0, 5);
    const [hours, minutes] = timePart.split(":");
    return `${parseInt(hours, 10)}:${minutes}`;
}

function compareTimes(time1: string, time2: string): number {
    const [h1, m1] = time1.split(":").map(Number);
    const [h2, m2] = time2.split(":").map(Number);
    return (h1 * 60 + m1) - (h2 * 60 + m2);
}

function incrementTimeBy30Minutes(time: string): string {
    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + 30;
    const nextHours = Math.floor(totalMinutes / 60);
    const nextMinutes = totalMinutes % 60;
    return `${nextHours}:${nextMinutes.toString().padStart(2, "0")}`;
}

function groupConsecutiveTimes(times: string[]): { start: string; end: string }[] {
    if (times.length === 0) return [];

    const sorted = [...times].sort(compareTimes);
    const blocks: { start: string; end: string }[] = [];
    let currentBlock = { start: sorted[0], end: sorted[0] };

    for (let i = 1; i < sorted.length; i++) {
        const currentTime = sorted[i];
        const prevTime = sorted[i - 1];

        if (compareTimes(currentTime, incrementTimeBy30Minutes(prevTime)) === 0) {
            currentBlock.end = currentTime;
        } else {
            blocks.push({ ...currentBlock });
            currentBlock = { start: currentTime, end: currentTime };
        }
    }

    blocks.push(currentBlock);
    return blocks;
}

function convertToBackendFormat(slots: Set<string>): AvailabilityRecord[] {
    const records: AvailabilityRecord[] = [];

    // Group slots by day
    const slotsByDay: Record<string, string[]> = {};
    days.forEach(day => {
        slotsByDay[day] = [];
    });

    // Populate slots by day
    slots.forEach(slot => {
        const [day, time] = slot.split("-");
        if (slotsByDay[day]) {
            slotsByDay[day].push(time);
        }
    });

    // Create records for each day
    days.forEach((day) => {
        const daySlots = slotsByDay[day];
        if (daySlots.length === 0) return;

        const timeBlocks = groupConsecutiveTimes(daySlots);

        timeBlocks.forEach((block) => {
            const startTime = block.start;
            const endTime = block.end;

            // Format times with leading zeros and seconds
            const formattedStart = startTime.includes(":")
                ? `${startTime.split(":")[0].padStart(2, "0")}:${startTime.split(":")[1]}:00`
                : `${startTime}:00`;

            const formattedEnd = endTime.includes(":")
                ? `${endTime.split(":")[0].padStart(2, "0")}:${endTime.split(":")[1]}:00`
                : `${endTime}:00`;

            records.push({
                daysofweek: dayMap[day],
                start_time: formattedStart,
                end_time: formattedEnd,
                is_recurring: true,
            });
        });
    });

    return records;
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function AvailabilityCalendar({ officeId, token }: AvailabilityCalendarProps) {
    const [weekOffset, setWeekOffset] = useState(0);
    const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
    const [savedSlots, setSavedSlots] = useState<Set<string>>(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState<"add" | "remove">("add");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const currentWeekStart = useMemo(() => {
        return startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
    }, [weekOffset]);

    const weekDisplay = useMemo(() => {
        const weekEnd = addDays(currentWeekStart, 6);
        return `${format(currentWeekStart, "MMM dd")} - ${format(weekEnd, "MMM dd, yyyy")}`;
    }, [currentWeekStart]);

    // Drag handling
    useEffect(() => {
        const handleMouseUp = () => setIsDragging(false);
        document.addEventListener("mouseup", handleMouseUp);
        return () => document.removeEventListener("mouseup", handleMouseUp);
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") setWeekOffset((prev) => prev - 1);
        if (e.key === "ArrowRight") setWeekOffset((prev) => prev + 1);
    }, []);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const toggleSlot = useCallback((key: string, value: boolean) => {
        setSelectedSlots((prev) => {
            const newSet = new Set(prev);
            if (value) newSet.add(key);
            else newSet.delete(key);
            return newSet;
        });
    }, []);

    const handleMouseDown = useCallback((day: string, time: string) => {
        const key = `${day}-${time}`;
        setIsDragging(true);
        setDragMode(selectedSlots.has(key) ? "remove" : "add");
    }, [selectedSlots]);

    const handleMouseEnter = useCallback((day: string, time: string) => {
        if (!isDragging) return;
        const key = `${day}-${time}`;
        toggleSlot(key, dragMode === "add");
    }, [isDragging, dragMode, toggleSlot]);

    const formatTimeConsistently = useCallback((time: string): string => {
        const [hours, minutes] = time.split(":").map(Number);
        return `${hours}:${minutes.toString().padStart(2, "0")}`;
    }, []);

    const convertFromBackendFormat = useCallback((availability: AvailabilityRecord[]) => {
        const newSelectedSlots = new Set<string>();

        availability.forEach((record) => {
            if (!record.is_recurring) return;

            const day = reverseDayMap[record.daysofweek];
            if (!day) {
                console.warn(`Unknown day: ${record.daysofweek}`);
                return;
            }

            try {
                const startTime = formatTimeForCalendar(record.start_time);
                const endTime = formatTimeForCalendar(record.end_time);

                if (compareTimes(startTime, endTime) >= 0) {
                    console.warn(`Invalid time range: ${startTime} - ${endTime}`);
                    return;
                }

                let currentTime = formatTimeConsistently(startTime);
                const finalEndTime = formatTimeConsistently(endTime);

                while (compareTimes(currentTime, finalEndTime) <= 0) {
                    const slotKey = `${day}-${currentTime}`;
                    newSelectedSlots.add(slotKey);
                    currentTime = incrementTimeBy30Minutes(currentTime);
                }

            } catch (error) {
                console.error("❌ Error processing time:", record, error);
            }
        });

        setSelectedSlots(newSelectedSlots);
        setSavedSlots(new Set(newSelectedSlots));
    }, [formatTimeConsistently]);

    const loadAvailability = useCallback(async () => {
        setLoading(true);
        try {
            const response = await client.getHotAvailability(officeId, token);
            if (!Array.isArray(response)) {
                console.error("❌ Expected array but got:", typeof response, response);
                toast.error("Invalid data format from server");
                return;
            }

            if (response.length === 0) {
                setSelectedSlots(new Set());
                setSavedSlots(new Set());
                return;
            }

            convertFromBackendFormat(response);
        } catch (error) {
            console.error("❌ Failed to load availability:", error);
            toast.error("Failed to load availability");
        } finally {
            setLoading(false);
        }
    }, [officeId, token, convertFromBackendFormat]);

    const handleSaveAvailability = useCallback(async () => {
        if (saving) return;

        const hasChanges =
            selectedSlots.size !== savedSlots.size ||
            [...selectedSlots].some(slot => !savedSlots.has(slot)) ||
            [...savedSlots].some(slot => !selectedSlots.has(slot));

        if (!hasChanges) {
            toast("No changes to save");
            return;
        }

        setSaving(true);
        try {
            const changedDays = days.filter(day => {
                const daySelected = [...selectedSlots]
                    .filter(s => s.startsWith(`${day}-`))
                    .sort();
                const daySaved = [...savedSlots]
                    .filter(s => s.startsWith(`${day}-`))
                    .sort();
                return JSON.stringify(daySelected) !== JSON.stringify(daySaved);
            });

            const changedSlots = new Set(
                [...selectedSlots].filter(slot =>
                    changedDays.includes(slot.split("-")[0])
                )
            );


            const backendData = convertToBackendFormat(changedSlots);
            // console.log("saved..", backendData)
            const dat = await Promise.all(
                backendData.map((record) => client.setHostAvailability(officeId, record, token))
            );

            await loadAvailability();

            setSavedSlots(new Set(selectedSlots));
            toast.success("Availability saved successfully!");
        } catch (error) {
            console.error("❌ Save failed:", error);
            toast.error("Failed to save availability");
            setSelectedSlots(new Set(savedSlots));
        } finally {
            setSaving(false);
        }
    }, [selectedSlots, savedSlots, officeId, token, saving, loadAvailability]);

    const TimeSlotCell = useCallback(({ day, time }: { day: string; time: string }) => {
        const key = `${day}-${time}`;
        const isActive = selectedSlots.has(key);
        const isSaved = savedSlots.has(key);
        const hasUnsavedChanges = isActive !== isSaved;

        return (
            <td
                role="button"
                aria-label={`${day} at ${time}: ${isActive ? "Available" : "Unavailable"}`}
                aria-pressed={isActive}
                tabIndex={0}
                onMouseDown={() => handleMouseDown(day, time)}
                onMouseEnter={() => handleMouseEnter(day, time)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleSlot(key, !isActive);
                    }
                }}
                className={cn(
                    "relative border border-gray-200 cursor-pointer transition-all duration-150",
                    "hover:scale-[1.02] hover:shadow-sm hover:z-10",
                    isActive
                        ? "bg-gradient-to-br from-brand to-brand hover:from-brand hover:to-brand shadow-sm"
                        : "bg-white hover:bg-gray-50",
                    isDragging && "select-none",
                    !isActive && isSaved && "bg-gray-100",
                    hasUnsavedChanges && isActive && "ring-2 ring-amber-400 ring-offset-1",
                    "focus:ring-2 focus:ring-brand focus:outline-none focus:z-10",
                    "rounded-md"
                )}
                style={{ height: "36px", width: "100px" }}
            >
                {isActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full opacity-90 shadow-sm"></div>
                    </div>
                )}
            </td>
        );
    }, [selectedSlots, savedSlots, handleMouseDown, handleMouseEnter, toggleSlot, isDragging]);

    useEffect(() => {
        loadAvailability();
    }, [loadAvailability]);

    return (
        <Card className="p-6 select-none border-none!  bg-white rounded-xl shadow-none! max-w-6xl mx-auto">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-6 border-b border-gray-100">

                <div className="flex flex-col gap-2">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-brand" />
                        Weekly Availability
                    </h2>
                    <p className="text-sm text-gray-600">Click and drag to set your available time slots</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWeekOffset((prev) => prev - 1)}
                        aria-label="Previous week"
                        className="flex items-center gap-2 hover:bg-gray-50 transition-colors border-gray-300"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Prev</span>
                    </Button>

                    <div className="min-w-[220px] text-center bg-brand-primary border border-brand/20 px-4 py-2 rounded-lg">
                        <span className="text-brand font-semibold text-sm" aria-live="polite">
                            {weekDisplay}
                        </span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWeekOffset((prev) => prev + 1)}
                        aria-label="Next week"
                        className="flex items-center gap-2 hover:bg-gray-50 transition-colors border-gray-300"
                    >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Button
                        className={cn(
                            "bg-brand text-brand-primary text-sm font-semibold rounded-lg px-4 py-2",
                            "hover:bg-brand/90 transition-all duration-200 shadow-sm hover:shadow-md",
                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand",
                            "flex items-center gap-2"
                        )}
                        onClick={handleSaveAvailability}
                        disabled={saving}
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {saving ? "Saving..." : "Save"}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="mt-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 bg-brand-primary/20 border border-brand-primary rounded-xl">
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className="text-gray-600 text-xs">Selected</span>
                                <span className="font-bold text-brand text-lg">{selectedSlots.size}</span>
                            </div>
                            <div className="h-8 w-px bg-brand/30"></div>
                            <div className="flex flex-col">
                                <span className="text-gray-600 text-xs">Saved</span>
                                <span className="font-bold text-green-700 text-lg">{savedSlots.size}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gradient-to-br from-brand to-brand rounded-sm shadow-sm"></div>
                            <span className="text-gray-700">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-white border border-gray-300 rounded-sm"></div>
                            <span className="text-gray-700">Unavailable</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded-sm"></div>
                            <span className="text-gray-700">Saved</span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="w-16 p-3 text-left bg-gray-100 border-r border-gray-200">
                                        <div className="h-4 bg-gray-300 rounded w-8 animate-pulse"></div>
                                    </th>
                                    {days.map((day) => (
                                        <th key={day} className="text-center bg-gray-100 py-3 border-r border-gray-200 last:border-r-0">
                                            <div className="h-4 bg-gray-300 rounded mx-auto w-12 animate-pulse"></div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {times.map((_, index) => (
                                    <tr key={index}>
                                        <td className="p-3 bg-gray-100 border-r border-gray-200">
                                            <div className="h-3 bg-gray-300 rounded w-12 animate-pulse"></div>
                                        </td>
                                        {days.map((_, dayIndex) => (
                                            <td key={dayIndex} className="p-2 border-r border-gray-200 last:border-r-0">
                                                <div className="h-8 bg-gray-300 rounded-md animate-pulse"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="rounded-xl border border-gray-200 shadow-xs overflow-hidden bg-white">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr>
                                    <th className="w-16 p-3 text-left bg-gray-100 text-gray-600 font-semibold border-r border-gray-200">
                                        <Clock className="h-4 w-4 opacity-70" />
                                    </th>
                                    {days.map((day) => (
                                        <th
                                            key={day}
                                            className="text-center bg-gray-100 text-gray-800 font-semibold py-3 border-r border-gray-200 last:border-r-0"
                                        >
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {times.map((time) => (
                                    <tr key={time} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="text-sm text-gray-600 font-medium pr-3 py-2 text-right bg-gray-50 border-r border-gray-200 group-hover:bg-gray-100 transition-colors">
                                            {time}
                                        </td>
                                        {days.map((day) => (
                                            <TimeSlotCell key={`${day}-${time}`} day={day} time={time} />
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
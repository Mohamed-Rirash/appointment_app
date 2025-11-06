"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { Save, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { client } from "@/helpers/api/client";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const times = [
  "8:00", "8:30", "9:00", "9:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
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
  token?: string;
}

export default function AvailabilityCalendar({ officeId, token }: AvailabilityCalendarProps) {
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [savedSlots, setSavedSlots] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"add" | "remove">("add");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);


  const dayMap: Record<string, string> = {
    Mon: "MONDAY", Tue: "TUESDAY", Wed: "WEDNESDAY", Thu: "THURSDAY",
    Fri: "FRIDAY", Sat: "SATURDAY", Sun: "SUNDAY",
  };

  const reverseDayMap: Record<string, string> = {
    MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu",
    FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
  };

  const today = new Date();
  const formattedDate = format(today, "EEEE, MMMM dd, yyyy");
  console.log(new Date().toISOString().split("T")[0])
  // Load availability from backend - FIXED VERSION
  const loadAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const response = await client.getHotAvailability(officeId, token);
      console.log("bakce", response)
      //  Validate response format
      if (!response) {
        console.warn("No data received from backend");
        setSelectedSlots(new Set());
        setSavedSlots(new Set());
        return;
      }

      if (!Array.isArray(response)) {
        console.error("❌ Expected array but got:", typeof response, response);
        toast.error("Invalid data format from server");
        return;
      }

      if (response.length === 0) {
        console.log("📭 No availability data found");
        setSelectedSlots(new Set());
        setSavedSlots(new Set());
        return;
      }

      const data: AvailabilityRecord[] = response;
      convertFromBackendFormat(data);

    } catch (error) {
      console.error("❌ Failed to load availability:", error);
      toast.error("Failed to load availability");
    } finally {
      setLoading(false);
    }
  }, [officeId, token]);


  // Convert backend data to selected slots with consistent time formatting
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
        //  Convert backend time format to match calendar format
        const startTime = formatTimeForCalendar(record.start_time);
        const endTime = formatTimeForCalendar(record.end_time);


        //  Use proper time comparison instead of string comparison
        if (compareTimes(startTime, endTime) >= 0) {
          console.warn(`⏭️ Skipping invalid time range: ${startTime} to ${endTime}`);
          return;
        }

        // Use consistent time formatting throughout
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
    setSavedSlots(new Set(newSelectedSlots));
  };

  //  Helper function to ensure consistent time formatting (single-digit hours)
  const formatTimeConsistently = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number);
    // Always return single-digit format for hours
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  // Helper function to increment time by 30 minutes with consistent formatting
  const incrementTimeBy30Minutes = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number);
    const nextMinutes = minutes + 30;
    const nextHours = hours + Math.floor(nextMinutes / 60);
    const finalMinutes = nextMinutes % 60;

    // Always return single-digit format for hours
    return `${nextHours}:${finalMinutes.toString().padStart(2, "0")}`;
  };

  // Helper function to convert backend time to calendar format
  const formatTimeForCalendar = (backendTime: string): string => {
    // Backend time: "08:00:00" or "08:00"
    // Calendar time: "8:00" (remove leading zeros from hour)

    const timePart = backendTime.slice(0, 5); // Get "HH:MM"
    const [hours, minutes] = timePart.split(":");

    // Remove leading zero from hours: "08" → "8"
    const formattedHours = parseInt(hours, 10).toString();

    return `${formattedHours}:${minutes}`;
  };

  // Helper function to compare times properly
  const compareTimes = (time1: string, time2: string): number => {
    const [h1, m1] = time1.split(":").map(Number);
    const [h2, m2] = time2.split(":").map(Number);

    const totalMinutes1 = h1 * 60 + m1;
    const totalMinutes2 = h2 * 60 + m2;

    return totalMinutes1 - totalMinutes2;
  };

  // 🧩 Group consecutive time slots (your existing code is fine)
  const groupConsecutiveTimes = (times: string[]): { start: string; end: string }[] => {
    if (times.length === 0) return [];
    const sortedTimes = [...times].sort();
    const blocks: { start: string; end: string }[] = [];
    let currentBlock = { start: sortedTimes[0], end: sortedTimes[0] };

    for (let i = 1; i < sortedTimes.length; i++) {
      const [prevH, prevM] = sortedTimes[i - 1].split(":").map(Number);
      const [curH, curM] = sortedTimes[i].split(":").map(Number);
      const prevMins = prevH * 60 + prevM;
      const curMins = curH * 60 + curM;

      if (curMins - prevMins === 30) {
        currentBlock.end = sortedTimes[i];
      } else {
        blocks.push({ ...currentBlock });
        currentBlock = { start: sortedTimes[i], end: sortedTimes[i] };
      }
    }
    blocks.push(currentBlock);
    return blocks;
  };

  // // Convert selected slots to backend format (your existing code is fine)
  const convertToBackendFormatFromSlots = (slots: Set<string>): AvailabilityRecord[] => {
    const availabilityRecords: AvailabilityRecord[] = [];
    days.forEach((day) => {
      const daySlots = Array.from(slots)
        .filter((slot) => slot.startsWith(day))
        .map((slot) => slot.split("-")[1]);
      const timeBlocks = groupConsecutiveTimes(daySlots);
      timeBlocks.forEach((block) => {
        const [endHours, endMinutes] = block.end.split(":").map(Number);
        const endTotalMinutes = endHours * 60 + endMinutes + 30;
        const finalEndHours = Math.floor(endTotalMinutes / 60);
        const finalEndMinutes = endTotalMinutes % 60;

        const formattedStart = `${block.start.padStart(5, "0")}:00`; // ✅ "08:00:00"
        const formattedEnd = `${finalEndHours.toString().padStart(2, "0")}:${finalEndMinutes
          .toString()
          .padStart(2, "0")}:00`; // ✅ "09:30:00"

        const today = new Date().toISOString().split("T")[0];

        availabilityRecords.push({
          daysofweek: dayMap[day],
          // specific_date: "null",
          start_time: formattedStart, // ✅ just time
          end_time: formattedEnd,     // ✅ just time
          is_recurring: true,
        });
      })
    });
    return availabilityRecords;
  };




  //  Drag selection logic (your existing code is fine)
  const toggleSlot = (key: string, value: boolean) => {
    setSelectedSlots((prev) => {
      const newSet = new Set(prev);
      if (value) newSet.add(key);
      else newSet.delete(key);
      return newSet;
    });
  };

  const handleMouseDown = (day: string, time: string) => {
    const key = `${day}-${time}`;
    setIsDragging(true);
    setDragMode(selectedSlots.has(key) ? "remove" : "add");
    toggleSlot(key, !selectedSlots.has(key));
  };

  const handleMouseEnter = (day: string, time: string) => {
    if (!isDragging) return;
    const key = `${day}-${time}`;
    toggleSlot(key, dragMode === "add");
  };

  const handleMouseUp = () => setIsDragging(false);

  //  Save only new slots (your existing code is fine)
  const handleSaveAvailability = async () => {
    setSaving(true);
    try {
      const newSlots = new Set([...selectedSlots].filter((slot) => !savedSlots.has(slot)));
      if (newSlots.size === 0) {
        toast("No new slots to save");
        setSaving(false);
        return;
      }
      console.log("newSlots", newSlots)
      const backendData = convertToBackendFormatFromSlots(newSlots);
      console.log("backendData", backendData)
      for (const record of backendData) {
        console.log("shit", record)
        await client.setHostAvailability(officeId, record, token);
        await new Promise((r) => setTimeout(r, 100));
      }
      toast.success("New availability saved!");
      setSavedSlots(new Set(selectedSlots));
      await loadAvailability();
    } catch (error) {
      console.error("Failed to save availability:", error);
      toast.error("Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  // ⏱️ Effects
  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

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

  // 🗓️ UI
  return (
    <Card className="p-6 select-none border border-[#eeeeee] bg-white rounded-lg shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-xl font-bold text-brand-black">
            Manage Availability
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Click and drag to create availability blocks
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="text-xs px-3 py-1.5 rounded-md font-medium"
          >
            Weekly
          </Button>

          <div className="flex items-center gap-2 text-sm font-medium">
            <ChevronLeft className="h-4 w-4" />
            <span className="min-w-[180px] text-center text-brand-black">
              {formattedDate}
            </span>
            <ChevronRight className="h-4 w-4" />
          </div>

          <Button
            className="bg-linear-to-r from-[#29E05F] to-[#0F9938] text-white text-sm font-bold rounded-md px-4 py-2"
            onClick={handleSaveAvailability}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Availability"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Selected slots: {selectedSlots.size}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-brand rounded-sm"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded-sm"></div>
              <span>Unavailable</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-16 p-2 text-left text-red-500 font-medium"></th>
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
                        onMouseDown={() => handleMouseDown(day, time)}
                        onMouseEnter={() => handleMouseEnter(day, time)}
                        className={clsx(
                          "border border-[#eeeeee] cursor-pointer transition-colors duration-100",
                          isActive
                            ? "bg-brand hover:bg-brand/90"
                            : "bg-white hover:bg-gray-50"
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


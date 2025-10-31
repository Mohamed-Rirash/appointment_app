// app/offices/[id]/components/AvailabilityCalendar.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { Save, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, parseISO } from "date-fns";
import toast from "react-hot-toast";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const times = [
  "8:00", "8:30", "9:00", "9:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"
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
}

export default function AvailabilityCalendar({ officeId }: AvailabilityCalendarProps) {
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"add" | "remove">("add");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const dayMap: Record<string, string> = {
    "Mon": "MONDAY", "Tue": "TUESDAY", "Wed": "WEDNESDAY", "Thu": "THURSDAY",
    "Fri": "FRIDAY", "Sat": "SATURDAY", "Sun": "SUNDAY",
  };

  const reverseDayMap: Record<string, string> = {
    "MONDAY": "Mon", "TUESDAY": "Tue", "WEDNESDAY": "Wed", "THURSDAY": "Thu",
    "FRIDAY": "Fri", "SATURDAY": "Sat", "SUNDAY": "Sun",
  };

  // Get week range for display
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const formattedDateRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

  // Load availability from backend
  const loadAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/availability/hosts/${officeId}`);
      if (!response.ok) throw new Error('Failed to load availability');
      const data: AvailabilityRecord[] = await response.json();
      convertFromBackendFormat(data);
    } catch (error) {
      console.error('Failed to load availability:', error);
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, [officeId]);

  // Convert backend data to selected slots
  const convertFromBackendFormat = (availability: AvailabilityRecord[]) => {
    const newSelectedSlots = new Set<string>();

    availability.forEach(record => {
      if (!record.is_recurring) return; // Only handle recurring for now

      const day = reverseDayMap[record.daysofweek];
      if (!day) return;

      const startTime = record.start_time.slice(0, 5); // "HH:MM"
      const endTime = record.end_time.slice(0, 5);

      // Find all time slots between start and end
      let currentTime = startTime;
      while (currentTime < endTime) {
        newSelectedSlots.add(`${day}-${currentTime}`);

        // Increment by 30 minutes
        const [hours, minutes] = currentTime.split(':').map(Number);
        const nextMinutes = minutes + 30;
        const nextHours = hours + Math.floor(nextMinutes / 60);
        currentTime = `${nextHours.toString().padStart(2, '0')}:${(nextMinutes % 60).toString().padStart(2, '0')}`;
      }
    });

    setSelectedSlots(newSelectedSlots);
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

      // Check if times are consecutive (30 min difference)
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

  // Convert selected slots to backend format
  const convertToBackendFormat = (): AvailabilityRecord[] => {
    const availabilityRecords: AvailabilityRecord[] = [];

    days.forEach(day => {
      const daySlots = Array.from(selectedSlots)
        .filter(slot => slot.startsWith(day))
        .map(slot => slot.split('-')[1]);

      const timeBlocks = groupConsecutiveTimes(daySlots);

      timeBlocks.forEach(block => {
        // Add 30 minutes to end time to make it inclusive
        const [endHours, endMinutes] = block.end.split(':').map(Number);
        const endTotalMinutes = endHours * 60 + endMinutes + 30;
        const finalEndHours = Math.floor(endTotalMinutes / 60);
        const finalEndMinutes = endTotalMinutes % 60;
        const endTime = `${finalEndHours.toString().padStart(2, '0')}:${finalEndMinutes.toString().padStart(2, '0')}`;

        availabilityRecords.push({
          daysofweek: dayMap[day],
          start_time: `${block.start}:00.000Z`,
          end_time: `${endTime}:00.000Z`,
          is_recurring: true
        });
      });
    });

    return availabilityRecords;
  };

  const toggleSlot = (key: string, value: boolean) => {
    setSelectedSlots(prev => {
      const newSet = new Set(prev);
      if (value) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }
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

  // UPDATED: Send data one record at a time
  const handleSaveAvailability = async () => {
    setSaving(true);
    try {
      const backendData = convertToBackendFormat();

      // Clear existing availability first
      const clearResponse = await fetch(`/api/v1/availability/hosts/${officeId}`, {
        method: 'DELETE'
      });

      if (!clearResponse.ok) {
        throw new Error('Failed to clear existing availability');
      }

      // Save each availability record one at a time
      for (const record of backendData) {
        const response = await fetch(`/api/v1/availability/hosts/${officeId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        });

        if (!response.ok) {
          throw new Error(`Failed to save availability for ${record.daysofweek}`);
        }

        // Optional: small delay between requests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast.success('Availability saved successfully!');
      await loadAvailability(); // Reload to confirm
    } catch (error) {
      console.error('Failed to save availability:', error);
      toast.error('Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const clearAll = () => {
    setSelectedSlots(new Set());
  };

  // Load availability on component mount
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

  return (
    <Card className="p-6 select-none border border-[#eeeeee] bg-white rounded-lg shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-xl font-bold text-brand-black">Manage Availability</CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Click and drag to create availability blocks
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Weekly toggle */}
          <Button
            variant="outline"
            size="sm"
            className="text-xs px-3 py-1.5 rounded-md font-medium"
          >
            Weekly
          </Button>

          {/* Date navigation */}
          <div className="flex items-center gap-2 text-sm font-medium">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[180px] text-center text-brand-black">
              {formattedDateRange}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={saving}
            >
              Clear All
            </Button>
            <Button
              className="bg-gradient-to-r from-[#29E05F] to-[#0F9938] text-white text-sm font-bold rounded-md px-4 py-2"
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
        </div>
      </CardHeader>

      <CardContent className="mt-6">
        {/* Legend */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Selected slots: {selectedSlots.size}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-[#29E05F] rounded-sm"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded-sm"></div>
              <span>Unavailable</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-16 p-2 text-left text-gray-500 font-medium"></th>
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
                  <td className="text-gray-500 pr-2 text-right p-2 text-sm">{time}</td>
                  {days.map((day) => {
                    const key = `${day}-${time}`;
                    const isActive = selectedSlots.has(key);
                    return (
                      <td
                        key={key}
                        onMouseDown={() => handleMouseDown(day, time)}
                        onMouseEnter={() => handleMouseEnter(day, time)}
                        className={clsx(
                          "rounded cursor-pointer transition-colors duration-150 border border-transparent",
                          isActive
                            ? "bg-[#29E05F] hover:bg-[#0F9938]"
                            : "bg-gray-50 hover:bg-gray-100"
                        )}
                        style={{ height: "40px", width: "100px" }}
                      />
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
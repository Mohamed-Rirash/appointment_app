// app/offices/[id]/components/ViewAvailabilityDialog.tsx
"use client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ViewAvailabilityDialog({
    officeId,
    userId,
}: {
    officeId: string;
    userId: string;
}) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Generate dates for the week
    const generateWeekDates = (date: Date) => {
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay() + 1); // Monday
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            dates.push(d);
        }
        return dates;
    };

    const weekDates = generateWeekDates(selectedDate);

    // Mock time slots
    const timeSlots = [
        "8:00 AM",
        "8:30 AM",
        "9:00 AM",
        "9:30 AM",
        "10:00 AM",
        "10:30 AM",
        "11:00 AM",
        "11:30 AM",
        "12:00 PM",
        "12:30 PM",
        "1:00 PM",
        "1:30 PM",
        "2:00 PM",
        "2:30 PM",
        "3:00 PM",
        "3:30 PM",
        "4:00 PM",
        "4:30 PM",
        "5:00 PM",
        "5:30 PM",
        "6:00 PM",
    ];

    const handlePrevWeek = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 7);
        setSelectedDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 7);
        setSelectedDate(newDate);
    };

    return (

        <>
            {/* Date Picker */}
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex gap-1 bg-white p-2 rounded-[4px] border border-[#eeeeee]">
                    {weekDates.map((date, index) => {
                        const isToday = date.toDateString() === new Date().toDateString();
                        const isSelected = date.toDateString() === selectedDate.toDateString();
                        return (
                            <div
                                key={index}
                                className={`flex flex-col items-center justify-center w-16 h-16 rounded-md cursor-pointer transition-colors ${isSelected
                                    ? "bg-green-500 text-white"
                                    : isToday
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-white text-gray-800 hover:bg-gray-50"
                                    }`}
                                onClick={() => setSelectedDate(date)}
                            >
                                <span className="text-xs font-medium">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                <span className="text-xs font-bold">{date.getDate()}</span>
                                <span className="text-xs ">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                            </div>
                        );
                    })}
                </div>
                <Button variant="ghost" size="icon" onClick={handleNextWeek}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Time Slots */}
            <div className="grid grid-cols-3 gap-2 mt-4">
                {timeSlots.map((slot, index) => (
                    <Button
                        key={index}
                        variant={selectedTime === slot ? "default" : "outline"}
                        className={`py-3 px-4 text-sm font-medium rounded-md transition-colors ${selectedTime === slot
                            ? "bg-green-100 text-green-800"
                            : "bg-white text-gray-800 hover:bg-gray-50"
                            }`}
                        onClick={() => setSelectedTime(slot)}
                    >
                        {slot}
                    </Button>
                ))}
            </div>
        </>
    );
}
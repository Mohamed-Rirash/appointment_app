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
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface data {
    date: string,
    slot_start: string,
    slot_end: string,
    is_booked: boolean
}



export default function ViewAvailabilityDialog({
    officeId,
    token
}: {
    officeId: string;
    token?: string;
}) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [slots, setSlots] = useState<data[]>([])


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

    const today = new Date()

    console.log("To day date", today.toDateString())
    const mon = today.setDate(today.getDate() - today.getDate() + 1)
    console.log("Mon", mon)




    // const slots = [
    //     {
    //         date: "2025-11-01",
    //         slot_start: "08:00:00",
    //         slot_end: "08:15:00",
    //         is_booked: true
    //     },
    //     {
    //         date: "2025-11-01",
    //         slot_start: "08:15:00",
    //         slot_end: "08:30:00",
    //         is_booked: true
    //     },
    //     {
    //         date: "2025-11-01",
    //         slot_start: "08:30:00",
    //         slot_end: "08:45:00",
    //         is_booked: false
    //     },
    //     {
    //         date: "2025-11-01",
    //         slot_start: "08:45:00",
    //         slot_end: "09:00:00",
    //         is_booked: false
    //     },
    //     {
    //         date: "2025-11-01",
    //         slot_start: "09:00:00",
    //         slot_end: "09:15:00",
    //         is_booked: false
    //     },
    //     {
    //         date: "2025-11-01",
    //         slot_start: "09:15:00",
    //         slot_end: "09:30:00",
    //         is_booked: false
    //     },
    //     {
    //         date: "2025-11-01",
    //         slot_start: "09:30:00",
    //         slot_end: "09:45:00",
    //         is_booked: false
    //     },
    //     {
    //         date: "2025-11-01",
    //         slot_start: "09:45:00",
    //         slot_end: "10:00:00",
    //         is_booked: false
    //     }
    // ]


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

    useEffect(() => {

    }, [])



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
                                className={`flex flex-col items-center justify-center w-16 h-16 rounded-[4px] cursor-pointer transition-colors ${isSelected
                                    ? "bg-green-500 text-white"
                                    : isToday
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-white text-gray-800 hover:bg-gray-50"
                                    }`}
                                onClick={() => setSelectedDate(date)}
                            >
                                <span className="text-xs font-medium ">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
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

                {slots.length !== 0 && slots.map((slt) => (
                    <Button
                        disabled={slt.is_booked}
                        className={`py-6 rounded-sm ${slt.is_booked ? "bg-brand-secondary text-brand-gray cursor-not-allowed" : "cursor-pointer"}`}
                        variant={`${selectedTime === slt.slot_start ? "secondary" : "outline"}`}
                        onClick={() => setSelectedTime(slt.slot_start)}> {slt.slot_start} - {slt.slot_end} </Button>
                ))}
            </div>
            {slots.length === 0 && <div className=" text-center text-sm text-brand-gray w-full py-6">No slots available for this data</div>}
        </>
    );
}
"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Loader2, ChevronDownIcon } from "lucide-react";
import { cn } from "@/libs/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

interface PostponeAppointmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointmentId: string;
    token: string | undefined;
    citizenName: string;
    office_id: string;
    onSuccess?: () => void;
}

interface TimeSlot {
    date: string;
    slot_start: string;
    slot_end: string;
    is_booked: boolean;
}

export function PostponeAppointmentDialog({
    open,
    onOpenChange,
    appointmentId,
    token,
    citizenName,
    office_id,
    onSuccess,
}: PostponeAppointmentDialogProps) {
    const queryClient = useQueryClient();
    const [newDate, setNewDate] = useState<Date | undefined>(undefined);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [reason, setReason] = useState("");
    const [calendarOpen, setCalendarOpen] = useState(false);

    // Get tomorrow's date for min date (can't postpone to past)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const minDate = tomorrow.toISOString().split('T')[0];

    // Load available time slots when date changes
    useEffect(() => {
        if (!office_id || !newDate) {
            setTimeSlots([]);
            setSelectedTimeSlot("");
            return;
        }

        const loadSlots = async () => {
            setLoadingSlots(true);
            setSelectedTimeSlot("");
            try {
                // Format date as YYYY-MM-DD
                const formattedDate = format(newDate, 'yyyy-MM-dd');
                console.log("date", formattedDate)
                const baseURL = process.env.NEXT_PUBLIC_API_URL;
                const res = await fetch(
                    `/api/v1/availability/hosts/${office_id}/slots?target_date=${formattedDate}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                    }
                );

                if (res.ok) {
                    const data = await res.json();
                    console.log("slot", data)
                    setTimeSlots(data);
                } else {
                    setTimeSlots([]);
                    console.error("Failed to load time slots");
                }
            } catch (err) {
                console.error("Failed to load slots:", err);
                setTimeSlots([]);
            } finally {
                setLoadingSlots(false);
            }
        };

        loadSlots();
    }, [office_id, newDate, token]);

    const postponeAppointment = useMutation({
        mutationFn: async () => {
            const baseURL = process.env.NEXT_PUBLIC_API_URL;

            if (!selectedTimeSlot || !newDate) {
                throw new Error("Please select a date and time slot");
            }

            // Combine date and time into ISO format
            const newAppointmentDate = new Date(
                `${newDate.toISOString().split('T')[0]}T${selectedTimeSlot}`
            ).toISOString();
            //   'http://localhost/api/v1/appointments/dae1450a-6094-4b37-8b8b-a2af5a73bfe6/postpone'
            const res = await fetch(
                `${baseURL}/appointments/${appointmentId}/postpone`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        new_appointment_date: newAppointmentDate,
                        new_time_slot: selectedTimeSlot,
                        status: "PENDING",
                        reason: reason,
                    }),
                }
            );

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                console.error("Postpone failed:", errorData);
                throw new Error("Failed to postpone appointment");
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-appointments', office_id] });
            queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
            onOpenChange(false);
            resetForm();
            onSuccess?.();
        },
        onError: (error) => {
            console.error("Postpone error:", error);
        },
    });

    const resetForm = () => {
        setNewDate(undefined);
        setSelectedTimeSlot("");
        setTimeSlots([]);
        setReason("");
    };

    const handleSubmit = () => {
        if (!newDate || !selectedTimeSlot) {
            alert("Please select both date and time slot");
            return;
        }
        postponeAppointment.mutate();
    };

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const formatDateForDisplay = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetForm();
        }
        onOpenChange(open);
    };

    const handleDateSelect = (date: Date | undefined) => {
        setNewDate(date);
        setCalendarOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-brand" />
                        Postpone Appointment
                    </DialogTitle>
                    <DialogDescription>
                        Reschedule <span className="text-brand font-bold"> {citizenName}&apos;s </span> appointment to a new date and time.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Date Selection with shadcn Calendar */}
                    <div className="space-y-2">
                        <Label htmlFor="new-date" className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            Select New Date *
                        </Label>
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-between font-normal py-5",
                                        !newDate && "text-muted-foreground"
                                    )}
                                >
                                    {newDate ? formatDateForDisplay(newDate) : "Select date"}
                                    <ChevronDownIcon className="h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={newDate}
                                    onSelect={handleDateSelect}
                                    disabled={(date) => date < tomorrow}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <p className="text-xs text-muted-foreground">
                            Select a date to see available time slots
                        </p>
                    </div>

                    {/* Reason Input */}
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="flex items-center gap-2">
                            Reason
                        </Label>
                        <Input
                            id="reason"
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter reason for postponement"
                            className="w-full py-5"
                        />
                        <p className="text-xs text-muted-foreground">
                            Optional: Provide a reason for postponing
                        </p>
                    </div>

                    {/* Time Slots Selection */}
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Available Time Slots {newDate && `for ${formatDateForDisplay(newDate)}`}
                        </Label>

                        {loadingSlots ? (
                            <div className="flex justify-center py-6">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading available slots...
                                </div>
                            </div>
                        ) : timeSlots.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                                {timeSlots.map((slot) => {
                                    const isSelected = selectedTimeSlot === slot.slot_start;
                                    const isBooked = slot.is_booked;

                                    return (
                                        <Button
                                            key={slot.slot_start}
                                            type="button"
                                            disabled={isBooked}
                                            variant={isSelected ? "default" : "outline"}
                                            onClick={() => !isBooked && setSelectedTimeSlot(slot.slot_start)}
                                            className={cn(
                                                "h-12 flex-col gap-1 relative transition-all",
                                                isBooked && "opacity-50 cursor-not-allowed",
                                                isSelected && "bg-brand text-white border-brand"
                                            )}
                                        >
                                            <span className="font-semibold text-sm">
                                                {formatTime(slot.slot_start)}
                                            </span>
                                            {isBooked && (
                                                <Badge
                                                    variant="secondary"
                                                    className="absolute -top-1 -right-1 h-4 text-xs"
                                                >
                                                    Booked
                                                </Badge>
                                            )}
                                        </Button>
                                    );
                                })}
                            </div>
                        ) : newDate ? (
                            <div className="text-center py-6 border-2 border-dashed border-muted rounded-lg bg-muted/20">
                                <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-60" />
                                <p className="text-muted-foreground font-medium mb-1">
                                    No available slots
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Please select a different date
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-6 border-2 border-dashed border-muted rounded-lg bg-muted/20">
                                <CalendarIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-60" />
                                <p className="text-sm text-muted-foreground">
                                    Select a date to view available time slots
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Selected Time Display */}
                    {selectedTimeSlot && newDate && (
                        <div className="p-3 bg-brand-primary border border-brand-primary rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-brand">
                                        Selected Time
                                    </p>
                                    <p className="text-brand">
                                        {formatDateForDisplay(newDate)} at {formatTime(selectedTimeSlot)}
                                    </p>
                                </div>
                                <Badge variant="default" className="bg-brand">
                                    Selected
                                </Badge>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex gap-2 sm:gap-1">
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={postponeAppointment.isPending}
                        className="flex-1 text-brand-gray border-brand-secondary"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={postponeAppointment.isPending || !newDate || !selectedTimeSlot}
                        className="flex-1 bg-brand hover:bg-brand/80"
                    >
                        {postponeAppointment.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Postponing...
                            </>
                        ) : (
                            "Postpone Appointment"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
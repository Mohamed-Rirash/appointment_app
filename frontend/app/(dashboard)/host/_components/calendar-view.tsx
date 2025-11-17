// components/appointments/calendar-view.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO, isToday, isSameDay, setHours, setMinutes } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
    RefreshCw,
    Calendar,
    Clock,
    User,
    MapPin,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Phone,
    Inbox,
    AlertCircle
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/libs/utils";
import { client } from "@/helpers/api/client";

interface CalendarViewProps {
    office_id: string;
    token: string | undefined;
}

interface Appointment {
    appointment_id: string;
    citizen_firstname: string;
    citizen_lastname: string;
    citizen_email: string;
    citizen_phone?: string;
    purpose: string;
    appointment_date: string;
    time_slotted: string;
    status: string;
    host_first_name?: string;
    host_last_name?: string;
}

interface TimeSlot {
    hour: number;
    time: string;
    appointments: Appointment[];
}

export function CalendarView({ office_id, token }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const { data: appointmentsData, isLoading, isError, refetch } = useQuery({
        queryKey: ["calendar-appointments", office_id, format(currentDate, "yyyy-MM-dd")],
        queryFn: async () => {
            if (!token) throw new Error("Authentication required");
            return await client.getOfficeAppointments(
                office_id,
                "APPROVED",
                100,
                0,
                token
            );
        },
        enabled: !!token,
    });

    const todaysAppointments = appointmentsData?.appointments?.filter(appointment => {
        const appointmentDate = parseISO(appointment.appointment_date);
        return isSameDay(appointmentDate, currentDate) && appointment.status === "APPROVED";
    }) || [];

    const generateTimeSlots = (): TimeSlot[] => {
        const slots: TimeSlot[] = [];
        const startHour = 8;
        const endHour = 18;

        for (let hour = startHour; hour <= endHour; hour++) {
            const appointmentsForSlot = todaysAppointments.filter(appointment => {
                const appointmentHour = parseInt(appointment.time_slotted.split(':')[0]);
                return appointmentHour === hour;
            });

            slots.push({
                hour,
                time: format(setHours(setMinutes(new Date(), 0), hour), "h:mm a"),
                appointments: appointmentsForSlot
            });
        }

        return slots;
    };

    const timeSlots = generateTimeSlots();
    const totalAppointments = todaysAppointments.length;
    const isCurrentDay = isToday(currentDate);

    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'prev' ? -1 : 1));
        setCurrentDate(newDate);
    };

    const goToToday = () => setCurrentDate(new Date());

    if (isLoading) return <CalendarViewSkeleton />;

    if (isError) {
        return (
            <Card className="w-full border-orange-200">
                <CardContent className="p-8 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                        <AlertCircle className="h-6 w-6 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Unable to Load Schedule</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                        We couldn't retrieve your appointments for this date. Please check your connection and try again.
                    </p>
                    <Button onClick={() => refetch()} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full bg-white/80 backdrop-blur-sm border-gray-200">
            <CardHeader className="pb-5 px-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                            <Calendar className="h-6 w-6 text-blue-700" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">
                                {isCurrentDay ? "Today's Schedule" : "Your Schedule"}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1.5">
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-sm font-medium",
                                        isCurrentDay
                                            ? "bg-green-50 text-green-700 border-green-200"
                                            : "bg-gray-50 text-gray-600 border-gray-200"
                                    )}
                                >
                                    {format(currentDate, "EEEE, MMMM d, yyyy")}
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                >
                                    {totalAppointments} {totalAppointments === 1 ? "visitor" : "visitors"} scheduled
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateDate('prev')}
                            className="h-9 w-9 p-0 hover:bg-gray-100 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToToday}
                            disabled={isCurrentDay}
                            className={cn(
                                "h-9 px-3 transition-all",
                                !isCurrentDay && "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                            )}
                        >
                            Today
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateDate('next')}
                            className="h-9 w-9 p-0 hover:bg-gray-100 transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        <div className="w-px h-6 bg-gray-200 mx-1" />

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            disabled={isLoading}
                            className="h-9 px-3 hover:bg-gray-100 transition-colors"
                        >
                            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="border-t border-gray-200">
                    {timeSlots.map((slot) => {
                        const hasAppointments = slot.appointments.length > 0;
                        const isPastSlot = new Date().setHours(slot.hour, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

                        return (
                            <div
                                key={slot.hour}
                                className={cn(
                                    "flex border-b last:border-b-0 transition-colors",
                                    hasAppointments
                                        ? "bg-white hover:bg-blue-50/30"
                                        : "bg-gray-50/60 hover:bg-gray-50",
                                    !hasAppointments && !isCurrentDay && "opacity-80"
                                )}
                            >
                                <div className="w-28 flex-shrink-0 border-r border-gray-200 p-4">
                                    <div className={cn(
                                        "text-sm font-semibold text-gray-900",
                                        !hasAppointments && "text-gray-500"
                                    )}>
                                        {slot.time}
                                    </div>
                                    {hasAppointments && (
                                        <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 bg-blue-50 rounded-full">
                                            <Clock className="h-3 w-3 text-blue-600" />
                                            <span className="text-xs font-medium text-blue-700">
                                                {slot.appointments.length}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 p-4 min-h-24">
                                    {hasAppointments ? (
                                        <div className="space-y-3">
                                            {slot.appointments.map((appointment) => (
                                                <AppointmentCard
                                                    key={appointment.appointment_id}
                                                    appointment={appointment}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center">
                                            <span className="text-sm text-gray-400 font-medium">
                                                Available for booking
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {totalAppointments === 0 && (
                    <div className="text-center py-16 px-6">
                        <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Inbox className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No Scheduled Visitors
                        </h3>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">
                            You have no confirmed appointments for {format(currentDate, "MMMM d, yyyy")}.
                            {isCurrentDay && " New bookings will appear here automatically."}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    return (
        <div className={cn(
            "bg-white border border-gray-200 rounded-xl p-4 transition-all",
            "hover:shadow-lg hover:border-blue-200 hover:translate-x-1",
            "cursor-pointer"
        )}>
            <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                    <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${appointment.citizen_email}`}
                        alt={`${appointment.citizen_firstname} ${appointment.citizen_lastname}`}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                        {appointment.citizen_firstname[0]}{appointment.citizen_lastname[0]}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 text-base truncate">
                                {appointment.citizen_firstname} {appointment.citizen_lastname}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {appointment.purpose}
                            </p>
                        </div>
                        <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 text-xs font-medium flex-shrink-0"
                        >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Confirmed
                        </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5 font-medium">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span>{formatTime(appointment.time_slotted)}</span>
                        </div>

                        {appointment.citizen_phone && (
                            <div className="flex items-center gap-1.5 font-medium">
                                <Phone className="h-3.5 w-3.5 text-gray-400" />
                                <span>{appointment.citizen_phone}</span>
                            </div>
                        )}

                        {appointment.host_first_name && (
                            <div className="flex items-center gap-1.5 font-medium">
                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                <span>Room: {appointment.host_first_name}</span>
                            </div>
                        )}
                    </div>
                </div>

                <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-3 hover:bg-blue-50 ml-2"
                >
                    Details
                </Button>
            </div>
        </div>
    );
}

function CalendarViewSkeleton() {
    return (
        <Card className="w-full">
            <CardHeader className="pb-5 px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-11 w-11 rounded-xl" />
                        <div>
                            <Skeleton className="h-7 w-56 mb-2" />
                            <Skeleton className="h-5 w-40" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-9 w-16 rounded-lg" />
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-9 w-9 rounded-lg" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="border-t border-gray-200">
                    {[...Array(11)].map((_, i) => (
                        <div key={i} className="flex border-b last:border-b-0">
                            <div className="w-28 flex-shrink-0 border-r border-gray-200 p-4">
                                <Skeleton className="h-4 w-16 mb-2" />
                                <Skeleton className="h-3 w-8" />
                            </div>
                            <div className="flex-1 p-4">
                                <Skeleton className="h-20 w-full rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
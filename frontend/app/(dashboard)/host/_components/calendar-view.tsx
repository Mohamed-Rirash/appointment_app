"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    MapPin,
    CheckCircle2,
    Phone,
    Inbox,
    AlertCircle,
    Loader2
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/libs/utils";
import { client } from "@/helpers/api/client";
import toast from "react-hot-toast";

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
    const queryClient = useQueryClient();

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


    //Filter only today's approved appointments
    const todaysAppointments = appointmentsData?.appointments?.filter(appointment => {
        const appointmentDate = parseISO(appointment.appointment_date);
        return isToday(appointmentDate) && appointment.status === "APPROVED";
    }) || [];

    const generateTimeSlots = (): TimeSlot[] => {
        const slots: TimeSlot[] = [];
        const startHour = 8;
        const endHour = 18;

        for (let hour = startHour; hour <= endHour; hour++) {
            const appointmentsForSlot = todaysAppointments?.filter(appointment => {
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
        <Card className="w-full bg-white/80 backdrop-blur-sm border-brand-secondary">
            <CardHeader className="pb-5 px-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-brand-primary/50 rounded-xl">
                            <Calendar className="h-6 w-6 text-brand" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">
                                Today's Appointments
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1.5">
                                <Badge
                                    variant="outline"
                                    className="bg-brand-primary/20 text-brand border-brand-primary/80 text-sm font-medium"
                                >
                                    {format(new Date(), "EEEE, MMMM d, yyyy")}
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    className="bg-brand-primary text-brand hover:bg-brand-primary/80 transition-colors"
                                >
                                    {totalAppointments} {totalAppointments === 1 ? "appointment" : "appointments"} today
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={() => refetch()}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="border-t border-gray-200">
                    {timeSlots.map((slot) => {
                        const hasAppointments = slot.appointments.length > 0;
                        const isPastSlot = slot.hour < new Date().getHours();

                        return (
                            <div
                                key={slot.hour}
                                className={cn(
                                    "flex border-b last:border-b-0 transition-colors",
                                    hasAppointments
                                        ? "bg-white hover:bg-blue-50/30"
                                        : "bg-gray-50/60",
                                    isPastSlot && "opacity-70"
                                )}
                            >
                                <div className="w-28 shrink-0 border-r border-gray-200 p-4">
                                    <div className={cn(
                                        "text-sm font-semibold",
                                        hasAppointments ? "text-gray-900" : "text-gray-500",
                                        isPastSlot && "text-gray-400"
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
                                                    token={token}
                                                    onStatusChange={() => {
                                                        refetch();
                                                        queryClient.invalidateQueries({
                                                            queryKey: ["calendar-appointments"]
                                                        });
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center">
                                            <span className={cn(
                                                "text-sm font-medium",
                                                isPastSlot ? "text-gray-400" : "text-gray-500"
                                            )}>
                                                {isPastSlot ? "Time slot passed" : "No appointments"}
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
                            No Appointments Today
                        </h3>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">
                            You have no confirmed appointments for today. New bookings will appear here automatically.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface AppointmentCardProps {
    appointment: Appointment;
    token: string | undefined;
    onStatusChange: () => void;
}

function AppointmentCard({ appointment, token, onStatusChange }: AppointmentCardProps) {
    const [isCompleting, setIsCompleting] = useState(false);

    const completeMutation = useMutation({
        mutationFn: async () => {
            if (!token) throw new Error("Authentication required");
            return await client.updateAppointmentStatus(
                appointment.appointment_id,
                token
            );
        },
        onSuccess: () => {
            toast.success("Appointment marked as completed!");
            onStatusChange();
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to complete appointment");
        },
        onSettled: () => {
            setIsCompleting(false);
        }
    });

    const handleComplete = async () => {
        setIsCompleting(true);
        completeMutation.mutate();
    };

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const isPastAppointment = () => {
        const appointmentHour = parseInt(appointment.time_slotted.split(':')[0]);
        return appointmentHour < new Date().getHours();
    };

    return (
        <div className={cn(
            "bg-white border border-gray-200 rounded-xl p-4 transition-all",
            "hover:shadow-lg hover:border-blue-200",
            isPastAppointment() && "opacity-80"
        )}>
            <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                    <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${appointment.citizen_email}`}
                        alt={`${appointment.citizen_firstname} ${appointment.citizen_lastname}`}
                    />
                    <AvatarFallback className="bg-linear-to-br from-blue-500 to-blue-600 text-white font-semibold">
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

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
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
                                <span>Host: {appointment.host_first_name} {appointment.host_last_name}</span>
                            </div>
                        )}
                    </div>

                    {/* Complete Button */}
                    <div className="flex justify-end">
                        <Button
                            size="sm"
                            onClick={handleComplete}
                            disabled={isCompleting}
                            className={cn(
                                "bg-green-600 hover:bg-green-700 text-white font-medium",
                                isCompleting && "opacity-70"
                            )}
                        >
                            {isCompleting ? (
                                <>
                                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                    Completing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-3 w-3 mr-2" />
                                    Mark Complete
                                </>
                            )}
                        </Button>
                    </div>
                </div>
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
                    <Skeleton className="h-9 w-24 rounded-lg" />
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
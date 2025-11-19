"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    CheckCircle2,
    XCircle,
    Clock,
    User,
    Phone,
    Calendar,
    RefreshCw,
    AlertCircle,
    Inbox,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { RejectAppointmentDialog } from "./reject";
import { PostponeAppointmentDialog } from "./postponeAppointment";
import { cn } from "@/libs/utils";

interface Appointment {
    appointment_id: string;
    citizen_firstname: string;
    citizen_lastname: string;
    citizen_email: string;
    citizen_phone: string;
    appointment_date: string;
    time_slotted: string;
    status: string;
    purpose: string;
    created_at: string;
    host_first_name: string;
    host_last_name: string;
}

interface ApiResponse {
    total: number;
    limit: number;
    offset: number;
    appointments: Appointment[];
}

interface TransformedAppointment {
    id: string;
    citizen: {
        name: string;
        email: string;
        phone: string;
    };
    time_slot: string;
    status: string;
    purpose: string;
    created_at: string;
    originalData: Appointment;
}

const baseURL = process.env.NEXT_PUBLIC_API_URL;

export function HostTodaysAppointments({
    office_id,
    token
}: {
    office_id: string;
    token: string;
}) {
    const queryClient = useQueryClient();
    const [showAll, setShowAll] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [postponeDialogOpen, setPostponeDialogOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<{
        id: string;
        citizenName: string;
    } | null>(null);

    const handleRejectClick = (appointmentId: string, citizenName: string) => {
        setSelectedAppointment({ id: appointmentId, citizenName });
        setRejectDialogOpen(true);
    };

    const handlePostponeClick = (appointmentId: string, citizenName: string) => {
        setSelectedAppointment({ id: appointmentId, citizenName });
        setPostponeDialogOpen(true);
    };

    const { data: appointmentsData, isLoading, isError, refetch } = useQuery({
        queryKey: ["todays-appointments", office_id],
        queryFn: async () => {
            const res = await fetch(
                `/api/v1/views/${office_id}/allpastappointments?status=PENDING&limit=100&offset=0`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch appointments");
            return res.json();
        },

    });

    const transformAppointments = (data: ApiResponse): TransformedAppointment[] => {
        if (!data?.appointments) return [];

        return data.appointments.map(appointment => ({
            id: appointment.appointment_id,
            citizen: {
                name: `${appointment.citizen_firstname} ${appointment.citizen_lastname}`,
                email: appointment.citizen_email,
                phone: appointment.citizen_phone
            },
            time_slot: `${appointment.appointment_date.split('T')[0]}T${appointment.time_slotted}`,
            status: appointment.status.toLowerCase(),
            purpose: appointment.purpose,
            created_at: appointment.created_at,
            originalData: appointment
        }));
    };

    const allAppointments = transformAppointments(appointmentsData);
    const sortedAppointments = allAppointments.sort(
        (a, b) => new Date(a.time_slot).getTime() - new Date(b.time_slot).getTime()
    );

    const displayedAppointments = showAll ? sortedAppointments : sortedAppointments.slice(0, 5);

    const approveAppointment = useMutation({
        mutationFn: async (appointmentId: string) => {
            const res = await fetch(
                `${baseURL}/appointments/${appointmentId}/decision?status=APPROVED&office_id=${office_id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                }
            );
            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                console.error("Approval failed:", errorData);
                throw new Error("Failed to approve appointment");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["todays-appointments"] });
            queryClient.invalidateQueries({ queryKey: ["calendar-appointments"] });
        },
    });

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-6 w-48" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-lg" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (isError) {
        return (
            <Card className="w-full border-orange-200">
                <CardContent className="p-8 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                        <AlertCircle className="h-6 w-6 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Issue</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                        We couldn't load your appointment queue. Please check your connection.
                    </p>
                    <Button onClick={() => refetch()} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const AppointmentCard = ({ appointment }: { appointment: TransformedAppointment }) => {
        const time = format(parseISO(appointment.time_slot), "h:mm a");
        const isProcessing = approveAppointment.isPending &&
            approveAppointment.variables === appointment.id;

        return (
            <div className={cn(
                "bg-white border border-gray-200 rounded-xl p-5 transition-all",
                "hover:shadow-lg hover:border-blue-200 hover:translate-x-1 cursor-pointer"
            )}>
                <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 ring-2 ring-white shadow-md">
                        <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${appointment.citizen.email}`}
                            alt={appointment.citizen.name}
                        />
                        <AvatarFallback className="bg-linear-to-br from-amber-400 to-orange-500 text-white font-semibold text-lg">
                            {appointment.citizen.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                            <div className="min-w-0">
                                <h4 className="font-semibold text-gray-900 text-lg truncate">
                                    {appointment.citizen.name}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {appointment.purpose}
                                </p>
                            </div>
                            <Badge
                                variant="outline"
                                className="bg-amber-50 text-amber-700 border-amber-200 flex-shrink-0 ml-3"
                            >
                                <Clock className="w-3 h-3 mr-1" />
                                Pending Review
                            </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-1.5 font-medium">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>{time}</span>
                            </div>
                            {appointment.citizen.phone && (
                                <div className="flex items-center gap-1.5">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span>{appointment.citizen.phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{appointment.citizen.email}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 flex-col sm:flex-row">
                            <Button
                                size="sm"
                                className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 font-medium"
                                onClick={() => approveAppointment.mutate(appointment.id)}
                                disabled={isProcessing}
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {isProcessing ? "Confirming..." : "Approve Request"}
                            </Button>

                            <div className="flex gap-2 flex-1">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handlePostponeClick(appointment.id, appointment.citizen.name)}
                                >
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Reschedule
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-red-600 hover:bg-red-50"
                                    onClick={() => handleRejectClick(appointment.id, appointment.citizen.name)}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Decline
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <Card className="w-full bg-white/80 backdrop-blur-sm border-gray-200">
                <CardHeader className="pb-5 px-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl">
                                <Clock className="h-6 w-6 text-orange-700" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">
                                    Incoming Appointment Requests
                                </CardTitle>
                                <p className="text-sm text-gray-500 mt-1.5">
                                    Review and manage incoming visitor requests
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Badge
                                variant="secondary"
                                className="bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                            >
                                <Clock className="h-3.5 w-3.5 mr-1.5" />
                                {allAppointments.length} pending
                            </Badge>

                            {allAppointments.length > 5 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAll(!showAll)}
                                    className="h-9 px-3 hover:bg-gray-100 transition-colors"
                                >
                                    {showAll ? (
                                        <>
                                            <ChevronUp className="h-4 w-4 mr-2" />
                                            Show Less
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="h-4 w-4 mr-2" />
                                            Show All ({allAppointments.length})
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="px-6 pb-6">
                    {displayedAppointments.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <Inbox className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                No Pending Requests
                            </h3>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                                Great! You've reviewed all pending appointments. New requests will appear here automatically.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {displayedAppointments.map((appointment) => (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            {selectedAppointment && (
                <>
                    <RejectAppointmentDialog
                        open={rejectDialogOpen}
                        onOpenChange={setRejectDialogOpen}
                        appointmentId={selectedAppointment.id}
                        office_id={office_id}
                        token={token}
                        citizenName={selectedAppointment.citizenName}
                    />
                    <PostponeAppointmentDialog
                        open={postponeDialogOpen}
                        onOpenChange={setPostponeDialogOpen}
                        appointmentId={selectedAppointment.id}
                        token={token}
                        citizenName={selectedAppointment.citizenName}
                        office_id={office_id}
                    />
                </>
            )}
        </>
    );
}
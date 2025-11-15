"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Clock,
    User,
    CheckCircle,
    XCircle,
    Calendar,
    RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { RejectAppointmentDialog } from "./reject";
import { PostponeAppointmentDialog } from "./postponeAppointment";

// Update interface to match your API response
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

const baseURL = process.env.NEXT_PUBLIC_API_URL;

export function HostTodaysAppointments({
    initialAppointments,
    office_id,
    token
}: {
    initialAppointments: ApiResponse;
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

    // fetch appointments
    const { data: appointmentsData, isLoading, isError } = useQuery({
        queryKey: ["todays-appointments", office_id],
        queryFn: async () => {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/views/${office_id}/appointments?status=PENDING&limit=10&offset=0`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch appointments");
            return res.json();
        },
        initialData: initialAppointments,
    });

    const transformAppointments = (data: ApiResponse) => {
        if (!data?.appointments) return [];

        return data.appointments.map(appointment => ({
            id: appointment.appointment_id,
            citizen: {
                name: `${appointment.citizen_firstname} ${appointment.citizen_lastname}`,
                email: appointment.citizen_email,
                phone: appointment.citizen_phone
            },
            time_slot: `${appointment.appointment_date.split('T')[0]}T${appointment.time_slotted}`,
            status: appointment.status.toLowerCase() as "pending" | "approved" | "rejected" | "completed" | "postponed",
            purpose: appointment.purpose,
            created_at: appointment.created_at,
            originalData: appointment
        }));
    };

    const allAppointments = transformAppointments(appointmentsData || initialAppointments);
    const sortedAppointments = allAppointments.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Show only latest 5, or all if showAll is true
    const displayedAppointments = showAll ? sortedAppointments : sortedAppointments.slice(0, 5);

    console.log("Transformed appointments:", displayedAppointments);

    // Decision mutations
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
            queryClient.invalidateQueries({
                queryKey: ["todays-appointments"]
            });

        },
        onError: (error) => {
            console.error("Approval error:", error);
        },
    });

    const rejectAppointment = useMutation({
        mutationFn: async (appointmentId: string) => {
            const res = await fetch(
                `${baseURL}/appointments/${appointmentId}/decision?status=REJECTED&office_id=${office_id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                }
            );
            if (!res.ok) throw new Error("Failed to reject");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["todays-appointments"]
            });
        },
    });

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            pending: "warning",
            approved: "success",
            rejected: "destructive",
            completed: "outline",
            postponed: "secondary",
        };
        return <Badge variant={variants[status] || "default"}>{status.toUpperCase()}</Badge>;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "pending":
                return <Clock className="h-4 w-4 text-yellow-500" />;
            case "approved":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "rejected":
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Calendar className="h-4 w-4 text-gray-500" />;
        }
    };



    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading appointments...
                    </CardTitle>
                </CardHeader>
            </Card>
        );
    }

    if (isError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-500">
                        <XCircle className="h-4 w-4" />
                        Failed to load appointments
                    </CardTitle>
                </CardHeader>
            </Card>
        );
    }

    return (
        <>
            <Card className="bg-brand-primary/20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Today's Appointments
                            {!showAll && allAppointments.length > 5 && (
                                <Badge variant="outline" className="ml-2">
                                    Latest 5 of {allAppointments.length}
                                </Badge>
                            )}
                        </CardTitle>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                {getStatusIcon("pending")}
                                <p>Pending {allAppointments.length}</p>
                            </div>
                            {/* Show More/Less toggle */}
                            {allAppointments.length > 5 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAll(!showAll)}
                                >
                                    {showAll ? 'Show Less' : `Show All (${allAppointments.length})`}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Citizen</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Purpose</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayedAppointments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <div className="text-muted-foreground">No appointments scheduled for today</div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                displayedAppointments.map((appointment) => (
                                    <TableRow key={appointment.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${appointment.citizen.email}`} />
                                                    <AvatarFallback>
                                                        <User className="h-4 w-4" />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{appointment.citizen.name}</p>
                                                    <p className="text-sm text-brand-gray">{appointment.citizen.email}</p>
                                                    {appointment.citizen.phone && (
                                                        <p className="text-xs text-brand-gray">{appointment.citizen.phone}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 font-mono text-sm">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(appointment.time_slot), "h:mm a")}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">{appointment.purpose}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                {getStatusIcon(appointment.status)}
                                                {getStatusBadge(appointment.status)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {appointment.status === "pending" && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => approveAppointment.mutate(appointment.id)}
                                                            disabled={approveAppointment.isPending}
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                            {approveAppointment.isPending ? "Approving..." : "Approve"}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-brand"
                                                            onClick={() => handlePostponeClick(appointment.id, appointment.citizen.name)}
                                                        >
                                                            <Calendar className="h-4 w-4 mr-1" />
                                                            Postpone
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleRejectClick(appointment.id, appointment.citizen.name)}
                                                        >
                                                            <XCircle className="h-4 w-4 mr-1" />
                                                            Rejectr
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
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
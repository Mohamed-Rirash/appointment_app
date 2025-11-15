"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    ArrowRight,
    Calendar,
    RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface Appointment {
    id: string;
    citizen: {
        name: string;
        email: string;
        phone?: string;
    };
    time_slot: string;
    status: "pending" | "approved" | "rejected" | "completed" | "postponed";
    purpose: string;
    created_at: string;
}

interface HostTodaysAppointmentsProps {
    initialAppointments: Appointment[];
}

export function HostTodaysAppointments({ initialAppointments }: HostTodaysAppointmentsProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    console.log("data", initialAppointments)
    const appointments = initialAppointments
    // Subscribe to real-time updates
    useEffect(() => {
        const eventSource = new EventSource("/api/v1/appointments/events");

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "appointment_updated") {
                queryClient.invalidateQueries(["todays-appointments"]);
            }
        };

        return () => {
            eventSource.close();
        };
    }, [queryClient]);

    // Fetch appointments
    // const { data: appointments, isLoading } = useQuery({
    //     queryKey: ["todays-appointments", selectedStatus],
    //     queryFn: async () => {
    //         const today = new Date().toISOString().split("T")[0];
    //         const statusParam = selectedStatus !== "all" ? `&status=${selectedStatus}` : "";
    //         const res = await fetch(
    //             `/api/v1/views/my/appointments?date=${today}${statusParam}`
    //         );
    //         return res.json();
    //     },
    //     initialData: initialAppointments,
    // });
    const isLoading = false
    // Decision mutations
    const approveAppointment = useMutation({
        mutationFn: async (appointmentId: string) => {
            const res = await fetch(`/api/v1/appointments/${appointmentId}/decision`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision: "approve" }),
            });
            if (!res.ok) throw new Error("Failed to approve");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["todays-appointments"]);
        },
    });

    const rejectAppointment = useMutation({
        mutationFn: async (appointmentId: string) => {
            const res = await fetch(`/api/v1/appointments/${appointmentId}/decision`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision: "reject" }),
            });
            if (!res.ok) throw new Error("Failed to reject");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["todays-appointments"]);
        },
    });

    const completeAppointment = useMutation({
        mutationFn: async (appointmentId: string) => {
            const res = await fetch(`/api/v1/appointments/${appointmentId}/complete`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Failed to complete");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["todays-appointments"]);
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
        return <Badge variant={variants[status] || "default"}>{status}</Badge>;
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

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Today's Appointments
                    </CardTitle>

                    {/* Status Filter */}
                    {/* <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-3 py-1 border rounded-md text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="completed">Completed</option>
                    </select> */}
                    {/* <div className="">
                        <p>pending {appointments.length}</p>
                        {getStatusIcon("pending")}
                    </div> */}
                    <div className="flex items-center gap-1">
                        {getStatusIcon("pending")}
                        <p>pending {appointments.length}</p>
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
                        {appointments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <div className="text-muted-foreground">No appointments scheduled for today</div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            appointments.map((appointment: Appointment) => (
                                <TableRow key={appointment.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=  ${appointment.citizen.email}`} />
                                                <AvatarFallback>
                                                    <User className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{appointment.citizen.name}</p>
                                                <p className="text-sm text-muted-foreground">{appointment.citizen.email}</p>
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
                                                        disabled={approveAppointment.isLoading}
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="text-brand"
                                                        variant="outline"
                                                        onClick={() => rejectAppointment.mutate(appointment.id)}
                                                        disabled={rejectAppointment.isLoading}
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => rejectAppointment.mutate(appointment.id)}
                                                        disabled={rejectAppointment.isLoading}
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                            {appointment.status === "approved" && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => completeAppointment.mutate(appointment.id)}
                                                    disabled={completeAppointment.isLoading}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Complete
                                                </Button>
                                            )}
                                            {true && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => completeAppointment.mutate(appointment.id)}
                                                    disabled={completeAppointment.isLoading}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Complete
                                                </Button>
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
    );
}
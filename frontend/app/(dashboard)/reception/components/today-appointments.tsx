"use client";

import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Clock, User, MoreHorizontal, Calendar } from "lucide-react";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";

interface Appointment {
    id: string;
    citizen: {
        id: string;
        full_name: string;
        phone_number?: string;
    };
    host: {
        id: string;
        full_name: string;
        position?: string;
    };
    date: string;
    time_slot: string;
    status: "approved" | "pending" | "checked_in" | "cancelled" | "completed";
    purpose?: string;
}


export function TodayAppointments() {
    const router = useRouter();

    const { data: appointments, isLoading, error } = useQuery<Appointment[]>({
        queryKey: ["today-appointments"],
        queryFn: async () => {
            return [];
        },
    });


    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; label: string }> = {
            approved: { variant: "default", label: "Approved" },
            pending: { variant: "secondary", label: "Pending" },
            checked_in: { variant: "success", label: "Checked In" },
            cancelled: { variant: "destructive", label: "Cancelled" },
            completed: { variant: "outline", label: "Completed" },
        };

        const config = variants[status] || { variant: "default", label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading appointments...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
                Failed to load appointments: {error.message}
            </div>
        );
    }

    if (!appointments?.length) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No appointments scheduled for today</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Desktop/Tablet Table View */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Citizen</TableHead>
                            <TableHead>Host</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {appointments.map((appointment: Appointment) => (
                            <TableRow key={appointment.id}>
                                <TableCell className="font-medium">
                                    {appointment.time_slot}
                                </TableCell>

                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${appointment.citizen.id}`}
                                            />
                                            <AvatarFallback>
                                                {appointment.citizen.full_name.split(" ").map(n => n[0]).join("")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {appointment.citizen.full_name}
                                            </p>
                                            {appointment.citizen.phone_number && (
                                                <p className="text-xs text-muted-foreground">
                                                    {appointment.citizen.phone_number}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div>
                                        <p className="text-sm font-medium">
                                            {appointment.host.full_name}
                                        </p>
                                        {appointment.host.position && (
                                            <p className="text-xs text-muted-foreground">
                                                {appointment.host.position}
                                            </p>
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell className="text-muted-foreground">
                                    {appointment.purpose || "General appointment"}
                                </TableCell>

                                <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View (for tablets/phones) */}
            <div className="md:hidden space-y-3">
                {appointments.map((appointment: Appointment) => (
                    <Card key={appointment.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="font-medium">
                                    {appointment.time_slot}
                                </p>
                                {getStatusBadge(appointment.status)}
                            </div>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{appointment.citizen.full_name}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{appointment.host.full_name}</span>
                            </div>

                            {appointment.purpose && (
                                <p className="text-muted-foreground">{appointment.purpose}</p>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
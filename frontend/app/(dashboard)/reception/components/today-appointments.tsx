"use client";

import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Clock, User, MoreHorizontal, Calendar } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

// Dummy data for appointments
const dummyAppointments: Appointment[] = [
    {
        id: "1",
        citizen: {
            id: "citizen-1",
            full_name: "Ahmed Mohamed",
            phone_number: "+252-63-1234567"
        },
        host: {
            id: "host-1",
            full_name: "Dr. Fatima Hassan",
            position: "Senior Health Officer"
        },
        date: "2024-01-15",
        time_slot: "09:00 AM",
        status: "approved",
        purpose: "Health Certificate Application"
    },
    {
        id: "2",
        citizen: {
            id: "citizen-2",
            full_name: "Khadra Abdi Ali",
            phone_number: "+252-90-9876543"
        },
        host: {
            id: "host-2",
            full_name: "Eng. Omar Jama",
            position: "Building Inspector"
        },
        date: "2024-01-15",
        time_slot: "09:30 AM",
        status: "checked_in",
        purpose: "Building Permit Consultation"
    },
    {
        id: "3",
        citizen: {
            id: "citizen-3",
            full_name: "Mohamed Ibrahim",
            phone_number: "+252-65-5551234"
        },
        host: {
            id: "host-3",
            full_name: "Aisha Mohamed",
            position: "License Officer"
        },
        date: "2024-01-15",
        time_slot: "10:00 AM",
        status: "pending",
        purpose: "Business License Renewal"
    },
    {
        id: "4",
        citizen: {
            id: "citizen-4",
            full_name: "Zahra Omar",
            phone_number: "+252-63-4447890"
        },
        host: {
            id: "host-4",
            full_name: "Hassan Duale",
            position: "Passport Officer"
        },
        date: "2024-01-15",
        time_slot: "10:30 AM",
        status: "approved",
        purpose: "Passport Application"
    },
    {
        id: "5",
        citizen: {
            id: "citizen-5",
            full_name: "Jamal Yusuf",
            phone_number: "+252-90-3334567"
        },
        host: {
            id: "host-5",
            full_name: "Naima Ahmed",
            position: "Tax Consultant"
        },
        date: "2024-01-15",
        time_slot: "11:00 AM",
        status: "cancelled",
        purpose: "Tax Consultation"
    },
    {
        id: "6",
        citizen: {
            id: "citizen-6",
            full_name: "Fadumo Ali",
            phone_number: "+252-65-2228910"
        },
        host: {
            id: "host-6",
            full_name: "Abdirahman Mohamed",
            position: "Marriage Registrar"
        },
        date: "2024-01-15",
        time_slot: "11:30 AM",
        status: "completed",
        purpose: "Marriage Certificate"
    },
    {
        id: "7",
        citizen: {
            id: "citizen-7",
            full_name: "Saada Ismail",
            phone_number: "+252-63-7771234"
        },
        host: {
            id: "host-7",
            full_name: "Dr. Mohamed Abdi",
            position: "Medical Director"
        },
        date: "2024-01-15",
        time_slot: "02:00 PM",
        status: "approved",
        purpose: "Medical Checkup"
    },
    {
        id: "8",
        citizen: {
            id: "citizen-8",
            full_name: "Yusuf Hassan",
            phone_number: "+252-90-6665432"
        },
        host: {
            id: "host-8",
            full_name: "Halima Omar",
            position: "Education Officer"
        },
        date: "2024-01-15",
        time_slot: "02:30 PM",
        status: "pending",
        purpose: "Scholarship Application"
    }
];

export function TodayAppointments() {
    const router = useRouter();

    const { data: appointments, isLoading, error } = useQuery({
        queryKey: ["today-appointments"],
        queryFn: async () => {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Return dummy data instead of API call
            return dummyAppointments;

            // For real API, you would use:
            // const res = await fetch("/api/v1/reception/appointments/today");
            // if (!res.ok) throw new Error("Failed to fetch appointments");
            // return res.json();
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const handleCheckIn = async (appointmentId: string) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log(`Checked in appointment: ${appointmentId}`);

        // For real implementation:
        // const res = await fetch(`/api/v1/reception/check-in`, {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({ appointment_id: appointmentId }),
        // });

        // if (res.ok) {
        //   router.refresh();
        // }
    };

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
                            <TableHead className="text-right">Actions</TableHead>
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

                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => router.push(`/reception/appointments/${appointment.id}`)}
                                            >
                                                View Details
                                            </DropdownMenuItem>

                                            {appointment.status === "approved" && (
                                                <DropdownMenuItem
                                                    onClick={() => handleCheckIn(appointment.id)}
                                                >
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    Check In
                                                </DropdownMenuItem>
                                            )}

                                            <DropdownMenuItem
                                                onClick={() => console.log(`Print slip for ${appointment.id}`)}
                                            >
                                                Print Slip
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
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

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {appointment.status === "approved" && (
                                        <DropdownMenuItem
                                            onClick={() => handleCheckIn(appointment.id)}
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Check In
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                    <DropdownMenuItem>Print Slip</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
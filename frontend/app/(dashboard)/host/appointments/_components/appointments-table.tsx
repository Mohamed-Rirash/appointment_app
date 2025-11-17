// components/appointments/appointments-table.tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    User,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    MoreHorizontal,
    Printer,
    Copy,
    MapPin,
    ChevronLeft,
    ChevronRight,
    Phone,
    Mail
} from "lucide-react";

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
    created_at: string;
    decision_reason?: string;
    office_id: string;
    host_first_name?: string;
    host_last_name?: string;
    host_email?: string;
    appointment_active?: boolean;
    canceled_at?: string | null;
    issued_by?: string;
}

interface AppointmentsTableProps {
    appointments: Appointment[];
    officeId: string;
    pagination: {
        total: number;
        limit: number;
        offset: number;
        currentPage: number;
    };
    endpointUsed: string;
    isLoading?: boolean;
    onPageChange?: (page: number) => void;
    currentPage?: number;
    totalPages?: number;
}

export function AppointmentsTable({
    appointments,
    officeId,
    pagination,
    endpointUsed,
    isLoading = false,
    onPageChange,
    currentPage = 1,
    totalPages = 1
}: AppointmentsTableProps) {
    const queryClient = useQueryClient();

    // Mutations for appointment actions
    const updateAppointmentStatus = useMutation({
        mutationFn: async ({ appointmentId, status, reason }: { appointmentId: string; status: string; reason?: string }) => {
            const response = await fetch(`/api/v1/appointments/${appointmentId}/decision`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ decision: status.toLowerCase(), reason }),
            });
            if (!response.ok) throw new Error("Failed to update appointment");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reception-appointments"] });
        },
    });

    const completeAppointment = useMutation({
        mutationFn: async (appointmentId: string) => {
            const response = await fetch(`/api/v1/appointments/${appointmentId}/complete`, {
                method: "POST",
            });
            if (!response.ok) throw new Error("Failed to complete appointment");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reception-appointments"] });
        },
    });

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" }> = {
            PENDING: { label: "Pending", variant: "secondary" },
            APPROVED: { label: "Approved", variant: "default" },
            COMPLETED: { label: "Completed", variant: "success" },
            CANCELLED: { label: "Cancelled", variant: "destructive" },
            NO_SHOW: { label: "No Show", variant: "destructive" },
            DENIED: { label: "Denied", variant: "destructive" },
            POSTPONED: { label: "Postponed", variant: "outline" },
        };
        const config = statusMap[status] || { label: status, variant: "default" };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const handleCheckIn = (appointmentId: string) => {
        // For demo purposes - implement your actual check-in logic
        console.log("Check-in:", appointmentId);
        // In a real implementation, you might:
        // 1. Update status to "COMPLETED"
        // 2. Record check-in time
        // 3. Notify the host
        completeAppointment.mutate(appointmentId);
    };

    const handlePrintSlip = (appointmentId: string) => {
        // Open print slip in new window
        window.open(`/api/v1/appointments/${appointmentId}/print-slip`, '_blank');
    };

    const handleCopyDetails = (appointment: Appointment) => {
        const details = `Appointment: ${appointment.citizen_firstname} ${appointment.citizen_lastname}
Email: ${appointment.citizen_email}
Phone: ${appointment.citizen_phone || "N/A"}
Purpose: ${appointment.purpose}
Date: ${format(new Date(appointment.appointment_date), "PPP")}
Time: ${appointment.time_slotted}
Status: ${appointment.status}
Host: ${appointment.host_first_name ? `${appointment.host_first_name} ${appointment.host_last_name}` : "Unassigned"}`;

        navigator.clipboard.writeText(details);
        // You might want to add a toast notification here
    };

    const handleViewDetails = (appointmentId: string) => {
        // Navigate to appointment details page
        window.open(`/appointments/${appointmentId}`, '_blank');
    };

    const formatTime = (timeString: string) => {
        // Convert "14:30:00" to "2:30 PM"
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    if (isLoading) {
        return <AppointmentsTableSkeleton />;
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span>Appointments</span>
                            <Badge variant="secondary" className="text-sm">
                                {appointments.length} of {pagination.total}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="capitalize">{endpointUsed.replace(/([A-Z])/g, ' $1').trim()} View</span>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-32">Actions</TableHead>
                                <TableHead>Citizen</TableHead>
                                <TableHead className="w-48">Date & Time</TableHead>
                                <TableHead>Purpose</TableHead>
                                <TableHead className="w-40">Host</TableHead>
                                <TableHead className="w-28">Status</TableHead>
                                <TableHead className="w-20 text-right">More</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {appointments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12">
                                        <div className="text-muted-foreground text-center">
                                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p className="text-lg font-medium">No appointments found</p>
                                            <p className="text-sm mt-1 max-w-md mx-auto">
                                                {endpointUsed === "search"
                                                    ? "No results match your search criteria. Try different keywords."
                                                    : "Try adjusting your filters or check back later for new appointments."
                                                }
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                appointments.map((appointment) => (
                                    <TableRow key={appointment.appointment_id} className="hover:bg-muted/50 group">
                                        {/* Actions */}
                                        <TableCell>
                                            <div className="flex flex-col gap-2">
                                                {(appointment.status === "PENDING" || appointment.status === "APPROVED") && (
                                                    <Button
                                                        size="sm"
                                                        className="gap-2 w-full"
                                                        onClick={() => handleCheckIn(appointment.appointment_id)}
                                                        disabled={completeAppointment.isLoading}
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                        Check In
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2 w-full"
                                                    onClick={() => handleViewDetails(appointment.appointment_id)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    Details
                                                </Button>
                                            </div>
                                        </TableCell>

                                        {/* Citizen Info */}
                                        <TableCell>
                                            <div className="flex items-start gap-3">
                                                <Avatar className="h-10 w-10 border">
                                                    <AvatarImage
                                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${appointment.citizen_email}`}
                                                        alt={`${appointment.citizen_firstname} ${appointment.citizen_lastname}`}
                                                    />
                                                    <AvatarFallback className="text-xs">
                                                        {appointment.citizen_firstname?.[0]}{appointment.citizen_lastname?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium truncate">
                                                        {appointment.citizen_firstname} {appointment.citizen_lastname}
                                                    </p>
                                                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                                                        <Mail className="h-3 w-3" />
                                                        <span className="truncate">{appointment.citizen_email}</span>
                                                    </div>
                                                    {appointment.citizen_phone && (
                                                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                                                            <Phone className="h-3 w-3" />
                                                            <span>{appointment.citizen_phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Date & Time */}
                                        <TableCell>
                                            <div className="space-y-1">
                                                <p className="font-medium text-sm">
                                                    {format(new Date(appointment.appointment_date), "MMM dd, yyyy")}
                                                </p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatTime(appointment.time_slotted)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Created: {format(new Date(appointment.created_at), "MMM dd")}
                                                </p>
                                            </div>
                                        </TableCell>

                                        {/* Purpose */}
                                        <TableCell>
                                            <div>
                                                <p className="text-sm line-clamp-2">{appointment.purpose}</p>
                                                {appointment.decision_reason && (
                                                    <p className="text-xs text-muted-foreground mt-1 italic">
                                                        Note: {appointment.decision_reason}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Host */}
                                        <TableCell>
                                            {appointment.host_first_name ? (
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {appointment.host_first_name} {appointment.host_last_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {appointment.host_email}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">Unassigned</span>
                                            )}
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell>
                                            {getStatusBadge(appointment.status)}
                                        </TableCell>

                                        {/* More Actions */}
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleViewDetails(appointment.appointment_id)}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handlePrintSlip(appointment.appointment_id)}>
                                                        <Printer className="h-4 w-4 mr-2" />
                                                        Print Slip
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleCopyDetails(appointment)}>
                                                        <Copy className="h-4 w-4 mr-2" />
                                                        Copy Details
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && onPageChange && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages} • {pagination.total.toLocaleString()} total appointments
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="gap-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="gap-2"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Skeleton component for loading state
function AppointmentsTableSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <Skeleton className="h-6 w-48" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
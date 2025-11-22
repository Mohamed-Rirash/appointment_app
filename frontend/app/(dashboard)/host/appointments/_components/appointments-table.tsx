"use client";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    User,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Phone,
    Mail,
    Ban,
    FileText,
    ChevronFirst,
    ChevronLast,
    MapPin,
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
    decision_reason: string | null;
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
    officeId?: string;
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
    pagination,
    endpointUsed,
    isLoading = false,
    onPageChange,
    currentPage = 1,
    totalPages = 1,
}: AppointmentsTableProps) {


    const getStatusConfig = (status: string) => {
        const statusMap: Record<string, {
            label: string;
            variant: "default" | "secondary" | "destructive" | "outline" | "success";
            icon: React.ComponentType<{ className?: string }>;
            bgColor: string;
            textColor: string;
            borderColor: string;
        }> = {
            PENDING: {
                label: "Pending",
                variant: "secondary",
                icon: Clock,
                bgColor: "bg-amber-50",
                textColor: "text-amber-700",
                borderColor: "border-amber-200"
            },
            APPROVED: {
                label: "Approved",
                variant: "default",
                icon: CheckCircle2,
                bgColor: "bg-blue-50",
                textColor: "text-blue-700",
                borderColor: "border-blue-200"
            },
            COMPLETED: {
                label: "Completed",
                variant: "success",
                icon: CheckCircle2,
                bgColor: "bg-green-50",
                textColor: "text-green-700",
                borderColor: "border-green-200"
            },
            CANCELLED: {
                label: "Cancelled",
                variant: "destructive",
                icon: XCircle,
                bgColor: "bg-red-50",
                textColor: "text-red-700",
                borderColor: "border-red-200"
            },
            NO_SHOW: {
                label: "No Show",
                variant: "destructive",
                icon: Ban,
                bgColor: "bg-red-50",
                textColor: "text-red-700",
                borderColor: "border-red-200"
            },
            DENIED: {
                label: "Denied",
                variant: "destructive",
                icon: XCircle,
                bgColor: "bg-red-50",
                textColor: "text-red-700",
                borderColor: "border-red-200"
            },
            POSTPONED: {
                label: "Postponed",
                variant: "outline",
                icon: Calendar,
                bgColor: "bg-gray-50",
                textColor: "text-gray-700",
                borderColor: "border-gray-200"
            },
        };

        return statusMap[status] || {
            label: status,
            variant: "default",
            icon: Clock,
            bgColor: "bg-gray-50",
            textColor: "text-gray-700",
            borderColor: "border-gray-200"
        };
    };

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return format(new Date(dateString), "MMM dd");
    };

    if (isLoading) {
        return <AppointmentsTableSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Enhanced Header Card */}
            {/* <Card className="border-0 bg-linear-to-br from-white to-brand-primary/50 shadow-gren">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-linear-to-br from-brand/60 to-brand rounded-2xl shadow-lg">
                                <Calendar className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold text-gray-900">
                                    Appointments Schedule
                                </CardTitle>
                                <div className="flex items-center gap-4 mt-2">
                                    <p className="text-lg text-gray-600 font-medium">
                                        {pagination.total.toLocaleString()} total appointments
                                    </p>
                                    <Badge variant="outline" className="bg-white text-gray-600 border-gray-200 font-medium">
                                        <MapPin className="h-3.5 w-3.5 mr-1.5" />
                                        {endpointUsed.replace(/([A-Z])/g, " $1").trim()} View
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card> */}

            {/* Enhanced Table Card */}
            <Card className="border-0 bg-white shadow-gren overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-linear-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="py-4 font-semibold text-gray-700">Citizen</TableHead>
                                    <TableHead className="py-4 font-semibold text-gray-700 w-48">Date & Time</TableHead>
                                    <TableHead className="py-4 font-semibold text-gray-700">Purpose</TableHead>
                                    <TableHead className="py-4 font-semibold text-gray-700 w-40">Host</TableHead>
                                    <TableHead className="py-4 font-semibold text-gray-700 w-28">Status</TableHead>

                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {appointments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-4 bg-gray-100 rounded-2xl">
                                                    <Calendar className="h-12 w-12 text-gray-400" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-xl font-semibold text-gray-500">
                                                        No appointments found
                                                    </p>
                                                    <p className="text-gray-400 max-w-md mx-auto">
                                                        {endpointUsed === "search"
                                                            ? "No results match your search criteria. Try adjusting your filters."
                                                            : "No appointments scheduled for this period."}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    appointments.map((appointment) => {
                                        const statusConfig = getStatusConfig(appointment.status);
                                        const StatusIcon = statusConfig.icon;

                                        return (
                                            <TableRow
                                                key={appointment.appointment_id}
                                                className="group hover:bg-blue-50/30 transition-all duration-200 border-b border-gray-100 last:border-b-0"
                                            >
                                                {/* Citizen */}
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                                                            <AvatarImage
                                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${appointment.citizen_email}`}
                                                                alt={`${appointment.citizen_firstname} ${appointment.citizen_lastname}`}
                                                            />
                                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                                                                {appointment.citizen_firstname?.[0]}{appointment.citizen_lastname?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0 flex-1 space-y-2">
                                                            <p className="font-semibold text-gray-900 text-base">
                                                                {appointment.citizen_firstname} {appointment.citizen_lastname}
                                                            </p>
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                                                    <span className="truncate">{appointment.citizen_email}</span>
                                                                </div>
                                                                {appointment.citizen_phone && (
                                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                                                        <span>{appointment.citizen_phone}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Date & Time */}
                                                <TableCell className="py-4">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-blue-600" />
                                                            <span className="font-semibold text-gray-900 text-sm">
                                                                {format(new Date(appointment.appointment_date), "MMM dd, yyyy")}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Clock className="h-4 w-4" />
                                                            {formatTime(appointment.time_slotted)}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <FileText className="h-3.5 w-3.5" />
                                                            <span>Booked {getTimeAgo(appointment.created_at)}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Purpose */}
                                                <TableCell className="py-4">
                                                    <div className="max-w-xs">
                                                        <p className="text-sm text-gray-900 line-clamp-2 leading-relaxed" title={appointment.purpose}>
                                                            {appointment.purpose}
                                                        </p>
                                                        {appointment.decision_reason && (
                                                            <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                                                                <p className="text-xs text-amber-700 line-clamp-2" title={appointment.decision_reason}>
                                                                    <span className="font-medium">Note:</span> {appointment.decision_reason}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Host */}
                                                <TableCell className="py-4">
                                                    <div className="max-w-36">
                                                        {appointment.host_first_name ? (
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1.5 bg-green-50 rounded-lg">
                                                                        <User className="h-3.5 w-3.5 text-green-600" />
                                                                    </div>
                                                                    <p className="font-semibold text-gray-900 text-sm truncate">
                                                                        {appointment.host_first_name} {appointment.host_last_name}
                                                                    </p>
                                                                </div>
                                                                {appointment.host_email && (
                                                                    <p className="text-xs text-gray-600 truncate" title={appointment.host_email}>
                                                                        {appointment.host_email}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs">
                                                                <User className="h-3 w-3 mr-1" />
                                                                Unassigned
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Status */}
                                                <TableCell className="py-4">
                                                    <Badge
                                                        variant={statusConfig.variant}
                                                        className={`${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} gap-1.5 px-3 py-1.5 font-medium`}
                                                    >
                                                        <StatusIcon className="h-3.5 w-3.5" />
                                                        {statusConfig.label}
                                                    </Badge>
                                                </TableCell>


                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Enhanced Pagination */}
            {totalPages > 1 && onPageChange && (
                <Card className="border-0 bg-white shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-sm text-gray-600">
                                Showing{" "}
                                <span className="font-semibold text-gray-900">
                                    {((currentPage - 1) * pagination.limit) + 1}
                                </span>
                                {" "} to {" "}
                                <span className="font-semibold text-gray-900">
                                    {Math.min(currentPage * pagination.limit, pagination.total)}
                                </span>
                                {" "} of {" "}
                                <span className="font-semibold text-gray-900">
                                    {pagination.total.toLocaleString()}
                                </span>
                                {" "} appointments
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPageChange(1)}
                                    disabled={currentPage === 1}
                                    className="gap-2 hidden sm:flex h-9 px-3 border-gray-300 hover:bg-gray-50"
                                >
                                    <ChevronFirst className="h-4 w-4" />
                                    First
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="gap-2 h-9 px-3 border-gray-300 hover:bg-gray-50"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline">Previous</span>
                                </Button>

                                <div className="flex items-center gap-2 px-4">
                                    <span className="text-sm font-semibold text-gray-900">{currentPage}</span>
                                    <span className="text-sm text-gray-500">of</span>
                                    <span className="text-sm font-semibold text-gray-900">{totalPages}</span>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="gap-2 h-9 px-3 border-gray-300 hover:bg-gray-50"
                                >
                                    <span className="hidden sm:inline">Next</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="gap-2 hidden sm:flex h-9 px-3 border-gray-300 hover:bg-gray-50"
                                >
                                    Last
                                    <ChevronLast className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function AppointmentsTableSkeleton() {
    return (
        <div className="space-y-6">
            {/* Skeleton Header */}
            <Card className="border-0 bg-gradient-to-br from-white to-blue-50/30 shadow-lg">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-2xl" />
                        <div className="space-y-3">
                            <Skeleton className="h-7 w-64" />
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-6 w-24 rounded-full" />
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Skeleton Table */}
            <Card className="border-0 bg-white shadow-lg">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                {[...Array(6)].map((_, i) => (
                                    <TableHead key={i} className="py-4">
                                        <Skeleton className="h-4 w-24 mx-auto" />
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(5)].map((_, i) => (
                                <TableRow key={i} className="border-b border-gray-100">
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="h-12 w-12 rounded-full" />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-48" />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <Skeleton className="h-4 w-full max-w-xs" />
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <Skeleton className="h-6 w-28 rounded-full" />
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <Skeleton className="h-6 w-16 rounded-full" />
                                    </TableCell>
                                    <TableCell className="py-4 text-right">
                                        <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
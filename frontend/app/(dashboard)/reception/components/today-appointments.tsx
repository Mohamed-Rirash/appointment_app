"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Calendar,
    Clock,
    Search,
    User,
    X,
    ChevronRight,
    CalendarDays,
    AlertCircle,
    RefreshCw,
    Users,
    Filter,
    MoreVertical,
    Sparkles,
    Printer,
    CheckCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

// API Response Interface
interface APIAppointment {
    appointment_id: string;
    host_id: string;
    host_first_name: string;
    host_last_name: string;
    host_email?: string;
    citizen_id: string;
    citizen_firstname: string;
    citizen_lastname: string;
    citizen_email?: string;
    citizen_phone?: string;
    purpose?: string;
    appointment_date: string;
    time_slotted: string;
    status: "PENDING" | "APPROVED" | "DENIED" | "CANCELLED" | "COMPLETED";
    decision_reason?: string;
    canceled_at?: string | null;
    new_appointment_date?: string | null;
    decided_at?: string;
}

// UI Interface
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
    };
    time_slot: string;
    status: string;
    purpose?: string;
    decisionReason?: string;
    canceledAt?: string | null;
    newAppointmentDate?: string | null;
    decidedAt?: string;
}

interface TodayAppointmentsProps {
    token?: string;
}

export function TodayAppointments({ token: propToken }: TodayAppointmentsProps) {
    const [inputValue, setInputValue] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [printedAppointments, setPrintedAppointments] = useState<Set<string>>(new Set());

    const getTodayDateString = () => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    };

    const getAuthToken = () => {
        return propToken || localStorage.getItem("authToken") || "";
    };

    const mapAPIStatusToUIStatus = (apiStatus: string): string => {
        const statusMap: Record<string, string> = {
            APPROVED: "approved",
            PENDING: "pending",
            DENIED: "cancelled",
            CANCELLED: "cancelled",
            COMPLETED: "completed",
        };
        return statusMap[apiStatus] || "pending";
    };

    const transformAppointment = (apiAppt: APIAppointment): Appointment => ({
        id: apiAppt.appointment_id,
        citizen: {
            id: apiAppt.citizen_id,
            full_name: `${apiAppt.citizen_firstname} ${apiAppt.citizen_lastname}`.trim(),
            phone_number: apiAppt.citizen_phone,
        },
        host: {
            id: apiAppt.host_id,
            full_name: `${apiAppt.host_first_name} ${apiAppt.host_last_name}`.trim(),
        },
        time_slot: apiAppt.time_slotted,
        status: mapAPIStatusToUIStatus(apiAppt.status),
        purpose: apiAppt.purpose,
        decisionReason: apiAppt.decision_reason,
        canceledAt: apiAppt.canceled_at,
        newAppointmentDate: apiAppt.new_appointment_date,
        decidedAt: apiAppt.decided_at,
    });

    const handleSearch = () => {
        setSearchTerm(inputValue.trim());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const clearSearch = () => {
        setInputValue("");
        setSearchTerm("");
        setActiveFilter("all");
    };

    const handlePrint = (appointment: Appointment) => {
        // Add to printed set
        setPrintedAppointments(prev => new Set(prev).add(appointment.id));

        // Create print content
        const printContent = `
            <html>
                <head>
                    <title>Appointment - ${appointment.citizen.full_name}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
                        .info-row { margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 8px; }
                        .label { font-weight: bold; color: #667eea; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Appointment Details</h1>
                        <p>${format(new Date(), 'PPP')}</p>
                    </div>
                    <div class="info-row">
                        <div class="label">Citizen:</div>
                        <div>${appointment.citizen.full_name}</div>
                        ${appointment.citizen.phone_number ? `<div>Phone: ${appointment.citizen.phone_number}</div>` : ''}
                    </div>
                    <div class="info-row">
                        <div class="label">Host:</div>
                        <div>${appointment.host.full_name}</div>
                    </div>
                    <div class="info-row">
                        <div class="label">Time:</div>
                        <div>${formatTime(appointment.time_slot)}</div>
                    </div>
                    <div class="info-row">
                        <div class="label">Purpose:</div>
                        <div>${appointment.purpose || 'General appointment'}</div>
                    </div>
                    <div class="info-row">
                        <div class="label">Status:</div>
                        <div>${appointment.status}</div>
                    </div>
                </body>
            </html>
        `;

        // Open print window
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }

        toast.success("Print dialog opened successfully");
    };

    const togglePrinted = (appointmentId: string) => {
        setPrintedAppointments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(appointmentId)) {
                newSet.delete(appointmentId);
            } else {
                newSet.add(appointmentId);
            }
            return newSet;
        });
    };

    const { data: appointments, isLoading, error } = useQuery<Appointment[]>({
        queryKey: ["today-appointments", searchTerm],
        queryFn: async () => {
            const today = getTodayDateString();
            const token = getAuthToken();

            if (!token) {
                throw new Error("Authentication token is missing. Please log in.");
            }

            const headers: HeadersInit = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            };

            if (!searchTerm) {
                const response = await fetch(
                    `/api/v1/views/reception/appointments?on_date=${today}&status=APPROVED&limit=100`,
                    { headers }
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch appointments: ${response.status}`);
                }

                const data = await response.json();
                return data.appointments.map((appt: APIAppointment) => transformAppointment(appt));
            } else {
                const response = await fetch(
                    `/api/v1/appointments/gates/search?search=${encodeURIComponent(searchTerm)}`,
                    { headers }
                );

                if (!response.ok) {
                    throw new Error(`Search failed: ${response.status}`);
                }

                const data: APIAppointment[] = await response.json();
                const todayAppointments = data.filter((appt) => appt.appointment_date.startsWith(today));
                return todayAppointments.map((appt: APIAppointment) => transformAppointment(appt));
            }
        },
        staleTime: 1000 * 60 * 5,
    });

    const getStatusBadge = (status: string) => {
        const variants: Record<string, {
            variant: any;
            icon: React.ReactNode;
            label: string;
            gradient: string;
        }> = {
            approved: {
                variant: "default",
                icon: <CalendarDays className="w-3 h-3" />,
                label: "Approved",
                gradient: "from-green-500 to-emerald-600"
            },
            pending: {
                variant: "secondary",
                icon: <Clock className="w-3 h-3" />,
                label: "Pending",
                gradient: "from-amber-500 to-orange-500"
            },
            checked_in: {
                variant: "success",
                icon: <User className="w-3 h-3" />,
                label: "Checked In",
                gradient: "from-blue-500 to-cyan-600"
            },
            cancelled: {
                variant: "destructive",
                icon: <X className="w-3 h-3" />,
                label: "Cancelled",
                gradient: "from-red-500 to-rose-600"
            },
            completed: {
                variant: "outline",
                icon: <ChevronRight className="w-3 h-3" />,
                label: "Completed",
                gradient: "from-purple-500 to-indigo-600"
            },
        };

        const config = variants[status] || {
            variant: "default",
            icon: null,
            label: status,
            gradient: "from-gray-500 to-gray-600"
        };

        return (
            <Badge
                variant={config.variant}
                className={`flex items-center gap-1 bg-gradient-to-r ${config.gradient} text-white border-0 shadow-sm`}
            >
                {config.icon}
                {config.label}
            </Badge>
        );
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "MMM dd, yyyy");
        } catch {
            return dateString;
        }
    };

    const formatTime = (timeString: string) => {
        try {
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        } catch {
            return timeString;
        }
    };

    const filteredAppointments = appointments?.filter(appt => {
        if (activeFilter === "all") return true;
        return appt.status === activeFilter;
    });

    const statusCounts = appointments?.reduce((acc, appt) => {
        acc[appt.status] = (acc[appt.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>) || {};

    if (isLoading) {
        return (
            <div className="space-y-6">
                {/* Modern Header Skeleton */}
                <Card className="border-none! bg-linear-to-br from-brand-primary/10  to-brand-primary/30  shadow-grn  shadow-2xl">
                    <CardContent className="p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full bg-white/20" />
                                    <Skeleton className="h-8 w-48 bg-white/20" />
                                </div>
                                <Skeleton className="h-4 w-64 bg-white/20" />
                            </div>
                            <Skeleton className="h-12 w-32 bg-white/20 rounded-xl" />
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200" />
                    ))}
                </div>

                {/* Search Skeleton */}
                <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Skeleton className="h-14 flex-1 rounded-xl" />
                        <Skeleton className="h-14 w-32 rounded-xl" />
                    </div>
                </Card>

                {/* Table Skeleton */}
                <Card className="border-0 shadow-xl overflow-hidden">
                    <SkeletonLoader rows={5} />
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="p-8 border-0 bg-gradient-to-br from-red-50 to-rose-100/50 shadow-xl">
                <CardContent className="text-center">
                    <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-rose-200 flex items-center justify-center mb-6 shadow-lg">
                        <AlertCircle className="h-10 w-10 text-red-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Failed to Load Appointments</h3>
                    <p className="text-base text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                        {error instanceof Error ? error.message : "We couldn't retrieve the appointment data. Please try again."}
                    </p>
                    <Button
                        onClick={() => window.location.reload()}
                        className="bg-linear-to-r from-red-500 to-rose-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 rounded-xl"
                    >
                        <RefreshCw className="h-5 w-5 mr-3" />
                        Retry Loading
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8">
            {/* Modern Header Section */}
            <Card className="border-none! text-brand-black bg-linear-to-br from-brand-primary/10  to-brand-primary/30  shadow-grn relative overflow-hidden">

                <CardContent className="p-8 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-brand-primary rounded-2xl backdrop-blur-sm">
                                    <Sparkles className="h-8 w-8 text-brand" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight">
                                        Today's Appointments
                                    </h1>
                                    <p className="text-brand text-lg mt-2 font-light">
                                        {searchTerm
                                            ? `Search results for "${searchTerm}"`
                                            : "Manage and track today's scheduled appointments"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-6 py-4   rounded-2xl border border-brand-secondary">
                                <div className="flex items-center gap-3">
                                    <Users className="h-6 w-6 text-brand" />
                                    <span className="text-xl font-semibold">{appointments?.length || 0}</span>
                                    <span className="text-brand/80 text-sm">Total</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>



            {/* Search and Filter Section */}
            <Card className="p-6 border-none! shadow-gren bg-white/80 backdrop-blur-sm">
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                placeholder="Search by citizen name, email, or phone..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="pl-12 pr-12 py-6 text-base rounded-2xl border-2 border-gray-200/60 focus:border-blue-500/50 transition-all duration-300 bg-white/90 shadow-sm"
                            />
                            {inputValue && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-full hover:bg-gray-100/80"
                                    onClick={() => setInputValue("")}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={handleSearch}
                            size="lg"
                            className="px-8 py-6 rounded-2xl bg-linear-to-r from-brand/90 to-brand hover:from-brand hover:to-brand/90 text-white shadow-gren hover:shadow-xl transition-all duration-300"
                            disabled={isLoading}
                        >
                            <Search className="h-5 w-5 mr-3" />
                            Search
                        </Button>
                    </div>
                </div>

                {(searchTerm || activeFilter !== "all") && (
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                            {searchTerm && (
                                <Badge variant="secondary" className="rounded-xl px-4 py-2 bg-blue-100 text-blue-700 border-0">
                                    Search: "{searchTerm}"
                                </Badge>
                            )}
                            {activeFilter !== "all" && (
                                <Badge variant="secondary" className="rounded-xl px-4 py-2 bg-purple-100 text-purple-700 border-0">
                                    Filter: {activeFilter}
                                </Badge>
                            )}
                        </div>
                        <Button
                            variant="link"
                            size="sm"
                            onClick={clearSearch}
                            className="text-gray-500 hover:text-gray-700 font-medium"
                        >
                            Clear all
                        </Button>
                    </div>
                )}
            </Card>

            {!filteredAppointments?.length ? (
                <Card className="p-16 border-0 shadow-xl bg-gradient-to-br from-gray-50 to-blue-50/30 text-center">
                    <CardContent className="text-center">
                        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-200 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                            <Calendar className="h-12 w-12 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            {searchTerm || activeFilter !== "all" ? "No results found" : "No appointments today"}
                        </h3>
                        <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
                            {searchTerm
                                ? `No appointments match your search for "${searchTerm}"`
                                : activeFilter !== "all"
                                    ? `No ${activeFilter} appointments for today`
                                    : "There are no appointments scheduled for today. Enjoy your day!"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Desktop/Tablet Table View */}
                    <div className="hidden lg:block">
                        <Card className="shadow-gren border-0 overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 px-6 py-4 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Appointments ({filteredAppointments.length})
                                    </h3>
                                    <div className="text-sm text-gray-500">
                                        {format(new Date(), "EEEE, MMMM do, yyyy")}
                                    </div>
                                </div>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-white hover:bg-white border-b border-gray-100">
                                        <TableHead className="w-10 font-semibold text-gray-600 py-5 text-sm uppercase tracking-wide">
                                            <Printer className="w-4 h-4" />
                                        </TableHead>
                                        <TableHead className="w-28 font-semibold text-gray-600 py-5 text-sm uppercase tracking-wide">Time</TableHead>
                                        <TableHead className="font-semibold text-gray-600 py-5 text-sm uppercase tracking-wide">Citizen</TableHead>
                                        <TableHead className="font-semibold text-gray-600 py-5 text-sm uppercase tracking-wide">Host</TableHead>
                                        <TableHead className="font-semibold text-gray-600 py-5 text-sm uppercase tracking-wide">Purpose</TableHead>
                                        <TableHead className="w-36 font-semibold text-gray-600 py-5 text-sm uppercase tracking-wide">Status</TableHead>
                                        <TableHead className="w-20 font-semibold text-gray-600 py-5 text-sm uppercase tracking-wide">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAppointments.map((appointment: Appointment) => (
                                        <TableRow
                                            key={appointment.id}
                                            className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/20 transition-all duration-300 cursor-pointer group border-b border-gray-50 last:border-b-0"
                                            onClick={() => console.log("View appointment:", appointment.id)}
                                        >
                                            {/* Printed Checkbox */}
                                            <TableCell className="py-5">
                                                <Checkbox
                                                    checked={printedAppointments.has(appointment.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onCheckedChange={() => togglePrinted(appointment.id)}
                                                    className="rounded-lg"
                                                />
                                            </TableCell>

                                            <TableCell className="py-5">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-gray-400" />
                                                    <span className="font-semibold text-gray-900 font-mono text-sm bg-gray-50 px-3 py-1.5 rounded-xl">
                                                        {formatTime(appointment.time_slot)}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-5">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-11 w-11 ring-2 ring-white shadow-md">
                                                        <AvatarImage
                                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed= ${appointment.citizen.id}`}
                                                        />
                                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                                            {appointment.citizen.full_name
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-base font-semibold text-gray-900">
                                                            {appointment.citizen.full_name}
                                                        </p>
                                                        {appointment.citizen.phone_number && (
                                                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                                📞 {appointment.citizen.phone_number}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <User className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {appointment.host.full_name}
                                                    </p>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-5">
                                                <div className="space-y-2">
                                                    <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                                                        {appointment.purpose || "General appointment"}
                                                    </p>
                                                    {appointment.status === "cancelled" && appointment.decisionReason && (
                                                        <p className="text-xs text-red-600 font-medium flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg">
                                                            <AlertCircle className="h-3 w-3" />
                                                            {appointment.decisionReason}
                                                        </p>
                                                    )}
                                                    {appointment.newAppointmentDate && (
                                                        <p className="text-xs text-blue-600 font-medium flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
                                                            <History className="h-3 w-3" />
                                                            Rescheduled: {formatDate(appointment.newAppointmentDate)}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-5">
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(appointment.status)}
                                                    {printedAppointments.has(appointment.id) && (
                                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-0">
                                                            <CheckCheck className="w-3 h-3 mr-1" />
                                                            Printed
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-5">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-2xl shadow-xl border-0 p-2 w-48">
                                                        <DropdownMenuItem
                                                            className="rounded-xl p-3 flex items-center gap-3"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handlePrint(appointment);
                                                            }}
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                            Print
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-4">
                        {filteredAppointments.map((appointment: Appointment) => (
                            <Card
                                key={appointment.id}
                                className={cn(
                                    "p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-3xl",
                                    printedAppointments.has(appointment.id) && "ring-2 ring-emerald-200"
                                )}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl">
                                            <Clock className="h-4 w-4 text-gray-500" />
                                            <p className="font-bold text-gray-900 font-mono">
                                                {formatTime(appointment.time_slot)}
                                            </p>
                                        </div>
                                        {printedAppointments.has(appointment.id) && (
                                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-0">
                                                <CheckCheck className="w-3 h-3 mr-1" />
                                                Printed
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mb-4">
                                    <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                                        <AvatarImage
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed= ${appointment.citizen.id}`}
                                        />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                            {appointment.citizen.full_name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-gray-900">
                                            {appointment.citizen.full_name}
                                        </h3>
                                        {appointment.citizen.phone_number && (
                                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                📞 {appointment.citizen.phone_number}
                                            </p>
                                        )}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-xl">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl shadow-xl border-0 p-2 w-48">
                                            <DropdownMenuItem
                                                className="rounded-xl p-3 flex items-center gap-3"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePrint(appointment);
                                                }}
                                            >
                                                <Printer className="h-4 w-4" />
                                                Print
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-3 text-sm border-t border-gray-100 pt-4">
                                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-2xl">
                                        <User className="h-4 w-4 text-blue-600" />
                                        <div>
                                            <p className="text-xs text-gray-500">Host</p>
                                            <p className="font-semibold text-gray-900">{appointment.host.full_name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-2xl">
                                        <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500">Purpose</p>
                                            <p className="font-medium text-gray-900 leading-relaxed">
                                                {appointment.purpose || "General appointment"}
                                            </p>
                                        </div>
                                    </div>

                                    {appointment.status === "cancelled" && appointment.decisionReason && (
                                        <div className="flex items-start gap-3 p-3 bg-red-50/50 rounded-2xl">
                                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500">Cancellation Reason</p>
                                                <p className="font-medium text-red-600">{appointment.decisionReason}</p>
                                            </div>
                                        </div>
                                    )}

                                    {appointment.newAppointmentDate && (
                                        <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-2xl">
                                            <History className="h-4 w-4 text-blue-600 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500">Rescheduled Date</p>
                                                <p className="font-medium text-blue-600">
                                                    {formatDate(appointment.newAppointmentDate)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Printed Checkbox for Mobile */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <Checkbox
                                            checked={printedAppointments.has(appointment.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            onCheckedChange={() => togglePrinted(appointment.id)}
                                            className="rounded-lg"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Marked as Printed</span>
                                    </label>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// Enhanced Skeleton Loader Component
function SkeletonLoader({ rows = 5 }: { rows?: number }) {
    return (
        <CardContent className="p-6">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex items-center gap-6 p-6 border-b border-gray-100 last:border-b-0">
                    <Skeleton className="h-14 w-14 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300" />
                    <div className="flex-1 space-y-3">
                        <Skeleton className="h-5 w-1/4 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300" />
                        <Skeleton className="h-4 w-1/3 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-full bg-gradient-to-br from-gray-200 to-gray-300" />
                </div>
            ))}
        </CardContent>
    );
}
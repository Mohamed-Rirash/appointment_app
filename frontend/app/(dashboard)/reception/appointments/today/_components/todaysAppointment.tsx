"use client"
import { useQuery } from "@tanstack/react-query"
import { client, type Appointment } from "@/helpers/api/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { format, parseISO } from "date-fns"
import {
    Search,
    Calendar,
    Clock,
    User,
    Phone,
    FileText,
    RefreshCw,
    CheckCircle,
    Hourglass,
    XCircle,
    CalendarClock,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    PlusCircle,
} from "lucide-react"
import { useState, useMemo } from "react"
import { cn } from "@/libs/utils"
import Link from "next/link"
type StatusConfig = {
    color: string
    bg: string
    border: string
    dot: string
    icon: React.ComponentType<any>
    label: string
    description: string
}
export default function TodayAppointments({ token }: { token?: string }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(20)

    // Fetch today's appointments - only APPROVED status
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["today-appointments", currentPage],
        queryFn: () =>
            client.getReceptionAppointments(
                token!,
                format(new Date(), "yyyy-MM-dd"),
                pageSize,
                (currentPage - 1) * pageSize,
                "APPROVED"
            ),
        enabled: !!token,
    })

    // Filter appointments based on search
    const filteredAppointments = useMemo(() => {
        if (!data?.appointments) return []

        return data.appointments.filter((appt: Appointment) => {
            // Search filter
            const searchLower = searchTerm.toLowerCase()
            const matchesSearch =
                !searchTerm ||
                appt.citizen_firstname.toLowerCase().includes(searchLower) ||
                appt.citizen_lastname.toLowerCase().includes(searchLower) ||
                appt.citizen_phone.includes(searchTerm) ||
                (appt.citizen_email && appt.citizen_email.toLowerCase().includes(searchLower)) ||
                (appt.purpose && appt.purpose.toLowerCase().includes(searchLower))

            return matchesSearch
        })
    }, [data?.appointments, searchTerm])

    const getStatusConfig = (status: string): StatusConfig => {
        const configs: Record<string, StatusConfig> = {
            PENDING: {
                color: "text-amber-600",
                bg: "bg-amber-500/10",
                border: "border-amber-200",
                dot: "bg-amber-500",
                icon: Hourglass,
                label: "Pending",
                description: "Awaiting host review",
            },
            APPROVED: {
                color: "text-emerald-600",
                bg: "bg-emerald-500/10",
                border: "border-emerald-200",
                dot: "bg-emerald-500",
                icon: CheckCircle,
                label: "Confirmed",
                description: "Ready for the meeting",
            },
            DENIED: {
                color: "text-rose-600",
                bg: "bg-rose-500/10",
                border: "border-rose-200",
                dot: "bg-rose-500",
                icon: XCircle,
                label: "Denied",
                description: "Host declined this request",
            },
            CANCELLED: {
                color: "text-gray-600",
                bg: "bg-gray-500/10",
                border: "border-gray-200",
                dot: "bg-gray-500",
                icon: XCircle,
                label: "Cancelled",
                description: "Appointment was cancelled",
            },
            COMPLETED: {
                color: "text-blue-600",
                bg: "bg-blue-500/10",
                border: "border-blue-200",
                dot: "bg-blue-500",
                icon: CheckCircle,
                label: "Completed",
                description: "Meeting finished successfully",
            },
            POSTPONED: {
                color: "text-purple-600",
                bg: "bg-purple-500/10",
                border: "border-purple-200",
                dot: "bg-purple-500",
                icon: CalendarClock,
                label: "Postponed",
                description: "Appointment was rescheduled",
            },
            NO_SHOW: {
                color: "text-red-600",
                bg: "bg-red-500/10",
                border: "border-red-200",
                dot: "bg-red-500",
                icon: XCircle,
                label: "No Show",
                description: "Citizen did not attend",
            },
        }

        return configs[status] || {
            color: "text-gray-600",
            bg: "bg-gray-500/10",
            border: "border-gray-200",
            dot: "bg-gray-500",
            icon: AlertCircle,
            label: status,
            description: "Unknown status",
        }
        // return configs[status as keyof typeof configs] || {
        //     color: "text-gray-600",
        //     bg: "bg-gray-500/10",
        //     border: "border-gray-200",
        //     dot: "bg-gray-500",
        //     icon: AlertCircle,
        //     label: status,
        //     description: "",
        // }
    }

    const totalAppointments = data?.total || 0
    const totalPages = Math.ceil(totalAppointments / pageSize)
    const startItem = (currentPage - 1) * pageSize + 1
    const endItem = Math.min(currentPage * pageSize, totalAppointments)

    const goToPage = (page: number) => setCurrentPage(page)
    const goToFirstPage = () => goToPage(1)
    const goToLastPage = () => goToPage(totalPages)
    const goToPreviousPage = () => goToPage(Math.max(1, currentPage - 1))
    const goToNextPage = () => goToPage(Math.min(totalPages, currentPage + 1))

    const handleClearSearch = () => {
        setSearchTerm("")
        setCurrentPage(1)
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-10 w-36" />
                </div>

                {/* Search Skeleton */}
                <Skeleton className="h-12 rounded-lg" />

                {/* Appointments Skeleton */}
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-xl border bg-card">
                            <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                            <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Unable to Load Appointments</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                    We couldn't fetch today's appointments. Please check your connection and try again.
                </p>
                <Button onClick={() => refetch()} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </Button>
            </div>
        )
    }

    const appointments = data?.appointments || []
    const hasSearch = searchTerm.length > 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Today's Appointments</h1>
                    <p className="text-brand-gray text-sm mt-1">
                        View and search today's confirmed appointments
                    </p>
                </div>
                <Button asChild className="py-5 bg-brand hover:bg-brand/90">
                    <Link href="/reception/appointments/add">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        New Appointment
                    </Link>
                </Button>
            </div>

            {/* Search */}
            <Card className="border-none!  bg-linear-to-br from-brand-/20 to-brand-primary shadow-gren">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by citizen name, phone, email, or purpose..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-6 bg-white"
                                />
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleClearSearch}
                                disabled={!hasSearch}
                                className="py-6 bg-white"
                            >
                                Clear Search
                            </Button>
                        </div>

                        {/* Active Search Badge */}
                        {hasSearch && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Active search:</span>
                                <Badge variant="secondary" className="gap-1">
                                    Search: "{searchTerm}"
                                </Badge>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                    Showing {filteredAppointments.length} of {totalAppointments} appointments
                </span>
                <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Updated {format(new Date(), "h:mm a")}
                </span>
            </div>

            {/* Appointments List */}
            {filteredAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 border-2 border-dashed rounded-xl bg-muted/30">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Calendar className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No appointments found</h3>
                    <p className="text-muted-foreground text-sm text-center max-w-sm mb-4">
                        {hasSearch
                            ? "No appointments match your search. Try adjusting your search term."
                            : "No confirmed appointments scheduled for today."
                        }
                    </p>
                    {hasSearch && (
                        <Button variant="outline" onClick={handleClearSearch}>
                            Clear Search
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Appointments */}
                    <div className="space-y-3">
                        {filteredAppointments.map((appt: Appointment) => {
                            const time = appt.time_slotted.substring(0, 5)
                            const fullName = `${appt.citizen_firstname} ${appt.citizen_lastname}`
                            const statusConfig = getStatusConfig(appt.status)
                            const StatusIcon = statusConfig.icon

                            return (
                                <Card key={appt.appointment_id} className="group transition-all duration-200 hover:shadow-md">
                                    <CardContent className="p-4">
                                        <div className="flex gap-4">
                                            {/* Time block */}
                                            <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-primary/5 text-primary flex flex-col items-center justify-center text-center">
                                                <Clock className="w-4 h-4 mb-0.5" />
                                                <span className="text-sm font-semibold">{time}</span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                                                    <div>
                                                        <h3 className="font-semibold text-foreground truncate">{fullName}</h3>
                                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <User className="w-3.5 h-3.5" />
                                                            Host: {appt.host_first_name} {appt.host_last_name}
                                                        </p>
                                                    </div>

                                                    {/* Status badge */}
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "flex-shrink-0 font-medium",
                                                            statusConfig.bg,
                                                            statusConfig.border,

                                                        )}
                                                    >
                                                        <StatusIcon className="w-3 h-3 mr-1" />
                                                        {statusConfig.label}
                                                    </Badge>
                                                </div>

                                                {/* Details grid */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                                    {appt.purpose && (
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <FileText className="w-4 h-4 flex-shrink-0" />
                                                            <span className="truncate">{appt.purpose}</span>
                                                        </div>
                                                    )}
                                                    {appt.citizen_phone && (
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Phone className="w-4 h-4 flex-shrink-0" />
                                                            <span>{appt.citizen_phone}</span>
                                                        </div>
                                                    )}
                                                    {appt.citizen_email && (
                                                        <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                                                            <span>{appt.citizen_email}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                            <p className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </p>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={goToFirstPage}
                                    disabled={currentPage === 1}
                                    className="h-8 w-8 bg-transparent"
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1}
                                    className="h-8 w-8 bg-transparent"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-1 mx-1">
                                    {(() => {
                                        const buttons = []
                                        const maxButtons = 5
                                        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2))
                                        const endPage = Math.min(totalPages, startPage + maxButtons - 1)

                                        if (endPage - startPage < maxButtons - 1) {
                                            startPage = Math.max(1, endPage - maxButtons + 1)
                                        }

                                        if (startPage > 1) {
                                            buttons.push(
                                                <Button
                                                    key={1}
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => goToPage(1)}
                                                    className="h-8 w-8 text-xs"
                                                >
                                                    1
                                                </Button>,
                                            )
                                            if (startPage > 2) {
                                                buttons.push(
                                                    <span key="start-ellipsis" className="px-1 text-muted-foreground">
                                                        …
                                                    </span>,
                                                )
                                            }
                                        }

                                        for (let i = startPage; i <= endPage; i++) {
                                            buttons.push(
                                                <Button
                                                    key={i}
                                                    variant={currentPage === i ? "default" : "outline"}
                                                    size="icon"
                                                    onClick={() => goToPage(i)}
                                                    className="h-8 w-8 text-xs"
                                                >
                                                    {i}
                                                </Button>,
                                            )
                                        }

                                        if (endPage < totalPages) {
                                            if (endPage < totalPages - 1) {
                                                buttons.push(
                                                    <span key="end-ellipsis" className="px-1 text-muted-foreground">
                                                        …
                                                    </span>,
                                                )
                                            }
                                            buttons.push(
                                                <Button
                                                    key={totalPages}
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => goToPage(totalPages)}
                                                    className="h-8 w-8 text-xs"
                                                >
                                                    {totalPages}
                                                </Button>,
                                            )
                                        }

                                        return buttons
                                    })()}
                                </div>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className="h-8 w-8 bg-transparent"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={goToLastPage}
                                    disabled={currentPage === totalPages}
                                    className="h-8 w-8 bg-transparent"
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
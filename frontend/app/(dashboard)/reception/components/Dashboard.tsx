"use client"
import { useQuery } from "@tanstack/react-query"
import { client, type Appointment } from "@/helpers/api/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { format, parseISO, isToday, isAfter, addHours } from "date-fns"
import {
    Calendar,
    Clock,
    Users,
    CheckCircle,
    Hourglass,
    Search,
    Plus,
    Eye,
    User,
    Phone,
    FileText,
    RefreshCw,
    AlertCircle,
    XCircle,
    CalendarClock,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/libs/utils"
import Link from "next/link"

interface DashboardStats {
    total_users: number
    total_members: number
    total_offices: number
    total_active_offices: number
    total_todays_appointments: number
    total_pending_appointments: number
    total_approved_appointments: number
    total_denied_appointments: number
    total_cancelled_appointments: number
    total_completed_appointments: number
}

export default function Dashboard({ token }: { token?: string }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [searchResults, setSearchResults] = useState<Appointment[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    // Fetch dashboard statistics
    const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
        queryKey: ["dashboard-stats"],
        queryFn: () => client.getDashboardStats(token!),
        enabled: !!token,
    })

    // Fetch today's upcoming appointments (next 4 hours)
    const { data: upcomingAppointments, isLoading: upcomingLoading } = useQuery({
        queryKey: ["upcoming-appointments"],
        queryFn: () =>
            client.getReceptionAppointments(
                token!,
                format(new Date(), "yyyy-MM-dd"),
                10,
                0,
                "APPROVED"
            ),
        enabled: !!token,
    })

    // Fetch recent activity (last created appointments)
    const { data: recentActivity, isLoading: recentLoading } = useQuery({
        queryKey: ["recent-activity"],
        queryFn: () =>
            client.getReceptionAppointments(
                token!,
                format(new Date(), "yyyy-MM-dd"),
                5,
                0
            ),
        enabled: !!token,
    })

    // Handle search button click
    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setSearchResults([])
            setHasSearched(false)
            return
        }

        setIsSearching(true)
        setHasSearched(true)
        try {
            const results = await client.searchAppointmentss(searchTerm, token!)
            setSearchResults(results)
        } catch (error) {
            console.error("Search failed:", error)
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }

    // Handle Enter key press in search input
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    // Clear search results
    const handleClearSearch = () => {
        setSearchTerm("")
        setSearchResults([])
        setHasSearched(false)
    }

    // Filter upcoming appointments for next 4 hours
    const getUpcomingAppointments = () => {
        if (!upcomingAppointments?.appointments) return []

        const now = new Date()
        const fourHoursFromNow = addHours(now, 4)

        return upcomingAppointments.appointments.filter((appt: Appointment) => {
            const appointmentTime = parseISO(`${appt.appointment_date}T${appt.time_slotted}`)
            return isAfter(appointmentTime, now) && appointmentTime <= fourHoursFromNow
        }).slice(0, 5) // Limit to 5 appointments
    }

    const getStatusConfig = (status: string) => {
        const configs = {
            PENDING: {
                color: "text-amber-600",
                bg: "bg-amber-500/10",
                icon: Hourglass,
                label: "Pending Review",
            },
            APPROVED: {
                color: "text-emerald-600",
                bg: "bg-emerald-500/10",
                icon: CheckCircle,
                label: "Approved",
            },
            DENIED: {
                color: "text-rose-600",
                bg: "bg-rose-500/10",
                icon: XCircle,
                label: "Denied",
            },
            CANCELLED: {
                color: "text-gray-600",
                bg: "bg-gray-500/10",
                icon: XCircle,
                label: "Cancelled",
            },
            COMPLETED: {
                color: "text-blue-600",
                bg: "bg-blue-500/10",
                icon: CheckCircle,
                label: "Completed",
            },
            POSTPONED: {
                color: "text-purple-600",
                bg: "bg-purple-500/10",
                icon: CalendarClock,
                label: "Postponed",
            },
        }
        return configs[status as keyof typeof configs] || {
            color: "text-gray-600",
            bg: "bg-gray-500/10",
            icon: AlertCircle,
            label: status,
        }
    }

    const upcoming = getUpcomingAppointments()
    const showSearchResults = hasSearched && searchResults.length > 0
    const showNoResults = hasSearched && searchResults.length === 0

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-brand-gray mt-1 mb-4">
                        Here's today's overview.
                    </p>
                    <time className="text-base font-semibold text-brand bg-brand-primary/20 px-4 py-3 rounded-xl border border-brand/20 shadow-gren">
                        {today}
                    </time>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild className="py-6 text-brand-gray">
                        <Link href="/reception/appointments/today">
                            <Eye className="w-4 h-4 mr-2" />
                            View All Today
                        </Link>
                    </Button>
                    <Button size="sm" asChild className="py-6 bg-brand hover:bg-brand/90 font-bold">
                        <Link href="/reception/appointments/add">
                            <Plus className="w-4 h-4 mr-2" />
                            New Appointment
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Quick Search */}
            <Card className="border-none!  bg-linear-to-br from-brand-/20 to-brand-primary shadow-gren">
                <CardContent className="p-6 ">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search citizens by name, phone, or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="pl-10 pr-4 py-6 text-base bg-white shadow-gren"
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={isSearching || !searchTerm.trim()}
                            className="py-6 px-6 bg-brand hover:bg-brand/90"
                        >
                            {isSearching ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Search className="w-4 h-4" />
                            )}
                            <span className="ml-2">Search</span>
                        </Button>
                    </div>

                    {/* Search Results */}
                    {showSearchResults && (
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Found {searchResults.length} appointment(s)
                                </p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearSearch}
                                    className="h-8"
                                >
                                    Clear
                                </Button>
                            </div>
                            {searchResults.map((appt) => {
                                const statusConfig = getStatusConfig(appt.status)
                                const StatusIcon = statusConfig.icon
                                const fullName = `${appt.citizen_firstname} ${appt.citizen_lastname}`
                                const appointmentDate = parseISO(appt.appointment_date)
                                const isAppointmentToday = isToday(appointmentDate)

                                return (
                                    <div
                                        key={appt.appointment_id}
                                        className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-semibold truncate">{fullName}</h4>
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-xs", statusConfig.color, statusConfig.bg)}
                                                >
                                                    <StatusIcon className="w-3 h-3 mr-1" />
                                                    {statusConfig.label}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    <span>{appt.citizen_phone}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{format(appointmentDate, "MMM d, yyyy")}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{appt.time_slotted.substring(0, 5)}</span>
                                                </div>
                                                {appt.purpose && (
                                                    <div className="flex items-center gap-1">
                                                        <FileText className="w-3 h-3" />
                                                        <span className="truncate max-w-[200px]">{appt.purpose}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {!isAppointmentToday && (
                                            <Badge variant="secondary" className="ml-2 flex-shrink-0">
                                                Not Today
                                            </Badge>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* No Results Message */}
                    {showNoResults && (
                        <div className="mt-4 text-center py-8 border-2 border-dashed rounded-lg bg-muted/30">
                            <Search className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-60" />
                            <p className="text-muted-foreground font-medium">No appointments found</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                No appointments match "{searchTerm}"
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearSearch}
                                className="mt-3"
                            >
                                Clear Search
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Today */}
                <Card className="shadow-gren! border! border-brand-secondary">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-brand-gray">Today's Appointments</p>
                                {statsLoading ? (
                                    <Skeleton className="h-8 w-16 mt-2" />
                                ) : (
                                    <p className="text-2xl font-bold mt-2">{stats?.total_todays_appointments || 0}</p>
                                )}
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-brand-gray">Pending Approval</p>
                                {statsLoading ? (
                                    <Skeleton className="h-8 w-16 mt-2" />
                                ) : (
                                    <p className="text-2xl font-bold mt-2">{stats?.total_pending_appointments || 0}</p>
                                )}
                            </div>
                            <div className="p-3 bg-amber-500/10 rounded-lg">
                                <Hourglass className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Approved */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-brand-gray">Confirmed</p>
                                {statsLoading ? (
                                    <Skeleton className="h-8 w-16 mt-2" />
                                ) : (
                                    <p className="text-2xl font-bold mt-2">{stats?.total_approved_appointments || 0}</p>
                                )}
                            </div>
                            <div className="p-3 bg-emerald-500/10 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Completed */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-brand-gray">Completed</p>
                                {statsLoading ? (
                                    <Skeleton className="h-8 w-16 mt-2" />
                                ) : (
                                    <p className="text-2xl font-bold mt-2">{stats?.total_completed_appointments || 0}</p>
                                )}
                            </div>
                            <div className="p-3 bg-green-500/10 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Appointments */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Upcoming (Next 4 Hours)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {upcomingLoading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex gap-3 p-3 border rounded-lg">
                                        <Skeleton className="h-12 w-12 rounded-lg" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : upcoming.length > 0 ? (
                            <div className="space-y-3">
                                {upcoming.map((appt: Appointment) => {
                                    const fullName = `${appt.citizen_firstname} ${appt.citizen_lastname}`
                                    const time = appt.time_slotted.substring(0, 5)

                                    return (
                                        <div
                                            key={appt.appointment_id}
                                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex-shrink-0 w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                                <Clock className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold truncate">{fullName}</h4>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    Host: {appt.host_first_name} {appt.host_last_name}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-emerald-600">{time}</p>
                                                <p className="text-xs text-muted-foreground">Today</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No upcoming appointments in the next 4 hours</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentLoading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex gap-3 p-3 border rounded-lg">
                                        <Skeleton className="h-12 w-12 rounded-lg" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : recentActivity?.appointments && recentActivity.appointments.length > 0 ? (
                            <div className="space-y-3">
                                {recentActivity.appointments.slice(0, 5).map((appt: Appointment) => {
                                    const fullName = `${appt.citizen_firstname} ${appt.citizen_lastname}`
                                    const statusConfig = getStatusConfig(appt.status)
                                    const StatusIcon = statusConfig.icon

                                    return (
                                        <div
                                            key={appt.appointment_id}
                                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                                        >
                                            <div className={cn("flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center", statusConfig.bg)}>
                                                <StatusIcon className={cn("w-5 h-5", statusConfig.color)} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold truncate">{fullName}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {appt.time_slotted.substring(0, 5)} • {appt.purpose || "No purpose specified"}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={cn("text-xs", statusConfig.color, statusConfig.bg)}
                                            >
                                                {statusConfig.label}
                                            </Badge>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No recent activity today</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
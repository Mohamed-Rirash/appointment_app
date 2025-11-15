import { redirect } from "next/navigation";
import { getSession } from "@/helpers/actions/getsession";
import { UserCheck, Clock, UserPlus, CalendarX } from "lucide-react";
import { QuickActionCard } from "./components/quick-action-card";
import { TodayAppointments } from "./components/today-appointments";

export const metadata = {
    title: "Reception Dashboard - KulanDesk",
    description: "Citizen check-in and walk-in management",
};

export default async function ReceptionDashboard() {
    const session = await getSession()
    const token = session?.user.access_token

    if (!token) {
        redirect("/Signin");
    }

    // Use dummy data instead of API calls for now
    const stats = {
        checked_in: 24,
        pending: 8,
        walk_ins: 12,
        no_shows: 3
    };


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reception</h1>
                    <p className="text-muted-foreground">
                        Check-in citizens and manage walk-ins
                    </p>
                </div>
                <div className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Checked In"
                    value={stats.checked_in}
                    icon="user-check"
                    color="text-green-600"
                />
                <StatCard
                    title="Pending"
                    value={stats.pending}
                    icon="clock"
                    color="text-yellow-600"
                />
                <StatCard
                    title="Walk-ins"
                    value={stats.walk_ins}
                    icon="user-plus"
                    color="text-blue-600"
                />
                <StatCard
                    title="No-shows"
                    value={stats.no_shows}
                    icon="calendar-x"
                    color="text-red-600"
                />
            </div>

            {/* Quick Actions - Optimized for Tablets */}
            <div className="grid gap-4 md:grid-cols-2">
                <QuickActionCard
                    icon="qr"
                    title="Scan QR Code"
                    description="Check in citizen with appointment QR code"
                    href="/reception/check-in"
                    variant="primary"
                    shortcut="⌘+Q"
                />
                <QuickActionCard
                    icon="walk-in"
                    title="Walk-In Appointment"
                    description="Create appointment for citizen without booking"
                    href="/reception/walk-in"
                    variant="secondary"
                    shortcut="⌘+W"
                />
            </div>

            {/* Today's Appointments */}
            <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">Today's Appointments</h2>
                <TodayAppointments />
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: number;
    icon: string;
    color: string;
}) {
    const Icon = {
        "user-check": UserCheck,
        clock: Clock,
        "user-plus": UserPlus,
        "calendar-x": CalendarX,
    }[icon];

    return (
        <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-3xl font-bold">{value}</p>
                </div>
                <Icon className={`h-8 w-8 ${color}`} />
            </div>
        </div>
    );
}
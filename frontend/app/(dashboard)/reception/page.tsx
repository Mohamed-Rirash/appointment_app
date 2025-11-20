import { redirect } from "next/navigation";
import { getSession } from "@/helpers/actions/getsession";
import {
    UserCheck,
    Clock,
    UserPlus,
    CalendarX,
    Calendar
} from "lucide-react";
import { CheckInSearchCard, QuickActionCard } from "./components/quick-action-card";
import { TodayAppointments } from "./components/today-appointments";

export const metadata = {
    title: "Reception Desk - KulanDesk",
    description: "Streamline citizen check-ins and manage walk-in appointments in real-time",
};

export default async function ReceptionDashboard() {
    const session = await getSession();
    const token = session?.user.access_token;

    if (!token) {
        redirect("/Signin");
    }

    // Live dashboard metrics (replace with API data)
    const metrics = {
        checked_in: { value: 24, trend: '+12%' },
        pending: { value: 8, trend: '-5%' },
        walk_ins: { value: 12, trend: '+8%' },
        no_shows: { value: 3, trend: '-2%' }
    };

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6  space-y-8">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-linear-to-r from-brand-black to-brand via-brand bg-clip-text text-transparent">
                        Reception Desk
                    </h1>
                    <p className="text-brand-gray text-lg max-w-2xl">
                        Streamline citizen check-ins and manage walk-in appointments in real-time
                    </p>
                </div>
                <time className="text-base font-semibold text-brand bg-brand-primary/20 px-4 py-3 rounded-xl border border-brand/20 shadow-gren">
                    {today}
                </time>
            </header>

            {/* Live Metrics */}
            <section className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Checked In"
                    value={metrics.checked_in.value}
                    icon={UserCheck}
                    color="text-emerald-600"
                    bgColor="bg-emerald-50"
                    borderColor="border-emerald-200"
                />
                <MetricCard
                    title="Awaiting"
                    value={metrics.pending.value}
                    icon={Clock}
                    color="text-amber-600"
                    bgColor="bg-amber-50"
                    borderColor="border-amber-200"
                />
                <MetricCard
                    title="Walk-ins"
                    value={metrics.walk_ins.value}
                    icon={UserPlus}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                    borderColor="border-blue-200"
                />
                <MetricCard
                    title="No-shows"
                    value={metrics.no_shows.value}
                    icon={CalendarX}
                    color="text-rose-600"
                    bgColor="bg-rose-50"
                    borderColor="border-rose-200"
                />
            </section>

            {/* Main Content Grid */}
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Quick Actions */}
                <section className="lg:col-span-1">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-8 bg-brand-primary rounded-full"></div>
                        <h2 className="text-2xl font-bold text-brand-black">
                            Quick Actions
                        </h2>
                    </div>
                    <div className="space-y-4">
                        <div className=""> <CheckInSearchCard /></div>
                        <QuickActionCard
                            icon={`walk-in`}
                            title="Register Walk-in"
                            description="Create on-the-spot appointments for citizens without prior booking"
                            href="/reception/walk-in"
                            variant="secondary"
                            shortcut="⌘+W"
                        />
                    </div>
                </section>

                {/* Today's Schedule */}
                <section className="lg:col-span-2">
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-gren hover:shadow-md transition-all duration-300 overflow-hidden">
                        <div className="bg-linear-to-r from-brand-primary/30 to-brand-primary/80 p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <Calendar className="w-6 h-6 text-brand" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-brand-black">
                                        Today's Appointments
                                    </h2>
                                    <p className="text-brand-gray mt-1">
                                        Real-time schedule of all citizen appointments
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <TodayAppointments />
                        </div>
                    </div>
                </section>
            </div>

        </div>
    );
}

// Enhanced Metric Card Component
function MetricCard({
    title,
    value,
    icon: Icon,
    color,
    bgColor,
    borderColor
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
}) {
    return (
        <div className={`group relative overflow-hidden rounded-2xl border border-brand-primary/50 bg-white shadow-gren hover:shadow-gren transition-all duration-300 hover:-translate-y-2`}>
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-linear-to-br from-white to-gray-50 group-hover:from-brand-primary/5 group-hover:to-brand-primary/10 transition-all duration-300" />

            <div className="relative p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-3">
                        <p className="text-sm font- text-brand-gray uppercase tracking-wide">
                            {title}
                        </p>
                        <div className="flex items-baseline gap-3">
                            <p className="text-4xl font-bold text-brand-black">
                                {value}
                            </p>
                        </div>
                    </div>
                    <div className={`p-3 rounded-xl ${bgColor} border ${borderColor} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                        <Icon className={`w-7 h-7 ${color}`} />
                    </div>
                </div>

            </div>
        </div>
    );
}
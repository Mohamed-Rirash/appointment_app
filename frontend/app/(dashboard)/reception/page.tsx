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
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight ">
                        Dashboard
                    </h1>
                    <p className="text-brand-gray text-lg max-w-2xl">
                        Create and Manage appointments
                    </p>
                </div>
                <time className="text-base font-semibold text-brand bg-brand-primary/20 px-4 py-3 rounded-xl border border-brand/20 shadow-gren">
                    {today}
                </time>
            </header>



            {/* Main Content Grid */}
            <div className="grid gap-8 lg:grid-cols-1">
                {/* Today's Schedule */}
                <section className="lg:col-span-1">
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-gren hover:shadow-md transition-all duration-300 overflow-hidden">
                        <div className="p-6">
                            <TodayAppointments token={token} />
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
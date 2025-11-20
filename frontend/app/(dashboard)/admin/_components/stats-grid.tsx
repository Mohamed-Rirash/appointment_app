"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, } from "lucide-react";
import {
    LayoutDashboard,
    Building2,
    Users,
    CalendarCheck,
    Clock,
    Activity
} from "lucide-react";

// Create a mapping from string identifiers to icon components
const iconMap = {
    Users: Users,
    Building2: Building2,
    CalendarCheck: CalendarCheck,
    Clock: Clock,
    TrendingUp: TrendingUp,
    Activity: Activity,
    LayoutDashboard: LayoutDashboard,
};

export interface Metric {
    title: string;
    value: string | number;
    change: string;
    icon: string; // Now a string identifier
    trend: "up" | "down" | "neutral" | "warning";
    color?: string; // Optional gradient color
}

interface StatsGridProps {
    metrics: Metric[];
}

export function StatsGrid({ metrics }: StatsGridProps) {

    const getCardGradient = (index: number) => {
        const gradients = [
            "from-blue-500/10 to-blue-600/10",
            "from-green-500/10 to-green-600/10",
            "from-purple-500/10 to-purple-600/10",
            "from-amber-500/10 to-amber-600/10",
            "from-emerald-500/10 to-emerald-600/10",
            "from-indigo-500/10 to-indigo-600/10"
        ];
        return gradients[index % gradients.length];
    };

    const getIconColor = (index: number) => {
        const colors = [
            "text-blue-600",
            "text-green-600",
            "text-purple-600",
            "text-amber-600",
            "text-emerald-600",
            "text-indigo-600"
        ];
        return colors[index % colors.length];
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric, index) => {
                // Get the icon component from the mapping
                const IconComponent = iconMap[metric.icon as keyof typeof iconMap] || Activity;
                const cardGradient = metric.color || getCardGradient(index);
                const iconColor = getIconColor(index);

                return (
                    <Card
                        key={metric.title}
                        className={`group relative overflow-hidden border-0 bg-linear-to-br ${cardGradient} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
                    >
                        {/* Animated background effect */}
                        <div className="absolute inset-0 bg-linear-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-6 ">
                            <CardTitle className="text-sm font-semibold text-gray-700">
                                {metric.title}
                            </CardTitle>
                            <div className={`p-2 rounded-xl bg-white/80 shadow-sm ${iconColor}`}>
                                <IconComponent className="h-5 w-5" />
                            </div>
                        </CardHeader>

                        <CardContent className="px-6 ">
                            <div className="space-y-2">
                                <div className="text-3xl font-bold text-gray-900 tracking-tight">
                                    {metric.value}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
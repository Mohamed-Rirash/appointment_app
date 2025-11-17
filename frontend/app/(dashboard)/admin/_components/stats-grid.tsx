"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp, TrendingDown } from "lucide-react";
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

interface Metric {
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
    const getTrendConfig = (trend: Metric["trend"]) => {
        switch (trend) {
            case "up":
                return {
                    icon: <TrendingUp className="h-4 w-4 text-green-600" />,
                    badgeVariant: "success" as const,
                    bgColor: "bg-green-50",
                    textColor: "text-green-700",
                    borderColor: "border-green-200"
                };
            case "down":
                return {
                    icon: <TrendingDown className="h-4 w-4 text-red-600" />,
                    badgeVariant: "destructive" as const,
                    bgColor: "bg-red-50",
                    textColor: "text-red-700",
                    borderColor: "border-red-200"
                };
            case "warning":
                return {
                    icon: <Minus className="h-4 w-4 text-amber-600" />,
                    badgeVariant: "warning" as const,
                    bgColor: "bg-amber-50",
                    textColor: "text-amber-700",
                    borderColor: "border-amber-200"
                };
            default:
                return {
                    icon: <Minus className="h-4 w-4 text-gray-600" />,
                    badgeVariant: "secondary" as const,
                    bgColor: "bg-gray-50",
                    textColor: "text-gray-700",
                    borderColor: "border-gray-200"
                };
        }
    };

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
                const trendConfig = getTrendConfig(metric.trend);
                const cardGradient = metric.color || getCardGradient(index);
                const iconColor = getIconColor(index);

                return (
                    <Card
                        key={metric.title}
                        className={`group relative overflow-hidden border-0 bg-gradient-to-br ${cardGradient} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
                    >
                        {/* Animated background effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Accent border */}
                        <div className={`absolute top-0 left-0 w-1 h-full ${trendConfig.bgColor.replace('bg-', 'bg-')}`} />

                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-6 pt-6">
                            <CardTitle className="text-sm font-semibold text-gray-700">
                                {metric.title}
                            </CardTitle>
                            <div className={`p-2 rounded-xl bg-white/80 shadow-sm ${iconColor}`}>
                                <IconComponent className="h-5 w-5" />
                            </div>
                        </CardHeader>

                        <CardContent className="px-6 pb-6">
                            <div className="space-y-3">
                                <div className="text-3xl font-bold text-gray-900 tracking-tight">
                                    {metric.value}
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${trendConfig.bgColor}`}>
                                        {trendConfig.icon}
                                    </div>
                                    <Badge
                                        variant={trendConfig.badgeVariant}
                                        className={`${trendConfig.bgColor} ${trendConfig.textColor} ${trendConfig.borderColor} font-medium text-xs px-2 py-1`}
                                    >
                                        {metric.change}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>

                        {/* Hover effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </Card>
                );
            })}
        </div>
    );
}
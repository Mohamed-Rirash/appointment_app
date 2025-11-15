"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Calendar,
    Clock,
    CheckCircle,
    TrendingUp
} from "lucide-react";

interface QuickStatsProps {
    totalToday: number;
    pending: number;
    completed: number;
    approvalRate: number;
}

export function QuickStats({
    totalToday,
    pending,
    completed,
    approvalRate
}: QuickStatsProps) {
    const stats = [
        {
            title: "Total Today",
            value: totalToday,
            icon: Calendar,
            color: "text-brand",
        },
        {
            title: "Pending",
            value: pending,
            icon: Clock,
            color: "text-yellow-600",
        },
        {
            title: "Completed",
            value: completed,
            icon: CheckCircle,
            color: "text-green-600",
        },
        {
            title: "Approval Rate",
            value: `${approvalRate}%`,
            icon: TrendingUp,
            color: "text-purple-600",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <Card key={stat.title} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-brand-gray">
                                {stat.title}
                            </CardTitle>
                            <Icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
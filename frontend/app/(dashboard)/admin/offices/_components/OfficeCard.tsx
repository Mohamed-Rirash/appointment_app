"use client";

import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Building2, MoreVertical } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useOfficeMembers } from "@/helpers/hooks/office/useOfficeMembers";
import { OfficeActionsDropdown } from "./OfficeActionDropdown";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface Office {
    id: string;
    name: string;
    description: string;
    location: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export function OfficeCard({ office, token }: { office: Office; token?: string }) {
    const { memberCount } = useOfficeMembers(office.id, token);

    // Generate avatar fallback from office name
    const getOfficeInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Get color based on office status
    const getStatusColors = (isActive: boolean) => {
        return isActive
            ? {
                badge: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
                dot: "bg-green-500",
                gradient: "from-brand/50 to-brand"
            }
            : {
                badge: "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100",
                dot: "bg-gray-400",
                gradient: "from-gray-400 to-gray-500"
            };
    };

    const statusColors = getStatusColors(office.is_active);

    return (
        <Card className="group relative  overflow-hidden border-0 bg-linear-to-br from-white to-gray-50/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            {/* Status Indicator Bar */}
            <div className={`absolute top-0 left-0 w-1 h-full bg-linear-to-b ${statusColors.gradient}`} />

            <CardContent className="p-6">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                            <AvatarFallback className={`bg-linear-to-br ${statusColors.gradient} text-white font-semibold`}>
                                {getOfficeInitials(office.name)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">
                                {office.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                <MapPin className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                                <p className="text-sm text-gray-600 truncate">
                                    {office.location}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions Dropdown */}
                    <div className="flex-shrink-0 ml-2">
                        <OfficeActionsDropdown
                            id={office.id}
                            token={token}
                            office={office}
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                    <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                        {office.description}
                    </p>
                </div>

                <Separator className="my-4 bg-gray-200" />

                {/* Footer Stats */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Members Count */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="p-1.5 bg-blue-50 rounded-lg">
                                <Users className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                            <span className="font-semibold text-gray-900">{memberCount}</span>
                            <span className="text-gray-500">members</span>
                        </div>

                        {/* Status Badge */}
                        <Badge
                            variant="outline"
                            className={`${statusColors.badge} font-medium px-3 py-1.5 rounded-full transition-colors`}
                        >
                            <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${statusColors.dot}`} />
                                {office.is_active ? "Active" : "Inactive"}
                            </div>
                        </Badge>
                    </div>

                    {/* Additional Info (if available) */}
                    {office.created_at && (
                        <div className="text-xs text-gray-400 text-right">
                            Created {new Date(office.created_at).toLocaleDateString()}
                        </div>
                    )}
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-linear-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
            </CardContent>
        </Card>
    );
}
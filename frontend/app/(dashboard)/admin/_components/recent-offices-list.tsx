import Link from "next/link";
import { Building2, MapPin, Calendar, FileText, Users, ArrowUpRight, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface Office {
    id: string;
    name: string;
    description: string;
    location: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface RecentOfficesListProps {
    offices: Office[];
    token: string;
}

export function RecentOfficesList({ offices, token }: RecentOfficesListProps) {
    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "MMM d, yyyy");
    };

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
        return formatDate(dateString);
    };



    return (
        <Card className="border border-brand-primary bg-linear-to-br from-white to-brand/30 shadow-gren">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                        <div className="p-2 bg-brand-primary rounded-xl">
                            <Building2 className="h-5 w-5 text-brand" />
                        </div>
                        Recently Added Offices
                        <Badge variant="outline" className="bg-white text-gray-600 border-gray-200">
                            {offices.length} offices
                        </Badge>
                    </CardTitle>
                    <Link href="/admin/offices">
                        <Button variant="outline" className="h-9 px-4 border-gray-300 hover:bg-gray-50 font-medium">
                            View All
                            <ArrowUpRight className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="space-y-3">
                    {offices.length === 0 ? (
                        <div className="text-center py-12">
                            <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">No offices found</p>
                            <p className="text-sm text-gray-400 mt-1">Create your first office to get started</p>
                        </div>
                    ) : (
                        offices.map((office, index) => {
                            return (
                                <div
                                    key={office.id}
                                    className={`group relative p-6 transition-all duration-200 hover:bg-white/80 ${index !== offices.length - 1 ? 'border-b border-gray-100' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        {/* Office Info */}
                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                            <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                                                <AvatarImage
                                                    src={`https://api.dicebear.com/7.x/shapes/svg?seed=${office.id}`}
                                                    alt={office.name}
                                                />
                                                <AvatarFallback className="bg-linear-to-br from-blue-500 to-blue-600 text-white font-semibold">
                                                    {office.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 min-w-0 space-y-3">
                                                {/* Header with name and status */}
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h4 className="font-bold text-gray-900 text-lg truncate">
                                                        {office.name}
                                                    </h4>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            office.is_active
                                                                ? "bg-brand-primary text-brand border-brand/70 font-medium"
                                                                : "bg-gray-50 text-gray-600 border-gray-200 font-medium"
                                                        }
                                                    >
                                                        {office.is_active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>

                                                {/* Location */}
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                                                    <span className="text-sm font-medium">{office.location}</span>
                                                </div>

                                                {/* Description */}
                                                {office.description && (
                                                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                                                        {office.description}
                                                    </p>
                                                )}


                                                {/* Timestamps */}
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span>Created {getTimeAgo(office.created_at)}</span>
                                                    </div>
                                                    {office.updated_at !== office.created_at && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            <span>Updated {getTimeAgo(office.updated_at)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="shrink-0">
                                            <Link href={`/admin/offices/${office.id}`}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-9 px-4 border-gray-300 hover:bg-gray-50 font-medium group/btn"
                                                >
                                                    Manage
                                                    <ArrowUpRight className="h-3.5 w-3.5 ml-1.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Hover effect overlay */}
                                    <div className="absolute inset-0 bg-linear-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
                                </div>
                            );
                        })
                    )}
                </div>

                {/* View All Footer */}
                {offices.length > 0 && (
                    <div className="border-t border-gray-100 p-4">
                        <Link href="/admin/offices" className="block w-full">
                            <Button variant="ghost" className="w-full justify-center text-brand/90 hover:text-brand hover:bg-blue-50 font-medium">
                                View all offices
                                <ArrowUpRight className="h-4 w-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
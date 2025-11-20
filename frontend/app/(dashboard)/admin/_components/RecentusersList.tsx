import Link from "next/link";
import { User, Mail, Calendar, Clock, ArrowUpRight, UserCheck, UserX } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
export interface Recentuser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
    is_system_user: boolean;
    is_verified: boolean;
    last_login: string | null;
    login_count: number;
    permissions: string[];
    roles: ('host' | 'admin' | 'reception' | 'secretary')[];
    created_at: string;
    updated_at: string;
    created_by: string | null;
    updated_by: string | null;
}
interface RecentusersListProps {
    users: Recentuser[];
}

export function RecentusersList({ users }: RecentusersListProps) {
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

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName ? lastName.charAt(0) : ''}`.toUpperCase();
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin':
                return "bg-red-100 text-red-700 border-red-200";
            case 'host':
                return "bg-blue-100 text-blue-700 border-blue-200";
            case 'reception':
                return "bg-green-100 text-green-700 border-green-200";
            case 'secretary':
                return "bg-purple-100 text-purple-700 border-purple-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    return (
        <Card className="border border-brand-primary bg-linear-to-br from-white to-brand/30 shadow-gren">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                        <div className="p-2 bg-brand-primary rounded-xl">
                            <User className="h-5 w-5 text-brand" />
                        </div>
                        Recently Added Users
                        <Badge variant="outline" className="bg-white text-gray-600 border-gray-200">
                            {users.length} users
                        </Badge>
                    </CardTitle>
                    <Link href="/admin/members">
                        <Button variant="outline" className="h-9 px-4 border-gray-300 hover:bg-gray-50 font-medium">
                            View All
                            <ArrowUpRight className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="space-y-3">
                    {users.length === 0 ? (
                        <div className="text-center py-12">
                            <User className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">No users found</p>
                            <p className="text-sm text-gray-400 mt-1">Users will appear here once created</p>
                        </div>
                    ) : (
                        users.map((user, index) => {
                            const primaryRole = user.roles[0] || 'user';
                            return (
                                <div
                                    key={user.id}
                                    className={`group relative p-6 transition-all duration-200 hover:bg-white/80 ${index !== users.length - 1 ? 'border-b border-gray-100' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        {/* User Info */}
                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                            <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                                                <AvatarImage
                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                                                    alt={`${user.first_name} ${user.last_name}`}
                                                />
                                                <AvatarFallback className="bg-linear-to-br from-blue-500 to-blue-600 text-white font-semibold">
                                                    {getInitials(user.first_name, user.last_name)}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 min-w-0 space-y-3">
                                                {/* Header with name and status */}
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h4 className="font-bold text-gray-900 text-lg">
                                                        {user.first_name} {user.last_name}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                user.is_active
                                                                    ? "bg-green-100 text-green-700 border-green-200 font-medium"
                                                                    : "bg-gray-50 text-gray-600 border-gray-200 font-medium"
                                                            }
                                                        >
                                                            {user.is_active ? (
                                                                <UserCheck className="h-3 w-3 mr-1" />
                                                            ) : (
                                                                <UserX className="h-3 w-3 mr-1" />
                                                            )}
                                                            {user.is_active ? "Active" : "Inactive"}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className={`${getRoleBadgeColor(primaryRole)} font-medium capitalize`}
                                                        >
                                                            {primaryRole}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {/* Email */}
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                                                    <span className="text-sm font-medium truncate">{user.email}</span>
                                                </div>

                                                {/* User Stats */}
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span>Joined {getTimeAgo(user.created_at)}</span>
                                                    </div>
                                                    {user.last_login && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            <span>Last login {getTimeAgo(user.last_login)}</span>
                                                        </div>
                                                    )}
                                                    {user.login_count > 0 && (
                                                        <div className="flex items-center gap-1.5">
                                                            <span>{user.login_count} logins</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Verification Status */}
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            user.is_verified
                                                                ? "bg-blue-100 text-blue-700 border-blue-200 text-xs"
                                                                : "bg-amber-100 text-amber-700 border-amber-200 text-xs"
                                                        }
                                                    >
                                                        {user.is_verified ? "Verified" : "Pending Verification"}
                                                    </Badge>
                                                    {user.is_system_user && (
                                                        <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                                                            System User
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
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
                {users.length > 0 && (
                    <div className="border-t border-gray-100 p-4">
                        <Link href="/admin/members" className="block w-full">
                            <Button variant="ghost" className="w-full justify-center text-brand/90 hover:text-brand hover:bg-blue-50 font-medium">
                                View all users
                                <ArrowUpRight className="h-4 w-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
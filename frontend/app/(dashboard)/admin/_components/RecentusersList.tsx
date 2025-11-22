import Link from "next/link";
import { User, Mail, Calendar, Clock, ArrowUpRight, UserCheck, UserX, Shield, CheckCircle, Clock as ClockIcon } from "lucide-react";
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
                return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
            case 'host':
                return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
            case 'reception':
                return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100";
            case 'secretary':
                return "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100";
            default:
                return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100";
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin':
                return <Shield className="h-3 w-3" />;
            case 'host':
                return <User className="h-3 w-3" />;
            case 'reception':
                return <UserCheck className="h-3 w-3" />;
            case 'secretary':
                return <Mail className="h-3 w-3" />;
            default:
                return <User className="h-3 w-3" />;
        }
    };

    return (
        <Card className="border border-brand-primary shadow-gren hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4 pt-4 bg-linear-to-r from-brand-primary/50 to-white border-b border-brand-primary">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                        <div className="p-2 bg-linear-to-br from-brand/60 to-brand rounded-xl shadow-gren">
                            <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            Recently Added Users
                            <p className="text-sm font-normal text-gray-500 mt-1">
                                New user accounts in the system
                            </p>
                        </div>
                    </CardTitle>
                    <Badge variant="secondary" className="bg-brand-primary/30 text-brand border-brand-primary font-medium px-3 py-1">
                        {users.length} {users.length === 1 ? 'user' : 'users'}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="divide-y divide-brand-primary">
                    {users.length === 0 ? (
                        <div className="text-center py-12 px-6">
                            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <User className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium text-lg mb-2">No users found</p>
                            <p className="text-sm text-gray-400 max-w-sm mx-auto">
                                Users will appear here once they are added to the system
                            </p>
                        </div>
                    ) : (
                        users.map((user, index) => {
                            const primaryRole = user.roles[0] || 'user';
                            return (
                                <div
                                    key={user.id}
                                    className="group relative p-6 transition-all duration-200 hover:bg-brand-primary/30 hover:border-l-4 hover:border-l-brand"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        {/* User Info */}
                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                            <div className="relative">
                                                <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm group-hover:ring-blue-100 transition-all duration-200">
                                                    <AvatarImage
                                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                                                        alt={`${user.first_name} ${user.last_name}`}
                                                    />
                                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                                                        {getInitials(user.first_name, user.last_name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {user.is_active && (
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                                        <CheckCircle className="h-3 w-3 text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0 space-y-3">
                                                {/* Header with name and status */}
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2">
                                                        <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-900 transition-colors">
                                                            {user.first_name} {user.last_name}
                                                        </h4>

                                                        {/* Email */}
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                                                            <span className="text-sm font-medium truncate">{user.email}</span>
                                                        </div>
                                                    </div>

                                                    {/* Status badges */}
                                                    <div className="flex items-center gap-2 flex-wrap justify-end">
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                user.is_active
                                                                    ? "bg-green-50 text-green-700 border-green-200 font-medium"
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
                                                    </div>
                                                </div>

                                                {/* Role and verification */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge
                                                        variant="outline"
                                                        className={`${getRoleBadgeColor(primaryRole)} font-medium capitalize flex items-center gap-1`}
                                                    >
                                                        {getRoleIcon(primaryRole)}
                                                        {primaryRole}
                                                    </Badge>

                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            user.is_verified
                                                                ? "bg-blue-50 text-blue-700 border-blue-200 text-xs flex items-center gap-1"
                                                                : "bg-amber-50 text-amber-700 border-amber-200 text-xs flex items-center gap-1"
                                                        }
                                                    >
                                                        {user.is_verified ? (
                                                            <CheckCircle className="h-3 w-3" />
                                                        ) : (
                                                            <ClockIcon className="h-3 w-3" />
                                                        )}
                                                        {user.is_verified ? "Verified" : "Pending"}
                                                    </Badge>

                                                    {user.is_system_user && (
                                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs flex items-center gap-1">
                                                            <Shield className="h-3 w-3" />
                                                            System User
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* User Stats */}
                                                <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                                                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span className="text-xs font-medium">Joined {getTimeAgo(user.created_at)}</span>
                                                    </div>
                                                    {user.last_login && (
                                                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            <span className="text-xs font-medium">Last login {getTimeAgo(user.last_login)}</span>
                                                        </div>
                                                    )}
                                                    {user.login_count > 0 && (
                                                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                                            <span className="text-xs font-medium">{user.login_count} {user.login_count === 1 ? 'login' : 'logins'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* View All Footer */}
                {users.length > 0 && (
                    <div className="border-t border-brand-primary/30 bg-brand-primary/50 p-4">
                        <Link href="/admin/members" className="block w-full">
                            <Button
                                variant="ghost"
                                className="w-full justify-center text-brand/90 hover:text-brand hover:bg-brand-primary/20 font-medium group transition-all duration-200"
                            >
                                View all users
                                <ArrowUpRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
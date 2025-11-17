import { format } from "date-fns";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    UserPlus,
    Building2,
    Calendar,
    Edit,
    Trash2,
    Activity,
    Clock,
    MoreHorizontal,
    User,
    Shield,
    CalendarCheck
} from "lucide-react";

interface Activity {
    id: string;
    user: {
        first_name: string;
        last_name: string;
        email: string;
    };
    action: string;
    resource: string;
    timestamp: string;
    office_name?: string;
}

interface RecentActivityFeedProps {
    activities: Activity[];
}

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    CREATED: UserPlus,
    UPDATED: Edit,
    DELETED: Trash2,
    OFFICE_CREATED: Building2,
    OFFICE_UPDATED: Building2,
    OFFICE_DELETED: Building2,
    USER_CREATED: UserPlus,
    USER_UPDATED: User,
    USER_DELETED: Trash2,
    HOST_CREATED: Shield,
    HOST_UPDATED: Shield,
    HOST_DELETED: Shield,
    APPOINTMENT_CREATED: CalendarCheck,
    APPOINTMENT_UPDATED: Calendar,
    APPOINTMENT_DELETED: Trash2,
    APPOINTMENT_APPROVED: CalendarCheck,
    APPOINTMENT_REJECTED: Calendar,
};

const actionColors: Record<string, string> = {
    CREATED: "text-green-600 bg-green-50 border-green-200",
    UPDATED: "text-blue-600 bg-blue-50 border-blue-200",
    DELETED: "text-red-600 bg-red-50 border-red-200",
    OFFICE_CREATED: "text-purple-600 bg-purple-50 border-purple-200",
    OFFICE_UPDATED: "text-indigo-600 bg-indigo-50 border-indigo-200",
    OFFICE_DELETED: "text-red-600 bg-red-50 border-red-200",
    USER_CREATED: "text-emerald-600 bg-emerald-50 border-emerald-200",
    USER_UPDATED: "text-cyan-600 bg-cyan-50 border-cyan-200",
    USER_DELETED: "text-red-600 bg-red-50 border-red-200",
    HOST_CREATED: "text-amber-600 bg-amber-50 border-amber-200",
    HOST_UPDATED: "text-orange-600 bg-orange-50 border-orange-200",
    HOST_DELETED: "text-red-600 bg-red-50 border-red-200",
    APPOINTMENT_CREATED: "text-blue-600 bg-blue-50 border-blue-200",
    APPOINTMENT_UPDATED: "text-indigo-600 bg-indigo-50 border-indigo-200",
    APPOINTMENT_DELETED: "text-red-600 bg-red-50 border-red-200",
    APPOINTMENT_APPROVED: "text-green-600 bg-green-50 border-green-200",
    APPOINTMENT_REJECTED: "text-red-600 bg-red-50 border-red-200",
};

const actionLabels: Record<string, string> = {
    CREATED: "Created",
    UPDATED: "Updated",
    DELETED: "Deleted",
    OFFICE_CREATED: "Office Created",
    OFFICE_UPDATED: "Office Updated",
    OFFICE_DELETED: "Office Deleted",
    USER_CREATED: "User Created",
    USER_UPDATED: "User Updated",
    USER_DELETED: "User Deleted",
    HOST_CREATED: "Host Created",
    HOST_UPDATED: "Host Updated",
    HOST_DELETED: "Host Deleted",
    APPOINTMENT_CREATED: "Appointment Created",
    APPOINTMENT_UPDATED: "Appointment Updated",
    APPOINTMENT_DELETED: "Appointment Deleted",
    APPOINTMENT_APPROVED: "Appointment Approved",
    APPOINTMENT_REJECTED: "Appointment Rejected",
};

const getActivityDescription = (activity: Activity) => {
    const { action, resource, office_name } = activity;

    switch (action) {
        case 'OFFICE_CREATED':
            return `created new office "${resource}"`;
        case 'OFFICE_UPDATED':
            return `updated office "${resource}"`;
        case 'OFFICE_DELETED':
            return `deleted office "${resource}"`;
        case 'USER_CREATED':
            return `created new user account for ${resource}`;
        case 'USER_UPDATED':
            return `updated user profile for ${resource}`;
        case 'USER_DELETED':
            return `deleted user account ${resource}`;
        case 'HOST_CREATED':
            return `created new host account for ${resource}`;
        case 'HOST_UPDATED':
            return `updated host profile for ${resource}`;
        case 'HOST_DELETED':
            return `deleted host account ${resource}`;
        case 'APPOINTMENT_CREATED':
            return office_name
                ? `created new appointment at ${office_name}`
                : `created new appointment`;
        case 'APPOINTMENT_UPDATED':
            return office_name
                ? `updated appointment at ${office_name}`
                : `updated appointment`;
        case 'APPOINTMENT_DELETED':
            return office_name
                ? `deleted appointment at ${office_name}`
                : `deleted appointment`;
        case 'APPOINTMENT_APPROVED':
            return office_name
                ? `approved appointment at ${office_name}`
                : `approved appointment`;
        case 'APPOINTMENT_REJECTED':
            return office_name
                ? `rejected appointment at ${office_name}`
                : `rejected appointment`;
        default:
            return `${action.toLowerCase()} ${resource}`;
    }
};

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
    const getUserInitials = (firstName: string, lastName: string) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    };

    const getTimeAgo = (timestamp: string) => {
        const now = new Date();
        const activityTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return format(activityTime, "MMM d");
    };

    return (
        <Card className="border-0 bg-linear-to-br from-white to-brand-primary/50 shadow-lg">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                        <div className="p-2 bg-purple-100 rounded-xl">
                            <Activity className="h-5 w-5 text-purple-600" />
                        </div>
                        Recent Activity
                    </CardTitle>
                    <Badge variant="outline" className="bg-white text-gray-600 border-gray-200">
                        {activities.length} activities
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="space-y-1">
                    {activities.length === 0 ? (
                        <div className="text-center py-12">
                            <Activity className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">No recent activity</p>
                            <p className="text-sm text-gray-400 mt-1">Activity will appear here</p>
                        </div>
                    ) : (
                        activities.map((activity, index) => {
                            const Icon = actionIcons[activity.action] || Activity;
                            const actionConfig = actionColors[activity.action] || "text-gray-600 bg-gray-50 border-gray-200";
                            const actionLabel = actionLabels[activity.action] || activity.action;
                            const activityDescription = getActivityDescription(activity);

                            return (
                                <div
                                    key={activity.id}
                                    className={`group relative flex items-start gap-4 p-4 transition-all duration-200 hover:bg-white/80 ${index !== activities.length - 1 ? 'border-b border-gray-100' : ''
                                        }`}
                                >
                                    {/* Timeline connector */}
                                    {index !== activities.length - 1 && (
                                        <div className="absolute left-7 top-12 w-0.5 h-8 bg-gray-200 z-0" />
                                    )}

                                    {/* Avatar with status indicator */}
                                    <div className="relative shrink-0">
                                        <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                                            <AvatarImage
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.user.email}`}
                                                alt={`${activity.user.first_name} ${activity.user.last_name}`}
                                            />
                                            <AvatarFallback className="bg-linear-to-br from-brand-primary/20 to-brand-primary text-white font-semibold text-sm">
                                                {getUserInitials(activity.user.first_name, activity.user.last_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-white ${actionConfig.split(' ')[1]}`}>
                                            <Icon className={`h-3 w-3 ${actionConfig.split(' ')[0]}`} />
                                        </div>
                                    </div>

                                    {/* Activity content */}
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-gray-900 text-sm">
                                                        {activity.user.first_name} {activity.user.last_name}
                                                    </p>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs font-medium ${actionConfig}`}
                                                    >
                                                        {actionLabel}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 leading-relaxed">
                                                    {activityDescription}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Timestamp */}
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock className="h-3 w-3" />
                                            <span>{getTimeAgo(activity.timestamp)}</span>
                                            <span>•</span>
                                            <span>{format(new Date(activity.timestamp), "h:mm a")}</span>
                                        </div>
                                    </div>

                                    {/* Hover action (optional) */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* View All Footer */}
                {activities.length > 0 && (
                    <div className="border-t border-gray-100 p-4">
                        <button className="w-full text-center text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">
                            View all activity
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
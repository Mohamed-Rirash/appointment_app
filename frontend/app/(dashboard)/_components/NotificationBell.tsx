'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificationStore } from '@/helpers/store/notificationStore';
import { useAppointmentEvents } from '@/helpers/hooks/events/useAppointmentEvents';



export function NotificationBell({ user }) {
    const router = useRouter();

    const officeId = user?.office_id;
    const token = user?.access_token

    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
    } = useNotificationStore();

    const [isOpen, setIsOpen] = useState(false);

    // Only hosts need appointment notifications
    const isHost = user?.roles?.includes('host') || user?.roles?.includes('secretary');



    // Enable real-time events
    useAppointmentEvents(officeId, token);



    // Don't show for non-hosts or if no office
    if (!isHost || !officeId) {
        return null;
    }


    const handleBellClick = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            // Mark as read when openingpopover
            markAllAsRead();
        }
    };

    const handleNotificationClick = (notificationId: string, appointmentId: string) => {
        markAsRead(notificationId);
        router.push(`/host/notifications?appointment=${appointmentId}`);
        setIsOpen(false);
    };
    console.log("nooooooote", notifications)
    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={`${unreadCount} new notifications`}
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Notifications</h3>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllAsRead}
                            >
                                Mark all read
                            </Button>
                        )}
                    </div>
                </div>
                <ScrollArea className="h-72">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No new notifications
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.slice(0, 10).map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif.id, notif.appointmentId)}
                                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${!notif.isRead ? 'bg-muted/30' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium">
                                                New appointment from {notif.citizenName}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {notif.serviceName} • {new Date(notif.appointmentDate).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-4 border-t">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                            router.push('/host/notifications');
                            setIsOpen(false);
                        }}
                    >
                        View All Notifications
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
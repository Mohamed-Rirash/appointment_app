'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  Calendar,
  RefreshCw,
  AlertCircle,
  Inbox,
  ChevronDown,
  ChevronUp,
  Bell,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/libs/utils';
import { useNotificationStore } from '@/helpers/store/notificationStore';
import { useAppointmentEvents } from '@/helpers/hooks/events/useAppointmentEvents';
import { client } from '@/helpers/api/client';
import toast from 'react-hot-toast';
import { RejectAppointmentDialog } from '../../_components/reject';
import { PostponeAppointmentDialog } from '../../_components/postponeAppointment';


// ==================== INTERFACES ====================

interface AppointmentResponse {
  total: number;
  limit: number;
  offset: number;
  appointments: Appointment[];
}

interface Appointment {
  appointment_active: boolean;
  appointment_date: string;
  appointment_id: string;
  canceled_at: string | null;
  canceled_by: string | null;
  canceled_reason: string | null;
  citizen_email: string;
  citizen_firstname: string;
  citizen_id: string;
  citizen_lastname: string;
  citizen_phone: string;
  created_at: string;
  decided_at: string | null;
  decided_by: string | null;
  decision_reason: string | null;
  host_email: string;
  host_first_name: string;
  host_id: string;
  host_last_name: string;
  issued_by: string;
  new_appointment_date: string | null;
  office_id: string;
  purpose: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "RESCHEDULED";
  time_slotted: string;
  updated_at: string;
}

interface TransformedAppointment {
  id: string;
  citizen: {
    name: string;
    email: string;
    phone: string;
  };
  time_slot: string;
  status: string;
  purpose: string;
  created_at: string;
  originalData: Appointment;
}

interface HostTodaysAppointmentsProps {
  office_id: string;
  token: string | undefined;
  variant?: 'dashboard' | 'notifications-page';
  limit?: number;
}


const baseURL = process.env.NEXT_PUBLIC_API_URL;


export function HostTodaysAppointments({
  office_id,
  token,
  variant = 'dashboard',
  limit = 100,
  user
}: HostTodaysAppointmentsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();


  // Notification store integration
  const {
    notifications,
    unreadCount,
    markAsRead,
    removeNotification,
    playNotificationSound
  } = useNotificationStore();

  const [showAll, setShowAll] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [postponeDialogOpen, setPostponeDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<{
    id: string;
    citizenName: string;
  } | null>(null);

  // Enable real-time events
  useAppointmentEvents(office_id, token);

  // Sound effect for new notifications (only on dashboard)
  useEffect(() => {
    if (variant === 'dashboard' && unreadCount > 0) {
      playNotificationSound();
    }
  }, [unreadCount, variant, playNotificationSound]);

  const selectedAppointmentId = searchParams.get('appointment');

  const {
    data: appointmentsData,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['pending-appointments', office_id],
    queryFn: async () => {
      const response = await client.getAppointmentQueue(token, office_id, limit, 0);
      return response as AppointmentResponse;
    },
    enabled: !!office_id && !!token,
    // No automatic refetching at all
  })

  // console.log("shit", appointmentsData)

  // Mark notification as read when viewing appointment
  useEffect(() => {
    if (selectedAppointmentId && variant === 'notifications-page') {
      markAsRead(`notif-${selectedAppointmentId}`);
      // Scroll to appointment
      setTimeout(() => {
        document.getElementById(`appointment-${selectedAppointmentId}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [selectedAppointmentId, markAsRead, variant]);

  const transformAppointments = (data: AppointmentResponse): TransformedAppointment[] => {
    if (!data?.appointments) return [];

    return data.appointments.map(appointment => ({
      id: appointment.appointment_id,
      citizen: {
        name: `${appointment.citizen_firstname} ${appointment.citizen_lastname}`,
        email: appointment.citizen_email,
        phone: appointment.citizen_phone || 'N/A',
      },
      time_slot: `${appointment.appointment_date.split('T')[0]}T${appointment.time_slotted}`,
      status: appointment.status.toLowerCase(),
      purpose: appointment.purpose,
      created_at: appointment.created_at,
      originalData: appointment,
    }));
  };

  const allAppointments = transformAppointments(appointmentsData || { total: 0, limit: 0, offset: 0, appointments: [] });
  // const pendingAppointments = allAppointments.filter(
  //   appt => appt.originalData.status === 'PENDING'
  // );

  const pendingAppointments = allAppointments

  const displayedAppointments = variant === 'notifications-page'
    ? pendingAppointments
    : (showAll ? pendingAppointments : pendingAppointments.slice(0, 5));
  console.log("ddddddddd", displayedAppointments)
  const approveAppointment = useMutation({
    mutationFn: async (appointmentId: string) => {
      const responce = await client.approveAppointment(token, appointmentId, office_id)
      return responce.data;
    },
    onSuccess: (_, appointmentId) => {
      queryClient.invalidateQueries({ queryKey: ['pending-appointments', office_id] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
      console.log("onSuc", appointmentId)
      removeNotification(`notif-${appointmentId}`);
      markAsRead(`notif-${appointmentId}`);
      toast.success('Appointment approved successfully', {
        icon: '✅',
      });
    },
    onError: (error: any) => {
      toast.error('Failed to approve appointment', {
        description: error.message,
      });
    },
  });

  const handleRejectClick = (appointmentId: string, citizenName: string) => {
    setSelectedAppointment({ id: appointmentId, citizenName });
    setRejectDialogOpen(true);
  };

  const handlePostponeClick = (appointmentId: string, citizenName: string) => {
    setSelectedAppointment({ id: appointmentId, citizenName });
    setPostponeDialogOpen(true);
  };

  // Handle reject/postpone success from dialogs
  const handleDecisionSuccess = (appointmentId: string, action: 'reject' | 'postpone') => {
    queryClient.invalidateQueries({ queryKey: ['pending-appointments', office_id] });
    removeNotification(`notif-${appointmentId}`);
    markAsRead(`notif-${appointmentId}`);

    const messages = {
      reject: 'Appointment rejected successfully',
      postpone: 'Appointment postponed successfully',
    };

    toast.success(messages[action]);
  };

  // ==================== RENDER LOGIC ====================

  // Empty state for dashboard widget
  if (variant === 'dashboard' && pendingAppointments.length === 0) {
    return (
      <Card className="w-full bg-white/80 backdrop-blur-sm border-gray-200">
        <CardHeader className="pb-5 px-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl">
              <Bell className="h-6 w-6 text-orange-700" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">
                No Pending Requests
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1.5">
                You're all caught up! New requests will appear here.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(variant === 'dashboard' ? 3 : 5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card className="w-full border-orange-200">
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connection Issue
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            We couldn't load appointments. Please check your connection.
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ==================== APPOINTMENT CARD COMPONENT ====================

  const AppointmentCard = ({ appointment }: { appointment: TransformedAppointment }) => {
    const time = format(parseISO(appointment.time_slot), 'h:mm a');
    const isProcessing = approveAppointment.isPending && approveAppointment.variables === appointment.id;

    return (
      <div
        id={`appointment-${appointment.id}`}
        className={cn(
          'bg-white border border-gray-200 rounded-xl p-5 transition-all',
          'hover:shadow-lg hover:border-blue-200 hover:translate-x-1 cursor-pointer',
          selectedAppointmentId === appointment.id && 'ring-2 ring-primary'
        )}
        onClick={() => {
          if (variant === 'notifications-page') {
            router.push(`/host/notifications?appointment=${appointment.id}`);
          }
        }}
      >
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 ring-2 ring-white shadow-md">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${appointment.citizen.email}`}
              alt={appointment.citizen.name}
            />
            <AvatarFallback className="bg-linear-to-br from-amber-400 to-orange-500 text-white font-semibold text-lg">
              {appointment.citizen.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-900 text-lg truncate">
                  {appointment.citizen.name}
                </h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {appointment.purpose}
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200 flex-shrink-0 ml-3"
              >
                <Clock className="w-3 h-3 mr-1" />
                {variant === 'notifications-page' ? 'Pending Decision' : 'Pending Review'}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{time}</span>
              </div>
              {appointment.citizen.phone && appointment.citizen.phone !== 'N/A' && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{appointment.citizen.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <User className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="truncate">{appointment.citizen.email}</span>
              </div>
            </div>

            {/* Only show action buttons on notifications page or if user clicks */}
            {variant === 'notifications-page' && (
              <div className="flex gap-2 flex-col sm:flex-row">
                <Button
                  size="sm"
                  className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    approveAppointment.mutate(appointment.id);
                  }}
                  disabled={isProcessing}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Confirming...' : 'Approve Request'}
                </Button>

                <div className="flex gap-2 flex-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePostponeClick(appointment.id, appointment.citizen.name);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Reschedule
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRejectClick(appointment.id, appointment.citizen.name);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================

  return (
    <>
      <Card className={cn(
        "w-full bg-white/80 backdrop-blur-sm border-gray-200",
        variant === 'notifications-page' && "border-0 shadow-none bg-transparent"
      )}>
        <CardHeader className={cn(
          "px-6",
          variant === 'notifications-page' ? "px-0 pb-4" : "pb-5"
        )}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl">
                <Bell className="h-6 w-6 text-orange-700" />
              </div>
              <div>
                <CardTitle className={cn(
                  "text-2xl font-bold text-gray-900 tracking-tight",
                  variant === 'notifications-page' && "text-3xl"
                )}>
                  {variant === 'notifications-page'
                    ? 'Appointment Decisions'
                    : 'Incoming Appointment Requests'}
                </CardTitle>
                <p className={cn(
                  "text-sm text-gray-500 mt-1.5",
                  variant === 'notifications-page' && "text-base"
                )}>
                  {variant === 'notifications-page'
                    ? 'Review and manage pending appointment requests'
                    : 'Review and manage incoming visitor requests'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                {pendingAppointments.length} pending
              </Badge>

              {variant === 'dashboard' && pendingAppointments.length > 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="h-9 px-3 hover:bg-gray-100 transition-colors"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Show All ({pendingAppointments.length})
                    </>
                  )}
                </Button>
              )}

              {variant === 'notifications-page' && unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    pendingAppointments.forEach(appt => {
                      markAsRead(`notif-${appt.id}`);
                    });
                    toast.success('All notifications marked as read');
                  }}
                >
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className={cn(
          "px-6 pb-6",
          variant === 'notifications-page' && "px-0"
        )}>
          {pendingAppointments.length === 0 ? (
            <div className={cn(
              "text-center py-16",
              variant === 'notifications-page' && "py-24"
            )}>
              <div className={cn(
                "mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4",
                variant === 'dashboard' ? "w-16 h-16" : "w-20 h-20"
              )}>
                <Inbox className={cn(
                  "text-gray-400",
                  variant === 'dashboard' ? "h-8 w-8" : "h-10 w-10"
                )} />
              </div>
              <h3 className={cn(
                "font-semibold text-gray-900 mb-2",
                variant === 'dashboard' ? "text-lg" : "text-xl"
              )}>
                No Pending Requests
              </h3>
              <p className={cn(
                "text-sm text-gray-500 mx-auto",
                variant === 'dashboard' ? "max-w-md" : "max-w-lg"
              )}>
                {variant === 'dashboard'
                  ? "Great! You've reviewed all pending appointments. New requests will appear here automatically."
                  : "All appointment requests have been processed. New requests will appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs - only render when there's a selected appointment */}
      {selectedAppointment && (
        <>
          <RejectAppointmentDialog
            open={rejectDialogOpen}
            onOpenChange={setRejectDialogOpen}
            appointmentId={selectedAppointment.id}
            office_id={office_id}
            token={token}
            citizenName={selectedAppointment.citizenName}
            onSuccess={() => handleDecisionSuccess(selectedAppointment.id, 'reject')}
          />
          <PostponeAppointmentDialog
            open={postponeDialogOpen}
            onOpenChange={setPostponeDialogOpen}
            appointmentId={selectedAppointment.id}
            token={token}
            citizenName={selectedAppointment.citizenName}
            office_id={office_id}
            onSuccess={() => handleDecisionSuccess(selectedAppointment.id, 'postpone')}
          />
        </>
      )}
    </>
  );
}
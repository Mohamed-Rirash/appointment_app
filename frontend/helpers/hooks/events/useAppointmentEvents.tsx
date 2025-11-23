"use client"
import { useEffect, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNotificationStore } from '@/helpers/store/notificationStore';

// Backend event interface
interface NewAppointmentEvent {
  event: 'new_appointment';
  data: {
    appointment: {
      id: string;
      status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'RESCHEDULED';
      appointment_date: string; // ISO date
      time_slotted: string; // "HH:MM:SS"
      purpose: string;
      created_at: string;
      office_id: string;
    };
    citizen: {
      firstname: string;
      lastname: string;
      email: string;
      phone?: string;
    };
  };
}

export const useAppointmentEvents = (officeId: string, token: string | undefined) => {

  const addNotification = useNotificationStore((state) => state.addNotification);
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!token || !officeId) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    const url = `${process.env.NEXT_PUBLIC_API_URL}/appointments/events?office_id=${encodeURIComponent(officeId)}`;
    // Connect to backend SSE endpoint
    const eventSource = new EventSource(url);

    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as NewAppointmentEvent;
        // console.log('📨 New appointment event received:', message);

        // Check if it's a new appointment event
        if (message.event === 'new_appointment') {
          const { appointment, citizen } = message.data;

          // Only handle PENDING appointments that need host decision
          if (appointment.status === 'PENDING') {
            // Combine date and time into ISO datetime
            const appointmentDateTime = `${appointment.appointment_date.split('T')[0]}T${appointment.time_slotted}`;

            addNotification({
              id: `notif-${appointment.id}`,
              appointmentId: appointment.id,
              citizenName: `${citizen.firstname} ${citizen.lastname}`,
              serviceName: appointment.purpose || 'Appointment Request',
              appointmentDate: appointmentDateTime,
              status: 'pending_approval',
              createdAt: appointment.created_at,
              isRead: false,
            });
            // console.log('➕ Adding notification ID:', `notif-${appointment.id}`);
            // Show toast notification for immediate feedback
            // toast.success('New appointment request',  `${citizen.firstname} ${citizen.lastname} - ${appointment.purpose}`,
            //  { icon: '📅',}
            // );
            toast.success("new appointment request")

            // Invalidate relevant queries to refresh UI
            queryClient.invalidateQueries({
              queryKey: ['pending-appointments', officeId]
            });
            queryClient.invalidateQueries({
              queryKey: ['appointments', officeId]
            });
          }
        }
      } catch (error) {
        console.error('Failed to parse event data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      eventSource.close();

      // Fallback to polling every 30 seconds
      toast.error('Live updates disconnected, using polling fallback');

      const interval = setInterval(() => {
        queryClient.invalidateQueries({
          queryKey: ['pending-appointments', officeId]
        });
      }, 30000);

      // Cleanup interval on component unmount
      return () => clearInterval(interval);
    };

    return () => {
      eventSource.close();
    };
  }, [token, officeId, addNotification, queryClient]);
};
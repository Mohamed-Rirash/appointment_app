// hooks/useAppointmentEvents.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// TypeScript Interfaces
interface Citizen {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  phone?: string;
}

interface Appointment {
  id: string;
  office_id: string;
  appointment_date: string;
  time_slotted: string;
  status: string;
  citizen_id: string;
  purpose?: string;
}

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

interface SSEEvent {
  event: string;
  data: any;
}

interface UseAppointmentEventsReturn {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  eventCount: number;
  appointments: Appointment[];
  timeSlots: Record<string, TimeSlot[]>;
  lastUpdate: Date | null;
  reconnect: () => void;
  requestNotificationPermission: () => Promise<NotificationPermission>;
}

export const useAppointmentEvents = (officeId: string): UseAppointmentEventsReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [timeSlots, setTimeSlots] = useState<Record<string, TimeSlot[]>>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const maxRetriesRef = useRef(5);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const disconnect = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!officeId) {
      setIsLoading(false);
      return;
    }

    // Cleanup existing connection
    disconnect();

    const url = `${process.env.NEXT_PUBLIC_API_URL}/appointments/events?office_id=${encodeURIComponent(officeId)}`;
    console.log('🔗 Connecting to SSE:', url);
    
    eventSourceRef.current = new EventSource(url);

    eventSourceRef.current.onopen = () => {
      console.log('✅ Connected to real-time updates');
      setIsConnected(true);
      setIsLoading(false);
      setError(null);
      retryCountRef.current = 0;
    };

    eventSourceRef.current.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);
        console.log('📨 Update received:', data);
        setLastUpdate(new Date());
        setEventCount(prev => prev + 1);

        // Reset retry count on successful message
        retryCountRef.current = 0;

        // Handle different event types
        switch (data.event) {
          case 'new_appointment':
            if (data.data?.appointment) {
              setAppointments(prev => [...prev, data.data.appointment]);
              console.log('📅 New appointment added to state');
            }
            break;

          case 'time_slots_updated':
            if (data.data?.date && data.data?.slots) {
              setTimeSlots(prev => ({
                ...prev,
                [data.data.date]: data.data.slots
              }));
              console.log('🕒 Time slots updated');
            }
            break;

          case 'heartbeat':
            console.log('❤️ Heartbeat received');
            break;

          default:
            console.log('🤔 Unknown event type:', data.event);
        }
      } catch (err) {
        console.error('❌ Failed to parse event data:', err);
      }
    };

    eventSourceRef.current.onerror = (event) => {
      console.error('❌ EventSource error:', event);
      setIsConnected(false);
      setError('Connection error - retrying...');

      // Retry logic with exponential backoff
      if (retryCountRef.current < maxRetriesRef.current) {
        const delay = 2000 * Math.pow(2, retryCountRef.current);
        console.log(`🔄 Retrying in ${delay}ms... (${retryCountRef.current + 1}/${maxRetriesRef.current})`);
        
        retryTimeoutRef.current = setTimeout(() => {
          retryCountRef.current += 1;
          connect();
        }, delay);
      } else {
        setIsLoading(false);
        setError('Failed to maintain connection after multiple attempts');
        console.error('🚫 Max retries reached. Giving up.');
      }
    };

  }, [officeId, disconnect]);

  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnect requested');
    retryCountRef.current = 0;
    setError(null);
    setIsLoading(true);
    connect();
  }, [connect]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Auto-reconnect when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected) {
        console.log('📱 Page visible - attempting reconnect');
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, reconnect]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('🔔 Notification permission:', permission);
      return permission;
    }
    return Notification.permission;
  }, []);

  return {
    isConnected,
    isLoading,
    error,
    eventCount,
    appointments,
    timeSlots,
    lastUpdate,
    reconnect,
    requestNotificationPermission,
  };
};
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Appointment {
  id: string;
  office_id: string;
  appointment_date: string;
  time_slotted: string;
  status: string;
  citizen_id: string;
  purpose?: string;
}

interface UseAppointmentEventsReturn {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  appointments: Appointment[];
  reconnect: () => void;
}

export const useAppointmentEvents = (officeId: string): UseAppointmentEventsReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
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
        const data = JSON.parse(event.data);
        console.log('📨 Update received:', data);

        if (data.event === 'new_appointment' && data.data?.appointment) {
          const newAppointment = data.data.appointment;
          setAppointments(prev => [newAppointment, ...prev].slice(0, 50)); // Keep last 50
          retryCountRef.current = 0;

          // Play sound and show notification
          playNotificationSound();
          showBrowserNotification(newAppointment);
        }
      } catch (err) {
        console.error('❌ Failed to parse event data:', err);
      }
    };

    eventSourceRef.current.onerror = (event) => {
      console.error('❌ EventSource error:', event);
      setIsConnected(false);
      setError('Connection error - retrying...');

      if (retryCountRef.current < maxRetriesRef.current) {
        const delay = 2000 * Math.pow(2, retryCountRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          retryCountRef.current += 1;
          connect();
        }, delay);
      } else {
        setIsLoading(false);
        setError('Failed to maintain connection after multiple attempts');
      }
    };

  }, [officeId, disconnect]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Audio play failed:', err));
    } catch (err) {
      console.log('Audio creation failed:', err);
    }
  };

  const showBrowserNotification = (appointment: Appointment) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Appointment', {
        body: `📝 ${appointment.purpose || 'New booking'} \n📅 ${appointment.appointment_date}`,
        icon: '/favicon.ico',
        tag: 'appointment-' + appointment.id
      });
    }
  };

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected) {
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected]);

  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    setError(null);
    setIsLoading(true);
    connect();
  }, [connect]);

  return {
    isConnected,
    isLoading,
    error,
    appointments,
    reconnect,
  };
};
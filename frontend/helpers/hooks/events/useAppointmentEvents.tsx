"use client"

import { useEffect, useState } from 'react';

export const useAppointmentEvents = (officeId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!officeId) {
      setIsLoading(false);
      return;
    }

    const url = `${process.env.NEXT_PUBLIC_API_URL}/appointments/events?office_id=${encodeURIComponent(officeId)}`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.log('✅ Connected to real-time updates');
      setIsConnected(true);
      setIsLoading(false);
    };

    eventSource.onmessage = (e) => {
      console.log('📨 Update received:shit', e.data);
      // You can add toast notifications here if needed
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setIsLoading(false);
      console.log("shit this errro")
    };

    return () => {
      eventSource.close();
    };
  }, [officeId]);

  return { 
    isConnected, 
    isLoading 
  };
};
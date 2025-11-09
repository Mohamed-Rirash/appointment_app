// hooks/useAppointmentEvents.tsx - Updated version
"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export const useAppointmentEvents = (officeId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_RETRIES = 5;
  const BASE_DELAY = 2000; // 2 seconds

  const connect = useCallback(() => {
    if (!officeId) {
      setIsLoading(false);
      return;
    }

    // Clear any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    console.log('🔗 Connecting to SSE... Attempt:', retryCount + 1);
    
    const url = `${process.env.NEXT_PUBLIC_API_URL}/appointments/events?office_id=${encodeURIComponent(officeId)}`;
    eventSourceRef.current = new EventSource(url);

    eventSourceRef.current.onopen = () => {
      console.log('✅ Connected to real-time updates');
      setIsConnected(true);
      setIsLoading(false);
      setError(null);
      setRetryCount(0); // Reset on successful connection
    };

    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Update received:', data);
        // Reset retry count on successful message
        setRetryCount(0);
      } catch (err) {
        console.error('❌ Failed to parse event data:', err);
      }
    };

    eventSourceRef.current.onerror = (event) => {
      console.error('❌ EventSource error - Connection lost');
      setIsConnected(false);
      setError('Connection lost - retrying...');
      
      // Implement exponential backoff retry
      if (retryCount < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retryCount); // Exponential backoff
        console.log(`🔄 Retrying in ${delay}ms... (${retryCount + 1}/${MAX_RETRIES})`);
        
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          connect();
        }, delay);
      } else {
        setIsLoading(false);
        setError('Failed to establish connection after multiple attempts');
      }
    };

  }, [officeId, retryCount]);

  const disconnect = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setRetryCount(0);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setRetryCount(0);
    connect();
  }, [connect, disconnect]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Auto-reconnect when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected) {
        console.log('📱 Page visible - attempting reconnect');
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected, reconnect]);

  return {
    isConnected,
    isLoading: isLoading && retryCount === 0, // Don't show loading during retries
    error: retryCount >= MAX_RETRIES ? error : null, // Only show final error
    retryCount,
    maxRetries: MAX_RETRIES,
    reconnect,
    disconnect
  };
};
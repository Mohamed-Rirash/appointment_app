// components/NotificationClient.tsx
"use client";

import { useAppointmentEvents } from "@/helpers/hooks/events/useAppointmentEvents";


interface NotificationClientProps {
  office_id: string;
  showDetails?: boolean;
}

export default function NotificationClient({ office_id, showDetails = false }: NotificationClientProps) {
  const { 
    isConnected, 
    isLoading, 
    error,
    eventCount,
    reconnect,
    lastUpdate
  } = useAppointmentEvents(office_id);

  if (isLoading) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <div>
            <p className="font-medium text-gray-900">Connecting to real-time updates</p>
            <p className="text-sm text-gray-500">Office: {office_id}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm space-y-3">
      {/* Connection Status */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Real-time Updates</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>{isConnected ? '✅ Live' : '🔴 Offline'}</span>
              </>
            ) : (
              <span>🔴 Disconnected</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{eventCount}</p>
          <p className="text-sm text-blue-800">Total Events</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">{lastUpdate ? 'Live' : 'Never'}</p>
          <p className="text-sm text-purple-800">Last Update</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center justify-between">
            <p className="text-red-800 font-medium">{error}</p>
            <button 
              onClick={reconnect}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {showDetails && lastUpdate && (
        <p className="text-xs text-gray-500">
          Last update: {lastUpdate.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
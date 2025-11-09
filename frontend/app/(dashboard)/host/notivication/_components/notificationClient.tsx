// components/NotificationClient.tsx - Updated
"use client";

import { useAppointmentEvents } from "@/helpers/hooks/events/useAppointmentEvents";


export default function NotificationClient({ office_id }: { office_id: string }) {
  const { 
    isConnected, 
    isLoading, 
    error,
    retryCount,
    maxRetries,
    reconnect
  } = useAppointmentEvents(office_id);

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg bg-blue-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-700">Connecting to real-time updates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      {/* Connection Status */}
      <div className={`p-3 rounded mb-3 ${
        isConnected 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Live Connected</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Reconnecting...</span>
              </>
            )}
          </div>
          {!isConnected && (
            <span className="text-sm">
              {retryCount}/{maxRetries}
            </span>
          )}
        </div>
        
        {!isConnected && retryCount > 0 && (
          <p className="text-sm mt-1 text-yellow-700">
            Attempting to reconnect... ({retryCount}/{maxRetries})
          </p>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded border border-red-200 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Connection Issue</p>
              <p className="text-sm">{error}</p>
            </div>
            <button 
              onClick={reconnect}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500">
        {isConnected 
          ? "Receiving real-time appointment updates"
          : "Connection interrupted - attempting to reconnect automatically"
        }
      </div>
    </div>
  );
}
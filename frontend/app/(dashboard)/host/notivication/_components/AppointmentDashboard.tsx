"use client";


import { useAppointmentEvents } from "@/helpers/hooks/events/useAppointmentEvents";
import { useEffect } from "react";

interface AppointmentDashboardProps {
  officeId: string;
}

export function AppointmentDashboard({ officeId }: AppointmentDashboardProps) {
  const {
    isConnected,
    isLoading,
    error,
    appointments,
    reconnect,
  } = useAppointmentEvents(officeId);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900">Connecting...</h2>
        </div>
      </div>
    );
  }

  if (error && !isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm max-w-md">
          <div className="text-4xl mb-4">🔌</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Connection Lost</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={reconnect}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Appointment Notifications</h1>
          <p className="text-gray-600 mt-1">Office ID: {officeId}</p>
          
          <div className={`inline-flex items-center space-x-2 mt-4 px-3 py-1.5 rounded-full text-sm font-medium ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span>{isConnected ? '🟢 Live' : '🔴 Disconnected'}</span>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              Recent Appointments {appointments.length > 0 && `(${appointments.length})`}
            </h2>
          </div>
          <div className="p-6">
            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">NEW</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        appointment.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900 text-lg">
                        {appointment.appointment_date ? 
                          new Date(appointment.appointment_date).toLocaleDateString() : 
                          'No date'
                        }
                      </p>
                      <p className="text-gray-700">
                        ⏰ {appointment.time_slotted || 'No time'}
                      </p>
                      {appointment.purpose && (
                        <p className="text-gray-600">📝 {appointment.purpose}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📭</div>
                <p className="font-medium text-gray-900">No new appointments</p>
                <p className="text-sm text-gray-500">Waiting for real-time updates...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
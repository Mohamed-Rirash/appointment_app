// components/AppointmentDashboard.tsx
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
    appointments = [], // Add default values
    timeSlots = {},    // Add default values  
    eventCount = 0,    // Add default values
    lastUpdate,
    requestNotificationPermission // This might not exist in your hook
  } = useAppointmentEvents(officeId);

  // Safe check for requestNotificationPermission
  useEffect(() => {
    if (requestNotificationPermission) {
      requestNotificationPermission();
    } else {
      // Fallback: request permission directly
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading real-time dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Appointment Dashboard</h1>
          <p className="text-gray-600">Office ID: {officeId}</p>
          
          <div className="flex items-center space-x-4 mt-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isConnected ? '🟢 Live Connected' : '🔴 Disconnected'}
            </div>
            <div className="text-sm text-gray-500">
              Events: {eventCount} • Last update: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-red-800 font-medium">Connection Issue</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{eventCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">📅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🕒</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Updated Dates</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(timeSlots).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Appointments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Appointments</h2>
            </div>
            <div className="p-6">
              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.slice(-10).reverse().map((appointment, index) => (
                    <div key={appointment.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString() : 'No date'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {appointment.time_slotted} • {appointment.status || 'Unknown'}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        New
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl">📭</span>
                  <p className="mt-2 text-gray-500">No appointments yet</p>
                  <p className="text-sm text-gray-400">New appointments will appear here in real-time</p>
                </div>
              )}
            </div>
          </div>

          {/* Time Slots Updates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Time Slot Updates</h2>
            </div>
            <div className="p-6">
              {Object.keys(timeSlots).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(timeSlots).slice(-5).reverse().map(([date, slots]) => (
                    <div key={date} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">
                        {new Date(date).toLocaleDateString()}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {/* Safe access to slots array */}
                        {(Array.isArray(slots) ? slots.slice(0, 5) : []).map((slot, index) => (
                          <span 
                            key={slot?.id || index}
                            className={`px-2 py-1 text-xs rounded ${
                              slot?.is_booked 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {slot?.start_time || 'Unknown'} {slot?.is_booked ? '🔴' : '🟢'}
                          </span>
                        ))}
                        {Array.isArray(slots) && slots.length > 5 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            +{slots.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl">🕒</span>
                  <p className="mt-2 text-gray-500">No time slot updates</p>
                  <p className="text-sm text-gray-400">Time slot changes will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
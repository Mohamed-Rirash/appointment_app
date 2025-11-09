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
    appointments = [],           // Default value
    timeSlots = {},              // Default value  
    eventCount = 0,              // Default value
    lastUpdate,
    reconnect,
    requestNotificationPermission
  } = useAppointmentEvents(officeId);

  // Request notification permission on mount
  useEffect(() => {
    if (requestNotificationPermission) {
      requestNotificationPermission();
    }
  }, [requestNotificationPermission]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Connecting to real-time updates...</p>
        </div>
      </div>
    );
  }

  if (error && !isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm max-w-md">
          <div className="text-4xl mb-4">🔌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Lost</h2>
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Appointment Dashboard</h1>
          <p className="text-gray-600 mb-4">Office ID: {officeId}</p>
          
          <div className="flex items-center space-x-6">
            <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span>{isConnected ? '🟢 Live Connected' : '🔴 Disconnected'}</span>
            </div>
            
            <div className="text-sm text-gray-500 space-x-4">
              <span>📊 Events: {eventCount}</span>
              <span>🕒 Last: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard icon="📅" label="New Appointments" value={appointments.length} color="blue" />
          <StatCard icon="🕒" label="Updated Dates" value={Object.keys(timeSlots).length} color="purple" />
          <StatCard icon="📊" label="Total Events" value={eventCount} color="green" />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Appointments */}
          <DataCard title="Recent Appointments">
            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.slice(-10).reverse().map((appointment) => (
                  <div key={appointment.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {appointment.appointment_date ? 
                            new Date(appointment.appointment_date).toLocaleDateString() : 
                            'No date'
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          ⏰ {appointment.time_slotted || 'No time'} • 
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            appointment.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {appointment.status || 'Unknown'}
                          </span>
                        </p>
                        {appointment.purpose && (
                          <p className="text-sm text-gray-500 mt-1">📝 {appointment.purpose}</p>
                        )}
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">New</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="📭" title="No appointments yet" description="New appointments will appear here in real-time" />
            )}
          </DataCard>

          {/* Time Slots Updates */}
          <DataCard title="Time Slot Updates">
            {Object.keys(timeSlots).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(timeSlots).slice(-5).reverse().map(([date, slots]) => (
                  <div key={date} className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">
                      {new Date(date).toLocaleDateString()}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(slots) ? slots.slice(0, 8) : []).map((slot) => (
                        <span 
                          key={slot.id}
                          className={`text-xs px-2 py-1 rounded ${
                            slot.is_booked 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {slot.start_time} {slot.is_booked ? '🔴' : '🟢'}
                        </span>
                      ))}
                      {Array.isArray(slots) && slots.length > 8 && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          +{slots.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="🕒" title="No time slot updates" description="Time slot changes will appear here" />
            )}
          </DataCard>
        </div>
      </div>
    </div>
  );
}

// Helper Components

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  color: 'blue' | 'purple' | 'green';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    green: 'bg-green-50 text-green-600 border-green-200',
  }[color];

  return (
    <div className={`p-6 rounded-lg shadow-sm border ${colorClasses}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0 text-2xl">{icon}</div>
        <div className="ml-4">
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface DataCardProps {
  title: string;
  children: React.ReactNode;
}

function DataCard({ title, children }: DataCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="font-medium text-gray-900 mb-1">{title}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
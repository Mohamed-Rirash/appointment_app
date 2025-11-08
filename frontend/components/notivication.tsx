// pages/appointments.tsx
import { useAppointmentEvents } from '@/helpers/hooks/events/useAppointmentEvents';
import { useState } from 'react';

const AppointmentsPage = () => {
  const officeId = '123'; // Replace with dynamic value (e.g., from router or context)
  const { events, error } = useAppointmentEvents(officeId);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Show browser notification (optional)
  const showBrowserNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && window.Notification) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            new Notification(title, { body });
          }
        });
      }
    }
  };

  // Watch for new 'appointment_created' events
  const latestEvent = events[0];
  if (
    latestEvent &&
    latestEvent.type === 'appointment_created' &&
    !notifications.includes(latestEvent)
  ) {
    const data = latestEvent.data;
    const message = `New appointment: ${data.patient_name || 'Unknown patient'}`;
    console.log('🔔 New appointment!', data);

    // Push to local notifications list
    setNotifications((prev) => [...prev, latestEvent]);

    // Optional: browser notification
    showBrowserNotification('🆕 New Appointment', message);
  }

  if (isLoading) return <p>Connecting to live updates...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h1>Live Appointments Dashboard</h1>
      <div style={{ marginTop: '20px' }}>
        <h2>Recent Events ({events.length})</h2>
        <ul>
          {events.map((event, i) => (
            <li key={i}>
              <strong>{event.type}:</strong> {JSON.stringify(event.data)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AppointmentsPage;
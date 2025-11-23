import { Metadata } from 'next';
import { HostTodaysAppointments } from './_components/AppointmentDashboard';
import { getSession } from '@/helpers/actions/getsession';

export const metadata: Metadata = {
  title: 'Appointment Decisions',
  description: 'Review and manage pending appointment requests',
};

export default async function NotificationsPage() {
  const session = await getSession()
  const user = session?.user
  return (
    <div className="container mx-auto py-8 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Appointment Decisions
        </h1>
        <p className="text-muted-foreground mt-2">
          Review pending appointments and take action
        </p>
      </div>
      <HostTodaysAppointments
        office_id={session.user.office_id}
        token={user.access_token}
        variant="notifications-page"
        limit={50}
        user={user}
      />
    </div>
  );
}
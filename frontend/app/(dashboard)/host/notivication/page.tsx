import { getSession } from '@/helpers/actions/getsession';
import { AppointmentDashboard } from './_components/AppointmentDashboard';

export default async function NotificationPage() {
  const session = await getSession();
  const officeId = session?.user.office_id;

  if (!officeId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-lg font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">Please log in with an office account</p>
        </div>
      </div>
    );
  }

  return <AppointmentDashboard officeId={officeId} />;
}
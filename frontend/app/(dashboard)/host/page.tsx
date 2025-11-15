import { redirect } from "next/navigation";
import { getSession } from "@/helpers/actions/getsession";
import { QuickStats } from "./_components/quick-stats";
import { HostTodaysAppointments } from "./_components/appointmentsoverview";
export const metadata = {
  title: "My Schedule - KulanDesk Host",
  description: "Today's appointments and availability",
};

export default async function HostDashboard() {
  const session = await getSession()
  const token = session?.user.access_token
  const office_id = session?.user.office_id
  if (!token) {
    redirect("/Signin");
  }
  let limit = 20
  let offset = 0

  // Fetch today's appointments for this host
  const res = await fetch(
    `${process.env.API_URL}/views/${office_id}/appointments?status=PENDING&limit=${limit}&offset=${offset}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  )
  if (!res.ok) {
    redirect("/unauthorized");
  }
  const appointments = await res.json()

  const stats = {
    total_today: 150,
    pending: 23,
    completed: 127,
    approval_rate: 84.7
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Appointment Management</h1>
        <p className="text-brand-gray">
          Review and process appointment requests for <span className="text-brand font-bold">{today}</span>
        </p>
      </div>

      <QuickStats
        totalToday={stats.total_today}
        pending={stats.pending}
        completed={stats.completed}
        approvalRate={stats.approval_rate}
      />

      <HostTodaysAppointments
        initialAppointments={appointments}
        office_id={office_id}
        token={token}
      />
    </div>
  );
}
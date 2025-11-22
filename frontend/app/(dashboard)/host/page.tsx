import { redirect } from "next/navigation";
import { getSession } from "@/helpers/actions/getsession";
import { QuickStats } from "./_components/quick-stats";
import { CalendarView } from "./_components/calendar-view";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  Mail,
  Clock,
  UserCheck,
  Building2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Appointment } from "@/helpers/api/client";
import { Signout } from "@/helpers/actions/signout";

export const metadata = {
  title: "Host Dashboard - KulanDesk",
  description: "Manage your appointments and view your daily schedule",
};


export default async function HostDashboard() {
  const session = await getSession();

  if (!session?.user?.access_token) {
    redirect("/Signin");
  }

  const token = session.user.access_token;
  const office_id = session.user.office_id;
  const user = session?.user

  if (!office_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-6">
        <Card className="w-full max-w-4xl border-0 bg-white shadow-xl">
          <CardContent className="p-8">
            {/* Header Section */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Building2 className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Office Assignment Required
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Welcome, <span className="font-semibold text-brand">{user.first_name}</span>!
                You need to be assigned to an office before you can access the host dashboard.
              </p>
            </div>

            {/* User Info Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-blue-200 mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <UserCheck className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Your Role</p>
                      <p className="text-lg font-semibold text-blue-700 capitalize">{user.roles?.[0] || 'Host'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-900">Account Status</p>
                      <p className="text-lg font-semibold text-purple-700">Active</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <AlertCircle className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-900">Office Status</p>
                      <p className="text-lg font-semibold text-amber-700">Pending Assignment</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What's Next Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Steps to Resolution */}
              <Card className="border-0 bg-white shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-brand" />
                    Next Steps to Get Started
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-3 bg-blue-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm font-bold">1</span>
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">Contact Administrator</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Reach out to your system administrator or office manager
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-3 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm font-bold">2</span>
                      </div>
                      <div>
                        <p className="font-medium text-green-900">Request Office Assignment</p>
                        <p className="text-sm text-green-700 mt-1">
                          Ask to be assigned to your designated office location
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-3 bg-purple-50 rounded-lg">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm font-bold">3</span>
                      </div>
                      <div>
                        <p className="font-medium text-purple-900">Refresh Dashboard</p>
                        <p className="text-sm text-purple-700 mt-1">
                          Return here after your assignment is complete
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Support */}
              <Card className="border-0 bg-linear-to-br from-gray-50 to-gray-100/50 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-gray-600" />
                    Need Help?
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">Contact Support</p>
                      <p className="text-sm text-gray-600 mb-3">
                        Our support team is ready to help you get set up quickly.
                      </p>
                      <a
                        href="mailto:support@kulandesk.com"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        <Mail className="h-4 w-4" />
                        support@kulandesk.com
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Additional Info */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                Once assigned to an office, you'll be able to:
                <span className="text-gray-700 font-medium"> manage appointments • view your schedule • track visitor analytics</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const limit = 50;
  const offset = 0;

  // Fetch today's pending appointments
  let appointments = null;
  let error = null;

  try {
    const res = await fetch(
      `${process.env.API_URL}/views/${office_id}/appointments?status=PENDING&limit=${limit}&offset=${offset}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      if (res.status === 401) {
        Signout()
      }

    }

    appointments = await res.json();
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
    console.error("Dashboard fetch error:", err);
  }
  console.log("deteeeeee", appointments)

  const today = new Date();
  const formattedDate = format(today, "EEEE, MMMM d, yyyy");

  return (
    <div className="min-h-screen bg-brand-primary/20 p-6">
      {/* Header Section */}
      <div className="mb-8 space-y-4">
        <Card className="border-0 bg-linear-to-r from-white to-brand-primary/50 shadow-gren">
          <CardContent>
            <div className="flex items-start justify-between flex-wrap gap-4 ">
              <div>
                <h1 className="text-4xl font-bold">Dashboard</h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className="bg-white shadow-gren text-brand-gray p-2 ">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    {formattedDate}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-green-50 text-green-700 hover:bg-green-100 transition-colors cursor-pointer"
                  >
                    <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                    Live Updates
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Quick Actions Bar */}
        {/* <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 font-medium">Quick Actions:</span>
          <Button variant="ghost" size="sm" className="h-8 text-brand hover:bg-blue-50">
            <Users className="h-3.5 w-3.5 mr-2" />
            View All Visitors
          </Button>
          <Link href={"/host/availabletime"}>
            <Button variant="ghost" size="sm" className="h-8 text-brand hover:bg-blue-50">
              <Calendar className="h-3.5 w-3.5 mr-2" />
              Manage Availability
            </Button></Link>
        </div> */}
      </div>

      {/* Stats Section */}
      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      }>
        <div className="my-6">
          <QuickStats
            totalToday={appointments?.total || 0}
            pending={appointments?.appointments?.filter((a: Appointment) =>
              a.status === "PENDING"
            ).length || 0}
            completed={appointments?.appointments?.filter((a: Appointment) =>
              a.status === "COMPLETED"
            ).length || 0}
          />
        </div>
      </Suspense>

      {/* Appointments Queue Section */}
      {/* <section className="mb-8">
        {error ? (
          <Card className="w-full border-orange-200">
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Issue</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                We couldn't load your appointment queue. {error}
              </p>
            </CardContent>
          </Card>
        ) : (
          <HostTodaysAppointments
            office_id={office_id}
            token={token}
          />

        )}
      </section> */}

      {/* Calendar Section */}
      <section className="my-4">
        <CalendarView office_id={office_id} token={token} />
      </section>
    </div>
  );
}

// Date formatting utility
function format(date: Date, formatStr: string): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const hours = date.getHours();
  const minutes = date.getMinutes();

  switch (formatStr) {
    case "EEEE, MMMM d, yyyy":
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    case "h:mm a":
      return `${hours % 12 || 12}:${pad(minutes)} ${hours >= 12 ? 'PM' : 'AM'}`;
    case "h:mm:ss a":
      const seconds = date.getSeconds();
      return `${hours % 12 || 12}:${pad(minutes)}:${pad(seconds)} ${hours >= 12 ? 'PM' : 'AM'}`;
    default:
      return date.toLocaleDateString();
  }
}
import { redirect } from "next/navigation";
import { getSession } from "@/helpers/actions/getsession";
import { QuickStats } from "./_components/quick-stats";
import { HostTodaysAppointments } from "./_components/appointmentsoverview";
import { CalendarView } from "./_components/calendar-view";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Host Dashboard - KulanDesk",
  description: "Manage your appointments and view your daily schedule",
};

// Loading skeleton for the entire dashboard
function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-6">
      <div className="space-y-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}

export default async function HostDashboard() {
  const session = await getSession();

  if (!session?.user?.access_token) {
    redirect("/Signin");
  }

  const token = session.user.access_token;
  const office_id = session.user.office_id;

  if (!office_id) {
    redirect("/unauthorized");
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
        cache: "no-store",
        next: { revalidate: 60 }, // Revalidate every minute
      }
    );

    if (!res.ok) {
      if (res.status === 401) {
        redirect("/unauthorized");
      }
      throw new Error(`Failed to fetch: ${res.status}`);
    }

    appointments = await res.json();
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
    console.error("Dashboard fetch error:", err);
  }

  const today = new Date();
  const formattedDate = format(today, "EEEE, MMMM d, yyyy");

  return (
    <div className="min-h-screen bg-brand-primary/20 p-6">
      {/* Header Section */}
      <div className="mb-8 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-brand-black text-3xl font-bold max-w-md">
              Welcome back! Here's what's happening{" "}
              <span className="text-brand font-medium">today</span>
            </p>
            <div className="flex items-center gap-3 mt-5">
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

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 hover:bg-gray-100 transition-colors"
            // onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 font-medium">Quick Actions:</span>
          <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:bg-blue-50">
            <Users className="h-3.5 w-3.5 mr-2" />
            View All Visitors
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:bg-blue-50">
            <Calendar className="h-3.5 w-3.5 mr-2" />
            Manage Availability
          </Button>
        </div>
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
            approvalRate={84.7} // This would ideally come from an API
          />
        </div>
      </Suspense>

      {/* Appointments Queue Section */}
      <section className="mb-8">
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
              <Button
                //  onClick={() => window.location.reload()} 
                variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <HostTodaysAppointments
            initialAppointments={appointments || { total: 0, limit, offset, appointments: [] }}
            office_id={office_id}
            token={token}
          />
        )}
      </section>

      {/* Calendar Section */}
      <section className="my-4">

        <CalendarView office_id={office_id} token={token} />
      </section>

      {/* Last Updated Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          Last updated: {format(new Date(), "h:mm:ss a")} • Auto-refreshes every minute
        </p>
      </div>
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
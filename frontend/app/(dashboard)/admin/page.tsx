import { redirect } from "next/navigation";
import { format } from "date-fns";
import { getSession } from "@/helpers/actions/getsession";
import { QuickActions } from "./_components/quick-actions";
import { StatsGrid } from "./_components/stats-grid";
import { RecentOfficesList } from "./_components/recent-offices-list";
import { RecentActivityFeed } from "./_components/recent-activity-feed";
import DashboardFooter from "../_components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, CalendarCheck, Clock, TrendingUp, Activity } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard - KulanDesk",
  description: "System overview and management",
};

export interface SystemStats {
  total_users: number;
  total_offices: number;
  total_appointments: number;
  pending_appointments: number;
  completed_today: number;
  active_hosts: number;
  approval_rate: number;
  avg_processing_time: number;
  offices_added_this_month: number;
  todays_appointments: number;
  avg_approval_rate: number;
  idle_hosts: number;
}

export interface RecentOffice {
  id: string;
  name: string;
  description: string;
  location: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


export interface RecentActivity {
  id: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  action: string;
  resource: string;
  timestamp: string;
  office_name?: string;
}

async function getOffices(token: string) {
  try {
    const res = await fetch(
      `${process.env.API_URL}/offices`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 60 } // Revalidate every 60 seconds
      }
    );
    if (!res.ok) throw new Error("Failed to fetch offices");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Office fetch error:", error);
    return [];
  }
}

export default async function AdminDashboard() {
  const session = await getSession()
  const token = session?.user.access_token
  const user = session?.user
  if (!token) {
    redirect("/Signin");
  }

  // Fetch real office data
  const officesData = await getOffices(token)

  // Transform and filter offices data
  const offices = officesData
    .map((office: RecentOffice) => ({
      id: office.id,
      name: office.name,
      description: office.description,
      location: office.location,
      address: office.location,
      is_active: office.is_active,
      created_at: office.created_at,
      updated_at: office.updated_at,
    }))
    // Sort by creation date (newest first) and take only the latest 5
    .sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);



  // Dummy data for stats - you can replace with real data later
  const stats: SystemStats = {
    total_users: 1247,
    total_offices: officesData.length,
    total_appointments: 8563,
    pending_appointments: 23,
    completed_today: 47,
    active_hosts: 89,
    approval_rate: 94.5,
    avg_processing_time: 12.3,
    offices_added_this_month: 5,
    todays_appointments: 58,
    avg_approval_rate: 92.7,
    idle_hosts: 12
  };

  // Dummy data for recent activity
  const activities: RecentActivity[] = [
    {
      id: "1",
      user: {
        first_name: "Sarah",
        last_name: "Johnson",
        email: "sarah.j@company.com"
      },
      action: "APPOINTMENT_CREATED",
      resource: "Meeting with Client",
      timestamp: "2024-01-15T14:30:00Z",
      office_name: "Downtown Headquarters"
    },
    {
      id: "2",
      user: {
        first_name: "Admin",
        last_name: "User",
        email: "admin@company.com"
      },
      action: "USER_CREATED",
      resource: "Mike Chen",
      timestamp: "2024-01-15T13:15:00Z"
    },
    {
      id: "3",
      user: {
        first_name: "Robert",
        last_name: "Wilson",
        email: "robert.w@company.com"
      },
      action: "APPOINTMENT_APPROVED",
      resource: "Project Review",
      timestamp: "2024-01-15T12:45:00Z",
      office_name: "Tech Innovation Center"
    },
    {
      id: "4",
      user: {
        first_name: "Admin",
        last_name: "User",
        email: "admin@company.com"
      },
      action: "OFFICE_DELETED",
      resource: "London Branch",
      timestamp: "2024-01-15T11:20:00Z"
    },
    {
      id: "5",
      user: {
        first_name: "Lisa",
        last_name: "Garcia",
        email: "lisa.g@company.com"
      },
      action: "HOST_CREATED",
      resource: "David Brown",
      timestamp: "2024-01-15T10:10:00Z",
      office_name: "Regional Office Chicago"
    }
  ];

  // Calculate key metrics for stats cards with string identifiers
  const metrics = [
    {
      title: "Total Users",
      value: stats.total_users.toLocaleString(),
      change: "+12% from last month",
      icon: "Users",
      trend: "up",
    },
    {
      title: "Active Offices",
      value: stats.total_offices.toString(),
      change: `${stats.offices_added_this_month} added this month`,
      icon: "Building2",
      trend: "up",
    },
    {
      title: "Today's Appointments",
      value: stats.todays_appointments.toString(),
      change: `${stats.completed_today} completed`,
      icon: "CalendarCheck",
      trend: "neutral",
    },
    {
      title: "Pending Actions",
      value: stats.pending_appointments.toString(),
      change: "Require attention",
      icon: "Clock",
      trend: "warning",
    },
    {
      title: "Active Hosts",
      value: stats.active_hosts.toString(),
      change: `${stats.idle_hosts} idle`,
      icon: "Activity",
      trend: "neutral",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/30">
      {/* Main Content */}
      <div className="space-y-8 p-6">
        {/* Enhanced Page Header */}
        <Card className="border-0 bg-linear-to-r from-white to-brand-primary/50 shadow-gren">
          <CardContent className="p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-linear-to-br from-brand/70 to-brand rounded-2xl shadow-gren">
                    <Building2 className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Admin Dashboard
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-lg text-gray-600 font-medium">
                        {format(new Date(), "EEEE, MMMM d, yyyy")}
                      </p>
                      <Badge variant="secondary" className="bg-brand-primary text-brand border-brand-primary">
                        System Overview
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <QuickActions token={token} />
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <StatsGrid metrics={metrics} />

        {/* Main Content Grid */}
        <div className="space-y-4">
          {/* Recent Offices (2/3 width) */}
          <div className="lg:col-span-2">
            <RecentOfficesList offices={offices} token={token} />
          </div>

          {/* Recent Activity (1/3 width) */}
          <div>
            <RecentActivityFeed activities={activities} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12">
        <DashboardFooter user={user} />
      </div>
    </div>
  );
}
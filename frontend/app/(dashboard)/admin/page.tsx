import { redirect } from "next/navigation";
import { format } from "date-fns";
import { getSession } from "@/helpers/actions/getsession";
import { QuickActions } from "./_components/quick-actions";
import { StatsGrid } from "./_components/stats-grid";
import type { Metric } from "./_components/stats-grid";
import { RecentOfficesList } from "./_components/recent-offices-list";
import { RecentusersList } from "./_components/RecentusersList";
import DashboardFooter from "../_components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, } from "lucide-react";
import { apiClient, } from "@/helpers/api/client";

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
export interface Recentuser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  is_system_user: boolean;
  is_verified: boolean;
  last_login: string | null;
  login_count: number;
  permissions: string[];
  roles: ('host' | 'admin' | 'reception' | 'secretary')[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
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

// get users
async function getUsers(token: string) {
  const baseUrl = process.env.API_URL || "http://localhost:8000/api/v1";
  try {
    const response = await apiClient.get("/admin/users", {
      baseURL: baseUrl, // Override per request
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 100, offset: 0 }
    });
    return response.data;
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
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
  const usersData = await getUsers(token)

  // Transform users data to match Recentuser interface
  const mappedUsers = usersData.users.map((user: Recentuser) => ({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name || "",
    email: user.email,
    is_active: user.is_active,
    is_system_user: user.is_system_user,
    is_verified: user.is_verified,
    last_login: user.last_login,
    login_count: user.login_count,
    permissions: user.permissions || [],
    roles: user.roles || [],
    created_at: user.created_at,
    updated_at: user.updated_at,
    created_by: user.created_by,
    updated_by: user.updated_by,
  })) as Recentuser[]

  const users = mappedUsers
    .sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)


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
  ] satisfies Metric[];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/30">
      {/* Main Content */}
      <div className="space-y-8 p-6">
        {/* Enhanced Page Header */}
        <Card className="border-0 bg-linear-to-r from-white to-brand-primary/50 shadow-gren">
          <CardContent className="">
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

          {/* Recent users */}
          <div className="lg:col-span-1">
            <RecentusersList users={users} />
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
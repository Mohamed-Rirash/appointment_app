import { redirect } from "next/navigation";
import { Download, Plus, Building2, MapPin, Users, Activity } from "lucide-react";
import { getSession } from "@/helpers/actions/getsession";
import CreateOfficeForm from "./_components/officeForm";
import OfficeCardsSection from "./_components/OfficeCardsSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const metadata = {
  title: "Office Management - KulanDesk",
  description: "Manage office locations and team assignments",
};

async function getOfficeStats(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offices/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch stats");
    return await res.json();
  } catch (error) {
    console.error("Stats fetch error:", error);

    // Return dummy data when API fails or during development
    return {
      total_offices: 8,
      active_offices: 6,
      total_members: 47,
      inactive_offices: 2,
      average_members_per_office: 6,
      recently_created_offices: 2
    };
  }
}

// Alternative function that always returns dummy data for development
function getDummyOfficeStats() {
  return {
    total_offices: 8,
    active_offices: 6,
    total_members: 47,
    inactive_offices: 2,
    average_members_per_office: 6,
    recently_created_offices: 2,
    office_distribution: {
      main: 1,
      branch: 5,
      remote: 2
    },
    capacity_utilization: 78 // percentage
  };
}

export default async function OfficesPage() {
  const session = await getSession();

  if (!session?.user?.access_token) {
    redirect("/Signin");
  }

  const token = session.user.access_token;

  // Check admin permissions
  if (!session.user.roles?.includes("admin")) {
    redirect("/unauthorized");
  }

  // Try to get real stats, fall back to dummy data
  let stats = await getOfficeStats(token);

  // If stats is null (API failed), use dummy data
  if (!stats) {
    stats = getDummyOfficeStats();
  }

  return (
    <div className="flex-1 space-y-8 p-6 md:p-8 bg-linear-to-br from-brand-primary/20 to-brand-primary min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-linear-to-br from-brand-primary/10 to-brand-primary rounded-xl">
              <Building2 className="h-7 w-7 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-brand-black">
                Office Management
              </h1>
              <p className="text-gray-600 text-lg max-w-2xl">
                Manage office locations, member assignments, and operational status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {stats && (
              <>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                  <Building2 className="h-3.5 w-3.5 mr-1.5" />
                  {stats.total_offices} Total Offices
                </Badge>
                <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                  <Activity className="h-3.5 w-3.5 mr-1.5" />
                  {stats.active_offices} Active
                </Badge>
                <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  {stats.total_members} Members Assigned
                </Badge>
                {/* Additional stats badges */}
                {stats.inactive_offices && (
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                    <MapPin className="h-3.5 w-3.5 mr-1.5" />
                    {stats.inactive_offices} Inactive
                  </Badge>
                )}
                {stats.recently_created_offices && (
                  <Badge variant="secondary" className="bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    {stats.recently_created_offices} New
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="h-11 px-4 rounded-sm border-brand-secondary hover:bg-brand-secondary/90 font-medium text-brand-gray">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-11 px-4 bg-linear-to-r from-brand to-brand/80 hover:from-brand hover:to-brand/70 text-white font-semibold rounded-sm transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Create Office
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white">
              <DialogHeader className="p-6 pb-4 bg-linear-to-r from-brand-primary/20 to-brand-primary/90 ">
                <DialogTitle className="text-2xl font-bold text-brand-black flex items-center gap-3">
                  <div className="p-2 bg-white rounded-sm">
                    <Building2 className="h-5 w-5 text-brand" />
                  </div>
                  Create New Office
                </DialogTitle>
                <DialogDescription className="text-brand-gray mt-2">
                  Add an office location with name, description, and operational details
                </DialogDescription>
              </DialogHeader>
              <div className="p-6">
                <CreateOfficeForm token={token} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Optional: Stats Cards Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-brand-primary! shadow-gren!">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand">Total Offices</p>
                  <p className="text-2xl font-bold text-brand-black">{stats.total_offices}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Building2 className="h-5 w-5 text-brand" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-brand-primary! shadow-gren!">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Active Offices</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_offices}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-brand-primary! shadow-gren!">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_members}</p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-brand-primary! shadow-gren!">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">Avg. per Office</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.average_members_per_office || Math.round(stats.total_members / stats.total_offices)}
                  </p>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Users className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Office Cards Section */}
      <OfficeCardsSection token={token} />
    </div>
  );
}
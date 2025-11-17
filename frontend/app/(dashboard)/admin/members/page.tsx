import { redirect } from "next/navigation";
import { Plus, Users, Shield, UserCheck, Activity } from "lucide-react";
import { getSession } from "@/helpers/actions/getsession";
import UserForm from "./_components/userForm";
import UsersTableClient from "./_components/UsersTableClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "User Management - KulanDesk",
  description: "Manage team members, roles, and permissions",
};

async function getUserStats(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch stats");
    return await res.json();
  } catch (error) {
    console.error("Stats fetch error:", error);
    return null;
  }
}

export default async function MembersPage() {
  const session = await getSession();

  if (!session?.user?.access_token) {
    redirect("/Signin");
  }

  const token = session.user.access_token;

  // Check admin permissions
  if (!session.user.roles?.includes("admin")) {
    redirect("/unauthorized");
  }

  const stats = await getUserStats(token);

  return (
    <div className="flex-1 space-y-8 p-6 bg-linear-to-br from-brand-primary/10 to-brand-primary min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-linear-to-br from-brand-primary/20 to-brand-primary rounded-xl">
              <Users className="h-7 w-7 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Team Management
              </h1>
              <p className="text-gray-600 text-lg max-w-2xl">
                Manage user accounts, assign roles, and control access permissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {stats && (
              <>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  {stats.total_users} Total Members
                </Badge>
                <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                  <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                  {stats.active_users} Active
                </Badge>
                <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  {stats.admin_users} Admins
                </Badge>
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                  <Activity className="h-3.5 w-3.5 mr-1.5" />
                  {stats.pending_verification} Pending Verification
                </Badge>
              </>
            )}
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              className=" bg-brand hover:bg-brand/90 text-white h-11 px-6 rounded-sm font-semibold shadow-gren transition-all "
            >
              <Plus className="h-5 w-5 mr-2" />
              Invite Team Member
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg ">
            <DialogHeader className="bg-linear-to-r from-brand-primary/10 to-brand-primary ">
              <DialogTitle className="text-2xl font-bold font-satoshi text-brand-black flex items-center gap-2">
                <div className="p-2 bg-white rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                Invite New Team Member
              </DialogTitle>
              <DialogDescription className="text-brand-gray">
                Send an invitation to join your organization with specified role and permissions.
              </DialogDescription>
            </DialogHeader>
            <UserForm token={token} />
          </DialogContent>

        </Dialog>
      </div>

      {/* User Table */}
      <UsersTableClient token={token} />
    </div>
  );
}
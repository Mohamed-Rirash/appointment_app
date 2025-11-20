import { redirect } from "next/navigation";
import { Plus, Users } from "lucide-react";
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

export const metadata = {
  title: "User Management - KulanDesk",
  description: "Manage team members, roles, and permissions",
};


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
                User Management
              </h1>
              <p className="text-gray-600 text-lg max-w-2xl">
                Manage user accounts, assign roles, and control access permissions
              </p>
            </div>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              className=" bg-brand hover:bg-brand/90 text-white h-11 px-6 rounded-sm font-semibold shadow-gren transition-all "
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New User
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg ">
            <DialogHeader className="bg-linear-to-r from-brand-primary/10 to-brand-primary ">
              <DialogTitle className="text-2xl font-bold font-satoshi text-brand-black flex items-center gap-2">
                <div className="p-2 bg-white rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                Create User
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
import { redirect } from "next/navigation";

import { RoleSidebar } from "@/app/(dashboard)/_components/role-sidebar";
import { getSession } from "@/helpers/actions/getsession";
import { DashboardHeader } from "./_components/dashboard-header";

export const metadata = {
  title: "KulanDesk Dashboard",
  description: "Government Appointment Management System",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get session from cookie
  const session = await getSession()
  const token = session?.user.access_token

  if (!token) {
    redirect("/Signin");
  }

  const user = session?.user
  const userRole = user.roles?.[0]

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Role-Specific Sidebar */}
      <RoleSidebar
        role={userRole}
        user={user}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <DashboardHeader user={user} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background ">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
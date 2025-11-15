import { redirect } from "next/navigation";
import { getSession } from "@/helpers/actions/getsession";
import DashboardStatsCard from "../_components/DashboardStatsCard";
import { client } from "@/helpers/api/client";
import { Office, OfficeCard } from "./offices/_components/OfficeCard";

export default async function AdminDashboard() {
  const session = await getSession();
  const token = session?.user.access_token;

  if (!token) {
    redirect("/Signin");
  }

  // const offices = await client.getOfficess(token);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, offices, and system settings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="">
        <DashboardStatsCard token={token} />
      </div>

      {/* Recent Offices */}
      {/* <OfficeList offices={offices.slice(0, 5)} /> */}
      {/* {offices?.slice(0, 5).map((office: Office) => (
        <OfficeCard key={office.id} office={office} token={token} />
      ))} */}
    </div>
  );
}

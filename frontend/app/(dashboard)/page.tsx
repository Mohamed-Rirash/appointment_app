import { getSession } from "@/helpers/actions/getsession";
import DashboardStatsCard from "./_components/DashboardStatsCard";
import QuickActionsCard from "./_components/QuickActionsCard";
import OfficeOverviewSection from "./_components/OfficeOverviewSection";
import RecentUsersTable from "./_components/RecentUsersTable";
import RecentActivitySection from "./_components/RecentActivitySection";
import DashboardFooter from "./_components/Footer";


export default async function Dashboard() {
  const session = await getSession()
  const token = session?.user.access_token

  if (session?.user.roles[0] !== "admin") {
    return null
  }

  return (
    <>
      <main className="px-6 pt-12">
        <div className="">
          <h1 className="font-bold text-lg">Welcome, {session?.user.first_name} </h1>
          <p className="text-ms text-brand-gray ">System Overview & Management</p>
        </div>
        <section className="mt-12">
          <DashboardStatsCard token={token} />
        </section>
        <section className="mt-8">
          <QuickActionsCard token={token} />
        </section>
        <section className="mt-8">
          <OfficeOverviewSection token={token} />
        </section>
        <section className="mt-8">
          <RecentUsersTable token={token} />
        </section>
        <section className="mt-8">
          <RecentActivitySection token={token} />
        </section>

      </main>
      <footer>
        <DashboardFooter user={session?.user} />
      </footer>
    </>
  );
}

import { getSession } from "@/helpers/actions/getsession";
import DashboardStatsCard from "./_components/DashboardStatsCard";


export default async function Dashboard() {
  const session = await getSession()
  return (
    <main className="px-6 pt-12">
      <div className="">
        <h1 className="font-bold text-lg">Welcome, {session?.user.first_name} </h1>
        <p className="text-ms text-brand-gray ">System Overview & Management</p>
      </div>
      <section>
        <DashboardStatsCard token={session?.user.access_token}/>
      </section>
    </main>
  );
}

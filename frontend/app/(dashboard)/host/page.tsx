import { getSession } from "@/helpers/actions/getsession";
import DashboardStatsCardhost from "./_components/DashboardStatsCardhost";
import { AvailabilityDialog } from "./_components/AvailabilityDialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
import Link from "next/link";
import AppointmentQueueSection from "./_components/AppointmentQueueSection";
import TodaysScheduleCard from "./_components/TodaysScheduleCard";
import AvailableOverview from "./_components/AvailableOverview";

export default async function page() {
  const session = await getSession();
  const token = session?.user.access_token;
  if (session?.user.roles[0] !== "host") {
    return null
  }
  console.log("userrr", session?.user)
  return (
    <>
      <main className="px-6 pt-12">
        <div className="flex justify-between items-center">
          <div className="">
            <h1 className="font-bold text-lg">
              Welcome, {session?.user.first_name}{" "}
            </h1>
            <p className="text-ms text-brand-gray ">
              Host Dashboard management
            </p>
          </div>
          <div className="flex gap-4 ">

            <Link href={"/host/availabletime"}>
              <Button className="bg-linear-to-r from-[#0F9938] to-[#29E05F] text-white font-bold py-6 px-8 rounded-[4px] shadow-gren">
                <Clock className="h-5 w-5 mr-2" />
                Manage Availability
              </Button>
            </Link>


            {/* View Calendar */}
            <AvailabilityDialog>
              <Button
                variant="outline"
                className="font-bold py-6 px-8 rounded-[4px]"
              >
                <Calendar className="h-5 w-5 mr-2" />
                View Calendar
              </Button>
            </AvailabilityDialog>
          </div>
        </div>
        <section className="mt-12">
          <DashboardStatsCardhost token={token} />
        </section>
        <section className="mt-12">
          <AppointmentQueueSection token={token} />
        </section>
        <section className="mt-12">
          <TodaysScheduleCard token={token} />
        </section>
        <section className="my-12">
          <AvailableOverview officeId={session?.user.office_id} token={token} />
        </section>
      </main>
    </>
  );
}

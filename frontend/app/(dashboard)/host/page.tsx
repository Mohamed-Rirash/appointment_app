import { getSession } from "@/helpers/actions/getsession";
import DashboardStatsCardhost from "./_components/DashboardStatsCardhost";
import { AvailabilityDialog } from "./_components/AvailabilityDialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
import ManageAvailability from "./_components/ManageAvailability";

export default async function page() {
  const session = await getSession();
  const token = session?.user.access_token;
  return (
    <>
      <main className="px-6 pt-12">
        <div className="flex justify-between items-center">
          <div className="">
            <h1 className="font-bold text-lg">
              Welcome, {session?.user.first_name}{" "}
            </h1>
            <p className="text-ms text-brand-gray ">
              System Overview & Management
            </p>
          </div>
          <div className="flex gap-4 ">
            {/* Manage Availability */}
            <AvailabilityDialog title="Manage Availability">
              <Button className="bg-gradient-to-r from-[#29E05F] to-[#0F9938] text-white font-bold py-6 px-8 rounded-[4px] shadow-gren">
                <Clock className="h-5 w-5 mr-2" />
                Manage Availability
              </Button>
            </AvailabilityDialog>

            {/* View Calendar */}
            <AvailabilityDialog title="View Calendar">
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

         <ManageAvailability officeId={"akdjfajdsfjasjdf"} />
      </main>
    </>
  );
}

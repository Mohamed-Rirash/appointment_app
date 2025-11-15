import { getSession } from "@/helpers/actions/getsession";
import { redirect } from "next/navigation";
import AvailabilityCalendar from "../_components/availability-calendar";

export const metadata = {
    title: "My Availability - KulanDesk Host",
};

export default async function AvailabilityPage() {
    const session = await getSession()
    const token = session?.user.access_token
    const officeId = session?.user.office_id
    if (!token) {
        redirect("/Signin");
    }


    if (!officeId) {
        redirect("/profile?error=no_office");
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Availability</h1>
                    <p className="text-muted-foreground">
                        Set your weekly appointment schedule
                    </p>
                </div>
                <div className="text-sm text-muted-foreground">
                    Possition: {session?.user.position || "Not assigned"}
                </div>
            </div>

            <AvailabilityCalendar
                officeId={officeId}
                token={token}
            />
        </div>
    );
}
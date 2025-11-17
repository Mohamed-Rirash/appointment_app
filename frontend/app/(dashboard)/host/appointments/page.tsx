import { redirect } from "next/navigation";
import { getSession } from "@/helpers/actions/getsession";
import { AppointmentView, AppointmentViewSkeleton } from "./_components/appointments-View";
import { Suspense } from "react";


export const metadata = {
    title: "view Appointments ",
    description: "Manage and check-in citizens for appointments",
};

interface SearchParams {
    status?: string;
    date?: string;
    search?: string;
    page?: string;
}

export default async function ReceptionAppointments() {
    const session = await getSession()
    const token = session?.user.access_token
    const officeId = session?.user.office_id
    if (!token) {
        redirect("/Signin");
    }

    if (!officeId) {
        return <div>You are not member of office yet</div>
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Office Appointments</h1>
                <p className="text-muted-foreground">
                    Check-in citizens and manage appointment status
                </p>
                <div className="mt-6">
                    <Suspense fallback={<AppointmentViewSkeleton />}>
                        <AppointmentView office_id={officeId} token={token} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
import { redirect } from "next/navigation";
import { getSession } from "@/helpers/actions/getsession";
import { AppointmentView, AppointmentViewSkeleton } from "./_components/appointments-View";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "View Appointments",
    description: "Manage citizen appointments and track check-in status in real-time.",
};

export default async function ReceptionAppointments() {
    const session = await getSession();

    // Handle unauthenticated users
    if (!session?.user?.access_token) {
        redirect("/Signin");
    }

    const token = session.user.access_token;
    const officeId = session.user.office_id;

    // Handle users without office assignment
    if (!officeId) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
                <div className="w-full max-w-md rounded-lg bg-background p-8 shadow-lg">
                    <div className="mb-4 flex justify-center">
                        <div className="rounded-full bg-muted p-3">
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>
                    <h1 className="mb-2 text-center text-xl font-semibold">
                        Office Assignment Required
                    </h1>
                    <p className="mb-6 text-center text-sm text-muted-foreground">
                        You need to be assigned to an office before you can manage appointments.
                        Please contact your administrator.
                    </p>
                    <div className="flex justify-center">
                        <Button asChild variant="outline">
                            <Link href="/">Return to Dashboard</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/40">
            <div className="mx-auto max-w-7xl p-6 md:p-8">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="rounded-lg bg-brand-primary/10 p-2 border border-brand-primary" >
                            <Calendar className="h-5 w-5 text-brand" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Office Appointments
                        </h1>
                    </div>
                    <p className="text-base text-muted-foreground md:max-w-2xl">
                        Check in guests, update appointment statuses, and manage your daily schedule efficiently.
                    </p>
                </div>

                {/* Main Content Card */}
                <div className="rounded-xl bg-background p-6 shadow-sm ring-1 ring-border md:p-8">
                    <Suspense fallback={<AppointmentViewSkeleton />}>
                        <AppointmentView office_id={officeId} token={token} />
                    </Suspense>
                </div>

                {/* Footer Helper Text */}
                <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted-foreground">
                    Appointments update automatically. Refresh the page if data appears out of sync.
                </p>
            </div>
        </div>
    );
}
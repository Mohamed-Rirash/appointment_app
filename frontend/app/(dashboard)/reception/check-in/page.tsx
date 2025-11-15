import { redirect } from "next/navigation";

import { getSession } from "@/helpers/actions/getsession";
import { RecentCheckIns } from "../components/recent-check-ins";
import { QrScanner } from "../components/qr-scanner";

export const metadata = {
    title: "Check-In - KulanDesk Reception",
};

export default async function CheckInPage() {
    const session = await getSession()
    const token = session?.user.access_token

    if (!token) {
        redirect("/Signin");
    }

    // Dummy data for recent check-ins
    const checkIns = [
        {
            id: "checkin-1",
            appointment_id: "app-1",
            citizen: {
                id: "citizen-1",
                full_name: "Ahmed Mohamed",
                phone_number: "+252-63-1234567"
            },
            checked_in_at: new Date().toISOString(),
            host: {
                id: "host-1",
                full_name: "Dr. Fatima Hassan",
                position: "Senior Health Officer"
            },
            time_slot: "09:00 AM"
        },
        {
            id: "checkin-2",
            appointment_id: "app-2",
            citizen: {
                id: "citizen-2",
                full_name: "Khadra Abdi Ali",
                phone_number: "+252-90-9876543"
            },
            checked_in_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
            host: {
                id: "host-2",
                full_name: "Eng. Omar Jama",
                position: "Building Inspector"
            },
            time_slot: "09:30 AM"
        },
        {
            id: "checkin-3",
            appointment_id: "app-3",
            citizen: {
                id: "citizen-3",
                full_name: "Mohamed Ibrahim",
                phone_number: "+252-65-5551234"
            },
            checked_in_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
            host: {
                id: "host-3",
                full_name: "Aisha Mohamed",
                position: "License Officer"
            },
            time_slot: "10:00 AM"
        },
        {
            id: "checkin-4",
            appointment_id: "app-4",
            citizen: {
                id: "citizen-4",
                full_name: "Zahra Omar",
                phone_number: "+252-63-4447890"
            },
            checked_in_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
            host: {
                id: "host-4",
                full_name: "Hassan Duale",
                position: "Passport Officer"
            },
            time_slot: "10:30 AM"
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Citizen Check-In</h1>
                <p className="text-muted-foreground">
                    Scan QR code or search for appointment
                </p>
            </div>

            <QrScanner />

            <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Check-Ins</h2>
                <RecentCheckIns checkIns={checkIns} />
            </div>
        </div>
    );
}
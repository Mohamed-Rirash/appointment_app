import { redirect } from "next/navigation";
import { getSession } from "@/helpers/actions/getsession";
import { WalkInForm } from "../components/walk-in-form";

export const metadata = {
    title: "Walk-In Appointment - KulanDesk Reception",
};

export default async function WalkInPage() {
    const session = await getSession()
    const token = session?.user.access_token

    if (!token) {
        redirect("/Signin");
    }

    // Dummy data for hosts and offices
    const hosts = [
        {
            id: "host-1",
            full_name: "Dr. Fatima Hassan",
            position: "Senior Health Officer",
            office_id: "office-1"
        },
        {
            id: "host-2",
            full_name: "Eng. Omar Jama",
            position: "Building Inspector",
            office_id: "office-2"
        },
        {
            id: "host-3",
            full_name: "Aisha Mohamed",
            position: "License Officer",
            office_id: "office-3"
        },
        {
            id: "host-4",
            full_name: "Hassan Duale",
            position: "Passport Officer",
            office_id: "office-4"
        },
        {
            id: "host-5",
            full_name: "Naima Ahmed",
            position: "Tax Consultant",
            office_id: "office-5"
        },
        {
            id: "host-6",
            full_name: "Abdirahman Mohamed",
            position: "Marriage Registrar",
            office_id: "office-6"
        }
    ];

    const offices = [
        {
            id: "office-1",
            name: "Ministry of Health Development",
            address: "Central Government Complex, Hargeisa"
        },
        {
            id: "office-2",
            name: "Ministry of Public Works, Land & Housing",
            address: "Public Works Building, Hargeisa"
        },
        {
            id: "office-3",
            name: "Ministry of Trade, Tourism & Industry",
            address: "Commerce Center, Hargeisa"
        },
        {
            id: "office-4",
            name: "Ministry of Interior",
            address: "Security Complex, Hargeisa"
        },
        {
            id: "office-5",
            name: "Ministry of Finance Development",
            address: "Finance Building, Hargeisa"
        },
        {
            id: "office-6",
            name: "Ministry of Justice",
            address: "Justice Palace, Hargeisa"
        }
    ];

    return (
        <div className="space-y-6 p-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Walk-In Appointment</h1>
                <p className="text-muted-foreground">
                    Create appointment for citizen without prior booking
                </p>
            </div>

            <WalkInForm
                hosts={hosts}
                offices={offices}
            />
        </div>
    );
}
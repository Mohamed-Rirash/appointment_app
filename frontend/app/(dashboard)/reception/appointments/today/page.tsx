import { redirect } from "next/navigation";
import { getSession } from "@/helpers/actions/getsession";
import TodayAppointments from "./_components/todaysAppointment";

export const metadata = {
    title: "Reception Desk - KulanDesk",
    description: "",
};

export default async function TodaysAppointment() {
    const session = await getSession();
    const token = session?.user.access_token;

    if (!token) {
        redirect("/Signin");
    }


    return (
        <div className="p-6">
            <TodayAppointments token={token} />
        </div>
    );
}


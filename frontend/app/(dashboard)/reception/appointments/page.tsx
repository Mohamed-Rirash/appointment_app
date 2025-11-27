import { getSession } from "@/helpers/actions/getsession";
import AppointmentList from "./_components/AppointmentList";

export default async function Appointments() {
    const session = await getSession()
    const token = session?.user.access_token
    return (
        <div className="p-6">
            <AppointmentList token={token} />
        </div>
    )
}

import { getSession } from "@/helpers/actions/getsession";
import { redirect } from "next/navigation";
import AppointmentManager from "./_components/AppointmentManager";
import AppointmentReceptionManager from "./_components/AppointmentReceptionManager";

export default async function AddAppointment() {
  try {
    const session = await getSession();

    // Handle missing session
    if (!session?.user) {
      redirect("/Signin");
    }
    const { user } = session;
    const token = user?.access_token;
    const role = user?.roles?.[0];


    // Authorization check
    const allowedRoles = ["host", "secretary", "reception"];
    if (!role || !allowedRoles.includes(role)) {
      redirect("/unauthorized");
    }


    return (
      <main className="my-">
        <div className="text-center p-">
          <AppointmentReceptionManager token={token} />
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error loading appointment page:", error);
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-red-500">
          Failed to load appointment page. Please try again.
        </div>
      </div>
    );
  }
}

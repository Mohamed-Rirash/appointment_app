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
    const officeId = user?.office_id;
    const hostId = user?.id;
    const role = user?.roles?.[0];


    console.log("roel", role)
    // Authorization check
    const allowedRoles = ["host", "secretary", "reception"];
    if (!role || !allowedRoles.includes(role)) {
      redirect("/unauthorized");
    }

    // Handle missing required data
    const rolesRequiringFullInfo = ["host", "secretary"];
    const hasRequiredInfo = token && officeId && hostId;

    if (rolesRequiringFullInfo.includes(role) && !hasRequiredInfo) {
      return (
        <div className="flex justify-center items-center min-h-64">
          <div className="text-red-500">
            Missing required information. Please try again.
          </div>
        </div>
      );
    }

    return (
      <main className="my-8">
        {/* Show appropriate form based on role */}
        {role === "host" ? (
          <AppointmentManager
            officeId={officeId}
            token={token}
            hostId={hostId}
          />
        ) : (
          <div className="text-center p-8">
            <AppointmentReceptionManager token={token} />
          </div>
        )}
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

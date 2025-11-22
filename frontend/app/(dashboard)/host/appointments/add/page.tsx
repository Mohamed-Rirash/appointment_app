import { getSession } from "@/helpers/actions/getsession";
import { redirect } from "next/navigation";
import AppointmentManager from "./_components/AppointmentManager";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Building2, Clock, RefreshCw, Users } from "lucide-react";

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



    // Authorization check
    const allowedRoles = ["host", "secretary"];
    if (!role || !allowedRoles.includes(role)) {
      redirect("/unauthorized");
    }

    if (!officeId) {
      return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-6">
          <Card className="w-full max-w-2xl border-0 bg-white shadow-xl">
            <CardContent className="p-8 text-center">
              {/* Header */}
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Office Assignment Required
                  </h1>
                  <p className="text-lg text-gray-600 max-w-md mx-auto">
                    You need to be assigned to an office before you can manage appointments
                  </p>
                </div>
              </div>

              {/* Status Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <Users className="h-6 w-6 text-blue-600" />
                  <div className="text-left">
                    <p className="font-semibold text-blue-900">Role</p>
                    <p className="text-blue-700 capitalize">{role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                  <div className="text-left">
                    <p className="font-semibold text-amber-900">Status</p>
                    <p className="text-amber-700">No Office Assigned</p>
                  </div>
                </div>
              </div>

              {/* What to do next */}
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-center gap-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  What to do next?
                </h3>
                <div className="space-y-3 text-left max-w-md mx-auto">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-semibold">1</span>
                    </div>
                    <p className="text-gray-700">
                      Contact your administrator to get assigned to an office
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-semibold">2</span>
                    </div>
                    <p className="text-gray-700">
                      Once assigned, you'll be able to create and manage appointments
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-semibold">3</span>
                    </div>
                    <p className="text-gray-700">
                      Refresh this page after your office assignment is complete
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  // onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 px-6"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 font-semibold h-12 px-6"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Need immediate assistance? Email{" "}
                  <a href="mailto:support@kulandesk.com" className="text-blue-600 hover:text-blue-700 font-medium">
                    support@kulandesk.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Handle missing required data
    const rolesRequiringFullInfo = ["host", "secretary"];
    const hasRequiredInfo = token && officeId && hostId;

    if (rolesRequiringFullInfo.includes(role) && !hasRequiredInfo) {
      return (
        <div className="flex justify-center items-center min-h-64">
          <div className="text-red-500 font-bold">
            Missing required information. Please try again.
          </div>
        </div>
      );
    }

    return (
      <main className="my-8">
        <AppointmentManager
          officeId={officeId}
          token={token}
          hostId={hostId}
        />
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

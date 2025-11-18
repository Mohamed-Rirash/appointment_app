import { getSession } from "@/helpers/actions/getsession";
import { redirect } from "next/navigation";
import AvailabilityCalendar from "../_components/availability-calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    Clock,
    Building2,
    AlertCircle,
    RefreshCw,
    Mail,
    ArrowRight,
    UserCheck,
    Users
} from "lucide-react";

export const metadata = {
    title: "My Availability - KulanDesk Host",
};

export default async function AvailabilityPage() {
    const session = await getSession()
    const token = session?.user.access_token
    const officeId = session?.user.office_id
    const user = session?.user

    if (!token) {
        redirect("/Signin");
    }

    if (!officeId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/30 flex items-center justify-center p-6">
                <Card className="w-full max-w-2xl border-0 bg-white shadow-xl">
                    <CardContent className="p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Building2 className="h-10 w-10 text-amber-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-3">
                                Office Assignment Required
                            </h1>
                            <p className="text-lg text-gray-600 max-w-md mx-auto">
                                You need to be assigned to an office before you can set your availability
                            </p>
                        </div>

                        {/* User Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <UserCheck className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium text-blue-900">Your Role</p>
                                    <p className="font-semibold text-blue-700 capitalize">
                                        {user?.roles?.[0] || 'Host'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                                <div>
                                    <p className="text-sm font-medium text-amber-900">Office Status</p>
                                    <p className="font-semibold text-amber-700">Not Assigned</p>
                                </div>
                            </div>
                        </div>

                        {/* Steps to Resolution */}
                        <div className="bg-gray-50 rounded-xl p-6 mb-8">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-center gap-2">
                                <Clock className="h-5 w-5 text-gray-600" />
                                How to Get Started
                            </h3>
                            <div className="space-y-3 max-w-md mx-auto">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-blue-600 text-sm font-semibold">1</span>
                                    </div>
                                    <p className="text-gray-700">
                                        Contact your administrator or office manager
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-blue-600 text-sm font-semibold">2</span>
                                    </div>
                                    <p className="text-gray-700">
                                        Request to be assigned to your designated office
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-blue-600 text-sm font-semibold">3</span>
                                    </div>
                                    <p className="text-gray-700">
                                        Return here to set your availability schedule
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                // onClick={() => window.location.reload()}
                                className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Check Assignment Status
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12 px-6 border-gray-300 hover:bg-gray-50 font-semibold"
                            >
                                <Mail className="h-4 w-4 mr-2" />
                                Contact Support
                            </Button>
                        </div>

                        {/* Additional Info */}
                        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                            <p className="text-sm text-gray-500">
                                Once assigned, you'll be able to set your weekly availability for appointments
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-brand-primary to-brand-primary/50 p-6">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto space-y-6">
                <Card className="border-0 bg-linear-to-r from-white to-brand-50/50 shadow-gren">
                    <CardContent className="p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-linear-to-br from-brand/50 to-brand rounded-2xl shadow-lg">
                                    <Calendar className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-gray-900">
                                        My Availability
                                    </h1>
                                    <p className="text-lg text-gray-600 mt-2">
                                        Set your weekly appointment schedule and manage your working hours
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Badge variant="outline" className="bg-white text-gray-700 border-gray-200 px-3 py-2">
                                    <Users className="h-4 w-4 mr-2" />
                                    Position: {session?.user.position || "Not assigned"}
                                </Badge>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Clock className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">24/7</p>
                                    <p className="text-sm text-gray-600">Flexible Scheduling</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Calendar className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">Weekly</p>
                                    <p className="text-sm text-gray-600">Recurring Schedule</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <UserCheck className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">Real-time</p>
                                    <p className="text-sm text-gray-600">Live Updates</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Instructions Card */}
                <Card className="border-0 bg-amber-50/50 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-amber-900 text-lg mb-2">
                                    Setting Your Availability
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-800">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                        <span>Click and drag to set available time slots</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                        <span>Your schedule updates automatically</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                        <span>Set different hours for each day</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                        <span>Changes affect future appointments</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Availability Calendar */}
                <Card className="border-0 bg-white shadow-lg">
                    <CardContent className="p-6">
                        <AvailabilityCalendar
                            officeId={officeId}
                            token={token}
                        />
                    </CardContent>
                </Card>

                {/* Footer Note */}
                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        Your availability schedule syncs automatically across all platforms
                    </p>
                </div>
            </div>
        </div>
    );
}
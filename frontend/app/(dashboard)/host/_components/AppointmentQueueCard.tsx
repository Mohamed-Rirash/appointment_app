// app/dashboard/components/AppointmentQueueCard.tsx
"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";

export interface Appointment {
    id: string;
    user_name: string;
    purpose: string;
    requested_time: string;
    contact_email: string;
    contact_phone: string;
}

export function AppointmentQueueCard({
    appointment,
    onApprove,
    onPostpone,
    onDeny,
}: {
    appointment: Appointment;
    onApprove: () => void;
    onPostpone: () => void;
    onDeny: () => void;
}) {
    return (
        <div className="bg-white p-4 rounded-lg shadow-gren border border-[#eeeeee]">
            <div className="flex justify-between items-start mb-3">
                <div className="flex gap-4">
                    <h3 className="text-xl font-bold text-brand-black">{appointment.user_name}</h3>
                    <Badge variant="secondary" className="mt-1 bg-amber-200 text-amber-800">
                        Pending
                    </Badge>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Purpose:</strong> {appointment.purpose}</p>
                    <p><strong>Requested Time:</strong> {appointment.requested_time}</p>
                    <p><strong>Contact:</strong> {appointment.contact_email}, +{appointment.contact_phone}</p>
                </div>
                <div className="flex gap-2">
                    {/* Approve */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 px-3 py-1"
                        onClick={onApprove}
                    >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                    </Button>
                    {/* Postpone */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 px-3 py-1"
                        onClick={onPostpone}
                    >
                        <Clock className="h-4 w-4 mr-1" />
                        Postpone
                    </Button>
                    {/* Deny */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1"
                        onClick={onDeny}
                    >
                        <XCircle className="h-4 w-4 mr-1" />
                        Deny
                    </Button>
                </div>
            </div>
        </div>
    );
}
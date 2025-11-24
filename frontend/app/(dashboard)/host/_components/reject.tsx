"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { XCircle } from "lucide-react";
import { client } from "@/helpers/api/client";

interface RejectAppointmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointmentId: string;
    office_id: string;
    token: string | undefined;
    citizenName: string;
    onSuccess?: () => void;
}

export function RejectAppointmentDialog({
    open,
    onOpenChange,
    appointmentId,
    office_id,
    token,
    citizenName,
    onSuccess,
}: RejectAppointmentDialogProps) {
    const queryClient = useQueryClient();
    const [rejectionReason, setRejectionReason] = useState("");

    const rejectAppointment = useMutation({
        mutationFn: async (reason: string) => {
            const baseURL = process.env.NEXT_PUBLIC_API_URL;
            const responce = await client.rejectAppointment(token, appointmentId, office_id, reason)
            return responce.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-appointments', office_id] });
            queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
            onOpenChange(false);
            setRejectionReason("");
            onSuccess?.();
        },
    });

    const handleSubmit = () => {
        if (!rejectionReason.trim()) {
            alert("Please provide a reason for rejection");
            return;
        }
        rejectAppointment.mutate(rejectionReason.trim());
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        Reject Appointment
                    </DialogTitle>
                    <DialogDescription>
                        Please provide a reason for rejecting <span className="text-brand-black font-bold"> {citizenName}&apos;s </span> appointment.
                        This reason will be shared with the citizen.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
                        <Textarea
                            id="rejection-reason"
                            placeholder="Explain why this appointment needs to be rejected..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={rejectAppointment.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={rejectAppointment.isPending || !rejectionReason.trim()}
                    >
                        {rejectAppointment.isPending ? "Rejecting..." : "Reject Appointment"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
// components/DeactivateOfficeButton.tsx
"use client";

import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDeactivateOffice } from "@/hooks/office/useDeactivateOffice";
import { useState } from "react";

export function DeactivateOfficeButton({
    officeId,
    token,
}: {
    officeId: string;
    token?: string;
}) {
    const { deactivateOffice, isdeActivating } = useDeactivateOffice(token);
    const [open, setOpen] = useState(false);


    const handleDeactivate = async () => {

        const success = await deactivateOffice(officeId);
        if (success) {
            setOpen(false);
        }

    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 text-sm"
                >
                    <ArrowLeftRight className="h-4 w-4 mr-1" />
                    Deactivate
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Deactivate this office?</AlertDialogTitle>
                    <AlertDialogDescription>
                        The office will become inactive and users won’t be able to access it.
                        You can reactivate it later.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isdeActivating}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDeactivate}
                        disabled={isdeActivating}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isdeActivating ? "Deactivating..." : "Yes, deactivate"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
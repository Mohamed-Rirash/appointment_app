"use client";

import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActivateOffice } from "@/hooks/office/useActivateOffice";

export function ActivateOfficeButton({
    officeId,
    token,
}: {
    officeId: string;
    token?: string;
}) {
    const { activateOffice, isActivating } = useActivateOffice(token);

    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 text-sm"
            onClick={() => activateOffice(officeId)}
            disabled={isActivating}
        >
            <CheckCircle className="h-4 w-4 mr-1" />
            Activate
        </Button>
    );
}
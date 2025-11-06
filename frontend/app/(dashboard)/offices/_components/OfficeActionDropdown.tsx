"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal } from "lucide-react";
import { DeleteOffice } from "./DeleteOffice";
import { EditOffice } from "./EditOffice";
import Link from "next/link";
interface Office {
    id: string;
    name: string;
    description: string;
    location: string;
    is_active: boolean;
}
export function OfficeActionsDropdown({
    id,
    token,
    office
}: {
    id: string;
    token?: string;
    office: Office
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 p-2">
                <Link href={`/offices/${office.id}`}>
                    <DropdownMenuItem> <Eye className="h-4 w-4 mr-1" />view</DropdownMenuItem>
                </Link>
                <EditOffice initialData={office} token={token} />
                <DeleteOffice officeId={id} token={token} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

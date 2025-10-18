"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { EditOfficeMenuItem } from "./EditOfficeMenuItem";

interface Office {
  id: string;
  name: string;
  description: string;
  location: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export function OfficeActionsDropdown({
  office,
  token,
}: {
  office: Office;
  token: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="border-none p-2">
          <MoreHorizontal className="h-12! w-12!" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 p-2 font-medium border border-[#eeeeee] rounded-md shadow-gren "
      >
        <EditOfficeMenuItem initialData={office} token={token} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

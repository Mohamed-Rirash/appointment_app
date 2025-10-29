"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Office {
  id: string;
  name: string;
  location: string;
  member_count: number;
  is_active: boolean;
}

export function OfficeOverviewCard({ office }: { office: Office }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-gren border border-[#eeeeee]">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-bold text-brand-black">{office.name}</h3>
          <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" />
            {office.location}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 p-2">
            <DropdownMenuItem className="cursor-pointer">View</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Edit</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">{office.member_count} members</span>
        <Badge
          className={`
            py-1 px-3 text-xs font-medium rounded-full
            ${office.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
          `}
        >
          {office.is_active ? "active" : "inactive"}
        </Badge>
      </div>
    </div>
  );
}
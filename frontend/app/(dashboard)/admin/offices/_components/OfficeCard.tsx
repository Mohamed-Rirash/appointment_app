"use client";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useOfficeMembers } from "@/helpers/hooks/office/useOfficeMembers";
import { OfficeActionsDropdown } from "./OfficeActionDropdown";
export interface Office {
    id: string;
    name: string;
    description: string;
    location: string;
    is_active: boolean;
}
export function OfficeCard({ office, token }: { office: Office, token?: string }) {
    const { memberCount } = useOfficeMembers(office.id, token);

    return (
        <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-lg">{office.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="h-4 w-4" />
                        {office.location}
                    </p>
                </div>
                <OfficeActionsDropdown id={office.id} token={token} office={office} />
            </div>
            <div className="mb-3 text-sm text-gray-600">
                {office.description}
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {memberCount} members
                </span>
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
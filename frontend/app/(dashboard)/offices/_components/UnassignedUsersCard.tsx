"use client";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
export function UnassignedUsersCard() {
    return (
        <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-lg">Unassigned Users</h3>
                    <p className="text-sm text-gray-500">All Users are assigned to office</p>
                </div>
                <Badge className="bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    0
                </Badge>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                    <User className="h-4 w-4" />
                    0 users
                </span>
            </div>
        </div>
    );
}
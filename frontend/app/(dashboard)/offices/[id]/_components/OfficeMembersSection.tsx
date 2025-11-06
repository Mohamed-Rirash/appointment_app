
"use client";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AssignMemberModal } from "./AssignMemberModal";
import { useOfficeMembers } from "@/helpers/hooks/office/useOfficeMembers";


export interface User {
    user_id: string,
    first_name: string;
    last_name: string;
    email: string;
    is_primary: boolean,
    membership_active: boolean,
    membership_id: string,
    position: string,
    user_active: boolean,
}
export default function OfficeMembersSection({
    officeId,
    token,
}: {
    officeId: string;
    token?: string;
}) {
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    console.log("shitid", officeId)
    // Fetch office members
    const { isLoading, members } = useOfficeMembers(officeId, token);
    // Fetch unassigned users
    const { data: unassignedData, isLoading: unassignedLoading } = useQuery({
        queryKey: ["unassigned-users"],
        queryFn: async () => {
            if (!token) throw new Error("Unauthorized");
            const response = await client.getUnassignedUsers(token);
            return response || [];
        },
        enabled: !!token,
    });
    if (isLoading || unassignedLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-32 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
            </div>
        );
    }

    const unassignedUsers = unassignedData || [];
    console.log("unass", unassignedUsers)
    console.log("member", members)
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Office Members */}
            <div className="bg-white p-6 rounded-lg shadow-gren border border-[#eeeeee]">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold">Office Members</h2>
                        <p className="text-sm text-gray-500">Manage users assigned to this office</p>
                    </div>
                    {members.length > 0 && (
                        <AssignMemberModal officeId={officeId} token={token} users={unassignedUsers} />
                    )}
                </div>
                {members.length === 0 ? (
                    <div className="text-center py-8 ">
                        <p className="text-gray-500 mb-4">There are no members assigned to this office</p>
                        <AssignMemberModal officeId={officeId} token={token} users={unassignedUsers} />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {members?.map((user: User) => (
                            <div
                                key={user.user_id}
                                className="border border-[#eeeeee] rounded-lg p-4 hover:bg-gray-50"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium">{user.first_name} {user.last_name}</h3>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                        <div className="mt-2 flex gap-2">

                                            <Badge
                                                key={user.position}
                                                className={`px-2 py-1 text-xs font-medium rounded-full`}
                                            >
                                                {user.position}
                                            </Badge>

                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            className={`
                        px-2 py-1 text-xs font-medium rounded-full
                        ${user.user_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      `}
                                        >
                                            {user.user_active ? "active" : "inactive"}
                                        </Badge>
                                        {/* Action menu */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-36 p-2">

                                                <DropdownMenuItem className="cursor-pointer">Edit member</DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer text-red-600">Remove</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Right: Unassigned Users */}
            <div className="bg-white p-6 rounded-lg shadow-gren border border-[#eeeeee]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Unassigned Users</h2>
                    <span className="bg-green-100 text-green-800 text-xs font-medium rounded-full px-2 py-1">
                        {unassignedUsers.length}
                    </span>
                </div>
                {unassignedUsers.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">All users are assigned to offices</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {unassignedUsers.map((user) => (
                            <div
                                key={user.id}
                                className="border border-[#eeeeee] rounded-lg p-4 hover:bg-gray-50"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium">{user.first_name} {user.last_name}</h3>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                        <div className="mt-2 flex gap-2">

                                            <Badge
                                                key={user.is_verified}
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${user.is_verified
                                                    ? "bg-blue-100 text-blue-800"
                                                    :
                                                    "bg-red-100 text-red-800"

                                                    }`}
                                            >
                                                {user.is_verified ? "verified" : "unverified"}
                                            </Badge>

                                        </div>
                                    </div>
                                    {/* <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => console.log("Assign usershit", user.id)}
                                    >
                                        Assign
                                    </Button> */}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
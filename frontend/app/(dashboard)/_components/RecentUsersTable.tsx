"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import Link from "next/link";

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: string[];
  is_active: boolean;
}

export default function RecentUsersTable({ token }: { token?: string }) {
  //   const { data, isLoading } = useQuery({
  //     queryKey: ["recent-users"],
  //     queryFn: async () => {
  //       if (!token) throw new Error("Unauthorized");
  //       const response = await client.getRecentUsers(token);
  //       return response.users || [];
  //     },
  //     placeholderData: (previousData) => previousData,
  //   });

  const [isLoading, setIsLoading] = useState(false);
  const data = [
    {
      id: "1",
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@company.com",
      roles: ["admin"],
      is_active: true,
    },
    {
      id: "2",
      first_name: "Sarah",
      last_name: "Wilson",
      email: "sarah.wilson@company.com",
      roles: ["host"],
      is_active: true,
    },
    {
      id: "3",
      first_name: "Michael",
      last_name: "Chen",
      email: "michael.chen@company.com",
      roles: ["user"],
      is_active: true,
    },
    {
      id: "4",
      first_name: "Emily",
      last_name: "Rodriguez",
      email: "emily.rodriguez@company.com",
      roles: ["admin", "host"],
      is_active: false,
    },
    {
      id: "5",
      first_name: "David",
      last_name: "Kim",
      email: "david.kim@company.com",
      roles: ["host"],
      is_active: true,
    },
    {
      id: "6",
      first_name: "Lisa",
      last_name: "Thompson",
      email: "lisa.thompson@company.com",
      roles: ["user"],
      is_active: false,
    },
  ];

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(3)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-64" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-48" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-gren border border-[#eeeeee]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Recent Users</h2>
          <p className="text-sm text-gray-500">
            Latest user account and status
          </p>
        </div>
        <Link href={"/members"}>
          <Button variant="outline" className="text-brand-gray">
            View All Users
          </Button>
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-[#F5F5F5] border-b border-[#eeeeee]">
            <TableHead className="px-4 py-3 font-medium text-brand-gray">
              Name
            </TableHead>
            <TableHead className="px-4 py-3 font-medium text-brand-gray">
              Email
            </TableHead>
            <TableHead className="px-4 py-3 font-medium text-brand-gray">
              Role
            </TableHead>
            <TableHead className="px-4 py-3 font-medium text-brand-gray">
              Status
            </TableHead>
            <TableHead className="px-4 py-3 font-medium text-brand-gray">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((user) => (
            <TableRow
              key={user.id}
              className="border-t border-[#eeeeee] hover:bg-gray-50"
            >
              <TableCell className="px-4 py-3 font-medium">
                {user.first_name} {user.last_name}
              </TableCell>
              <TableCell className="px-4 py-3">{user.email}</TableCell>
              <TableCell className="px-4 py-3">
                {user.roles.map((role) => (
                  <Badge
                    key={role}
                    className={`mr-1 px-2 py-1 text-xs font-medium rounded-full ${
                      role === "admin"
                        ? "bg-blue-100 text-blue-800"
                        : role === "host"
                        ? "bg-green-100 text-green-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Badge>
                ))}
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge
                  className={`
                    px-2 py-1 text-xs font-medium rounded-full
                    ${
                      user.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  `}
                >
                  {user.is_active ? "active" : "inactive"}
                </Badge>
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex gap-2 items-center">
                  {/* Edit */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-700"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>

                  {/* More */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 p-2">
                      <DropdownMenuItem className="cursor-pointer">
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        Assign Role
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-red-600">
                        Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

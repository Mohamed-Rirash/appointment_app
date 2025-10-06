"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react";
import { client } from "@/helpers/api/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteUserButton } from "./DeleteUserButton";
import { EditUserModal } from "./EditUserModal";
import { UserActionsDropdown } from "./UserActionsDropdown";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  roles: string[];
  created_at: string;
  updated_at: string;
}

interface UsersResponse {
  appointments: User[];
  total: number;
  page: number;
  size: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export default function UsersTableClient({ token }: { token?: string }) {
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [verifiedFilter, setVerifiedFilter] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data, isLoading, isFetching } = useQuery<UsersResponse>({
    queryKey: [
      "users",
      page,
      size,
      debouncedSearch,
      statusFilter,
      verifiedFilter,
    ],
    queryFn: async () => {
      if (!token) throw new Error("Unauthorized");

      const params: Record<string, any> = { page, size };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter === "active") params.is_active = true;
      if (statusFilter === "inactive") params.is_active = false;
      if (verifiedFilter === "verified") params.is_verified = true;
      if (verifiedFilter === "unverified") params.is_verified = false;

      const response = await client.getUsers(token, params);
      return response as UsersResponse;
    },
    placeholderData: (previousData) => previousData,
  });

  const users = data?.appointments || [];
  const filteredUsers = users.filter((user: User) => {
    if (!roleFilter) return true;
    return user.roles.includes(roleFilter);
  });

  const handleEdit = (id: string, role: string) => {
    console.log("Edit", id, "Role:", role);
  };

  return (
    <div className="">
      {/* Search bar and filters */}
      <div className="flex justify-between items-center my-3">
        <div className="relative w-full mr-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            disabled={isFetching}
            placeholder="Search by name, email"
            className="pl-10 py-5 rounded-[4px] text-[16px]"
          />
        </div>

        <div className="flex gap-x-6">
          <Select
            value={roleFilter || undefined}
            onValueChange={(v) => {
              setRoleFilter(v === "all" ? null : v);
              setPage(1);
            }}
            disabled={isFetching}
          >
            <SelectTrigger className="w-[180px] text-[16px] py-4 rounded-[4px] shadow-gren">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
              <SelectItem value="host">host</SelectItem>
              <SelectItem value="reception">reception</SelectItem>
              <SelectItem value="secretary">secretary</SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => {
              setStatusFilter(v === "all" ? null : v);
              setPage(1);
            }}
            disabled={isFetching}
          >
            <SelectTrigger className="w-[180px] text-[16px] py-4 rounded-[4px] shadow-gren">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={verifiedFilter || "all"}
            onValueChange={(v) => {
              setVerifiedFilter(v === "all" ? null : v);
              setPage(1);
            }}
            disabled={isFetching}
          >
            <SelectTrigger className="w-[180px] text-[16px] py-4 rounded-[4px]">
              <SelectValue placeholder="Verified" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-[4px] shadow-gren border border-[#eeeeee] overflow-hidden bg-white">
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
                Status
              </TableHead>
              <TableHead className="px-4 py-3 font-medium text-brand-gray">
                Verified
              </TableHead>
              <TableHead className="px-4 py-3 font-medium text-brand-gray">
                Role
              </TableHead>
              <TableHead className="px-4 py-3 font-medium text-brand-gray">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading || isFetching
              ? // Skeleton rows when loading
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-t border-[#eeeeee]">
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-5 w-40" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              : filteredUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-t border-[#eeeeee] hover:bg-gray-50"
                  >
                    <TableCell className="px-4 py-3 font-medium">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell className="px-4 py-3">{user.email}</TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        active
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.is_verified
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.is_verified ? "verified" : "unverified"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 lowercase">
                      {user.roles[0]}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex gap-2 items-center">
                        <EditUserModal
                          userId={user.id}
                          token={token!}
                          initialData={{
                            first_name: user.first_name,
                            last_name: user.last_name,
                            email: user.email,
                          }}
                        />
                        <DeleteUserButton userId={user.id} token={token} />
                        {/* admin actions */}
                        <UserActionsDropdown
                          userId={user.id}
                          email={user.email}
                          token={token!}
                          currentRole={user.roles[0]}
                        />

                        {/* <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-40 p-0 border border-[#eeeeee] rounded-md shadow-lg"
                          >
                            <DropdownMenuItem>Resend invite</DropdownMenuItem>
                            <DropdownMenuItem>Activate user</DropdownMenuItem>
                            <DropdownMenuItem>Deactivate user</DropdownMenuItem>
                            <DropdownMenuItem>Suspend user</DropdownMenuItem>
                            <DropdownMenuItem>Assign Role</DropdownMenuItem>
                            <DropdownMenuItem>Revoke Role</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu> */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            {/* no data */}
            {!isLoading && filteredUsers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  No users match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && (
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            disabled={!data.has_prev || isFetching}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {data.page} of {data.pages}
          </span>
          <Button
            variant="outline"
            disabled={!data.has_next || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

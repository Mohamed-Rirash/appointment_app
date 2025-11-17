// components/users/UsersTableClient.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { UserActionsDropdown } from "./UserActionsDropdown";
import { EditUserModal } from "./EditUserModal";
import { DeleteUserButton } from "./DeleteUserButton";
import {
  Search,
  Filter,
  User,
  Mail,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { client } from "@/helpers/api/client";
import { Card, CardContent } from "@/components/ui/card";

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  is_system_user: boolean;
  roles: string[];
  created_at: string;
  updated_at: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  size: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

const roleConfig = {
  admin: { label: "Administrator", color: "bg-red-50 text-red-700 border-red-200" },
  host: { label: "Host", color: "bg-blue-50 text-blue-700 border-blue-200" },
  reception: { label: "Reception", color: "bg-green-50 text-green-700 border-green-200" },
  secretary: { label: "Secretary", color: "bg-purple-50 text-purple-700 border-purple-200" },
  default: { label: "User", color: "bg-gray-50 text-gray-700 border-gray-200" },
};

export default function UsersTableClient({ token }: { token?: string }) {
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [searchInput, setSearchInput] = useState(""); // Input field value
  const [searchTerm, setSearchTerm] = useState(""); // Actual search term used in query
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [verifiedFilter, setVerifiedFilter] = useState<string | null>(null);

  // Manual search handler
  const handleSearch = () => {
    setPage(1);
    setSearchTerm(searchInput.trim());
  };

  // Clear search handler
  const handleClear = () => {
    setSearchInput("");
    setSearchTerm("");
    setPage(1);
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const { data, isLoading, isFetching, isError, refetch } = useQuery<UsersResponse>({
    queryKey: ["users", page, size, searchTerm, statusFilter, verifiedFilter],
    queryFn: async () => {
      if (!token) throw new Error("Unauthorized");

      const params: Record<string, any> = { page, size };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter === "active") params.is_active = true;
      if (statusFilter === "inactive") params.is_active = false;
      if (verifiedFilter === "verified") params.is_verified = true;
      if (verifiedFilter === "unverified") params.is_verified = false;

      const response = await client.getUsers(token, params);
      return response as UsersResponse;
    },
    placeholderData: (previousData) => previousData,
    enabled: !!token,
  });

  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];

    // Filter out system users
    const nonSystemUsers = data.users.filter((user) => !user.is_system_user);

    // Apply role filter
    return roleFilter
      ? nonSystemUsers.filter((user) => user.roles.includes(roleFilter))
      : nonSystemUsers;
  }, [data?.users, roleFilter]);

  const totalFiltered = filteredUsers.length;

  const getRoleBadge = (role: string) => {
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.default;
    return <Badge variant="outline" className={`${config.color} font-medium`}>{config.label}</Badge>;
  };

  const getStatusBadge = (isActive: boolean) => (
    <Badge variant="outline" className={`${isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"} font-medium flex items-center gap-1`}>
      {isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );

  const getVerificationBadge = (isVerified: boolean) => (
    <Badge variant="outline" className={`${isVerified ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-amber-50 text-amber-700 border-amber-200"} font-medium flex items-center gap-1`}>
      {isVerified ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
      {isVerified ? "Verified" : "Pending"}
    </Badge>
  );

  if (isError) {
    return (
      <Card className="w-full border-red-200">
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Users</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            We couldn't retrieve your team members. Please try again.
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Search and Filters Section */}
      <Card className="bg-linear-to-br from-white to-brand-primary/50 border-0 shadow-gren">
        <CardContent className="p-6 border-0">
          <div className="space-y-4">
            {/* Search Header */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Search className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Find Team Members</h3>
                <p className="text-sm text-gray-600">Search by name, email, or use filters</p>
              </div>
            </div>

            {/* Search Bar with Enhanced Design */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isFetching}
                    placeholder="Search team members by name or email..."
                    className="pl-11 pr-20 py-3 h-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 bg-white shadow-sm"
                  />
                  {/* Enhanced Clear and Search Buttons */}
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {searchInput && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={handleClear}
                        disabled={isFetching}
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                    <Button
                      onClick={handleSearch}
                      disabled={isFetching || !searchInput.trim()}
                      className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {isFetching ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Search className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Enhanced Filters Section */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters:
                  </div>

                  <Select
                    value={roleFilter || undefined}
                    onValueChange={(v) => {
                      setRoleFilter(v === "all" ? null : v);
                      setPage(1);
                    }}
                    disabled={isFetching}
                  >
                    <SelectTrigger className="w-full sm:w-44 rounded-xl border-gray-200 bg-white shadow-sm h-11">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-gray-500" />
                        <SelectValue placeholder="All Roles" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                      <SelectItem value="all" className="rounded-lg">All Roles</SelectItem>
                      <SelectItem value="admin" className="rounded-lg">Administrators</SelectItem>
                      <SelectItem value="host" className="rounded-lg">Hosts</SelectItem>
                      <SelectItem value="reception" className="rounded-lg">Reception</SelectItem>
                      <SelectItem value="secretary" className="rounded-lg">Secretaries</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={statusFilter || undefined}
                    onValueChange={(v) => {
                      setStatusFilter(v === "all" ? null : v);
                      setPage(1);
                    }}
                    disabled={isFetching}
                  >
                    <SelectTrigger className="w-full sm:w-40 rounded-xl border-gray-200 bg-white shadow-sm h-11">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-gray-500" />
                        <SelectValue placeholder="Status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                      <SelectItem value="all" className="rounded-lg">All Status</SelectItem>
                      <SelectItem value="active" className="rounded-lg">Active</SelectItem>
                      <SelectItem value="inactive" className="rounded-lg">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={verifiedFilter || undefined}
                    onValueChange={(v) => {
                      setVerifiedFilter(v === "all" ? null : v);
                      setPage(1);
                    }}
                    disabled={isFetching}
                  >
                    <SelectTrigger className="w-full sm:w-48 rounded-xl border-gray-200 bg-white shadow-sm h-11">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-gray-500" />
                        <SelectValue placeholder="Verification" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                      <SelectItem value="all" className="rounded-lg">All Users</SelectItem>
                      <SelectItem value="verified" className="rounded-lg">Verified</SelectItem>
                      <SelectItem value="unverified" className="rounded-lg">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Active Search and Filter Indicators */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Term Indicator */}
              {searchTerm && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1.5">
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                  Search: "{searchTerm}"
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-2 hover:bg-blue-100"
                    onClick={handleClear}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {/* Active Filters Count */}
              {(roleFilter || statusFilter || verifiedFilter) && (
                <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200 px-3 py-1.5">
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  Filters: {[roleFilter, statusFilter, verifiedFilter].filter(Boolean).length} active
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-2 hover:bg-gray-100"
                    onClick={() => {
                      setRoleFilter(null);
                      setStatusFilter(null);
                      setVerifiedFilter(null);
                      setPage(1);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {/* Loading Indicator */}
              {isFetching && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1.5">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Updating results...
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-semibold text-gray-900">Team Members</h4>
          <Badge variant="outline" className="bg-white text-gray-700 border-gray-200">
            {totalFiltered} {totalFiltered === 1 ? 'member' : 'members'}
          </Badge>
        </div>

        {isFetching && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span className="font-medium">Updating...</span>
          </div>
        )}
      </div>

      {/* Rest of the component remains exactly the same */}
      {/* Users Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-200">
              <TableHead className="px-6 py-4 font-semibold text-gray-700">Member</TableHead>
              <TableHead className="px-6 py-4 font-semibold text-gray-700">Contact</TableHead>
              <TableHead className="px-6 py-4 font-semibold text-gray-700">Status</TableHead>
              <TableHead className="px-6 py-4 font-semibold text-gray-700">Verification</TableHead>
              <TableHead className="px-6 py-4 font-semibold text-gray-700">Role</TableHead>
              <TableHead className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-t border-gray-100">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-6 py-16 text-center">
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        No team members found
                      </h3>
                      <p className="text-sm text-gray-500 max-w-md mx-auto">
                        {searchTerm || roleFilter || statusFilter || verifiedFilter
                          ? "Try adjusting your search or filters"
                          : "Start by inviting your first team member"}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                          alt={`${user.first_name} ${user.last_name}`}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                          {user.first_name[0]}{user.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{user.email}</span>
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <p className="text-sm text-gray-600 font-medium">{user.email}</p>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {getStatusBadge(user.is_active)}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {getVerificationBadge(user.is_verified)}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {getRoleBadge(user.roles[0])}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <EditUserModal
                        userId={user.id}
                        token={token!}
                        initialData={{
                          first_name: user.first_name,
                          last_name: user.last_name,
                          email: user.email,
                        }}
                      />
                      <UserActionsDropdown
                        userId={user.id}
                        token={token!}
                        currentRole={user.roles[0]}
                      />
                      <DeleteUserButton userId={user.id} token={token} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-6 px-2">
          <p className="text-sm text-gray-600">
            Page {data.page} of {data.pages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!data.has_prev || isFetching}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="h-9 px-3"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!data.has_next || isFetching}
              onClick={() => setPage((p) => p + 1)}
              className="h-9 px-3"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {!data && !isLoading && (
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Data</h3>
          <p className="text-sm text-gray-500 mb-6">Please check your connection and try again.</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
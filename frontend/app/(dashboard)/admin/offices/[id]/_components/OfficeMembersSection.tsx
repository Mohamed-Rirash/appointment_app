"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Search, X, Filter, Plus, Users, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AssignMemberModal } from "./AssignMemberModal";
import { useOfficeMembers } from "@/helpers/hooks/office/useOfficeMembers";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";

export interface User {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_primary: boolean;
    membership_active: boolean;
    membership_id: string;
    position: string;
    user_active: boolean;
}

export interface UnassignedUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
    is_verified: boolean;
}



export default function OfficeMembersSection({
    officeId,
    token,
}: {
    officeId: string;
    token?: string;
}) {
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const queryClient = useQueryClient();

    const { isLoading: membersLoading, members } = useOfficeMembers(officeId, token);

    const { data: unassignedData, isLoading: unassignedLoading } = useQuery({
        queryKey: ["unassigned-users"],
        queryFn: async () => {
            if (!token) throw new Error("Unauthorized");
            const response = await client.getUnassignedUsers(token);
            return response || [];
        },
        enabled: !!token,
    });

    // Mutations
    const updateMemberMutation = useMutation({
        mutationFn: async (data: { position: string; }) => {
            if (!selectedUser) throw new Error("No user selected");
            return await client.updatememberinOffice(officeId, selectedUser.user_id, data, token)

        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["office-members", officeId] });
            toast.success("Member updated successfully");
            setShowEditDialog(false);
            setSelectedUser(null);
        },
        onError: (error: any) => {
            console.log("err", error)
        },
    });

    const deleteMemberMutation = useMutation({
        mutationFn: async () => {
            if (!selectedUser) throw new Error("No user selected");
            return await client.removefromOffice(selectedUser.user_id, officeId, token)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["office-members", officeId] });
            toast.success("Member removed successfully");
            setShowDeleteDialog(false);
            setSelectedUser(null);
        },
        onError: (error: unknown) => {
            console.error("errr", error);
            const detail = isAxiosError<{ detail?: string }>(error)
                ? error.response?.data?.detail
                : undefined;
            toast.error(detail ?? "Failed to remove member. Please try again.");
        },
    });

    const handleSearch = () => {
        setSearchTerm(searchInput.trim());
    };

    const handleClear = () => {
        setSearchInput("");
        setSearchTerm("");
        setStatusFilter(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSearch();
    };

    const handleEditPosition = (user: User) => {
        setSelectedUser(user);
        setShowEditDialog(true);
    };

    const handleRemoveMember = (user: User) => {
        setSelectedUser(user);
        setShowDeleteDialog(true);
    };

    const filteredMembers = members.filter((user: User) => {
        const matchesSearch = !searchTerm ||
            user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = !statusFilter ||
            (statusFilter === "active" && user.user_active) ||
            (statusFilter === "inactive" && !user.user_active);

        return matchesSearch && matchesStatus;
    });

    const unassignedUsers = unassignedData || [];
    const filteredUnassigned = unassignedUsers.filter((user: UnassignedUser) => {
        const matchesSearch = !searchTerm ||
            user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    if (membersLoading || unassignedLoading) {
        return (
            <Card className="border-gray-200">
                <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Assign Button */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Office Members</h2>
                    <p className="text-brand-gray mt-1">Manage team members assigned to this office</p>
                </div>

                {filteredUnassigned.length > 0 && (
                    <Button
                        onClick={() => setShowAssignDialog(true)}
                        className="bg-brand hover:bg-brand/80 h-11 px-6 font-semibold"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Assign Member
                    </Button>
                )}
            </div>

            {/* Enhanced Search and Filters Card */}
            <Card className="bg-linear-to-br from-white to-brand-primary/20 border-brand-primary shadow-gren">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {/* Section Header */}
                        {/* Search and Filters Row */}
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Enhanced Search Bar */}
                            <div className="flex-1">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-brand transition-colors" />
                                    <Input
                                        placeholder="Search members by name or email..."
                                        className="pl-11 pr-20 py-3 h-12 text-base rounded-xl border-gray-200 focus:border-brand/80 focus:ring-brand/20 transition-all duration-200 bg-white shadow-sm"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        disabled={membersLoading}
                                    />
                                    {/* Enhanced Clear and Search Buttons */}
                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                                        {searchInput && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg transition-colors"
                                                onClick={() => setSearchInput("")}
                                                disabled={membersLoading}
                                            >
                                                <X className="h-4 w-4 text-gray-500" />
                                            </Button>
                                        )}
                                        <Button
                                            onClick={handleSearch}
                                            disabled={membersLoading || !searchInput.trim()}
                                            className="h-8 px-3 bg-brand/80 hover:bg-brand text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-gren"
                                        >
                                            <Search className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced Filters */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 font-medium">
                                        <SlidersHorizontal className="h-4 w-4" />
                                        Filters:
                                    </div>

                                    <Select
                                        value={statusFilter || undefined}
                                        onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}
                                    >
                                        <SelectTrigger className="w-full sm:w-44  rounded-xl border-gray-200 bg-white shadow-sm h-11">
                                            <div className="flex items-center gap-1">
                                                <Filter className="h-4 w-4 text-gray-500" />
                                                <SelectValue placeholder="Member Status" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl px-2 border-gray-200 shadow-gren">
                                            <SelectItem value="all" className="rounded-lg">All Members</SelectItem>
                                            <SelectItem value="active" className="rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    Active Members
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="inactive" className="rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                                    Inactive Members
                                                </div>
                                            </SelectItem>
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
                                        onClick={() => setSearchTerm("")}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Badge>
                            )}

                            {/* Status Filter Indicator */}
                            {statusFilter && statusFilter !== "all" && (
                                <Badge
                                    variant="secondary"
                                    className={`px-3 py-1.5 border ${statusFilter === "active"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-gray-50 text-gray-700 border-gray-200"
                                        }`}
                                >
                                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                                    Status: {statusFilter === "active" ? "Active" : "Inactive"}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 p-0 ml-2 hover:bg-gray-100"
                                        onClick={() => setStatusFilter(null)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Badge>
                            )}

                            {/* Clear All Button */}
                            {(searchTerm || statusFilter) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClear}
                                    className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                                >
                                    <X className="h-3.5 w-3.5 mr-1" />
                                    Clear all
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Members Card */}
            <Card className="border-gray-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg font-semibold">
                        Office Members ({filteredMembers.length})
                    </CardTitle>
                    <Badge variant="secondary" className="bg-brand-primary/20 text-brand border-blue-200">
                        <Users className="h-3 w-3 mr-1" />
                        {filteredUnassigned.length} available to assign
                    </Badge>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Members List */}
                    {filteredMembers.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 text-lg font-medium mb-2">
                                {searchTerm || statusFilter ? "No members match your search" : "No members assigned"}
                            </p>
                            <p className="text-gray-400 text-sm mb-4">
                                {searchTerm || statusFilter
                                    ? "Try adjusting your search criteria"
                                    : "Start by assigning members to this office"
                                }
                            </p>
                            {filteredUnassigned.length > 0 && (
                                <Button
                                    onClick={() => setShowAssignDialog(true)}
                                    className="bg-brand hover:bg-brand/80"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Assign Members
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredMembers.map((user: User) => (
                                <div key={user.user_id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-semibold text-gray-900">{user.first_name} {user.last_name}</h4>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-3">{user.email}</p>
                                            <div className="flex gap-2">
                                                <Badge variant="outline" className="text-xs bg-white">
                                                    {user.position}
                                                </Badge>
                                                <Badge className={
                                                    user.user_active
                                                        ? "bg-green-50 text-green-700 text-xs border-0"
                                                        : "bg-gray-50 text-gray-600 text-xs border-0"
                                                }>
                                                    {user.user_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg">
                                                <DropdownMenuItem
                                                    onClick={() => handleEditPosition(user)}
                                                    className="cursor-pointer rounded-lg"
                                                >
                                                    Edit Position
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600 cursor-pointer rounded-lg focus:text-red-600"
                                                    onClick={() => handleRemoveMember(user)}
                                                >
                                                    Remove from Office
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Assign Members Dialog */}
            <AssignMembersDialog
                open={showAssignDialog}
                onOpenChange={setShowAssignDialog}
                officeId={officeId}
                token={token}
                users={filteredUnassigned}
            />

            {/* Edit Member Dialog */}
            {selectedUser && (
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Member Position</DialogTitle>
                            <DialogDescription>
                                Update membership details for {selectedUser.first_name} {selectedUser.last_name}
                            </DialogDescription>
                        </DialogHeader>

                        <EditMemberForm
                            user={selectedUser}
                            onSave={(data) => updateMemberMutation.mutate(data)}
                            isLoading={updateMemberMutation.isPending}
                            onCancel={() => {
                                setShowEditDialog(false);
                                setSelectedUser(null);
                            }}
                        />
                    </DialogContent>
                </Dialog>
            )}

            {/* Delete Member Dialog */}
            {selectedUser && (
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Remove Member</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to remove {selectedUser.first_name} {selectedUser.last_name} from this office? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setShowDeleteDialog(false);
                                setSelectedUser(null);
                            }}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => deleteMemberMutation.mutate()}
                                disabled={deleteMemberMutation.isPending}
                            >
                                {deleteMemberMutation.isPending ? "Removing..." : "Remove Member"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

// The EditMemberForm 
function EditMemberForm({
    user,
    onSave,
    isLoading,
    onCancel,
}: {
    user: User;
    onSave: (data: { position: string; is_primary: boolean, is_active: boolean, ended_at: string }) => void;
    isLoading: boolean;
    onCancel: () => void;
}) {
    const [position, setPosition] = useState(user.position);
    const [isPrimary, setIsPrimary] = useState(user.is_primary);
    const [isActive, setIsActive] = useState(user.membership_active);
    const [opne, setOpen] = useState(false)
    useEffect(() => {
        setPosition(user.position);
        setIsPrimary(user.is_primary);
        setIsActive(user.membership_active);

    }, [user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const today = new Date();
        const endedAt = today.toISOString();
        onSave({
            position: position,
            is_primary: isPrimary,
            is_active: isActive,
            ended_at: endedAt
        });

    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                        id="position"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="Enter position"
                        required
                    />
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-brand hover:bg-brand/90">
                    {isLoading ? "Saving..." : "Save Changes"}
                </Button>
            </DialogFooter>
        </form>
    );
}

function AssignMembersDialog({
    open,
    onOpenChange,
    officeId,
    token,
    users,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    officeId: string;
    token?: string;
    users: UnassignedUser[];
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Assign Members to Office</DialogTitle>
                    <DialogDescription className="text-brand-gray">
                        Select team members to add to this office
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    {users.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No unassigned users available</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {users.map((user: UnassignedUser) => (
                                <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{user.first_name} {user.last_name}</h4>
                                            <p className="text-sm text-gray-500">{user.email}do</p>
                                            <Badge className={
                                                user.is_verified
                                                    ? "bg-blue-50 text-blue-700 text-xs mt-2"
                                                    : "bg-amber-50 text-amber-700 text-xs mt-2"
                                            }>
                                                {user.is_verified ? "Verified" : "Pending"}
                                            </Badge>
                                        </div>
                                        {/* <AssignMemberModal
                                            officeId={officeId}
                                            token={token}
                                            users={[user]}
                                            selectedUserId={user.id}
                                            onSuccess={() => onOpenChange(false)}
                                        /> */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
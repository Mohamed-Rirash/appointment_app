"use client";

import { useState } from "react";
import {
    Plus,
    Users,
    Building2,
    FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import CreateOfficeForm from "../offices/_components/officeForm";
import UserForm from "../members/_components/userForm";

export function QuickActions({ token }: { token: string | undefined }) {
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
    const [isOfficeDialogOpen, setIsOfficeDialogOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className="gap-2 bg-brand/90 hover:bg-brand text-white">
                        <Plus className="h-4 w-4" />
                        Quick Actions
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    {/* Create User - Opens Dialog */}
                    <DropdownMenuItem
                        onClick={() => setIsUserDialogOpen(true)}
                        className="flex items-center gap-3 cursor-pointer p-3"
                    >
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium">Create User</span>
                            <span className="text-xs text-muted-foreground">Add new system user</span>
                        </div>
                    </DropdownMenuItem>

                    {/* Create Office - Opens Dialog */}
                    <DropdownMenuItem
                        onClick={() => setIsOfficeDialogOpen(true)}
                        className="flex items-center gap-3 cursor-pointer p-3"
                    >
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Building2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium">Add Office</span>
                            <span className="text-xs text-muted-foreground">Create new office location</span>
                        </div>
                    </DropdownMenuItem>
                    {/* Generate Report - Coming Soon */}
                    <DropdownMenuItem className="flex items-center gap-3 p-3 text-brand-gray cursor-not-allowed">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <FileText className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium">Generate Report</span>
                            <Badge variant="outline" className="w-fit text-xs bg-orange-50 text-orange-600 border-orange-200">
                                Coming Soon
                            </Badge>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Create User Dialog */}
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            Create New User
                        </DialogTitle>
                        <DialogDescription>
                            Add a new user to the KulanDesk system with appropriate permissions and role.
                        </DialogDescription>
                    </DialogHeader>
                    <UserForm token={token} />
                </DialogContent>
            </Dialog>

            {/* Create Office Dialog */}
            <Dialog open={isOfficeDialogOpen} onOpenChange={setIsOfficeDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Building2 className="h-5 w-5 text-green-600" />
                            </div>
                            Create New Office
                        </DialogTitle>
                        <DialogDescription>
                            Add a new office location with complete details and configuration.
                        </DialogDescription>
                    </DialogHeader>
                    <CreateOfficeForm token={token} />
                </DialogContent>
            </Dialog>
        </>
    );
}
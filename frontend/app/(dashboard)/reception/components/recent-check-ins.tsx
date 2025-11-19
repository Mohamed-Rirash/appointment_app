"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, RotateCcw, Clock, UserCheck, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface CheckIn {
    id: string;
    appointment_id: string;
    citizen: {
        id: string;
        full_name: string;
        phone_number?: string;
    };
    checked_in_at: string;
    host: {
        id: string;
        full_name: string;
        position?: string;
    };
    time_slot: string;
}

interface RecentCheckInsProps {
    checkIns: CheckIn[];
}

export function RecentCheckIns({ checkIns }: RecentCheckInsProps) {
    const queryClient = useQueryClient();
    const router = useRouter();

    // Use dummy data with auto-refresh simulation
    const { data: recentCheckIns } = useQuery({
        queryKey: ["recent-check-ins"],
        queryFn: async () => {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            return checkIns;
        },
        initialData: checkIns,
        refetchInterval: 10000, // Refresh every 10 seconds
    });

    // Undo check-in mutation
    const undoCheckIn = useMutation({
        mutationFn: async (checkInId: string) => {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log(`Undoing check-in: ${checkInId}`);

            // Real implementation:
            // const res = await fetch(`/api/v1/reception/check-ins/${checkInId}/undo`, {
            //   method: "POST",
            // });
            // if (!res.ok) throw new Error("Failed to undo check-in");
            // return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recent-check-ins"] });
            queryClient.invalidateQueries({ queryKey: ["today-appointments"] });
        },
    });

    if (!recentCheckIns?.length) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <UserCheck className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No recent check-ins</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Citizen</TableHead>
                            <TableHead>Host</TableHead>
                            <TableHead>Time Slot</TableHead>
                            <TableHead>Checked In</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentCheckIns.map((checkIn: CheckIn) => (
                            <TableRow key={checkIn.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${checkIn.citizen.id}`}
                                            />
                                            <AvatarFallback>
                                                {checkIn.citizen.full_name
                                                    .split(" ")
                                                    .map(n => n[0])
                                                    .join("")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {checkIn.citizen.full_name}
                                            </p>
                                            {checkIn.citizen.phone_number && (
                                                <p className="text-xs text-muted-foreground">
                                                    {checkIn.citizen.phone_number}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div>
                                        <p className="text-sm font-medium">
                                            {checkIn.host.full_name}
                                        </p>
                                        {checkIn.host.position && (
                                            <p className="text-xs text-muted-foreground">
                                                {checkIn.host.position}
                                            </p>
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell className="font-medium">
                                    {checkIn.time_slot}
                                </TableCell>

                                <TableCell className="text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(checkIn.checked_in_at), "HH:mm")}
                                    </div>
                                </TableCell>

                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => router.push(`/reception/appointments/${checkIn.appointment_id}`)}
                                            >
                                                <Calendar className="mr-2 h-4 w-4" />
                                                View Appointment
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => console.log(`Print slip for ${checkIn.appointment_id}`)}
                                            >
                                                Print Slip
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-orange-600"
                                                onClick={() => undoCheckIn.mutate(checkIn.id)}
                                                disabled={undoCheckIn.isPending}
                                            >
                                                <RotateCcw className="mr-2 h-4 w-4" />
                                                {undoCheckIn.isPending ? "Undoing..." : "Undo Check-in"}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {recentCheckIns.map((checkIn: CheckIn) => (
                    <Card key={checkIn.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${checkIn.citizen.id}`}
                                    />
                                    <AvatarFallback>
                                        {checkIn.citizen.full_name
                                            .split(" ")
                                            .map(n => n[0])
                                            .join("")}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{checkIn.citizen.full_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {checkIn.time_slot}
                                    </p>
                                </div>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => undoCheckIn.mutate(checkIn.id)}
                                        disabled={undoCheckIn.isPending}
                                    >
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Undo Check-in
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Host:</span>
                                <span className="font-medium">{checkIn.host.full_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Checked In:</span>
                                <Badge variant="default">
                                    {format(new Date(checkIn.checked_in_at), "HH:mm")}
                                </Badge>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
                <p>Last updated: {format(new Date(), "HH:mm:ss")}</p>
                <p>Total: {recentCheckIns.length} checked in</p>
            </div>
        </div>
    );
}
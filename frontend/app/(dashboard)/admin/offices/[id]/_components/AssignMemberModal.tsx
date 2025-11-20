"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { client } from "@/helpers/api/client";
import toast from "react-hot-toast";
import { Loader2, UserPlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const assignSchema = z.object({
    user_id: z.string().min(1, "Please select a user"),
    position: z.string().min(3, "Position must be at least 3 characters"),
});

type AssignFormData = z.infer<typeof assignSchema>;

interface AssignMemberModalProps {
    officeId: string;
    token?: string;
    users: any[];
    selectedUserId?: string;
    onSuccess?: () => void;
}

export function AssignMemberModal({
    officeId,
    token,
    users,
    selectedUserId,
    onSuccess,
}: AssignMemberModalProps) {
    const queryClient = useQueryClient();

    const form = useForm<AssignFormData>({
        resolver: zodResolver(assignSchema),
        defaultValues: {
            user_id: selectedUserId || "",
            position: "",
        },
    });

    const onSubmit = async (values: AssignFormData) => {
        try {
            const result = await client.assigntoOffice(values, officeId, token);
            toast.success(result.message || "Member assigned successfully");

            // Refresh both lists
            queryClient.invalidateQueries({ queryKey: ["office-members", officeId] });
            queryClient.invalidateQueries({ queryKey: ["unassigned-users"] });

            form.reset();
            onSuccess?.();
        } catch (error: any) {
            toast.error(error.message || "Failed to assign member");
        }
    };

    const user = users?.find(u => u.id === form.watch('user_id'));

    return (
        <Dialog>
            <DialogTrigger asChild>
                {selectedUserId ? (
                    <Button size="sm" variant="outline">Assign</Button>
                ) : (
                    <Button size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign Member
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign Member to Office</DialogTitle>
                    <DialogDescription>
                        Add a team member with a specific position
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {!selectedUserId && (
                            <FormField
                                control={form.control}
                                name="user_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Select User</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={!!selectedUserId}>
                                            <FormControl>
                                                <SelectTrigger className="h-10 rounded-lg border-gray-300">
                                                    <SelectValue placeholder="Choose a user" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {users.map((user) => (
                                                    <SelectItem key={user.id} value={user.id}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{user.first_name} {user.last_name}</span>
                                                            <span className="text-xs text-gray-500">{user.email}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {selectedUserId && user && (
                            <div className="rounded-lg bg-gray-50 p-3">
                                <p className="text-sm text-gray-600">Selected User</p>
                                <p className="font-medium">{user.first_name} {user.last_name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="position"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Position</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Senior Minister, Coordinator" {...field} />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Role or title within this office
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => form.reset()}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-brand hover:bg-brand/80">
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Assigning...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Assign Member
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
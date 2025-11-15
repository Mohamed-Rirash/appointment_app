// app/offices/[id]/components/AssignMemberModal.tsx
"use client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { User } from "lucide-react";
import toast from "react-hot-toast";
export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
}

const assignSchema = z.object({
    user_id: z.string().min(1, "User is required"),
    position: z.string().min(5, "text should 5letter long")
});
type AssignFormData = z.infer<typeof assignSchema>;
export function AssignMemberModal({
    officeId,
    token,
    users
}: {
    officeId: string;
    token?: string;
    users: User[]
}) {
    const [open, setOpen] = useState(false);

    console.log("role ass", users)
    const form = useForm<AssignFormData>({
        resolver: zodResolver(assignSchema),
        defaultValues: {
            user_id: "",
            position: "",
        },
    });
    async function onSubmit(values: AssignFormData) {
        console.log("Assigning:", values, officeId);

        const result = await client.assigntoOffice(values, officeId, token)
        console.log("resultTHEWAY", result)
        toast.success(result.message)
        setOpen(false);
        form.reset();
    }
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-brand hover:text-green-600"
                >
                    <User className="w-5! h-5!" />
                    Assign Member
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign Member to Office</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
                        <FormField
                            control={form.control}
                            name="user_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>User</FormLabel>
                                    <FormControl>
                                        <select
                                            className="w-full p-2 border border-[#eeeeee] rounded-md"
                                            {...field}
                                        >
                                            <option value="">Select a user</option>
                                            {users?.map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.first_name} {user.last_name} ({user.email})
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="position"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Position</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g Minister" {...field} className="py-5" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full mt-6 bg-brand hover:bg-brand/90 py-6">
                            Assign Member
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
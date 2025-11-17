"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { client } from "@/helpers/api/client";

// Validation schema
const setPasswordSchema = z
    .object({
        password: z
            .string()
            .min(6, "Password must be at least 6 characters")
            .regex(/[A-Z]/, "Must contain an uppercase letter")
            .regex(/[0-9]/, "Must contain a number")
            .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type SetPasswordFormValues = z.infer<typeof setPasswordSchema>;

export default function SetPasswordPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState("");

    const form = useForm<SetPasswordFormValues>({
        resolver: zodResolver(setPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });
    const router = useRouter()

    async function onSubmit(values: SetPasswordFormValues) {
        if (!token || !email) {
            setError("Invalid or missing token/email.");
            return;
        }
        if (!values.password) {
            setError("Invalid or missing.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await client.setPassword({
                token,
                new_password: values.password,
            });
            if (result.message) {
                toast.success(result.message);
                setMessage(result.message);
                setSuccess(true);

                console.log("res", result);
            }

        } catch (err: unknown) {
            const message =
                (err instanceof Error && err.message) ||
                "Failed to set password. Please try again.";
            setError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-gren border border-[#eeeeee] text-center">
                    <h1 className="text-2xl font-bold text-brand-black mb-2">Password Set!</h1>
                    <p className="text-brand-gray">
                        {message} You can now log in.
                    </p>
                    <Button
                        className="mt-6 w-full bg-linear-to-r from-[#29E05F] to-[#0F9938] text-white"
                        onClick={() => {
                            router.push("/Signin")
                        }}
                    >
                        Go to Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-gren border border-[#eeeeee]">
                <h1 className="text-2xl font-bold text-brand-black mb-2">Set Your Password</h1>
                <p className="text-brand-gray mb-6">
                    Create a strong password for your account. for <span className="font-bold">{email}</span>
                </p>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            required
                                            type="password"
                                            placeholder="••••••••"
                                            className="py-6 pl-4 text-lg rounded-[4px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            className="py-6 pl-4 text-lg rounded-[4px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full mt-6 py-7 bg-linear-to-r from-[#29E05F] to-[#0F9938] text-white font-bold text-lg"
                        >
                            {isSubmitting ? "Setting Password..." : "Set Password"}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
}
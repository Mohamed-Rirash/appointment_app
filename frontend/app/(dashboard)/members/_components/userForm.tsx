"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { client } from "@/helpers/api/client";
import toast from "react-hot-toast";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Validation schema
const userSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  role: z
    .enum(["admin", "host", "reception", "secretary", ""])
    .refine((val) => val !== undefined, { message: "Please select a role" }),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UserForm({ token }: { token?: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      role: "",
    },
  });

  async function onSubmit(data: UserFormData) {
    setIsSubmitting(true);
    if (data.role === "") {
      setError("Please select a role");
      setIsSubmitting(false);
      return;
    }
    const userdata = {
      ...data,
      is_active: true,
      is_verified: false,
      send_welcome_email: true,
    };

    try {
      await client.createUser(userdata, token);
      toast.success(
        `User ${data.first_name} ${data.last_name} has been added.`
      );

      form.reset();
    } catch (err: any) {
      const errorMessage =
        err.message ||
        "Failed to create user. Please check the email and try again.";

      toast.error(`Error creating user ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-md w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* First Name */}
          {error && (
            <Alert variant="destructive" className="mb-6 animate-in fade-in-0">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[16px] font-medium text-brand-black">
                  First Name
                </FormLabel>
                <FormControl>
                  <Input
                    className="py-6 pl-4 text-lg"
                    placeholder="John"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Last Name */}
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[16px] font-medium text-brand-black">
                  Last Name
                </FormLabel>
                <FormControl>
                  <Input
                    className="py-6 pl-4 text-lg"
                    placeholder="Doe"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[16px] font-medium text-brand-black">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    className="py-6 pl-4 text-lg"
                    placeholder="john.doe@gmail.com"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Role */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[16px] font-medium text-brand-black">
                  Role
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-14 w-full py-6 pl-4 text-lg">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="font-medium text-[14px] text-brand-black">
                        user roles
                      </SelectLabel>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="host">Host</SelectItem>
                      <SelectItem value="reception">Reception</SelectItem>
                      <SelectItem value="secretary">Secretary</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 py-7 bg-linear-to-r from-[#24C453] to-[#24C453] text-lg font-bold text-white hover:from-[#1fb048] hover:to-[#1fb048]"
          >
            {isSubmitting ? (
              <>
                Creating <Spinner className="ml-2 h-4 w-4 text-white" />
              </>
            ) : (
              "Create User"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

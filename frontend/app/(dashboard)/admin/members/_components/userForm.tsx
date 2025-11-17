"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { AlertCircle, Shield } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

// Validation schema
const userSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  roles: z
    .enum(["admin", "host", "reception", "secretary", ""])
    .refine((val) => val !== undefined, { message: "Please select a role" }),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UserForm({ token }: { token: string | undefined }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      roles: "",
    },
  });

  async function onSubmit(data: UserFormData) {
    setIsSubmitting(true);
    if (data.roles === "") {
      setError("Please select a role");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await client.createUser(data, token);
      toast.success(
        `User ${data.first_name} ${data.last_name} has been added.`
      );
      // console.log("r", result)
      queryClient.invalidateQueries({ queryKey: ["users"] });

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
            name="roles"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  Role & Permissions
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full py-5 text-base rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors">
                      <SelectValue placeholder="Choose a role for this member" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-lg border-gray-300 shadow-lg">
                    <SelectGroup>
                      <SelectLabel className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                        Available Roles
                      </SelectLabel>
                      <SelectItem value="admin" className="text-base py-3 hover:bg-blue-50">
                        <div className="flex flex-col">
                          <span className="font-semibold text-brand-black">Administrator</span>
                          <span className="text-xs text-brand-gray">Full system access</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="host" className="text-base py-3 hover:bg-blue-50">
                        <div className="flex flex-col text-start">
                          <span className="font-semibold text-brand-black">Host</span>
                          <span className="text-xs text-brand-gray">Manage appointments & visitors</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="reception" className="text-base py-3 hover:bg-blue-50">
                        <div className="flex flex-col text-start">
                          <span className="font-semibold text-brand-black">Reception</span>
                          <span className="text-xs text-brand-gray">Check-in & front desk operations</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="secretary" className="text-base py-3 hover:bg-blue-50">
                        <div className="flex flex-col text-start">
                          <span className="font-semibold text-brand-black">Secretary</span>
                          <span className="text-xs text-brand-gray">Administrative support</span>
                        </div>
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs text-gray-500">
                  Defines what this team member can access and manage.
                </FormDescription>
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

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Pencil, User, Mail, Loader2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEditUser } from "@/helpers/hooks/useEditUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Validation schema
const editUserSchema = z.object({
  first_name: z.string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  last_name: z.string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z.string()
    .email("Please enter a valid email address")
    .min(5, "Email is too short")
    .max(100, "Email must be less than 100 characters"),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
  userId: string;
  initialData: EditUserFormData;
  token: string;
  onSuccess?: () => void;
}

export function EditUserModal({
  userId,
  initialData,
  token,
  onSuccess,
}: EditUserModalProps) {
  const { updateUser, isUpdating } = useEditUser(token);
  const [open, setOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: initialData,
    mode: "onBlur",
  });

  // Reset form and error when dialog opens
  useEffect(() => {
    if (open) {
      form.reset(initialData);
      setApiError(null);
    }
  }, [open, initialData, form]);

  // Close dialog on success
  useEffect(() => {
    if (!isUpdating && !apiError && open) {
      // This would be better handled by returning a promise from useEditUser
    }
  }, [isUpdating, apiError, open]);

  const onSubmit = async (data: EditUserFormData) => {
    setApiError(null);

    // Domain validation - configurable via env or prop
    const allowedDomains = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS?.split(',') ||
      ["gmail.com", "amoud.org"];
    const domain = data.email.split("@")[1]?.toLowerCase();

    if (!domain || !allowedDomains.includes(domain)) {
      const domainList = allowedDomains.join(', @');
      setApiError(`Only email addresses from @${domainList} are allowed.`);
      form.setError("email", {
        message: `Email must be from: @${domainList}`
      });
      return;
    }

    const success = await updateUser(userId, data);
    if (success) {
      setOpen(false);
      onSuccess?.();
    } else {
      setApiError("Failed to update user. Please try again.");
    }
  };

  // Check if form has changes
  const hasChanges = form.formState.isDirty;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-brand hover:text-brand/80 hover:bg-brand-primary/50 px-2 py-1 text-sm font-medium transition-colors"
        >
          <Pencil className="h-4 w-4 mr-1.5" />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0 bg-white custom-scrollbar"
      >
        {/* Custom scrollbar styles */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}</style>

        <DialogHeader className="p-6 bg-linear-to-r from-brand-primary/10 to-brand-primary border-0 sticky top-0 bg-white z-10">
          <DialogTitle className="text-2xl font-bold text-brand-black flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <User className="h-5 w-5 text-brand" />
            </div>
            Edit Team Member
          </DialogTitle>
          <DialogDescription className="text-brand-gray mt-1">
            Update the details for {initialData.first_name} {initialData.last_name}
          </DialogDescription>
        </DialogHeader>

        {/* API Error Alert */}
        {apiError && (
          <div className="px-6 pt-4">
            <Alert variant="destructive" className="animate-in fade-in-0">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Update Failed</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="p-6 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Avatar Preview */}
              <div className="flex justify-center mb-2">
                <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${form.watch('email')}`}
                    alt={`${form.watch('first_name')} ${form.watch('last_name')}`}
                  />
                  <AvatarFallback className="bg-linear-to-br from-brand/20 to-brand text-white text-2xl font-bold">
                    {form.watch('first_name')?.[0]}{form.watch('last_name')?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* First Name */}
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-brand-black flex items-center gap-2">
                      <User className="h-4 w-4 text-brand-gray" />
                      First Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter first name"
                        className="h-11 text-base rounded-sm border-brand-secondary focus:border-brand/80 focus:ring-brand transition-colors"
                        disabled={isUpdating}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-brand-gray">
                      Legal first name as it appears on official documents.
                    </FormDescription>
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
                    <FormLabel className="text-sm font-semibold text-brand-black flex items-center gap-2">
                      <User className="h-4 w-4 text-brand-gray" />
                      Last Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter last name"
                        className="h-11 text-base rounded-sm border-brand-secondary focus:border-brand/80 focus:ring-brand transition-colors"
                        disabled={isUpdating}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-brand-gray">
                      Family name or surname.
                    </FormDescription>
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
                    <FormLabel className="text-sm font-semibold text-brand-black flex items-center gap-2">
                      <Mail className="h-4 w-4 text-brand-gray" />
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.doe@company.com"
                        className="h-11 text-base rounded-sm border-brand-secondary focus:border-brand/80 focus:ring-brand transition-colors"
                        disabled={isUpdating}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-brand-gray">
                      This email will be used for login and notifications.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isUpdating}
                  className="h-11 px-6 rounded-sm border-brand-secondary hover:bg-brand-secondary/50 font-medium"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isUpdating || !hasChanges}
                  className="h-11 px-6 bg-linear-to-r from-brand/70 to-brand hover:from-brand/80 hover:to-brand text-white font-semibold rounded-sm transition-all"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving Changes
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
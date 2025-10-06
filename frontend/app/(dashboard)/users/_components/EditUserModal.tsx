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
import { AlertCircle, Pencil } from "lucide-react";
import { useEditUser } from "@/hooks/useEditUser";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

const editUserSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

export function EditUserModal({
  userId,
  initialData,
  token,
}: {
  userId: string;
  initialData: EditUserFormData;
  token: string;
}) {
  const { updateUser, isUpdating } = useEditUser(token);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: initialData,
  });

  async function onSubmit(data: EditUserFormData) {
    // Domain validation

    const allowedDomains = ["gmail.com", "amoud.org"];
    const domain = data.email.split("@")[1]?.toLowerCase();
    console.log("DDD", domain);
    if (!domain || !allowedDomains.includes(domain)) {
      setError(
        "Only email addresses from @gmail.com or @amoud.org are allowed."
      );

      return;
    }

    const success = await updateUser(userId, data);
    if (success) {
      setOpen(false);
      form.reset(data);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-brand hover:text-green-600 hover:bg-green-50 px-2 py-1 text-sm"
        >
          <Pencil className="h-4 w-4 mr-1 text-green-500" />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          {error && (
            <Alert variant="destructive" className="mb-6 animate-in fade-in-0">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input
                      className="py-6 text-[16px] rounded-[4px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input
                      className="py-6 text-[16px]  rounded-[4px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      className="py-6 text-[16px]  rounded-[4px]"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className=" py-6 px-6 text-lg font-bold]"
                onClick={() => setOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                className="py-6 bg-gradient-to-r from-[#24C453] to-[#24C453] text-lg font-bold text-white hover:from-[#1fb048] hover:to-[#1fb048]"
                type="submit"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    Saving... <Spinner className="ml-2 h-4 w-4 text-white" />
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

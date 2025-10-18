"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { client } from "@/helpers/api/client";

const officeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
});

type OfficeFormData = z.infer<typeof officeSchema>;

export default function CreateOfficeForm({ token }: { token?: string }) {
  const queryClient = useQueryClient();
  const form = useForm<OfficeFormData>({
    resolver: zodResolver(officeSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: OfficeFormData) => {
      return await client.createOffice(data, token);
    },
    onSuccess: (data) => {
      toast.success("Office created successfully!");
      queryClient.invalidateQueries({ queryKey: ["offices"] });
      form.reset();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create office");
    },
  });

  async function onSubmit(values: OfficeFormData) {
    console.log("value::", values);
    mutation.mutate(values);
  }

  return (
    <div className="">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-black">Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Ministry of Health"
                    className="py-6 pl-4 text-lg rounded-[4px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-black">Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., Ministry of Health Headquarters, Hargeisa"
                    className="py-6 pl-4 text-lg rounded-[4px] h-[96px] shadow-gren"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-black">Location</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., HQ Building, Hargeisa"
                    className="py-6 pl-4 text-lg rounded-[4px] "
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full mt-6 py-7 combined-shadow bg-gradient-green text-lg font-bold text-white hover:from-[#3CEA6F] hover:to-[#15A940]"
          >
            {mutation.isPending ? "Creating..." : "Create Office"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

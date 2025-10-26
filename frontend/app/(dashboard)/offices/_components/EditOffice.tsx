"use client";

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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import z from "zod";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEditOffice } from "@/helpers/hooks/office/useEditOffice";

const officeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
});

interface Office {
  id: string;
  name: string;
  description: string;
  location: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type OfficeFormData = z.infer<typeof officeSchema>;

export function EditOffice({

  initialData,
  token,
}: {
  initialData: Office;
  token?: string;
}) {
  const { editOffice, loading } = useEditOffice(token);
  const [isOpen, setIsOpne] = useState(false)

  const form = useForm<OfficeFormData>({
    resolver: zodResolver(officeSchema),
    defaultValues: initialData,
  });

  async function onSubmit(values: OfficeFormData) {
    console.log("value::", values);
    const success = await editOffice(initialData.id, values);
    if (success) {
      setIsOpne(false)
      form.reset()
    }
  }

  return (
    <>

      <Dialog
        open={isOpen} onOpenChange={setIsOpne}
      >
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-green-600 hover:text-green-700"

          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent className="p-6 max-w-[368px] w-full">
          <DialogTitle className="text-lg mb-0 font-bold text-center text-brand-black">
            Edit Office
          </DialogTitle>

          <DialogDescription className="text-[14px] max-w-[320px] w-full mx-auto text-center leading-[16px] text-brand-gray">
            Update the office's information
          </DialogDescription>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 mt-6"
            >

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-brand-black">Name</FormLabel>
                    <FormControl>
                      <Input
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-brand-black">
                      Description
                    </FormLabel>
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-7 combined-shadow bg-gradient-green text-lg font-bold text-white hover:from-[#3CEA6F] hover:to-[#15A940]"
              >
                {loading ? "Editing..." : "Edit Office"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

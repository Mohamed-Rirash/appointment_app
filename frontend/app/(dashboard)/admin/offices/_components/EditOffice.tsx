"use client";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import z from "zod";
import { Pencil, Building2, MapPin, FileText, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, DialogHeader } from "@/components/ui/dialog";
import { useEditOffice } from "@/helpers/hooks/office/useEditOffice";
import { Card, CardContent } from "@/components/ui/card";

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
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<OfficeFormData>({
    resolver: zodResolver(officeSchema),
    defaultValues: initialData,
  });

  async function onSubmit(values: OfficeFormData) {
    console.log("value::", values);
    const success = await editOffice(initialData.id, values);
    if (success) {
      setIsOpen(false);
      form.reset();
    }
  }

  // Reset form when dialog opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      form.reset(initialData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-brand hover:text-brand/90 w-full flex items-center justify-start px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit Office
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

        <DialogHeader className="p-6 pb-4 bg-linear-to-r from-brand-primary/20 to-brand-primary">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary rounded-xl shadow-gren">
              <Building2 className="h-6 w-6 text-brand" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-gray-900">
                Edit Office
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                Update the details for {initialData.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <CardContent className="p-6 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Office Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      Office Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter office name"
                        className="h-11 text-base rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500">
                      The official name of this office location
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      Location
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., HQ Building, Hargeisa"
                        className="h-11 text-base rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500">
                      Physical address or building name
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Ministry of Health Headquarters, Hargeisa"
                        className="min-h-[100px] text-base rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 resize-none"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500">
                      Brief description of this office's purpose or features
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="flex-1 h-11 rounded-lg border-gray-300 hover:bg-gray-50 font-medium transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 bg-brand hover:brand/90 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating Office...
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Update Office
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import {
  CalendarIcon,
  CheckCircle2,
  Edit2,
  User,
  Phone,
  Mail,
  FileText,
  Clock,
} from "lucide-react";
import { cn } from "@/libs/utils";
import { client } from "@/helpers/api/client";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";
import { useLocalDate } from "@/helpers/hooks/useLocalDate";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";

// Zod schemas for validation
const formSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine((value) => {
      const digitsOnly = value.replace(/\D/g, "");
      return digitsOnly.length === 10 && digitsOnly.startsWith("063");
    }, "Phone format must start with 063 followed by 7 digits. Example: 063 123 4567"),
  purpose: z.string().min(5, "Purpose must be at least 5 characters"),
  date: z.date("Date is required"),
  timeSlot: z.string().min(1, "Time slot is required"),
});

type FormData = z.infer<typeof formSchema>;

interface MultiStepFormProps {
  host_id: string;
  office_id: string;
  token: string | undefined;
}

interface Slots {
  date: string;
  slot_start: string;
  slot_end: string;
  is_booked: boolean;
}

export default function AddForm({
  office_id,
  host_id,
  token,
}: MultiStepFormProps) {
  const [step, setStep] = useState(1);
  const [timeSlots, setTimeSlots] = useState<Slots[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const tomorrow = addDays(new Date(), 1);
  const today = new Date();
  const queryClient = useQueryClient();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      purpose: "",
      date: tomorrow,
      timeSlot: "",
    },
    mode: "onChange",
  });

  const {
    watch,
    trigger,
    formState: { isValid },
  } = form;
  const formData = watch();

  const localDate = useLocalDate(formData.date);

  // Load time slots when office or date changes
  useEffect(() => {
    if (!office_id || !host_id || !localDate) {
      setTimeSlots([]);
      return;
    }

    console.log("Selected local date:", localDate);

    const loadSlots = async () => {
      setLoadingSlots(true);
      try {
        const data = await client.getSlotAvailability(
          office_id,
          localDate,
          token
        );
        console.log("Available slots:", data);
        setTimeSlots(data);
      } catch (err) {
        console.error("Failed to load slots:", err);
        setTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };


    loadSlots()

  }, [office_id, localDate, host_id, token]);

  // Format phone number
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 0) return "";
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6)
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6,
      10
    )}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    form.setValue("phone", formatted, { shouldValidate: true });
  };

  const nextStep = async () => {
    let fields: (keyof FormData)[] = [];

    if (step === 1) {
      fields = ["firstName", "lastName", "email", "phone"];
    } else if (step === 2) {
      fields = ["purpose"];
    } else if (step === 3) {
      fields = ["date", "timeSlot"];
    }

    const isValid = await trigger(fields);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleEditStep = (stepNum: number) => {
    setStep(stepNum);
  };

  const onSubmitForm = async (data: FormData) => {
    setLoading(true);

    try {
      const requestData = {
        citizen: {
          firstname: data.firstName,
          lastname: data.lastName,
          email: data.email,
          phone: data.phone,
        },
        appointment: {
          host_id: host_id,
          office_id: office_id,
          purpose: data.purpose,
          appointment_date: data.date.toISOString(),
          time_slotted: data.timeSlot,
          status: "PENDING" as const,
        },
      };

      console.log("Sending to backend:", requestData);
      const response = await client.createAppointment(requestData, token);

      console.log("Success:", response);
      toast.success("Appointment created successfully!");
      form.reset();
      setStep(1);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch (error: any) {
      console.error("Error submitting form:", error);

      // Extract the actual error message
      let errorMessage = "Failed to create appointment. Please try again.";

      if (error.message) {
        errorMessage = error.message;

        // If it's a validation error about email, highlight the field
        if (error.message.toLowerCase().includes('email')) {
          form.setError("email", {
            type: "manual",
            message: "Please enter a valid email address with @ symbol",
          });
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  //
  const formatTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
    } catch {
      return timeString;
    }
  };

  const getStepIcon = (stepNum: number) => {
    switch (stepNum) {
      case 1:
        return <User className="w-4 h-4" />;
      case 2:
        return <FileText className="w-4 h-4" />;
      case 3:
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-sm border-border/50">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <User className="w-6 h-6 text-brand" />
            Create Citizen Appointment
          </CardTitle>
          <CardDescription className="text-base">
            Complete all steps to schedule an appointment for a citizen
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {/* Step Progress */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex justify-between items-center w-full max-w-md">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full font-semibold transition-all border-2",
                        stepNum <= step
                          ? "bg-brand text-primary-foreground border-brand"
                          : stepNum === step
                            ? "border-brand bg-background text-brand"
                            : "bg-muted text-muted-foreground border-muted"
                      )}
                    >
                      {getStepIcon(stepNum)}
                    </div>
                    <span
                      className={cn(
                        "text-xs mt-2 font-medium",
                        stepNum <= step
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {stepNum === 1 && "Citizen Info"}
                      {stepNum === 2 && "Purpose"}
                      {stepNum === 3 && "Schedule"}
                    </span>
                  </div>
                  {stepNum < 3 && (
                    <div
                      className={cn(
                        "flex-1 h-1 mx-4 transition-colors",
                        stepNum < step ? "bg-brand" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmitForm)}
              className="space-y-8"
            >
              {/* STEP 1: Citizen Information */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <User className="w-5 h-5 text-brand" />
                      Citizen Information
                    </h3>
                    <p className="text-muted-foreground">
                      Enter the citizen's personal details for the appointment
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="(063) 123-4567"
                              value={field.value}
                              onChange={handlePhoneChange}
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
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email (Optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="citizen@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Purpose */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <FileText className="w-5 h-5 text-brand" />
                      Visit Purpose
                    </h3>
                    <p className="text-muted-foreground">
                      Describe the reason for the citizen's visit
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose of Visit</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please describe the purpose of the visit in detail..."
                            className="min-h-[120px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* STEP 3: Date & Time Selection */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-brand" />
                      Schedule Appointment
                    </h3>
                    <p className="text-muted-foreground">
                      Select the date and time for the citizen's appointment
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Calendar Section */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Select Date</FormLabel>
                            <div className="border rounded-lg p-4">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  if (date && date >= today) {
                                    field.onChange(date);
                                  }
                                }}
                                disabled={(date) => date < today}
                                className="rounded-md"
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {formData.date && (
                        <Badge variant="secondary" className="w-fit">
                          Selected: {format(formData.date, "PPP")}
                        </Badge>
                      )}
                    </div>

                    {/* Time Slots Section */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="timeSlot"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Available Time Slots</FormLabel>
                            <FormControl>
                              <div className="space-y-3">
                                {loadingSlots ? (
                                  <div className="grid grid-cols-2 gap-3">
                                    {[...Array(6)].map((_, i) => (
                                      <div
                                        key={i}
                                        className="h-14 bg-muted rounded-lg animate-pulse"
                                      />
                                    ))}
                                  </div>
                                ) : timeSlots?.length > 0 ? (
                                  <div className="grid grid-cols-2 gap-3">
                                    {timeSlots.map((slot) => {
                                      const isSelected =
                                        field.value === slot.slot_start;
                                      const isBooked = slot.is_booked;

                                      return (
                                        <Button
                                          key={slot.slot_start}
                                          type="button"
                                          disabled={isBooked}
                                          variant={
                                            isSelected ? "default" : "outline"
                                          }
                                          onClick={() =>
                                            !isBooked &&
                                            field.onChange(slot.slot_start)
                                          }
                                          className={cn(
                                            "h-14 flex-col gap-1 relative transition-all",
                                            isBooked &&
                                            "opacity-50 cursor-not-allowed",
                                            isSelected &&
                                            "bg-brand text-primary-foreground"
                                          )}
                                        >
                                          <span className="font-semibold text-sm">
                                            {formatTime(slot.slot_start)}
                                          </span>
                                          {isBooked && (
                                            <Badge
                                              variant="secondary"
                                              className="absolute -top-1 -right-1 h-4 text-xs"
                                            >
                                              Booked
                                            </Badge>
                                          )}
                                        </Button>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg bg-muted/20">
                                    <CalendarIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-60" />
                                    <p className="text-muted-foreground font-medium mb-1">
                                      No available slots
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Please select a different date
                                    </p>
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {formData.timeSlot && (
                        <Badge variant="secondary" className="w-fit">
                          Selected time: {formatTime(formData.timeSlot)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CONFIRMATION VIEW */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold text-green-600 mb-2">
                      Review Appointment Details
                    </h3>
                    <p className="text-muted-foreground">
                      Please verify all information before creating the
                      appointment
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Citizen Information
                        </CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditStep(1)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="font-semibold">
                          {formData.firstName} {formData.lastName}
                        </p>
                        <p className="text-sm">{formData.phone}</p>
                        {formData.email && (
                          <p className="text-sm">{formData.email}</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Visit Details
                        </CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditStep(2)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{formData.purpose}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Schedule
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStep(3)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <p className="text-sm">
                        <strong>Date:</strong> {format(formData.date, "PPPP")}
                      </p>
                      <p className="text-sm">
                        <strong>Time:</strong> {formatTime(formData.timeSlot)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 justify-between pt-6 border-t">
                {step > 1 && step < 4 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                )}

                {step < 3 && (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="ml-auto bg-brand hover:bg-brand/90"
                  >
                    Continue
                  </Button>
                )}

                {step === 3 && (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="ml-auto bg-brand hover:bg-brand/90"
                  >
                    Review Appointment
                  </Button>
                )}

                {step === 4 && (
                  <div className="flex gap-3 ml-auto">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-brand hover:bg-brand/90"
                    >
                      {loading
                        ? "Creating Appointment..."
                        : "Confirm Appointment"}
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

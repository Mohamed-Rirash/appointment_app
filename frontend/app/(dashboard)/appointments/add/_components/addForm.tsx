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
import { CalendarIcon, CheckCircle2, Edit2 } from "lucide-react";
import { cn } from "@/libs/utils";
import { client } from "@/helpers/api/client";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";


// Zod schemas for validation
const formSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z
    .string()
    .min(1, "Telefoonka waa lagama maarmaanka ah")
    .refine((value) => {
      const digitsOnly = value.replace(/\D/g, "");
      return digitsOnly.length === 10 && digitsOnly.startsWith("063");
    }, "Foomka telefoonka waa 063 oo lagu daro 7 lambar. Tusaale: 063 123 4567"),
  purpose: z.string().min(5, "Purpose must be at least 5 characters"),
  date: z.date( "Date is required" ),
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

// Mock time slots data
const MOCK_TIME_SLOTS = [
  { id: "1", start_time: "09:00", end_time: "09:30" },
  { id: "2", start_time: "10:00", end_time: "10:30" },
  { id: "3", start_time: "11:00", end_time: "11:30" },
  { id: "4", start_time: "14:00", end_time: "14:30" },
  { id: "5", start_time: "15:00", end_time: "15:30" },
];

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
  // console.log("DATAA", formData)
  // console.log("office", office_id)
  // console.log("host", host_id)
  // console.log("name", hostName)
  // console.log("tok", token)

  // Load time slots when office or date changes
  // useEffect(() => {
  //   if (!office_id || !host_id) {
  //     setTimeSlots([]);
  //     return;
  //   }
  //   const tday = formData.date.toISOString().split("T")[0];
  //   console.log("shit", tday);

  //   const loadSlots = async () => {
  //     setLoadingSlots(true);
  //     try {
  //       const data = await client.getSlotAvailability(office_id, tday, token);
  //       console.log("DATEEE", data);
  //       setTimeSlots(data);
  //     } catch (err) {
  //       console.error("Failed to load slots:", err);
  //       setTimeSlots([]);
  //     } finally {
  //       setLoadingSlots(false);
  //     }
  //   };
  //   loadSlots();
  // }, [office_id, formData.date]);
  // Load time slots when office or date changes
  useEffect(() => {
    if (!office_id || !host_id || !formData.date) {
      setTimeSlots([]);
      return;
    }


// In your useEffect:
const tday = format(formData.date, 'yyyy-MM-dd');
console.log("date", tday);
    const loadSlots = async () => {
      setLoadingSlots(true);
      try {
        const data = await client.getSlotAvailability(office_id, tday, token);
        console.log("DATEEE", data);
        setTimeSlots(data);
      } catch (err) {
        console.error("Failed to load slots:", err);
        setTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    loadSlots();
  }, [office_id, formData.date, host_id, token]);

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
      // Format the data exactly as required by your backend
      const requestData = {
        citizen: {
          firstname: data.firstName,
          lastname: data.lastName,
          email: data.email,
          phone: data.phone,
          // Note: email is not included in your backend schema
        },
        appointment: {
          host_id: host_id,
          office_id: office_id,
          purpose: data.purpose,
          appointment_date: data.date.toISOString(),
          time_slotted: data.timeSlot,
          status: "PENDING",
        },
      };

      console.log("Sending to backend:", requestData);
      const response = await client.createAppointment(requestData, token);
      const result = response;
      console.log("Success:", result);
      toast.success(result.message);

      form.reset();
      setStep(1);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to create appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Add this helper function above your component
  const formatTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
    } catch {
      return timeString; // Fallback to original if parsing fails
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Book Appointment</CardTitle>
          <CardDescription>
            Complete all steps to schedule your appointment
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {/* Step Progress */}
          <div className="flex items-center justify-center mb-8 w-full ">
            <div className="flex justify-between items-center w-1/2 max-w-md mx-auto pl-8 mb-8 ">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center flex-1">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors",
                      stepNum <= step
                        ? "bg-brand text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div
                      className={cn(
                        "flex-1 h-1 mx-2 transition-colors",
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
              className="space-y-6"
            >
              {/* STEP 1: Personal Information */}
              {step === 1 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">
                    Step 1: Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
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
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="(555) 123-4567"
                            value={field.value}
                            onChange={handlePhoneChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* STEP 2: Purpose */}
              {step === 2 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">
                    Step 2: Appointment Purpose
                  </h3>
                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose of Visit</FormLabel>
                        <FormControl>
                          {/* <Input className='py-12' placeholder="Describe the purpose of your visit" {...field} /> */}
                          <Textarea
                            placeholder="Describe the purpose of your visit"
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
                  <h3 className="text-xl font-semibold">
                    Step 3: Date & Time Selection
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Calendar Section */}
                    <div>
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Select Date</FormLabel>

                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                // Only update if date is not undefined and not in the past
                                if (date && date >= today) {
                                  field.onChange(date);
                                }
                              }}
                              disabled={(date) => date < today}
                            />

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Time Slots Section */}
                    <div>
                      <FormField
                        control={form.control}
                        name="timeSlot"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Time Slot</FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {loadingSlots ? (
                                  <div className="animate-pulse grid grid-cols-2 gap-2 mt-2">
                                    {[...Array(6)].map((_, i) => (
                                      <div
                                        key={i}
                                        className="h-14 bg-muted rounded-sm"
                                      ></div>
                                    ))}
                                  </div>
                                ) : timeSlots?.length > 0 ? (
                                  <div className="grid grid-cols-2 gap-2 mt-2">
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
                                          className={`
            justify-center py-5 rounded-sm transition-all relative
            ${
              isBooked
                ? "text-muted-foreground bg-muted cursor-not-allowed border-dashed"
                : isSelected
                ? "bg-brand text-primary-foreground shadow-sm hover:bg-brand/80"
                : "hover:bg-brand/10 hover:text-brand hover:border-brand/30"
            }
          `}
                                        >
                                          <span className="font-medium">
                                            {formatTime(slot.slot_start)}
                                          </span>
                                          {isBooked && (
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-muted-foreground rounded-full"></div>
                                          )}
                                          {isSelected && (
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                                          )}
                                        </Button>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg bg-muted/20">
                                    <CalendarIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-60" />
                                    <p className="text-muted-foreground font-medium mb-1">
                                      No slots available
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Try selecting a different date
                                    </p>
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                      Review Your Appointment
                    </h3>
                    <p className="text-muted-foreground">
                      Please review all details before submitting
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Info Card */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Personal Information
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
                      <CardContent>
                        <p className="text-lg font-semibold">
                          {formData.firstName} {formData.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formData.phone}
                        </p>
                        {formData.email && (
                          <p className="text-sm text-muted-foreground">
                            {formData.email}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Appointment Details Card */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Appointment Details
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
                        <p className="text-sm">
                          <strong>Purpose:</strong> {formData.purpose}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Date & Time Card */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Date & Time
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
                    <CardContent>
                      <p className="text-sm">
                        <strong>Date:</strong>{" "}
                        {formData.date
                          ? format(formData.date, "PPPP")
                          : "Not selected"}
                      </p>
                      <p className="text-sm">
                        <strong>Time:</strong>{" "}
                        {formData.timeSlot
                          ? formatTime(formData.timeSlot)
                          : "Not selected"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 justify-between pt-6">
                {step > 1 && step < 4 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                )}

                {step < 3 && (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="ml-auto bg-brand hover:bg-brand/90"
                  >
                    Next
                  </Button>
                )}

                {step === 3 && (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="ml-auto bg-brand hover:bg-brand/90"
                  >
                    Review & Confirm
                  </Button>
                )}

                {step === 4 && (
                  <div className="flex gap-3 ml-auto">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Previous
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

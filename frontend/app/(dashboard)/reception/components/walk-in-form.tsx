"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Clock,
    User,
    Phone,
    FileText,
    Calendar as CalendarIcon,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/libs/utils";
import { useRouter } from "next/navigation";

// Form schema
const walkInSchema = z.object({
    citizen_phone: z.string().min(10, "Valid phone number required"),
    citizen_name: z.string().min(2, "Name is required"),
    host_id: z.string().optional(), // Change from .min(1)
    office_id: z.string().optional(), // Change from .min(1)
    date: z.date().optional(), // Add .optional()
    time_slot: z.string().optional(), // Change from .min(1)
    purpose: z.string().optional(),
    id_number: z.string().optional(),
});

type WalkInFormData = z.infer<typeof walkInSchema>;

interface Host {
    id: string;
    full_name: string;
    position: string;
    office_id: string;
}

interface Office {
    id: string;
    name: string;
    address: string;
}

interface WalkInFormProps {
    hosts: Host[];
    offices: Office[];
}

export function WalkInForm({ hosts, offices }: WalkInFormProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [step, setStep] = useState<"citizen" | "host" | "slot" | "confirm">("citizen");
    const [selectedHost, setSelectedHost] = useState<Host | null>(null);
    const [autoFilled, setAutoFilled] = useState(false);

    const form = useForm<WalkInFormData>({
        resolver: zodResolver(walkInSchema),
        defaultValues: {
            citizen_phone: "",
            citizen_name: "",
            host_id: "",
            office_id: "",
            date: new Date(),
            time_slot: "",
            purpose: "",
            id_number: "",
        },
    });

    // Dummy citizen search data
    const existingCitizens = [
        {
            id: "citizen-1",
            full_name: "Ahmed Mohamed",
            phone_number: "+252-63-1234567",
            id_number: "SL-1234567"
        },
        {
            id: "citizen-2",
            full_name: "Khadra Abdi Ali",
            phone_number: "+252-90-9876543",
            id_number: "SL-7654321"
        }
    ];

    // Search for existing citizen by phone (dummy implementation)
    const searchCitizen = useQuery({
        queryKey: ["citizen-search", form.watch("citizen_phone")],
        queryFn: async () => {
            const phone = form.getValues("citizen_phone");
            if (phone.length < 10) return null;

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));

            // Return matching citizen from dummy data
            const foundCitizen = existingCitizens.find(citizen =>
                citizen.phone_number.includes(phone.replace(/\D/g, ''))
            );

            return foundCitizen ? [foundCitizen] : null;
        },
        enabled: form.watch("citizen_phone").length >= 10,
    });

    // Auto-fill citizen info when search results come back
    useEffect(() => {
        if (searchCitizen.data?.length > 0 && !autoFilled) {
            const citizen = searchCitizen.data[0];
            form.setValue("citizen_name", citizen.full_name);
            if (citizen.id_number) {
                form.setValue("id_number", citizen.id_number);
            }
            setAutoFilled(true);
        }
    }, [searchCitizen.data, form, autoFilled]);

    // Dummy available time slots
    const dummyTimeSlots = [
        "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
        "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM",
        "03:00 PM", "03:30 PM", "04:00 PM"
    ];

    // Fetch available slots for selected host/date (dummy implementation)
    const availableSlots = useQuery({
        queryKey: ["slots", form.watch("host_id"), form.watch("date")],
        queryFn: async () => {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 600));

            // Return filtered dummy slots (simulate some slots being taken)
            const takenSlots = ["09:00 AM", "10:30 AM", "02:00 PM"];
            return dummyTimeSlots.filter(slot => !takenSlots.includes(slot));
        },
        enabled: !!form.watch("host_id") && step === "slot",
    });

    // Create appointment mutation (dummy implementation)
    const createAppointment = useMutation({
        mutationFn: async (data: WalkInFormData) => {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Return dummy appointment data
            const dummyAppointment = {
                id: `app-${Date.now()}`,
                citizen_name: data.citizen_name,
                host_name: selectedHost?.full_name,
                office_name: offices.find(o => o.id === data.office_id)?.name,
                date: format(data.date, "yyyy-MM-dd"),
                time_slot: data.time_slot,
                purpose: data.purpose,
                reference_number: `WLK-${Date.now().toString().slice(-6)}`
            };

            return dummyAppointment;
        },
        onSuccess: (data) => {
            // Clear cache
            queryClient.invalidateQueries(["today-appointments"]);
            queryClient.invalidateQueries(["recent-check-ins"]);

            // Redirect to confirmation/print page
            router.push(`/reception/appointments/${data.id}/confirmed`);
        },
    });

    // Form submit handler
    const onSubmit = async (data: WalkInFormData) => {
        console.log("Form submitted:", data);

        // Validate only fields for the current step
        let isValid = false;

        if (step === "citizen") {
            isValid = await form.trigger(["citizen_phone", "citizen_name", "id_number", "purpose"]);
            if (isValid) {
                setStep("host");
                return;
            }
        } else if (step === "host") {
            isValid = await form.trigger(["office_id", "host_id"]);
            if (isValid) {
                setStep("slot");
                return;
            }
        } else if (step === "slot") {
            isValid = await form.trigger(["date", "time_slot"]);
            if (isValid) {
                setStep("confirm");
                return;
            }
        } else if (step === "confirm") {
            createAppointment.mutate(data);
        }
    };

    // Progress indicators
    const steps = [
        { id: "citizen", label: "Citizen Info" },
        { id: "host", label: "Select Host" },
        { id: "slot", label: "Time Slot" },
        { id: "confirm", label: "Confirm" },
    ];

    // Debug current form values
    const currentValues = form.watch();
    console.log("Current form values:", currentValues); // Debug log

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Progress Bar */}
                <div className="flex items-center justify-between">
                    {steps.map((s, idx) => (
                        <div key={s.id} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-medium",
                                        step === s.id
                                            ? "bg-primary text-primary-foreground"
                                            : steps.findIndex(st => st.id === step) > idx
                                                ? "bg-green-500 text-white"
                                                : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {steps.findIndex(st => st.id === step) > idx ? (
                                        <CheckCircle2 className="h-5 w-5" />
                                    ) : (
                                        idx + 1
                                    )}
                                </div>
                                <p className={cn(
                                    "text-xs mt-1",
                                    step === s.id ? "text-primary font-medium" : "text-muted-foreground"
                                )}>
                                    {s.label}
                                </p>
                            </div>
                            {idx < steps.length - 1 && (
                                <div
                                    className={cn(
                                        "w-16 h-1 mx-2",
                                        steps.findIndex(st => st.id === step) > idx ? "bg-green-500" : "bg-muted"
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step 1: Citizen Information */}
                {step === "citizen" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Citizen Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="citizen_phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number *</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    placeholder="252-63-1234567"
                                                    {...field}
                                                    className="text-lg pl-12"
                                                    type="tel"
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        // Reset auto-fill flag when phone changes
                                                        if (autoFilled) setAutoFilled(false);
                                                    }}
                                                />
                                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                                    <Phone className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </FormControl>
                                        {searchCitizen.isLoading && (
                                            <div className="flex items-center gap-2 text-sm text-blue-600">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                Searching for existing citizen...
                                            </div>
                                        )}
                                        {searchCitizen.data?.length > 0 && (
                                            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                                                ✓ Returning Citizen Found - Info Auto-filled
                                            </Badge>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="citizen_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name *</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    placeholder="Enter citizen's full name"
                                                    {...field}
                                                    className="text-lg pl-12"
                                                />
                                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                                    <User className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="id_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ID Number (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="National ID / Passport" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="purpose"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Purpose (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Reason for visit" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Select Host & Office */}
                {step === "host" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Select Host & Office
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="office_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Office *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="text-lg h-12">
                                                    <SelectValue placeholder="Select office" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {offices.map((office) => (
                                                    <SelectItem key={office.id} value={office.id}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{office.name}</span>
                                                            <span className="text-xs text-muted-foreground">{office.address}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="host_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Host *</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                const host = hosts.find(h => h.id === value);
                                                setSelectedHost(host || null);
                                            }}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="text-lg h-12">
                                                    <SelectValue placeholder="Select host" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {hosts
                                                    .filter(host => !form.watch("office_id") || host.office_id === form.watch("office_id"))
                                                    .map((host) => (
                                                        <SelectItem key={host.id} value={host.id}>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{host.full_name}</span>
                                                                {host.position && (
                                                                    <span className="text-xs text-muted-foreground">{host.position}</span>
                                                                )}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Rest of your component remains the same... */}
                {/* Step 3: Select Date & Time Slot */}
                {step === "slot" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5" />
                                Select Date & Time
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date *</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal text-lg h-12",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="time_slot"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Available Time Slots *</FormLabel>
                                        <FormControl>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {availableSlots.isLoading ? (
                                                    <div className="col-span-full flex items-center justify-center py-8">
                                                        <Loader2 className="h-6 w-6 animate-spin" />
                                                        <span className="ml-2">Loading available slots...</span>
                                                    </div>
                                                ) : availableSlots.data?.length === 0 ? (
                                                    <p className="col-span-full text-center text-muted-foreground py-8">
                                                        No available slots for this date
                                                    </p>
                                                ) : (
                                                    availableSlots.data?.map((slot: string) => (
                                                        <Button
                                                            key={slot}
                                                            type="button"
                                                            variant={field.value === slot ? "default" : "outline"}
                                                            className="h-12 text-base"
                                                            onClick={() => field.onChange(slot)}
                                                        >
                                                            <Clock className="mr-2 h-4 w-4" />
                                                            {slot}
                                                        </Button>
                                                    ))
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Step 4: Confirmation */}
                {step === "confirm" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Confirm Appointment
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 rounded-lg bg-muted p-6">
                                <ConfirmationRow label="Citizen" value={form.getValues("citizen_name")} />
                                <ConfirmationRow label="Phone" value={form.getValues("citizen_phone")} />
                                <ConfirmationRow label="Host" value={selectedHost?.full_name || ""} />
                                <ConfirmationRow label="Position" value={selectedHost?.position || ""} />
                                <ConfirmationRow label="Office" value={offices.find(o => o.id === form.getValues("office_id"))?.name || ""} />
                                <ConfirmationRow label="Date" value={format(form.getValues("date"), "PPP")} />
                                <ConfirmationRow label="Time" value={form.getValues("time_slot")} />
                                {form.getValues("purpose") && (
                                    <ConfirmationRow label="Purpose" value={form.getValues("purpose")} />
                                )}
                                {form.getValues("id_number") && (
                                    <ConfirmationRow label="ID Number" value={form.getValues("id_number")} />
                                )}
                            </div>

                            <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-900">Walk-In Appointment</p>
                                        <p className="text-sm text-yellow-700">
                                            This is a walk-in appointment. The citizen has not pre-booked and will be served based on availability.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {Object.keys(form.formState.errors).length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-medium text-red-900">Validation Errors:</p>
                        <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                            {Object.entries(form.formState.errors).map(([key, error]) => (
                                <li key={key}>{key}: {error.message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-between">
                    {step !== "citizen" && (
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => {
                                const prevStep = step === "confirm" ? "slot" : step === "slot" ? "host" : "citizen";
                                setStep(prevStep);
                            }}
                        >
                            Back
                        </Button>
                    )}

                    <div className="ml-auto flex gap-3">
                        {step === "confirm" ? (
                            <Button
                                type="submit"
                                size="lg"
                                className="min-w-[200px]"
                                disabled={createAppointment.isPending}
                            >
                                {createAppointment.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-5 w-5" />
                                        Create Appointment
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                size="lg"
                                className="min-w-[150px]"
                            >
                                Next Step
                            </Button>
                        )}
                    </div>
                </div>

                {/* Error Display */}
                {createAppointment.isError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
                        <AlertCircle className="inline h-4 w-4 mr-2" />
                        {createAppointment.error.message}
                    </div>
                )}
            </form>
        </Form>
    );
}

function ConfirmationRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-start py-2 border-b last:border-0">
            <span className="text-muted-foreground font-medium">{label}</span>
            <span className="font-semibold text-right max-w-[60%]">{value}</span>
        </div>
    );
}
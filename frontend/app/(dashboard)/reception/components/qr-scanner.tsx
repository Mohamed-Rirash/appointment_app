"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, CameraOff, CheckCircle2, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function QrScanner() {
    const [qrData, setQrData] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<null | { success: boolean; message: string }>(null);
    const queryClient = useQueryClient();
    const router = useRouter();

    const checkInMutation = useMutation({
        mutationFn: async (appointmentId: string) => {
            // Simulate API call with dummy data
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Simulate successful check-in for specific IDs
            if (appointmentId === "app-5" || appointmentId === "app-6") {
                return { success: true, message: "Check-in successful" };
            } else {
                throw new Error("Appointment not found or already checked in");
            }

            // Real implementation:
            // const res = await fetch(`/api/v1/reception/check-in`, {
            //   method: "POST",
            //   headers: { "Content-Type": "application/json" },
            //   body: JSON.stringify({ appointment_id: appointmentId }),
            // });
            // if (!res.ok) throw new Error("Check-in failed");
            // return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recent-check-ins"] });
            setResult({ success: true, message: "Citizen checked in successfully!" });
            setQrData("");
            setTimeout(() => setResult(null), 3000);
        },
        onError: (error: Error) => {
            setResult({ success: false, message: error.message });
            setTimeout(() => setResult(null), 3000);
        },
    });

    const handleCheckIn = () => {
        if (!qrData.trim()) {
            setResult({ success: false, message: "Please enter appointment ID or scan QR code" });
            return;
        }

        // Extract appointment ID from QR data (format: "appointment:{id}")
        const appointmentId = qrData.includes(":")
            ? qrData.split(":")[1]
            : qrData;

        checkInMutation.mutate(appointmentId);
    };

    // Dummy QR codes for testing
    const dummyQRCodes = [
        { id: "app-5", name: "Omar Jama - Tax Consultation" },
        { id: "app-6", name: "Fadumo Ali - Marriage Certificate" }
    ];

    return (
        <div className="space-y-6">
            {/* Scanner Input (Simulated) */}
            <div className="rounded-lg border bg-card p-8">
                <div className="mx-auto max-w-2xl space-y-4">
                    <div className="text-center space-y-2 mb-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                            <Camera className="h-10 w-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-semibold">Scan QR Code</h2>
                        <p className="text-muted-foreground">
                            Position the citizen's appointment QR code in the scanner below
                        </p>
                    </div>

                    {/* Simulated QR Input (Replace with real scanner) */}
                    <div className="space-y-4">
                        <Input
                            placeholder="Enter appointment ID (simulation)"
                            value={qrData}
                            onChange={(e) => setQrData(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCheckIn()}
                            className="text-center text-lg h-14 text-2xl tracking-widest"
                            autoFocus
                        />

                        {/* Dummy QR Code Suggestions */}
                        <div className="flex gap-2 justify-center">
                            {dummyQRCodes.map((qr) => (
                                <Button
                                    key={qr.id}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setQrData(`appointment:${qr.id}`)}
                                    className="text-xs"
                                >
                                    {qr.name}
                                </Button>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <Button
                                size="lg"
                                className="flex-1 h-14 text-lg"
                                onClick={handleCheckIn}
                                disabled={checkInMutation.isPending}
                            >
                                {checkInMutation.isPending ? (
                                    <>
                                        <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                                        Checking In...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-5 w-5" />
                                        Check In
                                    </>
                                )}
                            </Button>

                            <Button
                                size="lg"
                                variant="outline"
                                className="h-14"
                                onClick={() => setIsScanning(!isScanning)}
                            >
                                {isScanning ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>

                    {/* Result Message */}
                    {result && (
                        <div
                            className={`rounded-lg border p-4 flex items-center gap-3 ${result.success
                                ? "border-green-500 bg-green-50 text-green-900"
                                : "border-red-500 bg-red-50 text-red-900"
                                }`}
                        >
                            {result.success ? (
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            ) : (
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            )}
                            <span className="font-medium">{result.message}</span>
                        </div>
                    )}

                    {/* Manual Search Fallback */}
                    <div className="mt-8 pt-6 border-t">
                        <p className="text-sm text-muted-foreground mb-4 text-center">
                            Can't scan? Search manually:
                        </p>
                        <Button
                            variant="link"
                            className="w-full"
                            onClick={() => {
                                const phone = prompt("Enter citizen phone number:");
                                if (phone) {
                                    // Search by phone
                                    router.push(`/reception/search?phone=${phone}`);
                                }
                            }}
                        >
                            Search by Phone Number
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
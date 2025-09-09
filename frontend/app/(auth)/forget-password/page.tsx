"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Mail } from "lucide-react";
import { useState, useEffect } from "react";

export default function ForgetPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [isCounting, setIsCounting] = useState(false);

  // Countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isCounting && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsCounting(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCounting, countdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }

    // Simulate API call
    setSubmitted(true);
    setIsCounting(true);
    setCountdown(30);

    // Simulate success/error after 1.5s
    setTimeout(() => {
      // Simulate 20% chance of error for demo
      if (Math.random() > 0.8) {
        setError("Failed to send reset email. Please try again.");
        setSubmitted(false);
        setIsCounting(false);
      } else {
        // Success — keep submitted state and countdown
      }
    }, 1500);
  };

  const handleResend = () => {
    if (countdown === 0) {
      setCountdown(30);
      setIsCounting(true);
      setError(null);
      setSubmitted(false);

      // Simulate resend
      setTimeout(() => {
        setSubmitted(true);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Button
        variant={"ghost"}
        className="absolute top-6 left-6 py-2 px-4 text-gray-600 hover:text-gray-900 transition-colors"
        onClick={() => window.history.back()}
      >
        ← Go Back
      </Button>

      <div className="w-full max-w-sm">
        <div className="bg-white p-8 rounded-xl  border border-[#e1e1e1]">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Forgot Password?
            </h1>
            <p className="text-gray-500 mt-2">
              Enter your email to receive a password reset link.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 animate-in fade-in-0">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="py-6 pl-4 text-base"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full py-6 text-base font-semibold"
                disabled={!email}
              >
                Send Reset Link
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="flex flex-col items-center">
                <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Check your inbox!
                </h3>
                <p className="text-gray-500 text-sm">
                  We’ve sent a password reset link to <br />
                  <span className="font-medium text-gray-700">{email}</span>
                </p>
              </div>

              <div className="pt-4">
                <p className="text-sm text-gray-500 mb-2">
                  Didn’t receive the email?
                </p>
                {isCounting ? (
                  <p className="text-sm text-gray-400">
                    Resend available in {countdown}s
                  </p>
                ) : (
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary hover:text-primary/80"
                    onClick={handleResend}
                  >
                    Click to resend
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Need help?{" "}
          <a href="#" className="text-primary hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}

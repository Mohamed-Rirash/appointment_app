"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import arrow from "@/public/back_arrow.png";
import Image from "next/image";
import { client } from "@/fuctions/api/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function ForgetPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [isCounting, setIsCounting] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Basic validation: check if email is empty
    if (!email.trim()) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    // Domain validation
    const allowedDomains = ["gmail.com", "amoud.org"];
    const domain = email.split("@")[1]?.toLowerCase();
    console.log("DDD", domain);
    if (!domain || !allowedDomains.includes(domain)) {
      setError(
        "Only email addresses from @gmail.com or @amoud.org are allowed."
      );
      setLoading(false);
      return;
    }

    try {
      const result = await client.resetPassword(email);
      console.log("Result", result);

      // ✅ On success: show confirmation screen
      if (result?.message) {
        setSubmitted(true); // Show "Check your inbox!" UI
        setIsCounting(true); // Start resend countdown
        setCountdown(30);
      }
    } catch (err: any) {
      console.error("Reset password error:", err);

      let errorMessage = "Failed to send reset email. Please try again.";

      // Handle specific backend validation errors
      if (err?.response?.data?.detail?.[0]?.msg) {
        const msg = err.response.data.detail[0].msg;
        if (
          msg.includes("Only email addresses from these domains are allowed")
        ) {
          errorMessage =
            "Only email addresses from @gmail.com or @amoud.org are allowed.";
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (countdown === 0) {
      setSubmitted(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Button
        className="text-xl py-6 rounded-[4px] shodow-gren absolute top-6 left-6 transition-colors
        border border-[#eeeeee] bg-white text-brand-gray hover:bg-brand-primary/40 "
        onClick={() => window.history.back()}
      >
        <Image
          className="ml-2"
          src={arrow}
          width={18}
          height={18}
          alt="arrow"
        />
        <span className="mx-2"> Back to login</span>
      </Button>

      <div className="w-full max-w-sm">
        <div className="bg-white p-6 rounded-[8px]  border border-brand-primary">
          {!submitted ? (
            <>
              <div className="">
                <h1 className="text-2xl font-bold text-brand-black">
                  Forgot Your Password?
                </h1>
                <p className="text-brand-gray leading-5 font-light mt-2">
                  Enter your email and we’ll send you a link to reset your
                  password.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium">
                    Email
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
                  {/* {error && (
                    <p className="text-red-500 text-sm p-4 bg-red-50/10 rounded mt-2">
                      {error}
                    </p>
                  )} */}
                  {error && (
                    <Alert
                      variant="destructive"
                      className="mb-6 animate-in fade-in-0"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <Button
                  type="submit"
                  className={`w-full py-7 mt-4 text-xl font-medium ${
                    !email
                      ? "bg-bran-secondary text-brand-gray"
                      : "hover:bg-brand/90"
                  } `}
                  disabled={!email}
                >
                  {loading ? "Reseting password..." : " Reset my Password"}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center ">
              <div className="flex flex-col items-center">
                <h3 className="text-2xl font-bold text-brand-black">
                  Check Your inbox!
                </h3>
                <p className="text-brand-gray text-base mt-2">
                  We’ve sent a password reset link to <br />
                  <span className="font-medium text-brand-black">{email}</span>.
                  Please check your inbox (and spam folder).
                </p>
              </div>

              <div className="pt-4 mt-6">
                <p className="text-base text-brand-gray ">
                  Didn’t get the email? You can resend it
                </p>
                {isCounting ? (
                  <p className="text-sm text-brand-gray mt-2">
                    Resend available in {countdown}s
                  </p>
                ) : (
                  <Button
                    variant="link"
                    className="p-0 h-auto text-brand hover:text-brand/80"
                    onClick={handleResend}
                  >
                    Click to resend
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-base text-gray-400 mt-6">
          Need help?{" "}
          <a href="#" className="text-primary hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}

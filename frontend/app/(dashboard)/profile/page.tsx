"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import active_icon from "@/public/active.png";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeCheckIcon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { client } from "@/fuctions/api/client";
import { z } from "zod";

// Zod schema for password
const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .regex(/[A-Z]/, "Password must have at least one uppercase letter")
  .regex(/[0-9]/, "Password must have at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must have at least one special character");

// Password strength function
function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 6) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const levels = ["Weak", "Fair", "Good", "Strong"];
  return { score, label: levels[score - 1] || "Too short" };
}

export default function Profile() {
  const { data: session, status } = useSession();
  const user = session?.user;

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (status === "loading") return <ProfileSkeleton />;
  if (!user) return null;

  const {
    email,
    first_name,
    last_name,
    is_active,
    is_verified,
    roles,
    access_token: token,
  } = user;

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const current_password = formData.get("current_password") as string;

    if (!current_password || !newPassword) {
      setError("Please fill in both password fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      passwordSchema.parse(newPassword); // Validate password
      const result = await client.changePassword(
        current_password,
        newPassword,
        token
      );
      setSuccess("Password changed successfully!");
      setNewPassword("");
      e.currentTarget.reset();
    } catch (err: any) {
      if (err.errors) {
        setError(err.errors[0].message);
      } else {
        setError(err.message || "Failed to change password");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border border-[#eeeeee] max-w-[388px] w-full ml-[122px] mt-[60px] mb-16 p-6 rounded-[4px]">
      {/* avatar */}
      <div className="relative">
        <Avatar className="w-[64px] h-[64px]">
          <AvatarImage src={"/avatar.png"} />
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
        {is_active ? (
          <Image
            className="absolute bottom-[-4px] left-10 "
            width={16}
            height={16}
            src={active_icon}
            alt="active"
          />
        ) : (
          ""
        )}
      </div>

      {/* username and email */}
      <div className="mt-4 flex justify-between">
        <div>
          <h1 className="mb-0 text-lg font-bold text-brand-black">
            {first_name}
          </h1>
          <p className="text-brand-gray"> {email} </p>
        </div>
        <div className="flex items-center">
          <Badge
            variant="secondary"
            className={`text-brand-primary ${
              is_verified
                ? "bg-blue-500  dark:bg-blue-600"
                : "bg-red-500 dark:bg-red-600"
            }`}
          >
            <BadgeCheckIcon /> Verified
          </Badge>
        </div>
      </div>

      {/* personal info */}
      <h1 className="text-2xl font-bold text-brand-black my-8">
        Personal Information
      </h1>
      <div>
        <div>
          <Label className="text-[16px] text-brand-gray font-medium">
            First Name
          </Label>
          <h2 className="text-lg text-brand-black font-medium mt-[-8px]">
            {first_name}
          </h2>
        </div>
        <div className="mt-4">
          <Label className="text-[16px] text-brand-gray font-medium">
            Last Name
          </Label>
          <h2 className="text-lg text-brand-black font-medium mt-[-8px]">
            {last_name}
          </h2>
        </div>
        <div className="mt-4">
          <Label className="text-[16px] text-brand-gray font-medium">
            Email
          </Label>
          <h2 className="text-lg text-brand-black font-medium mt-[-8px]">
            {email}
          </h2>
        </div>
        <div className="mt-4">
          <Label className="text-[16px] text-brand-gray font-medium">
            Role
          </Label>
          <h2 className="text-lg text-brand-black font-medium mt-[-8px]">
            {roles[0]}
          </h2>
        </div>
      </div>

      {/* change password dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="mt-8 text-lg rounded-[4px] text-brand-primary py-6 hover:bg-brand/90 font-bold max-w-[180px] w-full">
            Change Password
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-brand-black">
                Change password
              </DialogTitle>
            </DialogHeader>

            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            {success && (
              <p className="text-green-500 text-sm mb-2">{success}</p>
            )}

            <div className="grid mt-2">
              <div className="grid">
                <Label
                  htmlFor="current-password"
                  className="text-[16px] font-medium mb-3"
                >
                  Current Password
                </Label>
                <Input
                  className="py-7 pl-4 text-lg"
                  id="current-password"
                  name="current_password"
                  placeholder="*************"
                  type="password"
                  required
                />
              </div>

              <div className="grid mt-4">
                <Label
                  htmlFor="new-password"
                  className="text-[16px] font-medium mb-3"
                >
                  New Password
                </Label>
                <Input
                  className="py-7 pl-4 text-lg"
                  id="new-password"
                  name="new_password"
                  placeholder="*************"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    try {
                      passwordSchema.parse(e.target.value);
                      setPasswordError(null);
                    } catch (err: any) {
                      setPasswordError(err.errors[0].message);
                    }
                  }}
                  required
                />

                {/* strength indicator */}
                <p
                  className={`mt-2 text-sm font-medium ${
                    strength.score <= 1
                      ? "text-red-500"
                      : strength.score === 2
                      ? "text-yellow-500"
                      : strength.score === 3
                      ? "text-blue-500"
                      : "text-green-500"
                  }`}
                >
                  Strength: {strength.label}
                </p>

                {passwordError && (
                  <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                )}
              </div>
            </div>

            <DialogFooter className="mt-8">
              <DialogClose asChild>
                <Button
                  type="button"
                  className="max-w-[156px] w-full py-6 text-[16px] font-bold rounded-[4px] bg-bran-secondary hover:bg-bran-secondary/80 text-brand-gray"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  strength.score < 3 || // block unless "Good" or "Strong"
                  !!passwordError
                }
                className="max-w-[156px] w-full py-6 text-[16px] font-bold rounded-[4px] bg-linear-to-r from-[#21D256] to-[#0EA73C]"
              >
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// skeleton loader
function ProfileSkeleton() {
  return (
    <div className="border border-[#eeeeee] max-w-[388px] w-full ml-[122px] mt-[60px] mb-16 p-6 rounded-[4px]">
      <div className="flex flex-col ">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-5 w-32 mt-4" />
        <Skeleton className="h-4 w-40 mt-2" />
      </div>
      <Skeleton className="h-6 w-40 mt-8" />
      <div className="mt-6 space-y-6">
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-5 w-60" />
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
      <Skeleton className="h-10 w-[200px] mt-8 mx-auto" />
    </div>
  );
}

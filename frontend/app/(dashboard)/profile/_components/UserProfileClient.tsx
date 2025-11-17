"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { client } from "@/helpers/api/client";
import toast from "react-hot-toast";
import { useState } from "react";
import {
  CheckCircle2,
  Lock,
  Mail,
  User,
  Shield,
  Key,
  Eye,
  EyeOff,
  Building2,
  Calendar,
  Phone,
  MapPin,
} from "lucide-react";

// Password validation rules
const passwordRules = [
  { test: (pwd: string) => pwd.length >= 8, message: "At least 8 characters" },
  { test: (pwd: string) => /[A-Z]/.test(pwd), message: "One uppercase letter" },
  { test: (pwd: string) => /[a-z]/.test(pwd), message: "One lowercase letter" },
  { test: (pwd: string) => /[0-9]/.test(pwd), message: "One number" },
  { test: (pwd: string) => /[^a-zA-Z0-9]/.test(pwd), message: "One special character" },
];

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: "", color: "" };

  let score = 0;
  passwordRules.forEach(rule => {
    if (rule.test(password)) score++;
  });

  const levels = [
    { label: "Weak", color: "text-red-500 bg-red-100" },
    { label: "Fair", color: "text-yellow-500 bg-yellow-100" },
    { label: "Good", color: "text-blue-500 bg-blue-100" },
    { label: "Strong", color: "text-green-500 bg-green-100" },
  ];

  const level = levels[score - 1] || { label: "Too short", color: "text-gray-500 bg-gray-100" };
  return { score, ...level };
}

export default function UserProfileClient({ user }: { user: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false });
  const [isOpen, setIsOpen] = useState(false);

  const { email, first_name, last_name, is_active, is_verified, roles, access_token: token } = user;

  const strength = getPasswordStrength(newPassword);
  const validation = passwordRules.map(rule => ({
    ...rule,
    isValid: rule.test(newPassword),
  }));

  const canSubmit = strength.score >= 3 && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const current_password = formData.get("current_password") as string;

    if (!current_password || !newPassword) {
      toast.error("Please fill in all fields");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await client.changePassword(current_password, newPassword, token);
      toast.success(result.message || "Password changed successfully");

      setIsOpen(false);
      setNewPassword("");
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Profile Header */}
      <Card className="relative overflow-hidden border-0 bg-linear-to-br from-brand-primary via-brand to-brand/60 text-white shadow-gren">
        <div className="absolute inset-0 bg-black/10" />
        <CardContent className="relative p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            <div className="relative">
              <Avatar className="w-28 h-28 border-4 border-white/20 shadow-2xl">
                <AvatarImage src="/avatar.png" alt={`${first_name} ${last_name}`} />
                <AvatarFallback className="text-2xl font-bold bg-white/20 text-white">
                  {first_name?.[0]}{last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              {is_active && (
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-400 rounded-full border-3 border-white shadow-lg" />
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-4xl font-bold text-white">
                  {first_name} {last_name}
                </h1>
                <div className="flex gap-2">
                  <Badge className="bg-white/20 text-white border-0 font-medium px-3 py-1">
                    {is_verified ? "Verified" : "Unverified"}
                  </Badge>
                  <Badge className={`${is_active ? 'bg-green-400/20 text-green-100' : 'bg-gray-400/20 text-gray-200'} border-0 font-medium px-3 py-1`}>
                    {is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-blue-100 flex items-center gap-3 text-lg">
                  <Mail className="w-5 h-5" />
                  {email}
                </p>
                <div className="flex items-center gap-3 text-blue-100">
                  <Shield className="w-5 h-5" />
                  <span className="capitalize text-lg font-medium">{roles?.join?.(', ') || roles}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Personal Information - Enhanced */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500 font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    First Name
                  </Label>
                  <p className="text-xl font-semibold text-gray-900 bg-gray-50 rounded-lg px-4 py-3">
                    {first_name}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500 font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Last Name
                  </Label>
                  <p className="text-xl font-semibold text-gray-900 bg-gray-50 rounded-lg px-4 py-3">
                    {last_name}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-500 font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-xl font-semibold text-gray-900 flex-1">
                    {email}
                  </p>
                  {is_verified && (
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-500 font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Role
                </Label>
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-xl font-semibold text-gray-900 capitalize">
                    {roles?.join?.(', ') || roles || "No role assigned"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info Section */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 text-gray-600">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Member Since</p>
                    <p className="text-gray-900 font-semibold">January 2024</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <MapPin className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-gray-900 font-semibold">Hargeisa, Somaliland</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security & Actions - Enhanced */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Lock className="w-5 h-5 text-purple-600" />
                </div>
                Security & Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <div className={`w-3 h-3 rounded-full ${is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Account Status</p>
                      <p className="text-xs text-gray-500">{is_active ? 'Your account is active' : 'Account is inactive'}</p>
                    </div>
                  </div>
                  <Badge className={`${is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'} font-medium`}>
                    {is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Shield className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Verification</p>
                      <p className="text-xs text-gray-500">{is_verified ? 'Email verified' : 'Email not verified'}</p>
                    </div>
                  </div>
                  <Badge className={`${is_verified ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-amber-100 text-amber-700 border-amber-200'} font-medium`}>
                    {is_verified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
              </div>

              <Dialog open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) {
                  setNewPassword("");
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="w-full h-12  bg-linear-to-br from-brand-primary via-brand to-brand/60 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                    <Key className="w-5 h-5 mr-3" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg p-0 overflow-auto bg-white rounded-2xl">
                  <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                    <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <Key className="w-6 h-6 text-blue-600" />
                      </div>
                      Update Password
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 text-base mt-2">
                      Create a strong, unique password to keep your account secure
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="current-password" className="text-sm font-semibold text-gray-700">
                        Current Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          name="current_password"
                          type={showPasswords.current ? "text" : "password"}
                          placeholder="Enter your current password"
                          required
                          className="h-12 text-base rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        >
                          {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="new-password" className="text-sm font-semibold text-gray-700">
                        New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          name="new_password"
                          type={showPasswords.new ? "text" : "password"}
                          placeholder="Create your new password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="h-12 text-base rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>

                      {/* Password Strength */}
                      {newPassword && (
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Password Strength</span>
                            <span className={`text-sm font-semibold ${strength.color}`}>{strength.label}</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${strength.score <= 1 ? 'bg-red-500' :
                                strength.score === 2 ? 'bg-yellow-500' :
                                  strength.score === 3 ? 'bg-blue-500' :
                                    'bg-green-500'
                                }`}
                              style={{ width: `${(strength.score / passwordRules.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Validation Rules */}
                      <div className="mt-4 space-y-2">
                        {validation.map((rule, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${rule.isValid
                              ? 'bg-green-500 border-green-500'
                              : 'bg-white border-gray-300'
                              }`}>
                              {rule.isValid && <span className="text-white text-xs">✓</span>}
                            </div>
                            <span className={`text-sm ${rule.isValid ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                              {rule.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <DialogFooter className="gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        className="flex-1 h-12 rounded-xl border-gray-300 hover:bg-gray-50 font-medium"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={!canSubmit}
                        className="flex-1 h-12  bg-linear-to-br from-brand-primary via-brand to-brand/60 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Updating...
                          </>
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
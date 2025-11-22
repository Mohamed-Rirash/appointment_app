// components/password-change-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { client } from "@/helpers/api/client";
import toast from "react-hot-toast";
import { Key, Lock, Shield, Eye, EyeOff, CheckCircle2 } from "lucide-react";

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

interface PasswordChangeFormProps {
    token: string;
    user: {
        is_active: boolean;
        is_verified: boolean;
    };
}

export function PasswordChangeForm({ token, user }: PasswordChangeFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false });
    const [isOpen, setIsOpen] = useState(false);

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
        <Card className="border-0 shadow-lg bg-linear-to-br from-white to-brand-primary/30">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                    <div className="p-2 bg-brand-primary rounded-xl">
                        <Lock className="w-5 h-5 text-brand" />
                    </div>
                    Security & Account
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${user.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                                <div className={`w-3 h-3 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Account Status</p>
                                <p className="text-xs text-gray-500">{user.is_active ? 'Your account is active' : 'Account is inactive'}</p>
                            </div>
                        </div>
                        <Badge className={`${user.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'} font-medium`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Shield className="w-4 h-4 text-brand" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Verification</p>
                                <p className="text-xs text-gray-500">{user.is_verified ? 'Email verified' : 'Email not verified'}</p>
                            </div>
                        </div>
                        <Badge className={`${user.is_verified ? 'bg-brand-primary text-brand border-brand-primary' : 'bg-amber-100 text-amber-700 border-amber-200'} font-medium`}>
                            {user.is_verified ? 'Verified' : 'Pending'}
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
                        <Button className="w-full h-12 bg-linear-to-br from-brand to-brand/70 text-white font-semibold shadow-gren hover:shadow-gren transition-all duration-200">
                            <Key className="w-5 h-5 mr-3" />
                            Change Password
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg p-0 overflow-auto bg-white rounded-2xl">
                        <DialogHeader className="p-6 pb-4 bg-linear-to-r from-brand-primary/20 to-brand-primary/40 border-b">
                            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm">
                                    <Key className="w-6 h-6 text-brand" />
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
                                        className="h-12 text-base rounded-xl border-gray-300 focus:border-brand/80 focus:ring-brand/20 pr-12"
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
                                                {rule.isValid && <CheckCircle2 className="w-3 h-3 text-white" />}
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
                                    onClick={() => {
                                        setIsOpen(false)
                                        setNewPassword("")
                                    }}
                                    className="flex-1 h-12 rounded-xl border-gray-300 hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="flex-1 h-12 bg-linear-to-br from-brand to-brand/90 text-white font-semibold rounded-xl shadow-gren hover:shadow-gren transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
    );
}
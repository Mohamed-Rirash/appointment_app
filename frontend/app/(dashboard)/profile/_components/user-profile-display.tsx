import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import {
    CheckCircle2,
    Mail,
    User,
    Shield,
    Building2,
    Calendar,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface UserProfileDisplayProps {
    user: {
        email: string;
        first_name: string;
        last_name: string;
        is_active: boolean;
        is_verified: boolean;
        created_at: string,
        roles: string[];
    };
}

export function UserProfileDisplay({ user }: UserProfileDisplayProps) {
    const { email, first_name, last_name, is_active, is_verified, roles } = user;

    return (
        <div className="space-y-8">
            {/* Enhanced Profile Header */}
            <Link href={"/"}>
                <Button variant={"ghost"} className="my-6 flex gap-2" >  <ArrowLeft className="h-4 w-4 mr-2" />Back to Home</Button>
            </Link>
            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-brand via-brand/80 to-brand/60 text-white shadow-gren">
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
                                    <Badge className={`${is_active ? 'bg-brand-primary/10 text-white' : 'bg-brand-gray/20 text-brand-gray'} border-0 font-medium px-3 py-1`}>
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
                    <Card className="border-0 shadow-gren bg-linear-to-br from-white to-brand-primary/20">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-2xl font-bold text-brand-black">
                                <div className="p-2 bg-brand-primary rounded-xl">
                                    <User className="w-6 h-6 text-brand" />
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
                                <div className="flex items-center gap-3 bg-brand-primary/10 rounded-lg px-4 py-3">
                                    <p className="text-xl font-semibold text-brand-black flex-1">
                                        {email}
                                    </p>
                                    {is_verified && (
                                        <Badge className="bg-brand-primary/50 text-brand border-green-200">
                                            <CheckCircle2 className="w-4 h-4 mr-1" />
                                            Verified
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm  font-medium flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Role
                                </Label>
                                <div className="bg-brand-primary/10 rounded-lg px-4 py-3">
                                    <p className="text-xl font-semibold text-gray-900 capitalize">
                                        {roles?.join?.(', ') || roles || "No role assigned"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Info Section */}
                    <Card className="border-0 shadow-gren bg-linear-to-br from-white to-brand-primary/30">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-xl font-bold text-brand-black">
                                <div className="p-2 bg-brand-primary/50 rounded-xl">
                                    <Building2 className="w-5 h-5 text-brand" />
                                </div>
                                Additional Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-1 gap-6 text-brand-gray">
                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-brand-secondary">
                                    <Calendar className="w-5 h-5 text-brand" />
                                    <div>
                                        <p className="text-sm font-medium">Member Since</p>
                                        <p className="text-brand-black font-semibold">
                                            {format(new Date(user.created_at), "MMM d, yyyy")}
                                        </p>
                                        <p className="text-xs text-brand-gray">
                                            {format(new Date(user.created_at), "h:mm a")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
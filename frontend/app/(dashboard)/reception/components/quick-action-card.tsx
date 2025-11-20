"use client";

import { QrCode, UserPlus, ArrowRight, Search, User, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface QuickActionCardProps {
    icon: "qr" | "walk-in";
    title: string;
    description: string;
    href: string;
    variant: "primary" | "secondary";
    shortcut?: string;
}

export function QuickActionCard({
    icon,
    title,
    description,
    href,
    variant,
    shortcut,
}: QuickActionCardProps) {
    const Icon = icon === "qr" ? Search : UserPlus;
    const actionVerb = icon === "qr" ? "Find & Check In" : "Register"; // Updated action verb

    return (
        <Card className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] cursor-pointer border-2 border-transparent hover:border-brand/20">
            {/* Brand gradient overlay */}
            <div
                className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${variant === "primary"
                    ? "bg-gradient-to-br from-brand/5 via-brand/10 to-brand/20"
                    : "bg-gradient-to-br from-brand-primary/10 via-brand-primary/20 to-brand-primary/30"
                    }`}
                aria-hidden="true"
            />

            <div className="relative p-6 space-y-6">
                {/* Header with Icon and Badge */}
                <div className="flex items-start justify-between gap-4">
                    <div className={`p-3 rounded-xl transition-all duration-300 group-hover:shadow-lg ${variant === "primary"
                        ? "bg-brand-primary group-hover:bg-brand-primary/80"
                        : "bg-brand-primary/50 group-hover:bg-brand-primary/70"
                        }`}>
                        <Icon className={`w-7 h-7 transition-transform duration-300 group-hover:scale-110 ${variant === "primary"
                            ? "text-brand"
                            : "text-brand"
                            }`} />
                    </div>

                    {shortcut && (
                        <Badge
                            variant="secondary"
                            className="hidden sm:inline-flex px-3 py-1 text-xs font-mono bg-brand-primary text-brand border border-brand/20 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-sm"
                        >
                            {shortcut}
                        </Badge>
                    )}
                </div>

                {/* Content */}
                <div className="space-y-3">
                    <h3 className="text-xl font-bold tracking-tight text-brand-black transition-colors duration-300 group-hover:text-brand">
                        {title}
                    </h3>
                    <p className="text-sm text-brand-gray leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Enhanced visual indicator */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-brand-gray">
                        <div className={`w-2 h-2 rounded-full ${variant === "primary" ? "bg-brand" : "bg-brand/60"}`}></div>
                        <span>Quick action</span>
                    </div>

                    {/* Action Button */}
                    <Button
                        size="lg"
                        className={`group/button transition-all duration-300 rounded-xl font-semibold ${variant === "primary"
                            ? "bg-brand text-brand-primary hover:bg-brand/90 shadow-lg hover:shadow-xl hover:scale-105"
                            : "bg-brand-primary text-brand border-2 border-brand/20 hover:bg-brand hover:text-brand-primary"
                            }`}
                        asChild
                    >
                        <Link href={href} className="flex items-center justify-center gap-2 px-6">
                            <span className="font-semibold">
                                {actionVerb}
                            </span>
                            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/button:translate-x-1" />
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Enhanced visual indicator */}
            <div className={`absolute left-0 top-0 h-full w-1 transition-all duration-300 ${variant === "primary"
                ? "bg-brand group-hover:w-2 group-hover:shadow-lg"
                : "bg-brand/60 group-hover:w-2 group-hover:shadow-lg"
                }`} aria-hidden="true" />

            {/* Corner accent */}
            <div className={`absolute top-0 right-0 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${variant === "primary" ? "text-brand" : "text-brand/60"}`}>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 rounded-tr-lg"></div>
            </div>
        </Card>
    );
}

// New component for the search/check-in functionality

export function CheckInSearchCard() {
    return (
        <Link href="/reception/check-in mb-4" >
            <Card className="group relative overflow-hidden bg-linear-to-br from-brand-primary to-brand-primary/80 border-2 border-brand/20 transition-all duration-300 hover:shadow-xl">
                <div className="relative p-4 space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Search className="w-8 h-8 text-brand" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-brand-black">Find & Check In</h3>
                            <p className="text-brand-gray mt-1">Search for appointments and mark as completed</p>
                        </div>
                    </div>

                    {/* Search Input Preview */}
                    <div className="bg-white/90 rounded-xl p-4 border border-brand/10 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Search className="w-5 h-5 text-brand-gray" />
                            <input
                                type="text"
                                placeholder="Search by name, phone, or appointment ID..."
                                className="flex-1 bg-transparent border-none outline-none text-brand-black placeholder-brand-gray text-lg"
                                disabled
                            />
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-brand-gray">
                            <User className="w-4 h-4 text-brand" />
                            <span>Search by name</span>
                        </div>
                        <div className="flex items-center gap-2 text-brand-gray">
                            <Scan className="w-4 h-4 text-brand" />
                            <span>Quick search</span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <Button
                        size="lg"
                        className="w-full bg-brand flex items-center justify-center gap-3 text-brand-primary hover:bg-brand/90 text-lg font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                    >
                        <Search className="w-5 h-5" />
                        <span>Start Search</span>
                        <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />

                    </Button>

                </div>

                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand to-transparent"></div>
                </div>
            </Card>
        </Link>
    );
}
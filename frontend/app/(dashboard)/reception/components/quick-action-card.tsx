"use client";

import { QrCode, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    const Icon = icon === "qr" ? QrCode : UserPlus;

    return (
        <Card className="hover:shadow-lg transition-shadow min-h-[200px]">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Icon className="h-10 w-10 text-primary" />
                        <CardTitle className="text-xl">{title}</CardTitle>
                    </div>
                    {shortcut && (
                        <Badge variant="outline" className="hidden lg:inline-flex">
                            {shortcut}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-6">{description}</p>
                <Button
                    size="lg"
                    className="w-full text-lg py-6 min-h-[60px]"
                    variant={variant === "primary" ? "default" : "outline"}
                    asChild
                >
                    <Link href={href}>
                        <Icon className="mr-2 h-5 w-5" />
                        {title}
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
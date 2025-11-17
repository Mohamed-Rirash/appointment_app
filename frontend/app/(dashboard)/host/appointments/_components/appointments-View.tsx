// components/appointments/appointment-view.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, RefreshCw, AlertCircle, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppointmentsFilters } from "./appointments-filters";
import { AppointmentsTable } from "./appointments-table";
import { client } from "@/helpers/api/client";
import { Skeleton } from "@/components/ui/skeleton";

interface AppointmentsViewProps {
    office_id: string;
    token: string | undefined;
}

type EndpointType = "allpastappointments" | "appointments" | "search";

interface SearchParams {
    status: string;
    date: string;
    search: string;
    page: string;
}

export function AppointmentView({
    office_id,
    token
}: AppointmentsViewProps) {
    const queryClient = useQueryClient();
    const [activeEndpoint, setActiveEndpoint] = useState<EndpointType>("appointments");
    const [searchParams, setSearchParams] = useState<SearchParams>({
        status: "all",
        date: "today",
        search: "",
        page: "1"
    });

    // Determine which endpoint to use based on filters
    const getEndpointConfig = () => {
        const { status, date, search, page } = searchParams;
        const limit = 20;
        const offset = (parseInt(page) - 1) * limit;

        if (search && search.trim() !== "") {
            return {
                endpoint: "search" as EndpointType,
                queryFn: async () => {
                    if (!token) throw new Error("No token provided");
                    return await client.searchAppointments(office_id, search, limit, offset, token);
                },
                queryKey: ["reception-appointments", "search", office_id, search, page]
            };
        } else if (date !== "today" || status !== "all") {
            return {
                endpoint: "allpastappointments" as EndpointType,
                queryFn: async () => {
                    if (!token) throw new Error("No token provided");
                    return await client.getAllPastAppointments(office_id, date, status, limit, offset, token);
                },
                queryKey: ["reception-appointments", "allpast", office_id, date, status, page]
            };
        } else {
            return {
                endpoint: "appointments" as EndpointType,
                queryFn: async () => {
                    if (!token) throw new Error("No token provided");
                    return await client.getOfficeAppointments(office_id, status, limit, offset, token);
                },
                queryKey: ["reception-appointments", "status", office_id, status, page]
            };
        }
    };

    const endpointConfig = getEndpointConfig();

    const { data: appointmentsData, isLoading, isError, error } = useQuery({
        queryKey: endpointConfig.queryKey,
        queryFn: endpointConfig.queryFn,
        enabled: !!token,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Update active endpoint when config changes
    useEffect(() => {
        setActiveEndpoint(endpointConfig.endpoint);
    }, [endpointConfig.endpoint]);

    const handleFilterChange = (newParams: Partial<SearchParams>) => {
        setSearchParams(prev => ({ ...prev, ...newParams, page: "1" }));
    };

    const handlePageChange = (newPage: number) => {
        setSearchParams(prev => ({ ...prev, page: newPage.toString() }));
    };

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ["reception-appointments"] });
    };

    if (isError) {
        return (
            <div className="space-y-6 p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Failed to load appointments. {error instanceof Error ? error.message : "Please try again."}
                    </AlertDescription>
                </Alert>
                <Button onClick={handleRefresh} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                </Button>
            </div>
        );
    }

    const appointments = appointmentsData?.appointments || [];
    const totalCount = appointmentsData?.total || 0;

    const pagination = {
        total: totalCount,
        limit: 20,
        offset: (parseInt(searchParams.page) - 1) * 20,
        currentPage: parseInt(searchParams.page)
    };

    const getEndpointDescription = () => {
        switch (activeEndpoint) {
            case "search":
                return `Search results for "${searchParams.search}"`;
            case "allpastappointments":
                return `Historical appointments • ${searchParams.date !== "today" ? `Date: ${searchParams.date} • ` : ""}${searchParams.status !== "all" ? `Status: ${searchParams.status}` : ""}`;
            case "appointments":
                return `Current appointments • ${searchParams.status !== "all" ? `Status: ${searchParams.status}` : "All statuses"}`;
            default:
                return "All appointments";
        }
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <CalendarDays className="h-8 w-8 text-brand" />
                        Reception Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage all office appointments and citizen interactions
                    </p>
                </div>
                <Button onClick={handleRefresh} disabled={isLoading} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <AppointmentsFilters
                currentStatus={searchParams.status}
                currentDate={searchParams.date}
                currentSearch={searchParams.search}
                totalCount={totalCount}
                onFilterChange={handleFilterChange}
            />

            {/* Endpoint Info Banner */}
            <Alert className="bg-blue-50 border-blue-200">
                <Filter className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                    <strong className="capitalize">{activeEndpoint.replace(/([A-Z])/g, ' $1').trim()}</strong> • {getEndpointDescription()}
                </AlertDescription>
            </Alert>

            {/* Appointments Table */}
            <AppointmentsTable
                appointments={appointments}
                officeId={office_id}
                pagination={pagination}
                endpointUsed={activeEndpoint}
                isLoading={isLoading}
                onPageChange={handlePageChange}
                currentPage={parseInt(searchParams.page)}
                totalPages={Math.ceil(totalCount / 20)}
            />
        </div>
    );
}

// Loading state component for the main view
export function AppointmentViewSkeleton() {
    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
}
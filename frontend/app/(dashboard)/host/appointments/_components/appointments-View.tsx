"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, } from "@/components/ui/card";
import { Filter, RefreshCw, AlertCircle, CalendarDays, Users, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppointmentsFilters } from "./appointments-filters";
import { AppointmentsTable } from "./appointments-table";
import { client } from "@/helpers/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
                queryKey: ["host-appointments", "search", office_id, search, page]
            };
        } else if (date !== "today") {
            return {
                endpoint: "allpastappointments" as EndpointType,
                queryFn: async () => {
                    if (!token) throw new Error("No token provided");
                    return await client.getAllPastAppointments(office_id, date, status, limit, offset, token);
                },
                queryKey: ["reception-appointments", "allpast", office_id, date, status, page]
            };
        }
        else {
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

    // Calculate some stats for the header
    const appointments = appointmentsData?.appointments || [];
    const totalCount = appointmentsData?.total || 0;


    if (isError) {
        return (
            <Card className="border-red-200 bg-red-50/50">
                <CardContent className="p-8 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Appointments</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                        {error instanceof Error ? error.message : "We couldn't retrieve the appointment data. Please try again."}
                    </p>
                    <Button onClick={handleRefresh} variant="outline" className="border-red-200 hover:bg-red-100">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry Loading
                    </Button>
                </CardContent>
            </Card>
        );
    }

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

    const getViewType = () => {
        if (searchParams.search) return "search";
        if (searchParams.date !== "today" || searchParams.status !== "all") return "filtered";
        return "current";
    };

    const viewType = getViewType();

    return (
        <div className="space-y-8">
            {/* View Type Tabs */}
            <Card className="border-0 bg-white shadow-sm">
                <CardContent className="p-4">
                    <Tabs value={viewType} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger
                                value="current"
                                onClick={() => handleFilterChange({ status: "all", date: "today", search: "" })}
                                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                            >
                                <CalendarDays className="h-4 w-4 mr-2" />
                                Current
                            </TabsTrigger>
                            <TabsTrigger
                                value="filtered"
                                className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                Filtered
                            </TabsTrigger>
                            <TabsTrigger
                                value="search"
                                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
                            >
                                <Users className="h-4 w-4 mr-2" />
                                Search
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Filters */}
            <AppointmentsFilters
                currentStatus={searchParams.status}
                currentDate={searchParams.date}
                currentSearch={searchParams.search}
                totalCount={totalCount}
                onFilterChange={handleFilterChange}
            />

            {/* Enhanced Endpoint Info Banner */}
            {viewType !== "current" && (
                <Alert className={`border-0 shadow-sm ${viewType === "search"
                    ? "bg-green-50 border-green-200"
                    : "bg-purple-50 border-purple-200"
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${viewType === "search" ? "bg-green-100" : "bg-purple-100"
                            }`}>
                            <Filter className={`h-4 w-4 ${viewType === "search" ? "text-green-600" : "text-purple-600"
                                }`} />
                        </div>
                        <div className="flex-1">
                            <AlertDescription className={`font-medium ${viewType === "search" ? "text-green-800" : "text-purple-800"
                                }`}>
                                <span className="capitalize font-semibold">{viewType} view</span> • {getEndpointDescription()}
                            </AlertDescription>
                        </div>
                        <Badge
                            variant="outline"
                            className={
                                viewType === "search"
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : "bg-purple-100 text-purple-700 border-purple-200"
                            }
                        >
                            {appointments.length} results
                        </Badge>
                    </div>
                </Alert>
            )}

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

// Enhanced Loading state component
export function AppointmentViewSkeleton() {
    return (
        <div className="space-y-8">
            {/* Header Skeleton */}
            <Card className="border-0 bg-gradient-to-br from-white to-blue-50/30 shadow-lg">
                <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-14 w-14 rounded-2xl" />
                            <div className="space-y-3">
                                <Skeleton className="h-8 w-48" />
                                <Skeleton className="h-5 w-64" />
                            </div>
                        </div>
                        <Skeleton className="h-11 w-32" />
                    </div>

                    {/* Stats Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <div className="space-y-2">
                                    <Skeleton className="h-7 w-16" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Tabs Skeleton */}
            <Card className="border-0 bg-white shadow-sm">
                <CardContent className="p-4">
                    <Skeleton className="h-10 w-full rounded-md" />
                </CardContent>
            </Card>

            {/* Filters Skeleton */}
            <Card className="border-0 bg-white shadow-lg">
                <CardContent className="p-6">
                    <div className="space-y-6">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <div className="flex gap-4">
                            <Skeleton className="h-10 w-40 rounded-xl" />
                            <Skeleton className="h-10 w-40 rounded-xl" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table Skeleton */}
            <Card className="border-0 bg-white shadow-lg">
                <CardContent className="p-0">
                    <div className="p-6 border-b">
                        <Skeleton className="h-6 w-64" />
                    </div>
                    <div className="p-6 space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 py-4 border-b last:border-b-0">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-48" />
                                </div>
                                <Skeleton className="h-6 w-16 rounded-full" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
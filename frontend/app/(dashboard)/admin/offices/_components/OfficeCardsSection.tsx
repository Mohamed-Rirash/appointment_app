// components/office/OfficeCardsSection.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOffices } from "@/helpers/hooks/office/useOffices";
import { OfficeCard } from "./OfficeCard";
import { Search, Filter, X, AlertCircle, RefreshCw, Building2, SlidersHorizontal, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Office {
    name: string;
    description: string;
    location: string;
    id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export default function OfficeCardsSection({ token }: { token?: string }) {
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const { offices, isLoading, isError, refetch } = useOffices(token);

    const handleSearch = () => {
        setSearchTerm(searchInput.trim());
    };

    const handleClear = () => {
        setSearchInput("");
        setSearchTerm("");
        setStatusFilter(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const filteredOffices = offices.filter((office: Office) => {
        const matchesSearch = !searchTerm ||
            office.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            office.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            office.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = !statusFilter ||
            (statusFilter === "active" && office.is_active) ||
            (statusFilter === "inactive" && !office.is_active);

        return matchesSearch && matchesStatus;
    });

    if (isError) {
        return (
            <Card className="w-full border-orange-200">
                <CardContent className="p-8 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                        <AlertCircle className="h-6 w-6 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Offices</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                        We couldn't retrieve your office locations. Please try again.
                    </p>
                    <Button onClick={() => refetch()} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Enhanced Search and Filters Section */}
            <Card className=" shadow-gren border-none!">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {/* Section Header */}
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-primary rounded-lg">
                                <Search className="h-5 w-5 text-brand" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Find Offices</h3>
                                <p className="text-sm text-brand-gray">Search by name, location, or description</p>
                            </div>
                        </div>

                        {/* Search and Filters Row */}
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Enhanced Search Bar */}
                            <div className="flex-1">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray group-focus-within:text-brand transition-colors" />
                                    <Input
                                        placeholder="Search offices by name, location, or description..."
                                        className="pl-11 pr-20 py-3 h-12 text-base rounded-xl border-brand-primary focus:border-brand focus:ring-brand/20 transition-all duration-200 bg-white shadow-gren"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        disabled={isLoading}
                                    />
                                    {/* Enhanced Clear and Search Buttons */}
                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                                        {searchInput && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 hover:bg-brand-secondary rounded-lg transition-colors"
                                                onClick={() => setSearchInput("")}
                                                disabled={isLoading}
                                            >
                                                <X className="h-4 w-4 text-gray-500" />
                                            </Button>
                                        )}
                                        <Button
                                            onClick={handleSearch}
                                            disabled={isLoading || !searchInput.trim()}
                                            className="h-8 px-3 bg-brand/60 hover:bg-brand text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-gren"
                                        >
                                            {isLoading ? (
                                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Search className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced Filters */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="hidden sm:flex items-center gap-2 text-sm text-brand-gray font-medium">
                                        <SlidersHorizontal className="h-4 w-4" />
                                        Filters:
                                    </div>

                                    <Select
                                        value={statusFilter || undefined}
                                        onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger className="w-full sm:w-44 rounded-xl border-brand-gray bg-white shadow-gren h-11">
                                            <div className="flex items-center gap-2">
                                                <Filter className="h-4 w-4 text-gray-500" />
                                                <SelectValue placeholder="Office Status" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-brand-secondary shadow-lg">
                                            <SelectItem value="all" className="rounded-lg">All Offices</SelectItem>
                                            <SelectItem value="active" className="rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-brand rounded-full"></div>
                                                    Active Offices
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="inactive" className="rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-brand-gray rounded-full"></div>
                                                    Inactive Offices
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Active Search and Filter Indicators */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search Term Indicator */}
                            {searchTerm && (
                                <Badge variant="secondary" className="bg-brand/50 text-brand border-brand-primary px-3 py-1.5">
                                    <Search className="h-3.5 w-3.5 mr-1.5" />
                                    Search: "{searchTerm}"
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 p-0 ml-2 hover:bg-blue-100"
                                        onClick={() => setSearchTerm("")}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Badge>
                            )}

                            {/* Status Filter Indicator */}
                            {statusFilter && statusFilter !== "all" && (
                                <Badge
                                    variant="secondary"
                                    className={`px-3 py-1.5 border ${statusFilter === "active"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-gray-50 text-gray-700 border-gray-200"
                                        }`}
                                >
                                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                                    Status: {statusFilter === "active" ? "Active" : "Inactive"}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 p-0 ml-2 hover:bg-gray-100"
                                        onClick={() => setStatusFilter(null)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Badge>
                            )}

                            {/* Clear All Button */}
                            {(searchTerm || statusFilter) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClear}
                                    className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                                >
                                    <X className="h-3.5 w-3.5 mr-1" />
                                    Clear all
                                </Button>
                            )}

                            {/* Loading Indicator */}
                            {isLoading && (
                                <Badge variant="secondary" className="bg-brand-primary text-brand border-brand-primary px-3 py-1.5">
                                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    Searching offices...
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Summary */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h4 className="text-sm font-semibold text-gray-900">Office Locations</h4>
                    <Badge variant="outline" className="bg-white text-gray-700 border-gray-200">
                        {filteredOffices.length} {filteredOffices.length === 1 ? 'office' : 'offices'}
                    </Badge>
                    {offices.length > 0 && (
                        <span className="text-sm text-gray-500">
                            of {offices.length} total
                        </span>
                    )}
                </div>

                {isLoading && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span className="font-medium">Loading offices...</span>
                    </div>
                )}
            </div>

            {/* Office Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="h-48 animate-pulse">
                            <CardContent className="p-6">
                                <Skeleton className="h-6 w-3/4 mb-3" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-5/6 mb-4" />
                                <Skeleton className="h-px w-full mb-4" />
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : filteredOffices.length === 0 ? (
                    <div className="col-span-full">
                        <Card className="bg-white border-dashed border-2 border-gray-200">
                            <CardContent className="py-16 text-center">
                                <div className="space-y-4">
                                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                        <Building2 className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            No offices found
                                        </h3>
                                        <p className="text-sm text-gray-500 max-w-md mx-auto">
                                            {searchTerm || statusFilter
                                                ? "No offices match your current search criteria. Try adjusting your filters or search term."
                                                : "Get started by creating your first office location to organize your team."
                                            }
                                        </p>
                                    </div>
                                    {(searchTerm || statusFilter) && (
                                        <Button
                                            variant="outline"
                                            onClick={handleClear}
                                            className="mt-4"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Clear search and filters
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    filteredOffices.map((office: Office) => (
                        <OfficeCard key={office.id} office={office} token={token} />
                    ))
                )}
            </div>
        </div>
    );
}
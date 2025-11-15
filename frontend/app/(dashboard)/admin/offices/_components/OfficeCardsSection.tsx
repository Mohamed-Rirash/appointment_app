"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOffices } from "@/helpers/hooks/office/useOffices";
import { OfficeCard } from "./OfficeCard";
import { Search } from "lucide-react";

interface Office {
    name: string,
    description: string,
    location: string,
    id: string,
    is_active: boolean,
    created_at: string,
    updated_at: string,

}

export default function OfficeCardsSection({ token }: { token?: string }) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const { offices, isLoading } = useOffices(token);
    const filteredOffices = offices.filter((office: Office) => {
        const matchesSearch = !search ||
            office.name.toLowerCase().includes(search.toLowerCase()) ||
            office.location.toLowerCase().includes(search.toLowerCase()) ||
            office.description.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter ||
            (statusFilter === "active" && office.is_active) ||
            (statusFilter === "inactive" && !office.is_active);
        return matchesSearch && matchesStatus;
    });
    console.log("officerr", offices)
    if (isLoading) {
        return <div>Loading...</div>;
    }
    return (
        <div className="">
            {/* Search and Filter */}
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-full mr-4">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray" />
                    <Input
                        placeholder="Search offices by name, location, or description.."
                        className="pl-10 py-5 text-[14px]"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select
                    value={statusFilter || undefined}
                    onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}
                >
                    <SelectTrigger className="w-[180px] text-[14px] py-5">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>``
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {/* Office Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOffices.map((office: Office) => (
                    <OfficeCard key={office.id} office={office} token={token} />
                ))}

            </div>
            {filteredOffices.length === 0 && <div className="flex w-full justify-center items-center"><p className="text-lg text-brand-gray font-medium">there nothing to show</p></div>}
        </div>
    );
}
import { useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdvancedSearchModal from "./advanced-search-modal";
import { type SearchParams } from "@shared/schema";

interface SearchBarProps {
  searchParams: SearchParams;
  onSearchParamsChange: (params: SearchParams) => void;
}

export default function SearchBar({ searchParams, onSearchParamsChange }: SearchBarProps) {
  const [query, setQuery] = useState(searchParams.query || "");

  const handleSearch = () => {
    onSearchParamsChange({ ...searchParams, query: query.trim() || undefined });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const filterOptions = [
    { key: "all", label: "All Documents", active: !searchParams.categories?.length },
    { key: "invoices", label: "Invoices", active: searchParams.categories?.includes("Invoices") },
    { key: "receipts", label: "Receipts", active: searchParams.categories?.includes("Receipts") },
    { key: "contracts", label: "Contracts", active: searchParams.categories?.includes("Contracts") },
    { key: "recent", label: "Last 30 Days", active: false }, // TODO: Implement date filtering
  ];

  const handleFilterClick = (filterKey: string) => {
    if (filterKey === "all") {
      onSearchParamsChange({ ...searchParams, categories: undefined });
    } else if (filterKey === "recent") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      onSearchParamsChange({ 
        ...searchParams, 
        dateFrom: thirtyDaysAgo.toISOString().split('T')[0]
      });
    } else {
      const categoryMap: Record<string, string> = {
        invoices: "Invoices",
        receipts: "Receipts", 
        contracts: "Contracts",
      };
      const category = categoryMap[filterKey];
      onSearchParamsChange({ 
        ...searchParams, 
        categories: category ? [category] : undefined 
      });
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Search Documents
          </CardTitle>
          <AdvancedSearchModal
            searchParams={searchParams}
            onSearchParamsChange={onSearchParamsChange}
            trigger={
              <Button variant="ghost" className="text-primary hover:text-primary-600 text-sm font-medium">
                Advanced Search
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Search in document content, titles, or tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-20 py-3 text-base"
          />
          <Button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary hover:bg-primary-600 px-4 py-1.5 text-sm"
          >
            Search
          </Button>
        </div>

        {/* Search Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {filterOptions.map((option) => (
            <Badge
              key={option.key}
              variant={option.active ? "default" : "secondary"}
              className={`cursor-pointer ${
                option.active 
                  ? "bg-primary hover:bg-primary-600 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => handleFilterClick(option.key)}
            >
              {option.label}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { ScanText, Bell, Search, Filter, Calendar, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import FileUpload from "@/components/file-upload";
import DocumentList from "@/components/document-list";
import DocumentPreviewModal from "@/components/document-preview-modal";
import DashboardStats from "@/components/dashboard-stats";
import CategorySidebar from "@/components/category-sidebar";
import CategorySelector from "@/components/category-selector";
import ProcessingQueue from "@/components/processing-queue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { type Document, type SearchParams } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults = [], isLoading: isSearching, error: searchError } = useQuery<Document[]>({
    queryKey: ["/api/documents/search", searchParams],
    queryFn: async () => {
      // Use POST endpoint for search with body params
      const data = await apiRequest("POST", "/api/documents/search", searchParams);
      
      // Ensure we always return an array
      if (!Array.isArray(data)) {
        return [];
      }
      
      return data;
    },
    enabled: Object.keys(searchParams).some(key => {
      const value = searchParams[key as keyof SearchParams];
      if (key === 'query') return value && (value as string).trim().length > 0;
      if (key === 'documentType') return value && value !== 'all';
      if (key === 'minConfidence') return value && (value as number) > 0;
      if (Array.isArray(value)) return value.length > 0;
      return !!value;
    }),
    retry: 2,
    retryDelay: 1000,
  });

  const hasActiveSearch = Object.keys(searchParams).some(key => {
    const value = searchParams[key as keyof SearchParams];
    if (key === 'query') return value && (value as string).trim().length > 0;
    if (key === 'documentType') return value && value !== 'all';
    if (key === 'minConfidence') return value && (value as number) > 0;
    if (Array.isArray(value)) return value.length > 0;
    return !!value;
  });

  const handleSearch = () => {
    const newParams: SearchParams = { ...searchParams };
    if (searchQuery.trim()) {
      newParams.query = searchQuery.trim();
    } else {
      delete newParams.query;
    }
    setSearchParams(newParams);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchParams({});
    setSearchQuery("");
    setShowAdvanced(false);
  };

  const updateSearchParam = (key: keyof SearchParams, value: any) => {
    const newParams = { ...searchParams };
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
      delete newParams[key];
    } else {
      newParams[key] = value;
    }
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50/50 to-indigo-100/80">
      {/* Navigation Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="relative">
                  <ScanText className="text-purple-600 text-2xl mr-3 pulse-glow" size={24} />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">DocScan Pro</h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-2">
              <Button variant="ghost" className="text-purple-600 font-medium bg-purple-50/60 hover:bg-purple-100/60 rounded-lg">
                Dashboard
              </Button>
              <Link href="/analytics">
                <Button variant="ghost" className="text-gray-500 hover:text-purple-600 hover:bg-purple-50/50 transition-all duration-200 rounded-lg">
                  Analytics
                </Button>
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-white text-sm font-medium">
                  JD
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <DashboardStats />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* File Upload Section */}
            <div id="file-upload-section" tabIndex={-1}>
              <FileUpload />
            </div>

            {/* Unified Search Interface */}
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">Search Documents</CardTitle>
                  <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Filter className="h-4 w-4" />
                        {showAdvanced ? "Hide Filters" : "Advanced Filters"}
                      </Button>
                    </CollapsibleTrigger>
                  </Collapsible>
                </div>

                {/* Main Search Bar */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Search documents by text content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="h-10"
                    />
                  </div>
                  <Button 
                    onClick={handleSearch}
                    className="h-10 px-6 bg-primary hover:bg-primary/90"
                    disabled={isSearching}
                  >
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                  {hasActiveSearch && (
                    <Button
                      variant="outline"
                      onClick={clearSearch}
                      className="h-10 px-4"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Advanced Filters */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleContent>
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Document Type Filter */}
                        <div className="space-y-2">
                          <Label htmlFor="docType">Document Type</Label>
                          <select
                            id="docType"
                            value={searchParams.documentType || "all"}
                            onChange={(e) => updateSearchParam("documentType", e.target.value === "all" ? undefined : e.target.value)}
                            className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm"
                          >
                            <option value="all">All Types</option>
                            <option value="invoice">Invoice</option>
                            <option value="receipt">Receipt</option>
                            <option value="contract">Contract</option>
                            <option value="report">Report</option>
                            <option value="letter">Letter</option>
                            <option value="form">Form</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        {/* Confidence Threshold */}
                        <div className="space-y-2">
                          <Label htmlFor="confidence">Min Confidence (%)</Label>
                          <Input
                            id="confidence"
                            type="number"
                            min="0"
                            max="100"
                            value={searchParams.minConfidence || ""}
                            onChange={(e) => updateSearchParam("minConfidence", e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="0-100"
                            className="h-10"
                          />
                        </div>

                        {/* Date Range */}
                        <div className="space-y-2">
                          <Label>Date Range</Label>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-500">Coming soon</span>
                          </div>
                        </div>
                      </div>

                      {/* Entity Filters */}
                      <div className="space-y-2">
                        <Label>Entity Types</Label>
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="hasEmails"
                              checked={searchParams.hasEmails || false}
                              onCheckedChange={(checked) => updateSearchParam("hasEmails", checked || undefined)}
                            />
                            <Label htmlFor="hasEmails" className="text-sm">Has Emails</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="hasPhones"
                              checked={searchParams.hasPhones || false}
                              onCheckedChange={(checked) => updateSearchParam("hasPhones", checked || undefined)}
                            />
                            <Label htmlFor="hasPhones" className="text-sm">Has Phone Numbers</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="hasAmounts"
                              checked={searchParams.hasAmounts || false}
                              onCheckedChange={(checked) => updateSearchParam("hasAmounts", checked || undefined)}
                            />
                            <Label htmlFor="hasAmounts" className="text-sm">Has Amounts</Label>
                          </div>
                        </div>
                      </div>

                      {/* Category Filter */}
                      <div className="space-y-2">
                        <Label>Categories</Label>
                        <CategorySelector
                          selectedCategories={searchParams.categories || []}
                          onCategoriesChange={(categories) => updateSearchParam("categories", categories.length > 0 ? categories : undefined)}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Active Filters Display */}
                {hasActiveSearch && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                    {searchParams.query && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Text: "{searchParams.query}"
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => {
                            setSearchQuery("");
                            updateSearchParam("query", undefined);
                          }}
                        />
                      </Badge>
                    )}
                    {searchParams.documentType && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Type: {searchParams.documentType}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => updateSearchParam("documentType", undefined)}
                        />
                      </Badge>
                    )}
                    {searchParams.minConfidence && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Min Confidence: {searchParams.minConfidence}%
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => updateSearchParam("minConfidence", undefined)}
                        />
                      </Badge>
                    )}
                    {searchParams.hasEmails && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Has Emails
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => updateSearchParam("hasEmails", undefined)}
                        />
                      </Badge>
                    )}
                    {searchParams.hasPhones && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Has Phones
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => updateSearchParam("hasPhones", undefined)}
                        />
                      </Badge>
                    )}
                    {searchParams.hasAmounts && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Has Amounts
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => updateSearchParam("hasAmounts", undefined)}
                        />
                      </Badge>
                    )}
                    {searchParams.categories && searchParams.categories.length > 0 && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Categories: {searchParams.categories.join(", ")}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => updateSearchParam("categories", undefined)}
                        />
                      </Badge>
                    )}
                  </div>
                )}
              </CardHeader>
            </Card>

            {/* Search Results or Recent Documents */}
            {hasActiveSearch ? (
              <Card className="shadow-lg border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-purple/5">
                <CardHeader className="pb-4 bg-primary/10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Search className="text-primary" size={20} />
                      Search Results 
                      {!isSearching && Array.isArray(searchResults) && (
                        <Badge variant="secondary" className="bg-primary/20 text-primary font-medium">
                          {searchResults.length} found
                        </Badge>
                      )}
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={clearSearch}
                      className="text-gray-600 hover:text-gray-800 border-primary/30"
                    >
                      Clear Search
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {searchError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-700">Search failed: {searchError.message}</p>
                    </div>
                  )}
                  
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Searching documents...</p>
                      </div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-4">
                      {searchResults.map((document) => (
                        <div
                          key={document.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedDocument(document)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-gray-900 truncate flex-1">
                              {document.title || document.originalName}
                            </h3>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {document.fileType}
                            </Badge>
                          </div>
                          
                          {document.extractedText && (
                            <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                              {document.extractedText.substring(0, 200)}...
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-1 mb-2">
                            {document.categories?.map((category) => (
                              <Badge key={category} variant="secondary" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Uploaded: {new Date(document.uploadDate).toLocaleDateString()}</span>
                            <span>{Math.round(document.fileSize / 1024)} KB</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                      <p className="text-gray-600">
                        Try adjusting your search criteria or upload more documents.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <DocumentList 
                searchParams={{}}
                onDocumentSelect={setSelectedDocument}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <CategorySidebar 
              onCategoryFilter={(category) => 
                setSearchParams(prev => ({ 
                  ...prev, 
                  categories: category ? [category] : undefined 
                }))
              }
            />
            <ProcessingQueue />
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {selectedDocument && (
        <DocumentPreviewModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
}

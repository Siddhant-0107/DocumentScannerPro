import { useState } from "react";
import { ScanText, Bell } from "lucide-react";
import { Link, useLocation } from "wouter";
import FileUpload from "@/components/file-upload";
import DocumentList from "@/components/document-list";
import DocumentPreviewModal from "@/components/document-preview-modal";
import SearchBar from "@/components/search-bar";
import AdvancedSearch, { type SearchFilters } from "@/components/advanced-search";
import DashboardStats from "@/components/dashboard-stats";
import CategorySidebar from "@/components/category-sidebar";
import ProcessingQueue from "@/components/processing-queue";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { type Document, type SearchParams } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});

  const { data: searchResults = [], isLoading: isSearching } = useQuery<Document[]>({
    queryKey: ["/api/documents/search", searchFilters],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      
      if (searchFilters.query) queryParams.append('query', searchFilters.query);
      if (searchFilters.documentType) queryParams.append('documentType', searchFilters.documentType);
      if (searchFilters.hasEmails) queryParams.append('hasEmails', 'true');
      if (searchFilters.hasPhones) queryParams.append('hasPhones', 'true');
      if (searchFilters.hasAmounts) queryParams.append('hasAmounts', 'true');
      if (searchFilters.minConfidence) queryParams.append('minConfidence', searchFilters.minConfidence.toString());

      const response = await fetch(`/api/documents/search?${queryParams}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const data = await response.json();
      
      // Ensure we always return an array
      return Array.isArray(data) ? data : [];
    },
    enabled: Object.keys(searchFilters).length > 0,
  });

  const handleAdvancedSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
  };

  const hasActiveSearch = Object.keys(searchFilters).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50/50 to-indigo-100/80">
      {/* Navigation Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-50 to-violet-100">
                  <ScanText className="text-purple-600" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                    Document Scanner Pro
                  </h1>
                  <p className="text-xs text-gray-500">Intelligent Document Management</p>
                </div>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Button variant="ghost" className="text-primary font-medium">
                Dashboard
              </Button>
              <Link href="/documents">
                <Button variant="ghost" className="text-gray-500 hover:text-gray-700 font-medium">
                  Documents
                </Button>
              </Link>
              <Link href="/categories">
                <Button variant="ghost" className="text-gray-500 hover:text-gray-700 font-medium">
                  Categories
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="ghost" className="text-gray-500 hover:text-gray-700 font-medium">
                  Analytics
                </Button>
              </Link>
              <Button variant="ghost" className="text-gray-500 hover:text-gray-700 font-medium">
                Settings
              </Button>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <CategorySidebar 
              onCategoryFilter={(categories: string | null) => setSearchParams({...searchParams, categories: categories ? [categories] : undefined})} 
            />
            <ProcessingQueue />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Stats */}
            <DashboardStats />

            {/* Advanced Search */}
            <AdvancedSearch onSearch={handleAdvancedSearch} isLoading={isSearching} />

            {/* File Upload */}
            {!hasActiveSearch && <FileUpload />}

            {/* Search Results or Document List */}
            {hasActiveSearch ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Search Results ({Array.isArray(searchResults) ? searchResults.length : 0} found)
                </h3>
                {!Array.isArray(searchResults) || searchResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {isSearching ? "Searching..." : "No documents found matching your criteria."}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchResults.map((document) => (
                      <div
                        key={document.id}
                        className="flex items-center p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer bg-white"
                        onClick={() => setSelectedDocument(document)}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{document.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {document.structuredText?.documentType && (
                              <span className="capitalize">{document.structuredText.documentType} • </span>
                            )}
                            {document.structuredText?.confidence && (
                              <span>{Math.round(document.structuredText.confidence * 100)}% confidence • </span>
                            )}
                            {new Date(document.uploadDate).toLocaleDateString()}
                          </p>
                          {document.structuredText?.entities && (
                            <div className="flex gap-2 mt-2">
                              {document.structuredText.entities.emails.length > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  📧 {document.structuredText.entities.emails.length}
                                </span>
                              )}
                              {document.structuredText.entities.phones.length > 0 && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  📞 {document.structuredText.entities.phones.length}
                                </span>
                              )}
                              {document.structuredText.entities.amounts.length > 0 && (
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                  💰 {document.structuredText.entities.amounts.length}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <DocumentList 
                searchParams={searchParams}
                onDocumentSelect={setSelectedDocument}
              />
            )}
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

import { useState } from "react";
import { ScanText, Bell, Search, X, Plus, Download } from "lucide-react";
import FileUpload from "@/components/file-upload";
import DocumentList from "@/components/document-list";
import DocumentPreviewModal from "@/components/document-preview-modal";
import DashboardStats from "@/components/dashboard-stats";
import ProcessingQueue from "@/components/processing-queue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { type Document, type SearchParams } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults = [], isLoading: isSearching, error: searchError } = useQuery<Document[]>({
    queryKey: ["/api/documents/search", searchParams],
    queryFn: async () => {
      const data = await apiRequest("POST", "/api/documents/search", searchParams);
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(searchParams.query?.trim()),
    retry: 2,
    retryDelay: 1000,
  });

  const hasActiveSearch = Boolean(searchParams.query?.trim());

  const handleSearch = () => {
    const query = searchQuery.trim();
    setSearchParams(query ? { query } : {});
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const clearSearch = () => {
    setSearchParams({});
    setSearchQuery("");
  };

  const scrollToUpload = () => {
    document.getElementById("file-upload-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const exportData = async () => {
    try {
      const response = await fetch("/api/documents");
      if (!response.ok) throw new Error("Failed to fetch documents");
      const documents = await response.json();
      const blob = new Blob([JSON.stringify(documents, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `documents_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50/50 to-indigo-100/80">
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="relative flex-shrink-0">
                <ScanText className="text-purple-600 mr-3 pulse-glow" size={24} />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                DocScan Pro
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardStats />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="md:col-span-2 space-y-6">
            <div id="file-upload-section" tabIndex={-1}>
              <FileUpload />
            </div>

            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="space-y-4">
                <CardTitle className="text-xl font-semibold">Search Documents</CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search documents by text content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="h-10"
                  />
                  <Button
                    onClick={handleSearch}
                    className="h-10 px-6 bg-primary hover:bg-primary/90"
                    disabled={isSearching}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                  {hasActiveSearch && (
                    <Button variant="outline" onClick={clearSearch} className="h-10 px-4">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {hasActiveSearch && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Text: "{searchParams.query}"
                      <X className="h-3 w-3 cursor-pointer" onClick={clearSearch} />
                    </Badge>
                  </div>
                )}
              </CardHeader>
            </Card>

            {hasActiveSearch ? (
              <Card className="shadow-lg border-2 border-primary/30">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Search className="text-primary" size={20} />
                      Search Results
                      {!isSearching && <Badge variant="secondary">{searchResults.length} found</Badge>}
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={clearSearch}>Clear Search</Button>
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
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
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
                            <Badge variant="outline" className="ml-2 text-xs">{document.fileType}</Badge>
                          </div>
                          {document.extractedText && (
                            <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                              {document.extractedText.substring(0, 200)}...
                            </p>
                          )}
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
                      <p className="text-gray-600">Try another search term or upload more documents.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <DocumentList searchParams={{}} onDocumentSelect={setSelectedDocument} />
            )}
          </div>

          <div className="md:col-span-1 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start bg-blue-50 text-primary hover:bg-blue-100"
                  variant="ghost"
                  onClick={scrollToUpload}
                >
                  <Plus className="mr-3" size={16} />
                  Upload Documents
                </Button>
                <Button
                  className="w-full justify-start bg-gray-50 text-gray-700 hover:bg-gray-100"
                  variant="ghost"
                  onClick={exportData}
                >
                  <Download className="mr-3" size={16} />
                  Export Data
                </Button>
              </CardContent>
            </Card>
            <ProcessingQueue />
          </div>
        </div>
      </main>

      {selectedDocument && (
        <DocumentPreviewModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
}

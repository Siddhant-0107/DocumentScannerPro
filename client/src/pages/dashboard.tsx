import { useState } from "react";
import { ScanText, Bell } from "lucide-react";
import { Link, useLocation } from "wouter";
import FileUpload from "@/components/file-upload";
import DocumentList from "@/components/document-list";
import DocumentPreviewModal from "@/components/document-preview-modal";
import SearchBar from "@/components/search-bar";
import DashboardStats from "@/components/dashboard-stats";
import CategorySidebar from "@/components/category-sidebar";
import ProcessingQueue from "@/components/processing-queue";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { type Document, type SearchParams } from "@shared/schema";

export default function Dashboard() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchParams, setSearchParams] = useState<SearchParams>({});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="relative">
                  <ScanText className="text-blue-600 text-2xl mr-3 pulse-glow" size={24} />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">DocScan Pro</h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-2">
              <Button variant="ghost" className="text-blue-600 font-medium bg-blue-50/50 hover:bg-blue-100/50 rounded-lg">
                Dashboard
              </Button>
              <Link href="/analytics">
                <Button variant="ghost" className="text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200 rounded-lg">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload Section */}
            <FileUpload />

            {/* Search Section */}
            <SearchBar 
              searchParams={searchParams}
              onSearchParamsChange={setSearchParams}
            />

            {/* Recent Documents */}
            <DocumentList 
              searchParams={searchParams}
              onDocumentSelect={setSelectedDocument}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
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

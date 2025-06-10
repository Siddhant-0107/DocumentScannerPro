import { ScanText, Bell, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AnalyticsDashboard from "@/components/analytics-dashboard";

export default function Analytics() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <ScanText className="text-primary text-2xl mr-3" size={24} />
                <h1 className="text-xl font-bold text-gray-900">DocScan Pro</h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Button variant="ghost" className="text-gray-500 hover:text-gray-700 font-medium">
                Dashboard
              </Button>
              <Button variant="ghost" className="text-gray-500 hover:text-gray-700 font-medium">
                Documents
              </Button>
              <Button variant="ghost" className="text-gray-500 hover:text-gray-700 font-medium">
                Categories
              </Button>
              <Button variant="ghost" className="text-primary font-medium">
                Analytics
              </Button>
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
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="text-primary" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          </div>
          <p className="text-gray-600">
            Comprehensive insights into your document processing and management activities
          </p>
        </div>

        {/* Analytics Dashboard */}
        <AnalyticsDashboard />
      </div>
    </div>
  );
}
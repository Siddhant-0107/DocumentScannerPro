import { ScanText, Bell, BarChart3, ArrowLeft, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AnalyticsDashboard from "@/components/analytics-dashboard";

export default function Analytics() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50/50 to-indigo-100/80">
      {/* Navigation Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-purple-600 hover:bg-purple-50/50 transition-all duration-200">
                  <ArrowLeft size={16} className="mr-1" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-50 to-violet-100">
                  <BarChart3 className="text-purple-600" size={20} />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  Analytics Dashboard
                </h1>
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
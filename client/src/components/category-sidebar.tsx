import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FolderPlus, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CategoryManagementModal from "./category-management-modal";
import { useToast } from "@/hooks/use-toast";
import { type Category } from "@shared/schema";

interface CategorySidebarProps {
  onCategoryFilter: (category: string | null) => void;
}

export default function CategorySidebar({ onCategoryFilter }: CategorySidebarProps) {
  const { toast } = useToast();
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleExportData = async () => {
    try {
      const response = await fetch("/api/documents");
      const documents = await response.json();
      
      const exportData = {
        exported_at: new Date().toISOString(),
        total_documents: documents.length,
        documents: documents.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          original_name: doc.originalName,
          file_type: doc.fileType,
          file_size: doc.fileSize,
          extracted_text: doc.extractedText,
          categories: doc.categories,
          tags: doc.tags,
          processing_status: doc.processingStatus,
          upload_date: doc.uploadDate,
          processed_date: doc.processedDate
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `documents_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Document data has been exported to JSON file.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export document data.",
        variant: "destructive",
      });
    }
  };

  const getCategoryColor = (color: string) => {
    // Convert hex to Tailwind classes
    const colorMap: Record<string, string> = {
      "#EF4444": "bg-red-500",
      "#10B981": "bg-green-500", 
      "#F59E0B": "bg-yellow-500",
      "#3B82F6": "bg-blue-500",
      "#6B7280": "bg-gray-400",
    };
    return colorMap[color] || "bg-gray-400";
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            className="w-full justify-start bg-blue-50 text-primary hover:bg-blue-100"
            variant="ghost"
          >
            <Plus className="mr-3" size={16} />
            Upload Documents
          </Button>
          <CategoryManagementModal
            trigger={
              <Button 
                className="w-full justify-start bg-gray-50 text-gray-700 hover:bg-gray-100"
                variant="ghost"
              >
                <FolderPlus className="mr-3" size={16} />
                Create Category
              </Button>
            }
          />
          <Button 
            className="w-full justify-start bg-gray-50 text-gray-700 hover:bg-gray-100"
            variant="ghost"
            onClick={handleExportData}
          >
            <Download className="mr-3" size={16} />
            Export Data  
          </Button>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Categories
            </CardTitle>
            <Button variant="ghost" size="icon" className="text-primary hover:text-primary-600">
              <Plus size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => onCategoryFilter(category.name)}
              >
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${getCategoryColor(category.color)}`} />
                  <span className="text-sm font-medium text-gray-700">
                    {category.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {category.documentCount}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

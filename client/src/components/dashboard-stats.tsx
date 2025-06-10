import { useQuery } from "@tanstack/react-query";
import { FileText, Clock, Search, HardDrive } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Stats {
  totalDocuments: number;
  processing: number;
  searchable: number;
  storageUsed: string;
}

export default function DashboardStats() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/documents/stats"],
  });

  const statItems = [
    {
      icon: FileText,
      label: "Total Documents",
      value: stats?.totalDocuments || 0,
      color: "text-primary",
    },
    {
      icon: Clock,
      label: "Processing",
      value: stats?.processing || 0,
      color: "text-orange-500",
    },
    {
      icon: Search,
      label: "Searchable",
      value: stats?.searchable || 0,
      color: "text-green-500",
    },
    {
      icon: HardDrive,
      label: "Storage Used",
      value: stats?.storageUsed || "0 MB",
      color: "text-gray-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item, index) => (
        <Card key={index} className="shadow-card hover-lift bg-gradient-to-br from-white to-gray-50/50 border-0 overflow-hidden group">
          <CardContent className="p-6 relative">
            <div className="flex items-center">
              <div className="flex-shrink-0 relative">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 group-hover:from-blue-100 group-hover:to-indigo-200 transition-all duration-300">
                  <item.icon className={`${item.color} transition-transform duration-300 group-hover:scale-110`} size={24} />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{item.value}</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

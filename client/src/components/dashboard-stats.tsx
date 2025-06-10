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
        <Card key={index} className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <item.icon className={`${item.color} text-2xl`} size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

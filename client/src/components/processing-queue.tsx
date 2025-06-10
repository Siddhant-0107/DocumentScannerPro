import { useQuery } from "@tanstack/react-query";
import { Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Document } from "@shared/schema";

export default function ProcessingQueue() {
  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  const processingDocuments = documents.filter(doc => 
    doc.processingStatus === "processing" || doc.processingStatus === "pending"
  );

  const recentActivity = documents
    .filter(doc => doc.processingStatus === "completed")
    .slice(0, 3)
    .map(doc => ({
      title: "Document processed",
      description: `${doc.title} completed OCR`,
      time: "2 hours ago", // This would be calculated from processedDate
      color: "bg-green-500"
    }));

  return (
    <div className="space-y-6">
      {/* Processing Status */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Processing Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {processingDocuments.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No documents processing
            </div>
          ) : (
            <div className="space-y-3">
              {processingDocuments.map((document) => (
                <div key={document.id} className="flex items-center">
                  {document.processingStatus === "processing" ? (
                    <Loader2 className="processing-spinner text-primary mr-3" size={16} />
                  ) : (
                    <Clock className="text-orange-500 mr-3" size={16} />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {document.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {document.processingStatus === "processing" 
                        ? "Extracting text..." 
                        : "In queue"
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Processing Speed</span>
              <span className="font-medium text-gray-900">~2 min/doc</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No recent activity
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start">
                  <div className={`w-2 h-2 ${activity.color} rounded-full mt-2 mr-3 flex-shrink-0`} />
                  <div>
                    <p className="text-gray-900 font-medium">{activity.title}</p>
                    <p className="text-gray-500">{activity.description}</p>
                    <p className="text-gray-400 text-xs">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

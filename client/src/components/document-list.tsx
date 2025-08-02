import { useQuery } from "@tanstack/react-query";
import { FileText, FileImage, Eye, Trash2, CheckSquare, Mail, Phone, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { type Document, type SearchParams } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import BulkActionsModal from "./bulk-actions-modal";
import { useLocation } from "wouter";

interface DocumentListProps {
  searchParams: SearchParams;
  onDocumentSelect: (document: Document) => void;
}

export default function DocumentList({ searchParams, onDocumentSelect }: DocumentListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: Object.values(searchParams).some(v => v !== undefined)
      ? ["/api/documents/search", searchParams]
      : ["/api/documents"],
    queryFn: async () => {
      if (Object.values(searchParams).some(v => v !== undefined)) {
        const response = await apiRequest("POST", "/api/documents/search", searchParams);
        return response.json();
      } else {
        const response = await fetch("/api/documents");
        return response.json();
      }
    },
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: number) => 
      apiRequest("DELETE", `/api/documents/${documentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/stats"] });
      toast({
        title: "Document deleted",
        description: "Document has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getFileIcon = (fileType: string | null | undefined) => {
    if (typeof fileType === 'string' && fileType.startsWith('image/')) {
      return <FileImage className="text-green-500 text-xl" size={20} />;
    }
    return <FileText className="text-red-500 text-xl" size={20} />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Processed</Badge>;
      case "processing":
        return <Badge className="bg-orange-100 text-orange-800">Processing</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const getDocumentTypeBadge = (document: Document) => {
    if (!document.structuredText?.documentType || document.structuredText.documentType === 'other') {
      return null;
    }

    const typeColors = {
      invoice: 'bg-blue-50 text-blue-700 border-blue-200',
      receipt: 'bg-green-50 text-green-700 border-green-200',
      contract: 'bg-purple-50 text-purple-700 border-purple-200',
      resume: 'bg-orange-50 text-orange-700 border-orange-200',
      id: 'bg-red-50 text-red-700 border-red-200',
      report: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };

    return (
      <Badge 
        variant="outline" 
        className={`text-xs ${typeColors[document.structuredText.documentType as keyof typeof typeColors]}`}
      >
        {document.structuredText.documentType}
      </Badge>
    );
  };

  const getEntityIndicators = (document: Document) => {
    if (!document.structuredText?.entities) return null;

    const indicators = [];
    const { entities } = document.structuredText;

    if (entities.emails.length > 0) {
      indicators.push(
        <div key="email" className="flex items-center gap-1 text-blue-600">
          <Mail size={12} />
          <span className="text-xs">{entities.emails.length}</span>
        </div>
      );
    }

    if (entities.phones.length > 0) {
      indicators.push(
        <div key="phone" className="flex items-center gap-1 text-green-600">
          <Phone size={12} />
          <span className="text-xs">{entities.phones.length}</span>
        </div>
      );
    }

    if (entities.amounts.length > 0) {
      indicators.push(
        <div key="amount" className="flex items-center gap-1 text-orange-600">
          <DollarSign size={12} />
          <span className="text-xs">{entities.amounts.length}</span>
        </div>
      );
    }

    return indicators.length > 0 ? (
      <div className="flex items-center gap-2 mt-1">
        {indicators}
      </div>
    ) : null;
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center p-3 rounded-lg border border-gray-200">
                  <div className="w-5 h-5 bg-gray-300 rounded mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card hover-lift bg-gradient-to-br from-white to-purple-50/30 border-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50/50 to-violet-50/30 border-b border-purple-100/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent flex items-center gap-2">
            <FileText size={20} className="text-purple-600" />
            Recent Documents
          </CardTitle>
          <div className="flex gap-2">
            <BulkActionsModal
              trigger={
                <Button variant="ghost" className="text-primary hover:text-primary-600 text-sm font-medium">
                  <CheckSquare size={16} className="mr-1" />
                  Bulk Actions
                </Button>
              }
            />
            <Button
              variant="ghost"
              className="text-primary hover:text-primary-600 text-sm font-medium"
              onClick={() => setLocation("/")}
            >
              View All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No documents found. Upload some documents to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:shadow-card-hover transition-shadow cursor-pointer"
                onClick={() => onDocumentSelect(document)}
              >
                {getFileIcon(document.fileType)}
                <div className="flex-1 min-w-0 ml-4">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {document.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span>{formatFileSize(document.fileSize)}</span> • 
                    <span className="ml-1">
                      Uploaded {document.uploadDate ? formatDate(typeof document.uploadDate === "string" ? document.uploadDate : document.uploadDate instanceof Date ? document.uploadDate.toISOString() : "") : "Unknown"}
                    </span> • 
                    <span className="ml-1">{getStatusBadge(document.processingStatus)}</span>
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {getDocumentTypeBadge(document)}
                    {(document.categories ?? []).map((category) => (
                      <Badge 
                        key={category}
                        className="bg-primary-100 text-primary-800 text-xs"
                      >
                        {category}
                      </Badge>
                    ))}
                    {(document.tags ?? []).map((tag) => (
                      <Badge 
                        key={tag}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {getEntityIndicators(document)}
                  {getDocumentTypeBadge(document)}
                  {getEntityIndicators(document)}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDocumentSelect(document);
                    }}
                  >
                    <Eye size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(document.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

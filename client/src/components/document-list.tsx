import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, FileImage, Eye, Trash2, CheckSquare, Mail, Phone, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { type Document, type SearchParams } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import BulkActionsModal from "./bulk-actions-modal";
import { useLocation } from "wouter";

interface DocumentListProps { searchParams: SearchParams; onDocumentSelect: (document: Document) => void; }

export default function DocumentList({ searchParams, onDocumentSelect }: DocumentListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: Object.values(searchParams).some(v => v !== undefined) ? ["/api/documents/search", searchParams] : ["/api/documents"],
    queryFn: async () => {
      if (Object.values(searchParams).some(v => v !== undefined)) return (await apiRequest("POST", "/api/documents/search", searchParams)).json();
      return (await fetch("/api/documents")).json();
    },
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: number) => apiRequest("DELETE", `/api/documents/${documentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/stats"] });
      toast({ title: "Document deleted", description: "Document has been successfully deleted." });
    },
    onError: () => toast({ title: "Delete failed", description: "Failed to delete document. Please try again.", variant: "destructive" }),
  });

  const getFileIcon = (fileType: string | null | undefined) => fileType?.startsWith('image/')
    ? <FileImage className="text-green-500 text-xl" size={20} />
    : <FileText className="text-red-500 text-xl" size={20} />;

  const getStatusBadge = (status: string) => {
    if (status === "completed") return <Badge className="bg-green-100 text-green-800">Processed</Badge>;
    if (status === "processing") return <Badge className="bg-orange-100 text-orange-800">Processing</Badge>;
    if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  const formatFileSize = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const diffInHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  const getEntityIndicators = (document: Document) => {
    if (!document.structuredText?.entities) return null;
    const { entities } = document.structuredText;
    const indicators = [];
    if (entities.emails.length) indicators.push(<div key="email" className="flex items-center gap-1 text-blue-600"><Mail size={12} /><span className="text-xs">{entities.emails.length}</span></div>);
    if (entities.phones.length) indicators.push(<div key="phone" className="flex items-center gap-1 text-green-600"><Phone size={12} /><span className="text-xs">{entities.phones.length}</span></div>);
    if (entities.amounts.length) indicators.push(<div key="amount" className="flex items-center gap-1 text-orange-600"><DollarSign size={12} /><span className="text-xs">{entities.amounts.length}</span></div>);
    return indicators.length ? <div className="flex items-center gap-2 mt-1">{indicators}</div> : null;
  };

  if (isLoading) return <Card className="shadow-card"><CardContent className="p-6"><div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="animate-pulse"><div className="flex items-center p-3 rounded-lg border border-gray-200"><div className="w-5 h-5 bg-gray-300 rounded mr-4" /><div className="flex-1"><div className="h-4 bg-gray-300 rounded w-3/4 mb-2" /><div className="h-3 bg-gray-300 rounded w-1/2" /></div></div></div>)}</div></CardContent></Card>;

  return (
    <Card className="shadow-card hover-lift bg-gradient-to-br from-white to-purple-50/30 border-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50/50 to-violet-50/30 border-b border-purple-100/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2"><FileText size={20} className="text-purple-600" />Recent Documents</CardTitle>
          <div className="flex gap-2"><BulkActionsModal trigger={<Button variant="ghost" className="text-primary text-sm font-medium"><CheckSquare size={16} className="mr-1" />Bulk Actions</Button>} /><Button variant="ghost" className="text-primary text-sm font-medium" onClick={() => setLocation("/")}>View All</Button></div>
        </div>
      </CardHeader>
      <CardContent>
        {!documents.length ? <div className="text-center py-8 text-gray-500">No documents found. Upload some documents to get started.</div> :
          <div className="space-y-3">{documents.map(document => (
            <div key={document.id} className="flex items-center p-3 rounded-lg border border-gray-200 hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => onDocumentSelect(document)}>
              {getFileIcon(document.fileType)}
              <div className="flex-1 min-w-0 ml-4">
                <p className="text-sm font-medium text-gray-900 truncate">{document.title}</p>
                <p className="text-xs text-gray-500 mt-1"><span>{formatFileSize(document.fileSize)}</span> • <span className="ml-1">Uploaded {document.uploadDate ? formatDate(typeof document.uploadDate === "string" ? document.uploadDate : document.uploadDate instanceof Date ? document.uploadDate.toISOString() : "") : "Unknown"}</span> • <span className="ml-1">{getStatusBadge(document.processingStatus)}</span></p>
                {(document.tags ?? []).length > 0 && <div className="flex flex-wrap gap-1 mt-2">{(document.tags ?? []).map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}</div>}
                {getEntityIndicators(document)}
              </div>
              <div className="flex items-center space-x-2 ml-4"><Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary" onClick={e => { e.stopPropagation(); onDocumentSelect(document); }}><Eye size={16} /></Button><Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500" onClick={e => { e.stopPropagation(); deleteMutation.mutate(document.id); }}><Trash2 size={16} /></Button></div>
            </div>
          ))}</div>}
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Archive, Tag, Trash2, Download, CheckSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Document, type Category } from "@shared/schema";

interface BulkActionsModalProps {
  trigger: React.ReactNode;
}

export default function BulkActionsModal({ trigger }: BulkActionsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("");
  const [newTags, setNewTags] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ documentIds, updates }: { documentIds: number[]; updates: Partial<Document> }) => {
      const promises = documentIds.map(id => 
        apiRequest("PATCH", `/api/documents/${id}`, updates)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/stats"] });
      setSelectedDocuments([]);
      setBulkAction("");
      toast({
        title: "Bulk action completed",
        description: `Successfully updated ${selectedDocuments.length} document(s).`,
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (documentIds: number[]) => {
      const promises = documentIds.map(id => 
        apiRequest("DELETE", `/api/documents/${id}`)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/stats"] });
      setSelectedDocuments([]);
      setBulkAction("");
      toast({
        title: "Bulk delete completed",
        description: `Successfully deleted ${selectedDocuments.length} document(s).`,
      });
    },
  });

  const handleDocumentSelect = (documentId: number, checked: boolean) => {
    if (checked) {
      setSelectedDocuments([...selectedDocuments, documentId]);
    } else {
      setSelectedDocuments(selectedDocuments.filter(id => id !== documentId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(documents.map(doc => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  };

  const handleBulkAction = () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: "No documents selected",
        description: "Please select at least one document.",
        variant: "destructive",
      });
      return;
    }

    switch (bulkAction) {
      case "add-category":
        if (newCategory) {
          const updates: Partial<Document> = {
            categories: [...(documents.find(d => selectedDocuments.includes(d.id))?.categories || []), newCategory]
          };
          bulkUpdateMutation.mutate({ documentIds: selectedDocuments, updates });
        }
        break;
      case "add-tags":
        if (newTags) {
          const tagsArray = newTags.split(",").map(tag => tag.trim()).filter(Boolean);
          const updates: Partial<Document> = {
            tags: [...(documents.find(d => selectedDocuments.includes(d.id))?.tags || []), ...tagsArray]
          };
          bulkUpdateMutation.mutate({ documentIds: selectedDocuments, updates });
        }
        break;
      case "delete":
        if (confirm(`Are you sure you want to delete ${selectedDocuments.length} document(s)?`)) {
          bulkDeleteMutation.mutate(selectedDocuments);
        }
        break;
      case "export":
        handleBulkExport();
        break;
    }
  };

  const handleBulkExport = () => {
    const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id));
    const exportData = {
      exported_at: new Date().toISOString(),
      total_documents: selectedDocs.length,
      documents: selectedDocs.map(doc => ({
        id: doc.id,
        title: doc.title,
        original_name: doc.originalName,
        file_type: doc.fileType,
        extracted_text: doc.extractedText,
        categories: doc.categories,
        tags: doc.tags,
        processing_status: doc.processingStatus,
        upload_date: doc.uploadDate,
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `selected_documents_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Exported ${selectedDocs.length} document(s) to JSON file.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare size={20} />
            Bulk Document Actions
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Action Selection */}
          <div className="border-b pb-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bulk-action">Select Action</Label>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose bulk action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add-category">Add Category</SelectItem>
                    <SelectItem value="add-tags">Add Tags</SelectItem>
                    <SelectItem value="export">Export Selected</SelectItem>
                    <SelectItem value="delete">Delete Selected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {bulkAction === "add-category" && (
                <div>
                  <Label htmlFor="new-category">Category</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {bulkAction === "add-tags" && (
                <div>
                  <Label htmlFor="new-tags">Tags (comma-separated)</Label>
                  <Input
                    id="new-tags"
                    placeholder="tag1, tag2, tag3"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Document Selection */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedDocuments.length === documents.length && documents.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label>Select All ({documents.length} documents)</Label>
              </div>
              <span className="text-sm text-gray-500">
                {selectedDocuments.length} selected
              </span>
            </div>

            <div className="space-y-2">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <Checkbox
                    checked={selectedDocuments.includes(document.id)}
                    onCheckedChange={(checked) => 
                      handleDocumentSelect(document.id, checked as boolean)
                    }
                  />
                  <div className="flex-shrink-0">
                    {document.fileType.startsWith('image/') ? (
                      <div className="text-green-500">📷</div>
                    ) : (
                      <div className="text-red-500">📄</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {document.title}
                    </p>
                    <p className="text-sm text-gray-500">
  {(document.categories?.length ?? 0)>0 && (
    <span className="mr-2">
      Categories: {document.categories?.join(", ")}
    </span>
  )}
  {(document.tags?.length ??0)>0  && (
    <span>Tags: {document.tags?.join(", ")}</span>
  )}
</p>

                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(document.uploadDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkAction}
              disabled={selectedDocuments.length === 0 || !bulkAction}
            >
              {bulkAction === "delete" && <Trash2 size={16} className="mr-2" />}
              {bulkAction === "export" && <Download size={16} className="mr-2" />}
              {bulkAction === "add-category" && <Archive size={16} className="mr-2" />}
              {bulkAction === "add-tags" && <Tag size={16} className="mr-2" />}
              Apply Action ({selectedDocuments.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { X, Plus, Tag, Edit2, Download, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Document } from "@shared/schema";

interface DocumentPreviewModalProps {
  document: Document;
  onClose: () => void;
}

export default function DocumentPreviewModal({ document, onClose }: DocumentPreviewModalProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(document.title);
  const [newTag, setNewTag] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateDocumentMutation = useMutation({
    mutationFn: (updates: Partial<Document>) => 
      apiRequest("PATCH", `/api/documents/${document.id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document updated",
        description: "Document has been successfully updated.",
      });
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const handleTitleSave = () => {
    if (newTitle.trim() && newTitle !== document.title) {
      updateDocumentMutation.mutate({ title: newTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !document.tags.includes(newTag.trim())) {
      const updatedTags = [...document.tags, newTag.trim()];
      updateDocumentMutation.mutate({ tags: updatedTags });
      setNewTag("");
    }
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = document.tags.filter(tag => tag !== tagToRemove);
    updateDocumentMutation.mutate({ tags: updatedTags });
  };

  const handleCopyText = () => {
    if (document.extractedText) {
      navigator.clipboard.writeText(document.extractedText);
      toast({
        title: "Text copied",
        description: "Extracted text has been copied to clipboard.",
      });
    }
  };

  const handleDownload = () => {
    const filename = document.filePath.split('/').pop();
    window.open(`/api/files/${filename}`, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-3">
                {document.fileType.startsWith('image/') ? (
                  <div className="text-green-500 text-xl">📷</div>
                ) : (
                  <div className="text-red-500 text-xl">📄</div>
                )}
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {document.title}
                </DialogTitle>
                <p className="text-sm text-gray-500">
                  Uploaded {formatDate(document.uploadDate)} • {formatFileSize(document.fileSize)}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Document Preview */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h4 className="text-md font-semibold text-gray-900 mb-3">
              Document Preview
            </h4>
            <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
              {document.fileType.startsWith('image/') ? (
                <img
                  src={`/api/files/${document.filePath.split('/').pop()}`}
                  alt={document.title}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling!.style.display = 'block';
                  }}
                />
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-gray-500">PDF Preview Not Available</p>
                  <p className="text-sm text-gray-400">View extracted text in the sidebar</p>
                </div>
              )}
              <div style={{ display: 'none' }} className="text-center">
                <p className="text-gray-500">Preview not available</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l border-gray-200 p-6 overflow-y-auto">
            <h4 className="text-md font-semibold text-gray-900 mb-3">
              Extracted Text
            </h4>
            <ScrollArea className="h-64 mb-6">
              <div className="text-sm text-gray-700 space-y-2 pr-4">
                {document.extractedText ? (
                  document.extractedText.split('\n').map((line, index) => (
                    <p key={index} className="leading-relaxed">
                      {line || '\u00A0'}
                    </p>
                  ))
                ) : document.processingStatus === "processing" ? (
                  <p className="text-gray-500 italic">Processing text extraction...</p>
                ) : document.processingStatus === "failed" ? (
                  <p className="text-red-500 italic">Text extraction failed</p>
                ) : (
                  <p className="text-gray-500 italic">Text extraction pending</p>
                )}
              </div>
            </ScrollArea>

            <h4 className="text-md font-semibold text-gray-900 mb-3">
              Categories & Tags
            </h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {(document.categories ?? []).map((category) => (
                <Badge 
                  key={category}
                  className="bg-primary-100 text-primary-800"
                >
                  {category}
                </Badge>
              ))}
              {(document.tags ?? []).map((tag) => (
                <Badge 
                  key={tag}
                  variant="secondary"
                >
                  {tag}
                </Badge>
              ))}
              <Button 
                variant="outline" 
                size="sm"
                className="border-dashed text-gray-500 hover:text-primary-600 hover:border-primary-400"
              >
                <Plus size={12} className="mr-1" />
                Add Tag
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-900 mb-2">
                Document Info
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>File Type:</span>
                  <span>{document.fileType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge 
                    variant={document.processingStatus === "completed" ? "default" : "secondary"}
                    className={
                      document.processingStatus === "completed" 
                        ? "bg-green-100 text-green-800"
                        : document.processingStatus === "processing"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {document.processingStatus}
                  </Badge>
                </div>
                {document.processedDate && (
                  <div className="flex justify-between">
                    <span>Processed:</span>
                    <span>{formatDate(document.processedDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState } from "react";
import { X, Plus, Tag, Edit2, Download, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Document, type Category } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";

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
    onSuccess: (data: Document) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Document updated",
        description: "Document has been successfully updated.",
      });
      setCategoryTouched(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
      if (data && data.categories) {
        setSelectedCategories([...data.categories]);
      }
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([...(document.categories ?? [])]);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync selectedCategories with document.categories when modal opens or document changes
  useEffect(() => {
    setSelectedCategories([...(document.categories ?? [])]);
    setCategoryTouched(false);
  }, [document.id, document.categories, isOpen]);

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
    if (newTag.trim() && !(document.tags ?? []).includes(newTag.trim())) {
      const updatedTags = [...(document.tags ?? []), newTag.trim()];
      updateDocumentMutation.mutate({ tags: updatedTags });
      setNewTag("");
    }
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = (document.tags ?? []).filter(tag => tag !== tagToRemove);
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

  const handleCategoryChange = (category: string, checked: boolean) => {
    setCategoryTouched(true);
    if (checked) {
      setSelectedCategories(prev => [...prev, category]);
    } else {
      setSelectedCategories(prev => prev.filter(c => c !== category));
    }
  };

  const handleSaveCategories = () => {
    updateDocumentMutation.mutate({ categories: selectedCategories });
  };

  const formatDate = (dateValue: string | Date) => {
    if (!dateValue) return '';
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString();
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
                {typeof document.fileType === 'string' && document.fileType.startsWith('image/') ? (
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
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden min-h-0">
          <div className="w-full p-6 overflow-y-auto">
            {/* Categories Section */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Tag size={16} /> Categories
              </h4>
              <div className="flex flex-wrap gap-2 mb-2">
                {categories.length === 0 && (
                  <span className="text-gray-400">No categories</span>
                )}
                {categories.map(cat => (
                  <label key={cat.name} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedCategories.includes(cat.name)}
                      onCheckedChange={checked => handleCategoryChange(cat.name, !!checked)}
                    />
                    <Badge style={{ background: cat.color }} className="text-xs text-white">
                      {cat.name}
                    </Badge>
                  </label>
                ))}
              </div>
              <Button
                size="sm"
                onClick={handleSaveCategories}
                disabled={!categoryTouched}
                type="button"
                className="mt-2"
              >
                {saveSuccess ? "Saved!" : "Save Categories"}
              </Button>
            </div>
            {/* Extracted Text Section */}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

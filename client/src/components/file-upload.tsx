import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { CloudUpload, Plus, FileImage, FileText, CheckCircle, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { processOCR } from "@/lib/ocr";
import { type Category } from "@shared/schema";

interface UploadProgress {
  file: File;
  progress: number;
  status: "uploading" | "processing" | "completed" | "error";
  documentId?: number;
}

export default function FileUpload() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategoriesArray, setSelectedCategoriesArray] = useState<string[]>([]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleCategoryChange = (categoryName: string, checked: boolean) => {
    if (checked) {
      setSelectedCategoriesArray(prev => [...prev, categoryName]);
    } else {
      setSelectedCategoriesArray(prev => prev.filter(c => c !== categoryName));
    }
  };
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("files", file); // use 'files' to match backend multer.array("files")
      // Instead of JSON.stringify, append each category separately for text[]
      selectedCategoriesArray.forEach(cat => formData.append("categories", cat));
      formData.append("title", file.name.replace(/\.[^/.]+$/, ""));
      // Use the correct endpoint for multiple files
      const response = await apiRequest("POST", "/api/documents/upload", formData);
      return response; // already parsed JSON
    },
    onSuccess: (data, file) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/stats"] });
      // Find the uploaded document by originalName and fileSize for robustness
      let uploadedDoc = null;
      if (data.documents?.length === 1) {
        uploadedDoc = data.documents[0];
      } else if (data.documents?.length > 1) {
        uploadedDoc = data.documents.find((doc: any) => doc.originalName === file.name && doc.fileSize === file.size);
      }
      console.log("Upload response:", data.documents, "File:", file.name, file.size, "Matched doc:", uploadedDoc);
      if (uploadedDoc && uploadedDoc.id) {
        processDocument(uploadedDoc.id, file);
      } else {
        toast({
          title: "Upload failed",
          description: "Could not find uploaded document for processing.",
          variant: "destructive",
        });
      }
      toast({
        title: "Upload successful",
        description: `"${file.name}" uploaded and processing started.`,
      });
    },
    onError: (error, file) => {
      toast({
        title: "Upload failed",
        description: `Failed to upload "${file.name}". Please try again.`,
        variant: "destructive",
      });
      
      setUploadProgress(prev => 
        prev.map(item => ({ ...item, status: "error" as const }))
      );
    },
  });

  const processDocument = async (documentId: number, file: File) => {
    try {
      // Update status to processing
      setUploadProgress(prev => 
        prev.map(item => 
          item.file === file 
            ? { ...item, status: "processing", documentId }
            : item
        )
      );

      // Update document status in backend (processing)
      const processingUpdate: Record<string, any> = {};
      processingUpdate.processingStatus = "processing";
      console.log("PATCH processingUpdate:", processingUpdate);
      if (Object.keys(processingUpdate).length > 0) {
        await apiRequest("PATCH", `/api/documents/${documentId}`, processingUpdate);
      }

      // Process OCR
      const extractedText = await processOCR(file);

      // Update document with extracted text
      console.log("extractedText:", extractedText);
      const updateData: Record<string, any> = {};
      if (typeof extractedText === "string" && extractedText.trim().length > 0) {
        updateData.extractedText = extractedText;
        updateData.processingStatus = "completed";
      }
      console.log("PATCH updateData:", updateData);
      if (Object.keys(updateData).length > 0) {
        await apiRequest("PATCH", `/api/documents/${documentId}`, updateData);
      }

      // Update progress to completed
      setUploadProgress(prev => 
        prev.map(item => 
          item.file === file 
            ? { ...item, status: "completed", progress: 100 }
            : item
        )
      );

      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/stats"] });

    } catch (error) {
      console.error("OCR processing failed:", error);
      
      // Update document status to failed
      await apiRequest("PATCH", `/api/documents/${documentId}`, {
        processingStatus: "failed"
      });

      setUploadProgress(prev => 
        prev.map(item => 
          item.file === file 
            ? { ...item, status: "error" }
            : item
        )
      );

      toast({
        title: "Processing failed",
        description: "Failed to extract text from document.",
        variant: "destructive",
      });
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Initialize progress tracking for each file
    const newProgress = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: "uploading" as const,
    }));
    
    setUploadProgress(prev => [...prev, ...newProgress]);

    // Trigger an upload mutation for each file
    acceptedFiles.forEach(file => {
      uploadMutation.mutate(file);
    });
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="text-primary text-xl" />;
    }
    return <FileText className="text-red-500 text-xl" />;
  };

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="text-green-500" size={20} />;
      case "processing":
        return <div className="processing-spinner text-primary"><CheckCircle size={20} /></div>;
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-card hover-lift bg-gradient-to-br from-white to-purple-50/30 border-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-600/8 to-violet-600/8 border-b border-purple-100/50">
        <CardTitle className="text-lg font-semibold bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
          <CloudUpload size={20} className="text-purple-600" />
          Upload Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Category Selection */}
        {categories.length > 0 && (
          <div className="mb-6 p-4 border border-purple-200 rounded-lg bg-purple-50/30">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={16} className="text-purple-600" />
              <Label className="text-sm font-medium text-gray-900">
                Select Categories (Optional)
              </Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedCategoriesArray.includes(category.name)}
                    onCheckedChange={checked => handleCategoryChange(category.name, !!checked)}
                  />
                  <Badge 
                    style={{ backgroundColor: category.color }} 
                    className="text-white text-xs"
                  >
                    {category.name}
                  </Badge>
                </label>
              ))}
            </div>
            {selectedCategoriesArray.length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                Selected: {selectedCategoriesArray.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed border-purple-200 rounded-xl p-8 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-300 cursor-pointer group relative overflow-hidden ${
            isDragActive ? "drag-over border-purple-500 bg-purple-100/50 scale-[1.02]" : ""
          }`}
        >
          <input {...getInputProps()} />
          <CloudUpload className="mx-auto text-4xl text-gray-400 mb-4" size={48} />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drop files here or click to upload
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supports PNG, JPG, PDF files up to 10MB
          </p>
          <Button className="bg-primary hover:bg-primary-600">
            <Plus className="mr-2" size={16} />
            Choose Files
          </Button>
        </div>

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="mt-6 space-y-3">
            {uploadProgress.map((item, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-md fade-in">
                {getFileIcon(item.file)}
                <div className="flex-1 ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {item.file.name}
                  </p>
                  <Progress 
                    value={item.progress} 
                    className="mt-1 h-2"
                  />
                  {item.status === "processing" && (
                    <p className="text-xs text-gray-500 mt-1">Processing OCR...</p>
                  )}
                  {item.status === "completed" && (
                    <p className="text-xs text-green-600 mt-1">Processing complete</p>
                  )}
                  {item.status === "error" && (
                    <p className="text-xs text-red-600 mt-1">Processing failed</p>
                  )}
                </div>
                <div className="ml-3">
                  {getStatusIcon(item.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

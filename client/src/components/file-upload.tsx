import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudUpload, Plus, FileImage, FileText, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { processOCR } from "@/lib/ocr";

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

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("title", file.name.replace(/\.[^/.]+$/, ""));
      return apiRequest("POST", "/api/documents/upload", formData);
    },
    onSuccess: (data, file) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/stats"] });

      let uploadedDoc = null;
      if (data.documents?.length === 1) {
        uploadedDoc = data.documents[0];
      } else if (data.documents?.length > 1) {
        uploadedDoc = data.documents.find((doc: any) => doc.originalName === file.name && doc.fileSize === file.size);
      }

      if (uploadedDoc?.id) {
        processDocument(uploadedDoc.id, file);
      } else {
        toast({
          title: "Upload failed",
          description: "Could not find uploaded document for processing.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Upload successful",
        description: `"${file.name}" uploaded and processing started.`,
      });
    },
    onError: (error, file) => {
      console.error("Upload failed:", error);
      toast({
        title: "Upload failed",
        description: `Failed to upload "${file.name}". Please try again.`,
        variant: "destructive",
      });
      setUploadProgress(prev => prev.map(item => ({ ...item, status: "error" as const })));
    },
  });

  const processDocument = async (documentId: number, file: File) => {
    try {
      setUploadProgress(prev =>
        prev.map(item => item.file === file ? { ...item, status: "processing", documentId } : item)
      );

      await apiRequest("PATCH", `/api/documents/${documentId}`, {
        processingStatus: "processing",
      });

      const extractedText = await processOCR(file);

      if (typeof extractedText === "string" && extractedText.trim().length > 0) {
        await apiRequest("PATCH", `/api/documents/${documentId}`, {
          extractedText,
          processingStatus: "completed",
        });

        try {
          const indexResult = await apiRequest("POST", `/api/documents/${documentId}/index`);
          console.log("RAG index created:", indexResult);
        } catch (indexError) {
          console.error("RAG indexing failed:", indexError);
          toast({
            title: "OCR complete, AI indexing failed",
            description: "The document text was saved, but AI Q&A is not ready yet.",
            variant: "destructive",
          });
        }
      }

      setUploadProgress(prev =>
        prev.map(item => item.file === file ? { ...item, status: "completed", progress: 100 } : item)
      );

      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/stats"] });
    } catch (error) {
      console.error("OCR processing failed:", error);
      await apiRequest("PATCH", `/api/documents/${documentId}`, {
        processingStatus: "failed",
      });

      setUploadProgress(prev =>
        prev.map(item => item.file === file ? { ...item, status: "error" } : item)
      );

      toast({
        title: "Processing failed",
        description: "Failed to extract text from document.",
        variant: "destructive",
      });
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newProgress = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: "uploading" as const,
    }));

    setUploadProgress(prev => [...prev, ...newProgress]);
    acceptedFiles.forEach(file => uploadMutation.mutate(file));
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024,
  });

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <FileImage className="text-primary text-xl" />;
    return <FileText className="text-red-500 text-xl" />;
  };

  const getStatusIcon = (status: UploadProgress["status"]) => {
    if (status === "completed") return <CheckCircle className="text-green-500" size={20} />;
    if (status === "processing") return <div className="processing-spinner text-primary"><CheckCircle size={20} /></div>;
    return null;
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
        <div
          {...getRootProps()}
          className={`border-2 border-dashed border-purple-200 rounded-xl p-8 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-300 cursor-pointer group relative overflow-hidden ${
            isDragActive ? "drag-over border-purple-500 bg-purple-100/50 scale-[1.02]" : ""
          }`}
        >
          <input {...getInputProps()} />
          <CloudUpload className="mx-auto text-4xl text-gray-400 mb-4" size={48} />
          <p className="text-lg font-medium text-gray-900 mb-2">Drop files here or click to upload</p>
          <p className="text-sm text-gray-500 mb-4">Supports PNG, JPG, PDF files up to 10MB</p>
          <Button className="bg-primary hover:bg-primary-600">
            <Plus className="mr-2" size={16} />
            Choose Files
          </Button>
        </div>

        {uploadProgress.length > 0 && (
          <div className="mt-6 space-y-3">
            {uploadProgress.map((item, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-md fade-in">
                {getFileIcon(item.file)}
                <div className="flex-1 ml-3">
                  <p className="text-sm font-medium text-gray-900">{item.file.name}</p>
                  <Progress value={item.progress} className="mt-1 h-2" />
                  {item.status === "processing" && <p className="text-xs text-gray-500 mt-1">Processing OCR...</p>}
                  {item.status === "completed" && <p className="text-xs text-green-600 mt-1">Processing complete</p>}
                  {item.status === "error" && <p className="text-xs text-red-600 mt-1">Processing failed</p>}
                </div>
                <div className="ml-3">{getStatusIcon(item.status)}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

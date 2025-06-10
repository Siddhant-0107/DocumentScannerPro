import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertDocumentSchema, searchSchema } from "@shared/schema";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPG, and PDF files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Document routes
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  app.post("/api/documents/upload", upload.array("files"), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadedDocuments = [];

      for (const file of req.files) {
        const documentData = {
          title: file.originalname,
          originalName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          filePath: file.path,
          extractedText: null,
          categories: [],
          tags: [],
          processingStatus: "pending" as const,
        };

        const validatedData = insertDocumentSchema.parse(documentData);
        const document = await storage.createDocument(validatedData);
        uploadedDocuments.push(document);
      }

      res.json({ documents: uploadedDocuments });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload documents" });
    }
  });

  app.patch("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      const document = await storage.updateDocument(id, updates);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Delete file from filesystem
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }

      const success = await storage.deleteDocument(id);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete document" });
      }
      
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  app.post("/api/documents/search", async (req, res) => {
    try {
      const searchParams = searchSchema.parse(req.body);
      const documents = await storage.searchDocuments(searchParams);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to search documents" });
    }
  });

  app.get("/api/documents/stats", async (req, res) => {
    try {
      const stats = await storage.getDocumentStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = req.body;
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // File serving route
  app.get("/api/files/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    
    res.sendFile(filePath);
  });

  const httpServer = createServer(app);
  return httpServer;
}

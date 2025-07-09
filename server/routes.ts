import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./pg-storage";
import { insertDocumentSchema, searchSchema } from "@shared/schema";
import express from "express";

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
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPG, and PDF files are allowed.'));
    }
  },
});

// Add a startup log to confirm server restarts
export async function registerRoutes(app: express.Express): Promise<Server> {
  console.log("[DocScanPro] Server started at", new Date().toLocaleString());
  // Disable ETag and Last-Modified headers globally
  app.set('etag', false);
  app.use((req, res, next) => {
    res.removeHeader('Last-Modified');
    // Add global cache-control headers for all API responses
    if (req.path.startsWith('/api/')) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Surrogate-Control", "no-store");
    }
    next();
  });
  // Document routes
  app.get("/api/documents", async (req, res) => {
    try {
      // Remove conditional request headers to force 200 response
      delete req.headers['if-none-match'];
      delete req.headers['if-modified-since'];
      // Prevent caching so client always gets latest documents
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Surrogate-Control", "no-store");
      let documents = await storage.getAllDocuments();
      // Ensure categories is always an array
      documents = documents.map(doc => ({
        ...doc,
        categories: Array.isArray(doc.categories) ? doc.categories : [],
      }));
      res.status(200).json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
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

  app.post("/api/documents/upload", upload.array("files"), async (req: any, res) => {
    console.log("🚨🚨🚨 UPLOAD ROUTE HIT 🚨🚨🚨");
    console.log("[UPLOAD START] Upload request received");
    console.log("[UPLOAD DEBUG] req.files:", req.files);
    console.log("[UPLOAD DEBUG] req.body:", req.body);
    console.log("[UPLOAD DEBUG] Files type check:", typeof req.files, Array.isArray(req.files));
    
    // Robustly parse categories as array, never null/undefined
    let categories: string[] = [];
    try {
      if (Array.isArray(req.body.categories)) {
        categories = req.body.categories;
      } else if (typeof req.body.categories === "string") {
        try {
          const parsed = JSON.parse(req.body.categories);
          if (Array.isArray(parsed)) {
            categories = parsed;
          } else if (typeof parsed === "string") {
            categories = [parsed];
          } else {
            categories = [];
          }
        } catch {
          categories = req.body.categories ? [req.body.categories] : [];
        }
      } else {
        categories = [];
      }
    } catch {
      categories = [];
    }
    console.log("Parsed categories from req.body:", categories);
    console.log("Incoming files:", req.files);
    console.log("Body:", req.body);
    
    try {
      if (!req.files) {
        console.log("[UPLOAD ERROR] No req.files found");
        return res.status(400).json({ message: "No files uploaded - req.files is null/undefined" });
      }
      
      if (!Array.isArray(req.files)) {
        console.log("[UPLOAD ERROR] req.files is not an array:", typeof req.files);
        return res.status(400).json({ message: "No files uploaded - req.files is not an array" });
      }
      
      if (req.files.length === 0) {
        console.log("[UPLOAD ERROR] req.files array is empty");
        return res.status(400).json({ message: "No files uploaded - files array is empty" });
      }

      console.log(`[UPLOAD DEBUG] Processing ${req.files.length} files`);
      const uploadedDocuments = [];

      for (const file of req.files) {
        console.log(`[UPLOAD DEBUG] Processing file:`, file);
        const documentData = {
          title: file.originalname,
          originalName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          filePath: file.path,
          extractedText: null,
          categories: categories,
          tags: [],
          processingStatus: "pending" as const,
        };
        console.log("[UPLOAD DEBUG] Document data before validation:", documentData);
        try {
          console.log("[UPLOAD DEBUG] Starting validation...");
          const validatedData = insertDocumentSchema.parse(documentData);
          console.log("[UPLOAD DEBUG] Validation successful, creating document...");
          const document = await storage.createDocument(validatedData);
          console.log("[UPLOAD DEBUG] Document created successfully:", document);
          uploadedDocuments.push(document);
          console.log("Created document:", document); // Log the created document with ID
        } catch (validationError) {
          console.error("[UPLOAD ERROR] Validation failed:", validationError);
          console.error("[UPLOAD ERROR] Validation error details:", JSON.stringify(validationError, null, 2));
          return res.status(400).json({ message: "Validation failed", error: validationError });
        }
      }

      console.log("All uploaded documents:", uploadedDocuments);
      console.log("[UPLOAD SUCCESS] Sending response with documents");
      res.json({ documents: uploadedDocuments }); // Always return full document objects with IDs
    } catch (error) {
      console.error("[UPLOAD ERROR] Upload error:", error);
      if (error && (error as Error).stack) console.error((error as Error).stack);
      const errorMessage = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: "Failed to upload documents", error: errorMessage });
    }
  });

  app.patch("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      // Always coerce categories to array if present
      if ('categories' in updates) {
        if (!Array.isArray(updates.categories)) {
          if (typeof updates.categories === 'string') {
            try {
              const parsed = JSON.parse(updates.categories);
              updates.categories = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
              updates.categories = [updates.categories];
            }
          } else {
            updates.categories = [];
          }
        }
      }
      const document = await storage.updateDocument(id, updates);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      // Ensure categories is always an array in response
      document.categories = Array.isArray(document.categories) ? document.categories : [];
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

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const category = await storage.updateCategory(id, updates);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
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

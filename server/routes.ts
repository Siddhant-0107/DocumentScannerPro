import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./pg-storage.js";
import { answerQuestion, indexDocument } from "./rag.js";
import { insertDocumentSchema, searchSchema } from "../shared/schema.js";
import express from "express";

const uploadDir = process.env.VERCEL
  ? "/tmp/document-scanner-uploads"
  : path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only PNG, JPG, and PDF files are allowed.'));
  },
});

export async function registerRoutes(app: express.Express): Promise<Server> {
  app.set('etag', false);
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
    next();
  });

  app.get("/api/documents", async (_req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents.map(doc => ({ ...doc, categories: Array.isArray(doc.categories) ? doc.categories : [] })));
    } catch (error) {
      console.error("[documents] fetch failed:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/stats", async (_req, res) => {
    try { res.json(await storage.getDocumentStats()); }
    catch (error) {
      console.error("[documents] stats failed:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch stats" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      if (!document) return res.status(404).json({ message: "Document not found" });
      res.json(document);
    } catch (error) {
      console.error("[documents] get failed:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch document" });
    }
  });

  app.post("/api/documents/upload", upload.array("files"), async (req: any, res) => {
    try {
      if (!Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadedDocuments = [];

      for (const file of req.files) {
        const validatedData = insertDocumentSchema.parse({
          title: file.originalname,
          originalName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          filePath: file.path,
          extractedText: null,
          structuredText: null,
          categories: [],
          tags: [],
          processingStatus: "pending",
        });

        uploadedDocuments.push(await storage.createDocument(validatedData));
      }

      console.log("[documents] upload success:", uploadedDocuments.map((doc: any) => doc.id));
      res.json({ documents: uploadedDocuments });
    } catch (error) {
      console.error("[documents] upload failed:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to upload documents",
      });
    }
  });

  app.post("/api/documents/:id/index", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) return res.status(503).json({ message: "GEMINI_API_KEY is not configured" });
      const document = await storage.getDocument(parseInt(req.params.id));
      if (!document?.extractedText) return res.status(404).json({ message: "Processed document text not found" });
      const result = await indexDocument(document.id, document.extractedText);
      res.json({ documentId: document.id, ...result });
    } catch (error) {
      console.error("[documents] index failed:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to index document" });
    }
  });

  app.post("/api/documents/:id/ask", async (req, res) => {
    try {
      const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
      if (!question) return res.status(400).json({ message: "question is required" });
      if (!process.env.GEMINI_API_KEY) return res.status(503).json({ message: "GEMINI_API_KEY is not configured" });
      const document = await storage.getDocument(parseInt(req.params.id));
      if (!document) return res.status(404).json({ message: "Document not found" });
      res.json(await answerQuestion(document.id, question));
    } catch (error) {
      console.error("[documents] ask failed:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to answer question" });
    }
  });

  app.patch("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      if ('categories' in updates && !Array.isArray(updates.categories)) updates.categories = [String(updates.categories)];
      const document = await storage.updateDocument(id, updates);
      if (!document) return res.status(404).json({ message: "Document not found" });
      res.json(document);
    } catch (error) {
      console.error("[documents] update failed:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update document" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      if (!document) return res.status(404).json({ message: "Document not found" });
      if (fs.existsSync(document.filePath)) fs.unlinkSync(document.filePath);
      await storage.deleteDocument(id);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("[documents] delete failed:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete document" });
    }
  });

  app.post("/api/documents/search", async (req, res) => {
    try { res.json(await storage.searchDocuments(searchSchema.parse(req.body))); }
    catch (error) { res.status(400).json({ message: error instanceof Error ? error.message : "Failed to search documents" }); }
  });

  app.get("/api/documents/search", async (req, res) => {
    try {
      const params: any = {};
      if (typeof req.query.query === 'string') params.query = req.query.query.trim();
      if (typeof req.query.documentType === 'string' && req.query.documentType !== 'all') params.documentType = req.query.documentType;
      if (req.query.hasEmails === 'true') params.hasEmails = true;
      if (req.query.hasPhones === 'true') params.hasPhones = true;
      if (req.query.hasAmounts === 'true') params.hasAmounts = true;
      if (typeof req.query.minConfidence === 'string') {
        const value = parseFloat(req.query.minConfidence);
        if (!Number.isNaN(value)) params.minConfidence = value;
      }
      res.json(await storage.searchDocuments(params));
    } catch (error) { res.status(400).json({ message: error instanceof Error ? error.message : "Failed to search documents" }); }
  });

  app.get("/api/categories", async (_req, res) => {
    try { res.json(await storage.getAllCategories()); }
    catch { res.status(500).json({ message: "Failed to fetch categories" }); }
  });

  app.post("/api/categories", async (req, res) => {
    try { res.json(await storage.createCategory(req.body)); }
    catch { res.status(500).json({ message: "Failed to create category" }); }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.updateCategory(parseInt(req.params.id), req.body);
      if (!category) return res.status(404).json({ message: "Category not found" });
      res.json(category);
    } catch { res.status(500).json({ message: "Failed to update category" }); }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const success = await storage.deleteCategory(parseInt(req.params.id));
      if (!success) return res.status(404).json({ message: "Category not found" });
      res.json({ message: "Category deleted successfully" });
    } catch { res.status(500).json({ message: "Failed to delete category" }); }
  });

  app.get("/api/files/:filename", (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });
    res.sendFile(filePath);
  });

  return createServer(app);
}

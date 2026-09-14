import { Router } from "express";
import { storage } from "./pg-storage.js";
import { answerQuestion, indexDocument } from "./rag.js";
import { searchSchema } from "../shared/schema.js";

export const aiRouter = Router();

// These routes are mounted before the legacy /api/documents/:id route so
// paths such as /search are never interpreted as a numeric document ID.
aiRouter.post("/api/documents/search", async (req, res) => {
  try {
    const params = searchSchema.parse(req.body);
    res.json(await storage.searchDocuments(params));
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Failed to search documents" });
  }
});

aiRouter.post("/api/documents/:id/index", async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid document id" });
    if (!process.env.GEMINI_API_KEY) return res.status(503).json({ message: "GEMINI_API_KEY is not configured" });
    const document = await storage.getDocument(id);
    if (!document?.extractedText) return res.status(404).json({ message: "Processed document text not found" });
    const result = await indexDocument(id, document.extractedText);
    res.json({ documentId: id, ...result });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to index document" });
  }
});

aiRouter.post("/api/documents/:id/ask", async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid document id" });
    if (!question) return res.status(400).json({ message: "question is required" });
    if (!process.env.GEMINI_API_KEY) return res.status(503).json({ message: "GEMINI_API_KEY is not configured" });
    const document = await storage.getDocument(id);
    if (!document) return res.status(404).json({ message: "Document not found" });
    res.json(await answerQuestion(id, question));
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to answer question" });
  }
});

export default aiRouter;

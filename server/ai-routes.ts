import { Router } from "express";
import { storage } from "./pg-storage";
import { answerQuestion, indexDocument } from "./rag";
import { searchSchema } from "@shared/schema";

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
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ message: "OPENAI_API_KEY is not configured" });
    const document = await storage.getDocument(Number(req.params.id));
    if (!document?.extractedText) return res.status(404).json({ message: "Processed document text not found" });
    res.json({ documentId: document.id, ...(await indexDocument(document.id, document.extractedText)) });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to index document" });
  }
});

aiRouter.post("/api/documents/:id/ask", async (req, res) => {
  try {
    const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
    if (!question) return res.status(400).json({ message: "question is required" });
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ message: "OPENAI_API_KEY is not configured" });
    const document = await storage.getDocument(Number(req.params.id));
    if (!document) return res.status(404).json({ message: "Document not found" });
    res.json(await answerQuestion(document.id, question));
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to answer question" });
  }
});

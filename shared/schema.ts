import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Structured text schema for OCR processing
export const structuredTextSchema = z.object({
  rawText: z.string(),
  processedText: z.string(),
  entities: z.object({
    emails: z.array(z.string()),
    phones: z.array(z.string()),
    dates: z.array(z.string()),
    amounts: z.array(z.string()),
    names: z.array(z.string()),
    addresses: z.array(z.string()),
    numbers: z.array(z.string())
  }),
  sections: z.object({
    title: z.string().optional(),
    header: z.array(z.string()),
    body: z.array(z.string()),
    footer: z.array(z.string())
  }),
  documentType: z.enum(['invoice', 'receipt', 'contract', 'resume', 'id', 'report', 'other']),
  confidence: z.number().min(0).max(1),
  metadata: z.object({
    lineCount: z.number(),
    wordCount: z.number(),
    hasTable: z.boolean(),
    hasSignature: z.boolean(),
    language: z.string()
  })
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  originalName: text("original_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(),
  extractedText: text("extracted_text"),
  structuredText: jsonb("structured_text"),
  categories: text("categories").array().default([]),
  tags: text("tags").array().default([]),
  processingStatus: text("processing_status").notNull().default("pending"), // pending, processing, completed, failed
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  processedDate: timestamp("processed_date"),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull(),
  documentCount: integer("document_count").default(0).notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadDate: true,
  processedDate: true,
}).extend({
  structuredText: structuredTextSchema.nullable().optional()
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  documentCount: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema> & {
  structuredText?: z.infer<typeof structuredTextSchema> | null;
};
export type Document = typeof documents.$inferSelect & {
  structuredText?: z.infer<typeof structuredTextSchema> | null;
};
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type StructuredText = z.infer<typeof structuredTextSchema>;

// Search and filter schemas
export const searchSchema = z.object({
  query: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  documentType: z.string().optional(),
  hasEmails: z.boolean().optional(),
  hasPhones: z.boolean().optional(),
  hasAmounts: z.boolean().optional(),
  minConfidence: z.number().optional(),
});

export type SearchParams = z.infer<typeof searchSchema>;

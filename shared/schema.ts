import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  originalName: text("original_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(),
  extractedText: text("extracted_text"),
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
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  documentCount: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Search and filter schemas
export const searchSchema = z.object({
  query: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type SearchParams = z.infer<typeof searchSchema>;

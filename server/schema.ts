import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  originalName: text('original_name'),
  fileType: text('file_type'),
  fileSize: integer('file_size'),
  filePath: text('file_path'),
  extractedText: text('extracted_text'),
  categories: text('categories').array(),
  tags: text('tags').array(),
  processingStatus: text('processing_status'),
  createdAt: timestamp('created_at').defaultNow(),
  processedDate: timestamp('processed_date')
});

// Types for TypeScript
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert; 
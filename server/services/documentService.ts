import { db, schema } from '../db';
import { eq, sql } from 'drizzle-orm';
import type { InsertDocument } from '../schema';

export class DocumentService {
  // Create a new document
  static async createDocument(document: InsertDocument) {
    // Always set uploadDate to now
    const docWithDate = {
      ...document,
      uploadDate: new Date(),
    };
    const [newDoc] = await db.insert(schema.documents)
      .values(docWithDate)
      .returning();
    return newDoc;
  }

  // Get all documents
  static async getAllDocuments() {
    return await db.select().from(schema.documents);
  }

  // Get document by ID
  static async getDocumentById(id: number) {
    const [document] = await db.select()
      .from(schema.documents)
      .where(eq(schema.documents.id, id));
    return document;
  }

  // Update document
  static async updateDocument(id: number, document: Partial<InsertDocument>) {
    const [updatedDoc] = await db.update(schema.documents)
      .set(document)
      .where(eq(schema.documents.id, id))
      .returning();
    return updatedDoc;
  }

  // Delete document
  static async deleteDocument(id: number) {
    const [deletedDoc] = await db.delete(schema.documents)
      .where(eq(schema.documents.id, id))
      .returning();
    return deletedDoc;
  }

  // Search documents by title or content
  static async searchDocuments(query: string) {
    return await db.select()
      .from(schema.documents)
      .where(
        sql`to_tsvector('english', ${schema.documents.title} || ' ' || COALESCE(${schema.documents.extractedText}, '')) @@ to_tsquery('english', ${query})`
      );
  }

  // Filter documents by categories
  static async filterByCategories(categories: string[]) {
    return await db.select()
      .from(schema.documents)
      .where(sql`${schema.documents.categories} && ${categories}`);
  }

  // Filter documents by tags
  static async filterByTags(tags: string[]) {
    return await db.select()
      .from(schema.documents)
      .where(sql`${schema.documents.tags} && ${tags}`);
  }
}
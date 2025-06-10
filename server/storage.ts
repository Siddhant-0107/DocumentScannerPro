import { documents, categories, type Document, type InsertDocument, type Category, type InsertCategory, type SearchParams } from "@shared/schema";

export interface IStorage {
  // Document operations
  getDocument(id: number): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  searchDocuments(params: SearchParams): Promise<Document[]>;
  getDocumentStats(): Promise<{
    totalDocuments: number;
    processing: number;
    searchable: number;
    storageUsed: string;
  }>;

  // Category operations
  getCategory(id: number): Promise<Category | undefined>;
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, updates: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  getCategoryByName(name: string): Promise<Category | undefined>;
}

export class MemStorage implements IStorage {
  private documents: Map<number, Document>;
  private categories: Map<number, Category>;
  private currentDocumentId: number;
  private currentCategoryId: number;

  constructor() {
    this.documents = new Map();
    this.categories = new Map();
    this.currentDocumentId = 1;
    this.currentCategoryId = 1;

    // Initialize default categories
    this.initializeDefaultCategories();
  }

  private async initializeDefaultCategories() {
    const defaultCategories = [
      { name: "Invoices", color: "#EF4444" },
      { name: "Receipts", color: "#10B981" },
      { name: "Contracts", color: "#F59E0B" },
      { name: "Reports", color: "#3B82F6" },
      { name: "Uncategorized", color: "#6B7280" },
    ];

    for (const cat of defaultCategories) {
      await this.createCategory(cat);
    }
  }

  // Document operations
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort((a, b) => 
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const document: Document = {
      id,
      title: insertDocument.title,
      originalName: insertDocument.originalName,
      fileType: insertDocument.fileType,
      fileSize: insertDocument.fileSize,
      filePath: insertDocument.filePath,
      extractedText: insertDocument.extractedText || null,
      categories: insertDocument.categories || [],
      tags: insertDocument.tags || [],
      processingStatus: insertDocument.processingStatus ?? "pending",
      uploadDate: new Date(),
      processedDate: null,
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;

    const updatedDocument = { ...document, ...updates };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  async searchDocuments(params: SearchParams): Promise<Document[]> {
    let results = Array.from(this.documents.values());

    if (params.query) {
      const query = params.query.toLowerCase();
      results = results.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        doc.extractedText?.toLowerCase().includes(query) ||
        (doc.tags || []).some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (params.categories && params.categories.length > 0) {
      results = results.filter(doc => 
        (doc.categories || []).some(cat => params.categories!.includes(cat))
      );
    }

    if (params.tags && params.tags.length > 0) {
      results = results.filter(doc => 
        (doc.tags || []).some(tag => params.tags!.includes(tag))
      );
    }

    if (params.dateFrom) {
      const fromDate = new Date(params.dateFrom);
      results = results.filter(doc => new Date(doc.uploadDate) >= fromDate);
    }

    if (params.dateTo) {
      const toDate = new Date(params.dateTo);
      results = results.filter(doc => new Date(doc.uploadDate) <= toDate);
    }

    return results.sort((a, b) => 
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );
  }

  async getDocumentStats() {
    const allDocs = Array.from(this.documents.values());
    const totalDocuments = allDocs.length;
    const processing = allDocs.filter(doc => doc.processingStatus === "processing").length;
    const searchable = allDocs.filter(doc => doc.processingStatus === "completed").length;
    const totalSize = allDocs.reduce((sum, doc) => sum + doc.fileSize, 0);
    const storageUsed = (totalSize / (1024 * 1024)).toFixed(1) + " MB";

    return {
      totalDocuments,
      processing,
      searchable,
      storageUsed,
    };
  }

  // Category operations
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getAllCategories(): Promise<Category[]> {
    const categories = Array.from(this.categories.values());
    
    // Update document counts
    for (const category of categories) {
      const count = Array.from(this.documents.values()).filter(doc => 
        (doc.categories || []).includes(category.name)
      ).length;
      category.documentCount = count;
    }

    return categories;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = {
      ...insertCategory,
      id,
      documentCount: 0,
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;

    const updatedCategory = { ...category, ...updates };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(cat => cat.name === name);
  }
}

export const storage = new MemStorage();

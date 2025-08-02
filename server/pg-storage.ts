import { Pool } from 'pg';
import { type Document, type InsertDocument, type Category, type InsertCategory, type SearchParams } from "@shared/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:12345@localhost:5432/docscanpro',
});

export class PgStorage {
  // Document operations
  async getDocument(id: number): Promise<Document | undefined> {
    const res = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    const row = res.rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      title: row.title,
      originalName: row.original_name,
      fileType: row.file_type,
      fileSize: row.file_size,
      filePath: row.file_path,
      extractedText: row.extracted_text,
      structuredText: (() => {
        try {
          return row.structured_text ? 
            (typeof row.structured_text === 'string' ? JSON.parse(row.structured_text) : row.structured_text) 
            : null;
        } catch (e) { return null; }
      })(),
      processingStatus: row.processingStatus,
      uploadDate: row.created_at,
      processedDate: row.processed_date,
      categories: (() => {
        try {
          if (Array.isArray(row.categories)) return row.categories;
          if (typeof row.categories === 'string') return JSON.parse(row.categories);
        } catch (e) { return []; }
        return [];
      })(),
      tags: (() => {
        try {
          if (Array.isArray(row.tags)) return row.tags;
          if (typeof row.tags === 'string') return JSON.parse(row.tags);
        } catch (e) { return []; }
        return [];
      })(),
    };
  }

  async getAllDocuments(): Promise<Document[]> {
    let res;
    try {
      res = await pool.query('SELECT * FROM documents ORDER BY created_at DESC');
    } catch (e) {
      console.error('Error querying documents:', e);
      return [];
    }
    if (!res.rows || typeof res.rows !== 'object' || typeof res.rows.length !== 'number') return [];
    if (!Array.isArray(res.rows)) return [];
    return Array.from(res.rows).map((row) => {
      let categories: any[] = [];
      let tags: any[] = [];
      let structuredText = null;
      try {
        categories = Array.isArray(row.categories)
          ? row.categories
          : (typeof row.categories === 'string' ? JSON.parse(row.categories) : []);
      } catch (e) { categories = []; }
      try {
        tags = Array.isArray(row.tags)
          ? row.tags
          : (typeof row.tags === 'string' ? JSON.parse(row.tags) : []);
      } catch (e) { tags = []; }
      try {
        structuredText = row.structured_text ? 
          (typeof row.structured_text === 'string' ? JSON.parse(row.structured_text) : row.structured_text) 
          : null;
      } catch (e) { structuredText = null; }
      return {
        id: row.id,
        title: row.title,
        originalName: row.original_name,
        fileType: row.file_type,
        fileSize: row.file_size,
        filePath: row.file_path,
        extractedText: row.extracted_text,
        structuredText,
        processingStatus: row.processingStatus,
        uploadDate: row.created_at,
        processedDate: row.processed_date,
        categories,
        tags,
      };
    });
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const res = await pool.query(
      `INSERT INTO documents (title, original_name, file_type, file_size, file_path, extracted_text, categories, tags, "processingStatus", created_at, processed_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NULL) RETURNING *`,
      [
        doc.title,
        doc.originalName,
        doc.fileType,
        doc.fileSize,
        doc.filePath,
        doc.extractedText,
        doc.categories || [],
        doc.tags || [],
        doc.processingStatus || 'pending',
      ]
    );
    const row = res.rows[0];
    return {
      id: row.id,
      title: row.title,
      originalName: row.original_name,
      fileType: row.file_type,
      fileSize: row.file_size,
      filePath: row.file_path,
      extractedText: row.extracted_text,
      structuredText: (() => {
        try {
          return row.structured_text ? 
            (typeof row.structured_text === 'string' ? JSON.parse(row.structured_text) : row.structured_text) 
            : null;
        } catch (e) { return null; }
      })(),
      processingStatus: row.processingStatus,
      uploadDate: row.created_at,
      processedDate: row.processed_date,
      categories: (() => {
        try {
          if (Array.isArray(row.categories)) return row.categories;
          if (typeof row.categories === 'string') return JSON.parse(row.categories);
        } catch (e) { return []; }
        return [];
      })(),
      tags: (() => {
        try {
          if (Array.isArray(row.tags)) return row.tags;
          if (typeof row.tags === 'string') return JSON.parse(row.tags);
        } catch (e) { return []; }
        return [];
      })(),
    };
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined> {
    // Map camelCase keys to snake_case for DB columns
    const keyMap: Record<string, string> = {
      originalName: 'original_name',
      fileType: 'file_type',
      fileSize: 'file_size',
      filePath: 'file_path',
      extractedText: 'extracted_text',
      structuredText: 'structured_text',
      processingStatus: 'processingStatus',
      uploadDate: 'created_at',
      processedDate: 'processed_date',
    };
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key in updates) {
      const dbKey = keyMap[key] || key;
      if (key === 'categories' || key === 'tags') {
        fields.push(`"${dbKey}" = $${idx}`);
        values.push((updates as any)[key] || []);
      } else if (key === 'structuredText') {
        fields.push(`"${dbKey}" = $${idx}`);
        values.push(JSON.stringify((updates as any)[key]));
      } else {
        fields.push(`"${dbKey}" = $${idx}`);
        values.push((updates as any)[key]);
      }
      idx++;
    }
    if (!fields.length) return this.getDocument(id);
    values.push(id);
    const sql = `UPDATE documents SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await pool.query(sql, values);
    const row = res.rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      title: row.title,
      originalName: row.original_name,
      fileType: row.file_type,
      fileSize: row.file_size,
      filePath: row.file_path,
      extractedText: row.extracted_text,
      structuredText: (() => {
        try {
          return row.structured_text ? 
            (typeof row.structured_text === 'string' ? JSON.parse(row.structured_text) : row.structured_text) 
            : null;
        } catch (e) { return null; }
      })(),
      processingStatus: row.processingStatus,
      uploadDate: row.created_at,
      processedDate: row.processed_date,
      categories: (() => {
        try {
          if (Array.isArray(row.categories)) return row.categories;
          if (typeof row.categories === 'string') return JSON.parse(row.categories);
        } catch (e) { return []; }
        return [];
      })(),
      tags: (() => {
        try {
          if (Array.isArray(row.tags)) return row.tags;
          if (typeof row.tags === 'string') return JSON.parse(row.tags);
        } catch (e) { return []; }
        return [];
      })(),
    };
  }

  async deleteDocument(id: number): Promise<boolean> {
    const res = await pool.query('DELETE FROM documents WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async searchDocuments(params: SearchParams): Promise<Document[]> {
    // Advanced search with multiple criteria
    let sql = 'SELECT * FROM documents WHERE 1=1';
    const values: any[] = [];
    let paramCount = 0;

    // Text search in title, extracted text, and structured text
    if (params.query && params.query.trim()) {
      paramCount++;
      sql += ` AND (
        LOWER(title) LIKE $${paramCount} OR 
        LOWER(extracted_text) LIKE $${paramCount} OR
        LOWER(structured_text::text) LIKE $${paramCount}
      )`;
      values.push(`%${params.query.toLowerCase()}%`);
    }

    // Category filter (array contains check)
    if (params.categories && params.categories.length > 0) {
      paramCount++;
      sql += ` AND categories && $${paramCount}`;
      values.push(params.categories);
    }

    // Tags filter (array contains check)
    if (params.tags && params.tags.length > 0) {
      paramCount++;
      sql += ` AND tags && $${paramCount}`;
      values.push(params.tags);
    }

    // Date range filters
    if (params.dateFrom) {
      paramCount++;
      sql += ` AND created_at >= $${paramCount}`;
      values.push(params.dateFrom);
    }

    if (params.dateTo) {
      paramCount++;
      sql += ` AND created_at <= $${paramCount}`;
      values.push(params.dateTo + ' 23:59:59'); // Include full day
    }

    // Document type filter (from structured_text JSON)
    if (params.documentType && params.documentType !== 'all') {
      paramCount++;
      sql += ` AND structured_text->>'documentType' = $${paramCount}`;
      values.push(params.documentType);
    }

    // Entity filters (check JSON arrays)
    if (params.hasEmails) {
      sql += ` AND jsonb_array_length(COALESCE(structured_text->'entities'->'emails', '[]'::jsonb)) > 0`;
    }

    if (params.hasPhones) {
      sql += ` AND jsonb_array_length(COALESCE(structured_text->'entities'->'phones', '[]'::jsonb)) > 0`;
    }

    if (params.hasAmounts) {
      sql += ` AND jsonb_array_length(COALESCE(structured_text->'entities'->'amounts', '[]'::jsonb)) > 0`;
    }

    // Confidence filter
    if (params.minConfidence && params.minConfidence > 0) {
      paramCount++;
      sql += ` AND (structured_text->>'confidence')::numeric >= $${paramCount}`;
      values.push(params.minConfidence);
    }

    sql += ' ORDER BY created_at DESC';
    
    console.log('[PG-STORAGE] Search SQL:', sql);
    console.log('[PG-STORAGE] Search values:', values);
    
    const res = await pool.query(sql, values);
    // Ensure categories and tags are always arrays
    return res.rows.map((row) => ({
      id: row.id,
      title: row.title,
      originalName: row.original_name,
      fileType: row.file_type,
      fileSize: row.file_size,
      filePath: row.file_path,
      extractedText: row.extracted_text,
      structuredText: (() => {
        try {
          return row.structured_text ? 
            (typeof row.structured_text === 'string' ? JSON.parse(row.structured_text) : row.structured_text) 
            : null;
        } catch (e) { return null; }
      })(),
      processingStatus: row.processingStatus,
      uploadDate: row.created_at,
      processedDate: row.processed_date,
      categories: (() => {
        try {
          if (Array.isArray(row.categories)) return row.categories;
          if (typeof row.categories === 'string') return JSON.parse(row.categories);
        } catch (e) { return []; }
        return [];
      })(),
      tags: (() => {
        try {
          if (Array.isArray(row.tags)) return row.tags;
          if (typeof row.tags === 'string') return JSON.parse(row.tags);
        } catch (e) { return []; }
        return [];
      })(),
    }));
  }

  async getDocumentStats() {
    const res = await pool.query('SELECT COUNT(*) as total FROM documents');
    const totalDocuments = parseInt(res.rows[0].total, 10);
    // Add more stats as needed
    return { totalDocuments, processing: 0, searchable: 0, storageUsed: 'N/A' };
  }

  // Category operations (implement as needed)
  async getCategory(id: number): Promise<Category | undefined> {
    const res = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    return res.rows[0];
  }
  async getAllCategories(): Promise<Category[]> {
    const res = await pool.query(`
      SELECT 
        c.*,
        COUNT(d.id) as document_count
      FROM categories c
      LEFT JOIN documents d ON d.categories && ARRAY[c.name]
      GROUP BY c.id, c.name, c.color
      ORDER BY c.name
    `);
    return res.rows.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
      documentCount: parseInt(row.document_count) || 0,
    }));
  }
  async createCategory(cat: InsertCategory): Promise<Category> {
    const res = await pool.query(
      'INSERT INTO categories ("name", "color") VALUES ($1, $2) RETURNING *',
      [cat.name, cat.color]
    );
    return res.rows[0];
  }
  async updateCategory(id: number, updates: Partial<Category>): Promise<Category | undefined> {
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key in updates) {
      fields.push(`"${key}" = $${idx}`);
      values.push((updates as any)[key]);
      idx++;
    }
    if (!fields.length) return this.getCategory(id);
    values.push(id);
    const sql = `UPDATE categories SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await pool.query(sql, values);
    return res.rows[0];
  }
  async deleteCategory(id: number): Promise<boolean> {
    const res = await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
  async getCategoryByName(name: string): Promise<Category | undefined> {
    const res = await pool.query('SELECT * FROM categories WHERE "name" = $1', [name]);
    return res.rows[0];
  }
}

export const storage = new PgStorage();

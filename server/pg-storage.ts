import { Pool } from 'pg';
import { type Document, type InsertDocument, type Category, type InsertCategory, type SearchParams } from "../shared/schema.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:12345@localhost:5432/docscanpro',
});

const DOCUMENT_COLUMNS = `id, title, original_name, file_type, file_size, file_path,
  extracted_text, structured_text, categories, tags, processing_status, upload_date, processed_date`;

function mapDocument(row: any): Document {
  let structuredText = null;
  let categories: any[] = [];
  let tags: any[] = [];

  try {
    structuredText = row.structured_text
      ? (typeof row.structured_text === 'string' ? JSON.parse(row.structured_text) : row.structured_text)
      : null;
  } catch {
    structuredText = null;
  }

  try {
    categories = Array.isArray(row.categories)
      ? row.categories
      : (typeof row.categories === 'string' ? JSON.parse(row.categories) : []);
  } catch {
    categories = [];
  }

  try {
    tags = Array.isArray(row.tags)
      ? row.tags
      : (typeof row.tags === 'string' ? JSON.parse(row.tags) : []);
  } catch {
    tags = [];
  }

  return {
    id: row.id,
    title: row.title,
    originalName: row.original_name,
    fileType: row.file_type,
    fileSize: row.file_size,
    filePath: row.file_path,
    extractedText: row.extracted_text,
    structuredText,
    categories,
    tags,
    processingStatus: row.processing_status,
    uploadDate: row.upload_date,
    processedDate: row.processed_date,
  };
}

export class PgStorage {
  async getDocument(id: number): Promise<Document | undefined> {
    const res = await pool.query(`SELECT ${DOCUMENT_COLUMNS} FROM documents WHERE id = $1`, [id]);
    return res.rows[0] ? mapDocument(res.rows[0]) : undefined;
  }

  async getAllDocuments(): Promise<Document[]> {
    try {
      const res = await pool.query(`SELECT ${DOCUMENT_COLUMNS} FROM documents ORDER BY upload_date DESC`);
      return res.rows.map(mapDocument);
    } catch (e) {
      console.error('Error querying documents:', e);
      return [];
    }
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const res = await pool.query(
      `INSERT INTO documents (
        title, original_name, file_type, file_size, file_path, extracted_text,
        structured_text, categories, tags, processing_status, upload_date, processed_date
      )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NULL)
       RETURNING ${DOCUMENT_COLUMNS}`,
      [
        doc.title,
        doc.originalName,
        doc.fileType,
        doc.fileSize,
        doc.filePath,
        doc.extractedText,
        doc.structuredText ? JSON.stringify(doc.structuredText) : null,
        doc.categories || [],
        doc.tags || [],
        doc.processingStatus || 'pending',
      ]
    );
    return mapDocument(res.rows[0]);
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined> {
    const keyMap: Record<string, string> = {
      title: 'title',
      originalName: 'original_name',
      fileType: 'file_type',
      fileSize: 'file_size',
      filePath: 'file_path',
      extractedText: 'extracted_text',
      structuredText: 'structured_text',
      categories: 'categories',
      tags: 'tags',
      processingStatus: 'processing_status',
      uploadDate: 'upload_date',
      processedDate: 'processed_date',
    };

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, rawValue] of Object.entries(updates)) {
      const dbKey = keyMap[key];
      if (!dbKey) continue;
      fields.push(`"${dbKey}" = $${idx}`);
      values.push(key === 'structuredText'
        ? (rawValue == null ? null : JSON.stringify(rawValue))
        : rawValue);
      idx++;
    }

    if (!fields.length) return this.getDocument(id);

    values.push(id);
    const sql = `UPDATE documents SET ${fields.join(', ')} WHERE id = $${idx} RETURNING ${DOCUMENT_COLUMNS}`;
    const res = await pool.query(sql, values);
    return res.rows[0] ? mapDocument(res.rows[0]) : undefined;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const res = await pool.query('DELETE FROM documents WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async searchDocuments(params: SearchParams): Promise<Document[]> {
    let sql = `SELECT ${DOCUMENT_COLUMNS} FROM documents WHERE 1=1`;
    const values: any[] = [];
    let paramCount = 0;

    if (params.query && params.query.trim()) {
      paramCount++;
      sql += ` AND (
        LOWER(title) LIKE $${paramCount} OR
        LOWER(extracted_text) LIKE $${paramCount} OR
        LOWER(COALESCE(structured_text::text, '')) LIKE $${paramCount}
      )`;
      values.push(`%${params.query.toLowerCase()}%`);
    }

    if (params.categories?.length) {
      paramCount++;
      sql += ` AND categories && $${paramCount}`;
      values.push(params.categories);
    }

    if (params.tags?.length) {
      paramCount++;
      sql += ` AND tags && $${paramCount}`;
      values.push(params.tags);
    }

    if (params.dateFrom) {
      paramCount++;
      sql += ` AND upload_date >= $${paramCount}`;
      values.push(params.dateFrom);
    }

    if (params.dateTo) {
      paramCount++;
      sql += ` AND upload_date <= $${paramCount}`;
      values.push(`${params.dateTo} 23:59:59`);
    }

    if (params.documentType && params.documentType !== 'all') {
      paramCount++;
      sql += ` AND structured_text->>'documentType' = $${paramCount}`;
      values.push(params.documentType);
    }

    if (params.hasEmails) sql += ` AND jsonb_array_length(COALESCE(structured_text->'entities'->'emails', '[]'::jsonb)) > 0`;
    if (params.hasPhones) sql += ` AND jsonb_array_length(COALESCE(structured_text->'entities'->'phones', '[]'::jsonb)) > 0`;
    if (params.hasAmounts) sql += ` AND jsonb_array_length(COALESCE(structured_text->'entities'->'amounts', '[]'::jsonb)) > 0`;

    if (params.minConfidence && params.minConfidence > 0) {
      paramCount++;
      sql += ` AND (structured_text->>'confidence')::numeric >= $${paramCount}`;
      values.push(params.minConfidence);
    }

    sql += ' ORDER BY upload_date DESC';
    return (await pool.query(sql, values)).rows.map(mapDocument);
  }

  async getDocumentStats() {
    const res = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE processing_status IN ('pending', 'processing'))::int AS processing,
        COUNT(*) FILTER (WHERE processing_status = 'completed' AND extracted_text IS NOT NULL)::int AS searchable,
        COALESCE(SUM(file_size), 0)::bigint AS storage_used
      FROM documents
    `);
    const row = res.rows[0];
    return {
      totalDocuments: row.total,
      processing: row.processing,
      searchable: row.searchable,
      storageUsed: `${(Number(row.storage_used) / (1024 * 1024)).toFixed(1)} MB`,
    };
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const res = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    return res.rows[0];
  }

  async getAllCategories(): Promise<Category[]> {
    const res = await pool.query(`
      SELECT c.*, COUNT(d.id) as document_count
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
      'INSERT INTO categories (name, color) VALUES ($1, $2) RETURNING *',
      [cat.name, cat.color]
    );
    return res.rows[0];
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<Category | undefined> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, value] of Object.entries(updates)) {
      if (!['name', 'color', 'documentCount'].includes(key)) continue;
      const dbKey = key === 'documentCount' ? 'document_count' : key;
      fields.push(`"${dbKey}" = $${idx}`);
      values.push(value);
      idx++;
    }
    if (!fields.length) return this.getCategory(id);
    values.push(id);
    const res = await pool.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    return res.rows[0];
  }

  async deleteCategory(id: number): Promise<boolean> {
    const res = await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    const res = await pool.query('SELECT * FROM categories WHERE name = $1', [name]);
    return res.rows[0];
  }
}

export const storage = new PgStorage();
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:12345@localhost:5432/docscanpro",
});

export async function setupAiStorage() {
  // pgvector is available on common managed PostgreSQL providers such as Neon.
  await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS document_chunks (
      id SERIAL PRIMARY KEY,
      document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      embedding vector(1536) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(document_id, chunk_index)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx
    ON document_chunks(document_id)
  `);

  // IVFFlat is useful once the table grows. It is intentionally created only
  // after the first vectors exist because PostgreSQL requires training rows.
  console.log("[ai] pgvector/document_chunks storage ready");
}

export { pool as aiPool };

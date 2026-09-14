import "dotenv/config";
import { aiPool } from "./ai-setup";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";
const EMBEDDING_MODEL = "gemini-embedding-001";
const CHAT_MODEL = process.env.CHAT_MODEL || "gemini-2.5-flash-lite";
const EMBEDDING_DIMENSIONS = 1536;

function requireApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return key;
}

async function geminiPost(model: string, method: "embedContent" | "generateContent", body: unknown) {
  const response = await fetch(`${GEMINI_API_URL}/models/${model}:${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": requireApiKey(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${message.slice(0, 500)}`);
  }

  return response.json() as Promise<any>;
}

export function chunkText(text: string, chunkSize = 1200, overlap = 200): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    const chunk = normalized.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= normalized.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

function normalizeEmbedding(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  return norm > 0 ? values.map((value) => value / norm) : values;
}

async function createEmbedding(text: string, taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"): Promise<number[]> {
  const data = await geminiPost(EMBEDDING_MODEL, "embedContent", {
    content: {
      parts: [{ text }],
    },
    embedContentConfig: {
      taskType,
      outputDimensionality: EMBEDDING_DIMENSIONS,
      autoTruncate: true,
    },
  });

  const values = data.embedding?.values;
  if (!Array.isArray(values)) {
    throw new Error("Gemini embedding response did not contain values");
  }

  // Gemini normally honors outputDimensionality. If the API returns its
  // default 3072 dimensions anyway, truncate the MRL embedding to the same
  // 1536 dimensions used by pgvector. Both document and query embeddings
  // pass through this function, so they remain in the same vector space.
  const reduced = values.length === EMBEDDING_DIMENSIONS
    ? values
    : values.length >= EMBEDDING_DIMENSIONS
      ? values.slice(0, EMBEDDING_DIMENSIONS)
      : null;

  if (!reduced) {
    throw new Error(`Gemini embedding returned an unexpected dimension: ${values.length}`);
  }

  // gemini-embedding-001 requires normalization when using a reduced dimension.
  return normalizeEmbedding(reduced);
}

function vectorLiteral(values: number[]) {
  return `[${values.join(",")}]`;
}

export async function indexDocument(documentId: number, text: string) {
  const chunks = chunkText(text);
  await aiPool.query("DELETE FROM document_chunks WHERE document_id = $1", [documentId]);

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await createEmbedding(chunks[i], "RETRIEVAL_DOCUMENT");
    await aiPool.query(
      `INSERT INTO document_chunks (document_id, chunk_index, content, embedding)
       VALUES ($1, $2, $3, $4::vector)`,
      [documentId, i, chunks[i], vectorLiteral(embedding)]
    );
  }

  return { chunks: chunks.length };
}

export async function answerQuestion(documentId: number, question: string, topK = 4) {
  const queryEmbedding = await createEmbedding(question, "RETRIEVAL_QUERY");
  const result = await aiPool.query(
    `SELECT id, document_id, chunk_index, content,
            1 - (embedding <=> $1::vector) AS similarity
     FROM document_chunks
     WHERE document_id = $2
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    [vectorLiteral(queryEmbedding), documentId, topK]
  );

  if (result.rows.length === 0) {
    throw new Error("No indexed content found for this document");
  }

  const context = result.rows
    .map((row) => `[Chunk ${row.chunk_index + 1}]\n${row.content}`)
    .join("\n\n");

  const data = await geminiPost(CHAT_MODEL, "generateContent", {
    systemInstruction: {
      parts: [{
        text: "You answer questions about an uploaded document. Use only the supplied context. If the answer is not contained in the context, say that the document does not provide enough information. Do not invent facts.",
      }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: `Context:\n${context}\n\nQuestion: ${question}` }],
      },
    ],
    generationConfig: {
      temperature: 0,
    },
  });

  return {
    answer: data.candidates?.[0]?.content?.parts
      ?.map((part: any) => part.text || "")
      .join("")
      .trim() || "No answer generated.",
    sources: result.rows.map((row) => ({
      chunk: row.chunk_index + 1,
      similarity: Number(row.similarity),
      content: row.content,
    })),
  };
}

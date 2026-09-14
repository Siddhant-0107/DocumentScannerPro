import { aiPool } from "./ai-setup";

const OPENAI_API_URL = "https://api.openai.com/v1";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
const CHAT_MODEL = process.env.CHAT_MODEL || "gpt-4o-mini";

function requireApiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  return key;
}

async function openAiPost(path: string, body: unknown) {
  const response = await fetch(`${OPENAI_API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireApiKey()}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${message.slice(0, 500)}`);
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

async function createEmbedding(text: string): Promise<number[]> {
  const data = await openAiPost("/embeddings", {
    model: EMBEDDING_MODEL,
    input: text,
  });
  return data.data[0].embedding;
}

function vectorLiteral(values: number[]) {
  return `[${values.join(",")}]`;
}

export async function indexDocument(documentId: number, text: string) {
  const chunks = chunkText(text);
  await aiPool.query("DELETE FROM document_chunks WHERE document_id = $1", [documentId]);

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await createEmbedding(chunks[i]);
    await aiPool.query(
      `INSERT INTO document_chunks (document_id, chunk_index, content, embedding)
       VALUES ($1, $2, $3, $4::vector)`,
      [documentId, i, chunks[i], vectorLiteral(embedding)]
    );
  }

  return { chunks: chunks.length };
}

export async function answerQuestion(documentId: number, question: string, topK = 4) {
  const queryEmbedding = await createEmbedding(question);
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

  const data = await openAiPost("/chat/completions", {
    model: CHAT_MODEL,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You answer questions about an uploaded document. Use only the supplied context. If the answer is not contained in the context, say that the document does not provide enough information. Do not invent facts.",
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  return {
    answer: data.choices?.[0]?.message?.content?.trim() || "No answer generated.",
    sources: result.rows.map((row) => ({
      chunk: row.chunk_index + 1,
      similarity: Number(row.similarity),
      content: row.content,
    })),
  };
}

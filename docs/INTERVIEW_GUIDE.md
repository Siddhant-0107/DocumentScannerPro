# Interview Guide — AI Document Intelligence Platform

This guide explains the parts of the project that are most important to understand before presenting or discussing the project in an interview.

## 1. One-line explanation

> A full-stack document intelligence platform that extracts text from PDFs/images, stores searchable document data in PostgreSQL, builds semantic indexes with Gemini embeddings + pgvector, and answers document-specific questions using RAG.

## 2. Architecture

```text
React + TypeScript
        |
     REST API
        |
   Node + Express
        |
  +-----+----------------+
  |                      |
PostgreSQL          Document Processing
                         |
                  PDF.js / Tesseract
                         |
                   Extracted Text
                         |
                      Chunking
                         |
                Gemini Embeddings
                         |
                  PostgreSQL/pgvector
                         |
                  Similarity Search
                         |
                  Gemini Flash-Lite
                         |
                  Grounded Answer
```

## 3. Core flow to memorize

### Upload flow
1. User uploads a PDF/image from React.
2. Express receives the multipart request with Multer.
3. Document metadata is stored in PostgreSQL.
4. Text is extracted with PDF.js for text-based PDFs or Tesseract.js for images.
5. Extracted text is saved back to PostgreSQL.
6. The text is chunked and indexed for semantic retrieval.

### RAG flow
1. Split extracted text into overlapping chunks.
2. Generate a Gemini embedding for each chunk.
3. Store embeddings in PostgreSQL using pgvector.
4. Convert the user's question into an embedding with the same model.
5. Retrieve the most similar chunks with vector similarity search.
6. Send only the retrieved chunks plus the question to Gemini.
7. Return the generated answer and the retrieved source chunks.

## 4. Why RAG?

Sending an entire document to the model for every question is inefficient and does not scale well with document length. RAG first retrieves the most relevant document chunks, then uses those chunks as context for the LLM. This improves grounding, reduces unnecessary context, and makes document-specific answers easier to inspect.

## 5. What are embeddings?

Embeddings represent text as vectors. Texts with similar meaning tend to have vectors that are closer together in vector space. The project uses Gemini embeddings and stores 1536-dimensional vectors in pgvector.

## 6. Why PostgreSQL + pgvector?

PostgreSQL already stores the application data, so pgvector keeps semantic search in the same database instead of introducing another database service. This keeps the architecture simpler for a portfolio project while supporting vector similarity queries.

## 7. Why chunking?

Whole-document embeddings are too coarse for precise retrieval. Chunking creates smaller searchable units so the system can retrieve only the parts relevant to a question. The current RAG implementation uses overlapping chunks to preserve context across boundaries.

## 8. OCR vs PDF extraction

Text-based PDFs can expose a text layer, so PDF.js can extract text directly without OCR. Images require OCR, so Tesseract.js is used for image documents. This distinction matters because OCR quality depends on image quality, layout, fonts, skew, and noise.

## 9. Main technologies

- React + TypeScript — frontend UI and client state
- Node.js + Express — REST API
- Multer — multipart file uploads
- PostgreSQL — document metadata and extracted text
- pgvector — vector similarity search
- PDF.js — text extraction from text-based PDFs
- Tesseract.js — OCR for images
- Gemini API — embeddings and answer generation
- React Query — frontend server-state management
- Zod — request/data validation

## 10. Key files

- `client/src/pages/dashboard.tsx` — main document dashboard
- `client/src/pages/assistant.tsx` — AI assistant page
- `client/src/components/document-assistant.tsx` — assistant UI and question flow
- `client/src/components/file-upload.tsx` — upload + document-processing flow
- `client/src/lib/ocr.ts` — PDF/image text extraction
- `server/routes.ts` — document REST endpoints
- `server/ai-routes.ts` — indexing and Q&A endpoints
- `server/rag.ts` — chunking, embeddings, vector retrieval, and answer generation
- `server/pg-storage.ts` — PostgreSQL persistence
- `server/ai-setup.ts` — pgvector/table setup
- `shared/schema.ts` — shared data models and validation

## 11. API endpoints worth knowing

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/documents/upload` | Upload documents |
| GET | `/api/documents` | List documents |
| GET | `/api/documents/:id` | Get one document |
| POST | `/api/documents/search` | Search extracted document text |
| POST | `/api/documents/:id/index` | Build/update semantic index |
| POST | `/api/documents/:id/ask` | Ask a question using RAG |
| GET | `/api/documents/stats` | Dashboard statistics |

## 12. Interview questions and answer frames

### Why use RAG instead of sending the full document to the LLM?
Because RAG retrieves only the most relevant chunks before generation. This reduces context size, improves grounding, and makes the answer traceable to source chunks.

### Why use vector search?
Keyword search depends on exact wording. Vector search captures semantic similarity, so a question can retrieve relevant text even when the wording differs.

### Why pgvector instead of a dedicated vector database?
For this project's scale, PostgreSQL plus pgvector is enough and reduces infrastructure complexity because relational and vector data stay together.

### What happens if the answer is not in the document?
The model is given retrieved document context and should avoid inventing unsupported facts. An important demo test is to ask a question whose answer is absent from the document and confirm that the assistant does not confidently fabricate an answer.

### What was the hardest engineering part?
Connecting the full pipeline reliably: file upload, text extraction, persistence, embedding generation, vector storage, similarity retrieval, and LLM generation, while keeping the deployed architecture simple enough for a portfolio project.

### How would you improve it at larger scale?
Potential improvements include durable object storage for originals, background job processing, better hybrid retrieval, stronger observability, caching, batching embeddings, and more robust evaluation. These are intentionally outside the current lean scope.

## 13. What not to overclaim

Do not claim an OCR accuracy percentage unless it comes from a reproducible evaluation set.

Do not describe the system as a microservices architecture.

Do not claim fine-tuning, agentic RAG, hybrid search, or production-grade distributed processing unless those capabilities are actually implemented.

## 14. Five-minute demo script

1. Open the dashboard.
2. Upload a small PDF or image.
3. Show the processing status and extracted text.
4. Open `/assistant`.
5. Select the processed document.
6. Ask a question whose answer is clearly present in the document.
7. Show the grounded answer and retrieved chunks.
8. Ask a question whose answer is absent and verify that the system does not invent a fact.

## 15. Strong closing explanation

> The key idea is that the application separates document ingestion from question answering. The document is processed once, indexed semantically, and then user questions retrieve only the relevant chunks before generation. That makes the assistant document-grounded while keeping the overall architecture relatively simple.

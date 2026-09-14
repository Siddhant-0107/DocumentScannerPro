# AI Document Intelligence Platform

A lean full-stack document intelligence application for uploading PDF/images, extracting text with OCR/PDF parsing, searching document content, and asking grounded questions using retrieval-augmented generation (RAG).

## Features

- PDF, PNG, JPG and JPEG uploads (10 MB limit)
- Tesseract.js OCR for image documents
- PDF.js text extraction for text-based PDFs
- Entity extraction from processed text
- PostgreSQL document metadata and OCR text storage
- Semantic document indexing with Gemini embeddings
- PostgreSQL + pgvector similarity search
- RAG-based document Q&A with retrieved source chunks
- Simple React/TypeScript document dashboard and text search

## Architecture

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

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Radix UI, React Query

**Backend:** Node.js, Express.js, TypeScript, Multer, Zod

**Document AI:** Tesseract.js, PDF.js, Gemini API, RAG

**Storage:** PostgreSQL, pgvector

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL with the `vector` extension (Neon and other managed PostgreSQL providers commonly support pgvector)
- Gemini API key from Google AI Studio

### Environment variables

```env
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
CHAT_MODEL=gemini-2.5-flash-lite
NODE_ENV=development
```

The application creates the `document_chunks` table and enables pgvector on startup when the database user has permission to install extensions. The embedding model is `gemini-embedding-001` with 1536-dimensional vectors, matching the PostgreSQL `vector(1536)` column.

### Run

```bash
npm install
npm run start:all
```

The command starts the API server, frontend development server, and document worker.

- App: `http://localhost:5000`
- AI Assistant: `http://localhost:5000/assistant`

## RAG Flow

1. A document is uploaded and stored.
2. Text is extracted using Tesseract.js or PDF.js.
3. Extracted text is cleaned and processed.
4. The text is split into overlapping chunks.
5. Each chunk is converted into a 1536-dimensional Gemini embedding.
6. Embeddings are normalized and stored in PostgreSQL using pgvector.
7. A user question is embedded using the same Gemini embedding model.
8. pgvector returns the most similar document chunks.
9. The retrieved chunks are supplied to Gemini as context.
10. The assistant answers using the retrieved context and returns the source chunks used.

The project uses the Gemini Developer API's free tier for small demos and presentations; free-tier limits are subject to Google's current quotas and model availability.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/documents/upload` | Upload documents |
| GET | `/api/documents` | List documents |
| GET | `/api/documents/:id` | Get a document |
| POST | `/api/documents/search` | Search document text |
| POST | `/api/documents/:id/index` | Create/update semantic index |
| POST | `/api/documents/:id/ask` | Ask a question about a document |
| GET | `/api/documents/stats` | Dashboard statistics |

## Evaluation

OCR performance should be measured against a held-out document set before reporting an OCR accuracy metric on a resume. Reported metrics should come from reproducible evaluation results.

## Project Structure

```text
document-scanner-pro/
├── client/                         # React frontend
├── server/
│   ├── routes.ts                   # Core REST API
│   ├── ai-routes.ts                # Semantic search + RAG endpoints
│   ├── rag.ts                      # Chunking, Gemini embeddings and RAG
│   ├── ai-setup.ts                 # pgvector setup
│   ├── pg-storage.ts               # PostgreSQL access
│   ├── text-processor.ts           # OCR text processing/entity extraction
│   ├── server/document-worker.ts   # Async document processing
│   └── index.ts                    # Server entry point
├── shared/schema.ts                # Shared types and validation
└── package.json
```

## License

MIT

# AI Document Intelligence Platform

A full-stack document intelligence application for uploading PDF/images, extracting text with OCR/PDF parsing, classifying documents, searching document content, and asking grounded questions using retrieval-augmented generation (RAG).

## Features

- PDF, PNG, JPG and JPEG uploads (10 MB limit)
- Asynchronous document processing with a background worker
- Tesseract.js OCR for image documents
- PDF.js text extraction for text-based PDFs
- Rule-based document classification and entity extraction
- PostgreSQL document metadata and structured OCR storage
- Semantic document indexing with OpenAI embeddings
- PostgreSQL + pgvector similarity search
- RAG-based document Q&A with retrieved source chunks
- React/TypeScript dashboard and analytics

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
PostgreSQL          Background Worker
                         |
                  PDF.js / Tesseract
                         |
                   Extracted Text
                         |
                      Chunking
                         |
                    Embeddings
                         |
                  PostgreSQL/pgvector
                         |
                    Similarity Search
                         |
                        LLM
                         |
                  Grounded Answer
```

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Radix UI, React Query, Recharts

**Backend:** Node.js, Express.js, TypeScript, Multer, Zod

**Document AI:** Tesseract.js, PDF.js, OpenAI embeddings, RAG

**Storage:** PostgreSQL, pgvector

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL with the `vector` extension (Neon and other managed PostgreSQL providers commonly support pgvector)
- OpenAI API key for semantic indexing and Q&A

### Environment variables

```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=...
EMBEDDING_MODEL=text-embedding-3-small
CHAT_MODEL=gpt-4o-mini
NODE_ENV=development
```

The application automatically creates the `document_chunks` table and enables pgvector on startup when the database user has permission to install extensions.

### Run

```bash
npm install
npm run start:all
```

The command starts the API server, frontend development server, and document worker.

- App: `http://localhost:5000`
- AI Assistant: `http://localhost:5000/assistant`

## RAG Flow

1. A document is uploaded and stored with `pending` status.
2. The background worker extracts text using Tesseract.js or PDF.js.
3. Extracted text is cleaned and structured.
4. The text is split into overlapping chunks.
5. Each chunk is converted into an embedding using `text-embedding-3-small`.
6. Embeddings are stored in PostgreSQL using pgvector.
7. A user question is embedded using the same model.
8. pgvector returns the most similar document chunks.
9. The retrieved chunks are supplied to the LLM as context.
10. The assistant answers using only the retrieved context and returns the source chunks used.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/documents/upload` | Upload documents |
| GET | `/api/documents` | List documents |
| GET | `/api/documents/:id` | Get a document |
| POST | `/api/documents/search` | Search/filter documents |
| POST | `/api/documents/:id/index` | Create/update semantic index |
| POST | `/api/documents/:id/ask` | Ask a question about a document |
| GET | `/api/documents/stats` | Dashboard statistics |

## Evaluation

OCR and classification performance should be measured against a held-out document set before reporting metrics on a resume. The project does not hard-code performance claims; reported accuracy/precision should come from reproducible evaluation results.

## Project Structure

```text
document-scanner-pro/
├── client/                         # React frontend
├── server/
│   ├── routes.ts                   # Core REST API
│   ├── ai-routes.ts                # Semantic search + RAG endpoints
│   ├── rag.ts                      # Chunking, embeddings and RAG
│   ├── ai-setup.ts                 # pgvector setup
│   ├── pg-storage.ts               # PostgreSQL access
│   ├── text-processor.ts           # OCR text processing/classification
│   ├── server/document-worker.ts   # Async document processing
│   └── index.ts                    # Server entry point
├── shared/schema.ts                # Shared types and validation
└── package.json
```

## License

MIT

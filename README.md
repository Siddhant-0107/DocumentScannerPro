# AI Document Intelligence Platform

A full-stack document intelligence application for uploading PDFs/images, extracting text, searching document content, and answering document-specific questions with retrieval-augmented generation (RAG).

## Live Demo

**App:** https://document-scanner-pro.vercel.app/

**AI Assistant:** https://document-scanner-pro.vercel.app/assistant

## What it does

- Uploads PDF, PNG, JPG, and JPEG documents
- Extracts text from text-based PDFs with PDF.js
- Runs OCR on image documents with Tesseract.js
- Stores document metadata and extracted text in PostgreSQL
- Builds semantic indexes with Gemini embeddings
- Stores vectors in PostgreSQL using pgvector
- Retrieves relevant document chunks for questions
- Generates grounded answers with Gemini
- Returns retrieved source chunks alongside answers
- Provides document search and processing status in a React dashboard

## Architecture

```text
                    React + TypeScript
                           |
                       REST API
                           |
                      Node + Express
                           |
             +-------------+-------------+
             |                           |
        PostgreSQL                 Text Extraction
             |                    PDF.js / Tesseract
             |                           |
             |                      Extracted Text
             |                           |
             |                        Chunking
             |                           |
             |                  Gemini Embeddings
             |                           |
             +------ PostgreSQL/pgvector+
                         |
                  Similarity Search
                         |
                  Retrieved Chunks
                         |
                  Gemini Flash-Lite
                         |
                   Grounded Answer
```

## RAG pipeline

```text
Document
   ↓
PDF.js / Tesseract OCR
   ↓
Extracted text
   ↓
Overlapping chunks
   ↓
Gemini embeddings
   ↓
PostgreSQL + pgvector

User question
   ↓
Question embedding
   ↓
Similarity search
   ↓
Top relevant chunks
   ↓
Gemini with retrieved context
   ↓
Answer + source chunks
```

The application indexes a processed document so questions can retrieve semantically relevant chunks instead of sending the entire document to the LLM each time.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Radix UI, React Query |
| Backend | Node.js, Express.js, TypeScript, Multer, Zod |
| Document AI | Tesseract.js, PDF.js, Gemini API, RAG |
| Storage | PostgreSQL, pgvector |
| Deployment | Vercel |

## Project structure

```text
DocumentScannerPro/
├── client/
│   └── src/
│       ├── components/
│       │   ├── document-assistant.tsx
│       │   ├── document-preview-modal.tsx
│       │   └── file-upload.tsx
│       ├── lib/
│       │   └── ocr.ts
│       └── pages/
│           ├── dashboard.tsx
│           └── assistant.tsx
├── server/
│   ├── ai-routes.ts
│   ├── ai-setup.ts
│   ├── pg-storage.ts
│   ├── rag.ts
│   ├── routes.ts
│   ├── text-processor.ts
│   ├── server/
│   │   └── document-worker.ts
│   └── index.ts
├── shared/
│   └── schema.ts
├── docs/
│   └── INTERVIEW_GUIDE.md
├── api/
│   └── index.ts
└── package.json
```

## Local setup

### Prerequisites

- Node.js 18+
- PostgreSQL with the `vector` extension
- Gemini API key

### Environment variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
CHAT_MODEL=gemini-2.5-flash-lite
NODE_ENV=development
```

### Run

```bash
npm install
npm run start:all
```

The application runs the API server, frontend development server, and document worker together.

- App: `http://localhost:5000`
- Assistant: `http://localhost:5000/assistant`

## API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/documents/upload` | Upload documents |
| GET | `/api/documents` | List documents |
| GET | `/api/documents/:id` | Get a document |
| POST | `/api/documents/search` | Search extracted document text |
| POST | `/api/documents/:id/index` | Create/update semantic index |
| POST | `/api/documents/:id/ask` | Ask a question using RAG |
| GET | `/api/documents/stats` | Dashboard statistics |

## Evaluation

OCR quality should be measured on a held-out labeled document set before reporting a numeric accuracy metric. The repository includes an evaluation area for reproducible OCR testing.

For demos and portfolio claims, use only metrics that have actually been measured and recorded.

## Deployment

The application is deployed on Vercel. Production runtime configuration requires:

```text
DATABASE_URL
GEMINI_API_KEY
CHAT_MODEL
```

The app uses PostgreSQL for persistence and pgvector for semantic retrieval.

## Interview preparation

See [`docs/INTERVIEW_GUIDE.md`](docs/INTERVIEW_GUIDE.md) for the architecture explanation, RAG flow, key files, API endpoints, interview questions, demo script, and guidance on what not to overclaim.

## License

MIT

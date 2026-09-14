import { storage } from '../pg-storage.js';
import { TextProcessor } from '../text-processor.js';
import { indexDocument } from '../rag.js';
import fs from 'fs';
import path from 'path';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const textProcessor = new TextProcessor();

async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (['.png', '.jpg', '.jpeg'].includes(ext)) {
    const worker = await createWorker('eng');
    try {
      const { data: { text } } = await worker.recognize(filePath);
      return text;
    } finally {
      await worker.terminate();
    }
  }

  if (ext === '.pdf') {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim();
      if (text) pages.push(text);
    }

    // This project keeps the OCR path simple: text PDFs use PDF.js. Scanned
    // PDFs without an embedded text layer can be added as a later enhancement.
    return pages.join('\n\n');
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

async function processPendingDocuments() {
  const docs = await storage.getAllDocuments();
  const pendingDocs = docs.filter(doc => doc.processingStatus === 'pending');

  for (const doc of pendingDocs) {
    try {
      await storage.updateDocument(doc.id, { processingStatus: 'processing' });

      if (!fs.existsSync(doc.filePath)) {
        throw new Error('File not found on disk');
      }

      const extractedText = await extractTextFromFile(doc.filePath);
      const structuredText = textProcessor.processText(extractedText);

      await storage.updateDocument(doc.id, {
        extractedText,
        structuredText,
        processingStatus: 'completed',
        processedDate: new Date(),
      });

      // RAG indexing is optional at processing time so OCR still works when
      // an LLM API key is not configured.
      if (process.env.OPENAI_API_KEY && extractedText.trim()) {
        try {
          const result = await indexDocument(doc.id, extractedText);
          console.log(`[worker] Indexed ${result.chunks} chunks for document ${doc.id}`);
        } catch (error) {
          console.error(`[worker] RAG indexing failed for document ${doc.id}:`, error);
        }
      }

      console.log(`[worker] Processed document ${doc.id} as ${structuredText.documentType}`);
    } catch (error) {
      console.error(`[worker] Failed document ${doc.id}:`, error);
      await storage.updateDocument(doc.id, {
        processingStatus: 'failed',
        extractedText: error instanceof Error ? error.message : 'Processing failed',
      });
    }
  }
}

console.log('[worker] Document processing worker started');
processPendingDocuments().catch(console.error);
setInterval(() => processPendingDocuments().catch(console.error), 30000);

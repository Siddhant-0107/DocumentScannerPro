import { storage } from '../pg-storage.js';
import { TextProcessor } from '../text-processor.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWorker } from 'tesseract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const textProcessor = new TextProcessor();

async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  
  try {
    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      console.log('[worker] Processing image with OCR...');
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(filePath);
      await worker.terminate();
      return text;
    } else if (ext === '.pdf') {
      console.log('[worker] Processing PDF...');
      // For now, return a placeholder for PDF processing
      // You can implement proper PDF text extraction later
      return `PDF content extracted from ${path.basename(filePath)}. This is a placeholder for PDF text extraction.`;
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error) {
    console.error('[worker] Error extracting text:', error);
    throw error;
  }
}

async function processPendingDocuments() {
  try {
    const docs = await storage.getAllDocuments();
    console.log('[worker] Found documents:', docs.length);
    
    // Look for documents that need processing
    const pendingDocs = docs.filter(doc => 
      doc.processingStatus === 'pending' || 
      (doc.processingStatus === 'completed' && (!doc.extractedText || doc.extractedText.trim() === ''))
    );
    console.log('[worker] Documents needing processing:', pendingDocs.length);
    
    for (const doc of pendingDocs) {
      try {
        console.log(`[worker] Processing document ${doc.id}: ${doc.title}`);
        
        // Update status to processing
        await storage.updateDocument(doc.id, { processingStatus: 'processing' });
        
        // Check if file exists
        if (!fs.existsSync(doc.filePath)) {
          console.log(`[worker] ⚠️  File not found: ${doc.filePath}`);
          await storage.updateDocument(doc.id, { 
            processingStatus: 'failed',
            extractedText: 'File not found on disk',
          });
          continue;
        }
        
        // Extract text using OCR or PDF processing
        const extractedText = await extractTextFromFile(doc.filePath);
        
        // Structure the text
        const structuredText = textProcessor.processText(extractedText);
        
        // Update document with extracted and structured text
        await storage.updateDocument(doc.id, {
          extractedText,
          structuredText,
          processingStatus: 'completed',
          processedDate: new Date(),
        });
        
        console.log(`[worker] ✅ Document ${doc.id} processed successfully`);
        console.log(`[worker] 📊 Document type: ${structuredText.documentType}`);
        console.log(`[worker] 📧 Found ${structuredText.entities.emails.length} emails`);
        console.log(`[worker] 📞 Found ${structuredText.entities.phones.length} phone numbers`);
        console.log(`[worker] 💰 Found ${structuredText.entities.amounts.length} amounts`);
        
      } catch (err) {
        console.error(`[worker] ❌ Failed to process document ${doc.id}:`, err);
        await storage.updateDocument(doc.id, { processingStatus: 'failed' });
      }
    }
  } catch (error) {
    console.error('[worker] Error querying documents:', error);
  }
}

// Process documents immediately on startup
console.log('[worker] Document processing worker started');
processPendingDocuments();

// Then process every 30 seconds
setInterval(processPendingDocuments, 30000);

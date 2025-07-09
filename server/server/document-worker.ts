import { storage } from '../pg-storage';
import fs from 'fs';

async function processPendingDocuments() {
  try {
    const docs = await storage.getAllDocuments();
    console.log('Found documents:', docs.length);
    
    // Look for documents that need processing:
    // 1. Status is 'pending'
    // 2. Status is 'completed' but no extracted text (incorrectly marked)
    const pendingDocs = docs.filter(doc => 
      doc.processingStatus === 'pending' || 
      (doc.processingStatus === 'completed' && (!doc.extractedText || doc.extractedText.trim() === ''))
    );
    console.log('Documents needing processing:', pendingDocs.length);
    
    for (const doc of pendingDocs) {
      try {
        console.log(`Processing document ${doc.id}: ${doc.title}`);
        
        // Check if file exists
        if (!fs.existsSync(doc.filePath)) {
          console.log(`⚠️  File not found: ${doc.filePath}`);
          await storage.updateDocument(doc.id, { 
            processingStatus: 'failed',
            extractedText: 'File not found on disk',
          });
          continue;
        }
        
        // Simulate processing based on file type
        let extractedText = '';
        if (doc.fileType?.includes('image')) {
          extractedText = `[OCR Processed] Image text extracted from ${doc.title}. This is simulated OCR text for testing purposes.`;
        } else if (doc.fileType?.includes('pdf')) {
          extractedText = `[PDF Processed] PDF content extracted from ${doc.title}. This is simulated PDF text extraction for testing purposes.`;
        } else {
          extractedText = `[Document Processed] Content extracted from ${doc.title}. Generic document processing completed.`;
        }
        
        await storage.updateDocument(doc.id, {
          extractedText,
          processingStatus: 'processed',
          processedDate: new Date(),
        });
        console.log(`✓ Document processed: ${doc.title}`);
        console.log(`✓ Extracted text: ${extractedText.substring(0, 100)}...`);
      } catch (err) {
        console.error(`× Failed to process document ${doc.id}:`, err);
        await storage.updateDocument(doc.id, { 
          processingStatus: 'failed',
          extractedText: 'Processing failed: ' + (typeof err === 'object' && err !== null && 'message' in err ? (err as any).message : 'Unknown error'),
        });
      }
    }
  } catch (err) {
    console.error('Worker error:', err);
  }
}

// Run every 10 seconds
setInterval(processPendingDocuments, 10000);

console.log('Document processing worker started.');
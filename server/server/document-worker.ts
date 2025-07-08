import { storage } from '../storage';

async function processPendingDocuments() {
  const docs = await storage.getAllDocuments();
  const pendingDocs = docs.filter(doc => doc.processingStatus === 'pending');
  for (const doc of pendingDocs) {
    try {
      // Simulate processing (replace with real OCR/text extraction as needed)
      const extractedText = '[Simulated] Document processed successfully!';
      await storage.updateDocument(doc.id, {
        extractedText,
        processingStatus: 'processed',
        processedDate: new Date(),
      });
      console.log(`Processed document: ${doc.title}`);
    } catch (err) {
      await storage.updateDocument(doc.id, { processingStatus: 'failed' });
      console.error(`Failed to process document: ${doc.title}`, err);
    }
  }
}

// Run every 10 seconds
setInterval(processPendingDocuments, 10000);

console.log('Document processing worker started.');
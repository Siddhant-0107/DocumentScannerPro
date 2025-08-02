// Script to import all files in uploads/ as documents if not already present in storage
import fs from 'fs';
import path from 'path';
import { storage } from './storage';
import { insertDocumentSchema } from '@shared/schema';

const uploadDir = path.join(process.cwd(), 'uploads');

async function importUploads() {
  const files = fs.readdirSync(uploadDir);
  const existingDocs = await storage.getAllDocuments();
  const existingPaths = new Set(existingDocs.map((doc: any) => path.resolve(doc.filePath)));

  let imported = 0;
  for (const filename of files) {
    const filePath = path.join(uploadDir, filename);
    if (!fs.statSync(filePath).isFile()) continue;
    if (existingPaths.has(path.resolve(filePath))) continue;
    const ext = path.extname(filename).toLowerCase();
    const mimetype =
      ext === '.png' ? 'image/png' :
      ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
      ext === '.pdf' ? 'application/pdf' : 'application/octet-stream';
    const stats = fs.statSync(filePath);
    const documentData = {
      title: filename,
      originalName: filename,
      fileType: mimetype,
      fileSize: stats.size,
      filePath,
      extractedText: null,
      structuredText: null,
      categories: [],
      tags: [],
      processingStatus: 'pending',
    };
    const validatedData = insertDocumentSchema.parse(documentData);
    await storage.createDocument(validatedData);
    imported++;
    console.log('Imported:', filename);
  }
  console.log(`Imported ${imported} new documents.`);
}

importUploads().catch(console.error);

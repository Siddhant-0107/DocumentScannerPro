import { Router } from 'express';
import { DocumentService } from '../services/documentService';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Validation schemas
const documentSchema = z.object({
  title: z.string().min(1).optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  processingStatus: z.string().optional(),
  extractedText: z.string().optional(),
  processedDate: z.string().optional(),
});

// Create document with file upload
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const data = documentSchema.parse(req.body);
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Convert processedDate from string to Date if present, otherwise remove
    if (typeof data.processedDate === 'string') {
      const dateObj = new Date(data.processedDate);
      if (!isNaN(dateObj.getTime())) {
        data.processedDate = dateObj;
      } else {
        delete data.processedDate;
      }
    }
    if (data.processedDate && Object.prototype.toString.call(data.processedDate) !== '[object Date]') {
      delete data.processedDate;
    }
    if (typeof data.title !== 'string' || !data.title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    // Only include processedDate if it is a Date
    const createData = { ...data };
    if (createData.processedDate && Object.prototype.toString.call(createData.processedDate) !== '[object Date]') {
      delete createData.processedDate;
    }
    const document = await DocumentService.createDocument({
      ...createData,
      originalName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      filePath: file.path,
      processingStatus: 'pending'
    });

    res.status(201).json(document);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error("File Upload Error:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get all documents
router.get('/', async (req, res) => {
  try {
    const documents = await DocumentService.getAllDocuments();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get document by ID
router.get('/:id', async (req, res) => {
  try {
    const document = await DocumentService.getDocumentById(Number(req.params.id));
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update document
router.patch('/:id', async (req, res) => {
  try {
    const data = documentSchema.partial().parse(req.body);
    // Convert processedDate from string to Date if present, otherwise remove
    if (typeof data.processedDate === 'string') {
      const dateObj = new Date(data.processedDate);
      if (!isNaN(dateObj.getTime())) {
        data.processedDate = dateObj;
      } else {
        delete data.processedDate;
      }
    }
    if (data.processedDate && Object.prototype.toString.call(data.processedDate) !== '[object Date]') {
      delete data.processedDate;
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    // Only include processedDate if it is a Date
    const updateData = { ...data };
    if (updateData.processedDate && Object.prototype.toString.call(updateData.processedDate) !== '[object Date]') {
      delete updateData.processedDate;
    }
    const document = await DocumentService.updateDocument(Number(req.params.id), updateData);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error("Document Update Error:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    const document = await DocumentService.deleteDocument(Number(req.params.id));
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const searchSchema = z.object({
  query: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

// Search and filter documents
router.post('/search', async (req, res) => {
  try {
    const { query, categories, tags } = searchSchema.parse(req.body);
    let documents;

    if (query) {
      documents = await DocumentService.searchDocuments(query);
    } else if (categories) {
      documents = await DocumentService.filterByCategories(categories);
    } else if (tags) {
      documents = await DocumentService.filterByTags(tags);
    } else {
      documents = await DocumentService.getAllDocuments();
    }
    
    res.json(documents);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error("Search Error:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router; 
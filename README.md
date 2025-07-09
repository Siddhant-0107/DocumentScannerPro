# 📄 Document Scanner Pro

A modern, full-stack document scanning and management application built with React, TypeScript, Express.js, and PostgreSQL. Upload documents, extract text using OCR, categorize files, and analyze your document collection with powerful analytics.

![Document Scanner Pro](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg)

## ✨ Features

### 🚀 Core Functionality
- **Document Upload** - Support for PNG, JPG, and PDF files up to 10MB
- **OCR Text Extraction** - Powered by Tesseract.js for accurate text recognition
- **Real-time Processing** - Live status updates during document processing
- **Document Management** - Organize, search, and categorize your documents
- **Analytics Dashboard** - Visualize document statistics and insights

### 🎯 Advanced Features
- **Smart Categorization** - Auto-categorize documents (Invoices, Receipts, Contracts, Reports)
- **Full-text Search** - Search across document content, titles, and tags
- **Bulk Operations** - Manage multiple documents simultaneously
- **Responsive Design** - Works seamlessly across desktop and mobile devices

### 🔧 Technical Features
- **PostgreSQL Database** - Persistent storage with ACID compliance
- **Background Worker** - Asynchronous document processing queue
- **API-first Architecture** - RESTful API with proper error handling
- **Type Safety** - Full TypeScript implementation with Zod validation
- **Modern UI** - Built with Radix UI and Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - Modern UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Headless UI components
- **Framer Motion** - Smooth animations
- **Recharts** - Interactive charts for analytics
- **React Query** - Server state management

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server development
- **PostgreSQL** - Relational database
- **Multer** - File upload middleware
- **Zod** - Schema validation

### Processing & Storage
- **Tesseract.js** - OCR text extraction
- **PDF.js** - PDF parsing and processing
- **pg** - PostgreSQL client for Node.js

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/document-scanner-pro.git
   cd document-scanner-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**
   ```bash
   createdb docscanpro
   ```

4. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/docscanpro
   PORT=5000
   NODE_ENV=development
   ```

5. **Initialize the database**
   ```bash
   npm run setup-db
   ```

6. **Start the application**
   ```bash
   npm run start:all
   ```

   This command starts:
   - Backend API server (Port 5000)
   - Frontend development server (Port 5173)
   - Document processing worker

7. **Open your browser**
   Navigate to `http://localhost:5000`

## 📁 Project Structure

```
document-scanner-pro/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── lib/           # Utilities and configurations
│   │   └── types/         # TypeScript type definitions
├── server/                # Backend Express.js application
│   ├── routes.ts          # API routes
│   ├── pg-storage.ts      # Database operations
│   ├── server/            # Background services
│   │   └── document-worker.ts  # Document processing worker
│   └── index.ts          # Server entry point
├── shared/               # Shared types and schemas
│   └── schema.ts         # Zod validation schemas
├── uploads/              # Document storage directory
└── package.json          # Project dependencies and scripts
```

## 🔄 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start backend server only |
| `npm run frontend` | Start frontend development server |
| `npm run worker` | Start document processing worker |
| `npm run start:all` | Start all services simultaneously |

## 📖 API Documentation

### Documents API

#### Upload Documents
```http
POST /api/documents/upload
Content-Type: multipart/form-data

files: File[]
```

#### Get All Documents
```http
GET /api/documents
```

#### Get Document by ID
```http
GET /api/documents/:id
```

#### Update Document
```http
PATCH /api/documents/:id
Content-Type: application/json

{
  "title": "string",
  "categories": "string[]",
  "tags": "string[]"
}
```

### Categories API

#### Get All Categories
```http
GET /api/categories
```

## 🗄️ Database Schema

### Documents Table
- `id` - Primary key
- `title` - Document title
- `original_name` - Original filename
- `file_type` - MIME type
- `file_size` - File size in bytes
- `file_path` - Storage path
- `extracted_text` - OCR extracted text
- `categories` - JSON array of categories
- `tags` - JSON array of tags
- `processingStatus` - Processing status (pending/processing/completed/failed)
- `created_at` - Creation timestamp
- `processed_date` - Processing completion timestamp

### Categories Table
- `id` - Primary key
- `name` - Category name
- `color` - Display color (hex)
- `created_at` - Creation timestamp

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:12345@localhost:5432/docscanpro` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |

### File Upload Limits
- Maximum file size: 10MB
- Supported formats: PNG, JPG, JPEG, PDF
- Storage location: `./uploads/`

## 🚀 Deployment

### Production Build

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```bash
   export NODE_ENV=production
   export DATABASE_URL=your_production_db_url
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔮 Roadmap

- [ ] **Cloud Storage Integration** - AWS S3, Google Drive, Dropbox
- [ ] **Advanced OCR** - Support for handwritten text
- [ ] **Document Templates** - Pre-defined document types
- [ ] **User Authentication** - Multi-user support
- [ ] **API Rate Limiting** - Enhanced security
- [ ] **Mobile App** - React Native implementation
- [ ] **Advanced Analytics** - ML-powered insights
- [ ] **Document Versioning** - Track document changes

## 🐛 Known Issues

- Large PDF files (>10MB) may take longer to process
- OCR accuracy depends on image quality
- Background worker requires manual restart after code changes

## 📞 Support

For support, please open an issue on GitHub or contact [siddhantdubey0107@gmail.com](mailto:siddhantdubey0107@gmail.com).

## 🙏 Acknowledgments

- [Tesseract.js](https://tesseract.projectnaptha.com/) for OCR capabilities
- [Radix UI](https://www.radix-ui.com/) for accessible UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities
- [PostgreSQL](https://www.postgresql.org/) for robust data storage

---

⭐ **Star this repository if you found it helpful!**

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Structured Text Feature...\n');

// Function to run commands and log output
function runCommand(command, description) {
  console.log(`📋 ${description}`);
  console.log(`⚡ Running: ${command}`);
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Success!\n');
    return output;
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
    return null;
  }
}

// Function to check if file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

async function setupStructuredText() {
  console.log('🔧 Structured Text Feature Setup Script');
  console.log('=====================================\n');

  // 1. Add database column (if not already done)
  if (fileExists('add-structured-text-column.cjs')) {
    console.log('📊 Setting up database schema...');
    runCommand('node add-structured-text-column.cjs', 'Adding structured_text column to database');
  } else {
    console.log('⚠️  Database setup script not found, skipping...\n');
  }

  // 2. Install any missing dependencies
  console.log('📦 Checking dependencies...');
  runCommand('npm install', 'Installing/updating dependencies');

  // 3. Build TypeScript files
  console.log('🔨 Building TypeScript files...');
  runCommand('npx tsc --noEmit', 'Type checking TypeScript files');

  // 4. Test individual services
  console.log('🧪 Testing services individually...\n');

  console.log('1️⃣ Testing document worker...');
  console.log('   This will process any pending documents with structured text extraction.');
  console.log('   Press Ctrl+C after a few seconds to stop the worker.\n');
  
  console.log('   To run: npm run worker');
  console.log('   Or manually: tsx server/server/document-worker.ts\n');

  console.log('2️⃣ Testing backend server...');
  console.log('   This will start the API server with structured text endpoints.');
  console.log('   Press Ctrl+C to stop the server.\n');
  
  console.log('   To run: npm run dev');
  console.log('   Or manually: tsx server/index.ts\n');

  console.log('3️⃣ Testing frontend...');
  console.log('   This will start the React frontend with structured text UI.');
  console.log('   Press Ctrl+C to stop the frontend.\n');
  
  console.log('   To run: npm run frontend');
  console.log('   Or manually: vite\n');

  console.log('4️⃣ Running all services together...');
  console.log('   This will start backend, frontend, and worker simultaneously.');
  console.log('   Press Ctrl+C to stop all services.\n');
  
  console.log('   To run: npm run start:all\n');

  // 5. Verify file structure
  console.log('📁 Verifying file structure...\n');
  
  const requiredFiles = [
    'server/text-processor.ts',
    'server/server/document-worker.ts',
    'client/src/components/structured-text-view.tsx',
    'client/src/components/advanced-search.tsx',
    'shared/schema.ts',
    'server/pg-storage.ts',
    'server/routes.ts'
  ];

  requiredFiles.forEach(file => {
    if (fileExists(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MISSING!`);
    }
  });

  console.log('\n🎯 Next Steps:');
  console.log('===============');
  console.log('1. Run: npm run start:all');
  console.log('2. Open: http://localhost:5000');
  console.log('3. Upload a new document to test structured text extraction');
  console.log('4. Check document preview to see structured data');
  console.log('5. Use advanced search to filter by document types and entities\n');

  console.log('🔍 Testing Commands:');
  console.log('====================');
  console.log('• Test worker only:    npm run worker');
  console.log('• Test backend only:   npm run dev');
  console.log('• Test frontend only:  npm run frontend');
  console.log('• Test all services:   npm run start:all');
  console.log('• Check database:      node check-latest-docs.cjs');
  console.log('• Check file paths:    node check-filepaths.js\n');

  console.log('📊 Database Queries to Test:');
  console.log('=============================');
  console.log('• GET /api/documents - List all documents with structured text');
  console.log('• GET /api/documents/search?documentType=invoice - Filter by type');
  console.log('• GET /api/documents/search?hasEmails=true - Filter by entities');
  console.log('• GET /api/documents/search?minConfidence=0.8 - Filter by confidence\n');

  console.log('🎉 Setup Complete!');
  console.log('==================');
  console.log('Your Document Scanner Pro now has structured text analysis capabilities!');
  console.log('The system will automatically:');
  console.log('• Extract text using OCR');
  console.log('• Identify document types (invoice, receipt, contract, etc.)');
  console.log('• Extract entities (emails, phones, dates, amounts)');
  console.log('• Structure content into sections');
  console.log('• Provide confidence scores');
  console.log('• Enable advanced search and filtering\n');
}

// Run the setup
setupStructuredText().catch(console.error);

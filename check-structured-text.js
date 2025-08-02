import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgres://postgres:12345@localhost:5432/docscanpro',
});

async function checkStructuredText(documentId = null) {
  const client = await pool.connect();
  
  try {
    let result;
    
    if (documentId) {
      // Check specific document
      result = await client.query(`
        SELECT id, title, status, extracted_text, structured_text, file_path, original_name, file_type, upload_date
        FROM documents 
        WHERE id = $1
      `, [documentId]);
    } else {
      // Get the latest document with structured text, or just the latest document
      result = await client.query(`
        SELECT id, title, status, extracted_text, structured_text, file_path, original_name, file_type, upload_date
        FROM documents 
        ORDER BY 
          CASE WHEN structured_text IS NOT NULL THEN 1 ELSE 2 END,
          upload_date DESC
        LIMIT 1
      `);
    }
    
    if (result.rows.length === 0) {
      console.log(documentId ? 
        `Document with ID ${documentId} not found` : 
        'No documents found in database');
      return;
    }
    
    const doc = result.rows[0];
    
    console.log('='.repeat(60));
    console.log('DOCUMENT STRUCTURED TEXT ANALYSIS');
    console.log('='.repeat(60));
    console.log('Document ID:', doc.id);
    console.log('Title:', doc.title);
    console.log('Status:', doc.status);
    console.log('File Type:', doc.file_type);
    console.log('File Path:', doc.file_path);
    console.log('Original Name:', doc.original_name);
    console.log('Upload Date:', doc.upload_date);
    console.log('Has extracted text:', !!doc.extracted_text);
    console.log('Has structured text:', !!doc.structured_text);
    
    if (doc.structured_text) {
      const structuredText = doc.structured_text;
      
      console.log('\n' + '-'.repeat(40));
      console.log('STRUCTURED TEXT ANALYSIS');
      console.log('-'.repeat(40));
      console.log('Document Type:', structuredText.documentType || 'Unknown');
      console.log('Confidence Score:', structuredText.confidence || 'N/A');
      
      if (structuredText.metadata) {
        console.log('\nMetadata:');
        console.log('- Word Count:', structuredText.metadata.wordCount || 0);
        console.log('- Line Count:', structuredText.metadata.lineCount || 0);
        console.log('- Character Count:', structuredText.metadata.charCount || 0);
        console.log('- Has Table:', structuredText.metadata.hasTable || false);
        console.log('- Language:', structuredText.metadata.language || 'Unknown');
        console.log('- Processing Date:', structuredText.metadata.processedAt || 'N/A');
      }
      
      if (structuredText.entities) {
        console.log('\n' + '-'.repeat(30));
        console.log('EXTRACTED ENTITIES');
        console.log('-'.repeat(30));
        const entities = structuredText.entities;
        
        console.log('Entity Counts:');
        console.log('- Emails:', entities.emails?.length || 0);
        console.log('- Phone Numbers:', entities.phones?.length || 0);
        console.log('- Dates:', entities.dates?.length || 0);
        console.log('- Monetary Amounts:', entities.amounts?.length || 0);
        console.log('- Person Names:', entities.names?.length || 0);
        console.log('- Addresses:', entities.addresses?.length || 0);
        
        // Show samples of found entities
        if (entities.emails && entities.emails.length > 0) {
          console.log('\nSample Emails:');
          entities.emails.slice(0, 3).forEach((email, i) => {
            console.log(`  ${i + 1}. ${email}`);
          });
        }
        
        if (entities.phones && entities.phones.length > 0) {
          console.log('\nSample Phone Numbers:');
          entities.phones.slice(0, 3).forEach((phone, i) => {
            console.log(`  ${i + 1}. ${phone}`);
          });
        }
        
        if (entities.dates && entities.dates.length > 0) {
          console.log('\nSample Dates:');
          entities.dates.slice(0, 3).forEach((date, i) => {
            console.log(`  ${i + 1}. ${date}`);
          });
        }
        
        if (entities.amounts && entities.amounts.length > 0) {
          console.log('\nSample Amounts:');
          entities.amounts.slice(0, 3).forEach((amount, i) => {
            console.log(`  ${i + 1}. ${amount}`);
          });
        }
        
        if (entities.names && entities.names.length > 0) {
          console.log('\nSample Names:');
          entities.names.slice(0, 3).forEach((name, i) => {
            console.log(`  ${i + 1}. ${name}`);
          });
        }
        
        if (entities.addresses && entities.addresses.length > 0) {
          console.log('\nSample Addresses:');
          entities.addresses.slice(0, 2).forEach((address, i) => {
            console.log(`  ${i + 1}. ${address}`);
          });
        }
      }
      
      if (structuredText.sections) {
        console.log('\n' + '-'.repeat(30));
        console.log('DOCUMENT SECTIONS');
        console.log('-'.repeat(30));
        const sections = structuredText.sections;
        
        console.log('Title:', sections.title || 'None detected');
        console.log('Header lines:', sections.header?.length || 0);
        console.log('Body lines:', sections.body?.length || 0);
        console.log('Footer lines:', sections.footer?.length || 0);
        
        if (sections.header && sections.header.length > 0) {
          console.log('\nHeader (first 3 lines):');
          sections.header.slice(0, 3).forEach((line, i) => {
            console.log(`  ${i + 1}. ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
          });
        }
        
        if (sections.body && sections.body.length > 0) {
          console.log('\nBody (first 3 lines):');
          sections.body.slice(0, 3).forEach((line, i) => {
            console.log(`  ${i + 1}. ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
          });
        }
        
        if (sections.footer && sections.footer.length > 0) {
          console.log('\nFooter:');
          sections.footer.forEach((line, i) => {
            console.log(`  ${i + 1}. ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
          });
        }
      }
      
      // Show a sample of the processed text
      if (structuredText.processedText) {
        console.log('\n' + '-'.repeat(30));
        console.log('PROCESSED TEXT SAMPLE');
        console.log('-'.repeat(30));
        const sample = structuredText.processedText.substring(0, 300);
        console.log(sample + (structuredText.processedText.length > 300 ? '...' : ''));
        console.log(`\nTotal processed text length: ${structuredText.processedText.length} characters`);
      }
      
      // Show some raw extracted text for comparison
      if (doc.extracted_text) {
        console.log('\n' + '-'.repeat(30));
        console.log('RAW EXTRACTED TEXT SAMPLE');
        console.log('-'.repeat(30));
        const rawSample = doc.extracted_text.substring(0, 300);
        console.log(rawSample + (doc.extracted_text.length > 300 ? '...' : ''));
        console.log(`\nTotal raw text length: ${doc.extracted_text.length} characters`);
      }
    } else {
      console.log('\n❌ No structured text found for this document');
      console.log('This could mean:');
      console.log('- Document processing is still in progress');
      console.log('- OCR failed to extract text');
      console.log('- Document worker hasn\'t processed this document yet');
      
      // If no structured text, show basic info
      if (doc.extracted_text) {
        console.log('\n📄 Raw extracted text available:');
        console.log('Length:', doc.extracted_text.length, 'characters');
        const sample = doc.extracted_text.substring(0, 200);
        console.log('Sample:', sample + (doc.extracted_text.length > 200 ? '...' : ''));
      }
    }
    
    // Also check if there are other documents with structured text
    const countResult = await client.query(`
      SELECT 
        COUNT(*) as total_docs,
        COUNT(CASE WHEN extracted_text IS NOT NULL THEN 1 END) as with_text,
        COUNT(CASE WHEN structured_text IS NOT NULL THEN 1 END) as with_structured_text,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM documents
    `);
    
    const stats = countResult.rows[0];
    console.log('\n' + '='.repeat(40));
    console.log('DATABASE STATISTICS');
    console.log('='.repeat(40));
    console.log('Total documents:', stats.total_docs);
    console.log('With extracted text:', stats.with_text);
    console.log('With structured text:', stats.with_structured_text);
    console.log('Status breakdown:');
    console.log('- Completed:', stats.completed);
    console.log('- Processing:', stats.processing);
    console.log('- Failed:', stats.failed);
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

// Check command line arguments
const documentId = process.argv[2] ? parseInt(process.argv[2]) : null;

if (process.argv[2] && isNaN(documentId)) {
  console.error('❌ Document ID must be a number');
  console.log('Usage: node check-structured-text.js [documentId]');
  console.log('Example: node check-structured-text.js 33');
  console.log('Or run without arguments to check the latest document with structured text');
  process.exit(1);
}

console.log('🔍 Checking structured text analysis...');
if (documentId) {
  console.log(`📄 Looking for document ID: ${documentId}`);
} else {
  console.log('📄 Looking for latest document with structured text...');
}

checkStructuredText(documentId).catch(console.error);

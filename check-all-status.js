import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgres://postgres:12345@localhost:5432/docscanpro',
});

async function checkAllStatuses() {
  try {
    const client = await pool.connect();
    
    // Get all documents, especially any with pending or failed status
    const result = await client.query(`
      SELECT id, title, "processingStatus", extracted_text, file_path, created_at
      FROM documents 
      ORDER BY id DESC 
      LIMIT 15
    `);
    
    console.log('All recent documents:');
    result.rows.forEach(doc => {
      console.log(`ID: ${doc.id}`);
      console.log(`  Title: ${doc.title}`);
      console.log(`  Status: '${doc.processingStatus}'`);
      console.log(`  File Path: ${doc.file_path}`);
      console.log(`  Extracted text: ${doc.extracted_text ? 'YES' : 'NO'}`);
      console.log(`  Created: ${doc.created_at}`);
      console.log('---');
    });
    
    // Check specifically for pending/failed documents
    const pendingResult = await client.query(`
      SELECT id, title, "processingStatus" 
      FROM documents 
      WHERE "processingStatus" IN ('pending', 'failed')
      ORDER BY id DESC
    `);
    
    console.log(`\nDocuments with pending/failed status: ${pendingResult.rows.length}`);
    pendingResult.rows.forEach(doc => {
      console.log(`  ID: ${doc.id}, Title: ${doc.title}, Status: ${doc.processingStatus}`);
    });
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAllStatuses();

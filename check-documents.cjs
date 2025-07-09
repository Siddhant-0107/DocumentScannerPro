const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:12345@localhost:5432/docscanpro'
});

async function checkDocuments() {
  try {
    console.log('Checking document statuses...');
    
    // Get all documents with their processing status
    const result = await pool.query(
      'SELECT id, title, "processingStatus", extracted_text, created_at FROM documents ORDER BY id'
    );
    
    console.log(`\nFound ${result.rows.length} documents:\n`);
    
    result.rows.forEach(row => {
      const hasText = row.extracted_text && row.extracted_text.trim() !== '';
      console.log(`ID: ${row.id}`);
      console.log(`  Title: ${row.title}`);
      console.log(`  Status: ${row.processingStatus}`);
      console.log(`  ExtractedText: ${hasText ? 'YES' : 'NO'}`);
      console.log(`  Created: ${row.created_at}`);
      console.log('');
    });
    
    // Summary
    const pendingCount = result.rows.filter(r => r.processingStatus === 'pending').length;
    const completedCount = result.rows.filter(r => r.processingStatus === 'completed').length;
    const failedCount = result.rows.filter(r => r.processingStatus === 'failed').length;
    
    console.log('SUMMARY:');
    console.log(`  Total: ${result.rows.length}`);
    console.log(`  Pending: ${pendingCount}`);
    console.log(`  Completed: ${completedCount}`);
    console.log(`  Failed: ${failedCount}`);
    
  } catch (error) {
    console.error('Error checking documents:', error);
  } finally {
    await pool.end();
  }
}

checkDocuments();

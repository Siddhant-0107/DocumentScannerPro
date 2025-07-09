const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:12345@localhost:5432/docscanpro'
});

async function checkLatestDocuments() {
  try {
    console.log('Checking latest documents after upload...');
    
    // Get all documents ordered by creation time
    const result = await pool.query(
      'SELECT id, title, "processingStatus", extracted_text, created_at FROM documents ORDER BY created_at DESC LIMIT 10'
    );
    
    console.log(`\nLatest ${result.rows.length} documents (newest first):\n`);
    
    result.rows.forEach((row, index) => {
      const hasText = row.extracted_text && row.extracted_text.trim() !== '';
      console.log(`${index + 1}. ID: ${row.id}`);
      console.log(`   Title: ${row.title}`);
      console.log(`   Status: ${row.processingStatus}`);
      console.log(`   ExtractedText: ${hasText ? 'YES' : 'NO'}`);
      console.log(`   Created: ${row.created_at}`);
      console.log('');
    });
    
    // Count by status
    const statusResult = await pool.query(
      'SELECT "processingStatus", COUNT(*) as count FROM documents GROUP BY "processingStatus"'
    );
    
    console.log('Status breakdown:');
    statusResult.rows.forEach(row => {
      console.log(`  ${row.processingStatus}: ${row.count}`);
    });
    
    // Check if there are any pending documents
    const pendingResult = await pool.query(
      'SELECT id, title, "processingStatus" FROM documents WHERE "processingStatus" = \'pending\''
    );
    
    console.log(`\nPending documents: ${pendingResult.rows.length}`);
    pendingResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Title: ${row.title}, Status: ${row.processingStatus}`);
    });
    
  } catch (error) {
    console.error('Error checking documents:', error);
  } finally {
    await pool.end();
  }
}

checkLatestDocuments();

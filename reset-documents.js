import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgres://postgres:12345@localhost:5432/docscanpro',
});

async function resetDocuments() {
  try {
    const client = await pool.connect();
    
    // Reset a few recent documents to 'pending' status for testing
    const result = await client.query(`
      UPDATE documents 
      SET "processingStatus" = 'pending', extracted_text = NULL 
      WHERE id IN (
        SELECT id FROM documents 
        ORDER BY id DESC 
        LIMIT 3
      ) 
      RETURNING id, title, "processingStatus"
    `);
    
    console.log('Reset documents to pending status:');
    result.rows.forEach(doc => {
      console.log(`  ID: ${doc.id}, Title: ${doc.title}, Status: ${doc.processingStatus}`);
    });
    
    client.release();
    await pool.end();
    
    console.log('\n✓ Ready for worker testing! Run the worker to process these documents.');
  } catch (error) {
    console.error('Error:', error);
  }
}

resetDocuments();

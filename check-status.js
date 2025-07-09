import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgres://postgres:12345@localhost:5432/docscanpro',
});

async function checkStatus() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT id, title, "processingStatus", extracted_text FROM documents ORDER BY id DESC LIMIT 10');
    
    console.log('Recent documents with full status:');
    result.rows.forEach(doc => {
      console.log(`ID: ${doc.id}, Title: ${doc.title}`);
      console.log(`  Status: '${doc.processingStatus}'`);
      console.log(`  Extracted text: ${doc.extracted_text ? 'YES' : 'NO'}`);
      console.log('---');
    });
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStatus();

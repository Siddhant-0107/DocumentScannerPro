import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgres://postgres:12345@localhost:5432/docscanpro',
});

async function checkFilePaths() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT id, title, file_path, original_name FROM documents ORDER BY id DESC LIMIT 5');
    
    console.log('Recent documents file paths:');
    result.rows.forEach(doc => {
      console.log(`ID: ${doc.id}`);
      console.log(`  Title: ${doc.title}`);
      console.log(`  Original Name: ${doc.original_name}`);
      console.log(`  File Path: ${doc.file_path}`);
      console.log('---');
    });
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkFilePaths();

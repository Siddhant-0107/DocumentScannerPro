// Simple test to verify categories functionality 
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:12345@localhost:5432/docscanpro',
});

async function testQuick() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Check categories table
    const categories = await client.query('SELECT COUNT(*) FROM categories');
    console.log(`✅ Categories table has ${categories.rows[0].count} entries`);
    
    // Check documents table  
    const documents = await client.query('SELECT COUNT(*) FROM documents');
    console.log(`✅ Documents table has ${documents.rows[0].count} entries`);
    
    // Test a simple category insert and document with categories
    const testResult = await client.query(`
      INSERT INTO documents (title, original_name, file_type, file_size, file_path, categories, tags, "processingStatus") 
      VALUES ('Test Doc', 'test.txt', 'text/plain', 100, '/test', ARRAY['test-cat'], ARRAY['tag1'], 'completed') 
      RETURNING id, categories
    `);
    
    console.log('✅ Test document created with categories:', testResult.rows[0]);
    
    // Clean up
    await client.query('DELETE FROM documents WHERE title = $1', ['Test Doc']);
    console.log('✅ Test document cleaned up');
    
    client.release();
    console.log('🎉 Categories functionality is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testQuick();

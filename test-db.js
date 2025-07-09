import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:12345@localhost:5432/docscanpro',
});

async function testDb() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✓ Database connected successfully');
    
    // Check if documents table exists
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'documents'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Documents table columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    // Check current documents
    const docsResult = await client.query('SELECT id, title, "processingStatus" FROM documents LIMIT 5');
    console.log(`\n📄 Sample documents (${docsResult.rows.length} shown):`);
    docsResult.rows.forEach(doc => {
      console.log(`  ID: ${doc.id}, Title: ${doc.title}, Status: ${doc.processingStatus}`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await pool.end();
  }
}

testDb();

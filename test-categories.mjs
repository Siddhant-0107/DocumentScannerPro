import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:12345@localhost:5432/docscanpro',
});

async function testCategories() {
  try {
    console.log('Testing categories functionality...');
    
    // Test document creation with categories array
    const testCategories = ['business', 'contracts'];
    const testTags = ['test', 'sample'];
    
    console.log('Creating document with categories:', testCategories);
    
    const res = await pool.query(
      `INSERT INTO documents (title, original_name, file_type, file_size, file_path, extracted_text, categories, tags, "processingStatus", created_at, processed_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NULL) RETURNING *`,
      [
        'Test Document with Categories',
        'test.txt',
        'text/plain',
        100,
        '/uploads/test.txt',
        'This is a test document',
        testCategories,
        testTags,
        'completed'
      ]
    );
    
    const created = res.rows[0];
    console.log('✅ Created document:', created.id, 'with categories:', created.categories);
    
    // Test document retrieval
    const retrieveRes = await pool.query('SELECT * FROM documents WHERE id = $1', [created.id]);
    const retrieved = retrieveRes.rows[0];
    console.log('✅ Retrieved document categories:', retrieved.categories);
    
    // Test document update
    const updateRes = await pool.query(
      'UPDATE documents SET categories = $1 WHERE id = $2 RETURNING *',
      [['updated', 'new-category'], created.id]
    );
    const updated = updateRes.rows[0];
    console.log('✅ Updated document categories:', updated.categories);
    
    // Clean up
    await pool.query('DELETE FROM documents WHERE id = $1', [created.id]);
    console.log('✅ Test completed successfully! Categories are working with text[] arrays.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  await pool.end();
  process.exit();
}

testCategories();

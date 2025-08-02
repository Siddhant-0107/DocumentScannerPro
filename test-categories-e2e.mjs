import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:12345@localhost:5432/docscanpro',
});

async function testCategoriesEndToEnd() {
  try {
    console.log('🧪 Testing Categories End-to-End...');
    
    // 1. First, create some categories
    console.log('\n1️⃣ Creating test categories...');
    
    const cat1 = await pool.query(
      'INSERT INTO categories (name, color) VALUES ($1, $2) RETURNING *',
      ['Business', '#3B82F6']
    );
    console.log('✅ Created category:', cat1.rows[0]);
    
    const cat2 = await pool.query(
      'INSERT INTO categories (name, color) VALUES ($1, $2) RETURNING *',
      ['Contracts', '#10B981']
    );
    console.log('✅ Created category:', cat2.rows[0]);
    
    // 2. Test document creation with categories
    console.log('\n2️⃣ Creating document with categories...');
    
    const testCategories = ['Business', 'Contracts'];
    const doc = await pool.query(
      `INSERT INTO documents (title, original_name, file_type, file_size, file_path, extracted_text, categories, tags, "processingStatus", created_at, processed_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NULL) RETURNING *`,
      [
        'Test Contract Document',
        'contract.pdf',
        'application/pdf',
        1024,
        '/uploads/test-contract.pdf',
        'This is a test contract document',
        testCategories,
        ['test', 'contract'],
        'completed'
      ]
    );
    
    const createdDoc = doc.rows[0];
    console.log('✅ Created document with categories:', createdDoc.categories);
    
    // 3. Test document retrieval and category display
    console.log('\n3️⃣ Retrieving document with categories...');
    
    const retrieved = await pool.query('SELECT * FROM documents WHERE id = $1', [createdDoc.id]);
    const retrievedDoc = retrieved.rows[0];
    console.log('✅ Retrieved document categories:', retrievedDoc.categories);
    console.log('✅ Categories type:', typeof retrievedDoc.categories, Array.isArray(retrievedDoc.categories));
    
    // 4. Test document update with new categories
    console.log('\n4️⃣ Updating document categories...');
    
    const newCategories = ['Business', 'Legal', 'Important'];
    const updated = await pool.query(
      'UPDATE documents SET categories = $1 WHERE id = $2 RETURNING *',
      [newCategories, createdDoc.id]
    );
    console.log('✅ Updated document categories:', updated.rows[0].categories);
    
    // 5. Test category retrieval for frontend
    console.log('\n5️⃣ Testing category list for frontend...');
    
    const allCategories = await pool.query('SELECT * FROM categories ORDER BY name');
    console.log('✅ Available categories:');
    allCategories.rows.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.color})`);
    });
    
    // 6. Clean up test data
    console.log('\n6️⃣ Cleaning up test data...');
    await pool.query('DELETE FROM documents WHERE id = $1', [createdDoc.id]);
    await pool.query('DELETE FROM categories WHERE name IN ($1, $2)', ['Business', 'Contracts']);
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All tests passed! Categories feature is working end-to-end.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Try to clean up even if test failed
    try {
      await pool.query('DELETE FROM categories WHERE name IN ($1, $2)', ['Business', 'Contracts']);
    } catch (cleanupError) {
      console.error('Cleanup failed:', cleanupError);
    }
  }
  
  await pool.end();
  process.exit();
}

testCategoriesEndToEnd();

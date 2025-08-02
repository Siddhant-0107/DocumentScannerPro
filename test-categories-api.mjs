import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:12345@localhost:5432/docscanpro',
});

async function testCategoriesAPI() {
  try {
    console.log('🧪 Testing Categories API...');
    
    // Test the new query that the API uses
    const res = await pool.query(`
      SELECT 
        c.*,
        COUNT(d.id) as document_count
      FROM categories c
      LEFT JOIN documents d ON d.categories && ARRAY[c.name]
      GROUP BY c.id, c.name, c.color
      ORDER BY c.name
    `);
    
    console.log(`✅ Found ${res.rows.length} categories:`);
    res.rows.forEach(row => {
      console.log(`   - ${row.name} (${row.color}) - ${row.document_count} documents`);
    });
    
    // Also test documents with categories
    const docRes = await pool.query('SELECT title, categories FROM documents WHERE categories IS NOT NULL AND array_length(categories, 1) > 0 LIMIT 5');
    console.log(`\n📄 Sample documents with categories (${docRes.rows.length}):`);
    docRes.rows.forEach(doc => {
      console.log(`   - "${doc.title}" -> [${doc.categories.join(', ')}]`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testCategoriesAPI();

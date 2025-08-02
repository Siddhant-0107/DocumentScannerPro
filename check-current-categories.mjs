import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:12345@localhost:5432/docscanpro',
});

async function checkCurrentCategories() {
  try {
    console.log('📋 Checking current categories in database...');
    
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    console.log(`Found ${result.rows.length} categories:`);
    
    result.rows.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat.id}, Color: ${cat.color}, Docs: ${cat.document_count || 0})`);
    });
    
    // Also check documents with categories
    console.log('\n📄 Checking documents with categories...');
    const docs = await pool.query('SELECT id, title, categories FROM documents WHERE categories IS NOT NULL AND array_length(categories, 1) > 0 LIMIT 5');
    
    if (docs.rows.length > 0) {
      console.log(`Found ${docs.rows.length} documents with categories:`);
      docs.rows.forEach((doc, index) => {
        console.log(`${index + 1}. "${doc.title}" - Categories: [${doc.categories.join(', ')}]`);
      });
    } else {
      console.log('No documents with categories found');
    }
    
  } catch (error) {
    console.error('❌ Error checking categories:', error);
  }
  
  await pool.end();
  process.exit();
}

checkCurrentCategories();

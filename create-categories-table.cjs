const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:12345@localhost:5432/docscanpro'
});

async function createCategoriesTable() {
  try {
    console.log('Creating categories table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#3B82F6',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await pool.query(createTableSQL);
    console.log('✅ Categories table created successfully!');
    
    // Insert some default categories
    const defaultCategories = [
      { name: 'Invoices', color: '#EF4444' },
      { name: 'Receipts', color: '#10B981' },
      { name: 'Contracts', color: '#8B5CF6' },
      { name: 'Reports', color: '#F59E0B' }
    ];
    
    console.log('Adding default categories...');
    for (const cat of defaultCategories) {
      try {
        await pool.query(
          'INSERT INTO categories (name, color) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
          [cat.name, cat.color]
        );
        console.log(`  ✅ Added category: ${cat.name}`);
      } catch (e) {
        console.log(`  ⚠️ Category ${cat.name} already exists`);
      }
    }
    
    // Check what we have
    const result = await pool.query('SELECT * FROM categories ORDER BY id');
    console.log('\nCategories in database:');
    result.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Color: ${row.color}`);
    });
    
  } catch (error) {
    console.error('Error creating categories table:', error);
  } finally {
    await pool.end();
  }
}

createCategoriesTable();

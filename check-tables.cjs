const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:12345@localhost:5432/docscanpro'
});

async function checkTables() {
  try {
    console.log('Checking database tables...');
    
    // Check what tables exist
    const tablesResult = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    console.log('Tables found:', tablesResult.rows.map(r => r.table_name));
    
    // Check documents table structure
    const documentsColumns = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'documents'"
    );
    
    console.log('\nDocuments table columns:');
    documentsColumns.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    // Check categories table structure (if it exists)
    const categoriesColumns = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'categories'"
    );
    
    if (categoriesColumns.rows.length > 0) {
      console.log('\nCategories table columns:');
      categoriesColumns.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('\nCategories table does not exist!');
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await pool.end();
  }
}

checkTables();

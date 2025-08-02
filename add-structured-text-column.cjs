const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:12345@localhost:5432/docscanpro'
});

async function addStructuredTextColumn() {
  try {
    console.log('Adding structured_text column...');
    
    // Check if column exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'documents' AND column_name = 'structured_text'
    `);
    
    if (checkColumn.rows.length === 0) {
      // Add the column
      await pool.query('ALTER TABLE documents ADD COLUMN structured_text JSONB');
      console.log('✅ Added structured_text column');
      
      // Create indexes
      await pool.query('CREATE INDEX IF NOT EXISTS idx_documents_structured_text ON documents USING GIN (structured_text)');
      console.log('✅ Created GIN index for structured_text');
      
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_documents_doc_type ON documents ((structured_text->>'documentType'))`);
      console.log('✅ Created index for document type');
      
    } else {
      console.log('✅ structured_text column already exists');
    }
    
  } catch (error) {
    console.error('❌ Error adding structured_text column:', error);
  } finally {
    pool.end();
  }
}

addStructuredTextColumn();

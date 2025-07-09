const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:12345@localhost:5432/docscanpro'
});

async function testDocumentInsert() {
  try {
    console.log('Testing document insertion...');
    
    // Test inserting a document manually with the same structure as the upload route
    const testDoc = {
      title: 'Test Document',
      originalName: 'test.jpg',
      fileType: 'image/jpeg',
      fileSize: 12345,
      filePath: '/uploads/test.jpg',
      extractedText: null,
      categories: [],
      tags: [],
      processingStatus: 'pending'
    };
    
    const insertSQL = `
      INSERT INTO documents (title, original_name, file_type, file_size, file_path, extracted_text, categories, tags, "processingStatus", created_at, processed_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NULL) RETURNING *
    `;
    
    const values = [
      testDoc.title,
      testDoc.originalName,
      testDoc.fileType,
      testDoc.fileSize,
      testDoc.filePath,
      testDoc.extractedText,
      JSON.stringify(testDoc.categories),
      JSON.stringify(testDoc.tags),
      testDoc.processingStatus,
    ];
    
    console.log('SQL:', insertSQL);
    console.log('Values:', values);
    
    const result = await pool.query(insertSQL, values);
    console.log('✅ Successfully inserted test document:', result.rows[0]);
    
    // Clean up - delete the test document
    await pool.query('DELETE FROM documents WHERE id = $1', [result.rows[0].id]);
    console.log('✅ Cleaned up test document');
    
  } catch (error) {
    console.error('❌ Error testing document insert:', error);
  } finally {
    await pool.end();
  }
}

testDocumentInsert();

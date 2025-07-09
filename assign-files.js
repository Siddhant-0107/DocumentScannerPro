import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: 'postgres://postgres:12345@localhost:5432/docscanpro',
});

async function assignFilesToDocuments() {
  try {
    const client = await pool.connect();
    
    // Get documents with null file paths
    const docsResult = await client.query(`
      SELECT id, title, file_type 
      FROM documents 
      WHERE file_path IS NULL 
      ORDER BY id DESC 
      LIMIT 3
    `);
    
    console.log('Documents to fix:');
    docsResult.rows.forEach(doc => {
      console.log(`  ID: ${doc.id}, Title: ${doc.title}, Type: ${doc.file_type}`);
    });
    
    // Get list of recent files in uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const files = fs.readdirSync(uploadsDir)
      .filter(file => file.match(/^\d+/)) // Only files that start with timestamp
      .sort((a, b) => {
        const timeA = parseInt(a.split('-')[0]);
        const timeB = parseInt(b.split('-')[0]);
        return timeB - timeA; // Most recent first
      })
      .slice(0, 10); // Get top 10 most recent files
    
    console.log('\nRecent files in uploads:');
    files.forEach((file, index) => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  ${index + 1}. ${file} (${stats.size} bytes)`);
    });
    
    // Manually assign files to documents
    const assignments = [
      { docId: 29, file: files.find(f => f.includes('.png')) || files[0] },
      { docId: 28, file: files.find(f => f.includes('.jpg')) || files[1] },
      { docId: 27, file: files.find(f => f.includes('.pdf')) || files[2] }
    ];
    
    console.log('\nAssigning files to documents:');
    for (const assignment of assignments) {
      if (assignment.file) {
        const filePath = path.join('uploads', assignment.file);
        
        await client.query(`
          UPDATE documents 
          SET file_path = $1, original_name = $2 
          WHERE id = $3
        `, [filePath, assignment.file, assignment.docId]);
        
        console.log(`  ✓ Document ${assignment.docId} -> ${assignment.file}`);
      }
    }
    
    client.release();
    await pool.end();
    
    console.log('\n✓ Manual file assignment complete!');
    console.log('Now you can test the worker with: npm run worker');
  } catch (error) {
    console.error('Error:', error);
  }
}

assignFilesToDocuments();

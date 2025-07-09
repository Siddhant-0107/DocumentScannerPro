import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: 'postgres://postgres:12345@localhost:5432/docscanpro',
});

async function fixFilePaths() {
  try {
    const client = await pool.connect();
    
    // Get documents with null file paths
    const result = await client.query(`
      SELECT id, title, original_name, file_type 
      FROM documents 
      WHERE file_path IS NULL 
      ORDER BY id DESC
    `);
    
    console.log(`Found ${result.rows.length} documents with null file paths`);
    
    // Get list of files in uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const files = fs.readdirSync(uploadsDir);
    
    console.log(`Found ${files.length} files in uploads directory`);
    
    for (const doc of result.rows) {
      console.log(`\nProcessing document ID ${doc.id}: ${doc.title}`);
      
      // Try to find a matching file based on title or other criteria
      let matchedFile = null;
      
      // Look for files that might match this document
      const possibleMatches = files.filter(file => {
        const fileExt = path.extname(file).toLowerCase();
        const docTitle = doc.title.toLowerCase();
        
        // Check if file extension matches document type
        if (doc.file_type?.includes('pdf') && fileExt === '.pdf') return true;
        if (doc.file_type?.includes('image') && ['.jpg', '.jpeg', '.png'].includes(fileExt)) return true;
        
        // Also check if filename contains similar text
        return docTitle.includes(path.basename(file, fileExt).toLowerCase().slice(-10));
      });
      
      if (possibleMatches.length > 0) {
        // Use the most recent file (highest timestamp) as the match
        matchedFile = possibleMatches.sort().pop();
        const filePath = path.join('uploads', matchedFile);
        
        console.log(`  Found potential match: ${matchedFile}`);
        
        // Update the database with the file path
        await client.query(`
          UPDATE documents 
          SET file_path = $1, original_name = $2 
          WHERE id = $3
        `, [filePath, doc.title, doc.id]);
        
        console.log(`  ✓ Updated file path to: ${filePath}`);
      } else {
        console.log(`  ⚠️  No matching file found`);
      }
    }
    
    client.release();
    await pool.end();
    
    console.log('\n✓ File path fixing complete!');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixFilePaths();

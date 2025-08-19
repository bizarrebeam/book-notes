import pg from "pg";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * migration script untuk download dan convert images ke base64
 * 
 * fungsi script:
 * 1. cari semua books yang masih pakai openlibrary url atau default image
 * 2. download image dari openlibrary server
 * 3. convert image ke base64 format
 * 4. update database dengan base64 image
 * 5. skip books yang sudah ada base64 image (data:image format)
 * 6. retry failed downloads kalau script dijalankan ulang
 * 
 * cara pakai:
 * - jalankan: node migrate-images.js
 * - kalau ada yang gagal, jalanin lagi untuk retry
 * - script otomatis skip yang sudah berhasil
 */
async function migrateExistingImages() {
  try {
    await db.connect();
    await db.query('SET search_path TO BOOKS');
    
    console.log("fetching books that need image migration...");
    
    // get books yang butuh migration:
    // 1. masih pakai openlibrary url
    // 2. pakai default image (failed previous attempts)
    const result = await db.query(`
      SELECT book_id, title, isbn, cover_url 
      FROM books 
      WHERE cover_url LIKE 'https://covers.openlibrary.org%' 
         OR cover_url = '/assets/default.png'
      ORDER BY book_id
    `);
    
    console.log(`found ${result.rows.length} books to migrate`);
    
    if (result.rows.length === 0) {
      console.log("no books need migration. all images already converted to base64");
      return;
    }
    
    let successCount = 0;
    let failedCount = 0;
    const failedBooks = [];
    
    for (const book of result.rows) {
      console.log(`\nprocessing: ${book.title}`);
      console.log(`current cover_url: ${book.cover_url.substring(0, 60)}...`);
      
      try {
        // construct openlibrary url
        const imageUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;
        console.log(`downloading from: ${imageUrl}`);
        
        // download image dengan timeout
        const response = await axios.get(imageUrl, { 
          responseType: 'arraybuffer',
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; BookApp/1.0)'
          }
        });
        
        // check if response is valid image
        if (response.data.length < 1000) {
          throw new Error('image too small, probably not found');
        }
        
        // convert ke base64
        const imageBuffer = Buffer.from(response.data);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = response.headers['content-type'] || 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${base64Image}`;
        
        // update database
        await db.query(
          'UPDATE books SET cover_url = $1 WHERE book_id = $2',
          [dataUrl, book.book_id]
        );
        
        console.log(`success: ${book.title} (${Math.round(imageBuffer.length / 1024)}kb)`);
        successCount++;
        
        // delay untuk tidak overload server
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (err) {
        console.log(`failed: ${book.title} - ${err.message}`);
        failedBooks.push({ title: book.title, isbn: book.isbn, error: err.message });
        failedCount++;
        
        // set default image untuk failed downloads
        await db.query(
          'UPDATE books SET cover_url = $1 WHERE book_id = $2',
          ['/assets/default.png', book.book_id]
        );
        
        // delay before next attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // summary report
    console.log(`\n=== migration summary ===`);
    console.log(`total books processed: ${result.rows.length}`);
    console.log(`successful migrations: ${successCount}`);
    console.log(`failed migrations: ${failedCount}`);
    
    if (failedBooks.length > 0) {
      console.log(`\nfailed books (will use default image):`);
      failedBooks.forEach(book => {
        console.log(`- ${book.title} (${book.isbn}): ${book.error}`);
      });
      console.log(`\nto retry failed books, run this script again`);
    }
    
    // check final status
    console.log(`\nchecking final database state...`);
    const finalResult = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN cover_url LIKE 'data:image%' THEN 1 END) as base64_images,
        COUNT(CASE WHEN cover_url = '/assets/default.png' THEN 1 END) as default_images,
        COUNT(CASE WHEN cover_url LIKE 'https:%' THEN 1 END) as url_images
      FROM books
    `);
    
    const stats = finalResult.rows[0];
    console.log(`total books: ${stats.total}`);
    console.log(`base64 images: ${stats.base64_images}`);
    console.log(`default images: ${stats.default_images}`);
    console.log(`url images remaining: ${stats.url_images}`);
    
  } catch (err) {
    console.error("migration error:", err);
  } finally {
    await db.end();
    console.log("\ndatabase connection closed");
  }
}

migrateExistingImages();

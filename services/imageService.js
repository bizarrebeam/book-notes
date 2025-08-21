import axios from "axios";
import sharp from "sharp";

/**
 * download and optimize book cover image
 * @param {string} isbn - book isbn
 * @returns {Promise<string>} - base64 image data url or default image path
 */
export async function processBookCover(isbn) {
  if (!isbn || isbn.trim() === '') {
    console.warn('No ISBN provided for cover image');
    return "/assets/default.png";
  }

  const cleanIsbn = isbn.replace(/[-\s]/g, '');
  console.log(`Processing cover for cleaned ISBN: ${cleanIsbn}`);

  try {
   
    const imageUrl = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
    console.log(`Fetching cover image for ISBN ${cleanIsbn} from: ${imageUrl}`);
    
    const response = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      timeout: 15000, 
      validateStatus: function (status) {
        return status >= 200 && status < 300;
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BookShelfApp/1.0)',
        'Accept': 'image/*'
      }
    });
    
    console.log(`Downloaded cover image for ISBN ${cleanIsbn}: ${response.data.length} bytes, content-type: ${response.headers['content-type']}`);
    
    // Check if we actually got an image
    if (!response.data || response.data.length === 0) {
      console.warn(`Empty response for ISBN ${cleanIsbn}`);
      return "/assets/default.png";
    }
    
    // validate and optimize image with sharp
    let optimizedBuffer;
    try {
      optimizedBuffer = await sharp(response.data)
        .resize(300, 400, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ 
          quality: 60,
          progressive: true
        })
        .toBuffer();
        
      console.log(`Successfully processed image for ISBN ${cleanIsbn}: optimized to ${optimizedBuffer.length} bytes`);
    } catch (sharpErr) {
      console.error(`Sharp processing failed for ISBN ${cleanIsbn}:`, sharpErr.message);
      return "/assets/default.png";
    }
    
    // convert to base64
    const base64Image = optimizedBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;
    
    console.log(`Successfully created base64 image for ISBN ${cleanIsbn}: ${base64Image.length} chars`);
    return dataUrl;
    
  } catch (err) {
    console.error(`Failed to fetch/process cover image for ISBN ${cleanIsbn}:`, {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      statusText: err.response?.statusText,
      url: `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`
    });
    return "/assets/default.png";
  }
}

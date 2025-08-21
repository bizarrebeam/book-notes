import axios from "axios";
import sharp from "sharp";

/**
 * download and optimize book cover image
 * @param {string} isbn - book isbn
 * @returns {Promise<string>} - base64 image data url or default image path
 */
export async function processBookCover(isbn) {
  try {
    const imageUrl = `https://covers.openlibrary.org/b-isbn/${isbn}-L.jpg`;
    const response = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    // optimize image with sharp
    const optimizedBuffer = await sharp(response.data)
      .resize(300, 400, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ 
        quality: 60,
        progressive: true
      })
      .toBuffer();
    
    // convert to base64
    const base64Image = optimizedBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64Image}`;
    
  } catch (err) {
    console.warn(`failed to process cover image for isbn ${isbn}:`, err.message);
    return "/assets/default.png";
  }
}

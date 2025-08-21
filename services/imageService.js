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

  try {
    const imageUrl = `https://covers.openlibrary.org/b-isbn/${isbn}-L.jpg`;
    console.log(`Fetching cover image for ISBN ${isbn} from: ${imageUrl}`);
    
    const response = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      timeout: 10000,
      validateStatus: function (status) {
        return status >= 200 && status < 300; // default
      }
    });
    
    // check if we got a valid image (not a placeholder)
    if (response.data.length < 1000) {
      console.warn(`Cover image for ISBN ${isbn} is too small (${response.data.length} bytes), likely a placeholder`);
      return "/assets/default.png";
    }
    
    console.log(`Successfully downloaded cover image for ISBN ${isbn} (${response.data.length} bytes)`);
    
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
    console.log(`Successfully optimized cover image for ISBN ${isbn} (${base64Image.length} chars)`);
    return `data:image/jpeg;base64,${base64Image}`;
    
  } catch (err) {
    console.error(`Failed to process cover image for ISBN ${isbn}:`, {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText
    });
    return "/assets/default.png";
  }
}

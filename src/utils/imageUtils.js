/**
 * Resize an image to fit within maxSize x maxSize dimensions
 * @param {File|string} source - The image file or data URL to resize
 * @param {number} maxSize - Maximum width/height in pixels (default 400)
 * @returns {Promise<string>} - Base64 data URL of the resized image
 */
export function resizeImage(source, maxSize = 400) {
  return new Promise((resolve, reject) => {
    const processImage = (dataUrl) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with 80% quality
        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(resizedDataUrl);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = dataUrl;
    };

    // Check if source is already a data URL string
    if (typeof source === 'string') {
      processImage(source);
    } else {
      // It's a File, read it first
      const reader = new FileReader();

      reader.onload = (e) => {
        processImage(e.target.result);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(source);
    }
  });
}

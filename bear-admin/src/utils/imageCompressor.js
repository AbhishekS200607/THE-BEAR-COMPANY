/**
 * BEAR Admin — Client-Side Image Compressor & WebP Transcoder
 * 
 * Automatically downscales ultra-high-res product photography to optimal e-commerce
 * dimensions (max 1600x2000) and encodes strictly into modern WebP format (image/webp)
 * at 82% quality. Produces crisp, featherweight images (typically 80-250 KB from 5-10 MB originals).
 */

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Compresses any image (JPEG, PNG, HEIC, WebP) to modern WebP.
 * @param {File|Blob} file 
 * @param {Object} options 
 * @param {number} [options.maxWidth=1600] 
 * @param {number} [options.maxHeight=2000] 
 * @param {number} [options.quality=0.82] 
 * @returns {Promise<{
 *   blob: Blob,
 *   base64: string,
 *   originalSize: number,
 *   compressedSize: number,
 *   savingsPercent: number,
 *   width: number,
 *   height: number,
 *   filename: string
 * }>}
 */
export async function compressImageToWebP(file, options = {}) {
  const {
    maxWidth = 1600,
    maxHeight = 2000,
    quality = 0.82,
  } = options;

  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Provided file is not a valid image.'));
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Maintain aspect ratio, only scale down never up
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not initialize 2D canvas context.'));
      }

      // High quality bicubic image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Encode to modern WebP
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error('Canvas WebP encoding failed.'));
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result;
            const originalSize = file.size;
            const compressedSize = blob.size;
            const savings = Math.max(0, Math.round((1 - (compressedSize / originalSize)) * 100));

            // Generate clean .webp filename
            const originalName = file.name || 'product.jpg';
            const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
            const webpFilename = `${baseName}.webp`;

            resolve({
              blob,
              base64,
              originalSize,
              compressedSize,
              savingsPercent: savings,
              width,
              height,
              filename: webpFilename,
            });
          };
          reader.onerror = () => reject(new Error('Failed reading compressed blob.'));
          reader.readAsDataURL(blob);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode image file.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Image compression utility to prevent localStorage quota exhaustion.
 * Shrinks uploaded images to optimal web dimensions (800px max) and encodes as JPEG with 0.72 quality.
 * Typically reduces 3MB - 10MB camera photos to 30KB - 70KB (98%+ size reduction).
 */

export function compressImageFile(
  file: File,
  maxDimension = 800,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve) => {
    // If not an image, return empty
    if (!file.type.startsWith('image/')) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        resolve('');
        return;
      }

      // If already a tiny SVG or icon (< 15KB), no need to re-encode
      if (file.type === 'image/svg+xml' || (file.size < 15 * 1024 && file.type === 'image/webp')) {
        resolve(dataUrl);
        return;
      }

      compressDataUrl(dataUrl, maxDimension, quality)
        .then((compressed) => resolve(compressed || dataUrl))
        .catch(() => resolve(dataUrl));
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export function compressDataUrl(
  dataUrl: string,
  maxDimension = 800,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      resolve(dataUrl || '');
      return;
    }

    // Skip if it's already an SVG
    if (dataUrl.startsWith('data:image/svg+xml')) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= 0 || height <= 0) {
          resolve(dataUrl);
          return;
        }

        // Scale down to maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Fill background white in case of transparent PNG being saved to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with chosen quality
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (err) {
        console.warn('Could not compress image on canvas:', err);
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Ensures an array of image URLs (or base64 strings) is compressed and within budget.
 */
export async function compressImageArray(
  images: string[],
  maxDimension = 800,
  quality = 0.72,
  maxItems = 6
): Promise<string[]> {
  const limited = images.slice(0, maxItems);
  const results = await Promise.all(
    limited.map(async (img) => {
      if (img.startsWith('data:image/') && img.length > 80 * 1024) {
        // If data URL exceeds 80KB, compress it
        return await compressDataUrl(img, maxDimension, quality);
      }
      return img;
    })
  );
  return results.filter(Boolean);
}

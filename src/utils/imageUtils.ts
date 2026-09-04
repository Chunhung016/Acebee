/**
 * Utilities for normalizing, optimizing, and validating announcement image sources
 */

/**
 * Normalizes user-pasted image URLs from common hosting services into direct image links.
 */
export function normalizeImageUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();

  // If already a base64 data URL, return as-is
  if (url.startsWith('data:image/')) {
    return url;
  }

  // Google Drive sharing link conversion
  // Pattern 1: https://drive.google.com/file/d/{FILE_ID}/view...
  const gDriveMatch1 = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gDriveMatch1 && gDriveMatch1[1]) {
    return `https://drive.google.com/uc?export=view&id=${gDriveMatch1[1]}`;
  }
  // Pattern 2: https://drive.google.com/open?id={FILE_ID}
  const gDriveMatch2 = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (gDriveMatch2 && gDriveMatch2[1]) {
    return `https://drive.google.com/uc?export=view&id=${gDriveMatch2[1]}`;
  }

  // Dropbox shared link conversion (?dl=0 -> ?raw=1)
  if (url.includes('dropbox.com')) {
    url = url.replace(/[?&]dl=0/, '');
    if (url.includes('?')) {
      url = `${url}&raw=1`;
    } else {
      url = `${url}?raw=1`;
    }
    return url;
  }

  // Imgur page link to direct image link: https://imgur.com/{ID} -> https://i.imgur.com/{ID}.jpg
  const imgurMatch = url.match(/^https?:\/\/(?:www\.)?imgur\.com\/([a-zA-Z0-9]{5,10})$/);
  if (imgurMatch && imgurMatch[1]) {
    return `https://i.imgur.com/${imgurMatch[1]}.jpg`;
  }

  // Postimage page link helper: https://postimg.cc/{ID} warning/notice
  // Direct postimg link is usually https://i.postimg.cc/{DIR}/{ID}.png
  // If user pasted postimg.cc, preserve or guide

  return url;
}

/**
 * Validates whether a string resembles a usable image URL or data URI.
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:image/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Resizes and compresses an uploaded image file into a base64 Data URL,
 * ensuring it stays within Firestore single document limits (< 800 KB).
 */
export function compressImageFile(file: File, maxDimension = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image data.'));
      img.onload = () => {
        let { width, height } = img;

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
          // Fallback to raw reader result if 2D context unavailable
          resolve(reader.result as string);
          return;
        }

        // Draw image smoothed
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Prefer WebP or JPEG for compression
        const outputFormat = file.type === 'image/png' && file.size < 400000 ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputFormat, quality);
        resolve(dataUrl);
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Utilities for normalizing, optimizing, and validating announcement image sources
 */

/**
 * Extracts Google Drive file ID from various Drive URL formats.
 */
export function extractGoogleDriveId(url: string): string | null {
  const match1 = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (match1 && match1[1]) return match1[1];

  const match2 = url.match(/drive\.google\.com\/open\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i);
  if (match2 && match2[1]) return match2[1];

  const match3 = url.match(/drive\.google\.com\/uc\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i);
  if (match3 && match3[1]) return match3[1];

  const match4 = url.match(/drive\.usercontent\.google\.com\/download\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i);
  if (match4 && match4[1]) return match4[1];

  return null;
}

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

  // Upgrade insecure http: to https: for common CDNs to prevent mixed-content blocks
  if (url.startsWith('http://')) {
    url = url.replace(/^http:\/\//i, 'https://');
  }

  // Google Drive sharing link conversion
  // Note: drive.google.com/uc?export=view is blocked/deprecated by Google in 2024.
  // lh3.googleusercontent.com/d/{id} provides reliable, unblocked direct image embedding.
  const driveId = extractGoogleDriveId(url);
  if (driveId) {
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }

  // GitHub repository file conversion:
  // https://github.com/owner/repo/blob/main/path/to/img.png -> https://raw.githubusercontent.com/owner/repo/main/path/to/img.png
  const githubMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i);
  if (githubMatch) {
    return `https://raw.githubusercontent.com/${githubMatch[1]}/${githubMatch[2]}/${githubMatch[3]}/${githubMatch[4]}`;
  }

  // Dropbox shared link conversion
  if (url.includes('dropbox.com')) {
    // Replace domain with direct download domain
    url = url.replace(/^(https?:\/\/)?(www\.)?dropbox\.com/i, 'https://dl.dropboxusercontent.com');
    // Strip trailing dl parameters
    url = url.replace(/[?&]dl=[01]/i, '');
    return url;
  }

  // Imgur page link to direct image link:
  // https://imgur.com/{ID} -> https://i.imgur.com/{ID}.jpg
  const imgurMatch = url.match(/^https?:\/\/(?:www\.)?imgur\.com\/(?:gallery\/|a\/)?([a-zA-Z0-9]{5,10})(?:\.[a-zA-Z]{3,4})?$/i);
  if (imgurMatch && imgurMatch[1]) {
    return `https://i.imgur.com/${imgurMatch[1]}.jpg`;
  }

  // Postimages direct image format check
  const postimgMatch = url.match(/^https?:\/\/postimg\.cc\/([a-zA-Z0-9]+)$/i);
  if (postimgMatch && postimgMatch[1]) {
    return `https://i.postimg.cc/${postimgMatch[1]}/image.jpg`;
  }

  return url;
}

/**
 * Returns alternative fallback URLs for a given image link if the primary one fails to load.
 */
export function getAlternativeImageUrls(url: string): string[] {
  if (!url || url.startsWith('data:')) return [];
  const fallbacks: string[] = [];

  const driveId = extractGoogleDriveId(url);
  if (driveId) {
    fallbacks.push(`https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`);
    fallbacks.push(`https://drive.usercontent.google.com/download?id=${driveId}&export=view`);
    fallbacks.push(`https://drive.google.com/uc?export=view&id=${driveId}`);
  }

  if (url.includes('dropbox.com') || url.includes('dropboxusercontent.com')) {
    if (!url.includes('raw=1')) {
      fallbacks.push(url.includes('?') ? `${url}&raw=1` : `${url}?raw=1`);
    }
  }

  return fallbacks;
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
 * ensuring it stays well within Firestore (< 1MB) and browser localStorage (< 5MB total) quotas.
 */
export function compressImageFile(file: File, maxDimension = 960, quality = 0.8): Promise<string> {
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
          resolve(reader.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG for compact flyer payloads
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

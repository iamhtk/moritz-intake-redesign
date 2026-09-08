/**
 * Image utility functions for profile picture handling
 */

const MAX_IMAGE_SIZE_BYTES = 1024 * 1024; // 1MB
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates an image file for size and type
 */
export function validateImageFile(file: File): ImageValidationResult {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'invalidFormat',
    };
  }

  // Check file size
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'tooLarge',
    };
  }

  return { valid: true };
}

/**
 * Converts a File to a base64 data URI string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Gets the dimensions of an image file
 */
export function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Resizes and compresses an image to fit within size constraints
 * Returns a base64 data URI string
 */
export async function resizeAndCompressImage(
  file: File,
  maxSizeMB = 1,
  maxWidth = 512,
  maxHeight = 512,
): Promise<string> {
  const dimensions = await getImageDimensions(file);

  // Calculate new dimensions maintaining aspect ratio
  let { width, height } = dimensions;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Create canvas and draw resized image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const img = new Image();
  const imageUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      URL.revokeObjectURL(imageUrl);
      ctx.drawImage(img, 0, 0, width, height);

      // Try different quality settings to get under size limit
      let quality = 0.9;
      const maxBytes = maxSizeMB * 1024 * 1024;

      const tryCompress = () => {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Estimate size (base64 is ~33% larger than binary)
        const estimatedSize = (dataUrl.length * 3) / 4;

        if (estimatedSize <= maxBytes || quality <= 0.1) {
          resolve(dataUrl);
        } else {
          quality -= 0.1;
          tryCompress();
        }
      };

      tryCompress();
    };

    img.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error('Failed to load image for resizing'));
    };

    img.src = imageUrl;
  });
}

/**
 * Validates a base64 data URI string
 */
export function validateBase64Image(dataUri: string): ImageValidationResult {
  // Check if it's a valid data URI format
  if (!dataUri.startsWith('data:image/')) {
    return {
      valid: false,
      error: 'invalidFormat',
    };
  }

  // Estimate size from base64 length
  const base64Data = dataUri.split(',')[1];
  if (!base64Data) {
    return {
      valid: false,
      error: 'invalidFormat',
    };
  }

  const estimatedSize = (base64Data.length * 3) / 4;
  if (estimatedSize > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'tooLarge',
    };
  }

  return { valid: true };
}

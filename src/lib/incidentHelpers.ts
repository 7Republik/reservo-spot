import { supabase } from '@/integrations/supabase/client';

/**
 * Compresses an image file to target size < 500KB
 * Uses canvas API to resize and compress the image
 * 
 * @param file - The image file to compress
 * @param maxSizeKB - Maximum size in KB (default: 500)
 * @param maxWidth - Maximum width in pixels (default: 1920)
 * @param maxHeight - Maximum height in pixels (default: 1920)
 * @returns Promise<File> - Compressed image file
 */
export const compressImage = async (
  file: File,
  maxSizeKB: number = 500,
  maxWidth: number = 1920,
  maxHeight: number = 1920
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels to achieve target size
        const tryCompress = (quality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              
              const sizeKB = blob.size / 1024;
              
              // If size is acceptable or quality is already very low, use this version
              if (sizeKB <= maxSizeKB || quality <= 0.3) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                // Try again with lower quality
                tryCompress(quality - 0.1);
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        // Start with quality 0.9
        tryCompress(0.9);
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Sanitizes a license plate string by removing special characters and converting to uppercase
 * 
 * @param licensePlate - The license plate string to sanitize
 * @returns Sanitized license plate (uppercase, no special characters)
 */
export const sanitizeLicensePlate = (licensePlate: string): string => {
  // Remove all non-alphanumeric characters and convert to uppercase
  return licensePlate
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .trim();
};

/**
 * Validates if a file is a valid image type
 * 
 * @param file - The file to validate
 * @returns boolean - True if valid image type
 */
export const isValidImageType = (file: File): boolean => {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/heif',
  ];
  return validTypes.includes(file.type.toLowerCase());
};

/**
 * Validates if a file size is within the maximum allowed size
 * 
 * @param file - The file to validate
 * @param maxSizeMB - Maximum size in MB (default: 10)
 * @returns boolean - True if file size is valid
 */
export const isValidFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Uploads a photo to Supabase Storage incident-photos bucket
 * Automatically compresses the image before upload if needed
 * 
 * @param file - The image file to upload
 * @param userId - The user ID (for folder organization)
 * @param incidentId - The incident ID (for filename)
 * @returns Promise<string> - Storage path of the uploaded photo (not URL)
 * @throws Error if upload fails
 */
export const uploadIncidentPhoto = async (
  file: File,
  userId: string,
  incidentId: string
): Promise<string> => {
  try {
    // Validate file type
    if (!isValidImageType(file)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, or HEIC image.');
    }
    
    // Validate file size (max 10MB)
    if (!isValidFileSize(file, 10)) {
      throw new Error('File size exceeds 10MB limit.');
    }
    
    // Compress image if larger than 500KB
    let fileToUpload = file;
    const fileSizeKB = file.size / 1024;
    
    if (fileSizeKB > 500) {
      console.log(`Compressing image from ${fileSizeKB.toFixed(2)}KB...`);
      fileToUpload = await compressImage(file);
      console.log(`Compressed to ${(fileToUpload.size / 1024).toFixed(2)}KB`);
    }
    
    // Generate file path: {userId}/{incidentId}.jpg
    const fileExtension = fileToUpload.type === 'image/png' ? 'png' : 'jpg';
    const filePath = `${userId}/${incidentId}.${fileExtension}`;
    
    // Determine correct content type
    let contentType = 'image/jpeg';
    if (fileToUpload.type === 'image/png') {
      contentType = 'image/png';
    } else if (fileToUpload.type === 'image/heic' || fileToUpload.type === 'image/heif') {
      contentType = 'image/heic';
    }
    
    // WORKAROUND: Convert File to ArrayBuffer to avoid Supabase bug with File objects
    // When uploading File objects, Supabase incorrectly detects them as application/json
    // Converting to ArrayBuffer forces Supabase to respect the contentType parameter
    // See: https://github.com/orgs/supabase/discussions/34982
    const arrayBuffer = await fileToUpload.arrayBuffer();
    
    // Upload to Supabase Storage with explicit contentType
    const { data, error } = await supabase.storage
      .from('incident-photos')
      .upload(filePath, arrayBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: fileToUpload.type || 'image/jpeg',
      });
    
    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload photo: ${error.message}`);
    }
    
    // Return the storage path (not URL) - we'll generate signed URLs when needed
    return filePath;
  } catch (error) {
    console.error('Error uploading incident photo:', error);
    throw error;
  }
};

/**
 * Deletes a photo from Supabase Storage
 * Used when canceling an incident report
 * 
 * @param photoPath - The storage path of the photo to delete (e.g., "userId/incidentId.jpg")
 * @returns Promise<void>
 */
export const deleteIncidentPhoto = async (photoPath: string): Promise<void> => {
  try {
    // If it's a full URL, extract the path
    let filePath = photoPath;
    if (photoPath.startsWith('http')) {
      const url = new URL(photoPath);
      const pathParts = url.pathname.split('/incident-photos/');
      
      if (pathParts.length < 2) {
        throw new Error('Invalid photo URL');
      }
      
      filePath = pathParts[1];
    }
    
    // Delete from storage
    const { error } = await supabase.storage
      .from('incident-photos')
      .remove([filePath]);
    
    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Failed to delete photo: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting incident photo:', error);
    throw error;
  }
};

/**
 * Gets a signed URL for a private incident photo
 * Signed URLs expire after 1 hour
 * 
 * @param photoPath - The storage path of the photo (e.g., "userId/incidentId.jpg")
 * @returns Promise<string | null> - Signed URL or null if error
 */
export const getIncidentPhotoUrl = async (photoPath: string): Promise<string | null> => {
  try {
    if (!photoPath) return null;
    
    // If it's already a full URL, extract the path
    let filePath = photoPath;
    if (photoPath.startsWith('http')) {
      const url = new URL(photoPath);
      const pathParts = url.pathname.split('/incident-photos/');
      
      if (pathParts.length < 2) {
        console.error('Invalid photo URL format');
        return null;
      }
      
      filePath = pathParts[1];
    }
    
    // Generate signed URL (expires in 1 hour)
    const { data, error } = await supabase.storage
      .from('incident-photos')
      .createSignedUrl(filePath, 3600);
    
    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    
    return data?.signedUrl || null;
  } catch (error) {
    console.error('getIncidentPhotoUrl: Unexpected error:', error);
    return null;
  }
};

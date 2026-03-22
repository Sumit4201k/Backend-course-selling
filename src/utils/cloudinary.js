import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { promises as fsPromises } from 'fs';

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error(
    'Cloudinary credentials missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env'
  );
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a local file to Cloudinary and delete it from disk afterwards.
 *
 * @param {string} filePath - Absolute or relative path to the file on disk.
 * @param {string} folder - Cloudinary folder where the file should go.
 * @param {string} resourceType - 'image' | 'video' | etc.
 * @returns {Promise<object>} upload result from Cloudinary
 */
export const uploadLocalFile = async (filePath, folder, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: resourceType,
    });
    return result;
  } finally {
    // ensure local copy is removed regardless of success or failure
    try {
      await fsPromises.unlink(filePath);
    } catch (err) {
      console.error('Error deleting temp file', filePath, err);
    }
  }
};

/**
 * Convenience helper for uploading a Buffer directly (used by existing code if needed).
 */
export const uploadBuffer = async (buffer, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

export default cloudinary;

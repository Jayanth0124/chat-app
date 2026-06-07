import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const deleteFromCloudinary = async (mediaUrl) => {
  if (!mediaUrl || !mediaUrl.includes('cloudinary.com')) return;
  try {
    const parts = mediaUrl.split('/');
    const resourceType = parts[4];
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex !== -1) {
      const afterUpload = mediaUrl.substring(mediaUrl.indexOf('upload/') + 7);
      let pathWithoutVersion = afterUpload;
      if (pathWithoutVersion.match(/^v\d+\//)) {
        pathWithoutVersion = pathWithoutVersion.replace(/^v\d+\//, '');
      }
      const publicId = pathWithoutVersion.substring(0, pathWithoutVersion.lastIndexOf('.'));
      if (publicId && resourceType) {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      }
    }
  } catch (error) {
    console.error("Failed to delete from Cloudinary:", error);
  }
};

export default cloudinary;

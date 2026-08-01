import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

export const uploadImage = async (file, folder = "novashop") => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      transformation: [
        { width: 800, height: 800, crop: "limit" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (err) {
    console.error("Cloudinary upload failed:", err.message);
    return null;
  }
};

export const uploadMultiple = async (files, folder = "novashop") => {
  const results = await Promise.all(files.map(f => uploadImage(f, folder)));
  return results.filter(Boolean);
};

export const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch {
    return false;
  }
};

export default cloudinary;

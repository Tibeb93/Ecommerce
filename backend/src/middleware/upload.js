import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import os from "os";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error("Only image files (jpg, png, gif, webp) are allowed"));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const tmpDir = path.join(os.tmpdir(), "novashop-uploads");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

export const compressImage = async (buffer, options = {}) => {
  const { width = 800, height = 800, quality = 80 } = options;
  const filename = `compressed-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
  const outputPath = path.join(tmpDir, filename);
  await sharp(buffer)
    .resize(width, height, { fit: "inside", withoutEnlargement: true })
    .webp({ quality })
    .toFile(outputPath);
  return outputPath;
};

export const processUpload = async (file, folder = "novashop") => {
  const outputPath = await compressImage(file.buffer);
  const { uploadImage } = await import("../utils/cloudinary.js");
  const result = await uploadImage(outputPath, folder);
  try { fs.unlinkSync(outputPath); } catch {}
  return result;
};

export const processMultipleUploads = async (files, folder = "novashop") => {
  const results = await Promise.all(files.map(f => processUpload(f, folder)));
  return results.filter(Boolean);
};

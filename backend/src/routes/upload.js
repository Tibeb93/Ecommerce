import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import { upload, processUpload, processMultipleUploads } from "../middleware/upload.js";
import { deleteImage } from "../utils/cloudinary.js";

const router = express.Router();

router.post("/single", protect, upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  try {
    const folder = req.body.folder || "novashop";
    const result = await processUpload(req.file, folder);
    if (!result) return res.status(500).json({ message: "Upload failed" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message || "Upload failed" });
  }
});

router.post("/multiple", protect, upload.array("images", 10), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ message: "No files uploaded" });
  try {
    const folder = req.body.folder || "novashop";
    const results = await processMultipleUploads(req.files, folder);
    res.json({ images: results });
  } catch (err) {
    res.status(500).json({ message: err.message || "Upload failed" });
  }
});

router.delete("/:publicId", protect, adminOnly, async (req, res) => {
  const publicId = decodeURIComponent(req.params.publicId);
  const ok = await deleteImage(publicId);
  res.json({ message: ok ? "Image deleted" : "Delete failed" });
});

export default router;

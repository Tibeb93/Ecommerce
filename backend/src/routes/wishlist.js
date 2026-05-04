import express from "express";
import { protect } from "../middleware/auth.js";
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const entries = await Wishlist.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .populate({
      path: "productId",
      populate: { path: "categoryId", select: "name" }
    })
    .lean();
  const items = entries
    .map((e) => e.productId)
    .filter(Boolean)
    .map((p) => ({ ...p, id: p._id, category: p.categoryId?.name, categoryId: p.categoryId?._id }));
  res.json(items);
});

router.post("/:productId", protect, async (req, res) => {
  const productExists = await Product.exists({ _id: req.params.productId });
  if (!productExists) return res.status(404).json({ message: "Product not found" });
  try {
    await Wishlist.create({ userId: req.user.id, productId: req.params.productId });
    res.status(201).json({ message: "Added to wishlist" });
  } catch {
    res.status(409).json({ message: "Already in wishlist" });
  }
});

router.delete("/:productId", protect, async (req, res) => {
  await Wishlist.deleteOne({ userId: req.user.id, productId: req.params.productId });
  res.json({ message: "Removed from wishlist" });
});

export default router;

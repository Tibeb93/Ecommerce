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
    .map((p) => ({
      ...p,
      id: p._id,
      category: p.categoryId?.name,
      categoryId: p.categoryId?._id,
      stockStatus: p.stock === 0 ? "out" : p.stock <= 5 ? "low" : "in",
    }));
  res.json(items);
});

router.get("/count", protect, async (req, res) => {
  const count = await Wishlist.countDocuments({ userId: req.user.id });
  res.json({ count });
});

router.post("/:productId", protect, async (req, res) => {
  const productExists = await Product.exists({ _id: req.params.productId, isDeleted: { $ne: true } });
  if (!productExists) return res.status(404).json({ message: "Product not found" });
  try {
    await Wishlist.create({ userId: req.user.id, productId: req.params.productId });
    const count = await Wishlist.countDocuments({ userId: req.user.id });
    res.status(201).json({ message: "Added to wishlist", count });
  } catch {
    res.status(409).json({ message: "Already in wishlist" });
  }
});

router.delete("/:productId", protect, async (req, res) => {
  await Wishlist.deleteOne({ userId: req.user.id, productId: req.params.productId });
  const count = await Wishlist.countDocuments({ userId: req.user.id });
  res.json({ message: "Removed from wishlist", count });
});

router.delete("/", protect, async (req, res) => {
  await Wishlist.deleteMany({ userId: req.user.id });
  res.json({ message: "Wishlist cleared", count: 0 });
});

export default router;

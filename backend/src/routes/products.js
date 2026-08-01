import express from "express";
import { protect } from "../middleware/auth.js";
import { isNonEmptyString, toSafeTrimmed } from "../utils/validators.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Review from "../models/Review.js";
import User from "../models/User.js";

const router = express.Router();

const normalize = (p) => ({
  ...p,
  id: p._id,
  category: p.categoryId?.name,
  categoryId: p.categoryId?._id,
  brand: p.brand || "",
  salePrice: p.salePrice || 0,
  saleEnds: p.saleEnds || null,
});

router.get("/", async (req, res) => {
  const { q = "", category = "", sort = "newest", min = 0, max = 999999 } = req.query;

  const sortMap = { newest: { createdAt: -1 }, priceAsc: { price: 1 }, priceDesc: { price: -1 }, rating: { rating: -1 }, sales: { reviewsCount: -1 } };
  const filter = {
    isDeleted: { $ne: true },
    title: { $regex: String(q), $options: "i" },
    price: { $gte: Number(min), $lte: Number(max) }
  };

  if (category) {
    const categoryDoc = await Category.findOne({ name: { $regex: `^${category}$`, $options: "i" } }).select("_id").lean();
    if (!categoryDoc) return res.json([]);
    filter.categoryId = categoryDoc._id;
  }

  const products = await Product.find(filter)
    .populate("categoryId", "name")
    .sort(sortMap[sort] ?? sortMap.newest)
    .lean();

  res.json(products.map(normalize));
});

router.get("/featured", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 20);
  const products = await Product.find({ isDeleted: { $ne: true }, rating: { $gte: 4 } })
    .populate("categoryId", "name")
    .sort({ rating: -1, reviewsCount: -1 })
    .limit(limit)
    .lean();
  res.json(products.map(normalize));
});

router.get("/new", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 20);
  const products = await Product.find({ isDeleted: { $ne: true } })
    .populate("categoryId", "name")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  res.json(products.map(normalize));
});

router.get("/best-sellers", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 20);
  const products = await Product.find({ isDeleted: { $ne: true }, reviewsCount: { $gt: 0 } })
    .populate("categoryId", "name")
    .sort({ reviewsCount: -1 })
    .limit(limit)
    .lean();
  res.json(products.map(normalize));
});

router.get("/flash-deals", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 20);
  const products = await Product.find({
    isDeleted: { $ne: true },
    salePrice: { $gt: 0 },
    saleEnds: { $gt: new Date() },
  })
    .populate("categoryId", "name")
    .sort({ saleEnds: 1 })
    .limit(limit)
    .lean();
  res.json(products.map(normalize));
});

router.get("/brands", async (_, res) => {
  const brands = await Product.distinct("brand", { brand: { $ne: "" }, isDeleted: { $ne: true } });
  res.json(brands.sort());
});

router.get("/recently-viewed", async (req, res) => {
  const { ids } = req.query;
  if (!ids) return res.json([]);
  const idList = ids.split(",").filter(Boolean).slice(0, 12);
  const products = await Product.find({ _id: { $in: idList }, isDeleted: { $ne: true } }).lean();
  const ordered = idList.map(id => products.find(p => String(p._id) === id)).filter(Boolean);
  res.json(ordered.map(normalize));
});

router.get("/related/:id", async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).lean();
  if (!product) return res.json([]);
  const related = await Product.find({
    _id: { $ne: product._id },
    isDeleted: { $ne: true },
    $or: [
      { categoryId: product.categoryId },
      { brand: product.brand, brand: { $ne: "" } }
    ]
  }).limit(8).lean();
  res.json(related.map(normalize));
});

router.get("/:id", async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).populate("categoryId", "name").lean();
  if (!product) return res.status(404).json({ message: "Product not found" });

  const reviews = await Review.find({ productId: req.params.id }).sort({ createdAt: -1 }).lean();
  const userIds = reviews.map((r) => r.userId);
  const users = await User.find({ _id: { $in: userIds } }).select("_id name").lean();
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u.name]));
  const normalizedReviews = reviews.map((r) => ({ ...r, id: r._id, userName: userMap[String(r.userId)] || "User" }));

  res.json({
    ...product,
    id: product._id,
    category: product.categoryId?.name,
    categoryId: product.categoryId?._id,
    brand: product.brand || "",
    salePrice: product.salePrice || 0,
    saleEnds: product.saleEnds || null,
    reviews: normalizedReviews
  });
});

router.post("/:id/reviews", protect, async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || !comment) return res.status(400).json({ message: "Rating and comment are required" });
  const numericRating = Number(rating);
  const cleanComment = toSafeTrimmed(comment);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: "Rating must be an integer between 1 and 5" });
  }
  if (!isNonEmptyString(cleanComment, 5, 500)) {
    return res.status(400).json({ message: "Comment must be between 5 and 500 characters" });
  }
  const exists = await Product.findById(req.params.id).select("_id").lean();
  if (!exists) return res.status(404).json({ message: "Product not found" });

  try {
    await Review.create({
      userId: req.user.id,
      productId: req.params.id,
      rating: numericRating,
      comment: cleanComment
    });
  } catch {
    return res.status(409).json({ message: "You have already reviewed this product" });
  }

  const agg = await Review.aggregate([
    { $match: { productId: exists._id } },
    { $group: { _id: "$productId", rating: { $avg: "$rating" }, count: { $sum: 1 } } }
  ]);
  const avgRating = agg[0]?.rating ? Number(agg[0].rating.toFixed(1)) : 0;
  const count = agg[0]?.count ?? 0;

  await Product.findByIdAndUpdate(req.params.id, { rating: avgRating, reviewsCount: count });

  res.status(201).json({ message: "Review added" });
});

export default router;

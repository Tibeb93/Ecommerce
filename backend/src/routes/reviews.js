import express from "express";
import { protect } from "../middleware/auth.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

const router = express.Router();

const recalcRating = async (productId) => {
  const agg = await Review.aggregate([
    { $match: { productId: productId } },
    { $group: { _id: "$productId", rating: { $avg: "$rating" }, count: { $sum: 1 } } }
  ]);
  const avgRating = agg[0]?.rating ? Number(agg[0].rating.toFixed(1)) : 0;
  const count = agg[0]?.count ?? 0;
  await Product.findByIdAndUpdate(productId, { rating: avgRating, reviewsCount: count });
};

router.get("/recent", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 6, 20);
  const reviews = await Review.find().sort({ createdAt: -1 }).limit(limit).lean();
  const userIds = [...new Set(reviews.map((r) => String(r.userId)))];
  const productIds = [...new Set(reviews.map((r) => String(r.productId)))];
  const [users, products] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select("_id name").lean(),
    Product.find({ _id: { $in: productIds } }).select("_id title image").lean()
  ]);
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u.name]));
  const productMap = Object.fromEntries(products.map((p) => [String(p._id), { id: p._id, title: p.title, image: p.image }]));
  res.json(
    reviews.map((r) => ({
      id: r._id,
      rating: r.rating,
      comment: r.comment,
      images: r.images || [],
      userName: userMap[String(r.userId)] || "User",
      product: productMap[String(r.productId)] || null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))
  );
});

router.get("/product/:productId", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 10), 50);
  const sort = req.query.sort || "newest";

  let sortObj = { createdAt: -1 };
  if (sort === "highest") sortObj = { rating: -1, createdAt: -1 };
  else if (sort === "lowest") sortObj = { rating: 1, createdAt: -1 };
  else if (sort === "helpful") sortObj = { helpful: -1, createdAt: -1 };

  const total = await Review.countDocuments({ productId: req.params.productId });
  const reviews = await Review.find({ productId: req.params.productId })
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const userIds = [...new Set(reviews.map((r) => String(r.userId)))];
  const users = await User.find({ _id: { $in: userIds } }).select("_id name").lean();
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u.name]));

  const productOrders = await Order.find({
    productId: req.params.productId,
    userId: { $in: userIds },
    status: "Delivered"
  }).select("userId productId").lean();
  const verifiedSet = new Set(productOrders.map((o) => String(o.userId)));

  const agg = await Review.aggregate([
    { $match: { productId: reviews[0]?.productId } },
    { $group: { _id: "$rating", count: { $sum: 1 } } }
  ]);
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  agg.forEach((a) => { distribution[a._id] = a.count; });

  res.json({
    reviews: reviews.map((r) => ({
      id: r._id,
      rating: r.rating,
      comment: r.comment,
      images: r.images || [],
      helpful: r.helpful || 0,
      userName: userMap[String(r.userId)] || "User",
      isVerified: verifiedSet.has(String(r.userId)),
      isOwner: String(r.userId) === String(req.user?.id || ""),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    distribution,
    average: reviews.length ? Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)) : 0,
  });
});

router.post("/:productId", protect, async (req, res) => {
  const { rating, comment, images } = req.body;
  if (!rating || !comment) return res.status(400).json({ message: "Rating and comment are required" });
  const numericRating = Number(rating);
  const cleanComment = (comment || "").trim();
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: "Rating must be an integer between 1 and 5" });
  }
  if (cleanComment.length < 5 || cleanComment.length > 1000) {
    return res.status(400).json({ message: "Comment must be between 5 and 1000 characters" });
  }
  const exists = await Product.findById(req.params.productId).select("_id").lean();
  if (!exists) return res.status(404).json({ message: "Product not found" });

  try {
    await Review.create({
      userId: req.user.id,
      productId: req.params.productId,
      rating: numericRating,
      comment: cleanComment,
      images: Array.isArray(images) ? images.filter(Boolean).slice(0, 5) : [],
    });
  } catch {
    return res.status(409).json({ message: "You have already reviewed this product" });
  }

  await recalcRating(req.params.productId);
  res.status(201).json({ message: "Review added" });
});

router.put("/:id", protect, async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: "Review not found" });
  if (String(review.userId) !== String(req.user.id)) {
    return res.status(403).json({ message: "You can only edit your own reviews" });
  }

  const { rating, comment, images } = req.body;
  if (rating !== undefined) {
    const n = Number(rating);
    if (!Number.isInteger(n) || n < 1 || n > 5) return res.status(400).json({ message: "Rating must be 1-5" });
    review.rating = n;
  }
  if (comment !== undefined) {
    const c = comment.trim();
    if (c.length < 5 || c.length > 1000) return res.status(400).json({ message: "Comment must be 5-1000 characters" });
    review.comment = c;
  }
  if (images !== undefined) {
    review.images = Array.isArray(images) ? images.filter(Boolean).slice(0, 5) : [];
  }

  await review.save();
  await recalcRating(review.productId);
  res.json({ message: "Review updated" });
});

router.delete("/:id", protect, async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: "Review not found" });
  if (String(review.userId) !== String(req.user.id) && req.user.role !== "admin") {
    return res.status(403).json({ message: "Not authorized" });
  }
  const productId = review.productId;
  await review.deleteOne();
  await recalcRating(productId);
  res.json({ message: "Review deleted" });
});

router.post("/:id/helpful", protect, async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: "Review not found" });
  review.helpful = (review.helpful || 0) + 1;
  await review.save();
  res.json({ helpful: review.helpful });
});

export default router;

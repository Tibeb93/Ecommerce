import express from "express";
import Review from "../models/Review.js";
import User from "../models/User.js";
import Product from "../models/Product.js";

const router = express.Router();

router.get("/recent", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 6, 20);

  const reviews = await Review.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

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
      userName: userMap[String(r.userId)] || "User",
      product: productMap[String(r.productId)] || null,
      createdAt: r.createdAt
    }))
  );
});

export default router;

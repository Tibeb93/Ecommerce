import express from "express";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

const router = express.Router();

router.get("/", async (_, res) => {
  const categories = await Category.find().sort({ name: 1 }).select("_id name").lean();
  const counts = await Product.aggregate([
    { $group: { _id: "$categoryId", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  res.json(categories.map((c) => ({ id: c._id, name: c.name, count: countMap[String(c._id)] || 0 })));
});

export default router;
